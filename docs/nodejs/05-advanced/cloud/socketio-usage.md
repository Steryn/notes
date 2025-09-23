# Socket.io使用

## 📖 概述

Socket.IO 是一个基于事件的实时双向通信库，它在 WebSocket 的基础上提供了更多功能，包括自动重连、房间管理、命名空间、中间件等。Socket.IO 能够自动降级到其他传输方式，确保在各种网络环境下的可靠连接。

## 🎯 学习目标

- 掌握 Socket.IO 的核心概念和特性
- 学习服务器端和客户端的开发
- 了解房间、命名空间等高级功能
- 掌握集群部署和扩展策略

## 🚀 快速开始

### 1. 基本服务器设置

```javascript
// server.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: ["http://localhost:3000", "https://myapp.com"],
    methods: ["GET", "POST"],
    credentials: true
  },
  pingTimeout: 60000,
  pingInterval: 25000
});

// 静态文件服务
app.use(express.static(path.join(__dirname, 'public')));

// 连接事件处理
io.on('connection', (socket) => {
  console.log('新用户连接:', socket.id);
  
  // 发送欢迎消息
  socket.emit('welcome', {
    message: '欢迎连接到服务器',
    socketId: socket.id,
    timestamp: new Date().toISOString()
  });
  
  // 处理自定义事件
  socket.on('chat message', (msg) => {
    console.log('收到消息:', msg);
    
    // 广播给所有客户端
    io.emit('chat message', {
      id: socket.id,
      message: msg,
      timestamp: new Date().toISOString()
    });
  });
  
  // 处理私聊消息
  socket.on('private message', (data) => {
    const { targetSocketId, message } = data;
    
    // 发送给特定客户端
    socket.to(targetSocketId).emit('private message', {
      from: socket.id,
      message: message,
      timestamp: new Date().toISOString()
    });
  });
  
  // 断开连接
  socket.on('disconnect', (reason) => {
    console.log('用户断开连接:', socket.id, '原因:', reason);
  });
  
  // 错误处理
  socket.on('error', (error) => {
    console.error('Socket错误:', error);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Socket.IO服务器运行在端口 ${PORT}`);
});
```

### 2. 基本客户端连接

```javascript
// client.js (浏览器端)
const socket = io('http://localhost:3000', {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  timeout: 20000
});

// 连接成功
socket.on('connect', () => {
  console.log('连接成功, Socket ID:', socket.id);
  
  // 加入用户信息
  socket.emit('user info', {
    username: 'Alice',
    avatar: 'avatar-url'
  });
});

// 接收欢迎消息
socket.on('welcome', (data) => {
  console.log('欢迎消息:', data);
});

// 接收聊天消息
socket.on('chat message', (data) => {
  console.log('收到消息:', data);
  displayMessage(data);
});

// 接收私聊消息
socket.on('private message', (data) => {
  console.log('收到私聊:', data);
  displayPrivateMessage(data);
});

// 连接断开
socket.on('disconnect', (reason) => {
  console.log('连接断开:', reason);
});

// 重连成功
socket.on('reconnect', (attemptNumber) => {
  console.log('重连成功, 尝试次数:', attemptNumber);
});

// 重连失败
socket.on('reconnect_failed', () => {
  console.log('重连失败');
  alert('无法连接到服务器，请刷新页面重试');
});

// 发送消息函数
function sendMessage(message) {
  if (socket.connected) {
    socket.emit('chat message', message);
  } else {
    console.warn('Socket未连接，无法发送消息');
  }
}

// 发送私聊消息
function sendPrivateMessage(targetSocketId, message) {
  socket.emit('private message', {
    targetSocketId: targetSocketId,
    message: message
  });
}

// 显示消息
function displayMessage(data) {
  const messageDiv = document.createElement('div');
  messageDiv.innerHTML = `
    <strong>${data.id}:</strong> ${data.message}
    <small>(${new Date(data.timestamp).toLocaleTimeString()})</small>
  `;
  document.getElementById('messages').appendChild(messageDiv);
}
```

## 🏠 房间管理

### 1. 基本房间操作

```javascript
// 房间管理器
class RoomManager {
  constructor(io) {
    this.io = io;
    this.rooms = new Map(); // roomId -> room info
    this.userRooms = new Map(); // socketId -> Set of roomIds
  }
  
  // 创建房间
  createRoom(roomId, roomInfo = {}) {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, {
        id: roomId,
        name: roomInfo.name || roomId,
        createdAt: new Date(),
        createdBy: roomInfo.createdBy,
        maxUsers: roomInfo.maxUsers || 100,
        isPrivate: roomInfo.isPrivate || false,
        password: roomInfo.password,
        users: new Set()
      });
      
