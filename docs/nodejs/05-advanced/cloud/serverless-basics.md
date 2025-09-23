# Serverless基础

## 📖 概述

Serverless（无服务器）架构是一种云计算执行模型，开发者无需管理服务器基础设施，只需关注代码逻辑。云提供商负责动态分配和管理计算资源，按实际使用量计费。

## 🎯 学习目标

- 理解Serverless架构的核心概念
- 掌握Function as a Service (FaaS) 开发
- 学习Serverless应用设计模式
- 了解Serverless最佳实践和限制

## 📋 核心概念

### 1. Serverless架构特征

```javascript
// 传统架构 vs Serverless架构对比
const traditionalApp = {
  infrastructure: '需要管理服务器',
  scaling: '手动或预设扩缩容',
  billing: '按服务器运行时间计费',
  maintenance: '需要维护操作系统和运行时',
  availability: '需要自己处理高可用',
};

const serverlessApp = {
  infrastructure: '完全托管，无需管理',
  scaling: '自动扩缩容，按需分配',
  billing: '按实际执行时间和请求数计费',
  maintenance: '云提供商负责维护',
  availability: '内置高可用和容错',
};
```

### 2. FaaS函数特点

```javascript
// Serverless函数的基本结构
exports.handler = async (event, context) => {
  // 函数特点：
  // 1. 无状态 - 不保持状态信息
  // 2. 短暂 - 执行完即销毁
  // 3. 事件驱动 - 由事件触发执行
  // 4. 自动扩缩容 - 根据负载自动调整
  
  try {
    // 业务逻辑处理
    const result = await processBusinessLogic(event);
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(result),
    };
  } catch (error) {
    console.error('函数执行错误:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: '内部服务器错误',
        message: error.message,
      }),
    };
  }
};

async function processBusinessLogic(event) {
  // 解析请求数据
  const data = JSON.parse(event.body || '{}');
  
  // 执行业务逻辑
  return {
    message: '处理成功',
    timestamp: new Date().toISOString(),
    data,
  };
}
```

## 🏗️ Serverless架构模式

### 1. API网关 + 函数模式

```javascript
// API Gateway触发的HTTP函数
exports.apiHandler = async (event, context) => {
  const { httpMethod, path, queryStringParameters, body } = event;
  
  // 路由处理
  const router = {
    'GET /users': () => getUsers(queryStringParameters),
    'POST /users': () => createUser(JSON.parse(body)),
    'GET /users/{id}': () => getUser(event.pathParameters.id),
    'PUT /users/{id}': () => updateUser(event.pathParameters.id, JSON.parse(body)),
    'DELETE /users/{id}': () => deleteUser(event.pathParameters.id),
  };
  
  const routeKey = `${httpMethod} ${path}`;
  const handler = router[routeKey];
  
  if (!handler) {
    return {
      statusCode: 404,
      body: JSON.stringify({ error: '路由不存在' }),
    };
  }
  
  try {
    const result = await handler();
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};

// 用户管理函数
async function getUsers(queryParams) {
  // 连接数据库获取用户列表
  const limit = parseInt(queryParams?.limit) || 10;
  const offset = parseInt(queryParams?.offset) || 0;
  
  // 模拟数据库查询
  const users = await database.query(`
    SELECT * FROM users 
    LIMIT ${limit} OFFSET ${offset}
  `);
  
  return { users, total: users.length };
}

async function createUser(userData) {
  // 验证数据
  if (!userData.email || !userData.name) {
    throw new Error('邮箱和姓名是必填项');
  }
  
  // 创建用户
  const user = await database.insert('users', {
    ...userData,
    id: generateId(),
    createdAt: new Date().toISOString(),
  });
  
  return user;
}
```

### 2. 事件驱动模式

