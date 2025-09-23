# Azure Functions

## 📖 概述

Azure Functions 是微软提供的无服务器计算服务，允许您在云中运行小段代码（函数），无需管理基础设施。支持多种编程语言，包括 Node.js，并提供丰富的触发器和绑定。

## 🎯 学习目标

- 掌握 Azure Functions 的核心概念
- 学习函数的创建和部署
- 了解触发器和绑定机制
- 掌握 Azure Functions 开发最佳实践

## 🚀 快速开始

### 1. 创建第一个函数

```javascript
// index.js
module.exports = async function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');

    const name = (req.query.name || (req.body && req.body.name));
    const responseMessage = name
        ? "Hello, " + name + ". This HTTP triggered function executed successfully."
        : "This HTTP triggered function executed successfully. Pass a name in the query string or in the request body for a personalized response.";

    context.res = {
        status: 200,
        headers: {
            'Content-Type': 'application/json'
        },
        body: {
            message: responseMessage,
            timestamp: new Date().toISOString(),
            invocationId: context.invocationId
        }
    };
};
```

### 2. 函数配置

```json
// function.json
{
  "bindings": [
    {
      "authLevel": "function",
      "type": "httpTrigger",
      "direction": "in",
      "name": "req",
      "methods": ["get", "post"]
    },
    {
      "type": "http",
      "direction": "out",
      "name": "res"
    }
  ],
  "scriptFile": "index.js"
}
```

### 3. 主机配置

```json
// host.json
{
  "version": "2.0",
  "functionTimeout": "00:05:00",
  "logging": {
    "applicationInsights": {
      "samplingSettings": {
        "isEnabled": true
      }
    }
  },
  "extensionBundle": {
    "id": "Microsoft.Azure.Functions.ExtensionBundle",
    "version": "[2.*, 3.0.0)"
  }
}
```

## 📋 函数结构和上下文

### 1. Context 对象

```javascript
module.exports = async function (context, ...inputs) {
    // Context 对象提供函数运行时信息
    
    // 日志记录
    context.log('Info message');
    context.log.warn('Warning message');
    context.log.error('Error message');
    
    // 函数信息
    context.log('Function name:', context.executionContext.functionName);
    context.log('Function directory:', context.executionContext.functionDirectory);
    context.log('Invocation ID:', context.invocationId);
    
    // 绑定数据访问
    const inputData = context.bindings.myInput;
    context.bindings.myOutput = 'output data';
    
    // 完成函数执行
    context.done(); // 或者使用 async/await
};
```

### 2. 异步函数模式

```javascript
// 推荐：使用 async/await
module.exports = async function (context, req) {
    try {
        const result = await processRequest(req);
        
        context.res = {
            status: 200,
            body: result
        };
    } catch (error) {
        context.log.error('Function failed:', error);
        
        context.res = {
            status: 500,
            body: { error: 'Internal server error' }
        };
    }
};

// 传统：使用回调
module.exports = function (context, req) {
    processRequest(req, (error, result) => {
        if (error) {
            context.res = {
                status: 500,
                body: { error: error.message }
            };
        } else {
            context.res = {
                status: 200,
                body: result
            };
        }
        context.done();
    });
};
```

## 🔗 触发器类型

### 1. HTTP 触发器

```javascript
// HTTP API 函数
module.exports = async function (context, req) {
    const { method, url, headers, query, body } = req;
    
    context.log(`${method} ${url}`);
    
    // 路由处理
    const route = req.params.route; // 来自路由参数
    
    try {
        switch (method) {
            case 'GET':
                return await handleGet(context, query, route);
            case 'POST':
                return await handlePost(context, body);
            case 'PUT':
                return await handlePut(context, route, body);
            case 'DELETE':
                return await handleDelete(context, route);
            default:
                context.res = {
                    status: 405,
                    body: { error: 'Method not allowed' }
                };
        }
    } catch (error) {
        context.log.error('HTTP handler error:', error);
        context.res = {
            status: 500,
            body: { error: 'Internal server error' }
        };
    }
};

async function handleGet(context, query, route) {
    if (route) {
        // 获取特定资源
        const item = await getItemById(route);
        context.res = {
            status: item ? 200 : 404,
            body: item || { error: 'Item not found' }
        };
    } else {
        // 获取资源列表
        const items = await getItems(query);
        context.res = {
            status: 200,
            body: items
        };
    }
}

// function.json 配置
/*
{
  "bindings": [
    {
      "authLevel": "anonymous",
      "type": "httpTrigger",
      "direction": "in",
      "name": "req",
      "methods": ["get", "post", "put", "delete"],
      "route": "api/{route?}"
    },
    {
      "type": "http",
      "direction": "out",
      "name": "res"
    }
  ]
}
*/
```