      console.log(`房间已创建: ${roomId}`);
      return true;
    }
    return false;
  }
  
  // 加入房间
  async joinRoom(socket, roomId, password = null) {
    const room = this.rooms.get(roomId);
    
    if (!room) {
      socket.emit('room error', { message: '房间不存在' });
      return false;
    }
    
    // 检查房间密码
    if (room.isPrivate && room.password !== password) {
      socket.emit('room error', { message: '房间密码错误' });
      return false;
    }
    
    // 检查房间人数限制
    if (room.users.size >= room.maxUsers) {
      socket.emit('room error', { message: '房间已满' });
      return false;
    }
    
    // 加入 Socket.IO 房间
    await socket.join(roomId);
    
    // 更新房间信息
    room.users.add(socket.id);
    
    // 更新用户房间记录
    if (!this.userRooms.has(socket.id)) {
      this.userRooms.set(socket.id, new Set());
    }
    this.userRooms.get(socket.id).add(roomId);
    
    // 通知房间内其他用户
    socket.to(roomId).emit('user joined', {
      socketId: socket.id,
      username: socket.username,
      roomId: roomId,
      userCount: room.users.size
    });
    
    // 发送房间信息给新用户
    socket.emit('room joined', {
      roomId: roomId,
      roomName: room.name,
      userCount: room.users.size,
      users: Array.from(room.users)
    });
    
    console.log(`用户 ${socket.id} 加入房间 ${roomId}`);
    return true;
  }
  
  // 离开房间
  async leaveRoom(socket, roomId) {
    const room = this.rooms.get(roomId);
    
    if (room && room.users.has(socket.id)) {
      // 离开 Socket.IO 房间
      await socket.leave(roomId);
      
      // 更新房间信息
      room.users.delete(socket.id);
      
      // 更新用户房间记录
      if (this.userRooms.has(socket.id)) {
        this.userRooms.get(socket.id).delete(roomId);
      }
      
      // 通知房间内其他用户
      socket.to(roomId).emit('user left', {
        socketId: socket.id,
        username: socket.username,
        roomId: roomId,
        userCount: room.users.size
      });
      
      // 如果房间为空，删除房间
      if (room.users.size === 0) {
        this.rooms.delete(roomId);
        console.log(`房间 ${roomId} 已删除`);
      }
      
      console.log(`用户 ${socket.id} 离开房间 ${roomId}`);
      return true;
    }
    
    return false;
  }
  
  // 离开所有房间
  async leaveAllRooms(socket) {
    if (this.userRooms.has(socket.id)) {
      const rooms = Array.from(this.userRooms.get(socket.id));
      for (const roomId of rooms) {
        await this.leaveRoom(socket, roomId);
      }
      this.userRooms.delete(socket.id);
    }
  }
  
  // 向房间发送消息
  sendToRoom(roomId, event, data) {
    this.io.to(roomId).emit(event, data);
  }
  
  // 获取房间列表
  getRoomList() {
    const roomList = [];
    this.rooms.forEach((room, roomId) => {
      if (!room.isPrivate) {
        roomList.push({
          id: roomId,
          name: room.name,
          userCount: room.users.size,
          maxUsers: room.maxUsers,
          createdAt: room.createdAt
        });
      }
    });
    return roomList;
  }
  
  // 获取房间信息
  getRoomInfo(roomId) {
    const room = this.rooms.get(roomId);
    if (room) {
      return {
        id: roomId,
        name: room.name,
        userCount: room.users.size,
        maxUsers: room.maxUsers,
        createdAt: room.createdAt,
        users: Array.from(room.users)
      };
    }
    return null;
  }
}

// 使用房间管理器
const roomManager = new RoomManager(io);

io.on('connection', (socket) => {
  // 设置用户信息
  socket.on('set username', (username) => {
    socket.username = username;
    console.log(`用户设置用户名: ${username}`);
  });
  
  // 创建房间
  socket.on('create room', (data) => {
    const { roomId, roomName, isPrivate, password, maxUsers } = data;
    const created = roomManager.createRoom(roomId, {
      name: roomName,
      createdBy: socket.id,
      isPrivate,
      password,
      maxUsers
    });
    
    socket.emit('room created', {
      success: created,
      roomId: created ? roomId : null
    });
  });
  
  // 加入房间
  socket.on('join room', async (data) => {
    const { roomId, password } = data;
    await roomManager.joinRoom(socket, roomId, password);
  });
  
  // 离开房间
  socket.on('leave room', async (roomId) => {
    await roomManager.leaveRoom(socket, roomId);
  });
  
  // 房间消息
  socket.on('room message', (data) => {
    const { roomId, message } = data;
    
    // 广播给房间内所有用户
    socket.to(roomId).emit('room message', {
      from: socket.id,
      username: socket.username,
      message: message,
      roomId: roomId,
      timestamp: new Date().toISOString()
    });
  });
  
  // 获取房间列表
  socket.on('get rooms', () => {
    socket.emit('room list', roomManager.getRoomList());
  });
  
  // 获取房间信息
  socket.on('get room info', (roomId) => {
    const roomInfo = roomManager.getRoomInfo(roomId);
    socket.emit('room info', roomInfo);
  });
  
  // 断开连接时清理
  socket.on('disconnect', async () => {
    await roomManager.leaveAllRooms(socket);
  });
});
```

## 🌐 命名空间

### 1. 命名空间配置

```javascript
// 主命名空间
const mainNamespace = io.of('/');