```javascript
// 消息队列触发的函数
exports.queueProcessor = async (event, context) => {
  // 处理队列消息
  for (const record of event.Records) {
    try {
      const message = JSON.parse(record.body);
      await processMessage(message);
      
      // 消息处理成功，自动确认
      console.log('消息处理成功:', record.messageId);
    } catch (error) {
      console.error('消息处理失败:', error);
      // 可以选择重新抛出错误进行重试
      throw error;
    }
  }
};

async function processMessage(message) {
  switch (message.type) {
    case 'user-registered':
      await sendWelcomeEmail(message.userId);
      break;
    case 'order-created':
      await processPayment(message.orderId);
      break;
    case 'file-uploaded':
      await processFile(message.fileKey);
      break;
    default:
      console.warn('未知消息类型:', message.type);
  }
}

// 文件上传触发的函数
exports.fileProcessor = async (event, context) => {
  for (const record of event.Records) {
    const bucket = record.s3.bucket.name;
    const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));
    
    console.log(`处理文件: ${bucket}/${key}`);
    
    try {
      // 根据文件类型进行不同处理
      if (key.match(/\.(jpg|jpeg|png|gif)$/i)) {
        await processImage(bucket, key);
      } else if (key.match(/\.(pdf|doc|docx)$/i)) {
        await processDocument(bucket, key);
      } else {
        console.log('不支持的文件类型');
      }
    } catch (error) {
      console.error('文件处理失败:', error);
      throw error;
    }
  }
};

async function processImage(bucket, key) {
  // 图像处理逻辑
  const imageData = await s3.getObject({ Bucket: bucket, Key: key }).promise();
  
  // 生成缩略图
  const thumbnail = await createThumbnail(imageData.Body);
  
  // 保存缩略图
  await s3.putObject({
    Bucket: bucket,
    Key: `thumbnails/${key}`,
    Body: thumbnail,
    ContentType: 'image/jpeg',
  }).promise();
  
  console.log('缩略图生成完成');
}
```

### 3. 定时任务模式

```javascript
// 定时触发的函数
exports.scheduledTask = async (event, context) => {
  console.log('定时任务开始执行:', new Date().toISOString());
  
  try {
    // 执行定时任务
    await Promise.all([
      cleanupExpiredData(),
      generateDailyReport(),
      sendNotifications(),
      backupDatabase(),
    ]);
    
    console.log('定时任务执行完成');
  } catch (error) {
    console.error('定时任务执行失败:', error);
    throw error;
  }
};

async function cleanupExpiredData() {
  // 清理过期数据
  const expiredDate = new Date();
  expiredDate.setDays(expiredDate.getDate() - 30);
  
  const deletedCount = await database.delete('temp_data', {
    createdAt: { $lt: expiredDate },
  });
  
  console.log(`清理了 ${deletedCount} 条过期数据`);
}

async function generateDailyReport() {
  // 生成日报
  const today = new Date().toISOString().split('T')[0];
  
  const stats = await database.aggregate('orders', [
    {
      $match: {
        createdAt: {
          $gte: new Date(today),
          $lt: new Date(today + 'T23:59:59.999Z'),
        },
      },
    },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalRevenue: { $sum: '$amount' },
      },
    },
  ]);
  
  // 发送报告邮件
  await sendEmail('admin@example.com', '日报', JSON.stringify(stats, null, 2));
}
```

## 🔄 状态管理

### 1. 外部状态存储

```javascript
// 使用数据库存储状态
const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

class ServerlessStateManager {
  constructor(tableName) {
    this.tableName = tableName;
  }

  // 获取状态
  async getState(key) {
    try {
      const result = await dynamodb.get({
        TableName: this.tableName,
        Key: { id: key },
      }).promise();
      
      return result.Item ? result.Item.data : null;
    } catch (error) {
      console.error('获取状态失败:', error);
      return null;
    }
  }

  // 设置状态
  async setState(key, data, ttl = null) {
    const item = {
      id: key,
      data,
      updatedAt: new Date().toISOString(),
    };
    
    if (ttl) {
      item.expiresAt = Math.floor(Date.now() / 1000) + ttl;
    }
    
    try {
      await dynamodb.put({
        TableName: this.tableName,
        Item: item,
      }).promise();
      
      return true;
    } catch (error) {
      console.error('设置状态失败:', error);
      return false;
    }
  }

  // 删除状态
  async deleteState(key) {
    try {
      await dynamodb.delete({
        TableName: this.tableName,
        Key: { id: key },
      }).promise();
      
      return true;
    } catch (error) {
      console.error('删除状态失败:', error);
      return false;
    }
  }
}

// 使用示例
const stateManager = new ServerlessStateManager('app-state');

exports.statefulHandler = async (event, context) => {
  const userId = event.requestContext.authorizer.userId;
  const sessionKey = `session:${userId}`;
  
  // 获取用户会话状态
  let session = await stateManager.getState(sessionKey);
  
  if (!session) {
    session = {
      userId,
      createdAt: new Date().toISOString(),
      requestCount: 0,
    };
  }
  
  // 更新会话状态
  session.requestCount++;
  session.lastRequestAt = new Date().toISOString();
  
  // 保存状态（30分钟TTL）
  await stateManager.setState(sessionKey, session, 1800);
  
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: '请求处理成功',
      session,
    }),
  };
};
```

