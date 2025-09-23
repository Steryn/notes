# WebSocket应用

## 📖 概述

WebSocket 是一种在单个 TCP 连接上进行全双工通信的协议。与传统的 HTTP 请求-响应模式不同，WebSocket 允许服务器和客户端之间进行实时双向数据传输，非常适合构建实时应用程序。

## 🎯 学习目标

- 掌握 WebSocket 协议原理
- 学习 Node.js 中的 WebSocket 实现
- 了解实时应用架构设计
- 掌握 WebSocket 性能优化技巧

## 🚀 快速开始

### 1. 原生 WebSocket 服务器

```javascript
// 使用原生 ws 库
const WebSocket = require('ws');
const http = require('http');

// 创建 HTTP 服务器
const server = http.createServer();

// 创建 WebSocket 服务器
const wss = new WebSocket.Server({ 
  server,
  path: '/ws'
});

// 连接处理
wss.on('connection', (ws, req) => {
  const clientIp = req.socket.remoteAddress;
  console.log(`新客户端连接: ${clientIp}`);
  
  // 发送欢迎消息
  ws.send(JSON.stringify({
    type: 'welcome',
    message: '连接成功',
    timestamp: new Date().toISOString()
  }));
  
  // 消息处理
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);
      console.log('收到消息:', message);
      
      handleMessage(ws, message);
    } catch (error) {
      console.error('消息解析错误:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: '消息格式错误'
      }));
    }
  });
  
  // 连接关闭
  ws.on('close', (code, reason) => {
    console.log(`客户端断开连接: ${code} - ${reason}`);
  });
  
  // 错误处理
  ws.on('error', (error) => {
    console.error('WebSocket 错误:', error);
  });
  
  // 心跳检测
  ws.isAlive = true;
  ws.on('pong', () => {
    ws.isAlive = true;
  });
});

// 心跳检测定时器
const interval = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) {
      return ws.terminate();
    }
    
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

// 清理定时器
wss.on('close', () => {
  clearInterval(interval);
});

// 消息处理函数
function handleMessage(ws, message) {
  switch (message.type) {
    case 'ping':
      ws.send(JSON.stringify({ type: 'pong' }));
      break;
    case 'chat':
      broadcastMessage(message);
      break;
    case 'join-room':
      joinRoom(ws, message.room);
      break;
    case 'leave-room':
      leaveRoom(ws, message.room);
      break;
    default:
      ws.send(JSON.stringify({
        type: 'error',
        message: '未知消息类型'
      }));
  }
}

// 广播消息
function broadcastMessage(message) {
  const broadcastData = JSON.stringify({
    type: 'chat',
    ...message,
    timestamp: new Date().toISOString()
  });
  
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(broadcastData);
    }
  });
}

// 启动服务器
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`WebSocket 服务器运行在端口 ${PORT}`);
});
```

### 2. 客户端连接示例

```javascript
// 浏览器客户端
class WebSocketClient {
  constructor(url) {
    this.url = url;
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectInterval = 1000;
    this.messageHandlers = new Map();
  }
  
  connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.url);
      
      this.ws.onopen = (event) => {
        console.log('WebSocket 连接已建立');
        this.reconnectAttempts = 0;
        resolve(event);
      };
      
      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('消息解析错误:', error);
        }
      };
      
      this.ws.onclose = (event) => {
        console.log('WebSocket 连接已关闭:', event.code, event.reason);
        this.attemptReconnect();
      };
      
      this.ws.onerror = (error) => {
        console.error('WebSocket 错误:', error);
        reject(error);
      };
    });
  }
  
  send(message) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket 未连接，无法发送消息');
    }
  }
  
  on(type, handler) {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, []);
    }
    this.messageHandlers.get(type).push(handler);
  }
  
  handleMessage(message) {
    const handlers = this.messageHandlers.get(message.type);
    if (handlers) {
      handlers.forEach(handler => handler(message));
    }
  }
  
  attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1);
      
      console.log(`尝试重连 (${this.reconnectAttempts}/${this.maxReconnectAttempts})，${delay}ms 后重试`);
      
      setTimeout(() => {
        this.connect().catch(error => {
          console.error('重连失败:', error);
        });
      }, delay);
    } else {
      console.error('达到最大重连次数，停止重连');
    }
  }
  
  disconnect() {
    if (this.ws) {
      this.ws.close();
    }
  }
}

// 使用示例
const client = new WebSocketClient('ws://localhost:3000/ws');

client.on('welcome', (message) => {
  console.log('收到欢迎消息:', message);
});

client.on('chat', (message) => {
  console.log('收到聊天消息:', message);
});

client.connect().then(() => {
  // 发送消息
  client.send({
    type: 'chat',
    user: 'Alice',
    message: 'Hello, World!'
  });
});
```

