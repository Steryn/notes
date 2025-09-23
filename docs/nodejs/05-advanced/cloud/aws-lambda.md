# AWS Lambda

## 📖 概述

AWS Lambda 是亚马逊提供的无服务器计算服务，让您无需预置或管理服务器即可运行代码。Lambda 自动管理计算资源，按实际使用量计费，支持多种编程语言包括 Node.js。

## 🎯 学习目标

- 掌握 AWS Lambda 的核心概念
- 学习 Lambda 函数的创建和部署
- 了解事件驱动架构
- 掌握 Lambda 性能优化技巧

## 🚀 快速开始

### 1. 创建第一个 Lambda 函数

```javascript
// hello-world.js
exports.handler = async (event, context) => {
    console.log('Event:', JSON.stringify(event, null, 2));
    console.log('Context:', JSON.stringify(context, null, 2));
    
    const response = {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
            message: 'Hello from Lambda!',
            timestamp: new Date().toISOString(),
            requestId: context.awsRequestId
        })
    };
    
    return response;
};
```

### 2. 部署配置

```yaml
# serverless.yml
service: my-lambda-service

provider:
  name: aws
  runtime: nodejs18.x
  stage: ${opt:stage, 'dev'}
  region: us-east-1
  memorySize: 128
  timeout: 30
  
functions:
  hello:
    handler: hello-world.handler
    events:
      - http:
          path: hello
          method: get
          cors: true
```

## 📋 Lambda 函数结构

### 1. 处理程序签名

```javascript
// 基本处理程序
exports.handler = async (event, context, callback) => {
    // event: 触发事件的数据
    // context: 运行时信息
    // callback: 可选的回调函数（推荐使用 async/await）
    
    try {
        const result = await processEvent(event);
        return result;
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
};

// 同步处理程序（不推荐）
exports.syncHandler = (event, context, callback) => {
    const response = {
        statusCode: 200,
        body: JSON.stringify({ message: 'Sync response' })
    };
    
    callback(null, response);
};
```

### 2. Context 对象

```javascript
exports.handler = async (event, context) => {
    // Context 对象包含运行时信息
    console.log('Function name:', context.functionName);
    console.log('Function version:', context.functionVersion);
    console.log('Request ID:', context.awsRequestId);
    console.log('Memory limit:', context.memoryLimitInMB);
    console.log('Time remaining:', context.getRemainingTimeInMillis());
    
    // 获取调用者身份（如果有）
    if (context.identity) {
        console.log('Caller identity:', context.identity);
    }
    
    // 客户端上下文（移动应用）
    if (context.clientContext) {
        console.log('Client context:', context.clientContext);
    }
    
    return {
        statusCode: 200,
        body: JSON.stringify({
            functionName: context.functionName,
            remainingTime: context.getRemainingTimeInMillis()
        })
    };
};
```

## 🔗 事件源集成

### 1. API Gateway 集成

```javascript
// API Gateway 事件处理
exports.apiHandler = async (event, context) => {
    const { 
        httpMethod, 
        path, 
        pathParameters, 
        queryStringParameters, 
        headers, 
        body 
    } = event;
    
    console.log(`${httpMethod} ${path}`);
    
    try {
        // 路由处理
        switch (httpMethod) {
            case 'GET':
                return await handleGet(pathParameters, queryStringParameters);
            case 'POST':
                return await handlePost(JSON.parse(body || '{}'));
            case 'PUT':
                return await handlePut(pathParameters, JSON.parse(body || '{}'));
            case 'DELETE':
                return await handleDelete(pathParameters);
            default:
                return {
                    statusCode: 405,
                    body: JSON.stringify({ error: 'Method not allowed' })
                };
        }
    } catch (error) {
        console.error('API Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ 
                error: 'Internal server error',
                message: error.message 
            })
        };
    }
};

async function handleGet(pathParams, queryParams) {
    if (pathParams && pathParams.id) {
        // 获取单个资源
        const item = await getItemById(pathParams.id);
        return {
            statusCode: item ? 200 : 404,
            body: JSON.stringify(item || { error: 'Item not found' })
        };
    } else {
        // 获取资源列表
        const items = await getItems(queryParams);
        return {
            statusCode: 200,
            body: JSON.stringify(items)
        };
    }
}

async function handlePost(data) {
    // 创建新资源
    const newItem = await createItem(data);
    return {
        statusCode: 201,
        body: JSON.stringify(newItem)
    };
}
```

