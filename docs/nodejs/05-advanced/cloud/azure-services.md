# Azure云服务

## 📖 概述

Microsoft Azure 是微软的云计算平台，提供超过200种服务，包括计算、存储、网络、数据库、AI和机器学习等。本文档将详细介绍如何在Node.js应用中集成各种Azure服务。

## 🎯 学习目标

- 掌握Azure SDK的使用方法
- 学习核心Azure服务的集成
- 了解Azure服务的最佳实践
- 实现安全的Azure服务访问

## 🔧 环境准备

### 1. 安装Azure SDK

```bash
# Azure核心库
npm install @azure/identity @azure/core-auth

# 存储服务
npm install @azure/storage-blob @azure/storage-queue

# 数据库服务
npm install @azure/cosmos @azure/data-tables

# 消息服务
npm install @azure/service-bus @azure/event-hubs

# AI服务
npm install @azure/cognitiveservices-textanalytics @azure/openai

# 函数和应用服务
npm install @azure/functions-core @azure/app-configuration
```

### 2. 身份验证配置

```javascript
const { DefaultAzureCredential, ClientSecretCredential } = require('@azure/identity');

// 方法1: 默认凭据链 (推荐)
const credential = new DefaultAzureCredential();

// 方法2: 服务主体认证
const credential2 = new ClientSecretCredential(
  process.env.AZURE_TENANT_ID,
  process.env.AZURE_CLIENT_ID,
  process.env.AZURE_CLIENT_SECRET
);

// 方法3: 环境变量配置
/*
AZURE_TENANT_ID=your-tenant-id
AZURE_CLIENT_ID=your-client-id
AZURE_CLIENT_SECRET=your-client-secret
AZURE_SUBSCRIPTION_ID=your-subscription-id
*/
```

## 🗄️ Blob Storage 对象存储

### 1. 基本操作

```javascript
const { BlobServiceClient } = require('@azure/storage-blob');
const { DefaultAzureCredential } = require('@azure/identity');

class AzureBlobService {
  constructor() {
    const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
    const credential = new DefaultAzureCredential();
    
    this.blobServiceClient = new BlobServiceClient(
      `https://${accountName}.blob.core.windows.net`,
      credential
    );
    
    this.containerName = process.env.AZURE_CONTAINER_NAME;
  }

  // 上传文件
  async uploadFile(fileName, fileBuffer, options = {}) {
    try {
      const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
      const blockBlobClient = containerClient.getBlockBlobClient(fileName);
      
      const uploadResponse = await blockBlobClient.upload(fileBuffer, fileBuffer.length, {
        blobHTTPHeaders: {
          blobContentType: options.contentType || 'application/octet-stream',
        },
        metadata: options.metadata || {},
        tags: options.tags || {},
      });
      
      return {
        success: true,
        etag: uploadResponse.etag,
        lastModified: uploadResponse.lastModified,
        url: blockBlobClient.url,
      };
    } catch (error) {
      throw new Error(`上传失败: ${error.message}`);
    }
  }

  // 下载文件
  async downloadFile(fileName) {
    try {
      const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
      const blockBlobClient = containerClient.getBlockBlobClient(fileName);
      
      const downloadResponse = await blockBlobClient.download();
      return downloadResponse.readableStreamBody;
    } catch (error) {
      throw new Error(`下载失败: ${error.message}`);
    }
  }

  // 生成SAS URL
  async generateSasUrl(fileName, permissions = 'r', expiryMinutes = 60) {
    const { generateBlobSASQueryParameters, BlobSASPermissions } = require('@azure/storage-blob');
    
    const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(fileName);
    
    const expiresOn = new Date();
    expiresOn.setMinutes(expiresOn.getMinutes() + expiryMinutes);
    
    const sasOptions = {
      containerName: this.containerName,
      blobName: fileName,
      permissions: BlobSASPermissions.parse(permissions),
      expiresOn,
    };
    
    const sasToken = generateBlobSASQueryParameters(
      sasOptions,
      this.blobServiceClient.credential
    ).toString();
    
    return `${blockBlobClient.url}?${sasToken}`;
  }

  // 列出文件
  async listFiles(prefix = '') {
    try {
      const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
      const files = [];
      
      for await (const blob of containerClient.listBlobsFlat({ prefix })) {
        files.push({
          name: blob.name,
          size: blob.properties.contentLength,
          lastModified: blob.properties.lastModified,
          contentType: blob.properties.contentType,
        });
      }
      
      return files;
    } catch (error) {
      throw new Error(`列出文件失败: ${error.message}`);
    }
  }

  // 删除文件
  async deleteFile(fileName) {
    try {
      const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
      const blockBlobClient = containerClient.getBlockBlobClient(fileName);
      
      await blockBlobClient.delete();
      return { success: true };
    } catch (error) {
      throw new Error(`删除失败: ${error.message}`);
    }
  }
}

