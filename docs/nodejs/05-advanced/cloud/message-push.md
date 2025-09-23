# 消息推送

## 📖 概述

消息推送是现代应用的核心功能，用于实时向用户发送通知、更新和重要信息。通过多种推送渠道（Web Push、移动推送、邮件、短信等）和智能推送策略，确保消息及时、准确地到达用户。

## 🎯 学习目标

- 掌握多渠道消息推送架构
- 学习推送策略和用户偏好管理
- 了解消息队列和批处理技术
- 掌握推送效果分析和优化

## 🏗️ 推送系统架构

### 1. 统一推送服务

```javascript
// 统一消息推送服务
class UnifiedPushService {
  constructor() {
    this.channels = {
      webPush: new WebPushChannel(),
      mobilePush: new MobilePushChannel(),
      email: new EmailChannel(),
      sms: new SMSChannel(),
      inApp: new InAppChannel()
    };
    
    this.userPreferences = new UserPreferenceManager();
    this.messageQueue = new MessageQueue();
    this.analytics = new PushAnalytics();
    this.templateEngine = new MessageTemplateEngine();
  }
  
  // 发送消息
  async sendMessage(message) {
    try {
      // 验证消息格式
      this.validateMessage(message);
      
      // 获取目标用户
      const users = await this.resolveUsers(message.recipients);
      
      // 为每个用户创建推送任务
      const pushTasks = [];
      
      for (const user of users) {
        const userPrefs = await this.userPreferences.getPreferences(user.id);
        const channels = this.selectChannels(message, userPrefs);
        
        for (const channel of channels) {
          const personalizedMessage = await this.personalizeMessage(message, user, channel);
          
          pushTasks.push({
            id: this.generateTaskId(),
            userId: user.id,
            channel: channel.name,
            message: personalizedMessage,
            priority: message.priority || 'normal',
            scheduledAt: message.scheduledAt || new Date(),
            retryPolicy: message.retryPolicy || this.getDefaultRetryPolicy()
          });
        }
      }
      
      // 添加到消息队列
      await this.messageQueue.addBatch(pushTasks);
      
      // 记录分析数据
      await this.analytics.recordMessageSent(message, pushTasks.length);
      
      return {
        success: true,
        messageId: message.id,
        tasksCreated: pushTasks.length,
        estimatedDelivery: this.estimateDeliveryTime(pushTasks)
      };
      
    } catch (error) {
      console.error('发送消息失败:', error);
      await this.analytics.recordError(message, error);
      throw error;
    }
  }
  
  // 选择推送渠道
  selectChannels(message, userPreferences) {
    const availableChannels = [];
    
    // 根据消息类型和用户偏好选择渠道
    if (message.type === 'urgent' && userPreferences.allowUrgentNotifications) {
      // 紧急消息：多渠道推送
      availableChannels.push(
        this.channels.webPush,
        this.channels.mobilePush,
        this.channels.sms
      );
    } else if (message.type === 'marketing' && userPreferences.allowMarketingEmails) {
      // 营销消息：邮件为主
      availableChannels.push(this.channels.email);
      
      if (userPreferences.allowMarketingPush) {
        availableChannels.push(this.channels.webPush);
      }
    } else if (message.type === 'system') {
      // 系统消息：应用内通知
      availableChannels.push(this.channels.inApp);
      
      if (userPreferences.allowSystemNotifications) {
        availableChannels.push(this.channels.webPush);
      }
    }
    
    // 检查渠道可用性
    return availableChannels.filter(channel => 
      channel.isAvailable() && 
      this.userPreferences.isChannelEnabled(userPreferences, channel.name)
    );
  }
  
  // 个性化消息
  async personalizeMessage(message, user, channel) {
    const template = await this.templateEngine.getTemplate(message.templateId, channel.name);
    
    const personalizedContent = await this.templateEngine.render(template, {
      user: {
        name: user.name,
        email: user.email,
        preferences: user.preferences
      },
      message: message.data,
      channel: channel.name,
      timestamp: new Date().toISOString()
    });
    
    return {
      ...message,
      title: personalizedContent.title,
      body: personalizedContent.body,
      actions: personalizedContent.actions,
      metadata: {
        ...message.metadata,
        personalizedAt: new Date(),
        channel: channel.name,
        userId: user.id
      }
    };
  }
  
  // 批量发送
  async sendBatch(messages) {
    const results = [];
    const batchSize = 100;
    
    for (let i = 0; i < messages.length; i += batchSize) {
      const batch = messages.slice(i, i + batchSize);
      
      const batchPromises = batch.map(message => 
        this.sendMessage(message).catch(error => ({
          success: false,
          messageId: message.id,
          error: error.message
        }))
      );
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // 批次间延迟，避免过载
      if (i + batchSize < messages.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    return {
      totalMessages: messages.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results
    };
  }
  
  generateTaskId() {
    return `push_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  getDefaultRetryPolicy() {
    return {
      maxRetries: 3,
      backoffStrategy: 'exponential',
      initialDelay: 1000,
      maxDelay: 30000
    };
  }
}
```

### 2. Web Push 实现

```javascript
// Web Push 推送渠道
const webpush = require('web-push');