### 2. S3 事件处理

```javascript
// S3 事件处理
const AWS = require('aws-sdk');
const s3 = new AWS.S3();

exports.s3Handler = async (event, context) => {
    for (const record of event.Records) {
        const bucket = record.s3.bucket.name;
        const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));
        const eventName = record.eventName;
        
        console.log(`Processing ${eventName} for ${bucket}/${key}`);
        
        try {
            switch (eventName) {
                case 'ObjectCreated:Put':
                case 'ObjectCreated:Post':
                    await handleObjectCreated(bucket, key);
                    break;
                case 'ObjectRemoved:Delete':
                    await handleObjectDeleted(bucket, key);
                    break;
                default:
                    console.log(`Unhandled event: ${eventName}`);
            }
        } catch (error) {
            console.error(`Error processing ${bucket}/${key}:`, error);
            throw error;
        }
    }
};

async function handleObjectCreated(bucket, key) {
    // 获取对象信息
    const headResult = await s3.headObject({ Bucket: bucket, Key: key }).promise();
    console.log('Object metadata:', headResult.Metadata);
    
    // 根据文件类型进行处理
    const contentType = headResult.ContentType;
    
    if (contentType.startsWith('image/')) {
        await processImage(bucket, key);
    } else if (contentType === 'application/json') {
        await processJsonFile(bucket, key);
    } else {
        console.log(`Unsupported content type: ${contentType}`);
    }
}

async function processImage(bucket, key) {
    // 图像处理逻辑
    const imageData = await s3.getObject({ Bucket: bucket, Key: key }).promise();
    
    // 这里可以集成图像处理库，如 Sharp
    // const sharp = require('sharp');
    // const thumbnail = await sharp(imageData.Body)
    //     .resize(200, 200)
    //     .jpeg({ quality: 80 })
    //     .toBuffer();
    
    // 保存缩略图
    // await s3.putObject({
    //     Bucket: bucket,
    //     Key: `thumbnails/${key}`,
    //     Body: thumbnail,
    //     ContentType: 'image/jpeg'
    // }).promise();
    
    console.log(`Image processed: ${key}`);
}
```

### 3. DynamoDB 流处理

```javascript
// DynamoDB Streams 事件处理
exports.dynamoHandler = async (event, context) => {
    for (const record of event.Records) {
        const { eventName, dynamodb } = record;
        
        console.log(`Processing ${eventName} event`);
        
        try {
            switch (eventName) {
                case 'INSERT':
                    await handleInsert(dynamodb.NewImage);
                    break;
                case 'MODIFY':
                    await handleModify(dynamodb.OldImage, dynamodb.NewImage);
                    break;
                case 'REMOVE':
                    await handleRemove(dynamodb.OldImage);
                    break;
                default:
                    console.log(`Unhandled event: ${eventName}`);
            }
        } catch (error) {
            console.error(`Error processing ${eventName} event:`, error);
            throw error;
        }
    }
};

async function handleInsert(newImage) {
    // 处理新记录插入
    const item = AWS.DynamoDB.Converter.unmarshall(newImage);
    console.log('New item inserted:', item);
    
    // 发送通知或触发其他操作
    await sendNotification('Item created', item);
}

async function handleModify(oldImage, newImage) {
    // 处理记录修改
    const oldItem = AWS.DynamoDB.Converter.unmarshall(oldImage);
    const newItem = AWS.DynamoDB.Converter.unmarshall(newImage);
    
    console.log('Item modified:', { old: oldItem, new: newItem });
    
    // 检查特定字段的变化
    if (oldItem.status !== newItem.status) {
        await handleStatusChange(newItem, oldItem.status, newItem.status);
    }
}
```

### 4. SQS 消息处理