// 聊天命名空间
const chatNamespace = io.of('/chat');

// 游戏命名空间
const gameNamespace = io.of('/game');

// 管理员命名空间
const adminNamespace = io.of('/admin');

// 聊天命名空间处理
chatNamespace.use((socket, next) => {
  // 认证中间件
  const token = socket.handshake.auth.token;
  
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      socket.username = decoded.username;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  } else {
    next(new Error('Authentication error'));
  }
});

chatNamespace.on('connection', (socket) => {
  console.log(`用户连接到聊天命名空间: ${socket.userId}`);
  
  // 加入用户专属房间
  socket.join(`user:${socket.userId}`);
  
  // 处理聊天消息
  socket.on('chat message', (data) => {
    const message = {
      id: generateMessageId(),
      from: socket.userId,
      username: socket.username,
      content: data.content,
      type: data.type || 'text',
      timestamp: new Date().toISOString()
    };
    
    // 保存消息到数据库
    saveMessage(message);
    
    // 广播消息
    if (data.roomId) {
      socket.to(data.roomId).emit('chat message', message);
    } else {
      chatNamespace.emit('chat message', message);
    }
  });
  
  // 处理私聊
  socket.on('private message', (data) => {
    const message = {
      id: generateMessageId(),
      from: socket.userId,
      to: data.to,
      content: data.content,
      type: 'private',
      timestamp: new Date().toISOString()
    };
    
    // 保存私聊消息
    savePrivateMessage(message);
    
    // 发送给目标用户
    socket.to(`user:${data.to}`).emit('private message', message);
    
    // 确认发送成功
    socket.emit('message sent', { messageId: message.id });
  });
  
  socket.on('disconnect', () => {
    console.log(`用户从聊天命名空间断开: ${socket.userId}`);
  });
});

// 游戏命名空间处理
gameNamespace.on('connection', (socket) => {
  console.log('用户连接到游戏命名空间:', socket.id);
  
  // 游戏房间管理
  socket.on('join game', (gameId) => {
    socket.join(`game:${gameId}`);
    
    // 通知其他玩家
    socket.to(`game:${gameId}`).emit('player joined', {
      playerId: socket.id,
      gameId: gameId
    });
  });
  
  // 游戏状态更新
  socket.on('game action', (data) => {
    // 处理游戏动作
    const gameState = processGameAction(data);
    
    // 广播游戏状态
    gameNamespace.to(`game:${data.gameId}`).emit('game update', gameState);
  });
  
  socket.on('disconnect', () => {
    // 通知游戏中的其他玩家
    gameNamespace.emit('player disconnected', socket.id);
  });
});

// 管理员命名空间
adminNamespace.use((socket, next) => {
  // 管理员权限验证
  const token = socket.handshake.auth.token;
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role === 'admin') {
      socket.userId = decoded.userId;
      next();
    } else {
      next(new Error('Insufficient permissions'));
    }
  } catch (err) {
    next(new Error('Authentication error'));
  }
});

adminNamespace.on('connection', (socket) => {
  console.log('管理员连接:', socket.userId);
  
  // 获取系统统计
  socket.on('get stats', () => {
    const stats = {
      totalConnections: io.engine.clientsCount,
      chatConnections: chatNamespace.sockets.size,
      gameConnections: gameNamespace.sockets.size,
      adminConnections: adminNamespace.sockets.size,
      rooms: Array.from(io.sockets.adapter.rooms.keys())
    };
    
    socket.emit('stats', stats);
  });
  
  // 广播系统消息
  socket.on('broadcast message', (data) => {
    io.emit('system message', {
      type: 'announcement',
      content: data.message,
      from: 'system',
      timestamp: new Date().toISOString()
    });
  });
  
  // 踢出用户
  socket.on('kick user', (socketId) => {
    const targetSocket = io.sockets.sockets.get(socketId);
    if (targetSocket) {
      targetSocket.emit('kicked', { reason: '管理员踢出' });
      targetSocket.disconnect(true);
    }
  });
});
```

### 2. 客户端命名空间连接

```javascript
// 连接到不同命名空间
const chatSocket = io('/chat', {
  auth: {
    token: localStorage.getItem('authToken')
  }
});

const gameSocket = io('/game');

const adminSocket = io('/admin', {
  auth: {
    token: localStorage.getItem('adminToken')
  }
});

// 聊天功能
chatSocket.on('connect', () => {
  console.log('连接到聊天服务');
});

chatSocket.on('chat message', (message) => {
  displayChatMessage(message);
});

chatSocket.on('private message', (message) => {
  displayPrivateMessage(message);
});

// 发送聊天消息
function sendChatMessage(content, roomId = null) {
  chatSocket.emit('chat message', {
    content: content,
    roomId: roomId
  });
}

