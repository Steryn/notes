# 会话基础

## 概述

会话（Session）是Web应用中用于在服务器端存储用户状态信息的机制。与Cookie不同，会话数据存储在服务器端，客户端只保存一个会话ID，这提供了更好的安全性和数据管理能力。

## 会话工作原理

### 1. 会话生命周期

```javascript
// 会话创建流程
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  // 验证用户凭据
  if (validateUser(username, password)) {
    // 创建新会话
    req.session.userId = getUserId(username);
    req.session.username = username;
    req.session.loginTime = new Date();
    
    res.json({ message: '登录成功' });
  } else {
    res.status(401).json({ message: '登录失败' });
  }
});
```

### 2. 会话ID管理

```javascript
const crypto = require('crypto');

// 生成安全的会话ID
function generateSessionId() {
  return crypto.randomBytes(32).toString('hex');
}

// 会话ID验证
function validateSessionId(sessionId) {
  // 检查格式和长度
  return /^[a-f0-9]{64}$/.test(sessionId);
}
```

## Express会话配置

### 1. 基础配置

```javascript
const express = require('express');
const session = require('express-session');
const app = express();

// 基础会话配置
app.use(session({
  secret: 'your-secret-key', // 用于签名会话ID的密钥
  resave: false,             // 不强制保存会话
  saveUninitialized: false,  // 不保存未初始化的会话
  cookie: {
    secure: false,           // 开发环境设为false，生产环境设为true
    httpOnly: true,          // 防止XSS攻击
    maxAge: 24 * 60 * 60 * 1000 // 24小时过期
  }
}));
```

### 2. 高级配置

```javascript
const session = require('express-session');
const RedisStore = require('connect-redis')(session);

// 使用Redis存储会话
app.use(session({
  store: new RedisStore({
    host: 'localhost',
    port: 6379,
    db: 0,
    pass: 'redis-password'
  }),
  secret: process.env.SESSION_SECRET,
  name: 'sessionId', // 自定义Cookie名称
  resave: false,
  saveUninitialized: false,
  rolling: true, // 每次请求都重置过期时间
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 2 * 60 * 60 * 1000, // 2小时
    sameSite: 'strict' // CSRF保护
  }
}));
```

## 会话数据操作

### 1. 设置会话数据

```javascript
// 设置用户信息
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  if (authenticateUser(username, password)) {
    req.session.user = {
      id: getUserId(username),
      username: username,
      role: getUserRole(username),
      loginTime: new Date()
    };
    
    // 设置会话过期时间
    req.session.cookie.maxAge = 30 * 60 * 1000; // 30分钟
    
    res.json({ message: '登录成功' });
  } else {
    res.status(401).json({ message: '认证失败' });
  }
});
```

### 2. 读取会话数据

```javascript
// 获取用户信息
app.get('/profile', (req, res) => {
  if (req.session.user) {
    res.json({
      user: req.session.user,
      sessionId: req.sessionID,
      lastAccess: req.session.lastAccess
    });
  } else {
    res.status(401).json({ message: '未登录' });
  }
});

// 检查用户权限
app.get('/admin', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ message: '请先登录' });
  }
  
  if (req.session.user.role !== 'admin') {
    return res.status(403).json({ message: '权限不足' });
  }
  
  res.json({ message: '欢迎管理员' });
});
```

### 3. 更新会话数据

```javascript
// 更新用户信息
app.put('/profile', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ message: '未登录' });
  }
  
  const { email, phone } = req.body;
  
  // 更新会话中的用户信息
  req.session.user.email = email;
  req.session.user.phone = phone;
  req.session.user.lastUpdate = new Date();
  
  res.json({ message: '信息更新成功' });
});
```

### 4. 删除会话数据

```javascript
// 用户登出
app.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('会话销毁失败:', err);
      return res.status(500).json({ message: '登出失败' });
    }
    
    // 清除Cookie
    res.clearCookie('sessionId');
    res.json({ message: '登出成功' });
  });
});

// 清除特定会话数据
app.delete('/session/data', (req, res) => {
  delete req.session.tempData;
  delete req.session.cart;
  
  res.json({ message: '临时数据已清除' });
});
```

## 会话中间件

### 1. 认证中间件

```javascript
// 认证中间件
function requireAuth(req, res, next) {
  if (req.session.user) {
    // 更新最后访问时间
    req.session.lastAccess = new Date();
    next();
  } else {
    res.status(401).json({ message: '需要登录' });
  }
}

// 使用认证中间件
app.get('/protected', requireAuth, (req, res) => {
  res.json({ message: '这是受保护的内容' });
});
```

### 2. 权限检查中间件

```javascript
// 角色检查中间件
function requireRole(role) {
  return (req, res, next) => {
    if (!req.session.user) {
      return res.status(401).json({ message: '需要登录' });
    }
    
    if (req.session.user.role !== role) {
      return res.status(403).json({ message: '权限不足' });
    }
    
    next();
  };
}

// 使用权限中间件
app.get('/admin/users', requireRole('admin'), (req, res) => {
  res.json({ message: '管理员用户列表' });
});

app.get('/user/profile', requireRole('user'), (req, res) => {
  res.json({ message: '用户个人资料' });
});
```

### 3. 会话超时中间件