```javascript
// SQS 消息处理
exports.sqsHandler = async (event, context) => {
    const processedMessages = [];
    const failedMessages = [];
    
    for (const record of event.Records) {
        try {
            const message = JSON.parse(record.body);
            const result = await processMessage(message);
            
            processedMessages.push({
                messageId: record.messageId,
                result
            });
        } catch (error) {
            console.error(`Failed to process message ${record.messageId}:`, error);
            failedMessages.push({
                messageId: record.messageId,
                error: error.message
            });
        }
    }
    
    // 返回处理结果
    return {
        batchItemFailures: failedMessages.map(msg => ({
            itemIdentifier: msg.messageId
        }))
    };
};

async function processMessage(message) {
    console.log('Processing message:', message);
    
    switch (message.type) {
        case 'user-registration':
            return await handleUserRegistration(message.data);
        case 'order-processing':
            return await handleOrderProcessing(message.data);
        case 'email-notification':
            return await handleEmailNotification(message.data);
        default:
            throw new Error(`Unknown message type: ${message.type}`);
    }
}

async function handleUserRegistration(userData) {
    // 用户注册处理逻辑
    console.log('Processing user registration:', userData);
    
    // 发送欢迎邮件
    await sendWelcomeEmail(userData.email, userData.name);
    
    // 创建用户配置文件
    await createUserProfile(userData);
    
    return { status: 'completed', userId: userData.id };
}
```

## 🔧 高级功能

### 1. 层 (Layers) 使用

```javascript
// 创建共享层
// layer/nodejs/node_modules/utils/index.js
exports.logger = require('./logger');
exports.database = require('./database');
exports.auth = require('./auth');

// layer/nodejs/node_modules/utils/logger.js
class Logger {
    constructor(context) {
        this.requestId = context.awsRequestId;
        this.functionName = context.functionName;
    }
    
    log(level, message, meta = {}) {
        console.log(JSON.stringify({
            timestamp: new Date().toISOString(),
            level,
            message,
            requestId: this.requestId,
            functionName: this.functionName,
            ...meta
        }));
    }
    
    info(message, meta) { this.log('INFO', message, meta); }
    error(message, meta) { this.log('ERROR', message, meta); }
    warn(message, meta) { this.log('WARN', message, meta); }
}

module.exports = Logger;

// 在 Lambda 函数中使用层
const { logger: Logger, database, auth } = require('utils');

exports.handler = async (event, context) => {
    const logger = new Logger(context);
    
    logger.info('Function started', { event });
    
    try {
        // 使用共享的数据库连接
        const db = await database.connect();
        
        // 使用共享的认证逻辑
        const user = await auth.validateToken(event.headers.Authorization);
        
        const result = await processRequest(event, user, db);
        
        logger.info('Function completed successfully');
        return result;
    } catch (error) {
        logger.error('Function failed', { error: error.message });
        throw error;
    }
};
```

### 2. 环境变量和配置

```javascript
// 环境变量管理
class Config {
    constructor() {
        this.env = process.env.NODE_ENV || 'development';
        this.region = process.env.AWS_REGION;
        this.stage = process.env.STAGE || 'dev';
        
        // 数据库配置
        this.database = {
            host: process.env.DB_HOST,
            port: parseInt(process.env.DB_PORT) || 5432,
            name: process.env.DB_NAME,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD
        };
        
        // 外部服务配置
        this.services = {
            s3Bucket: process.env.S3_BUCKET,
            sqsQueueUrl: process.env.SQS_QUEUE_URL,
            snsTopicArn: process.env.SNS_TOPIC_ARN
        };
        
        // 应用配置
        this.app = {
            jwtSecret: process.env.JWT_SECRET,
            apiKey: process.env.API_KEY,
            logLevel: process.env.LOG_LEVEL || 'info'
        };
    }
    
    validate() {
        const required = [
            'DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD',
            'S3_BUCKET', 'JWT_SECRET'
        ];
        
        const missing = required.filter(key => !process.env[key]);
        
        if (missing.length > 0) {
            throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
        }
    }
    
    isDevelopment() {
        return this.env === 'development';
    }
    
    isProduction() {
        return this.env === 'production';
    }
}

// 使用配置
const config = new Config();

exports.handler = async (event, context) => {
    try {
        config.validate();
        
        if (config.isDevelopment()) {
            console.log('Running in development mode');
        }
        
        // 使用配置
        const dbConnection = await connectToDatabase(config.database);
        const s3Client = new AWS.S3({ region: config.region });
        
        // 处理请求
        const result = await processRequest(event, { dbConnection, s3Client, config });
        
        return result;
    } catch (error) {
        console.error('Configuration error:', error);
        throw error;
    }
};
```

### 3. 错误处理和重试