// 发送私聊消息
function sendPrivateMessage(to, content) {
  chatSocket.emit('private message', {
    to: to,
    content: content
  });
}

// 游戏功能
gameSocket.on('connect', () => {
  console.log('连接到游戏服务');
});

gameSocket.on('game update', (gameState) => {
  updateGameUI(gameState);
});

// 加入游戏
function joinGame(gameId) {
  gameSocket.emit('join game', gameId);
}

// 管理员功能
adminSocket.on('connect', () => {
  console.log('管理员连接成功');
  
  // 获取系统统计
  adminSocket.emit('get stats');
});

adminSocket.on('stats', (stats) => {
  updateAdminDashboard(stats);
});

// 广播系统消息
function broadcastSystemMessage(message) {
  adminSocket.emit('broadcast message', { message });
}
```

## 🔧 中间件和认证

### 1. 认证中间件

```javascript
const jwt = require('jsonwebtoken');

// JWT 认证中间件
function authMiddleware(socket, next) {
  const token = socket.handshake.auth.token || socket.handshake.headers.authorization;
  
  if (!token) {
    return next(new Error('Authentication error: No token provided'));
  }
  
  try {
    const decoded = jwt.verify(token.replace('Bearer ', ''), process.env.JWT_SECRET);
    socket.userId = decoded.userId;
    socket.username = decoded.username;
    socket.role = decoded.role;
    next();
  } catch (err) {
    next(new Error('Authentication error: Invalid token'));
  }
}

// 权限检查中间件
function roleMiddleware(requiredRole) {
  return (socket, next) => {
    if (socket.role && socket.role === requiredRole) {
      next();
    } else {
      next(new Error(`Access denied: ${requiredRole} role required`));
    }
  };
}

// 速率限制中间件
const rateLimiter = new Map();

function rateLimitMiddleware(maxRequests = 10, windowMs = 60000) {
  return (socket, next) => {
    const clientId = socket.id;
    const now = Date.now();
    
    if (!rateLimiter.has(clientId)) {
      rateLimiter.set(clientId, { count: 1, resetTime: now + windowMs });
      next();
    } else {
      const clientData = rateLimiter.get(clientId);
      
      if (now > clientData.resetTime) {
        // 重置计数器
        rateLimiter.set(clientId, { count: 1, resetTime: now + windowMs });
        next();
      } else if (clientData.count < maxRequests) {
        // 增加计数
        clientData.count++;
        next();
      } else {
        // 超过限制
        next(new Error('Rate limit exceeded'));
      }
    }
  };
}

// 日志中间件
function loggingMiddleware(socket, next) {
  const startTime = Date.now();
  
  socket.on('disconnect', () => {
    const duration = Date.now() - startTime;
    console.log(`Socket ${socket.id} 连接时长: ${duration}ms`);
  });
  
  console.log(`新连接: ${socket.id}, IP: ${socket.handshake.address}`);
  next();
}

// 应用中间件
io.use(loggingMiddleware);
io.use(rateLimitMiddleware(20, 60000)); // 每分钟最多20个请求
io.use(authMiddleware);

// 管理员命名空间使用特殊中间件
adminNamespace.use(authMiddleware);
adminNamespace.use(roleMiddleware('admin'));

// 事件级别中间件
function eventMiddleware(eventName, handler) {
  return (socket) => {
    socket.on(eventName, async (data, callback) => {
      try {
        // 验证数据
        if (!validateEventData(eventName, data)) {
          throw new Error('Invalid data format');
        }
        
        // 执行处理函数
        const result = await handler(socket, data);
        
        // 返回结果
        if (callback && typeof callback === 'function') {
          callback({ success: true, data: result });
        }
      } catch (error) {
        console.error(`事件 ${eventName} 处理错误:`, error);
        
        if (callback && typeof callback === 'function') {
          callback({ success: false, error: error.message });
        }
        
        socket.emit('error', { event: eventName, message: error.message });
      }
    });
  };
}

// 使用事件中间件
io.on('connection', (socket) => {
  // 聊天消息处理
  eventMiddleware('chat message', async (socket, data) => {
    const message = {
      id: generateMessageId(),
      from: socket.userId,
      username: socket.username,
      content: sanitizeContent(data.content),
      timestamp: new Date().toISOString()
    };
    
    // 保存消息
    await saveMessage(message);
    
    // 广播消息
    socket.broadcast.emit('chat message', message);
    
    return message;
  })(socket);
  
  // 加入房间处理
  eventMiddleware('join room', async (socket, data) => {
    await socket.join(data.roomId);
    
    socket.to(data.roomId).emit('user joined', {
      userId: socket.userId,
      username: socket.username
    });
    
    return { roomId: data.roomId, joined: true };
  })(socket);
});
```

### 2. 数据验证

```javascript
const Joi = require('joi');

