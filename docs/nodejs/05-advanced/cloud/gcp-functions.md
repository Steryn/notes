# Google Cloud Functions

## 📖 概述

Google Cloud Functions 是 Google Cloud Platform 提供的无服务器计算服务，允许您运行代码来响应事件，无需管理服务器。它支持多种触发器，包括 HTTP 请求、Cloud Storage 事件、Pub/Sub 消息等。

## 🎯 学习目标

- 掌握 Google Cloud Functions 的核心概念
- 学习函数的创建、部署和管理
- 了解各种触发器类型和事件处理
- 掌握性能优化和监控技巧

## 🚀 快速开始

### 1. 第一个 HTTP 函数

```javascript
// index.js
/**
 * HTTP Cloud Function
 * @param {Object} req Cloud Function request context
 * @param {Object} res Cloud Function response context
 */
exports.helloWorld = (req, res) => {
  // 设置 CORS 头
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  // 处理预检请求
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  const name = req.query.name || req.body.name || 'World';
  
  res.status(200).json({
    message: `Hello, ${name}!`,
    timestamp: new Date().toISOString(),
    method: req.method,
    headers: req.headers
  });
};

// 异步 HTTP 函数
exports.asyncHelloWorld = async (req, res) => {
  try {
    // 模拟异步操作
    const result = await processAsyncOperation(req.body);
    
    res.status(200).json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('函数执行错误:', error);
    
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

async function processAsyncOperation(data) {
  // 模拟数据处理
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return {
    processed: true,
    originalData: data,
    processedAt: new Date().toISOString()
  };
}
```

### 2. package.json 配置

```json
{
  "name": "my-cloud-functions",
  "version": "1.0.0",
  "description": "Google Cloud Functions examples",
  "main": "index.js",
  "scripts": {
    "start": "functions-framework --target=helloWorld",
    "deploy": "gcloud functions deploy helloWorld --runtime nodejs18 --trigger-http --allow-unauthenticated",
    "test": "npm run unit-test",
    "unit-test": "mocha test/unit.test.js"
  },
  "dependencies": {
    "@google-cloud/functions-framework": "^3.0.0",
    "@google-cloud/storage": "^6.0.0",
    "@google-cloud/firestore": "^6.0.0",
    "@google-cloud/pubsub": "^3.0.0"
  },
  "devDependencies": {
    "mocha": "^10.0.0",
    "sinon": "^15.0.0",
    "supertest": "^6.0.0"
  },
  "engines": {
    "node": "18"
  }
}
```

## 🔗 触发器类型

### 1. HTTP 触发器

```javascript
// HTTP API 函数
const express = require('express');
const { Firestore } = require('@google-cloud/firestore');

const app = express();
const firestore = new Firestore();

// 中间件
app.use(express.json());
app.use((req, res, next) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }
  next();
});

// 用户管理 API
app.get('/users/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    const userDoc = await firestore.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ id: userDoc.id, ...userDoc.data() });
  } catch (error) {
    console.error('获取用户失败:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/users', async (req, res) => {
  try {
    const userData = req.body;
    
    // 验证数据
    if (!userData.email || !userData.name) {
      return res.status(400).json({ error: 'Email and name are required' });
    }
    
    // 创建用户
    const userRef = await firestore.collection('users').add({
      ...userData,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    res.status(201).json({ 
      id: userRef.id, 
      message: 'User created successfully' 
    });
  } catch (error) {
    console.error('创建用户失败:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 导出 Express 应用作为 Cloud Function
exports.api = app;
```

### 2. Cloud Storage 触发器

