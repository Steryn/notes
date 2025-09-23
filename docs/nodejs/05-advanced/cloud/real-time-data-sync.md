# 实时数据同步

## 📖 概述

实时数据同步是现代应用的核心功能，确保多个客户端之间的数据一致性。通过 WebSocket、Server-Sent Events、数据库变更流等技术，实现毫秒级的数据同步，为用户提供协作和实时交互体验。

## 🎯 学习目标

- 掌握实时数据同步的核心概念和架构
- 学习多种同步策略和冲突解决方案
- 了解数据库变更流和事件驱动架构
- 掌握分布式系统中的数据一致性

## 🏗️ 同步架构

### 1. 基础同步架构

```javascript
// 实时数据同步管理器
class RealTimeDataSync {
  constructor() {
    this.clients = new Map(); // clientId -> connection info
    this.subscriptions = new Map(); // resourceId -> Set<clientId>
    this.dataStore = new Map(); // resourceId -> data
    this.changeLog = []; // 变更历史
    this.conflictResolver = new ConflictResolver();
  }
  
  // 客户端连接
  addClient(clientId, connection, metadata = {}) {
    this.clients.set(clientId, {
      connection,
      metadata,
      connectedAt: new Date(),
      lastSeen: new Date(),
      subscriptions: new Set()
    });
    
    console.log(`客户端连接: ${clientId}`);
    
    // 发送初始状态
    this.sendToClient(clientId, {
      type: 'connection_established',
      clientId,
      timestamp: new Date().toISOString()
    });
  }
  
  // 客户端断开
  removeClient(clientId) {
    const client = this.clients.get(clientId);
    if (client) {
      // 清理订阅
      client.subscriptions.forEach(resourceId => {
        this.unsubscribe(clientId, resourceId);
      });
      
      this.clients.delete(clientId);
      console.log(`客户端断开: ${clientId}`);
    }
  }
  
  // 订阅资源
  subscribe(clientId, resourceId, options = {}) {
    if (!this.clients.has(clientId)) {
      throw new Error('客户端不存在');
    }
    
    // 添加订阅
    if (!this.subscriptions.has(resourceId)) {
      this.subscriptions.set(resourceId, new Set());
    }
    
    this.subscriptions.get(resourceId).add(clientId);
    this.clients.get(clientId).subscriptions.add(resourceId);
    
    console.log(`客户端 ${clientId} 订阅资源 ${resourceId}`);
    
    // 发送当前数据
    const currentData = this.dataStore.get(resourceId);
    if (currentData) {
      this.sendToClient(clientId, {
        type: 'data_snapshot',
        resourceId,
        data: currentData,
        version: currentData.version,
        timestamp: new Date().toISOString()
      });
    }
    
    // 发送最近的变更历史
    if (options.includeHistory) {
      const recentChanges = this.getRecentChanges(resourceId, options.historyLimit || 10);
      this.sendToClient(clientId, {
        type: 'change_history',
        resourceId,
        changes: recentChanges
      });
    }
  }
  
  // 取消订阅
  unsubscribe(clientId, resourceId) {
    if (this.subscriptions.has(resourceId)) {
      this.subscriptions.get(resourceId).delete(clientId);
      
      // 如果没有订阅者了，清理资源
      if (this.subscriptions.get(resourceId).size === 0) {
        this.subscriptions.delete(resourceId);
      }
    }
    
    if (this.clients.has(clientId)) {
      this.clients.get(clientId).subscriptions.delete(resourceId);
    }
    
    console.log(`客户端 ${clientId} 取消订阅资源 ${resourceId}`);
  }
  
  // 更新数据
  async updateData(clientId, resourceId, changes, options = {}) {
    try {
      const currentData = this.dataStore.get(resourceId) || { 
        version: 0, 
        data: {}, 
        lastModified: new Date() 
      };
      
      // 创建变更记录
      const changeRecord = {
        id: this.generateChangeId(),
        resourceId,
        clientId,
        changes,
        baseVersion: currentData.version,
        timestamp: new Date(),
        type: options.type || 'update'
      };
      
      // 检测冲突
      const conflict = this.detectConflict(changeRecord, currentData);
      
      if (conflict && !options.forceUpdate) {
        // 发送冲突通知给客户端
        this.sendToClient(clientId, {
          type: 'conflict_detected',
          resourceId,
          conflict,
          suggestedResolution: await this.conflictResolver.suggest(conflict)
        });
        return false;
      }
      
      // 应用变更
      const newData = await this.applyChanges(currentData, changeRecord);
      
      // 更新数据存储
      this.dataStore.set(resourceId, newData);
      
      // 记录变更历史
      this.changeLog.push(changeRecord);
      
      // 广播变更给所有订阅者（除了发起者）
      await this.broadcastChange(resourceId, changeRecord, clientId);
      
      return true;
    } catch (error) {
      console.error('数据更新失败:', error);
      
      this.sendToClient(clientId, {
        type: 'update_failed',
        resourceId,
        error: error.message
      });
      
      return false;
    }
  }
  
  // 应用变更
  async applyChanges(currentData, changeRecord) {
    const newData = {
      ...currentData,
      version: currentData.version + 1,
      lastModified: changeRecord.timestamp,
      lastModifiedBy: changeRecord.clientId
    };
    
    // 根据变更类型应用不同逻辑
    switch (changeRecord.type) {
      case 'set':
        newData.data = { ...currentData.data, ...changeRecord.changes };
        break;
      case 'patch':
        newData.data = this.deepMerge(currentData.data, changeRecord.changes);
        break;
      case 'delete':
        newData.data = this.deleteKeys(currentData.data, changeRecord.changes);
        break;
      default:
        newData.data = changeRecord.changes;
    }
    
    return newData;
  }
  
  // 检测冲突
  detectConflict(changeRecord, currentData) {
    // 版本冲突检测
    if (changeRecord.baseVersion < currentData.version) {
      return {
        type: 'version_conflict',
        expectedVersion: changeRecord.baseVersion,
        currentVersion: currentData.version,
        message: '数据已被其他客户端修改'
      };
    }
    
    // 并发编辑检测
    const recentChanges = this.getRecentChanges(
      changeRecord.resourceId, 
      10, 
      changeRecord.timestamp - 5000 // 5秒内的变更
    );
    
    const conflictingChanges = recentChanges.filter(change => 
      change.clientId !== changeRecord.clientId &&
      this.hasFieldConflict(change.changes, changeRecord.changes)
    );
    
    if (conflictingChanges.length > 0) {
      return {
        type: 'field_conflict',
        conflictingChanges,
        message: '同时编辑了相同字段'
      };
    }
    
    return null;
  }
  
  // 广播变更
  async broadcastChange(resourceId, changeRecord, excludeClientId = null) {
    const subscribers = this.subscriptions.get(resourceId);
    if (!subscribers) return;
    
    const message = {
      type: 'data_changed',
      resourceId,
      change: {
        id: changeRecord.id,
        type: changeRecord.type,
        changes: changeRecord.changes,
        version: changeRecord.baseVersion + 1,
        clientId: changeRecord.clientId,
        timestamp: changeRecord.timestamp.toISOString()
      }
    };
    
    subscribers.forEach(clientId => {
      if (clientId !== excludeClientId) {
        this.sendToClient(clientId, message);
      }
    });
    
    console.log(`广播变更到 ${subscribers.size - (excludeClientId ? 1 : 0)} 个客户端`);
  }
  
  // 发送消息给客户端
  sendToClient(clientId, message) {
    const client = this.clients.get(clientId);
    if (client && client.connection.readyState === WebSocket.OPEN) {
      client.connection.send(JSON.stringify(message));
      client.lastSeen = new Date();
    }
  }
  
  // 工具方法
  generateChangeId() {
    return `change_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  getRecentChanges(resourceId, limit = 10, since = null) {
    return this.changeLog
      .filter(change => {
        if (change.resourceId !== resourceId) return false;
        if (since && change.timestamp < since) return false;
        return true;
      })
      .slice(-limit);
  }
  
  deepMerge(target, source) {
    const result = { ...target };
    
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    
    return result;
  }
  
  hasFieldConflict(changes1, changes2) {
    const keys1 = Object.keys(changes1);
    const keys2 = Object.keys(changes2);
    
    return keys1.some(key => keys2.includes(key));
  }
}
```

### 2. 冲突解决器

```javascript
// 冲突解决器
class ConflictResolver {
  constructor() {
    this.strategies = {
      'last_writer_wins': this.lastWriterWins.bind(this),
      'first_writer_wins': this.firstWriterWins.bind(this),
      'merge_changes': this.mergeChanges.bind(this),
      'user_choice': this.userChoice.bind(this),
      'operational_transform': this.operationalTransform.bind(this)
    };
  }
  