## 🏗️ 实时应用架构

### 1. 房间管理系统

```javascript
// 房间管理器
class RoomManager {
  constructor() {
    this.rooms = new Map(); // roomId -> Set<WebSocket>
    this.clientRooms = new Map(); // WebSocket -> Set<roomId>
  }
  
  // 创建房间
  createRoom(roomId, options = {}) {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Set());
      console.log(`房间已创建: ${roomId}`);
      return true;
    }
    return false;
  }
  
  // 加入房间
  joinRoom(ws, roomId) {
    // 确保房间存在
    if (!this.rooms.has(roomId)) {
      this.createRoom(roomId);
    }
    
    // 添加客户端到房间
    this.rooms.get(roomId).add(ws);
    
    // 记录客户端所在房间
    if (!this.clientRooms.has(ws)) {
      this.clientRooms.set(ws, new Set());
    }
    this.clientRooms.get(ws).add(roomId);
    
    // 通知房间内其他用户
    this.broadcastToRoom(roomId, {
      type: 'user-joined',
      roomId,
      timestamp: new Date().toISOString()
    }, ws);
    
    // 发送房间信息给新用户
    ws.send(JSON.stringify({
      type: 'room-joined',
      roomId,
      memberCount: this.rooms.get(roomId).size
    }));
    
    console.log(`用户加入房间: ${roomId}`);
  }
  
  // 离开房间
  leaveRoom(ws, roomId) {
    if (this.rooms.has(roomId)) {
      this.rooms.get(roomId).delete(ws);
      
      // 如果房间为空，删除房间
      if (this.rooms.get(roomId).size === 0) {
        this.rooms.delete(roomId);
        console.log(`房间已删除: ${roomId}`);
      } else {
        // 通知房间内其他用户
        this.broadcastToRoom(roomId, {
          type: 'user-left',
          roomId,
          timestamp: new Date().toISOString()
        });
      }
    }
    
    if (this.clientRooms.has(ws)) {
      this.clientRooms.get(ws).delete(roomId);
    }
    
    console.log(`用户离开房间: ${roomId}`);
  }
  
  // 离开所有房间
  leaveAllRooms(ws) {
    if (this.clientRooms.has(ws)) {
      const rooms = Array.from(this.clientRooms.get(ws));
      rooms.forEach(roomId => this.leaveRoom(ws, roomId));
      this.clientRooms.delete(ws);
    }
  }
  
  // 向房间广播消息
  broadcastToRoom(roomId, message, excludeClient = null) {
    if (this.rooms.has(roomId)) {
      const messageData = JSON.stringify(message);
      
      this.rooms.get(roomId).forEach(client => {
        if (client !== excludeClient && client.readyState === WebSocket.OPEN) {
          client.send(messageData);
        }
      });
    }
  }
  
  // 获取房间信息
  getRoomInfo(roomId) {
    return {
      id: roomId,
      memberCount: this.rooms.has(roomId) ? this.rooms.get(roomId).size : 0,
      exists: this.rooms.has(roomId)
    };
  }
  
  // 获取所有房间
  getAllRooms() {
    const roomList = [];
    this.rooms.forEach((clients, roomId) => {
      roomList.push({
        id: roomId,
        memberCount: clients.size
      });
    });
    return roomList;
  }
}

// 使用房间管理器
const roomManager = new RoomManager();

// WebSocket 服务器集成
wss.on('connection', (ws) => {
  ws.on('message', (data) => {
    const message = JSON.parse(data);
    
    switch (message.type) {
      case 'create-room':
        const created = roomManager.createRoom(message.roomId);
        ws.send(JSON.stringify({
          type: 'room-created',
          roomId: message.roomId,
          success: created
        }));
        break;
        
      case 'join-room':
        roomManager.joinRoom(ws, message.roomId);
        break;
        
      case 'leave-room':
        roomManager.leaveRoom(ws, message.roomId);
        break;
        
      case 'room-message':
        roomManager.broadcastToRoom(message.roomId, {
          type: 'room-message',
          roomId: message.roomId,
          user: message.user,
          content: message.content,
          timestamp: new Date().toISOString()
        });
        break;
        
      case 'get-rooms':
        ws.send(JSON.stringify({
          type: 'rooms-list',
          rooms: roomManager.getAllRooms()
        }));
        break;
    }
  });
  
  ws.on('close', () => {
    roomManager.leaveAllRooms(ws);
  });
});
```