// 使用示例
const blobService = new AzureBlobService();

app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const fileName = `${Date.now()}-${req.file.originalname}`;
    const result = await blobService.uploadFile(fileName, req.file.buffer, {
      contentType: req.file.mimetype,
      metadata: { uploadedBy: req.user.id },
    });
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### 2. 高级功能

```javascript
// 大文件分块上传
class AzureBlobAdvanced extends AzureBlobService {
  async uploadLargeFile(fileName, fileStream, fileSize, options = {}) {
    const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(fileName);
    
    const blockSize = 4 * 1024 * 1024; // 4MB blocks
    const blockIds = [];
    
    try {
      let offset = 0;
      let blockIndex = 0;
      
      while (offset < fileSize) {
        const blockId = Buffer.from(`block-${blockIndex.toString().padStart(6, '0')}`).toString('base64');
        const blockSize2 = Math.min(blockSize, fileSize - offset);
        
        await blockBlobClient.stageBlock(blockId, fileStream, blockSize2);
        blockIds.push(blockId);
        
        offset += blockSize2;
        blockIndex++;
      }
      
      // 提交所有块
      await blockBlobClient.commitBlockList(blockIds, {
        blobHTTPHeaders: {
          blobContentType: options.contentType,
        },
      });
      
      return { success: true, blockCount: blockIds.length };
    } catch (error) {
      throw new Error(`大文件上传失败: ${error.message}`);
    }
  }
}
```

## 🗃️ Cosmos DB 数据库

### 1. 基本操作

```javascript
const { CosmosClient } = require('@azure/cosmos');

class CosmosDBService {
  constructor() {
    this.client = new CosmosClient({
      endpoint: process.env.COSMOS_DB_ENDPOINT,
      key: process.env.COSMOS_DB_KEY,
    });
    
    this.databaseId = process.env.COSMOS_DB_DATABASE;
    this.containerId = process.env.COSMOS_DB_CONTAINER;
  }

  async getContainer() {
    const database = this.client.database(this.databaseId);
    return database.container(this.containerId);
  }

  // 创建文档
  async createDocument(document) {
    try {
      const container = await this.getContainer();
      const { resource } = await container.items.create({
        ...document,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      
      return resource;
    } catch (error) {
      throw new Error(`创建文档失败: ${error.message}`);
    }
  }

  // 获取文档
  async getDocument(id, partitionKey) {
    try {
      const container = await this.getContainer();
      const { resource } = await container.item(id, partitionKey).read();
      return resource;
    } catch (error) {
      if (error.code === 404) {
        return null;
      }
      throw new Error(`获取文档失败: ${error.message}`);
    }
  }

  // 更新文档
  async updateDocument(id, partitionKey, updates) {
    try {
      const container = await this.getContainer();
      const { resource: existingDoc } = await container.item(id, partitionKey).read();
      
      const updatedDoc = {
        ...existingDoc,
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      
      const { resource } = await container.item(id, partitionKey).replace(updatedDoc);
      return resource;
    } catch (error) {
      throw new Error(`更新文档失败: ${error.message}`);
    }
  }

  // 查询文档
  async queryDocuments(querySpec, options = {}) {
    try {
      const container = await this.getContainer();
      const { resources } = await container.items.query(querySpec, options).fetchAll();
      return resources;
    } catch (error) {
      throw new Error(`查询文档失败: ${error.message}`);
    }
  }

  // 删除文档
  async deleteDocument(id, partitionKey) {
    try {
      const container = await this.getContainer();
      await container.item(id, partitionKey).delete();
      return { success: true };
    } catch (error) {
      throw new Error(`删除文档失败: ${error.message}`);
    }
  }
}

// 使用示例
const cosmosService = new CosmosDBService();

app.post('/users', async (req, res) => {
  try {
    const user = await cosmosService.createDocument({
      id: req.body.id,
      email: req.body.email,
      name: req.body.name,
      partitionKey: req.body.email, // 使用email作为分区键
    });
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/users/search', async (req, res) => {
  try {
    const querySpec = {
      query: 'SELECT * FROM c WHERE CONTAINS(c.name, @searchTerm)',
      parameters: [
        { name: '@searchTerm', value: req.query.q }
      ],
    };
    
    const users = await cosmosService.queryDocuments(querySpec);
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### 2. 批量操作和事务

```javascript
class CosmosDBBatchService extends CosmosDBService {
  // 批量操作
  async batchOperations(operations) {
    try {
      const container = await this.getContainer();
      const { resources } = await container.items.batch(operations);
      return resources;
    } catch (error) {
      throw new Error(`批量操作失败: ${error.message}`);
    }
  }