### 2. 定时器触发器

```javascript
// 定时任务函数
module.exports = async function (context, myTimer) {
    const timeStamp = new Date().toISOString();
    
    if (myTimer.isPastDue) {
        context.log('Timer function is running late!');
    }
    
    context.log('Timer trigger function ran!', timeStamp);
    
    try {
        // 执行定时任务
        await Promise.all([
            cleanupExpiredData(),
            generateReports(),
            sendNotifications(),
            backupData()
        ]);
        
        context.log('Scheduled tasks completed successfully');
    } catch (error) {
        context.log.error('Scheduled task failed:', error);
        throw error;
    }
};

async function cleanupExpiredData() {
    // 清理过期数据
    const expiredDate = new Date();
    expiredDate.setDate(expiredDate.getDate() - 30);
    
    // 模拟数据库操作
    const deletedCount = await database.deleteMany({
        createdAt: { $lt: expiredDate }
    });
    
    console.log(`Cleaned up ${deletedCount} expired records`);
}

async function generateReports() {
    // 生成报告
    const report = await analytics.generateDailyReport();
    await storage.saveReport(report);
    await email.sendReport(report);
}

// function.json 配置
/*
{
  "bindings": [
    {
      "name": "myTimer",
      "type": "timerTrigger",
      "direction": "in",
      "schedule": "0 0 2 * * *"
    }
  ]
}
*/
```

### 3. Blob 存储触发器

```javascript
// Blob 存储事件处理
module.exports = async function (context, myBlob) {
    const blobName = context.bindingData.name;
    const blobUri = context.bindingData.uri;
    
    context.log(`Processing blob: ${blobName}`);
    context.log(`Blob size: ${myBlob.length} bytes`);
    
    try {
        // 根据文件类型处理
        const fileExtension = blobName.split('.').pop().toLowerCase();
        
        switch (fileExtension) {
            case 'jpg':
            case 'jpeg':
            case 'png':
            case 'gif':
                await processImage(context, myBlob, blobName);
                break;
            case 'pdf':
                await processPDF(context, myBlob, blobName);
                break;
            case 'csv':
                await processCSV(context, myBlob, blobName);
                break;
            default:
                context.log(`Unsupported file type: ${fileExtension}`);
        }
    } catch (error) {
        context.log.error(`Failed to process blob ${blobName}:`, error);
        throw error;
    }
};

async function processImage(context, imageBuffer, fileName) {
    const sharp = require('sharp');
    
    try {
        // 生成缩略图
        const thumbnail = await sharp(imageBuffer)
            .resize(200, 200)
            .jpeg({ quality: 80 })
            .toBuffer();
        
        // 保存缩略图到输出绑定
        context.bindings.thumbnailBlob = thumbnail;
        
        // 提取图像元数据
        const metadata = await sharp(imageBuffer).metadata();
        
        // 保存元数据到数据库
        await saveImageMetadata(fileName, metadata);
        
        context.log(`Image processed: ${fileName}`);
    } catch (error) {
        context.log.error(`Image processing failed for ${fileName}:`, error);
        throw error;
    }
}

// function.json 配置
/*
{
  "bindings": [
    {
      "name": "myBlob",
      "type": "blobTrigger",
      "direction": "in",
      "path": "uploads/{name}",
      "connection": "AzureWebJobsStorage"
    },
    {
      "name": "thumbnailBlob",
      "type": "blob",
      "direction": "out",
      "path": "thumbnails/{name}",
      "connection": "AzureWebJobsStorage"
    }
  ]
}
*/
```