### 2. 用户认证和授权

```javascript
// 用户认证管理器
const jwt = require('jsonwebtoken');

class AuthManager {
  constructor(jwtSecret) {
    this.jwtSecret = jwtSecret;
    this.authenticatedClients = new Map(); // WebSocket -> userInfo
  }
  
  // 验证 JWT 令牌
  verifyToken(token) {
    try {
      return jwt.verify(token, this.jwtSecret);
    } catch (error) {
      throw new Error('Invalid token');
    }
  }
  
  // 认证客户端
  authenticateClient(ws, token) {
    try {
      const decoded = this.verifyToken(token);
      const userInfo = {
        id: decoded.userId,
        username: decoded.username,
        roles: decoded.roles || [],
        authenticatedAt: new Date()
      };
      
      this.authenticatedClients.set(ws, userInfo);
      return userInfo;
    } catch (error) {
      throw new Error('Authentication failed');
    }
  }
  
  // 获取用户信息
  getUserInfo(ws) {
    return this.authenticatedClients.get(ws);
  }
  
  // 检查权限
  hasPermission(ws, permission) {
    const userInfo = this.getUserInfo(ws);
    return userInfo && userInfo.roles.includes(permission);
  }
  
  // 移除认证信息
  removeClient(ws) {
    this.authenticatedClients.delete(ws);
  }
  
  // 获取在线用户列表
  getOnlineUsers() {
    const users = [];
    this.authenticatedClients.forEach((userInfo, ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        users.push({
          id: userInfo.id,
          username: userInfo.username,
          authenticatedAt: userInfo.authenticatedAt
        });
      }
    });
    return users;
  }
}

// 认证中间件
function requireAuth(authManager) {
  return (ws, message, next) => {
    const userInfo = authManager.getUserInfo(ws);
    if (!userInfo) {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Authentication required'
      }));
      return;
    }
    
    message.user = userInfo;
    next();
  };
}

// 权限检查中间件
function requirePermission(authManager, permission) {
  return (ws, message, next) => {
    if (!authManager.hasPermission(ws, permission)) {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Insufficient permissions'
      }));
      return;
    }
    
    next();
  };
}

// 使用认证
const authManager = new AuthManager(process.env.JWT_SECRET);

wss.on('connection', (ws) => {
  let isAuthenticated = false;
  
  ws.on('message', (data) => {
    const message = JSON.parse(data);
    
    if (message.type === 'auth') {
      try {
        const userInfo = authManager.authenticateClient(ws, message.token);
        isAuthenticated = true;
        
        ws.send(JSON.stringify({
          type: 'auth-success',
          user: userInfo
        }));
      } catch (error) {
        ws.send(JSON.stringify({
          type: 'auth-failed',
          message: error.message
        }));
        ws.close();
      }
      return;
    }
    
    // 需要认证的操作
    if (!isAuthenticated) {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Please authenticate first'
      }));
      return;
    }
    
    // 处理认证后的消息
    handleAuthenticatedMessage(ws, message);
  });
  
  ws.on('close', () => {
    authManager.removeClient(ws);
  });
});

function handleAuthenticatedMessage(ws, message) {
  const userInfo = authManager.getUserInfo(ws);
  
  switch (message.type) {
    case 'admin-broadcast':
      if (authManager.hasPermission(ws, 'admin')) {
        broadcastToAll({
          type: 'admin-message',
          content: message.content,
          from: userInfo.username
        });
      } else {
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Admin permission required'
        }));
      }
      break;
      
    case 'get-online-users':
      ws.send(JSON.stringify({
        type: 'online-users',
        users: authManager.getOnlineUsers()
      }));
      break;
  }
}
```