  async resolve(conflict, strategy = 'last_writer_wins', options = {}) {
    const resolver = this.strategies[strategy];
    if (!resolver) {
      throw new Error(`未知的冲突解决策略: ${strategy}`);
    }
    
    return await resolver(conflict, options);
  }
  
  async suggest(conflict) {
    // 根据冲突类型建议解决方案
    switch (conflict.type) {
      case 'version_conflict':
        return {
          strategy: 'merge_changes',
          reason: '版本冲突，建议合并变更',
          options: { autoMerge: true }
        };
      
      case 'field_conflict':
        return {
          strategy: 'user_choice',
          reason: '字段冲突，需要用户选择',
          options: { showDiff: true }
        };
      
      default:
        return {
          strategy: 'last_writer_wins',
          reason: '默认策略：最后写入获胜'
        };
    }
  }
  
  // 最后写入获胜
  lastWriterWins(conflict, options) {
    return {
      resolution: 'accept_latest',
      result: conflict.latestChange,
      message: '接受最新变更'
    };
  }
  
  // 第一个写入获胜
  firstWriterWins(conflict, options) {
    return {
      resolution: 'reject_latest',
      result: conflict.originalData,
      message: '保持原有数据'
    };
  }
  
  // 合并变更
  async mergeChanges(conflict, options) {
    try {
      const merged = this.performThreeWayMerge(
        conflict.baseData,
        conflict.change1,
        conflict.change2
      );
      
      return {
        resolution: 'merged',
        result: merged,
        message: '成功合并变更'
      };
    } catch (error) {
      return {
        resolution: 'merge_failed',
        error: error.message,
        message: '自动合并失败，需要手动处理'
      };
    }
  }
  