```javascript
// 错误处理工具类
class LambdaError extends Error {
    constructor(message, statusCode = 500, isRetryable = false) {
        super(message);
        this.name = 'LambdaError';
        this.statusCode = statusCode;
        this.isRetryable = isRetryable;
    }
}

class RetryableError extends LambdaError {
    constructor(message, statusCode = 500) {
        super(message, statusCode, true);
        this.name = 'RetryableError';
    }
}

// 重试装饰器
function withRetry(maxRetries = 3, backoffMs = 1000) {
    return function(target, propertyName, descriptor) {
        const method = descriptor.value;
        
        descriptor.value = async function(...args) {
            let lastError;
            
            for (let attempt = 1; attempt <= maxRetries; attempt++) {
                try {
                    return await method.apply(this, args);
                } catch (error) {
                    lastError = error;
                    
                    if (!error.isRetryable || attempt === maxRetries) {
                        throw error;
                    }
                    
                    const delay = backoffMs * Math.pow(2, attempt - 1);
                    console.log(`Attempt ${attempt} failed, retrying in ${delay}ms`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
            
            throw lastError;
        };
    };
}

// 错误处理中间件
function withErrorHandling(handler) {
    return async (event, context) => {
        try {
            return await handler(event, context);
        } catch (error) {
            console.error('Lambda error:', {
                error: error.message,
                stack: error.stack,
                event,
                context: {
                    requestId: context.awsRequestId,
                    functionName: context.functionName
                }
            });
            
            if (error instanceof LambdaError) {
                return {
                    statusCode: error.statusCode,
                    body: JSON.stringify({
                        error: error.message,
                        requestId: context.awsRequestId
                    })
                };
            }
            
            // 未知错误
            return {
                statusCode: 500,
                body: JSON.stringify({
                    error: 'Internal server error',
                    requestId: context.awsRequestId
                })
            };
        }
    };
}

// 使用示例
class DatabaseService {
    @withRetry(3, 1000)
    async query(sql, params) {
        try {
            return await this.connection.query(sql, params);
        } catch (error) {
            if (error.code === 'ECONNRESET') {
                throw new RetryableError('Database connection reset');
            }
            throw new LambdaError(`Database query failed: ${error.message}`);
        }
    }
}

exports.handler = withErrorHandling(async (event, context) => {
    const dbService = new DatabaseService();
    
    const result = await dbService.query('SELECT * FROM users WHERE id = ?', [event.userId]);
    
    return {
        statusCode: 200,
        body: JSON.stringify(result)
    };
});
```

### 4. 性能优化

```javascript
// 连接池管理
const mysql = require('mysql2/promise');

class ConnectionPool {
    constructor(config) {
        this.pool = mysql.createPool({
            ...config,
            acquireTimeout: 60000,
            timeout: 60000,
            reconnect: true,
            connectionLimit: 10
        });
    }
    
    async query(sql, params) {
        const connection = await this.pool.getConnection();
        try {
            const [results] = await connection.execute(sql, params);
            return results;
        } finally {
            connection.release();
        }
    }
    
    async close() {
        await this.pool.end();
    }
}

// 全局连接池（在容器重用时保持连接）
let connectionPool;

function getConnectionPool() {
    if (!connectionPool) {
        connectionPool = new ConnectionPool({
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });
    }
    return connectionPool;
}

// 预热函数
exports.warmupHandler = async (event, context) => {
    if (event.source === 'aws.events' && event['detail-type'] === 'Scheduled Event') {
        console.log('Warming up Lambda function');
        
        // 预热数据库连接
        const pool = getConnectionPool();
        await pool.query('SELECT 1');
        
        // 预热其他服务连接
        // await warmupRedis();
        // await warmupS3();
        
        return { statusCode: 200, body: 'Warmed up' };
    }
    
    // 正常处理逻辑
    return await normalHandler(event, context);
};

// 内存优化
class MemoryOptimizer {
    constructor() {
        this.cache = new Map();
        this.maxCacheSize = 100;
    }
    
    set(key, value, ttl = 300000) { // 5分钟默认TTL
        // 清理过期缓存
        this.cleanupExpired();
        
        // 限制缓存大小
        if (this.cache.size >= this.maxCacheSize) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
        
        this.cache.set(key, {
            value,
            expiry: Date.now() + ttl
        });
    }
    
    get(key) {
        const item = this.cache.get(key);
        if (!item) return null;
        
        if (Date.now() > item.expiry) {
            this.cache.delete(key);
            return null;
        }
        
        return item.value;
    }
    
    cleanupExpired() {
        const now = Date.now();
        for (const [key, item] of this.cache) {
            if (now > item.expiry) {
                this.cache.delete(key);
            }
        }
    }
}

// 全局缓存实例
const memoryCache = new MemoryOptimizer();

exports.optimizedHandler = async (event, context) => {
    const cacheKey = `result:${JSON.stringify(event)}`;
    
    // 尝试从缓存获取
    let result = memoryCache.get(cacheKey);
    
    if (!result) {
        // 缓存未命中，执行计算
        result = await expensiveOperation(event);
        
        // 存入缓存
        memoryCache.set(cacheKey, result);
    }
    
    return {
        statusCode: 200,
        body: JSON.stringify(result)
    };
};
```