### 4. Service Bus 触发器

```javascript
// Service Bus 消息处理
module.exports = async function (context, mySbMsg) {
    context.log('Service Bus queue trigger function processed message:', mySbMsg);
    
    try {
        // 解析消息
        const message = typeof mySbMsg === 'string' ? JSON.parse(mySbMsg) : mySbMsg;
        
        // 处理消息
        await processMessage(context, message);
        
        context.log('Message processed successfully');
    } catch (error) {
        context.log.error('Message processing failed:', error);
        
        // 抛出错误会将消息发送到死信队列
        throw error;
    }
};

async function processMessage(context, message) {
    const { type, data, metadata } = message;
    
    context.log(`Processing message type: ${type}`);
    
    switch (type) {
        case 'user-registration':
            await handleUserRegistration(data);
            break;
        case 'order-processing':
            await handleOrderProcessing(data);
            break;
        case 'email-notification':
            await handleEmailNotification(data);
            break;
        default:
            throw new Error(`Unknown message type: ${type}`);
    }
}

async function handleUserRegistration(userData) {
    // 用户注册处理
    context.log('Processing user registration for:', userData.email);
    
    // 发送欢迎邮件
    await sendWelcomeEmail(userData.email, userData.name);
    
    // 创建用户配置文件
    await createUserProfile(userData);
    
    // 发送通知到其他服务
    await notifyOtherServices('user-registered', userData);
}

// function.json 配置
/*
{
  "bindings": [
    {
      "name": "mySbMsg",
      "type": "serviceBusTrigger",
      "direction": "in",
      "queueName": "processing-queue",
      "connection": "ServiceBusConnection"
    }
  ]
}
*/
```

## 🔧 绑定机制

### 1. 输入绑定

```javascript
// 多个输入绑定示例
module.exports = async function (context, req, inputBlob, inputDocument) {
    context.log('Function with multiple input bindings');
    
    // HTTP 请求数据
    const requestData = req.body;
    
    // Blob 存储数据
    const blobContent = inputBlob.toString();
    
    // Cosmos DB 文档
    const document = inputDocument;
    
    // 处理数据
    const result = await processData(requestData, blobContent, document);
    
    context.res = {
        status: 200,
        body: result
    };
};

// function.json 配置
/*
{
  "bindings": [
    {
      "authLevel": "function",
      "type": "httpTrigger",
      "direction": "in",
      "name": "req"
    },
    {
      "type": "blob",
      "direction": "in",
      "name": "inputBlob",
      "path": "data/{id}",
      "connection": "AzureWebJobsStorage"
    },
    {
      "type": "cosmosDB",
      "direction": "in",
      "name": "inputDocument",
      "databaseName": "MyDatabase",
      "collectionName": "MyCollection",
      "id": "{id}",
      "partitionKey": "{partitionKey}",
      "connectionStringSetting": "CosmosDBConnection"
    },
    {
      "type": "http",
      "direction": "out",
      "name": "res"
    }
  ]
}
*/
```

### 2. 输出绑定