  // 事务操作
  async transactionalBatch(partitionKey, operations) {
    try {
      const container = await this.getContainer();
      const { resources } = await container.items.batch(operations, partitionKey);
      return resources;
    } catch (error) {
      throw new Error(`事务操作失败: ${error.message}`);
    }
  }
}

// 使用示例
const batchOperations = [
  {
    operationType: 'Create',
    resourceBody: { id: '1', name: 'User 1', partitionKey: 'users' }
  },
  {
    operationType: 'Create', 
    resourceBody: { id: '2', name: 'User 2', partitionKey: 'users' }
  },
  {
    operationType: 'Upsert',
    resourceBody: { id: '3', name: 'User 3', partitionKey: 'users' }
  }
];

await cosmosService.batchOperations(batchOperations);
```

## 🚌 Service Bus 消息服务

### 1. 队列操作

```javascript
const { ServiceBusClient } = require('@azure/service-bus');

class ServiceBusService {
  constructor() {
    this.client = new ServiceBusClient(
      process.env.SERVICE_BUS_CONNECTION_STRING
    );
  }

  // 发送消息到队列
  async sendToQueue(queueName, messages) {
    const sender = this.client.createSender(queueName);
    
    try {
      if (Array.isArray(messages)) {
        await sender.sendMessages(messages);
      } else {
        await sender.sendMessages([messages]);
      }
      
      return { success: true };
    } catch (error) {
      throw new Error(`发送消息失败: ${error.message}`);
    } finally {
      await sender.close();
    }
  }

  // 接收队列消息
  async receiveFromQueue(queueName, maxMessages = 10) {
    const receiver = this.client.createReceiver(queueName);
    
    try {
      const messages = await receiver.receiveMessages(maxMessages, {
        maxWaitTimeInMs: 60000, // 60秒
      });
      
      const results = [];
      for (const message of messages) {
        try {
          // 处理消息
          const body = typeof message.body === 'string' 
            ? JSON.parse(message.body) 
            : message.body;
            
          results.push({
            messageId: message.messageId,
            body,
            enqueuedTimeUtc: message.enqueuedTimeUtc,
          });
          
          // 完成消息处理
          await receiver.completeMessage(message);
        } catch (error) {
          console.error('处理消息失败:', error);
          // 将消息标记为死信
          await receiver.deadLetterMessage(message, {
            deadLetterReason: 'ProcessingError',
            deadLetterErrorDescription: error.message,
          });
        }
      }
      
      return results;
    } catch (error) {
      throw new Error(`接收消息失败: ${error.message}`);
    } finally {
      await receiver.close();
    }
  }

  // 消息处理器
  async processQueueMessages(queueName, messageHandler) {
    const receiver = this.client.createReceiver(queueName);
    
    receiver.subscribe({
      processMessage: async (message) => {
        try {
          const body = typeof message.body === 'string' 
            ? JSON.parse(message.body) 
            : message.body;
            
          await messageHandler(body, message);
          await receiver.completeMessage(message);
        } catch (error) {
          console.error('处理消息失败:', error);
          await receiver.deadLetterMessage(message, {
            deadLetterReason: 'ProcessingError',
            deadLetterErrorDescription: error.message,
          });
        }
      },
      processError: async (args) => {
        console.error('Service Bus错误:', args.error);
      },
    });
    
    return receiver;
  }
}