  // 用户选择
  userChoice(conflict, options) {
    return {
      resolution: 'user_intervention_required',
      choices: [
        {
          id: 'accept_mine',
          label: '使用我的版本',
          data: conflict.change1
        },
        {
          id: 'accept_theirs',
          label: '使用他们的版本',
          data: conflict.change2
        },
        {
          id: 'merge_manual',
          label: '手动合并',
          data: null
        }
      ],
      message: '请选择如何解决冲突'
    };
  }
  
  // 操作变换
  async operationalTransform(conflict, options) {
    // 实现操作变换算法
    const transformedOps = this.transformOperations(
      conflict.operation1,
      conflict.operation2
    );
    
    return {
      resolution: 'transformed',
      result: transformedOps,
      message: '通过操作变换解决冲突'
    };
  }
  
  // 三方合并
  performThreeWayMerge(base, change1, change2) {
    const result = { ...base };
    
    // 合并 change1 的变更
    Object.keys(change1).forEach(key => {
      if (!(key in change2) || change1[key] === base[key]) {
        result[key] = change1[key];
      }
    });
    
    // 合并 change2 的变更
    Object.keys(change2).forEach(key => {
      if (!(key in change1) || change2[key] === base[key]) {
        result[key] = change2[key];
      } else if (change1[key] !== change2[key]) {
        // 冲突：两个变更都修改了同一个字段
        throw new Error(`字段 ${key} 存在冲突`);
      }
    });
    
    return result;
  }
  
  // 操作变换
  transformOperations(op1, op2) {
    // 简化的操作变换实现
    // 实际应用中需要更复杂的算法
    
    if (op1.type === 'insert' && op2.type === 'insert') {
      if (op1.position <= op2.position) {
        return [op1, { ...op2, position: op2.position + op1.text.length }];
      } else {
        return [{ ...op1, position: op1.position + op2.text.length }, op2];
      }
    }
    
    if (op1.type === 'delete' && op2.type === 'delete') {
      // 处理删除操作的变换
      return this.transformDeleteOperations(op1, op2);
    }
    
    // 其他操作类型的变换...
    return [op1, op2];
  }
  
