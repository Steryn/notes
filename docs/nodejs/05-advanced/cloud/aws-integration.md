# AWS服务集成

## 📖 概述

Amazon Web Services (AWS) 是全球领先的云计算平台，提供超过200种功能齐全的服务。本文档将详细介绍如何在Node.js应用中集成各种AWS服务，包括计算、存储、数据库、消息传递等核心服务。

## 🎯 学习目标

- 掌握AWS SDK的使用方法
- 学习核心AWS服务的集成
- 了解AWS服务的最佳实践
- 实现安全的AWS服务访问

## 🔧 环境准备

### 1. 安装AWS SDK

```bash
# 安装AWS SDK v3
npm install @aws-sdk/client-s3 @aws-sdk/client-dynamodb @aws-sdk/client-lambda
npm install @aws-sdk/client-ses @aws-sdk/client-sqs @aws-sdk/client-sns

# 或者安装完整的SDK v2 (不推荐)
npm install aws-sdk
```

### 2. 配置AWS凭证

```javascript
// 方法1: 环境变量
process.env.AWS_ACCESS_KEY_ID = 'your-access-key';
process.env.AWS_SECRET_ACCESS_KEY = 'your-secret-key';
process.env.AWS_REGION = 'us-east-1';

// 方法2: AWS配置文件 ~/.aws/credentials
/*
[default]
aws_access_key_id = your-access-key
aws_secret_access_key = your-secret-key
region = us-east-1
*/

// 方法3: IAM角色 (推荐用于EC2/Lambda)
const { fromInstanceMetadata } = require('@aws-sdk/credential-providers');

const credentials = fromInstanceMetadata({
  timeout: 1000,
  maxRetries: 3,
});
```

## 🗄️ S3 对象存储

### 1. 基本操作

```javascript
const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

class S3Service {
  constructor() {
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
    this.bucketName = process.env.S3_BUCKET_NAME;
  }

  // 上传文件
  async uploadFile(key, body, contentType = 'application/octet-stream') {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: body,
      ContentType: contentType,
      ServerSideEncryption: 'AES256',
    });

    try {
      const response = await this.s3Client.send(command);
      return {
        success: true,
        etag: response.ETag,
        location: `https://${this.bucketName}.s3.amazonaws.com/${key}`,
      };
    } catch (error) {
      throw new Error(`上传失败: ${error.message}`);
    }
  }

  // 下载文件
  async downloadFile(key) {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    try {
      const response = await this.s3Client.send(command);
      return response.Body;
    } catch (error) {
      throw new Error(`下载失败: ${error.message}`);
    }
  }

  // 生成预签名URL
  async generatePresignedUrl(key, expiresIn = 3600) {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    return await getSignedUrl(this.s3Client, command, { expiresIn });
  }

  // 删除文件
  async deleteFile(key) {
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    try {
      await this.s3Client.send(command);
      return { success: true };
    } catch (error) {
      throw new Error(`删除失败: ${error.message}`);
    }
  }
}

// 使用示例
const s3Service = new S3Service();

// Express路由示例
app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const key = `uploads/${Date.now()}-${req.file.originalname}`;
    const result = await s3Service.uploadFile(key, req.file.buffer, req.file.mimetype);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### 2. 高级功能

```javascript
// 多部分上传 (大文件)
const { CreateMultipartUploadCommand, UploadPartCommand, CompleteMultipartUploadCommand } = require('@aws-sdk/client-s3');

class S3MultipartUpload {
  async uploadLargeFile(key, file, partSize = 5 * 1024 * 1024) { // 5MB parts
    const { UploadId } = await this.s3Client.send(new CreateMultipartUploadCommand({
      Bucket: this.bucketName,
      Key: key,
    }));

    const parts = [];
    const totalParts = Math.ceil(file.length / partSize);

    for (let i = 0; i < totalParts; i++) {
      const start = i * partSize;
      const end = Math.min(start + partSize, file.length);
      const partBody = file.slice(start, end);

      const uploadPartResponse = await this.s3Client.send(new UploadPartCommand({
        Bucket: this.bucketName,
        Key: key,
        UploadId,
        PartNumber: i + 1,
        Body: partBody,
      }));

      parts.push({
        ETag: uploadPartResponse.ETag,
        PartNumber: i + 1,
      });
    }

    await this.s3Client.send(new CompleteMultipartUploadCommand({
      Bucket: this.bucketName,
      Key: key,
      UploadId,
      MultipartUpload: { Parts: parts },
    }));

    return { success: true, key };
  }
}
```