class WebPushChannel {
  constructor() {
    this.name = 'webPush';
    this.isEnabled = true;
    
    // 配置 VAPID 密钥
    webpush.setVapidDetails(
      'mailto:admin@example.com',
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );
    
    this.subscriptions = new Map(); // userId -> subscription info
    this.deliveryTracking = new Map(); // pushId -> delivery status
  }
  
  // 订阅管理
  async subscribe(userId, subscription) {
    // 验证订阅信息
    if (!subscription.endpoint || !subscription.keys) {
      throw new Error('无效的订阅信息');
    }
    
    // 存储订阅信息
    const subscriptionInfo = {
      userId,
      subscription,
      subscribedAt: new Date(),
      isActive: true,
      deviceInfo: subscription.deviceInfo || {},
      lastUsed: new Date()
    };
    
    this.subscriptions.set(userId, subscriptionInfo);
    
    // 持久化存储
    await this.saveSubscription(subscriptionInfo);
    
    console.log(`Web Push 订阅成功: ${userId}`);
    
    // 发送欢迎通知
    await this.sendWelcomeNotification(userId);
    
    return { success: true, subscriptionId: userId };
  }
  
  // 取消订阅
  async unsubscribe(userId) {
    this.subscriptions.delete(userId);
    await this.removeSubscription(userId);
    
    console.log(`Web Push 取消订阅: ${userId}`);
    return { success: true };
  }
  
  // 发送推送
  async sendPush(userId, message) {
    const subscriptionInfo = this.subscriptions.get(userId);
    if (!subscriptionInfo || !subscriptionInfo.isActive) {
      throw new Error('用户未订阅或订阅已失效');
    }
    
    const pushPayload = {
      title: message.title,
      body: message.body,
      icon: message.icon || '/default-icon.png',
      badge: message.badge || '/default-badge.png',
      image: message.image,
      data: {
        ...message.data,
        messageId: message.id,
        timestamp: new Date().toISOString(),
        actions: message.actions || []
      },
      actions: message.actions?.map(action => ({
        action: action.id,
        title: action.title,
        icon: action.icon
      })),
      requireInteraction: message.requireInteraction || false,
      silent: message.silent || false,
      tag: message.tag || message.id,
      renotify: message.renotify || false
    };
    
    const options = {
      TTL: message.ttl || 86400, // 24小时
      urgency: this.mapPriorityToUrgency(message.priority),
      topic: message.topic,
      headers: {
        'Topic': message.topic || 'general'
      }
    };
    
    try {
      const result = await webpush.sendNotification(
        subscriptionInfo.subscription,
        JSON.stringify(pushPayload),
        options
      );
      
      // 更新订阅使用时间
      subscriptionInfo.lastUsed = new Date();
      
      // 记录发送成功
      this.deliveryTracking.set(message.id, {
        status: 'sent',
        sentAt: new Date(),
        statusCode: result.statusCode,
        headers: result.headers
      });
      
      console.log(`Web Push 发送成功: ${userId}, 消息: ${message.id}`);
      
      return {
        success: true,
        messageId: message.id,
        statusCode: result.statusCode
      };
      
    } catch (error) {
      console.error(`Web Push 发送失败: ${userId}`, error);
      
      // 处理订阅失效
      if (error.statusCode === 410 || error.statusCode === 404) {
        await this.handleInvalidSubscription(userId, error);
      }
      
      // 记录发送失败
      this.deliveryTracking.set(message.id, {
        status: 'failed',
        failedAt: new Date(),
        error: error.message,
        statusCode: error.statusCode
      });
      
      throw error;
    }
  }
  