```javascript
// 多个输出绑定示例
module.exports = async function (context, req) {
    const userData = req.body;
    
    try {
        // 处理用户数据
        const processedUser = await processUserData(userData);
        
        // 输出到 Cosmos DB
        context.bindings.outputDocument = {
            id: processedUser.id,
            ...processedUser,
            createdAt: new Date().toISOString()
        };
        
        // 输出到 Blob 存储
        context.bindings.outputBlob = JSON.stringify(processedUser);
        
        // 输出到 Service Bus 队列
        context.bindings.outputMessage = {
            type: 'user-created',
            data: processedUser,
            timestamp: new Date().toISOString()
        };
        
        // 输出到 Event Hub
        context.bindings.outputEvent = {
            eventType: 'UserCreated',
            userId: processedUser.id,
            timestamp: new Date().toISOString()
        };
        
        context.res = {
            status: 201,
            body: { message: 'User created successfully', id: processedUser.id }
        };
    } catch (error) {
        context.log.error('User creation failed:', error);
        context.res = {
            status: 500,
            body: { error: 'Failed to create user' }
        };
    }
};

// function.json 配置
/*
{
  "bindings": [
    {
      "authLevel": "function",
      "type": "httpTrigger",
      "direction": "in",
      "name": "req",
      "methods": ["post"]
    },
    {
      "type": "cosmosDB",
      "direction": "out",
      "name": "outputDocument",
      "databaseName": "MyDatabase",
      "collectionName": "Users",
      "createIfNotExists": true,
      "connectionStringSetting": "CosmosDBConnection"
    },
    {
      "type": "blob",
      "direction": "out",
      "name": "outputBlob",
      "path": "users/{id}.json",
      "connection": "AzureWebJobsStorage"
    },
    {
      "type": "serviceBus",
      "direction": "out",
      "name": "outputMessage",
      "queueName": "user-events",
      "connection": "ServiceBusConnection"
    },
    {
      "type": "eventHub",
      "direction": "out",
      "name": "outputEvent",
      "eventHubName": "user-events",
      "connection": "EventHubConnection"
    },
    {
      "type": "http",
      "direction": "out",
      "name": "res"
    }
  ]
}
*/
```

## 🔐 安全和身份验证

### 1. Azure AD 身份验证

```javascript
// Azure AD JWT 验证
const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');

class AzureADAuth {
    constructor() {
        this.tenantId = process.env.AZURE_TENANT_ID;
        this.clientId = process.env.AZURE_CLIENT_ID;
        this.jwksUri = `https://login.microsoftonline.com/${this.tenantId}/discovery/v2.0/keys`;
        
        this.client = jwksClient({
            jwksUri: this.jwksUri,
            requestHeaders: {},
            timeout: 30000
        });
    }
    
    async verifyToken(token) {
        return new Promise((resolve, reject) => {
            jwt.verify(token, this.getKey.bind(this), {
                audience: this.clientId,
                issuer: `https://login.microsoftonline.com/${this.tenantId}/v2.0`,
                algorithms: ['RS256']
            }, (err, decoded) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(decoded);
                }
            });
        });
    }
    
    getKey(header, callback) {
        this.client.getSigningKey(header.kid, (err, key) => {
            if (err) {
                callback(err);
            } else {
                const signingKey = key.publicKey || key.rsaPublicKey;
                callback(null, signingKey);
            }
        });
    }
}

// 认证中间件
async function withAuth(context, req, requiredRoles = []) {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new Error('Missing or invalid authorization header');
    }
    
    const token = authHeader.substring(7);
    const auth = new AzureADAuth();
    
    try {
        const decoded = await auth.verifyToken(token);
        
        // 检查角色权限
        if (requiredRoles.length > 0) {
            const userRoles = decoded.roles || [];
            const hasRequiredRole = requiredRoles.some(role => userRoles.includes(role));
            
            if (!hasRequiredRole) {
                throw new Error('Insufficient permissions');
            }
        }
        
        return {
            userId: decoded.sub,
            email: decoded.email,
            name: decoded.name,
            roles: decoded.roles || []
        };
    } catch (error) {
        context.log.error('Authentication failed:', error);
        throw new Error('Invalid token');
    }
}

// 受保护的函数
module.exports = async function (context, req) {
    try {
        // 验证身份和权限
        const user = await withAuth(context, req, ['User.Read']);
        
        // 处理业务逻辑
        const result = await processUserRequest(req.body, user);
        
        context.res = {
            status: 200,
            body: result
        };
    } catch (error) {
        const statusCode = error.message.includes('token') || error.message.includes('authorization') ? 401 : 403;
        
        context.res = {
            status: statusCode,
            body: { error: error.message }
        };
    }
};
```

### 2. 密钥管理

```javascript
// Azure Key Vault 集成
const { SecretClient } = require('@azure/keyvault-secrets');
const { DefaultAzureCredential } = require('@azure/identity');