  transformDeleteOperations(op1, op2) {
    // 删除操作的变换逻辑
    if (op1.position + op1.length <= op2.position) {
      return [op1, { ...op2, position: op2.position - op1.length }];
    } else if (op2.position + op2.length <= op1.position) {
      return [{ ...op1, position: op1.position - op2.length }, op2];
    } else {
      // 重叠删除，需要特殊处理
      throw new Error('重叠删除操作无法自动变换');
    }
  }
}
```

## 💾 数据库变更流

### 1. MongoDB Change Streams

```javascript
// MongoDB 变更流监听
const { MongoClient } = require('mongodb');

class MongoChangeStreamSync {
  constructor(connectionUrl, dbName) {
    this.connectionUrl = connectionUrl;
    this.dbName = dbName;
    this.client = null;
    this.db = null;
    this.changeStreams = new Map();
    this.subscribers = new Map();
  }
  
  async connect() {
    this.client = new MongoClient(this.connectionUrl);
    await this.client.connect();
    this.db = this.client.db(this.dbName);
    
    console.log('MongoDB 连接成功');
  }
  
  // 监听集合变更
  watchCollection(collectionName, filter = {}) {
    if (this.changeStreams.has(collectionName)) {
      return; // 已经在监听
    }
    
    const collection = this.db.collection(collectionName);
    const changeStream = collection.watch(
      [{ $match: filter }],
      { 
        fullDocument: 'updateLookup',
        fullDocumentBeforeChange: 'whenAvailable'
      }
    );
    
    changeStream.on('change', (change) => {
      this.handleChange(collectionName, change);
    });
    
    changeStream.on('error', (error) => {
      console.error(`变更流错误 [${collectionName}]:`, error);
      this.reconnectChangeStream(collectionName, filter);
    });
    
    this.changeStreams.set(collectionName, changeStream);
    console.log(`开始监听集合变更: ${collectionName}`);
  }
  
  // 处理变更事件
  handleChange(collectionName, change) {
    console.log(`集合 ${collectionName} 发生变更:`, change.operationType);
    
    const changeEvent = {
      collection: collectionName,
      operationType: change.operationType,
      documentKey: change.documentKey,
      fullDocument: change.fullDocument,
      fullDocumentBeforeChange: change.fullDocumentBeforeChange,
      updateDescription: change.updateDescription,
      timestamp: change.clusterTime,
      resumeToken: change._id
    };
    
    // 通知所有订阅者
    this.notifySubscribers(collectionName, changeEvent);
  }
  
  // 订阅变更事件
  subscribe(collectionName, callback, filter = {}) {
    if (!this.subscribers.has(collectionName)) {
      this.subscribers.set(collectionName, []);
      
      // 开始监听这个集合
      this.watchCollection(collectionName, filter);
    }
    
    this.subscribers.get(collectionName).push({
      callback,
      filter
    });
    
    console.log(`新订阅者加入集合: ${collectionName}`);
  }
  
  // 取消订阅
  unsubscribe(collectionName, callback) {
    const subscribers = this.subscribers.get(collectionName);
    if (subscribers) {
      const index = subscribers.findIndex(sub => sub.callback === callback);
      if (index !== -1) {
        subscribers.splice(index, 1);
        
        // 如果没有订阅者了，停止监听
        if (subscribers.length === 0) {
          this.stopWatching(collectionName);
        }
      }
    }
  }
  
  // 通知订阅者
  notifySubscribers(collectionName, changeEvent) {
    const subscribers = this.subscribers.get(collectionName);
    if (!subscribers) return;
    
    subscribers.forEach(subscriber => {
      try {
        // 应用过滤条件
        if (this.matchesFilter(changeEvent, subscriber.filter)) {
          subscriber.callback(changeEvent);
        }
      } catch (error) {
        console.error('订阅者回调错误:', error);
      }
    });
  }
  