### 2. 缓存策略

```javascript
// Redis缓存实现
const redis = require('redis');
const client = redis.createClient({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
});

class ServerlessCache {
  constructor() {
    this.client = client;
  }

  // 获取缓存
  async get(key) {
    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('获取缓存失败:', error);
      return null;
    }
  }

  // 设置缓存
  async set(key, value, ttl = 300) {
    try {
      await this.client.setex(key, ttl, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('设置缓存失败:', error);
      return false;
    }
  }

  // 删除缓存
  async del(key) {
    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      console.error('删除缓存失败:', error);
      return false;
    }
  }

  // 缓存装饰器
  cached(ttl = 300) {
    return (target, propertyName, descriptor) => {
      const method = descriptor.value;
      
      descriptor.value = async function(...args) {
        const cacheKey = `${target.constructor.name}:${propertyName}:${JSON.stringify(args)}`;
        
        // 尝试从缓存获取
        let result = await this.cache.get(cacheKey);
        
        if (result === null) {
          // 缓存未命中，执行原方法
          result = await method.apply(this, args);
          
          // 存入缓存
          await this.cache.set(cacheKey, result, ttl);
        }
        
        return result;
      };
    };
  }
}

// 使用缓存装饰器
class UserService {
  constructor() {
    this.cache = new ServerlessCache();
  }

  @cached(600) // 10分钟缓存
  async getUserById(userId) {
    // 模拟数据库查询
    const user = await database.findById('users', userId);
    return user;
  }
}
```

## 🔗 函数间通信

### 1. 异步消息传递

```javascript
// 使用消息队列进行函数间通信
const AWS = require('aws-sdk');
const sqs = new AWS.SQS();

class ServerlessMessaging {
  constructor() {
    this.queueUrl = process.env.SQS_QUEUE_URL;
  }

  // 发送消息
  async sendMessage(message, delaySeconds = 0) {
    const params = {
      QueueUrl: this.queueUrl,
      MessageBody: JSON.stringify(message),
      DelaySeconds: delaySeconds,
    };

    try {
      const result = await sqs.sendMessage(params).promise();
      return result.MessageId;
    } catch (error) {
      console.error('发送消息失败:', error);
      throw error;
    }
  }

  // 批量发送消息
  async sendBatchMessages(messages) {
    const entries = messages.map((message, index) => ({
      Id: index.toString(),
      MessageBody: JSON.stringify(message),
    }));

    const params = {
      QueueUrl: this.queueUrl,
      Entries: entries,
    };

    try {
      const result = await sqs.sendMessageBatch(params).promise();
      return result;
    } catch (error) {
      console.error('批量发送消息失败:', error);
      throw error;
    }
  }
}

// 订单处理函数
exports.createOrder = async (event, context) => {
  const messaging = new ServerlessMessaging();
  
  try {
    // 创建订单
    const orderData = JSON.parse(event.body);
    const order = await createOrderInDatabase(orderData);
    
    // 发送后续处理消息
    await Promise.all([
      // 发送支付处理消息
      messaging.sendMessage({
        type: 'process-payment',
        orderId: order.id,
        amount: order.total,
      }),
      
      // 发送库存更新消息
      messaging.sendMessage({
        type: 'update-inventory',
        items: order.items,
      }),
      
      // 发送通知消息（延迟5分钟）
      messaging.sendMessage({
        type: 'send-notification',
        userId: order.userId,
        orderId: order.id,
      }, 300),
    ]);
    
    return {
      statusCode: 201,
      body: JSON.stringify(order),
    };
  } catch (error) {
    console.error('创建订单失败:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
```

### 2. 直接函数调用