class KeyVaultManager {
    constructor() {
        const keyVaultName = process.env.KEY_VAULT_NAME;
        const keyVaultUri = `https://${keyVaultName}.vault.azure.net/`;
        
        this.client = new SecretClient(keyVaultUri, new DefaultAzureCredential());
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5分钟缓存
    }
    
    async getSecret(secretName) {
        const cacheKey = `secret:${secretName}`;
        const cached = this.cache.get(cacheKey);
        
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.value;
        }
        
        try {
            const secret = await this.client.getSecret(secretName);
            
            this.cache.set(cacheKey, {
                value: secret.value,
                timestamp: Date.now()
            });
            
            return secret.value;
        } catch (error) {
            console.error(`Failed to get secret ${secretName}:`, error);
            throw error;
        }
    }
    
    async setSecret(secretName, secretValue) {
        try {
            await this.client.setSecret(secretName, secretValue);
            
            // 更新缓存
            this.cache.set(`secret:${secretName}`, {
                value: secretValue,
                timestamp: Date.now()
            });
            
            return true;
        } catch (error) {
            console.error(`Failed to set secret ${secretName}:`, error);
            throw error;
        }
    }
}

// 配置管理
class ConfigManager {
    constructor() {
        this.keyVault = new KeyVaultManager();
    }
    
    async getDatabaseConnectionString() {
        return await this.keyVault.getSecret('database-connection-string');
    }
    
    async getApiKey(serviceName) {
        return await this.keyVault.getSecret(`${serviceName}-api-key`);
    }
    
    async getJwtSecret() {
        return await this.keyVault.getSecret('jwt-secret');
    }
}

// 使用配置管理
const configManager = new ConfigManager();

module.exports = async function (context, req) {
    try {
        // 获取配置
        const dbConnectionString = await configManager.getDatabaseConnectionString();
        const apiKey = await configManager.getApiKey('third-party-service');
        
        // 使用配置处理请求
        const result = await processWithConfig(req, { dbConnectionString, apiKey });
        
        context.res = {
            status: 200,
            body: result
        };
    } catch (error) {
        context.log.error('Configuration error:', error);
        context.res = {
            status: 500,
            body: { error: 'Configuration error' }
        };
    }
};
```

## 📊 监控和诊断

### 1. Application Insights 集成

```javascript
// Application Insights 自定义遥测
const appInsights = require('applicationinsights');

// 在函数应用启动时初始化
if (process.env.APPINSIGHTS_INSTRUMENTATIONKEY) {
    appInsights.setup(process.env.APPINSIGHTS_INSTRUMENTATIONKEY)
        .setAutoDependencyCorrelation(true)
        .setAutoCollectRequests(true)
        .setAutoCollectPerformance(true, true)
        .setAutoCollectExceptions(true)
        .setAutoCollectDependencies(true)
        .setAutoCollectConsole(true)
        .start();
}

class TelemetryCollector {
    constructor(context) {
        this.context = context;
        this.client = appInsights.defaultClient;
    }
    
    trackEvent(name, properties = {}, measurements = {}) {
        this.client.trackEvent({
            name,
            properties: {
                ...properties,
                functionName: this.context.executionContext.functionName,
                invocationId: this.context.invocationId
            },
            measurements
        });
    }
    
    trackMetric(name, value, properties = {}) {
        this.client.trackMetric({
            name,
            value,
            properties: {
                ...properties,
                functionName: this.context.executionContext.functionName
            }
        });
    }
    
    trackDependency(dependencyTypeName, name, data, duration, success) {
        this.client.trackDependency({
            dependencyTypeName,
            name,
            data,
            duration,
            success,
            properties: {
                functionName: this.context.executionContext.functionName,
                invocationId: this.context.invocationId
            }
        });
    }
    
    trackException(exception, properties = {}) {
        this.client.trackException({
            exception,
            properties: {
                ...properties,
                functionName: this.context.executionContext.functionName,
                invocationId: this.context.invocationId
            }
        });
    }
}