```javascript
// Cloud Storage 事件处理
const { Storage } = require('@google-cloud/storage');
const sharp = require('sharp');

const storage = new Storage();

/**
 * Cloud Storage 触发的函数
 * @param {Object} file Cloud Storage 文件对象
 * @param {Object} context 事件上下文
 */
exports.processStorageEvent = async (file, context) => {
  console.log(`处理文件: ${file.name}`);
  console.log(`事件类型: ${context.eventType}`);
  console.log(`Bucket: ${file.bucket}`);

  try {
    // 只处理图片文件
    if (!file.contentType || !file.contentType.startsWith('image/')) {
      console.log('跳过非图片文件');
      return;
    }

    // 避免处理缩略图文件
    if (file.name.includes('thumb_')) {
      console.log('跳过缩略图文件');
      return;
    }

    await processImage(file);
  } catch (error) {
    console.error('处理存储事件失败:', error);
    throw error;
  }
};

async function processImage(file) {
  const bucket = storage.bucket(file.bucket);
  const sourceFile = bucket.file(file.name);
  
  // 生成缩略图文件名
  const thumbFileName = `thumb_${file.name}`;
  const thumbFile = bucket.file(thumbFileName);

  try {
    // 下载原始文件
    const [imageBuffer] = await sourceFile.download();
    
    // 生成缩略图
    const thumbnailBuffer = await sharp(imageBuffer)
      .resize(200, 200, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ quality: 80 })
      .toBuffer();

    // 上传缩略图
    await thumbFile.save(thumbnailBuffer, {
      metadata: {
        contentType: 'image/jpeg',
        metadata: {
          originalFile: file.name,
          processedAt: new Date().toISOString()
        }
      }
    });

    console.log(`缩略图已生成: ${thumbFileName}`);

    // 可选：更新 Firestore 记录
    await updateImageRecord(file.name, thumbFileName);
    
  } catch (error) {
    console.error('图片处理失败:', error);
    throw error;
  }
}

async function updateImageRecord(originalFile, thumbnailFile) {
  const firestore = new Firestore();
  
  try {
    await firestore.collection('images').add({
      originalFile,
      thumbnailFile,
      processedAt: new Date(),
      status: 'processed'
    });
  } catch (error) {
    console.error('更新图片记录失败:', error);
  }
}
```

### 3. Pub/Sub 触发器

```javascript
// Pub/Sub 消息处理
const { PubSub } = require('@google-cloud/pubsub');
const { Firestore } = require('@google-cloud/firestore');

const pubsub = new PubSub();
const firestore = new Firestore();

/**
 * Pub/Sub 触发的函数
 * @param {Object} message Pub/Sub 消息对象
 * @param {Object} context 事件上下文
 */
exports.processPubSubMessage = async (message, context) => {
  try {
    // 解析消息数据
    const messageData = message.data 
      ? JSON.parse(Buffer.from(message.data, 'base64').toString())
      : {};
    
    console.log('收到 Pub/Sub 消息:', messageData);
    console.log('消息属性:', message.attributes);

    // 根据消息类型处理
    await handleMessage(messageData, message.attributes);
    
    console.log('消息处理完成');
  } catch (error) {
    console.error('处理 Pub/Sub 消息失败:', error);
    throw error; // 重新抛出错误会触发重试
  }
};

async function handleMessage(data, attributes) {
  const messageType = attributes.type || data.type;
  
  switch (messageType) {
    case 'user-registered':
      await handleUserRegistration(data);
      break;
    case 'order-created':
      await handleOrderCreated(data);
      break;
    case 'payment-completed':
      await handlePaymentCompleted(data);
      break;
    default:
      console.warn('未知消息类型:', messageType);
  }
}

async function handleUserRegistration(data) {
  console.log('处理用户注册:', data.userId);
  
  try {
    // 发送欢迎邮件
    await sendWelcomeEmail(data.email, data.name);
    
    // 创建用户配置文件
    await createUserProfile(data);
    
    // 发送通知给管理员
    await notifyAdmins('new_user', data);
    
  } catch (error) {
    console.error('处理用户注册失败:', error);
    throw error;
  }
}

async function handleOrderCreated(data) {
  console.log('处理订单创建:', data.orderId);
  
  try {
    // 更新库存
    await updateInventory(data.items);
    
    // 发送订单确认邮件
    await sendOrderConfirmation(data.userEmail, data.orderId);
    
    // 通知仓库
    await notifyWarehouse(data);
    
  } catch (error) {
    console.error('处理订单创建失败:', error);
    throw error;
  }
}

// 发送消息到其他 Pub/Sub 主题
async function publishMessage(topicName, data, attributes = {}) {
  try {
    const topic = pubsub.topic(topicName);
    const messageId = await topic.publishMessage({
      data: Buffer.from(JSON.stringify(data)),
      attributes
    });
    
    console.log(`消息已发布到 ${topicName}, ID: ${messageId}`);
    return messageId;
  } catch (error) {
    console.error('发布消息失败:', error);
    throw error;
  }
}

async function sendWelcomeEmail(email, name) {
  // 发送欢迎邮件消息
  await publishMessage('email-notifications', {
    type: 'welcome',
    recipient: email,
    data: { name }
  }, { priority: 'high' });
}
```