  // 检查是否匹配过滤条件
  matchesFilter(changeEvent, filter) {
    if (!filter || Object.keys(filter).length === 0) {
      return true;
    }
    
    // 简单的过滤逻辑实现
    for (const [key, value] of Object.entries(filter)) {
      if (changeEvent.fullDocument && changeEvent.fullDocument[key] !== value) {
        return false;
      }
    }
    
    return true;
  }
  
  // 重连变更流
  async reconnectChangeStream(collectionName, filter) {
    console.log(`重连变更流: ${collectionName}`);
    
    // 停止当前流
    this.stopWatching(collectionName);
    
    // 延迟重连
    setTimeout(() => {
      this.watchCollection(collectionName, filter);
    }, 5000);
  }
  
  // 停止监听
  stopWatching(collectionName) {
    const changeStream = this.changeStreams.get(collectionName);
    if (changeStream) {
      changeStream.close();
      this.changeStreams.delete(collectionName);
      this.subscribers.delete(collectionName);
      
      console.log(`停止监听集合: ${collectionName}`);
    }
  }
  
  // 关闭所有连接
  async close() {
    // 关闭所有变更流
    for (const [collectionName, changeStream] of this.changeStreams) {
      changeStream.close();
    }
    
    this.changeStreams.clear();
    this.subscribers.clear();
    
    // 关闭数据库连接
    if (this.client) {
      await this.client.close();
    }
    
    console.log('MongoDB 变更流监听已关闭');
  }
}

// 使用示例
const changeStreamSync = new MongoChangeStreamSync(
  'mongodb://localhost:27017',
  'myapp'
);

async function setupChangeStreamSync() {
  await changeStreamSync.connect();
  
  // 监听用户集合变更
  changeStreamSync.subscribe('users', (changeEvent) => {
    console.log('用户数据变更:', changeEvent);
    
    // 广播给 WebSocket 客户端
    broadcastToClients('user_changed', {
      operationType: changeEvent.operationType,
      documentId: changeEvent.documentKey._id,
      document: changeEvent.fullDocument
    });
  });
  
  // 监听订单集合变更
  changeStreamSync.subscribe('orders', (changeEvent) => {
    console.log('订单数据变更:', changeEvent);
    
    // 只关注特定状态的订单
    if (changeEvent.fullDocument && changeEvent.fullDocument.status === 'completed') {
      // 处理订单完成事件
      handleOrderCompleted(changeEvent.fullDocument);
    }
  }, { status: 'completed' });
}

function broadcastToClients(eventType, data) {
  // 广播给所有连接的 WebSocket 客户端
  const message = {
    type: eventType,
    data: data,
    timestamp: new Date().toISOString()
  };
  
  // 假设有全局的 WebSocket 客户端列表
  wsClients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
}
```

### 2. PostgreSQL 变更通知

```javascript
// PostgreSQL LISTEN/NOTIFY 实现
const { Client } = require('pg');

class PostgresChangeNotification {
  constructor(connectionConfig) {
    this.config = connectionConfig;
    this.client = null;
    this.listeners = new Map();
    this.isConnected = false;
  }
  
  async connect() {
    this.client = new Client(this.config);
    await this.client.connect();
    this.isConnected = true;
    
    // 监听通知
    this.client.on('notification', (msg) => {
      this.handleNotification(msg);
    });
    
    this.client.on('error', (error) => {
      console.error('PostgreSQL 连接错误:', error);
      this.reconnect();
    });
    
    console.log('PostgreSQL 连接成功');
  }
  
  // 监听表变更
  async watchTable(tableName, operations = ['INSERT', 'UPDATE', 'DELETE']) {
    const channelName = `table_${tableName}_changes`;
    
    // 创建触发器函数
    await this.createNotificationFunction();
    
    // 为表创建触发器
    await this.createTableTrigger(tableName, operations);
    
    // 监听通道
    await this.client.query(`LISTEN ${channelName}`);
    
    console.log(`开始监听表变更: ${tableName}`);
  }
  