// 性能监控装饰器
function withTelemetry(operationName) {
    return function(target, propertyName, descriptor) {
        const method = descriptor.value;
        
        descriptor.value = async function(context, ...args) {
            const telemetry = new TelemetryCollector(context);
            const startTime = Date.now();
            
            try {
                const result = await method.apply(this, [context, ...args]);
                
                const duration = Date.now() - startTime;
                telemetry.trackDependency('Function', operationName, '', duration, true);
                telemetry.trackMetric(`${operationName}.Duration`, duration);
                
                return result;
            } catch (error) {
                const duration = Date.now() - startTime;
                telemetry.trackDependency('Function', operationName, '', duration, false);
                telemetry.trackException(error);
                
                throw error;
            }
        };
    };
}

// 使用遥测
class BusinessService {
    @withTelemetry('ProcessOrder')
    async processOrder(context, orderData) {
        const telemetry = new TelemetryCollector(context);
        
        telemetry.trackEvent('OrderProcessingStarted', {
            orderId: orderData.id,
            customerId: orderData.customerId
        });
        
        // 处理订单逻辑
        const result = await this.handleOrder(orderData);
        
        telemetry.trackEvent('OrderProcessingCompleted', {
            orderId: orderData.id,
            status: result.status
        });
        
        return result;
    }
}
```

### 2. 健康检查和诊断

```javascript
// 健康检查函数
module.exports = async function (context, req) {
    const healthChecks = [];
    
    try {
        // 检查数据库连接
        const dbHealth = await checkDatabaseHealth();
        healthChecks.push({
            name: 'Database',
            status: dbHealth.status,
            responseTime: dbHealth.responseTime,
            details: dbHealth.details
        });
        
        // 检查外部API
        const apiHealth = await checkExternalApiHealth();
        healthChecks.push({
            name: 'ExternalAPI',
            status: apiHealth.status,
            responseTime: apiHealth.responseTime,
            details: apiHealth.details
        });
        
        // 检查存储账户
        const storageHealth = await checkStorageHealth();
        healthChecks.push({
            name: 'Storage',
            status: storageHealth.status,
            responseTime: storageHealth.responseTime,
            details: storageHealth.details
        });
        
        // 计算总体健康状态
        const overallStatus = healthChecks.every(check => check.status === 'healthy') ? 'healthy' : 'unhealthy';
        
        const healthReport = {
            status: overallStatus,
            timestamp: new Date().toISOString(),
            checks: healthChecks,
            version: process.env.FUNCTION_APP_VERSION || '1.0.0'
        };
        
        context.res = {
            status: overallStatus === 'healthy' ? 200 : 503,
            headers: { 'Content-Type': 'application/json' },
            body: healthReport
        };
    } catch (error) {
        context.log.error('Health check failed:', error);
        
        context.res = {
            status: 503,
            body: {
                status: 'unhealthy',
                error: error.message,
                timestamp: new Date().toISOString()
            }
        };
    }
};

async function checkDatabaseHealth() {
    const startTime = Date.now();
    
    try {
        // 执行简单的数据库查询
        await database.query('SELECT 1');
        
        return {
            status: 'healthy',
            responseTime: Date.now() - startTime,
            details: 'Database connection successful'
        };
    } catch (error) {
        return {
            status: 'unhealthy',
            responseTime: Date.now() - startTime,
            details: error.message
        };
    }
}

async function checkExternalApiHealth() {
    const startTime = Date.now();
    
    try {
        const response = await fetch('https://api.example.com/health', {
            timeout: 5000
        });
        
        return {
            status: response.ok ? 'healthy' : 'unhealthy',
            responseTime: Date.now() - startTime,
            details: `API responded with status ${response.status}`
        };
    } catch (error) {
        return {
            status: 'unhealthy',
            responseTime: Date.now() - startTime,
            details: error.message
        };
    }
}
```

## 🚀 实际应用示例

### 完整的 Azure Functions 应用

```javascript
// 用户管理微服务
const { CosmosClient } = require('@azure/cosmos');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// 数据库服务
class UserService {
    constructor() {
        this.cosmosClient = new CosmosClient(process.env.COSMOS_DB_CONNECTION_STRING);
        this.database = this.cosmosClient.database('UserManagement');
        this.container = this.database.container('Users');
    }
    