### 4. Firestore 触发器

```javascript
// Firestore 数据库触发器
const { Firestore } = require('@google-cloud/firestore');

const firestore = new Firestore();

/**
 * Firestore 文档创建触发器
 * @param {Object} change Firestore 变更对象
 * @param {Object} context 事件上下文
 */
exports.onUserCreate = async (change, context) => {
  const userId = context.params.userId;
  const userData = change.after.data();
  
  console.log(`用户创建: ${userId}`, userData);

  try {
    // 创建用户统计记录
    await firestore.collection('userStats').doc(userId).set({
      userId,
      loginCount: 0,
      lastLoginAt: null,
      createdAt: new Date(),
      status: 'active'
    });

    // 发送欢迎通知
    await sendWelcomeNotification(userData);
    
    // 更新全局统计
    await updateGlobalStats('userCount', 1);
    
    console.log('用户创建处理完成');
  } catch (error) {
    console.error('处理用户创建失败:', error);
    throw error;
  }
};

/**
 * Firestore 文档更新触发器
 * @param {Object} change Firestore 变更对象
 * @param {Object} context 事件上下文
 */
exports.onUserUpdate = async (change, context) => {
  const userId = context.params.userId;
  const beforeData = change.before.data();
  const afterData = change.after.data();
  
  console.log(`用户更新: ${userId}`);

  try {
    // 检查状态变更
    if (beforeData.status !== afterData.status) {
      await handleStatusChange(userId, beforeData.status, afterData.status);
    }
    
    // 检查邮箱变更
    if (beforeData.email !== afterData.email) {
      await handleEmailChange(userId, beforeData.email, afterData.email);
    }
    
    console.log('用户更新处理完成');
  } catch (error) {
    console.error('处理用户更新失败:', error);
    throw error;
  }
};

/**
 * Firestore 文档删除触发器
 * @param {Object} change Firestore 变更对象
 * @param {Object} context 事件上下文
 */
exports.onUserDelete = async (change, context) => {
  const userId = context.params.userId;
  const userData = change.before.data();
  
  console.log(`用户删除: ${userId}`, userData);

  try {
    // 清理相关数据
    await cleanupUserData(userId);
    
    // 更新全局统计
    await updateGlobalStats('userCount', -1);
    
    // 发送删除通知
    await notifyUserDeletion(userData);
    
    console.log('用户删除处理完成');
  } catch (error) {
    console.error('处理用户删除失败:', error);
    throw error;
  }
};

async function handleStatusChange(userId, oldStatus, newStatus) {
  console.log(`用户 ${userId} 状态变更: ${oldStatus} -> ${newStatus}`);
  
  // 更新用户统计
  await firestore.collection('userStats').doc(userId).update({
    status: newStatus,
    statusChangedAt: new Date()
  });
  
  // 根据状态执行不同操作
  if (newStatus === 'suspended') {
    await handleUserSuspension(userId);
  } else if (newStatus === 'active' && oldStatus === 'suspended') {
    await handleUserReactivation(userId);
  }
}

async function cleanupUserData(userId) {
  const batch = firestore.batch();
  
  // 删除用户统计
  batch.delete(firestore.collection('userStats').doc(userId));
  
  // 删除用户会话
  const sessions = await firestore.collection('userSessions')
    .where('userId', '==', userId).get();
  
  sessions.forEach(doc => {
    batch.delete(doc.ref);
  });
  
  await batch.commit();
}
```

## 🔧 高级功能

### 1. 环境变量和配置