  // 批量发送
  async sendBatchPush(pushTasks) {
    const results = [];
    const concurrencyLimit = 50; // 并发限制
    
    for (let i = 0; i < pushTasks.length; i += concurrencyLimit) {
      const batch = pushTasks.slice(i, i + concurrencyLimit);
      
      const batchPromises = batch.map(async task => {
        try {
          const result = await this.sendPush(task.userId, task.message);
          return { ...result, taskId: task.id };
        } catch (error) {
          return {
            success: false,
            taskId: task.id,
            userId: task.userId,
            error: error.message
          };
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // 批次间延迟
      if (i + concurrencyLimit < pushTasks.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    return results;
  }
  
  // 处理订阅失效
  async handleInvalidSubscription(userId, error) {
    console.log(`订阅失效，移除用户: ${userId}`);
    
    const subscriptionInfo = this.subscriptions.get(userId);
    if (subscriptionInfo) {
      subscriptionInfo.isActive = false;
      subscriptionInfo.invalidatedAt = new Date();
      subscriptionInfo.invalidationReason = error.message;
    }
    
    // 从活跃订阅中移除
    this.subscriptions.delete(userId);
    
    // 更新数据库状态
    await this.markSubscriptionInactive(userId, error);
  }
  
  // 发送欢迎通知
  async sendWelcomeNotification(userId) {
    const welcomeMessage = {
      id: `welcome_${userId}_${Date.now()}`,
      title: '欢迎订阅通知！',
      body: '您已成功订阅推送通知，将及时收到重要更新。',
      icon: '/welcome-icon.png',
      data: {
        type: 'welcome',
        userId
      },
      actions: [
        {
          id: 'settings',
          title: '通知设置',
          icon: '/settings-icon.png'
        }
      ]
    };
    
    try {
      await this.sendPush(userId, welcomeMessage);
    } catch (error) {
      console.error('发送欢迎通知失败:', error);
    }
  }
  
  // 优先级映射
  mapPriorityToUrgency(priority) {
    switch (priority) {
      case 'high':
      case 'urgent':
        return 'high';
      case 'normal':
        return 'normal';
      case 'low':
        return 'low';
      default:
        return 'normal';
    }
  }
  
  // 获取推送统计
  async getPushStats(userId, timeRange = '7d') {
    const stats = {
      totalSent: 0,
      delivered: 0,
      failed: 0,
      clicked: 0,
      dismissed: 0
    };
    
    // 从分析系统获取统计数据
    const analyticsData = await this.analytics.getUserPushStats(userId, timeRange);
    
    return {
      ...stats,
      ...analyticsData,
      deliveryRate: stats.totalSent > 0 ? (stats.delivered / stats.totalSent) : 0,
      clickRate: stats.delivered > 0 ? (stats.clicked / stats.delivered) : 0
    };
  }
  
  isAvailable() {
    return this.isEnabled && process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY;
  }
}
```

### 3. 移动推送服务

```javascript
// 移动推送渠道 (FCM/APNS)
const admin = require('firebase-admin');
const apn = require('apn');

class MobilePushChannel {
  constructor() {
    this.name = 'mobilePush';
    this.isEnabled = true;
    
    // 初始化 Firebase Admin SDK
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      admin.initializeApp({
        credential: admin.credential.cert(
          JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
        )
      });
      this.fcm = admin.messaging();
    }
    
    // 初始化 APN
    if (process.env.APNS_KEY_ID) {
      this.apnProvider = new apn.Provider({
        token: {
          key: process.env.APNS_PRIVATE_KEY,
          keyId: process.env.APNS_KEY_ID,
          teamId: process.env.APNS_TEAM_ID
        },
        production: process.env.NODE_ENV === 'production'
      });
    }
    
    this.deviceTokens = new Map(); // userId -> device tokens
  }
  
  // 注册设备令牌
  async registerDevice(userId, deviceInfo) {
    const { token, platform, appVersion, deviceModel } = deviceInfo;
    
    if (!token) {
      throw new Error('设备令牌不能为空');
    }
    
    const deviceRecord = {
      userId,
      token,
      platform: platform.toLowerCase(), // 'ios' or 'android'
      appVersion,
      deviceModel,
      registeredAt: new Date(),
      isActive: true,
      lastUsed: new Date()
    };
    
    // 存储设备信息
    if (!this.deviceTokens.has(userId)) {
      this.deviceTokens.set(userId, []);
    }
    
    const userDevices = this.deviceTokens.get(userId);
    
    // 检查是否已存在相同令牌
    const existingIndex = userDevices.findIndex(d => d.token === token);
    if (existingIndex !== -1) {
      // 更新现有设备信息
      userDevices[existingIndex] = deviceRecord;
    } else {
      // 添加新设备
      userDevices.push(deviceRecord);
    }
    
    // 持久化存储
    await this.saveDeviceToken(deviceRecord);
    
    console.log(`移动设备注册成功: ${userId}, 平台: ${platform}`);
    
    return { success: true, deviceId: token };
  }
  
  // 发送推送
  async sendPush(userId, message) {
    const userDevices = this.deviceTokens.get(userId);
    if (!userDevices || userDevices.length === 0) {
      throw new Error('用户没有注册的设备');
    }
    
    const results = [];
    
    for (const device of userDevices.filter(d => d.isActive)) {
      try {
        let result;
        
        if (device.platform === 'android') {
          result = await this.sendFCMPush(device, message);
        } else if (device.platform === 'ios') {
          result = await this.sendAPNSPush(device, message);
        } else {
          throw new Error(`不支持的平台: ${device.platform}`);
        }
        
        results.push({
          deviceId: device.token,
          platform: device.platform,
          success: true,
          ...result
        });
        
        // 更新设备使用时间
        device.lastUsed = new Date();
        
      } catch (error) {
        console.error(`推送发送失败 [${device.platform}]:`, error);
        
        results.push({
          deviceId: device.token,
          platform: device.platform,
          success: false,
          error: error.message
        });
        
        // 处理无效令牌
        if (this.isInvalidTokenError(error)) {
          await this.handleInvalidToken(userId, device.token, error);
        }
      }
    }
    
    return {
      success: results.some(r => r.success),
      messageId: message.id,
      results
    };
  }
  
  // FCM 推送
  async sendFCMPush(device, message) {
    if (!this.fcm) {
      throw new Error('FCM 未配置');
    }
    
    const fcmMessage = {
      token: device.token,
      notification: {
        title: message.title,
        body: message.body,
        imageUrl: message.image
      },
      data: {
        ...message.data,
        messageId: message.id,
        timestamp: new Date().toISOString()
      },
      android: {
        priority: this.mapPriorityToFCM(message.priority),
        notification: {
          icon: message.icon,
          color: message.color || '#007bff',
          sound: message.sound || 'default',
          tag: message.tag,
          clickAction: message.clickAction,
          bodyLocKey: message.bodyLocKey,
          bodyLocArgs: message.bodyLocArgs,
          titleLocKey: message.titleLocKey,
          titleLocArgs: message.titleLocArgs
        },
        data: message.androidData || {}
      },
      apns: {
        payload: {
          aps: {
            alert: {
              title: message.title,
              body: message.body
            },
            badge: message.badge,
            sound: message.sound || 'default',
            'content-available': message.contentAvailable ? 1 : 0,
            'mutable-content': message.mutableContent ? 1 : 0,
            category: message.category
          },
          ...message.iosData
        }
      },
      webpush: {
        headers: {
          TTL: message.ttl?.toString() || '86400'
        },
        notification: {
          title: message.title,
          body: message.body,
          icon: message.icon,
          actions: message.actions
        }
      }
    };
    
    const response = await this.fcm.send(fcmMessage);
    
    return {
      messageId: response,
      platform: 'fcm'
    };
  }
  
  // APNS 推送
  async sendAPNSPush(device, message) {
    if (!this.apnProvider) {
      throw new Error('APNS 未配置');
    }
    
    const notification = new apn.Notification({
      topic: process.env.APNS_BUNDLE_ID,
      alert: {
        title: message.title,
        body: message.body,
        'title-loc-key': message.titleLocKey,
        'title-loc-args': message.titleLocArgs,
        'loc-key': message.bodyLocKey,
        'loc-args': message.bodyLocArgs
      },
      badge: message.badge,
      sound: message.sound || 'default',
      category: message.category,
      threadId: message.threadId,
      payload: {
        ...message.data,
        messageId: message.id,
        timestamp: new Date().toISOString()
      },
      priority: this.mapPriorityToAPNS(message.priority),
      expiry: Math.floor(Date.now() / 1000) + (message.ttl || 86400),
      collapseId: message.collapseId || message.tag
    });
    
    // 添加富媒体
    if (message.image) {
      notification.mutableContent = 1;
      notification.payload.imageUrl = message.image;
    }
    
    // 添加操作按钮
    if (message.actions && message.actions.length > 0) {
      notification.category = message.category || 'ACTION_CATEGORY';
    }
    
    const response = await this.apnProvider.send(notification, device.token);
    
    // 检查发送结果
    if (response.failed && response.failed.length > 0) {
      const failure = response.failed[0];
      throw new Error(`APNS 发送失败: ${failure.error} - ${failure.response.reason}`);
    }
    
    return {
      messageId: response.sent[0].messageId,
      platform: 'apns'
    };
  }
  
  // 批量发送
  async sendBatchPush(pushTasks) {
    const results = [];
    const batchSize = 100;
    
    for (let i = 0; i < pushTasks.length; i += batchSize) {
      const batch = pushTasks.slice(i, i + batchSize);
      
      // 按平台分组
      const androidTasks = batch.filter(task => 
        this.getUserPlatforms(task.userId).includes('android')
      );
      const iosTasks = batch.filter(task => 
        this.getUserPlatforms(task.userId).includes('ios')
      );
      
      // 并行发送
      const [androidResults, iosResults] = await Promise.all([
        this.sendFCMBatch(androidTasks),
        this.sendAPNSBatch(iosTasks)
      ]);
      
      results.push(...androidResults, ...iosResults);
      
      // 批次间延迟
      if (i + batchSize < pushTasks.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    return results;
  }
  
  // FCM 批量发送
  async sendFCMBatch(tasks) {
    if (!this.fcm || tasks.length === 0) {
      return [];
    }
    
    const messages = tasks.map(task => this.buildFCMMessage(task));
    
    try {
      const response = await this.fcm.sendAll(messages);
      
      return response.responses.map((result, index) => ({
        taskId: tasks[index].id,
        success: result.success,
        messageId: result.messageId,
        error: result.error?.message
      }));
    } catch (error) {
      console.error('FCM 批量发送失败:', error);
      return tasks.map(task => ({
        taskId: task.id,
        success: false,
        error: error.message
      }));
    }
  }
  
  // 处理无效令牌
  async handleInvalidToken(userId, token, error) {
    console.log(`移除无效设备令牌: ${userId}, ${token}`);
    
    const userDevices = this.deviceTokens.get(userId);
    if (userDevices) {
      const deviceIndex = userDevices.findIndex(d => d.token === token);
      if (deviceIndex !== -1) {
        userDevices[deviceIndex].isActive = false;
        userDevices[deviceIndex].invalidatedAt = new Date();
        userDevices[deviceIndex].invalidationReason = error.message;
      }
    }
    
    // 更新数据库
    await this.markTokenInactive(token, error);
  }
  
  // 优先级映射
  mapPriorityToFCM(priority) {
    switch (priority) {
      case 'high':
      case 'urgent':
        return 'high';
      case 'normal':
        return 'normal';
      case 'low':
        return 'normal';
      default:
        return 'normal';
    }
  }
  
  mapPriorityToAPNS(priority) {
    switch (priority) {
      case 'high':
      case 'urgent':
        return 10;
      case 'normal':
        return 5;
      case 'low':
        return 1;
      default:
        return 5;
    }
  }
  
  isInvalidTokenError(error) {
    const invalidTokenMessages = [
      'registration-token-not-registered',
      'invalid-registration-token',
      'BadDeviceToken',
      'Unregistered',
      'InvalidRegistration'
    ];
    
    return invalidTokenMessages.some(msg => 
      error.message && error.message.includes(msg)
    );
  }
  
  getUserPlatforms(userId) {
    const userDevices = this.deviceTokens.get(userId);
    if (!userDevices) return [];
    
    return [...new Set(userDevices
      .filter(d => d.isActive)
      .map(d => d.platform)
    )];
  }
  
  isAvailable() {
    return this.isEnabled && (this.fcm || this.apnProvider);
  }
}
```

### 4. 消息队列处理

```javascript
// 消息队列管理
class MessageQueue {
  constructor() {
    this.queues = {
      high: new PriorityQueue('high', { concurrency: 20, retryDelay: 1000 }),
      normal: new PriorityQueue('normal', { concurrency: 10, retryDelay: 5000 }),
      low: new PriorityQueue('low', { concurrency: 5, retryDelay: 10000 })
    };
    
    this.processor = new MessageProcessor();
    this.scheduler = new MessageScheduler();
    this.retryManager = new RetryManager();
    
    this.startProcessing();
  }
  
  // 添加消息到队列
  async add(task) {
    const priority = task.priority || 'normal';
    const queue = this.queues[priority];
    
    if (!queue) {
      throw new Error(`未知优先级: ${priority}`);
    }
    
    // 检查是否需要延迟发送
    if (task.scheduledAt && task.scheduledAt > new Date()) {
      return await this.scheduler.schedule(task);
    }
    
    // 立即添加到队列
    return await queue.add(task);
  }
  
  // 批量添加
  async addBatch(tasks) {
    const results = [];
    
    // 按优先级分组
    const groupedTasks = this.groupTasksByPriority(tasks);
    
    for (const [priority, priorityTasks] of Object.entries(groupedTasks)) {
      const queue = this.queues[priority];
      
      for (const task of priorityTasks) {
        try {
          const result = await this.add(task);
          results.push({ taskId: task.id, success: true, result });
        } catch (error) {
          results.push({ taskId: task.id, success: false, error: error.message });
        }
      }
    }
    
    return results;
  }
  
  // 开始处理队列
  startProcessing() {
    Object.values(this.queues).forEach(queue => {
      queue.process(async (task) => {
        return await this.processTask(task);
      });
    });
  }
  
  // 处理单个任务
  async processTask(task) {
    try {
      console.log(`处理推送任务: ${task.id}, 用户: ${task.userId}, 渠道: ${task.channel}`);
      
      // 检查用户是否仍然有效
      const isUserValid = await this.validateUser(task.userId);
      if (!isUserValid) {
        throw new Error('用户无效或已删除');
      }
      
      // 检查频率限制
      const rateLimitCheck = await this.checkRateLimit(task.userId, task.channel);
      if (!rateLimitCheck.allowed) {
        throw new Error(`频率限制: ${rateLimitCheck.reason}`);
      }
      
      // 执行推送
      const result = await this.processor.process(task);
      
      // 记录成功
      await this.recordTaskResult(task.id, 'success', result);
      
      return result;
      
    } catch (error) {
      console.error(`任务处理失败: ${task.id}`, error);
      
      // 检查是否需要重试
      const shouldRetry = await this.retryManager.shouldRetry(task, error);
      
      if (shouldRetry) {
        const retryTask = await this.retryManager.createRetryTask(task, error);
        await this.add(retryTask);
      } else {
        // 记录最终失败
        await this.recordTaskResult(task.id, 'failed', { error: error.message });
      }
      
      throw error;
    }
  }
  
  // 频率限制检查
  async checkRateLimit(userId, channel) {
    const limits = {
      webPush: { count: 50, window: 3600000 }, // 50次/小时
      mobilePush: { count: 100, window: 3600000 }, // 100次/小时
      email: { count: 20, window: 3600000 }, // 20次/小时
      sms: { count: 10, window: 3600000 } // 10次/小时
    };
    
    const limit = limits[channel];
    if (!limit) {
      return { allowed: true };
    }
    
    const key = `rate_limit:${userId}:${channel}`;
    const now = Date.now();
    const windowStart = now - limit.window;
    
    // 获取时间窗口内的发送次数
    const recentSends = await this.getRecentSends(key, windowStart);
    
    if (recentSends >= limit.count) {
      return {
        allowed: false,
        reason: `超过频率限制: ${limit.count}次/${limit.window/1000/60}分钟`
      };
    }
    
    // 记录本次发送
    await this.recordSend(key, now);
    
    return { allowed: true };
  }
  
  // 按优先级分组任务
  groupTasksByPriority(tasks) {
    const grouped = { high: [], normal: [], low: [] };
    
    tasks.forEach(task => {
      const priority = task.priority || 'normal';
      if (grouped[priority]) {
        grouped[priority].push(task);
      }
    });
    
    return grouped;
  }
  
  // 获取队列统计
  getQueueStats() {
    const stats = {};
    
    Object.entries(this.queues).forEach(([priority, queue]) => {
      stats[priority] = {
        waiting: queue.waiting,
        active: queue.active,
        completed: queue.completed,
        failed: queue.failed,
        paused: queue.paused
      };
    });
    
    return {
      queues: stats,
      totalWaiting: Object.values(stats).reduce((sum, s) => sum + s.waiting, 0),
      totalActive: Object.values(stats).reduce((sum, s) => sum + s.active, 0)
    };
  }
}

// 优先级队列实现
class PriorityQueue {
  constructor(name, options = {}) {
    this.name = name;
    this.options = options;
    this.tasks = [];
    this.processing = 0;
    this.maxConcurrency = options.concurrency || 5;
    
    this.stats = {
      waiting: 0,
      active: 0,
      completed: 0,
      failed: 0,
      paused: false
    };
  }
  
  async add(task) {
    const queueTask = {
      ...task,
      addedAt: new Date(),
      attempts: 0,
      priority: this.calculatePriority(task)
    };
    
    // 插入到正确位置（按优先级排序）
    this.insertByPriority(queueTask);
    this.stats.waiting++;
    
    // 触发处理
    this.processNext();
    
    return { taskId: task.id, queuePosition: this.tasks.length };
  }
  
  process(processor) {
    this.processor = processor;
  }
  
  async processNext() {
    if (this.stats.paused || 
        this.processing >= this.maxConcurrency || 
        this.tasks.length === 0) {
      return;
    }
    
    const task = this.tasks.shift();
    this.stats.waiting--;
    this.stats.active++;
    this.processing++;
    
    try {
      const result = await this.processor(task);
      this.stats.completed++;
      console.log(`任务完成: ${task.id}`);
    } catch (error) {
      this.stats.failed++;
      console.error(`任务失败: ${task.id}`, error);
      
      // 重试逻辑
      if (task.attempts < (task.retryPolicy?.maxRetries || 3)) {
        task.attempts++;
        
        setTimeout(() => {
          this.insertByPriority(task);
          this.stats.waiting++;
          this.processNext();
        }, this.calculateRetryDelay(task));
      }
    } finally {
      this.stats.active--;
      this.processing--;
      
      // 继续处理下一个任务
      this.processNext();
    }
  }
  
  insertByPriority(task) {
    let inserted = false;
    
    for (let i = 0; i < this.tasks.length; i++) {
      if (task.priority > this.tasks[i].priority) {
        this.tasks.splice(i, 0, task);
        inserted = true;
        break;
      }
    }
    
    if (!inserted) {
      this.tasks.push(task);
    }
  }
  
  calculatePriority(task) {
    let priority = 0;
    
    // 基础优先级
    switch (task.priority) {
      case 'urgent':
        priority += 100;
        break;
      case 'high':
        priority += 75;
        break;
      case 'normal':
        priority += 50;
        break;
      case 'low':
        priority += 25;
        break;
    }
    
    // 时间因子（越早的任务优先级越高）
    const ageMinutes = (Date.now() - new Date(task.scheduledAt || task.createdAt).getTime()) / 60000;
    priority += Math.min(ageMinutes, 60); // 最多增加60分
    
    // 重试因子（重试次数越多优先级越低）
    priority -= (task.attempts || 0) * 5;
    
    return priority;
  }
  
  calculateRetryDelay(task) {
    const baseDelay = this.options.retryDelay || 1000;
    const backoffFactor = task.retryPolicy?.backoffFactor || 2;
    
    return baseDelay * Math.pow(backoffFactor, task.attempts - 1);
  }
  
  pause() {
    this.stats.paused = true;
  }
  
  resume() {
    this.stats.paused = false;
    this.processNext();
  }
  
  clear() {
    this.tasks = [];
    this.stats.waiting = 0;
  }
}
```

## 📚 最佳实践总结

1. **多渠道策略**：根据消息类型和用户偏好选择最佳渠道
2. **个性化内容**：基于用户数据个性化推送内容
3. **频率控制**：实施智能频率限制避免用户疲劳
4. **优雅降级**：渠道失败时自动切换备选方案
5. **性能优化**：使用队列和批处理提高吞吐量
6. **监控分析**：全面监控推送效果和用户行为
7. **隐私保护**：遵守数据保护法规和用户隐私
8. **A/B测试**：持续优化推送策略和内容

通过掌握这些消息推送技术，您将能够构建高效、智能的用户通知系统。