### 3. 消息队列和持久化

```javascript
// 消息队列管理器
const Redis = require('redis');

class MessageQueue {
  constructor(redisConfig) {
    this.redis = Redis.createClient(redisConfig);
    this.subscriber = Redis.createClient(redisConfig);
    this.messageHandlers = new Map();
    
    this.setupSubscriber();
  }
  
  setupSubscriber() {
    this.subscriber.on('message', (channel, message) => {
      const handlers = this.messageHandlers.get(channel);
      if (handlers) {
        const messageData = JSON.parse(message);
        handlers.forEach(handler => handler(messageData));
      }
    });
  }
  
  // 发布消息
  async publish(channel, message) {
    await this.redis.publish(channel, JSON.stringify(message));
  }
  
  // 订阅频道
  subscribe(channel, handler) {
    if (!this.messageHandlers.has(channel)) {
      this.messageHandlers.set(channel, []);
      this.subscriber.subscribe(channel);
    }
    
    this.messageHandlers.get(channel).push(handler);
  }
  
  // 存储消息到历史记录
  async storeMessage(roomId, message) {
    const key = `room:${roomId}:messages`;
    const messageData = {
      ...message,
      timestamp: new Date().toISOString()
    };
    
    // 使用 Redis List 存储消息
    await this.redis.lpush(key, JSON.stringify(messageData));
    
    // 只保留最近 1000 条消息
    await this.redis.ltrim(key, 0, 999);
  }
  
  // 获取历史消息
  async getMessageHistory(roomId, limit = 50) {
    const key = `room:${roomId}:messages`;
    const messages = await this.redis.lrange(key, 0, limit - 1);
    
    return messages.map(msg => JSON.parse(msg)).reverse();
  }
  
  // 存储用户会话
  async storeUserSession(userId, sessionData) {
    const key = `user:${userId}:session`;
    await this.redis.setex(key, 3600, JSON.stringify(sessionData)); // 1小时过期
  }
  
  // 获取用户会话
  async getUserSession(userId) {
    const key = `user:${userId}:session`;
    const sessionData = await this.redis.get(key);
    return sessionData ? JSON.parse(sessionData) : null;
  }
}

// 集成消息队列
const messageQueue = new MessageQueue({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379
});

// 订阅跨服务器消息
messageQueue.subscribe('room-broadcast', (message) => {
  roomManager.broadcastToRoom(message.roomId, message.data);
});

// 修改房间消息处理
function handleRoomMessage(ws, message) {
  const userInfo = authManager.getUserInfo(ws);
  const messageData = {
    type: 'room-message',
    roomId: message.roomId,
    user: {
      id: userInfo.id,
      username: userInfo.username
    },
    content: message.content,
    timestamp: new Date().toISOString()
  };
  
  // 存储消息到历史记录
  messageQueue.storeMessage(message.roomId, messageData);
  
  // 发布到其他服务器实例
  messageQueue.publish('room-broadcast', {
    roomId: message.roomId,
    data: messageData
  });
  
  // 本地广播
  roomManager.broadcastToRoom(message.roomId, messageData);
}

// 获取历史消息
wss.on('connection', (ws) => {
  ws.on('message', async (data) => {
    const message = JSON.parse(data);
    
    if (message.type === 'get-history') {
      const history = await messageQueue.getMessageHistory(message.roomId, message.limit);
      ws.send(JSON.stringify({
        type: 'message-history',
        roomId: message.roomId,
        messages: history
      }));
    }
  });
});
```

## 📊 性能优化

### 1. 连接池管理