```javascript
// 使用Lambda直接调用其他函数
const AWS = require('aws-sdk');
const lambda = new AWS.Lambda();

class FunctionInvoker {
  // 同步调用函数
  async invokeSync(functionName, payload) {
    const params = {
      FunctionName: functionName,
      InvocationType: 'RequestResponse',
      Payload: JSON.stringify(payload),
    };

    try {
      const result = await lambda.invoke(params).promise();
      
      if (result.FunctionError) {
        throw new Error(`函数执行错误: ${result.FunctionError}`);
      }
      
      return JSON.parse(result.Payload);
    } catch (error) {
      console.error('同步调用函数失败:', error);
      throw error;
    }
  }

  // 异步调用函数
  async invokeAsync(functionName, payload) {
    const params = {
      FunctionName: functionName,
      InvocationType: 'Event',
      Payload: JSON.stringify(payload),
    };

    try {
      const result = await lambda.invoke(params).promise();
      return result.StatusCode === 202;
    } catch (error) {
      console.error('异步调用函数失败:', error);
      throw error;
    }
  }
}

// 主函数调用其他函数
exports.orchestrator = async (event, context) => {
  const invoker = new FunctionInvoker();
  
  try {
    const userData = JSON.parse(event.body);
    
    // 并行调用多个函数
    const [validationResult, enrichmentResult] = await Promise.all([
      invoker.invokeSync('validate-user-data', userData),
      invoker.invokeSync('enrich-user-data', userData),
    ]);
    
    if (!validationResult.isValid) {
      return {
        statusCode: 400,
        body: JSON.stringify({ errors: validationResult.errors }),
      };
    }
    
    // 合并数据
    const processedData = {
      ...userData,
      ...enrichmentResult.data,
    };
    
    // 异步调用存储函数
    await invoker.invokeAsync('store-user-data', processedData);
    
    return {
      statusCode: 200,
      body: JSON.stringify({ message: '用户数据处理成功' }),
    };
  } catch (error) {
    console.error('编排函数执行失败:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
```

## 🔐 安全最佳实践

### 1. 身份验证和授权

```javascript
// JWT令牌验证
const jwt = require('jsonwebtoken');

class ServerlessAuth {
  constructor() {
    this.jwtSecret = process.env.JWT_SECRET;
  }

  // 验证JWT令牌
  verifyToken(token) {
    try {
      return jwt.verify(token, this.jwtSecret);
    } catch (error) {
      throw new Error('无效的令牌');
    }
  }

  // 从事件中提取用户信息
  extractUser(event) {
    const authHeader = event.headers.Authorization || event.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('缺少认证令牌');
    }
    
    const token = authHeader.substring(7);
    return this.verifyToken(token);
  }

  // 检查权限
  checkPermission(user, requiredPermission) {
    if (!user.permissions || !user.permissions.includes(requiredPermission)) {
      throw new Error('权限不足');
    }
  }
}

// 认证中间件
function withAuth(requiredPermission = null) {
  return function(handler) {
    return async (event, context) => {
      const auth = new ServerlessAuth();
      
      try {
        // 验证用户身份
        const user = auth.extractUser(event);
        
        // 检查权限
        if (requiredPermission) {
          auth.checkPermission(user, requiredPermission);
        }
        
        // 将用户信息添加到事件中
        event.user = user;
        
        // 执行原处理函数
        return await handler(event, context);
      } catch (error) {
        return {
          statusCode: 401,
          body: JSON.stringify({ error: error.message }),
        };
      }
    };
  };
}

// 使用认证中间件
exports.protectedHandler = withAuth('user:read')(async (event, context) => {
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: '认证成功',
      user: event.user,
    }),
  };
});
```

### 2. 输入验证和清理

```javascript
// 输入验证工具
const Joi = require('joi');

class InputValidator {
  // 验证用户数据
  static validateUserData(data) {
    const schema = Joi.object({
      name: Joi.string().min(2).max(50).required(),
      email: Joi.string().email().required(),
      age: Joi.number().integer().min(18).max(120),
      phone: Joi.string().pattern(/^\d{10,15}$/),
    });

    const { error, value } = schema.validate(data);
    
    if (error) {
      throw new Error(`数据验证失败: ${error.details[0].message}`);
    }
    
    return value;
  }

  // 清理HTML内容
  static sanitizeHtml(html) {
    const createDOMPurify = require('isomorphic-dompurify');
    const DOMPurify = createDOMPurify();
    
    return DOMPurify.sanitize(html);
  }

  // 验证和清理中间件
  static validate(schema) {
    return function(handler) {
      return async (event, context) => {
        try {
          const data = JSON.parse(event.body || '{}');
          const { error, value } = schema.validate(data);
          
          if (error) {
            return {
              statusCode: 400,
              body: JSON.stringify({
                error: '数据验证失败',
                details: error.details,
              }),
            };
          }
          
          event.validatedData = value;
          return await handler(event, context);
        } catch (parseError) {
          return {
            statusCode: 400,
            body: JSON.stringify({ error: '无效的JSON数据' }),
          };
        }
      };
    };
  }
}

// 使用验证中间件
const userSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
});

exports.createUser = InputValidator.validate(userSchema)(async (event, context) => {
  const userData = event.validatedData;
  
  // 处理已验证的数据
  const user = await createUserInDatabase(userData);
  
  return {
    statusCode: 201,
    body: JSON.stringify(user),
  };
});
```