```javascript
// config.js
class Config {
  constructor() {
    this.environment = process.env.NODE_ENV || 'development';
    this.projectId = process.env.GOOGLE_CLOUD_PROJECT;
    
    // 数据库配置
    this.database = {
      projectId: this.projectId,
      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
    };
    
    // 外部服务配置
    this.services = {
      emailService: process.env.EMAIL_SERVICE_URL,
      paymentService: process.env.PAYMENT_SERVICE_URL,
      notificationService: process.env.NOTIFICATION_SERVICE_URL
    };
    
    // 功能开关
    this.features = {
      emailNotifications: process.env.ENABLE_EMAIL_NOTIFICATIONS === 'true',
      analytics: process.env.ENABLE_ANALYTICS === 'true',
      debugging: process.env.ENABLE_DEBUGGING === 'true'
    };
  }
  
  isDevelopment() {
    return this.environment === 'development';
  }
  
  isProduction() {
    return this.environment === 'production';
  }
  
  getSecretValue(secretName) {
    // 在生产环境中，应该使用 Secret Manager
    return process.env[secretName];
  }
}

// 使用配置
const config = new Config();

exports.configuredFunction = async (req, res) => {
  try {
    if (config.features.debugging) {
      console.log('调试信息:', req.body);
    }
    
    const result = await processRequest(req.body, config);
    
    if (config.features.analytics) {
      await recordAnalytics('function_call', {
        functionName: 'configuredFunction',
        success: true
      });
    }
    
    res.json(result);
  } catch (error) {
    console.error('函数执行失败:', error);
    
    if (config.features.analytics) {
      await recordAnalytics('function_error', {
        functionName: 'configuredFunction',
        error: error.message
      });
    }
    
    res.status(500).json({ error: error.message });
  }
};
```

### 2. 错误处理和重试

```javascript
// error-handling.js
class CloudFunctionError extends Error {
  constructor(message, statusCode = 500, retryable = false) {
    super(message);
    this.name = 'CloudFunctionError';
    this.statusCode = statusCode;
    this.retryable = retryable;
  }
}

class RetryableError extends CloudFunctionError {
  constructor(message, statusCode = 500) {
    super(message, statusCode, true);
    this.name = 'RetryableError';
  }
}

// 重试装饰器
function withRetry(maxRetries = 3, backoffMs = 1000) {
  return function(target, propertyName, descriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function(...args) {
      let lastError;
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          return await originalMethod.apply(this, args);
        } catch (error) {
          lastError = error;
          
          // 检查是否应该重试
          if (!shouldRetry(error, attempt, maxRetries)) {
            throw error;
          }
          
          // 指数退避
          const delay = backoffMs * Math.pow(2, attempt - 1);
          console.log(`尝试 ${attempt} 失败，${delay}ms 后重试`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
      
      throw lastError;
    };
  };
}

function shouldRetry(error, attempt, maxRetries) {
  // 达到最大重试次数
  if (attempt >= maxRetries) {
    return false;
  }
  
  // 检查错误类型
  if (error instanceof RetryableError) {
    return true;
  }
  
  // HTTP 错误码检查
  if (error.statusCode) {
    // 5xx 错误通常可以重试
    return error.statusCode >= 500 && error.statusCode < 600;
  }
  
  // 网络错误
  const retryableErrors = [
    'ECONNRESET',
    'ECONNREFUSED', 
    'ETIMEDOUT',
    'ENOTFOUND'
  ];
  
  return retryableErrors.includes(error.code);
}

// 全局错误处理
function handleCloudFunctionError(error, req, res) {
  console.error('Cloud Function 错误:', {
    error: error.message,
    stack: error.stack,
    request: {
      method: req.method,
      url: req.url,
      headers: req.headers,
      body: req.body
    }
  });
  
  // 根据错误类型返回不同响应
  if (error instanceof CloudFunctionError) {
    res.status(error.statusCode).json({
      error: error.message,
      retryable: error.retryable,
      timestamp: new Date().toISOString()
    });
  } else {
    res.status(500).json({
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
}

// 使用示例
class ExternalService {
  @withRetry(3, 1000)
  async callExternalAPI(data) {
    try {
      const response = await fetch('https://api.example.com/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        if (response.status >= 500) {
          throw new RetryableError(`服务器错误: ${response.status}`);
        } else {
          throw new CloudFunctionError(`客户端错误: ${response.status}`, response.status);
        }
      }
      
      return await response.json();
    } catch (error) {
      if (error.code === 'ECONNRESET') {
        throw new RetryableError('连接重置');
      }
      throw error;
    }
  }
}

exports.resilientFunction = async (req, res) => {
  try {
    const service = new ExternalService();
    const result = await service.callExternalAPI(req.body);
    
    res.json({ success: true, data: result });
  } catch (error) {
    handleCloudFunctionError(error, req, res);
  }
};
```

### 3. 性能优化