// 事件数据验证schemas
const schemas = {
  'chat message': Joi.object({
    content: Joi.string().min(1).max(1000).required(),
    roomId: Joi.string().optional(),
    type: Joi.string().valid('text', 'image', 'file').default('text')
  }),
  
  'join room': Joi.object({
    roomId: Joi.string().min(1).max(50).required(),
    password: Joi.string().optional()
  }),
  
  'private message': Joi.object({
    to: Joi.string().required(),
    content: Joi.string().min(1).max(1000).required()
  }),
  
  'create room': Joi.object({
    roomId: Joi.string().min(1).max(50).required(),
    roomName: Joi.string().min(1).max(100).required(),
    isPrivate: Joi.boolean().default(false),
    password: Joi.string().when('isPrivate', {
      is: true,
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
    maxUsers: Joi.number().integer().min(1).max(1000).default(100)
  })
};

function validateEventData(eventName, data) {
  const schema = schemas[eventName];
  if (!schema) {
    return true; // 没有定义schema则跳过验证
  }
  
  const { error, value } = schema.validate(data);
  if (error) {
    throw new Error(`数据验证失败: ${error.details[0].message}`);
  }
  
  return value;
}

// 内容过滤
function sanitizeContent(content) {
  // 移除HTML标签
  const sanitized = content.replace(/<[^>]*>/g, '');
  
  // 过滤敏感词汇
  const bannedWords = ['spam', 'abuse', 'inappropriate'];
  let filtered = sanitized;
  
  bannedWords.forEach(word => {
    const regex = new RegExp(word, 'gi');
    filtered = filtered.replace(regex, '***');
  });
  
  return filtered.trim();
}
```

## 📊 集群和扩展

### 1. Redis Adapter

```javascript
const { createAdapter } = require('@socket.io/redis-adapter');
const { createClient } = require('redis');

// Redis 客户端配置
const pubClient = createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD
});

const subClient = pubClient.duplicate();

// 连接到 Redis
Promise.all([pubClient.connect(), subClient.connect()]).then(() => {
  // 设置 Redis adapter
  io.adapter(createAdapter(pubClient, subClient));
  console.log('Redis adapter 已配置');
});

// 错误处理
pubClient.on('error', (err) => console.error('Redis Pub Client Error:', err));
subClient.on('error', (err) => console.error('Redis Sub Client Error:', err));

// 集群间通信
class ClusterManager {
  constructor(io, redisClient) {
    this.io = io;
    this.redis = redisClient;
    this.serverId = process.env.SERVER_ID || require('os').hostname();
  }
  
  // 发送集群消息
  async sendClusterMessage(event, data) {
    const message = {
      serverId: this.serverId,
      event,
      data,
      timestamp: new Date().toISOString()
    };
    
    await this.redis.publish('cluster:message', JSON.stringify(message));
  }
  
  // 监听集群消息
  setupClusterListener() {
    const clusterSub = this.redis.duplicate();
    clusterSub.connect();
    
    clusterSub.subscribe('cluster:message');
    clusterSub.on('message', (channel, message) => {
      if (channel === 'cluster:message') {
        const data = JSON.parse(message);
        
        // 忽略自己发送的消息
        if (data.serverId === this.serverId) {
          return;
        }
        
        this.handleClusterMessage(data);
      }
    });
  }
  
  // 处理集群消息
  handleClusterMessage(message) {
    switch (message.event) {
      case 'user_banned':
        this.handleUserBanned(message.data);
        break;
      case 'system_announcement':
        this.handleSystemAnnouncement(message.data);
        break;
      case 'server_shutdown':
        this.handleServerShutdown(message.data);
        break;
    }
  }
  
  // 处理用户封禁
  handleUserBanned(data) {
    const socket = this.io.sockets.sockets.get(data.socketId);
    if (socket) {
      socket.emit('banned', { reason: data.reason });
      socket.disconnect(true);
    }
  }
  
  // 处理系统公告
  handleSystemAnnouncement(data) {
    this.io.emit('system_announcement', data);
  }
  
  // 处理服务器关闭
  handleServerShutdown(data) {
    if (data.serverId !== this.serverId) {
      console.log(`服务器 ${data.serverId} 即将关闭`);
      // 可以实现负载重新分配逻辑
    }
  }
  
  // 获取集群统计信息
  async getClusterStats() {
    const stats = {
      serverId: this.serverId,
      connections: this.io.sockets.sockets.size,
      rooms: this.io.sockets.adapter.rooms.size,
      timestamp: new Date().toISOString()
    };
    
    // 发布统计信息
    await this.redis.setex(`cluster:stats:${this.serverId}`, 60, JSON.stringify(stats));
    
    // 获取所有服务器统计
    const keys = await this.redis.keys('cluster:stats:*');
    const allStats = [];
    
    for (const key of keys) {
      const data = await this.redis.get(key);
      if (data) {
        allStats.push(JSON.parse(data));
      }
    }
    
    return allStats;
  }
}

const clusterManager = new ClusterManager(io, pubClient);
clusterManager.setupClusterListener();

// 定期发送统计信息
setInterval(async () => {
  await clusterManager.getClusterStats();
}, 30000);
```

### 2. 负载均衡配置

```javascript
// sticky-session.js - 粘性会话配置
const cluster = require('cluster');
const numCPUs = require('os').cpus().length;
const sticky = require('sticky-session');