## 📊 监控和调试

### 1. 日志记录

```javascript
// 结构化日志记录
class ServerlessLogger {
  constructor(context) {
    this.requestId = context.awsRequestId;
    this.functionName = context.functionName;
  }

  log(level, message, metadata = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      requestId: this.requestId,
      functionName: this.functionName,
      ...metadata,
    };

    console.log(JSON.stringify(logEntry));
  }

  info(message, metadata) {
    this.log('INFO', message, metadata);
  }

  warn(message, metadata) {
    this.log('WARN', message, metadata);
  }

  error(message, metadata) {
    this.log('ERROR', message, metadata);
  }

  debug(message, metadata) {
    this.log('DEBUG', message, metadata);
  }
}

// 使用日志记录
exports.loggedHandler = async (event, context) => {
  const logger = new ServerlessLogger(context);
  
  logger.info('函数开始执行', {
    httpMethod: event.httpMethod,
    path: event.path,
  });

  try {
    const result = await processRequest(event);
    
    logger.info('函数执行成功', {
      statusCode: 200,
      resultSize: JSON.stringify(result).length,
    });

    return {
      statusCode: 200,
      body: JSON.stringify(result),
    };
  } catch (error) {
    logger.error('函数执行失败', {
      error: error.message,
      stack: error.stack,
    });

    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
```

### 2. 性能监控

```javascript
// 性能监控工具
class PerformanceMonitor {
  constructor() {
    this.metrics = {};
  }

  // 开始计时
  startTimer(name) {
    this.metrics[name] = {
      startTime: Date.now(),
    };
  }

  // 结束计时
  endTimer(name) {
    if (this.metrics[name]) {
      this.metrics[name].duration = Date.now() - this.metrics[name].startTime;
      return this.metrics[name].duration;
    }
    return 0;
  }

  // 记录内存使用
  recordMemoryUsage(name) {
    const memUsage = process.memoryUsage();
    this.metrics[name] = {
      ...this.metrics[name],
      memoryUsage: {
        rss: memUsage.rss,
        heapUsed: memUsage.heapUsed,
        heapTotal: memUsage.heapTotal,
        external: memUsage.external,
      },
    };
  }

  // 获取所有指标
  getMetrics() {
    return this.metrics;
  }

  // 监控装饰器
  monitor(name) {
    return function(target, propertyName, descriptor) {
      const method = descriptor.value;
      
      descriptor.value = async function(...args) {
        const monitor = new PerformanceMonitor();
        
        monitor.startTimer(name);
        monitor.recordMemoryUsage(`${name}_start`);
        
        try {
          const result = await method.apply(this, args);
          
          monitor.endTimer(name);
          monitor.recordMemoryUsage(`${name}_end`);
          
          console.log('性能指标:', monitor.getMetrics());
          
          return result;
        } catch (error) {
          monitor.endTimer(name);
          monitor.recordMemoryUsage(`${name}_error`);
          
          console.log('性能指标(错误):', monitor.getMetrics());
          throw error;
        }
      };
    };
  }
}

// 使用性能监控
class DatabaseService {
  @PerformanceMonitor.prototype.monitor('database_query')
  async query(sql, params) {
    // 数据库查询逻辑
    return await executeQuery(sql, params);
  }
}
```

## 🚀 实际应用示例

### 完整的Serverless应用