```javascript
// 会话超时检查
function checkSessionTimeout(req, res, next) {
  if (req.session.user) {
    const now = new Date();
    const lastAccess = req.session.lastAccess || req.session.user.loginTime;
    const timeout = 30 * 60 * 1000; // 30分钟
    
    if (now - lastAccess > timeout) {
      req.session.destroy(() => {
        res.status(401).json({ message: '会话已过期，请重新登录' });
      });
      return;
    }
    
    // 更新最后访问时间
    req.session.lastAccess = now;
  }
  
  next();
}

app.use(checkSessionTimeout);
```

## 会话存储选项

### 1. 内存存储（默认）

```javascript
// 默认内存存储
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: false
}));

// 注意：内存存储在服务器重启后会丢失所有会话
```

### 2. Redis存储

```javascript
const RedisStore = require('connect-redis')(session);
const redis = require('redis');

// 创建Redis客户端
const redisClient = redis.createClient({
  host: 'localhost',
  port: 6379,
  password: 'your-redis-password'
});

// 使用Redis存储会话
app.use(session({
  store: new RedisStore({ client: redisClient }),
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000
  }
}));
```

### 3. MongoDB存储

```javascript
const MongoStore = require('connect-mongo');
const mongoose = require('mongoose');

// 连接MongoDB
mongoose.connect('mongodb://localhost:27017/sessiondb');

// 使用MongoDB存储会话
app.use(session({
  store: MongoStore.create({
    mongoUrl: 'mongodb://localhost:27017/sessiondb',
    collectionName: 'sessions',
    ttl: 14 * 24 * 60 * 60 // 14天
  }),
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: false
}));
```

### 4. 文件存储

```javascript
const FileStore = require('session-file-store')(session);

// 使用文件存储会话
app.use(session({
  store: new FileStore({
    path: './sessions',
    ttl: 86400, // 24小时
    retries: 5,
    logFn: console.log
  }),
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: false
}));
```

## 会话安全

### 1. 会话固定攻击防护

```javascript
// 登录后重新生成会话ID
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  if (authenticateUser(username, password)) {
    // 重新生成会话ID防止会话固定攻击
    req.session.regenerate((err) => {
      if (err) {
        console.error('会话重新生成失败:', err);
        return res.status(500).json({ message: '登录失败' });
      }
      
      req.session.user = {
        id: getUserId(username),
        username: username
      };
      
      res.json({ message: '登录成功' });
    });
  } else {
    res.status(401).json({ message: '认证失败' });
  }
});
```

### 2. 会话劫持防护

```javascript
// 检查IP地址变化
function checkSessionSecurity(req, res, next) {
  if (req.session.user) {
    const currentIP = req.ip;
    const sessionIP = req.session.ip;
    
    if (sessionIP && sessionIP !== currentIP) {
      // IP地址变化，可能发生会话劫持
      req.session.destroy(() => {
        res.status(401).json({ message: '检测到异常访问，请重新登录' });
      });
      return;
    }
    
    // 记录当前IP
    req.session.ip = currentIP;
  }
  
  next();
}

app.use(checkSessionSecurity);
```

### 3. 会话配置安全

```javascript
// 安全的会话配置
app.use(session({
  secret: process.env.SESSION_SECRET, // 使用环境变量
  name: 'sessionId', // 自定义Cookie名称
  resave: false,
  saveUninitialized: false,
  rolling: true, // 每次请求重置过期时间
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS环境
    httpOnly: true, // 防止XSS
    maxAge: 30 * 60 * 1000, // 30分钟
    sameSite: 'strict' // CSRF保护
  },
  // 防止会话固定攻击
  genid: () => {
    return crypto.randomBytes(32).toString('hex');
  }
}));
```

## 会话管理最佳实践

### 1. 会话清理

```javascript
// 定期清理过期会话
function cleanupExpiredSessions() {
  setInterval(() => {
    // 这里需要根据使用的存储方式实现清理逻辑
    console.log('清理过期会话...');
  }, 60 * 60 * 1000); // 每小时清理一次
}

// 启动清理任务
cleanupExpiredSessions();
```

### 2. 会话监控

```javascript
// 会话使用统计
const sessionStats = {
  activeSessions: 0,
  totalLogins: 0,
  failedLogins: 0
};

// 监控中间件
function sessionMonitoring(req, res, next) {
  if (req.session.user) {
    sessionStats.activeSessions++;
  }
  
  if (req.path === '/login' && req.method === 'POST') {
    if (req.session.user) {
      sessionStats.totalLogins++;
    } else {
      sessionStats.failedLogins++;
    }
  }
  
  next();
}

app.use(sessionMonitoring);
```

### 3. 会话调试

```javascript
// 开发环境会话调试
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log('会话信息:', {
      sessionID: req.sessionID,
      user: req.session.user,
      lastAccess: req.session.lastAccess
    });
    next();
  });
}
```

## 总结

会话管理是Web应用安全的重要组成部分：

1. **选择合适的存储方式**：根据应用需求选择内存、Redis、MongoDB等
2. **配置安全参数**：设置合适的过期时间、安全标志等
3. **实现认证中间件**：保护需要登录的页面和API
4. **防护安全攻击**：防止会话固定、会话劫持等攻击
5. **监控会话状态**：跟踪活跃会话和异常行为
6. **定期清理**：清理过期会话，释放存储空间

通过正确实现会话管理，可以确保用户状态的安全存储和有效管理。