```javascript
// performance-optimization.js
const { performance } = require('perf_hooks');

// 连接池管理
class ConnectionPool {
  constructor() {
    this.connections = new Map();
    this.maxConnections = 10;
    this.connectionTimeout = 30000;
  }
  
  async getConnection(service) {
    const existing = this.connections.get(service);
    
    if (existing && this.isConnectionValid(existing)) {
      return existing.connection;
    }
    
    // 创建新连接
    const connection = await this.createConnection(service);
    this.connections.set(service, {
      connection,
      createdAt: Date.now(),
      lastUsed: Date.now()
    });
    
    return connection;
  }
  
  isConnectionValid(connectionInfo) {
    const now = Date.now();
    return (now - connectionInfo.createdAt) < this.connectionTimeout;
  }
  
  async createConnection(service) {
    switch (service) {
      case 'firestore':
        return new Firestore();
      case 'storage':
        return new Storage();
      case 'pubsub':
        return new PubSub();
      default:
        throw new Error(`未知服务: ${service}`);
    }
  }
}

// 全局连接池
const connectionPool = new ConnectionPool();

// 缓存装饰器
const cache = new Map();

function cached(ttlMs = 300000) { // 默认5分钟
  return function(target, propertyName, descriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function(...args) {
      const cacheKey = `${target.constructor.name}:${propertyName}:${JSON.stringify(args)}`;
      const cached = cache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < ttlMs) {
        console.log(`缓存命中: ${cacheKey}`);
        return cached.value;
      }
      
      const result = await originalMethod.apply(this, args);
      
      cache.set(cacheKey, {
        value: result,
        timestamp: Date.now()
      });
      
      return result;
    };
  };
}

// 性能监控装饰器
function monitored(operationName) {
  return function(target, propertyName, descriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function(...args) {
      const startTime = performance.now();
      const startMemory = process.memoryUsage();
      
      try {
        const result = await originalMethod.apply(this, args);
        
        const endTime = performance.now();
        const endMemory = process.memoryUsage();
        const duration = endTime - startTime;
        
        console.log(`性能指标 [${operationName}]:`, {
          duration: `${duration.toFixed(2)}ms`,
          memoryDelta: `${(endMemory.heapUsed - startMemory.heapUsed) / 1024 / 1024}MB`,
          success: true
        });
        
        return result;
      } catch (error) {
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        console.log(`性能指标 [${operationName}]:`, {
          duration: `${duration.toFixed(2)}ms`,
          success: false,
          error: error.message
        });
        
        throw error;
      }
    };
  };
}

// 优化的服务类
class OptimizedUserService {
  constructor() {
    this.connectionPool = connectionPool;
  }
  
  @cached(600000) // 10分钟缓存
  @monitored('getUserProfile')
  async getUserProfile(userId) {
    const firestore = await this.connectionPool.getConnection('firestore');
    const userDoc = await firestore.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      throw new CloudFunctionError('用户不存在', 404);
    }
    
    return { id: userDoc.id, ...userDoc.data() };
  }
  
  @monitored('updateUserProfile')
  async updateUserProfile(userId, updates) {
    const firestore = await this.connectionPool.getConnection('firestore');
    
    await firestore.collection('users').doc(userId).update({
      ...updates,
      updatedAt: new Date()
    });
    
    // 清除缓存
    const cacheKey = `OptimizedUserService:getUserProfile:["${userId}"]`;
    cache.delete(cacheKey);
    
    return { success: true };
  }
}

exports.optimizedUserAPI = async (req, res) => {
  const userService = new OptimizedUserService();
  
  try {
    switch (req.method) {
      case 'GET':
        const profile = await userService.getUserProfile(req.params.userId);
        res.json(profile);
        break;
        
      case 'PUT':
        await userService.updateUserProfile(req.params.userId, req.body);
        res.json({ success: true });
        break;
        
      default:
        res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    handleCloudFunctionError(error, req, res);
  }
};
```

## 📊 监控和日志

### 1. 结构化日志