## 🗃️ DynamoDB 数据库

### 1. 基本操作

```javascript
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand, DeleteCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');

class DynamoDBService {
  constructor() {
    const client = new DynamoDBClient({
      region: process.env.AWS_REGION,
    });
    this.docClient = DynamoDBDocumentClient.from(client);
    this.tableName = process.env.DYNAMODB_TABLE_NAME;
  }

  // 创建项目
  async createItem(item) {
    const command = new PutCommand({
      TableName: this.tableName,
      Item: {
        ...item,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      ConditionExpression: 'attribute_not_exists(id)', // 防止覆盖
    });

    try {
      await this.docClient.send(command);
      return { success: true, item };
    } catch (error) {
      if (error.name === 'ConditionalCheckFailedException') {
        throw new Error('项目已存在');
      }
      throw error;
    }
  }

  // 获取项目
  async getItem(id) {
    const command = new GetCommand({
      TableName: this.tableName,
      Key: { id },
    });

    const response = await this.docClient.send(command);
    return response.Item;
  }

  // 更新项目
  async updateItem(id, updates) {
    const updateExpression = [];
    const expressionAttributeNames = {};
    const expressionAttributeValues = {};

    Object.keys(updates).forEach((key, index) => {
      const nameKey = `#attr${index}`;
      const valueKey = `:val${index}`;
      
      updateExpression.push(`${nameKey} = ${valueKey}`);
      expressionAttributeNames[nameKey] = key;
      expressionAttributeValues[valueKey] = updates[key];
    });

    // 添加更新时间
    updateExpression.push('#updatedAt = :updatedAt');
    expressionAttributeNames['#updatedAt'] = 'updatedAt';
    expressionAttributeValues[':updatedAt'] = new Date().toISOString();

    const command = new UpdateCommand({
      TableName: this.tableName,
      Key: { id },
      UpdateExpression: `SET ${updateExpression.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW',
    });

    const response = await this.docClient.send(command);
    return response.Attributes;
  }

  // 查询项目
  async queryItems(partitionKey, options = {}) {
    const command = new QueryCommand({
      TableName: this.tableName,
      KeyConditionExpression: 'pk = :pk',
      ExpressionAttributeValues: {
        ':pk': partitionKey,
      },
      ...options,
    });

    const response = await this.docClient.send(command);
    return {
      items: response.Items,
      lastEvaluatedKey: response.LastEvaluatedKey,
      count: response.Count,
    };
  }

  // 删除项目
  async deleteItem(id) {
    const command = new DeleteCommand({
      TableName: this.tableName,
      Key: { id },
      ReturnValues: 'ALL_OLD',
    });

    const response = await this.docClient.send(command);
    return response.Attributes;
  }
}

// 使用示例
const dynamoService = new DynamoDBService();

app.post('/users', async (req, res) => {
  try {
    const user = await dynamoService.createItem({
      id: req.body.id,
      name: req.body.name,
      email: req.body.email,
    });
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
```

### 2. 批量操作

```javascript
const { BatchWriteCommand, BatchGetCommand } = require('@aws-sdk/lib-dynamodb');

class DynamoBatchService extends DynamoDBService {
  // 批量写入
  async batchWrite(items, deleteKeys = []) {
    const requests = [];

    // 添加写入请求
    items.forEach(item => {
      requests.push({
        PutRequest: { Item: item }
      });
    });

    // 添加删除请求
    deleteKeys.forEach(key => {
      requests.push({
        DeleteRequest: { Key: key }
      });
    });

    // 分批处理 (DynamoDB限制每批25个)
    const batches = [];
    for (let i = 0; i < requests.length; i += 25) {
      batches.push(requests.slice(i, i + 25));
    }

    const results = [];
    for (const batch of batches) {
      const command = new BatchWriteCommand({
        RequestItems: {
          [this.tableName]: batch
        }
      });

      const response = await this.docClient.send(command);
      results.push(response);
    }

    return results;
  }

  // 批量获取
  async batchGet(keys) {
    const batches = [];
    for (let i = 0; i < keys.length; i += 100) { // DynamoDB限制每批100个
      batches.push(keys.slice(i, i + 100));
    }

    const allItems = [];
    for (const batch of batches) {
      const command = new BatchGetCommand({
        RequestItems: {
          [this.tableName]: {
            Keys: batch
          }
        }
      });

      const response = await this.docClient.send(command);
      allItems.push(...(response.Responses[this.tableName] || []));
    }

    return allItems;
  }
}
```

## 🔗 Lambda 函数调用

### 1. 调用Lambda函数

```javascript
const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');

class LambdaService {
  constructor() {
    this.lambdaClient = new LambdaClient({
      region: process.env.AWS_REGION,
    });
  }

  // 同步调用
  async invokeFunction(functionName, payload = {}) {
    const command = new InvokeCommand({
      FunctionName: functionName,
      InvocationType: 'RequestResponse', // 同步调用
      Payload: JSON.stringify(payload),
    });

    try {
      const response = await this.lambdaClient.send(command);
      
      if (response.FunctionError) {
        throw new Error(`Lambda错误: ${response.FunctionError}`);
      }

      const result = JSON.parse(new TextDecoder().decode(response.Payload));
      return result;
    } catch (error) {
      throw new Error(`调用Lambda失败: ${error.message}`);
    }
  }

  // 异步调用
  async invokeAsync(functionName, payload = {}) {
    const command = new InvokeCommand({
      FunctionName: functionName,
      InvocationType: 'Event', // 异步调用
      Payload: JSON.stringify(payload),
    });

    const response = await this.lambdaClient.send(command);
    return { statusCode: response.StatusCode };
  }
}

// 使用示例
const lambdaService = new LambdaService();

app.post('/process', async (req, res) => {
  try {
    const result = await lambdaService.invokeFunction('data-processor', {
      data: req.body.data,
      options: req.body.options,
    });
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

## 📧 SES 邮件服务

### 1. 发送邮件

```javascript
const { SESClient, SendEmailCommand, SendTemplatedEmailCommand } = require('@aws-sdk/client-ses');

class SESService {
  constructor() {
    this.sesClient = new SESClient({
      region: process.env.AWS_REGION,
    });
    this.fromEmail = process.env.FROM_EMAIL;
  }

  // 发送简单邮件
  async sendEmail(to, subject, body, isHtml = false) {
    const command = new SendEmailCommand({
      Source: this.fromEmail,
      Destination: {
        ToAddresses: Array.isArray(to) ? to : [to],
      },
      Message: {
        Subject: { Data: subject },
        Body: isHtml 
          ? { Html: { Data: body } }
          : { Text: { Data: body } },
      },
    });

    try {
      const response = await this.sesClient.send(command);
      return { messageId: response.MessageId };
    } catch (error) {
      throw new Error(`发送邮件失败: ${error.message}`);
    }
  }

  // 使用模板发送邮件
  async sendTemplatedEmail(to, templateName, templateData) {
    const command = new SendTemplatedEmailCommand({
      Source: this.fromEmail,
      Destination: {
        ToAddresses: Array.isArray(to) ? to : [to],
      },
      Template: templateName,
      TemplateData: JSON.stringify(templateData),
    });

    const response = await this.sesClient.send(command);
    return { messageId: response.MessageId };
  }

  // 发送批量邮件
  async sendBulkTemplatedEmail(destinations, templateName, defaultTemplateData = {}) {
    const { SendBulkTemplatedEmailCommand } = require('@aws-sdk/client-ses');
    
    const command = new SendBulkTemplatedEmailCommand({
      Source: this.fromEmail,
      Template: templateName,
      DefaultTemplateData: JSON.stringify(defaultTemplateData),
      Destinations: destinations.map(dest => ({
        Destination: {
          ToAddresses: [dest.email],
        },
        ReplacementTemplateData: JSON.stringify(dest.templateData || {}),
      })),
    });

    const response = await this.sesClient.send(command);
    return response;
  }
}

// 使用示例
const sesService = new SESService();

app.post('/send-welcome-email', async (req, res) => {
  try {
    const result = await sesService.sendTemplatedEmail(
      req.body.email,
      'welcome-template',
      {
        userName: req.body.name,
        loginUrl: 'https://app.example.com/login',
      }
    );
    
    res.json({ success: true, messageId: result.messageId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

## 📨 SQS 消息队列

### 1. 基本操作

```javascript
const { SQSClient, SendMessageCommand, ReceiveMessageCommand, DeleteMessageCommand } = require('@aws-sdk/client-sqs');

class SQSService {
  constructor() {
    this.sqsClient = new SQSClient({
      region: process.env.AWS_REGION,
    });
    this.queueUrl = process.env.SQS_QUEUE_URL;
  }

  // 发送消息
  async sendMessage(messageBody, attributes = {}) {
    const command = new SendMessageCommand({
      QueueUrl: this.queueUrl,
      MessageBody: JSON.stringify(messageBody),
      MessageAttributes: this.formatMessageAttributes(attributes),
      DelaySeconds: 0,
    });

    const response = await this.sqsClient.send(command);
    return { messageId: response.MessageId };
  }

  // 接收消息
  async receiveMessages(maxMessages = 10, waitTimeSeconds = 20) {
    const command = new ReceiveMessageCommand({
      QueueUrl: this.queueUrl,
      MaxNumberOfMessages: maxMessages,
      WaitTimeSeconds: waitTimeSeconds,
      MessageAttributeNames: ['All'],
    });

    const response = await this.sqsClient.send(command);
    return response.Messages || [];
  }

  // 删除消息
  async deleteMessage(receiptHandle) {
    const command = new DeleteMessageCommand({
      QueueUrl: this.queueUrl,
      ReceiptHandle: receiptHandle,
    });

    await this.sqsClient.send(command);
  }

  // 格式化消息属性
  formatMessageAttributes(attributes) {
    const formatted = {};
    Object.keys(attributes).forEach(key => {
      formatted[key] = {
        DataType: 'String',
        StringValue: String(attributes[key]),
      };
    });
    return formatted;
  }

  // 消息处理器
  async processMessages(handler) {
    while (true) {
      try {
        const messages = await this.receiveMessages();
        
        for (const message of messages) {
          try {
            const body = JSON.parse(message.Body);
            await handler(body, message);
            await this.deleteMessage(message.ReceiptHandle);
          } catch (error) {
            console.error('处理消息失败:', error);
            // 可以实现重试逻辑或将消息发送到死信队列
          }
        }
      } catch (error) {
        console.error('接收消息失败:', error);
        await new Promise(resolve => setTimeout(resolve, 5000)); // 等待5秒后重试
      }
    }
  }
}

// 使用示例
const sqsService = new SQSService();

// 发送消息
app.post('/queue-task', async (req, res) => {
  try {
    const result = await sqsService.sendMessage({
      taskType: 'process-image',
      imageUrl: req.body.imageUrl,
      userId: req.body.userId,
    }, {
      priority: req.body.priority || 'normal',
    });
    
    res.json({ success: true, messageId: result.messageId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 消息处理器
sqsService.processMessages(async (message, rawMessage) => {
  console.log('处理消息:', message);
  
  switch (message.taskType) {
    case 'process-image':
      await processImage(message.imageUrl, message.userId);
      break;
    case 'send-notification':
      await sendNotification(message.userId, message.content);
      break;
    default:
      console.warn('未知任务类型:', message.taskType);
  }
});
```

## 📢 SNS 通知服务

### 1. 发布消息

```javascript
const { SNSClient, PublishCommand, SubscribeCommand } = require('@aws-sdk/client-sns');

class SNSService {
  constructor() {
    this.snsClient = new SNSClient({
      region: process.env.AWS_REGION,
    });
  }

  // 发布到主题
  async publishToTopic(topicArn, message, subject = '') {
    const command = new PublishCommand({
      TopicArn: topicArn,
      Message: JSON.stringify(message),
      Subject: subject,
      MessageAttributes: {
        eventType: {
          DataType: 'String',
          StringValue: message.type || 'notification',
        },
      },
    });

    const response = await this.snsClient.send(command);
    return { messageId: response.MessageId };
  }

  // 发送SMS
  async sendSMS(phoneNumber, message) {
    const command = new PublishCommand({
      PhoneNumber: phoneNumber,
      Message: message,
    });

    const response = await this.snsClient.send(command);
    return { messageId: response.MessageId };
  }

  // 订阅主题
  async subscribeToTopic(topicArn, protocol, endpoint) {
    const command = new SubscribeCommand({
      TopicArn: topicArn,
      Protocol: protocol, // 'email', 'sms', 'http', 'https', 'sqs'
      Endpoint: endpoint,
    });

    const response = await this.snsClient.send(command);
    return { subscriptionArn: response.SubscriptionArn };
  }
}

// 使用示例
const snsService = new SNSService();

// 发布事件
app.post('/publish-event', async (req, res) => {
  try {
    const result = await snsService.publishToTopic(
      process.env.SNS_TOPIC_ARN,
      {
        type: 'user-registered',
        userId: req.body.userId,
        email: req.body.email,
        timestamp: new Date().toISOString(),
      },
      '新用户注册'
    );
    
    res.json({ success: true, messageId: result.messageId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

## 🔐 安全最佳实践

### 1. IAM角色和策略

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::my-bucket/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:Query"
      ],
      "Resource": "arn:aws:dynamodb:us-east-1:123456789012:table/MyTable"
    }
  ]
}
```

### 2. 错误处理和重试

```javascript
class AWSServiceBase {
  constructor() {
    this.maxRetries = 3;
    this.retryDelay = 1000; // 1秒
  }

  async executeWithRetry(operation, ...args) {
    let lastError;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        return await operation(...args);
      } catch (error) {
        lastError = error;
        
        // 检查是否应该重试
        if (!this.shouldRetry(error, attempt)) {
          throw error;
        }
        
        // 指数退避
        const delay = this.retryDelay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  }

  shouldRetry(error, attempt) {
    // 不重试的错误类型
    const nonRetryableErrors = [
      'ValidationException',
      'InvalidParameterException',
      'AccessDenied',
    ];
    
    if (nonRetryableErrors.includes(error.name)) {
      return false;
    }
    
    // 达到最大重试次数
    if (attempt >= this.maxRetries) {
      return false;
    }
    
    // 可重试的错误类型
    const retryableErrors = [
      'ThrottlingException',
      'ServiceUnavailable',
      'InternalServerError',
    ];
    
    return retryableErrors.includes(error.name) || error.statusCode >= 500;
  }
}
```

### 3. 监控和日志

```javascript
const AWS = require('aws-sdk');

// 启用AWS SDK日志
AWS.config.logger = console;

// 自定义日志记录
class AWSLogger {
  static logAPICall(service, operation, params, response, error) {
    const logData = {
      timestamp: new Date().toISOString(),
      service,
      operation,
      params: this.sanitizeParams(params),
      success: !error,
      error: error ? error.message : null,
      duration: response ? response.responseTime : null,
    };
    
    console.log('AWS API Call:', JSON.stringify(logData));
  }
  
  static sanitizeParams(params) {
    // 移除敏感信息
    const sanitized = { ...params };
    delete sanitized.Body; // 移除大文件内容
    delete sanitized.Payload; // 移除Lambda载荷
    return sanitized;
  }
}
```

## 📊 性能优化

### 1. 连接池和复用

```javascript
// 复用客户端实例
class AWSClientManager {
  constructor() {
    this.clients = new Map();
  }
  
  getClient(service, region = process.env.AWS_REGION) {
    const key = `${service}-${region}`;
    
    if (!this.clients.has(key)) {
      const ClientClass = this.getClientClass(service);
      this.clients.set(key, new ClientClass({ region }));
    }
    
    return this.clients.get(key);
  }
  
  getClientClass(service) {
    const clientMap = {
      s3: require('@aws-sdk/client-s3').S3Client,
      dynamodb: require('@aws-sdk/client-dynamodb').DynamoDBClient,
      lambda: require('@aws-sdk/client-lambda').LambdaClient,
      ses: require('@aws-sdk/client-ses').SESClient,
      sqs: require('@aws-sdk/client-sqs').SQSClient,
      sns: require('@aws-sdk/client-sns').SNSClient,
    };
    
    return clientMap[service];
  }
}

const clientManager = new AWSClientManager();
```

### 2. 批量操作

```javascript
// 批量处理工具类
class BatchProcessor {
  constructor(batchSize = 25) {
    this.batchSize = batchSize;
  }
  
  async processBatches(items, processor) {
    const results = [];
    
    for (let i = 0; i < items.length; i += this.batchSize) {
      const batch = items.slice(i, i + this.batchSize);
      const batchResult = await processor(batch);
      results.push(batchResult);
    }
    
    return results;
  }
}

// 使用示例
const batchProcessor = new BatchProcessor(25);

await batchProcessor.processBatches(largeDataSet, async (batch) => {
  return await dynamoService.batchWrite(batch);
});
```

## 🚀 实际应用示例

### 完整的文件处理服务

```javascript
const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

class FileProcessingService {
  constructor() {
    this.s3Service = new S3Service();
    this.lambdaService = new LambdaService();
    this.sqsService = new SQSService();
    this.dynamoService = new DynamoDBService();
  }

  async processFileUpload(file, userId) {
    const fileId = uuidv4();
    const key = `uploads/${userId}/${fileId}-${file.originalname}`;
    
    try {
      // 1. 上传到S3
      const uploadResult = await this.s3Service.uploadFile(key, file.buffer, file.mimetype);
      
      // 2. 记录到数据库
      await this.dynamoService.createItem({
        id: fileId,
        userId,
        fileName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
        s3Key: key,
        status: 'uploaded',
      });
      
      // 3. 发送处理任务到队列
      await this.sqsService.sendMessage({
        taskType: 'process-file',
        fileId,
        s3Key: key,
        mimeType: file.mimetype,
      });
      
      return {
        fileId,
        status: 'uploaded',
        location: uploadResult.location,
      };
    } catch (error) {
      // 清理失败的上传
      try {
        await this.s3Service.deleteFile(key);
      } catch (cleanupError) {
        console.error('清理失败:', cleanupError);
      }
      
      throw error;
    }
  }
}

// Express应用
const app = express();
const upload = multer({ storage: multer.memoryStorage() });
const fileService = new FileProcessingService();

app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const result = await fileService.processFileUpload(req.file, req.user.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => {
  console.log('文件处理服务启动在端口 3000');
});
```

## 📚 最佳实践总结

1. **使用IAM角色**：避免在代码中硬编码访问密钥
2. **实现重试逻辑**：处理临时性错误和限流
3. **监控API调用**：记录和监控AWS服务使用情况
4. **优化批量操作**：使用批量API减少请求次数
5. **缓存客户端实例**：避免重复创建AWS服务客户端
6. **错误处理**：正确处理和记录AWS服务错误
7. **安全配置**：使用最小权限原则配置IAM策略

通过掌握这些AWS服务集成技术，您将能够构建强大、可扩展的云原生Node.js应用程序。