## 📊 监控和调试

### 1. CloudWatch 集成

```javascript
// CloudWatch 自定义指标
const AWS = require('aws-sdk');
const cloudwatch = new AWS.CloudWatch();

class MetricsCollector {
    constructor(namespace = 'Lambda/CustomMetrics') {
        this.namespace = namespace;
        this.metrics = [];
    }
    
    addMetric(name, value, unit = 'Count', dimensions = []) {
        this.metrics.push({
            MetricName: name,
            Value: value,
            Unit: unit,
            Dimensions: dimensions.map(d => ({
                Name: d.name,
                Value: d.value
            }))
        });
    }
    
    async flush() {
        if (this.metrics.length === 0) return;
        
        const params = {
            Namespace: this.namespace,
            MetricData: this.metrics
        };
        
        try {
            await cloudwatch.putMetricData(params).promise();
            console.log(`Published ${this.metrics.length} metrics`);
            this.metrics = [];
        } catch (error) {
            console.error('Failed to publish metrics:', error);
        }
    }
}

// 性能监控装饰器
function withMetrics(metricName) {
    return function(target, propertyName, descriptor) {
        const method = descriptor.value;
        
        descriptor.value = async function(...args) {
            const metrics = new MetricsCollector();
            const startTime = Date.now();
            
            try {
                const result = await method.apply(this, args);
                
                const duration = Date.now() - startTime;
                metrics.addMetric(`${metricName}.Duration`, duration, 'Milliseconds');
                metrics.addMetric(`${metricName}.Success`, 1);
                
                await metrics.flush();
                return result;
            } catch (error) {
                const duration = Date.now() - startTime;
                metrics.addMetric(`${metricName}.Duration`, duration, 'Milliseconds');
                metrics.addMetric(`${metricName}.Error`, 1);
                
                await metrics.flush();
                throw error;
            }
        };
    };
}

// 使用示例
class BusinessLogic {
    @withMetrics('UserService.CreateUser')
    async createUser(userData) {
        // 用户创建逻辑
        return await this.database.createUser(userData);
    }
}
```

### 2. 分布式追踪

```javascript
// AWS X-Ray 集成
const AWSXRay = require('aws-xray-sdk-core');
const AWS = AWSXRay.captureAWS(require('aws-sdk'));

// 自定义子段
function withTracing(segmentName) {
    return function(target, propertyName, descriptor) {
        const method = descriptor.value;
        
        descriptor.value = async function(...args) {
            const segment = AWSXRay.getSegment();
            const subsegment = segment.addNewSubsegment(segmentName);
            
            try {
                subsegment.addAnnotation('method', propertyName);
                subsegment.addMetadata('args', args);
                
                const result = await method.apply(this, args);
                
                subsegment.addMetadata('result', result);
                subsegment.close();
                
                return result;
            } catch (error) {
                subsegment.addError(error);
                subsegment.close();
                throw error;
            }
        };
    };
}

class TracedService {
    @withTracing('database-query')
    async queryDatabase(sql, params) {
        const subsegment = AWSXRay.getSegment().addNewSubsegment('database-connection');
        
        try {
            subsegment.addAnnotation('sql', sql);
            const result = await this.connection.query(sql, params);
            subsegment.close();
            return result;
        } catch (error) {
            subsegment.addError(error);
            subsegment.close();
            throw error;
        }
    }
}

exports.tracedHandler = async (event, context) => {
    const segment = AWSXRay.getSegment();
    segment.addAnnotation('userId', event.userId);
    segment.addMetadata('event', event);
    
    const service = new TracedService();
    const result = await service.queryDatabase('SELECT * FROM users WHERE id = ?', [event.userId]);
    
    return {
        statusCode: 200,
        body: JSON.stringify(result)
    };
};
```

## 🚀 实际应用示例

### 完整的 Lambda 应用