```javascript
// structured-logging.js
class CloudFunctionLogger {
  constructor(functionName) {
    this.functionName = functionName;
    this.projectId = process.env.GOOGLE_CLOUD_PROJECT;
  }
  
  log(severity, message, metadata = {}) {
    const logEntry = {
      severity: severity.toUpperCase(),
      message,
      timestamp: new Date().toISOString(),
      function: this.functionName,
      project: this.projectId,
      ...metadata
    };
    
    // Cloud Logging 会自动解析 JSON
    console.log(JSON.stringify(logEntry));
  }
  
  info(message, metadata) {
    this.log('info', message, metadata);
  }
  
  warn(message, metadata) {
    this.log('warning', message, metadata);
  }
  
  error(message, error, metadata) {
    this.log('error', message, {
      ...metadata,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : undefined
    });
  }
  
  debug(message, metadata) {
    this.log('debug', message, metadata);
  }
}

// 请求日志中间件
function createLoggingMiddleware(logger) {
  return (req, res, next) => {
    const startTime = Date.now();
    const requestId = req.get('X-Cloud-Trace-Context') || generateRequestId();
    
    req.logger = logger;
    req.requestId = requestId;
    
    logger.info('请求开始', {
      requestId,
      method: req.method,
      url: req.url,
      userAgent: req.get('User-Agent'),
      ip: req.ip
    });
    
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      
      logger.info('请求完成', {
        requestId,
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration: `${duration}ms`
      });
    });
    
    next();
  };
}

function generateRequestId() {
  return Math.random().toString(36).substring(2, 15);
}

// 使用示例
const logger = new CloudFunctionLogger('user-service');

exports.loggedFunction = (req, res) => {
  const loggingMiddleware = createLoggingMiddleware(logger);
  
  loggingMiddleware(req, res, async () => {
    try {
      req.logger.info('处理用户请求', {
        requestId: req.requestId,
        userId: req.body.userId
      });
      
      const result = await processUserRequest(req.body);
      
      req.logger.info('用户请求处理成功', {
        requestId: req.requestId,
        resultSize: JSON.stringify(result).length
      });
      
      res.json(result);
    } catch (error) {
      req.logger.error('用户请求处理失败', error, {
        requestId: req.requestId,
        userId: req.body.userId
      });
      
      res.status(500).json({ error: error.message });
    }
  });
};
```

### 2. 自定义指标

```javascript
// custom-metrics.js
const { Monitoring } = require('@google-cloud/monitoring');

class CustomMetrics {
  constructor() {
    this.monitoring = new Monitoring.MetricServiceClient();
    this.projectId = process.env.GOOGLE_CLOUD_PROJECT;
    this.projectPath = this.monitoring.projectPath(this.projectId);
  }
  
  async recordMetric(metricType, value, labels = {}) {
    const request = {
      name: this.projectPath,
      timeSeries: [{
        metric: {
          type: `custom.googleapis.com/${metricType}`,
          labels
        },
        resource: {
          type: 'cloud_function',
          labels: {
            function_name: process.env.FUNCTION_NAME || 'unknown',
            region: process.env.FUNCTION_REGION || 'us-central1'
          }
        },
        points: [{
          interval: {
            endTime: {
              seconds: Math.floor(Date.now() / 1000)
            }
          },
          value: {
            doubleValue: value
          }
        }]
      }]
    };
    
    try {
      await this.monitoring.createTimeSeries(request);
    } catch (error) {
      console.error('记录指标失败:', error);
    }
  }
  
  // 便捷方法
  async recordFunctionExecution(functionName, duration, success) {
    await Promise.all([
      this.recordMetric('function_duration', duration, {
        function_name: functionName,
        success: success.toString()
      }),
      this.recordMetric('function_executions', 1, {
        function_name: functionName,
        success: success.toString()
      })
    ]);
  }
  
  async recordBusinessMetric(metricName, value, labels = {}) {
    await this.recordMetric(`business_${metricName}`, value, labels);
  }
}

// 指标装饰器
function withMetrics(metricName) {
  return function(target, propertyName, descriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function(...args) {
      const startTime = Date.now();
      const metrics = new CustomMetrics();
      
      try {
        const result = await originalMethod.apply(this, args);
        const duration = Date.now() - startTime;
        
        await metrics.recordFunctionExecution(metricName, duration, true);
        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        
        await metrics.recordFunctionExecution(metricName, duration, false);
        throw error;
      }
    };
  };
}

// 使用示例
class MetricsService {
  constructor() {
    this.metrics = new CustomMetrics();
  }
  
  @withMetrics('user_creation')
  async createUser(userData) {
    // 用户创建逻辑
    const user = await saveUserToDatabase(userData);
    
    // 记录业务指标
    await this.metrics.recordBusinessMetric('users_created', 1, {
      user_type: userData.type || 'regular'
    });
    
    return user;
  }
}

exports.metricsFunction = async (req, res) => {
  const service = new MetricsService();
  
  try {
    const result = await service.createUser(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

## 🚀 部署和管理

### 1. 部署配置

```yaml
# cloudbuild.yaml
steps:
  # 安装依赖
  - name: 'node:18'
    entrypoint: 'npm'
    args: ['ci']
  
  # 运行测试
  - name: 'node:18'
    entrypoint: 'npm'
    args: ['test']
  
  # 部署函数
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: 'gcloud'
    args:
      - 'functions'
      - 'deploy'
      - 'my-function'
      - '--runtime=nodejs18'
      - '--trigger-http'
      - '--allow-unauthenticated'
      - '--memory=256MB'
      - '--timeout=60s'
      - '--set-env-vars=NODE_ENV=production'