  // 创建通知函数
  async createNotificationFunction() {
    const functionSQL = `
      CREATE OR REPLACE FUNCTION notify_table_change()
      RETURNS TRIGGER AS $$
      DECLARE
        channel_name TEXT;
        payload JSON;
      BEGIN
        channel_name := 'table_' || TG_TABLE_NAME || '_changes';
        
        payload := json_build_object(
          'table', TG_TABLE_NAME,
          'operation', TG_OP,
          'timestamp', NOW(),
          'old', CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE NULL END,
          'new', CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW) ELSE NULL END
        );
        
        PERFORM pg_notify(channel_name, payload::TEXT);
        
        RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
      END;
      $$ LANGUAGE plpgsql;
    `;
    
    await this.client.query(functionSQL);
  }
  
  // 为表创建触发器
  async createTableTrigger(tableName, operations) {
    // 删除现有触发器
    await this.client.query(`
      DROP TRIGGER IF EXISTS ${tableName}_change_trigger ON ${tableName}
    `);
    
    // 创建新触发器
    const triggerSQL = `
      CREATE TRIGGER ${tableName}_change_trigger
      AFTER ${operations.join(' OR ')} ON ${tableName}
      FOR EACH ROW EXECUTE FUNCTION notify_table_change()
    `;
    
    await this.client.query(triggerSQL);
  }
  
  // 处理通知
  handleNotification(msg) {
    try {
      const payload = JSON.parse(msg.payload);
      const tableName = payload.table;
      
      console.log(`表 ${tableName} 发生变更:`, payload.operation);
      
      // 通知订阅者
      const listeners = this.listeners.get(tableName);
      if (listeners) {
        listeners.forEach(listener => {
          try {
            listener(payload);
          } catch (error) {
            console.error('监听器回调错误:', error);
          }
        });
      }
    } catch (error) {
      console.error('处理通知失败:', error);
    }
  }
  
  // 订阅表变更
  subscribe(tableName, callback) {
    if (!this.listeners.has(tableName)) {
      this.listeners.set(tableName, []);
    }
    
    this.listeners.get(tableName).push(callback);
    
    // 如果还没有监听这个表，开始监听
    if (this.listeners.get(tableName).length === 1) {
      this.watchTable(tableName);
    }
  }
  
  // 取消订阅
  unsubscribe(tableName, callback) {
    const listeners = this.listeners.get(tableName);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index !== -1) {
        listeners.splice(index, 1);
        
        // 如果没有监听器了，停止监听
        if (listeners.length === 0) {
          this.stopWatching(tableName);
        }
      }
    }
  }
  
  // 停止监听表
  async stopWatching(tableName) {
    const channelName = `table_${tableName}_changes`;
    await this.client.query(`UNLISTEN ${channelName}`);
    this.listeners.delete(tableName);
    
    console.log(`停止监听表: ${tableName}`);
  }
  
  // 重连
  async reconnect() {
    if (this.isConnected) {
      this.isConnected = false;
      
      try {
        await this.client.end();
      } catch (error) {
        console.error('关闭连接失败:', error);
      }
      
      setTimeout(async () => {
        try {
          await this.connect();
          
          // 重新监听所有表
          for (const tableName of this.listeners.keys()) {
            await this.watchTable(tableName);
          }
        } catch (error) {
          console.error('重连失败:', error);
          this.reconnect();
        }
      }, 5000);
    }
  }
  
  // 关闭连接
  async close() {
    this.isConnected = false;
    
    if (this.client) {
      await this.client.end();
    }
    
    this.listeners.clear();
    console.log('PostgreSQL 变更通知已关闭');
  }
}

// 使用示例
const pgNotification = new PostgresChangeNotification({
  host: 'localhost',
  port: 5432,
  database: 'myapp',
  user: 'postgres',
  password: 'password'
});