```javascript
// 连接池管理器
class ConnectionPool {
  constructor(maxConnections = 10000) {
    this.maxConnections = maxConnections;
    this.connections = new Set();
    this.connectionStats = {
      total: 0,
      active: 0,
      inactive: 0
    };
    
    // 定期清理无效连接
    setInterval(() => {
      this.cleanupConnections();
    }, 30000);
  }
  
  addConnection(ws) {
    if (this.connections.size >= this.maxConnections) {
      throw new Error('Connection limit exceeded');
    }
    
    this.connections.add(ws);
    this.updateStats();
    
    ws.on('close', () => {
      this.removeConnection(ws);
    });
    
    console.log(`连接已添加，当前连接数: ${this.connections.size}`);
  }
  
  removeConnection(ws) {
    this.connections.delete(ws);
    this.updateStats();
    console.log(`连接已移除，当前连接数: ${this.connections.size}`);
  }
  
  cleanupConnections() {
    const before = this.connections.size;
    
    this.connections.forEach(ws => {
      if (ws.readyState !== WebSocket.OPEN) {
        this.connections.delete(ws);
      }
    });
    
    const cleaned = before - this.connections.size;
    if (cleaned > 0) {
      console.log(`清理了 ${cleaned} 个无效连接`);
      this.updateStats();
    }
  }
  
  updateStats() {
    this.connectionStats.total = this.connections.size;
    this.connectionStats.active = 0;
    this.connectionStats.inactive = 0;
    
    this.connections.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        this.connectionStats.active++;
      } else {
        this.connectionStats.inactive++;
      }
    });
  }
  
  getStats() {
    this.updateStats();
    return { ...this.connectionStats };
  }
  
  broadcast(message) {
    const messageData = JSON.stringify(message);
    let sentCount = 0;
    
    this.connections.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(messageData);
        sentCount++;
      }
    });
    
    return sentCount;
  }
}

const connectionPool = new ConnectionPool(10000);

// 连接限制中间件
wss.on('connection', (ws, req) => {
  try {
    connectionPool.addConnection(ws);
  } catch (error) {
    ws.close(1013, 'Server overloaded');
    return;
  }
  
  // 正常处理连接
  handleConnection(ws, req);
});
```

### 2. 消息批处理

```javascript
// 消息批处理器
class MessageBatcher {
  constructor(batchSize = 100, flushInterval = 100) {
    this.batchSize = batchSize;
    this.flushInterval = flushInterval;
    this.batches = new Map(); // roomId -> messages[]
    this.timers = new Map(); // roomId -> timer
  }
  
  addMessage(roomId, message) {
    if (!this.batches.has(roomId)) {
      this.batches.set(roomId, []);
    }
    
    this.batches.get(roomId).push(message);
    
    // 检查是否需要立即刷新
    if (this.batches.get(roomId).length >= this.batchSize) {
      this.flush(roomId);
    } else {
      // 设置定时器
      this.scheduleFlush(roomId);
    }
  }
  
  scheduleFlush(roomId) {
    if (this.timers.has(roomId)) {
      return; // 已经有定时器了
    }
    
    const timer = setTimeout(() => {
      this.flush(roomId);
    }, this.flushInterval);
    
    this.timers.set(roomId, timer);
  }
  
  flush(roomId) {
    const messages = this.batches.get(roomId);
    if (!messages || messages.length === 0) {
      return;
    }
    
    // 清理定时器
    if (this.timers.has(roomId)) {
      clearTimeout(this.timers.get(roomId));
      this.timers.delete(roomId);
    }
    
    // 发送批量消息
    roomManager.broadcastToRoom(roomId, {
      type: 'message-batch',
      messages: messages,
      timestamp: new Date().toISOString()
    });
    
    // 清空批次
    this.batches.set(roomId, []);
    
    console.log(`刷新了 ${messages.length} 条消息到房间 ${roomId}`);
  }
  
  flushAll() {
    this.batches.forEach((messages, roomId) => {
      if (messages.length > 0) {
        this.flush(roomId);
      }
    });
  }
}

const messageBatcher = new MessageBatcher(50, 200);

// 使用批处理
function handleBatchedMessage(ws, message) {
  const userInfo = authManager.getUserInfo(ws);
  const messageData = {
    user: userInfo.username,
    content: message.content,
    timestamp: new Date().toISOString()
  };
  
  messageBatcher.addMessage(message.roomId, messageData);
}
```

### 3. 压缩和优化