```javascript
// 用户管理 API
const AWS = require('aws-sdk');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

// 服务类
class UserService {
    constructor() {
        this.dynamodb = new AWS.DynamoDB.DocumentClient();
        this.tableName = process.env.USERS_TABLE;
        this.jwtSecret = process.env.JWT_SECRET;
    }
    
    async createUser(userData) {
        const { email, password, name } = userData;
        
        // 检查用户是否已存在
        const existingUser = await this.getUserByEmail(email);
        if (existingUser) {
            throw new LambdaError('User already exists', 409);
        }
        
        // 加密密码
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // 创建用户
        const user = {
            id: uuidv4(),
            email,
            name,
            password: hashedPassword,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        await this.dynamodb.put({
            TableName: this.tableName,
            Item: user
        }).promise();
        
        // 不返回密码
        delete user.password;
        return user;
    }
    
    async authenticateUser(email, password) {
        const user = await this.getUserByEmail(email);
        if (!user) {
            throw new LambdaError('Invalid credentials', 401);
        }
        
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            throw new LambdaError('Invalid credentials', 401);
        }
        
        // 生成 JWT
        const token = jwt.sign(
            { userId: user.id, email: user.email },
            this.jwtSecret,
            { expiresIn: '24h' }
        );
        
        delete user.password;
        return { user, token };
    }
    
    async getUserByEmail(email) {
        const result = await this.dynamodb.query({
            TableName: this.tableName,
            IndexName: 'EmailIndex',
            KeyConditionExpression: 'email = :email',
            ExpressionAttributeValues: {
                ':email': email
            }
        }).promise();
        
        return result.Items[0] || null;
    }
    
    async getUserById(id) {
        const result = await this.dynamodb.get({
            TableName: this.tableName,
            Key: { id }
        }).promise();
        
        if (result.Item) {
            delete result.Item.password;
        }
        
        return result.Item || null;
    }
    
    verifyToken(token) {
        try {
            return jwt.verify(token, this.jwtSecret);
        } catch (error) {
            throw new LambdaError('Invalid token', 401);
        }
    }
}

// 主处理函数
const userService = new UserService();

exports.handler = withErrorHandling(async (event, context) => {
    const { httpMethod, path, pathParameters, body, headers } = event;
    
    console.log(`${httpMethod} ${path}`);
    
    try {
        switch (`${httpMethod} ${path}`) {
            case 'POST /auth/register':
                const userData = JSON.parse(body);
                const newUser = await userService.createUser(userData);
                return {
                    statusCode: 201,
                    headers: corsHeaders,
                    body: JSON.stringify(newUser)
                };
                
            case 'POST /auth/login':
                const { email, password } = JSON.parse(body);
                const authResult = await userService.authenticateUser(email, password);
                return {
                    statusCode: 200,
                    headers: corsHeaders,
                    body: JSON.stringify(authResult)
                };
                
            case 'GET /users/me':
                const token = extractToken(headers);
                const payload = userService.verifyToken(token);
                const user = await userService.getUserById(payload.userId);
                
                if (!user) {
                    throw new LambdaError('User not found', 404);
                }
                
                return {
                    statusCode: 200,
                    headers: corsHeaders,
                    body: JSON.stringify(user)
                };
                
            default:
                return {
                    statusCode: 404,
                    headers: corsHeaders,
                    body: JSON.stringify({ error: 'Route not found' })
                };
        }
    } catch (error) {
        if (error instanceof LambdaError) {
            return {
                statusCode: error.statusCode,
                headers: corsHeaders,
                body: JSON.stringify({ error: error.message })
            };
        }
        throw error;
    }
});

// 工具函数
const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
};

function extractToken(headers) {
    const authHeader = headers.Authorization || headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new LambdaError('Missing or invalid authorization header', 401);
    }
    return authHeader.substring(7);
}
```

## 📚 最佳实践总结

1. **冷启动优化**：最小化依赖，使用层共享代码
2. **连接复用**：在全局作用域创建数据库连接
3. **错误处理**：实现优雅的错误处理和重试机制
4. **监控日志**：使用结构化日志和自定义指标
5. **安全性**：验证输入，使用最小权限 IAM 角色
6. **性能调优**：合理设置内存和超时时间
7. **成本控制**：监控使用量，优化函数执行时间

通过掌握这些 AWS Lambda 技术，您将能够构建高效、可扩展的无服务器应用程序。