async function setupPostgresSync() {
  await pgNotification.connect();
  
  // 监听用户表变更
  pgNotification.subscribe('users', (changeData) => {
    console.log('用户表变更:', changeData);
    
    // 广播给客户端
    broadcastToClients('user_table_changed', {
      operation: changeData.operation,
      oldData: changeData.old,
      newData: changeData.new,
      timestamp: changeData.timestamp
    });
  });
  
  // 监听订单表变更
  pgNotification.subscribe('orders', (changeData) => {
    console.log('订单表变更:', changeData);
    
    // 特定业务逻辑
    if (changeData.operation === 'INSERT') {
      handleNewOrder(changeData.new);
    } else if (changeData.operation === 'UPDATE') {
      handleOrderUpdate(changeData.old, changeData.new);
    }
  });
}
```

## 🔄 协作编辑

### 1. 操作变换 (Operational Transformation)

```javascript
// 操作变换实现
class OperationalTransform {
  constructor() {
    this.operations = {
      'insert': this.createInsertOp,
      'delete': this.createDeleteOp,
      'retain': this.createRetainOp
    };
  }
  
  // 创建插入操作
  createInsertOp(position, text) {
    return {
      type: 'insert',
      position,
      text,
      length: text.length
    };
  }
  
  // 创建删除操作
  createDeleteOp(position, length) {
    return {
      type: 'delete',
      position,
      length
    };
  }
  
  // 创建保留操作
  createRetainOp(length) {
    return {
      type: 'retain',
      length
    };
  }
  
  // 变换两个操作
  transform(op1, op2, priority = 'left') {
    if (op1.type === 'insert' && op2.type === 'insert') {
      return this.transformInsertInsert(op1, op2, priority);
    } else if (op1.type === 'insert' && op2.type === 'delete') {
      return this.transformInsertDelete(op1, op2);
    } else if (op1.type === 'delete' && op2.type === 'insert') {
      const [op2Prime, op1Prime] = this.transformInsertDelete(op2, op1);
      return [op1Prime, op2Prime];
    } else if (op1.type === 'delete' && op2.type === 'delete') {
      return this.transformDeleteDelete(op1, op2);
    }
    
    return [op1, op2];
  }
  
  // 变换两个插入操作
  transformInsertInsert(op1, op2, priority) {
    if (op1.position < op2.position || (op1.position === op2.position && priority === 'left')) {
      return [
        op1,
        { ...op2, position: op2.position + op1.length }
      ];
    } else {
      return [
        { ...op1, position: op1.position + op2.length },
        op2
      ];
    }
  }
  
  // 变换插入和删除操作
  transformInsertDelete(insertOp, deleteOp) {
    if (insertOp.position <= deleteOp.position) {
      return [
        insertOp,
        { ...deleteOp, position: deleteOp.position + insertOp.length }
      ];
    } else if (insertOp.position >= deleteOp.position + deleteOp.length) {
      return [
        { ...insertOp, position: insertOp.position - deleteOp.length },
        deleteOp
      ];
    } else {
      // 插入位置在删除范围内
      return [
        { ...insertOp, position: deleteOp.position },
        deleteOp
      ];
    }
  }
  
  // 变换两个删除操作
  transformDeleteDelete(op1, op2) {
    if (op1.position + op1.length <= op2.position) {
      // op1 完全在 op2 之前
      return [
        op1,
        { ...op2, position: op2.position - op1.length }
      ];
    } else if (op2.position + op2.length <= op1.position) {
      // op2 完全在 op1 之前
      return [
        { ...op1, position: op1.position - op2.length },
        op2
      ];
    } else {
      // 删除范围重叠
      const overlapStart = Math.max(op1.position, op2.position);
      const overlapEnd = Math.min(op1.position + op1.length, op2.position + op2.length);
      const overlapLength = overlapEnd - overlapStart;
      
      return [
        {
          ...op1,
          position: Math.min(op1.position, op2.position),
          length: op1.length - overlapLength
        },
        {
          ...op2,
          position: Math.min(op1.position, op2.position),
          length: op2.length - overlapLength
        }
      ];
    }
  }
  
  // 应用操作到文档
  applyOperation(document, operation) {
    switch (operation.type) {
      case 'insert':
        return document.slice(0, operation.position) + 
               operation.text + 
               document.slice(operation.position);
      
      case 'delete':
        return document.slice(0, operation.position) + 
               document.slice(operation.position + operation.length);
      
      case 'retain':
        return document;
      
      default:
        throw new Error(`未知操作类型: ${operation.type}`);
    }
  }
  