```javascript
// 消息压缩
const zlib = require('zlib');

class MessageCompressor {
  constructor() {
    this.compressionThreshold = 1024; // 1KB
  }
  
  async compress(data) {
    const jsonData = JSON.stringify(data);
    
    if (jsonData.length < this.compressionThreshold) {
      return {
        compressed: false,
        data: jsonData
      };
    }
    
    try {
      const compressed = await new Promise((resolve, reject) => {
        zlib.gzip(jsonData, (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      });
      
      return {
        compressed: true,
        data: compressed.toString('base64')
      };
    } catch (error) {
      console.error('压缩失败:', error);
      return {
        compressed: false,
        data: jsonData
      };
    }
  }
  
  async decompress(compressedData) {
    try {
      const buffer = Buffer.from(compressedData, 'base64');
      const decompressed = await new Promise((resolve, reject) => {
        zlib.gunzip(buffer, (err, result) => {
          if (err) reject(err);
          else resolve(result.toString());
        });
      });
      
      return JSON.parse(decompressed);
    } catch (error) {
      console.error('解压失败:', error);
      throw error;
    }
  }
}

// 优化的发送函数
const compressor = new MessageCompressor();

async function sendOptimizedMessage(ws, data) {
  try {
    const result = await compressor.compress(data);
    
    if (result.compressed) {
      ws.send(JSON.stringify({
        type: 'compressed',
        data: result.data
      }));
    } else {
      ws.send(result.data);
    }
  } catch (error) {
    console.error('发送消息失败:', error);
  }
}

// 客户端解压处理
ws.on('message', async (data) => {
  try {
    const message = JSON.parse(data);
    
    if (message.type === 'compressed') {
      const decompressed = await compressor.decompress(message.data);
      handleMessage(ws, decompressed);
    } else {
      handleMessage(ws, message);
    }
  } catch (error) {
    console.error('消息处理失败:', error);
  }
});
```

## 🔧 监控和调试

### 1. 性能监控

```javascript
// 性能监控器
class PerformanceMonitor {
  constructor() {
    this.metrics = {
      connections: {
        total: 0,
        active: 0,
        peak: 0
      },
      messages: {
        sent: 0,
        received: 0,
        failed: 0,
        rate: 0
      },
      rooms: {
        total: 0,
        active: 0
      },
      memory: {
        heapUsed: 0,
        heapTotal: 0,
        external: 0
      }
    };
    
    this.startTime = Date.now();
    this.lastMessageCount = 0;
    
    // 定期更新指标
    setInterval(() => {
      this.updateMetrics();
    }, 5000);
  }
  
  updateMetrics() {
    // 连接指标
    this.metrics.connections.total = connectionPool.connections.size;
    this.metrics.connections.active = connectionPool.getStats().active;
    this.metrics.connections.peak = Math.max(
      this.metrics.connections.peak,
      this.metrics.connections.total
    );
    
    // 房间指标
    this.metrics.rooms.total = roomManager.rooms.size;
    this.metrics.rooms.active = Array.from(roomManager.rooms.values())
      .filter(clients => clients.size > 0).length;
    
    // 消息速率
    const currentMessageCount = this.metrics.messages.sent + this.metrics.messages.received;
    const messageRate = (currentMessageCount - this.lastMessageCount) / 5; // 每秒消息数
    this.metrics.messages.rate = messageRate;
    this.lastMessageCount = currentMessageCount;
    
    // 内存使用
    const memUsage = process.memoryUsage();
    this.metrics.memory.heapUsed = Math.round(memUsage.heapUsed / 1024 / 1024);
    this.metrics.memory.heapTotal = Math.round(memUsage.heapTotal / 1024 / 1024);
    this.metrics.memory.external = Math.round(memUsage.external / 1024 / 1024);
  }
  
  incrementMessageSent() {
    this.metrics.messages.sent++;
  }
  
  incrementMessageReceived() {
    this.metrics.messages.received++;
  }
  
  incrementMessageFailed() {
    this.metrics.messages.failed++;
  }
  
  getMetrics() {
    this.updateMetrics();
    return {
      ...this.metrics,
      uptime: Math.round((Date.now() - this.startTime) / 1000)
    };
  }
  
  getHealthStatus() {
    const metrics = this.getMetrics();
    
    return {
      status: this.determineHealthStatus(metrics),
      timestamp: new Date().toISOString(),
      metrics
    };
  }
  
  determineHealthStatus(metrics) {
    // 简单的健康状态判断
    if (metrics.memory.heapUsed > 500) { // 500MB
      return 'warning';
    }
    
    if (metrics.connections.active > 8000) {
      return 'warning';
    }
    
    if (metrics.messages.failed / (metrics.messages.sent + metrics.messages.received) > 0.1) {
      return 'critical';
    }
    
    return 'healthy';
  }
}

const performanceMonitor = new PerformanceMonitor();

// 监控端点
const express = require('express');
const app = express();

app.get('/health', (req, res) => {
  const health = performanceMonitor.getHealthStatus();
  const statusCode = health.status === 'healthy' ? 200 : 
                    health.status === 'warning' ? 200 : 503;
  
  res.status(statusCode).json(health);
});

app.get('/metrics', (req, res) => {
  res.json(performanceMonitor.getMetrics());
});

app.listen(3001, () => {
  console.log('监控服务器运行在端口 3001');
});
```