// 使用示例
const serviceBusService = new ServiceBusService();

// 发送消息
app.post('/send-message', async (req, res) => {
  try {
    await serviceBusService.sendToQueue('processing-queue', {
      body: {
        taskType: 'process-order',
        orderId: req.body.orderId,
        userId: req.body.userId,
      },
      applicationProperties: {
        priority: req.body.priority || 'normal',
        source: 'api',
      },
    });
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 消息处理器
serviceBusService.processQueueMessages('processing-queue', async (message, rawMessage) => {
  console.log('处理消息:', message);
  
  switch (message.taskType) {
    case 'process-order':
      await processOrder(message.orderId);
      break;
    case 'send-email':
      await sendEmail(message.recipient, message.content);
      break;
    default:
      console.warn('未知任务类型:', message.taskType);
  }
});
```

### 2. 主题和订阅

```javascript
class ServiceBusTopicService extends ServiceBusService {
  // 发送到主题
  async sendToTopic(topicName, message) {
    const sender = this.client.createSender(topicName);
    
    try {
      await sender.sendMessages([message]);
      return { success: true };
    } finally {
      await sender.close();
    }
  }

  // 订阅主题消息
  async subscribeToTopic(topicName, subscriptionName, messageHandler) {
    const receiver = this.client.createReceiver(topicName, subscriptionName);
    
    receiver.subscribe({
      processMessage: async (message) => {
        try {
          const body = typeof message.body === 'string' 
            ? JSON.parse(message.body) 
            : message.body;
            
          await messageHandler(body, message);
          await receiver.completeMessage(message);
        } catch (error) {
          console.error('处理主题消息失败:', error);
          await receiver.deadLetterMessage(message);
        }
      },
      processError: async (args) => {
        console.error('主题订阅错误:', args.error);
      },
    });
    
    return receiver;
  }
}

// 使用示例
const topicService = new ServiceBusTopicService();

// 发布事件
await topicService.sendToTopic('user-events', {
  body: {
    eventType: 'user-registered',
    userId: '12345',
    email: 'user@example.com',
    timestamp: new Date().toISOString(),
  },
  applicationProperties: {
    eventType: 'user-registered',
  },
});

// 订阅事件
topicService.subscribeToTopic('user-events', 'email-service', async (message) => {
  if (message.eventType === 'user-registered') {
    await sendWelcomeEmail(message.email);
  }
});
```

## 🧠 Cognitive Services AI服务

### 1. 文本分析

```javascript
const { TextAnalyticsClient } = require('@azure/cognitiveservices-textanalytics');

class TextAnalyticsService {
  constructor() {
    this.client = new TextAnalyticsClient(
      process.env.TEXT_ANALYTICS_ENDPOINT,
      new DefaultAzureCredential()
    );
  }

  // 情感分析
  async analyzeSentiment(documents) {
    try {
      const results = await this.client.analyzeSentiment(documents);
      
      return results.map(result => ({
        id: result.id,
        sentiment: result.sentiment,
        confidence: result.confidenceScores,
        sentences: result.sentences?.map(sentence => ({
          text: sentence.text,
          sentiment: sentence.sentiment,
          confidence: sentence.confidenceScores,
        })),
      }));
    } catch (error) {
      throw new Error(`情感分析失败: ${error.message}`);
    }
  }

  // 关键词提取
  async extractKeyPhrases(documents) {
    try {
      const results = await this.client.extractKeyPhrases(documents);
      
      return results.map(result => ({
        id: result.id,
        keyPhrases: result.keyPhrases,
      }));
    } catch (error) {
      throw new Error(`关键词提取失败: ${error.message}`);
    }
  }

  // 实体识别
  async recognizeEntities(documents) {
    try {
      const results = await this.client.recognizeEntities(documents);
      
      return results.map(result => ({
        id: result.id,
        entities: result.entities?.map(entity => ({
          text: entity.text,
          category: entity.category,
          confidence: entity.confidenceScore,
          offset: entity.offset,
          length: entity.length,
        })),
      }));
    } catch (error) {
      throw new Error(`实体识别失败: ${error.message}`);
    }
  }

  // 语言检测
  async detectLanguage(documents) {
    try {
      const results = await this.client.detectLanguage(documents);
      
      return results.map(result => ({
        id: result.id,
        primaryLanguage: result.primaryLanguage,
      }));
    } catch (error) {
      throw new Error(`语言检测失败: ${error.message}`);
    }
  }
}

// 使用示例
const textAnalytics = new TextAnalyticsService();

app.post('/analyze-text', async (req, res) => {
  try {
    const documents = [
      { id: '1', text: req.body.text, language: 'zh' }
    ];
    
    const [sentiment, keyPhrases, entities] = await Promise.all([
      textAnalytics.analyzeSentiment(documents),
      textAnalytics.extractKeyPhrases(documents),
      textAnalytics.recognizeEntities(documents),
    ]);
    
    res.json({
      sentiment: sentiment[0],
      keyPhrases: keyPhrases[0],
      entities: entities[0],
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### 2. OpenAI 集成

```javascript
const { OpenAIClient } = require('@azure/openai');

class AzureOpenAIService {
  constructor() {
    this.client = new OpenAIClient(
      process.env.AZURE_OPENAI_ENDPOINT,
      new DefaultAzureCredential()
    );
    this.deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT_NAME;
  }

  // 文本生成
  async generateText(prompt, options = {}) {
    try {
      const response = await this.client.getCompletions(this.deploymentName, {
        prompt: [prompt],
        maxTokens: options.maxTokens || 100,
        temperature: options.temperature || 0.7,
        topP: options.topP || 1,
        frequencyPenalty: options.frequencyPenalty || 0,
        presencePenalty: options.presencePenalty || 0,
      });
      
      return {
        text: response.choices[0]?.text?.trim(),
        finishReason: response.choices[0]?.finishReason,
        usage: response.usage,
      };
    } catch (error) {
      throw new Error(`文本生成失败: ${error.message}`);
    }
  }

  // 聊天对话
  async chatCompletion(messages, options = {}) {
    try {
      const response = await this.client.getChatCompletions(this.deploymentName, {
        messages,
        maxTokens: options.maxTokens || 150,
        temperature: options.temperature || 0.7,
      });
      
      return {
        message: response.choices[0]?.message,
        finishReason: response.choices[0]?.finishReason,
        usage: response.usage,
      };
    } catch (error) {
      throw new Error(`聊天对话失败: ${error.message}`);
    }
  }

  // 文本嵌入
  async getEmbeddings(texts) {
    try {
      const response = await this.client.getEmbeddings(
        process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT,
        texts
      );
      
      return response.data.map(item => ({
        index: item.index,
        embedding: item.embedding,
      }));
    } catch (error) {
      throw new Error(`获取嵌入失败: ${error.message}`);
    }
  }
}

// 使用示例
const openaiService = new AzureOpenAIService();

app.post('/chat', async (req, res) => {
  try {
    const messages = [
      { role: 'system', content: '你是一个有帮助的AI助手。' },
      { role: 'user', content: req.body.message }
    ];
    
    const response = await openaiService.chatCompletion(messages);
    res.json({ reply: response.message.content });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

## 📊 Application Insights 监控

### 1. 应用监控

```javascript
const appInsights = require('applicationinsights');

class ApplicationInsightsService {
  constructor() {
    appInsights.setup(process.env.APPLICATIONINSIGHTS_CONNECTION_STRING)
      .setAutoDependencyCorrelation(true)
      .setAutoCollectRequests(true)
      .setAutoCollectPerformance(true, true)
      .setAutoCollectExceptions(true)
      .setAutoCollectDependencies(true)
      .setAutoCollectConsole(true)
      .setUseDiskRetryCaching(true)
      .start();
      
    this.client = appInsights.defaultClient;
  }

  // 记录自定义事件
  trackEvent(name, properties = {}, measurements = {}) {
    this.client.trackEvent({
      name,
      properties,
      measurements,
    });
  }

  // 记录指标
  trackMetric(name, value, properties = {}) {
    this.client.trackMetric({
      name,
      value,
      properties,
    });
  }

  // 记录异常
  trackException(exception, properties = {}) {
    this.client.trackException({
      exception,
      properties,
    });
  }

  // 记录依赖调用
  trackDependency(dependencyTypeName, name, data, duration, success, properties = {}) {
    this.client.trackDependency({
      dependencyTypeName,
      name,
      data,
      duration,
      success,
      properties,
    });
  }

  // 记录请求
  trackRequest(name, url, duration, responseCode, success, properties = {}) {
    this.client.trackRequest({
      name,
      url,
      duration,
      responseCode,
      success,
      properties,
    });
  }
}

// 使用示例
const insights = new ApplicationInsightsService();

// Express中间件
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    insights.trackRequest(
      `${req.method} ${req.path}`,
      req.url,
      duration,
      res.statusCode,
      res.statusCode < 400,
      {
        userAgent: req.get('User-Agent'),
        userId: req.user?.id,
      }
    );
  });
  
  next();
});

// 业务事件追踪
app.post('/orders', async (req, res) => {
  try {
    const order = await createOrder(req.body);
    
    insights.trackEvent('OrderCreated', {
      orderId: order.id,
      userId: req.user.id,
      amount: order.total.toString(),
    }, {
      orderValue: order.total,
    });
    
    res.json(order);
  } catch (error) {
    insights.trackException(error, {
      operation: 'createOrder',
      userId: req.user?.id,
    });
    
    res.status(500).json({ error: error.message });
  }
});
```

## 🔐 Key Vault 密钥管理

### 1. 密钥和机密管理

```javascript
const { SecretClient } = require('@azure/keyvault-secrets');
const { DefaultAzureCredential } = require('@azure/identity');

class KeyVaultService {
  constructor() {
    const vaultUrl = `https://${process.env.KEY_VAULT_NAME}.vault.azure.net/`;
    this.client = new SecretClient(vaultUrl, new DefaultAzureCredential());
  }

  // 获取密钥
  async getSecret(secretName) {
    try {
      const secret = await this.client.getSecret(secretName);
      return secret.value;
    } catch (error) {
      throw new Error(`获取密钥失败: ${error.message}`);
    }
  }

  // 设置密钥
  async setSecret(secretName, secretValue, options = {}) {
    try {
      const secret = await this.client.setSecret(secretName, secretValue, {
        expiresOn: options.expiresOn,
        notBefore: options.notBefore,
        enabled: options.enabled !== false,
        tags: options.tags,
      });
      
      return {
        name: secret.name,
        version: secret.properties.version,
        createdOn: secret.properties.createdOn,
      };
    } catch (error) {
      throw new Error(`设置密钥失败: ${error.message}`);
    }
  }

  // 删除密钥
  async deleteSecret(secretName) {
    try {
      const deletePoller = await this.client.beginDeleteSecret(secretName);
      await deletePoller.pollUntilDone();
      return { success: true };
    } catch (error) {
      throw new Error(`删除密钥失败: ${error.message}`);
    }
  }

  // 列出密钥
  async listSecrets() {
    try {
      const secrets = [];
      for await (const secretProperties of this.client.listPropertiesOfSecrets()) {
        secrets.push({
          name: secretProperties.name,
          version: secretProperties.version,
          enabled: secretProperties.enabled,
          createdOn: secretProperties.createdOn,
          updatedOn: secretProperties.updatedOn,
        });
      }
      return secrets;
    } catch (error) {
      throw new Error(`列出密钥失败: ${error.message}`);
    }
  }
}

// 配置管理器
class ConfigManager {
  constructor() {
    this.keyVault = new KeyVaultService();
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5分钟缓存
  }

  async getConfig(key) {
    const cacheKey = `config:${key}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.value;
    }
    
    try {
      const value = await this.keyVault.getSecret(key);
      this.cache.set(cacheKey, {
        value,
        timestamp: Date.now(),
      });
      
      return value;
    } catch (error) {
      // 如果Key Vault不可用，返回环境变量
      return process.env[key];
    }
  }
}

// 使用示例
const configManager = new ConfigManager();

// 在应用启动时获取配置
async function initializeApp() {
  try {
    const dbConnectionString = await configManager.getConfig('DATABASE_CONNECTION_STRING');
    const jwtSecret = await configManager.getConfig('JWT_SECRET');
    const apiKey = await configManager.getConfig('THIRD_PARTY_API_KEY');
    
    // 使用配置初始化服务
    console.log('配置加载成功');
  } catch (error) {
    console.error('配置加载失败:', error);
    process.exit(1);
  }
}

initializeApp();
```

## 🚀 实际应用示例

### 完整的Azure集成应用

```javascript
const express = require('express');
const multer = require('multer');

class AzureIntegratedService {
  constructor() {
    this.blobService = new AzureBlobService();
    this.cosmosService = new CosmosDBService();
    this.serviceBusService = new ServiceBusService();
    this.textAnalytics = new TextAnalyticsService();
    this.insights = new ApplicationInsightsService();
    this.configManager = new ConfigManager();
  }

  async processFileUpload(file, userId, metadata = {}) {
    const fileId = require('uuid').v4();
    const fileName = `${userId}/${fileId}-${file.originalname}`;
    
    try {
      // 1. 上传到Blob Storage
      const uploadResult = await this.blobService.uploadFile(fileName, file.buffer, {
        contentType: file.mimetype,
        metadata: { ...metadata, uploadedBy: userId },
      });
      
      // 2. 记录到Cosmos DB
      const document = await this.cosmosService.createDocument({
        id: fileId,
        userId,
        fileName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
        blobName: fileName,
        status: 'uploaded',
        partitionKey: userId,
      });
      
      // 3. 发送处理消息
      await this.serviceBusService.sendToQueue('file-processing', {
        body: {
          fileId,
          blobName: fileName,
          mimeType: file.mimetype,
          userId,
        },
        applicationProperties: {
          fileType: file.mimetype,
        },
      });
      
      // 4. 记录事件
      this.insights.trackEvent('FileUploaded', {
        fileId,
        userId,
        fileSize: file.size.toString(),
        mimeType: file.mimetype,
      });
      
      return {
        fileId,
        status: 'uploaded',
        url: uploadResult.url,
      };
    } catch (error) {
      this.insights.trackException(error, {
        operation: 'fileUpload',
        userId,
      });
      
      throw error;
    }
  }

  async analyzeText(text, userId) {
    try {
      const documents = [{ id: '1', text, language: 'zh' }];
      
      const [sentiment, keyPhrases, entities] = await Promise.all([
        this.textAnalytics.analyzeSentiment(documents),
        this.textAnalytics.extractKeyPhrases(documents),
        this.textAnalytics.recognizeEntities(documents),
      ]);
      
      const analysisResult = {
        sentiment: sentiment[0],
        keyPhrases: keyPhrases[0],
        entities: entities[0],
        analyzedAt: new Date().toISOString(),
      };
      
      // 保存分析结果
      await this.cosmosService.createDocument({
        id: require('uuid').v4(),
        userId,
        type: 'text-analysis',
        originalText: text,
        analysis: analysisResult,
        partitionKey: userId,
      });
      
      return analysisResult;
    } catch (error) {
      this.insights.trackException(error, {
        operation: 'textAnalysis',
        userId,
      });
      
      throw error;
    }
  }
}

// Express应用
const app = express();
const upload = multer({ storage: multer.memoryStorage() });
const azureService = new AzureIntegratedService();

app.use(express.json());

// 文件上传
app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const result = await azureService.processFileUpload(
      req.file,
      req.user.id,
      { source: 'web-upload' }
    );
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 文本分析
app.post('/analyze-text', async (req, res) => {
  try {
    const result = await azureService.analyzeText(req.body.text, req.user.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 获取用户文件
app.get('/files', async (req, res) => {
  try {
    const files = await azureService.cosmosService.queryDocuments({
      query: 'SELECT * FROM c WHERE c.userId = @userId AND c.type != @excludeType',
      parameters: [
        { name: '@userId', value: req.user.id },
        { name: '@excludeType', value: 'text-analysis' }
      ],
    });
    
    res.json(files);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => {
  console.log('Azure集成应用启动在端口 3000');
});
```

## 📚 最佳实践总结

1. **身份验证**：使用DefaultAzureCredential进行统一身份验证
2. **错误处理**：实现重试机制和优雅降级
3. **监控**：使用Application Insights进行全面监控
4. **配置管理**：使用Key Vault管理敏感配置
5. **资源管理**：正确关闭客户端连接和资源
6. **性能优化**：使用连接池和批量操作
7. **安全性**：遵循最小权限原则配置RBAC

通过掌握这些Azure服务集成技术，您将能够构建强大、可扩展的云原生Node.js应用程序。