  // 组合多个操作
  compose(ops1, ops2) {
    const result = [];
    let i = 0, j = 0;
    let pos1 = 0, pos2 = 0;
    
    while (i < ops1.length && j < ops2.length) {
      const op1 = ops1[i];
      const op2 = ops2[j];
      
      // 复杂的组合逻辑
      // 这里简化处理
      if (op1.type === 'retain' && op2.type === 'retain') {
        const length = Math.min(op1.length - pos1, op2.length - pos2);
        result.push(this.createRetainOp(length));
        
        pos1 += length;
        pos2 += length;
        
        if (pos1 === op1.length) { i++; pos1 = 0; }
        if (pos2 === op2.length) { j++; pos2 = 0; }
      } else {
        // 其他组合情况...
        result.push(op1);
        i++;
      }
    }
    
    return result;
  }
}

// 协作编辑管理器
class CollaborativeEditor {
  constructor(documentId) {
    this.documentId = documentId;
    this.document = '';
    this.version = 0;
    this.clients = new Map();
    this.operationHistory = [];
    this.ot = new OperationalTransform();
  }
  
  // 添加客户端
  addClient(clientId, connection) {
    this.clients.set(clientId, {
      connection,
      version: this.version,
      pendingOps: []
    });
    
    // 发送当前文档状态
    this.sendToClient(clientId, {
      type: 'document_state',
      document: this.document,
      version: this.version
    });
  }
  
  // 移除客户端
  removeClient(clientId) {
    this.clients.delete(clientId);
  }
  
  // 接收客户端操作
  receiveOperation(clientId, operation, clientVersion) {
    const client = this.clients.get(clientId);
    if (!client) {
      throw new Error('客户端不存在');
    }
    
    // 检查版本
    if (clientVersion !== this.version) {
      // 需要变换操作
      const transformedOp = this.transformOperation(operation, clientVersion);
      operation = transformedOp;
    }
    
    // 应用操作
    this.document = this.ot.applyOperation(this.document, operation);
    this.version++;
    
    // 记录操作历史
    this.operationHistory.push({
      operation,
      clientId,
      version: this.version,
      timestamp: new Date()
    });
    
    // 广播给其他客户端
    this.broadcastOperation(operation, clientId);
    
    // 更新客户端版本
    client.version = this.version;
  }
  
  // 变换操作
  transformOperation(operation, clientVersion) {
    let transformedOp = operation;
    
    // 对于客户端版本之后的所有操作进行变换
    for (let i = clientVersion; i < this.version; i++) {
      const historyOp = this.operationHistory[i];
      if (historyOp) {
        [transformedOp] = this.ot.transform(transformedOp, historyOp.operation, 'right');
      }
    }
    
    return transformedOp;
  }
  
  // 广播操作
  broadcastOperation(operation, excludeClientId) {
    const message = {
      type: 'operation',
      operation,
      version: this.version
    };
    
    this.clients.forEach((client, clientId) => {
      if (clientId !== excludeClientId) {
        this.sendToClient(clientId, message);
        client.version = this.version;
      }
    });
  }
  
  // 发送消息给客户端
  sendToClient(clientId, message) {
    const client = this.clients.get(clientId);
    if (client && client.connection.readyState === WebSocket.OPEN) {
      client.connection.send(JSON.stringify(message));
    }
  }
  
  // 获取文档快照
  getSnapshot() {
    return {
      document: this.document,
      version: this.version,
      clientCount: this.clients.size
    };
  }
}
```

## 📚 最佳实践总结

1. **架构设计**：选择合适的同步策略和冲突解决方案
2. **性能优化**：使用增量同步和数据压缩
3. **冲突处理**：实现多种冲突解决策略
4. **数据一致性**：确保最终一致性和因果一致性
5. **错误恢复**：实现断线重连和数据恢复机制
6. **监控告警**：监控同步延迟和错误率
7. **安全性**：验证操作权限和数据完整性
8. **扩展性**：支持大规模并发用户和数据量

通过掌握这些实时数据同步技术，您将能够构建高效、可靠的协作应用程序。