### 2. 日志记录

```javascript
// 日志记录器
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'websocket-server' },
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// WebSocket 事件日志
function logWebSocketEvent(event, ws, data = {}) {
  const clientInfo = {
    remoteAddress: ws._socket?.remoteAddress,
    userAgent: ws.upgradeReq?.headers['user-agent']
  };
  
  logger.info('WebSocket Event', {
    event,
    clientInfo,
    data,
    timestamp: new Date().toISOString()
  });
}

// 集成日志记录
wss.on('connection', (ws, req) => {
  logWebSocketEvent('connection', ws, {
    url: req.url,
    headers: req.headers
  });
  
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);
      performanceMonitor.incrementMessageReceived();
      
      logWebSocketEvent('message', ws, {
        type: message.type,
        size: data.length
      });
    } catch (error) {
      performanceMonitor.incrementMessageFailed();
      
      logger.error('Message parsing failed', {
        error: error.message,
        data: data.toString()
      });
    }
  });
  
  ws.on('close', (code, reason) => {
    logWebSocketEvent('close', ws, {
      code,
      reason: reason.toString()
    });
  });
  
  ws.on('error', (error) => {
    performanceMonitor.incrementMessageFailed();
    
    logger.error('WebSocket error', {
      error: error.message,
      stack: error.stack
    });
  });
});
```

## 🚀 实际应用示例

### 完整的实时聊天应用