    async createUser(userData) {
        const { email, password, name } = userData;
        
        // 检查用户是否已存在
        const existingUser = await this.getUserByEmail(email);
        if (existingUser) {
            throw new Error('User already exists');
        }
        
        // 加密密码
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // 创建用户文档
        const user = {
            id: require('uuid').v4(),
            email,
            name,
            password: hashedPassword,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isActive: true
        };
        
        const { resource } = await this.container.items.create(user);
        
        // 不返回密码
        delete resource.password;
        return resource;
    }
    
    async getUserByEmail(email) {
        const querySpec = {
            query: 'SELECT * FROM c WHERE c.email = @email',
            parameters: [{ name: '@email', value: email }]
        };
        
        const { resources } = await this.container.items.query(querySpec).fetchAll();
        return resources[0] || null;
    }
    
    async authenticateUser(email, password) {
        const user = await this.getUserByEmail(email);
        if (!user) {
            throw new Error('Invalid credentials');
        }
        
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            throw new Error('Invalid credentials');
        }
        
        // 生成 JWT
        const token = jwt.sign(
            { userId: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );
        
        delete user.password;
        return { user, token };
    }
}

// 用户注册函数
module.exports.register = async function (context, req) {
    const telemetry = new TelemetryCollector(context);
    
    try {
        telemetry.trackEvent('UserRegistrationStarted');
        
        const userService = new UserService();
        const user = await userService.createUser(req.body);
        
        // 输出到 Service Bus 用于发送欢迎邮件
        context.bindings.welcomeEmailMessage = {
            type: 'welcome-email',
            userId: user.id,
            email: user.email,
            name: user.name
        };
        
        telemetry.trackEvent('UserRegistrationCompleted', {
            userId: user.id
        });
        
        context.res = {
            status: 201,
            body: user
        };
    } catch (error) {
        telemetry.trackException(error);
        
        context.res = {
            status: 400,
            body: { error: error.message }
        };
    }
};

// 用户登录函数
module.exports.login = async function (context, req) {
    const telemetry = new TelemetryCollector(context);
    
    try {
        telemetry.trackEvent('UserLoginAttempt');
        
        const { email, password } = req.body;
        const userService = new UserService();
        const result = await userService.authenticateUser(email, password);
        
        telemetry.trackEvent('UserLoginSuccess', {
            userId: result.user.id
        });
        
        context.res = {
            status: 200,
            body: result
        };
    } catch (error) {
        telemetry.trackEvent('UserLoginFailed');
        telemetry.trackException(error);
        
        context.res = {
            status: 401,
            body: { error: error.message }
        };
    }
};

// 欢迎邮件处理函数
module.exports.sendWelcomeEmail = async function (context, message) {
    const { SendGridAPIClient } = require('@sendgrid/mail');
    
    try {
        const sendgrid = new SendGridAPIClient(process.env.SENDGRID_API_KEY);
        
        const msg = {
            to: message.email,
            from: process.env.FROM_EMAIL,
            subject: 'Welcome to Our Platform!',
            html: `
                <h1>Welcome, ${message.name}!</h1>
                <p>Thank you for joining our platform.</p>
                <p>Your account has been successfully created.</p>
            `
        };
        
        await sendgrid.send(msg);
        
        context.log(`Welcome email sent to ${message.email}`);
    } catch (error) {
        context.log.error('Failed to send welcome email:', error);
        throw error;
    }
};
```

## 📚 最佳实践总结

1. **函数设计**：保持函数小而专一，单一职责
2. **冷启动优化**：最小化依赖，复用连接
3. **错误处理**：实现优雅的错误处理和重试机制
4. **监控遥测**：使用 Application Insights 进行全面监控
5. **安全性**：使用 Azure AD 和 Key Vault 管理身份和密钥
6. **性能调优**：合理配置内存和超时时间
7. **成本控制**：监控消费计划使用量

通过掌握这些 Azure Functions 技术，您将能够构建高效、安全、可扩展的无服务器应用程序。