if (cluster.isMaster) {
  console.log(`主进程 ${process.pid} 正在运行`);
  
  // 创建工作进程
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
  
  cluster.on('exit', (worker, code, signal) => {
    console.log(`工作进程 ${worker.process.pid} 已退出`);
    cluster.fork(); // 重启工作进程
  });
} else {
  // 工作进程运行Socket.IO服务器
  const express = require('express');
  const http = require('http');
  const socketIo = require('socket.io');
  
  const app = express();
  const server = http.createServer(app);
  const io = socketIo(server);
  
  // Socket.IO 配置
  setupSocketIO(io);
  
  const PORT = process.env.PORT || 3000;
  server.listen(PORT, () => {
    console.log(`工作进程 ${process.pid} 在端口 ${PORT} 启动`);
  });
}

// Nginx 配置示例
/*
upstream socketio_nodes {
    ip_hash; # 启用粘性会话
    server 127.0.0.1:3000;
    server 127.0.0.1:3001;
    server 127.0.0.1:3002;
    server 127.0.0.1:3003;
}

server {
    listen 80;
    server_name your-domain.com;
    
    location /socket.io/ {
        proxy_pass http://socketio_nodes;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket 特定配置
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }
}
*/
```

## 📊 性能监控

### 1. 性能指标收集

```javascript
// performance-monitor.js
class SocketIOMonitor {
  constructor(io) {
    this.io = io;
    this.metrics = {
      connections: {
        total: 0,
        active: 0,
        peak: 0
      },
      messages: {
        sent: 0,
        received: 0,
        rate: 0
      },
      rooms: {
        total: 0,
        active: 0
      },
      errors: {
        connection: 0,
        message: 0,
        auth: 0
      }
    };
    
    this.startTime = Date.now();
    this.lastMessageCount = 0;
    
    this.setupMonitoring();
    this.startMetricsCollection();
  }
  
  setupMonitoring() {
    // 监听连接事件
    this.io.on('connection', (socket) => {
      this.metrics.connections.total++;
      this.metrics.connections.active++;
      this.metrics.connections.peak = Math.max(
        this.metrics.connections.peak,
        this.metrics.connections.active
      );
      
      // 监听消息事件
      const originalEmit = socket.emit;
      socket.emit = (...args) => {
        this.metrics.messages.sent++;
        return originalEmit.apply(socket, args);
      };
      
      // 监听所有事件
      const originalOn = socket.on;
      socket.on = (event, handler) => {
        return originalOn.call(socket, event, (...args) => {
          if (event !== 'disconnect' && event !== 'error') {
            this.metrics.messages.received++;
          }
          
          try {
            return handler(...args);
          } catch (error) {
            this.metrics.errors.message++;
            console.error(`事件处理错误 [${event}]:`, error);
          }
        });
      };
      
      // 监听断开连接
      socket.on('disconnect', () => {
        this.metrics.connections.active--;
      });
      
      // 监听错误
      socket.on('error', (error) => {
        this.metrics.errors.connection++;
        console.error('Socket错误:', error);
      });
    });
    
    // 监听认证错误
    this.io.use((socket, next) => {
      const originalNext = next;
      next = (err) => {
        if (err) {
          this.metrics.errors.auth++;
        }
        return originalNext(err);
      };
      next();
    });
  }
  
  startMetricsCollection() {
    setInterval(() => {
      this.updateMetrics();
    }, 5000);
  }
  
  updateMetrics() {
    // 更新房间统计
    this.metrics.rooms.total = this.io.sockets.adapter.rooms.size;
    this.metrics.rooms.active = Array.from(this.io.sockets.adapter.rooms.values())
      .filter(room => room.size > 0).length;
    
    // 计算消息速率
    const currentMessageCount = this.metrics.messages.sent + this.metrics.messages.received;
    this.metrics.messages.rate = (currentMessageCount - this.lastMessageCount) / 5; // 每秒消息数
    this.lastMessageCount = currentMessageCount;
  }
  
  getMetrics() {
    return {
      ...this.metrics,
      uptime: Math.round((Date.now() - this.startTime) / 1000),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString()
    };
  }
  
  // Prometheus 格式输出
  getPrometheusMetrics() {
    const metrics = this.getMetrics();
    
    return `
# HELP socketio_connections_total Total number of Socket.IO connections
# TYPE socketio_connections_total counter
socketio_connections_total ${metrics.connections.total}

# HELP socketio_connections_active Active Socket.IO connections
# TYPE socketio_connections_active gauge
socketio_connections_active ${metrics.connections.active}

# HELP socketio_messages_total Total number of messages
# TYPE socketio_messages_total counter
socketio_messages_sent_total ${metrics.messages.sent}
socketio_messages_received_total ${metrics.messages.received}

# HELP socketio_message_rate Messages per second
# TYPE socketio_message_rate gauge
socketio_message_rate ${metrics.messages.rate}

# HELP socketio_rooms_total Total number of rooms
# TYPE socketio_rooms_total gauge
socketio_rooms_total ${metrics.rooms.total}

# HELP socketio_errors_total Total number of errors
# TYPE socketio_errors_total counter
socketio_connection_errors_total ${metrics.errors.connection}
socketio_message_errors_total ${metrics.errors.message}
socketio_auth_errors_total ${metrics.errors.auth}
    `.trim();
  }
  