# terraform 配置
resource "google_cloudfunctions_function" "function" {
  name        = "my-nodejs-function"
  description = "Node.js Cloud Function"
  runtime     = "nodejs18"

  available_memory_mb   = 256
  source_archive_bucket = google_storage_bucket.bucket.name
  source_archive_object = google_storage_bucket_object.zip.name
  trigger {
    http_trigger {
      security_level = "SECURE_ALWAYS"
    }
  }
  
  timeout = 60
  entry_point = "main"
  
  environment_variables = {
    NODE_ENV = "production"
  }
  
  labels = {
    environment = "production"
    team        = "backend"
  }
}
```

### 2. 本地开发和测试

```javascript
// test/unit.test.js
const sinon = require('sinon');
const { expect } = require('chai');

// 模拟 Google Cloud 服务
const mockFirestore = {
  collection: sinon.stub().returns({
    doc: sinon.stub().returns({
      get: sinon.stub(),
      set: sinon.stub(),
      update: sinon.stub()
    })
  })
};

// 测试 HTTP 函数
describe('Cloud Functions', () => {
  let req, res;
  
  beforeEach(() => {
    req = {
      method: 'GET',
      query: {},
      body: {},
      params: {}
    };
    
    res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub().returnsThis(),
      send: sinon.stub().returnsThis(),
      set: sinon.stub().returnsThis()
    };
  });
  
  describe('helloWorld', () => {
    it('should return greeting with name', async () => {
      req.query.name = 'Test';
      
      const { helloWorld } = require('../index');
      await helloWorld(req, res);
      
      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.calledWithMatch({
        message: 'Hello, Test!'
      })).to.be.true;
    });
  });
  
  describe('API functions', () => {
    it('should handle user creation', async () => {
      req.method = 'POST';
      req.body = {
        name: 'Test User',
        email: 'test@example.com'
      };
      
      // 模拟 Firestore 响应
      mockFirestore.collection().doc().set.resolves();
      
      const { userAPI } = require('../index');
      await userAPI(req, res);
      
      expect(res.status.calledWith(201)).to.be.true;
    });
  });
});

// 集成测试
describe('Integration Tests', () => {
  it('should process Pub/Sub message', async () => {
    const message = {
      data: Buffer.from(JSON.stringify({
        type: 'test',
        userId: '123'
      })).toString('base64'),
      attributes: {
        type: 'test-message'
      }
    };
    
    const context = {
      eventId: 'test-event-id',
      timestamp: new Date().toISOString()
    };
    
    const { processPubSubMessage } = require('../index');
    await processPubSubMessage(message, context);
    
    // 验证处理结果
  });
});
```

## 📚 最佳实践总结

1. **函数设计**：保持函数小而专一，单一职责
2. **冷启动优化**：复用连接，最小化依赖
3. **错误处理**：实现完整的错误处理和重试机制
4. **性能监控**：使用结构化日志和自定义指标
5. **安全性**：验证输入，使用最小权限原则
6. **测试**：编写单元测试和集成测试
7. **部署**：使用 CI/CD 自动化部署流程
8. **成本控制**：合理设置内存和超时时间

通过掌握这些 Google Cloud Functions 技术，您将能够构建高效、可扩展的无服务器应用程序。