```javascript
// serverless.yml 配置文件示例
/*
service: serverless-blog-api

provider:
  name: aws
  runtime: nodejs14.x
  stage: ${opt:stage, 'dev'}
  region: us-east-1
  environment:
    DYNAMODB_TABLE: ${self:service}-${opt:stage, self:provider.stage}
    JWT_SECRET: ${env:JWT_SECRET}

functions:
  authHandler:
    handler: src/auth.handler
    events:
      - http:
          path: /auth/login
          method: post
          cors: true

  postsHandler:
    handler: src/posts.handler
    events:
      - http:
          path: /posts
          method: get
          cors: true
      - http:
          path: /posts
          method: post
          cors: true
      - http:
          path: /posts/{id}
          method: get
          cors: true

  fileProcessor:
    handler: src/fileProcessor.handler
    events:
      - s3:
          bucket: ${self:service}-${opt:stage}-uploads
          event: s3:ObjectCreated:*

resources:
  Resources:
    PostsTable:
      Type: AWS::DynamoDB::Table
      Properties:
        TableName: ${self:provider.environment.DYNAMODB_TABLE}
        AttributeDefinitions:
          - AttributeName: id
            AttributeType: S
        KeySchema:
          - AttributeName: id
            KeyType: HASH
        BillingMode: PAY_PER_REQUEST
*/

// 博客API实现
const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

const dynamodb = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = process.env.DYNAMODB_TABLE;

class BlogService {
  // 获取所有文章
  async getAllPosts() {
    const params = {
      TableName: TABLE_NAME,
      FilterExpression: '#status = :status',
      ExpressionAttributeNames: {
        '#status': 'status',
      },
      ExpressionAttributeValues: {
        ':status': 'published',
      },
    };

    const result = await dynamodb.scan(params).promise();
    return result.Items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  // 获取单篇文章
  async getPost(id) {
    const params = {
      TableName: TABLE_NAME,
      Key: { id },
    };

    const result = await dynamodb.get(params).promise();
    return result.Item;
  }

  // 创建文章
  async createPost(postData, authorId) {
    const post = {
      id: uuidv4(),
      ...postData,
      authorId,
      status: 'published',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const params = {
      TableName: TABLE_NAME,
      Item: post,
    };

    await dynamodb.put(params).promise();
    return post;
  }

  // 更新文章
  async updatePost(id, updates, authorId) {
    const params = {
      TableName: TABLE_NAME,
      Key: { id },
      UpdateExpression: 'SET #title = :title, #content = :content, #updatedAt = :updatedAt',
      ConditionExpression: 'authorId = :authorId',
      ExpressionAttributeNames: {
        '#title': 'title',
        '#content': 'content',
        '#updatedAt': 'updatedAt',
      },
      ExpressionAttributeValues: {
        ':title': updates.title,
        ':content': updates.content,
        ':updatedAt': new Date().toISOString(),
        ':authorId': authorId,
      },
      ReturnValues: 'ALL_NEW',
    };

    const result = await dynamodb.update(params).promise();
    return result.Attributes;
  }
}

// API处理函数
const blogService = new BlogService();

exports.handler = async (event, context) => {
  const logger = new ServerlessLogger(context);
  const auth = new ServerlessAuth();

  try {
    const { httpMethod, pathParameters } = event;
    
    logger.info('API请求', {
      method: httpMethod,
      path: event.path,
    });

    switch (httpMethod) {
      case 'GET':
        if (pathParameters && pathParameters.id) {
          const post = await blogService.getPost(pathParameters.id);
          return {
            statusCode: post ? 200 : 404,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(post || { error: '文章不存在' }),
          };
        } else {
          const posts = await blogService.getAllPosts();
          return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(posts),
          };
        }

      case 'POST':
        const user = auth.extractUser(event);
        const postData = JSON.parse(event.body);
        
        const newPost = await blogService.createPost(postData, user.id);
        
        return {
          statusCode: 201,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newPost),
        };

      default:
        return {
          statusCode: 405,
          body: JSON.stringify({ error: '方法不允许' }),
        };
    }
  } catch (error) {
    logger.error('API错误', {
      error: error.message,
      stack: error.stack,
    });

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message }),
    };
  }
};
```

## 📚 最佳实践总结

1. **函数设计**：保持函数小而专一，单一职责
2. **冷启动优化**：最小化依赖，使用连接池
3. **错误处理**：实现优雅的错误处理和重试机制
4. **安全性**：验证输入，使用最小权限原则
5. **监控**：实现全面的日志记录和监控
6. **成本优化**：合理设置内存和超时时间
7. **测试**：编写单元测试和集成测试

通过掌握这些Serverless基础知识和最佳实践，您将能够构建高效、可扩展的无服务器应用程序。