```javascript
// 完整的 WebSocket 聊天服务器
const WebSocket = require('ws');
const express = require('express');
const http = require('http');
const path = require('path');

// 创建 Express 应用
const app = express();
const server = http.createServer(app);

// 静态文件服务
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// 创建 WebSocket 服务器
const wss = new WebSocket.Server({ 
  server,
  path: '/chat'
});

// 初始化组件
const connectionPool = new ConnectionPool(1000);
const roomManager = new RoomManager();
const authManager = new AuthManager(process.env.JWT_SECRET || 'secret');
const performanceMonitor = new PerformanceMonitor();
const messageBatcher = new MessageBatcher(20, 100);

// WebSocket 连接处理
wss.on('connection', (ws, req) => {
  try {
    connectionPool.addConnection(ws);
    logWebSocketEvent('connection', ws);
  } catch (error) {
    logger.error('Connection rejected', { error: error.message });
    ws.close(1013, 'Server overloaded');
    return;
  }
  
  let isAuthenticated = false;
  let userInfo = null;
  
  // 发送欢迎消息
  ws.send(JSON.stringify({
    type: 'welcome',
    message: '欢迎连接到聊天服务器',
    serverTime: new Date().toISOString()
  }));
  
  ws.on('message', async (data) => {
    try {
      const message = JSON.parse(data);
      performanceMonitor.incrementMessageReceived();
      
      // 认证处理
      if (message.type === 'auth') {
        try {
          userInfo = authManager.authenticateClient(ws, message.token);
          isAuthenticated = true;
          
          ws.send(JSON.stringify({
            type: 'auth-success',
            user: {
              id: userInfo.id,
              username: userInfo.username,
              roles: userInfo.roles
            }
          }));
          
          logger.info('User authenticated', { 
            userId: userInfo.id, 
            username: userInfo.username 
          });
        } catch (error) {
          ws.send(JSON.stringify({
            type: 'auth-failed',
            message: error.message
          }));
          ws.close(1008, 'Authentication failed');
        }
        return;
      }
      
      // 需要认证的操作
      if (!isAuthenticated) {
        ws.send(JSON.stringify({
          type: 'error',
          message: '请先进行身份认证'
        }));
        return;
      }
      
      // 处理认证后的消息
      await handleAuthenticatedMessage(ws, message, userInfo);
      
    } catch (error) {
      performanceMonitor.incrementMessageFailed();
      logger.error('Message handling failed', { error: error.message });
      
      ws.send(JSON.stringify({
        type: 'error',
        message: '消息处理失败'
      }));
    }
  });
  
  ws.on('close', (code, reason) => {
    if (isAuthenticated) {
      roomManager.leaveAllRooms(ws);
      authManager.removeClient(ws);
    }
    
    logWebSocketEvent('close', ws, { code, reason: reason.toString() });
  });
  
  ws.on('error', (error) => {
    logger.error('WebSocket error', { error: error.message });
  });
});

// 认证后的消息处理
async function handleAuthenticatedMessage(ws, message, userInfo) {
  switch (message.type) {
    case 'join-room':
      roomManager.joinRoom(ws, message.roomId);
      
      // 发送历史消息
      if (messageQueue) {
        const history = await messageQueue.getMessageHistory(message.roomId, 50);
        ws.send(JSON.stringify({
          type: 'message-history',
          roomId: message.roomId,
          messages: history
        }));
      }
      break;
      
    case 'leave-room':
      roomManager.leaveRoom(ws, message.roomId);
      break;
      
    case 'chat-message':
      const chatMessage = {
        type: 'chat-message',
        roomId: message.roomId,
        user: {
          id: userInfo.id,
          username: userInfo.username
        },
        content: message.content,
        timestamp: new Date().toISOString()
      };
      
      // 存储消息
      if (messageQueue) {
        await messageQueue.storeMessage(message.roomId, chatMessage);
      }
      
      // 广播消息
      roomManager.broadcastToRoom(message.roomId, chatMessage);
      performanceMonitor.incrementMessageSent();
      break;
      
    case 'get-rooms':
      ws.send(JSON.stringify({
        type: 'rooms-list',
        rooms: roomManager.getAllRooms()
      }));
      break;
      
    case 'get-online-users':
      ws.send(JSON.stringify({
        type: 'online-users',
        users: authManager.getOnlineUsers()
      }));
      break;
      
    default:
      ws.send(JSON.stringify({
        type: 'error',
        message: '未知消息类型'
      }));
  }
}

// API 端点
app.post('/api/auth', (req, res) => {
  // 简单的认证逻辑（实际应用中应该连接真实的用户系统）
  const { username, password } = req.body;
  
  if (username && password) {
    const token = jwt.sign(
      { 
        userId: Date.now().toString(),
        username,
        roles: ['user']
      },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '24h' }
    );
    
    res.json({ token });
  } else {
    res.status(400).json({ error: '用户名和密码是必需的' });
  }
});

// 启动服务器
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`聊天服务器运行在端口 ${PORT}`);
  console.log(`WebSocket 端点: ws://localhost:${PORT}/chat`);
  console.log(`监控端点: http://localhost:${PORT}/health`);
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('收到 SIGTERM，正在关闭服务器...');
  
  wss.clients.forEach(ws => {
    ws.close(1001, 'Server shutdown');
  });
  
  server.close(() => {
    console.log('服务器已关闭');
    process.exit(0);
  });
});
```

## 📚 最佳实践总结

1. **连接管理**：实现连接池和限制，防止资源耗尽
2. **认证授权**：使用 JWT 等标准方式进行身份验证
3. **错误处理**：优雅处理连接错误和消息解析错误
4. **性能优化**：使用消息批处理、压缩等技术
5. **监控日志**：实现全面的性能监控和日志记录
6. **扩展性**：使用 Redis 等外部存储支持多实例部署
7. **安全性**：验证输入数据，防止 XSS 和注入攻击

通过掌握这些 WebSocket 技术，您将能够构建高性能、可扩展的实时应用程序。