  // 健康检查
  getHealthStatus() {
    const metrics = this.getMetrics();
    const memoryUsage = metrics.memory.heapUsed / metrics.memory.heapTotal;
    
    let status = 'healthy';
    const issues = [];
    
    if (memoryUsage > 0.9) {
      status = 'unhealthy';
      issues.push('高内存使用率');
    }
    
    if (metrics.connections.active > 10000) {
      status = 'warning';
      issues.push('连接数过多');
    }
    
    if (metrics.errors.connection > 100) {
      status = 'warning';
      issues.push('连接错误过多');
    }
    
    return {
      status,
      issues,
      metrics,
      timestamp: new Date().toISOString()
    };
  }
}

// 使用监控器
const monitor = new SocketIOMonitor(io);

// 监控端点
app.get('/health', (req, res) => {
  const health = monitor.getHealthStatus();
  const statusCode = health.status === 'healthy' ? 200 : 
                    health.status === 'warning' ? 200 : 503;
  
  res.status(statusCode).json(health);
});

app.get('/metrics', (req, res) => {
  res.set('Content-Type', 'text/plain');
  res.send(monitor.getPrometheusMetrics());
});

app.get('/stats', (req, res) => {
  res.json(monitor.getMetrics());
});
```

## 🚀 实际应用示例

### 完整的实时聊天应用

```javascript
// complete-chat-server.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

// 安全中间件
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
}));

// 速率限制
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100 // 限制每个IP 100个请求
});
app.use(limiter);

app.use(express.json());
app.use(express.static('public'));

// Socket.IO 配置
const io = socketIo(server, {
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    methods: ["GET", "POST"],
    credentials: true
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  maxHttpBufferSize: 1e6, // 1MB
  allowEIO3: true
});

// 初始化组件
const roomManager = new RoomManager(io);
const monitor = new SocketIOMonitor(io);

// 认证中间件
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  
  if (!token) {
    return next(new Error('认证令牌缺失'));
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.userId;
    socket.username = decoded.username;
    socket.role = decoded.role || 'user';
    next();
  } catch (err) {
    next(new Error('认证失败'));
  }
});

// 速率限制中间件
const socketRateLimiter = new Map();
io.use((socket, next) => {
  const clientId = socket.handshake.address;
  const now = Date.now();
  const windowMs = 60000; // 1分钟
  const maxRequests = 50;
  
  if (!socketRateLimiter.has(clientId)) {
    socketRateLimiter.set(clientId, { count: 1, resetTime: now + windowMs });
    next();
  } else {
    const clientData = socketRateLimiter.get(clientId);
    
    if (now > clientData.resetTime) {
      socketRateLimiter.set(clientId, { count: 1, resetTime: now + windowMs });
      next();
    } else if (clientData.count < maxRequests) {
      clientData.count++;
      next();
    } else {
      next(new Error('请求频率过高'));
    }
  }
});

// 连接处理
io.on('connection', (socket) => {
  console.log(`用户 ${socket.username} (${socket.userId}) 已连接`);
  
  // 发送欢迎消息
  socket.emit('welcome', {
    message: `欢迎 ${socket.username}！`,
    serverId: process.env.SERVER_ID || 'server-1',
    timestamp: new Date().toISOString()
  });
  
  // 用户上线通知
  socket.broadcast.emit('user online', {
    userId: socket.userId,
    username: socket.username
  });
  
  // 聊天消息处理
  socket.on('chat message', async (data, callback) => {
    try {
      const validatedData = validateEventData('chat message', data);
      
      const message = {
        id: generateMessageId(),
        from: socket.userId,
        username: socket.username,
        content: sanitizeContent(validatedData.content),
        type: validatedData.type,
        roomId: validatedData.roomId,
        timestamp: new Date().toISOString()
      };
      
      // 保存消息到数据库
      await saveMessage(message);
      
      // 发送消息
      if (message.roomId) {
        socket.to(message.roomId).emit('chat message', message);
      } else {
        socket.broadcast.emit('chat message', message);
      }
      
      // 确认发送成功
      if (callback) {
        callback({ success: true, messageId: message.id });
      }
    } catch (error) {
      console.error('聊天消息处理错误:', error);
      if (callback) {
        callback({ success: false, error: error.message });
      }
    }
  });
  
  // 私聊消息
  socket.on('private message', async (data, callback) => {
    try {
      const validatedData = validateEventData('private message', data);
      
      const message = {
        id: generateMessageId(),
        from: socket.userId,
        to: validatedData.to,
        content: sanitizeContent(validatedData.content),
        type: 'private',
        timestamp: new Date().toISOString()
      };
      
      // 保存私聊消息
      await savePrivateMessage(message);
      
      // 查找目标用户的socket
      const targetSocket = findUserSocket(validatedData.to);
      if (targetSocket) {
        targetSocket.emit('private message', message);
        
        if (callback) {
          callback({ success: true, messageId: message.id });
        }
      } else {
        if (callback) {
          callback({ success: false, error: '用户不在线' });
        }
      }
    } catch (error) {
      console.error('私聊消息处理错误:', error);
      if (callback) {
        callback({ success: false, error: error.message });
      }
    }
  });
  
  // 房间管理
  socket.on('create room', async (data, callback) => {
    try {
      const validatedData = validateEventData('create room', data);
      
      const created = roomManager.createRoom(validatedData.roomId, {
        name: validatedData.roomName,
        createdBy: socket.userId,
        isPrivate: validatedData.isPrivate,
        password: validatedData.password,
        maxUsers: validatedData.maxUsers
      });
      
      if (callback) {
        callback({ success: created, roomId: created ? validatedData.roomId : null });
      }
    } catch (error) {
      if (callback) {
        callback({ success: false, error: error.message });
      }
    }
  });
  
  socket.on('join room', async (data, callback) => {
    try {
      const validatedData = validateEventData('join room', data);
      const joined = await roomManager.joinRoom(socket, validatedData.roomId, validatedData.password);
      
      if (callback) {
        callback({ success: joined, roomId: validatedData.roomId });
      }
    } catch (error) {
      if (callback) {
        callback({ success: false, error: error.message });
      }
    }
  });
  
  socket.on('leave room', async (roomId, callback) => {
    try {
      const left = await roomManager.leaveRoom(socket, roomId);
      
      if (callback) {
        callback({ success: left, roomId });
      }
    } catch (error) {
      if (callback) {
        callback({ success: false, error: error.message });
      }
    }
  });
  
  // 获取房间列表
  socket.on('get rooms', (callback) => {
    const rooms = roomManager.getRoomList();
    if (callback) {
      callback({ success: true, rooms });
    }
  });
  
  // 用户列表
  socket.on('get online users', (callback) => {
    const users = getOnlineUsers();
    if (callback) {
      callback({ success: true, users });
    }
  });
  
  // 断开连接处理
  socket.on('disconnect', async (reason) => {
    console.log(`用户 ${socket.username} 断开连接: ${reason}`);
    
    // 离开所有房间
    await roomManager.leaveAllRooms(socket);
    
    // 通知其他用户
    socket.broadcast.emit('user offline', {
      userId: socket.userId,
      username: socket.username
    });
  });
  
  // 错误处理
  socket.on('error', (error) => {
    console.error(`Socket错误 [${socket.userId}]:`, error);
  });
});

// 工具函数
function findUserSocket(userId) {
  for (const [socketId, socket] of io.sockets.sockets) {
    if (socket.userId === userId) {
      return socket;
    }
  }
  return null;
}

function getOnlineUsers() {
  const users = [];
  for (const [socketId, socket] of io.sockets.sockets) {
    users.push({
      id: socket.userId,
      username: socket.username,
      socketId: socketId
    });
  }
  return users;
}

function generateMessageId() {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// 模拟数据库操作
async function saveMessage(message) {
  // 实际应用中应该保存到数据库
  console.log('保存消息:', message);
}

async function savePrivateMessage(message) {
  // 实际应用中应该保存到数据库
  console.log('保存私聊消息:', message);
}

// API 路由
app.get('/health', (req, res) => {
  const health = monitor.getHealthStatus();
  res.status(health.status === 'healthy' ? 200 : 503).json(health);
});

app.get('/metrics', (req, res) => {
  res.set('Content-Type', 'text/plain');
  res.send(monitor.getPrometheusMetrics());
});

app.get('/stats', (req, res) => {
  res.json(monitor.getMetrics());
});

// 启动服务器
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Socket.IO 聊天服务器运行在端口 ${PORT}`);
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('收到 SIGTERM，正在关闭服务器...');
  
  io.emit('server shutdown', { message: '服务器即将维护，请稍后重连' });
  
  setTimeout(() => {
    server.close(() => {
      console.log('服务器已关闭');
      process.exit(0);
    });
  }, 5000);
});
```

## 📚 最佳实践总结

1. **认证安全**：实现完整的JWT认证和权限控制
2. **速率限制**：防止消息洪水攻击和资源滥用
3. **数据验证**：验证和清理所有输入数据
4. **错误处理**：优雅处理连接和消息错误
5. **性能监控**：实时监控连接数、消息率等指标
6. **集群支持**：使用Redis适配器支持多实例部署
7. **房间管理**：合理组织用户和消息分发
8. **优雅关闭**：正确处理服务器关闭和用户通知

通过掌握这些Socket.IO技术，您将能够构建高性能、可扩展的实时通信应用程序。
