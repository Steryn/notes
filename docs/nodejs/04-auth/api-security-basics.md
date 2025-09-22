# API安全基础

## 概述

API安全是保护Web API免受各种攻击和威胁的关键措施。随着微服务架构和前后端分离的普及，API已成为应用的核心组件，其安全性直接影响整个系统的安全。

## API安全威胁

### 1. 常见攻击类型

```javascript
// API安全威胁分类
const apiThreats = {
  // 认证和授权攻击
  authentication: [
    '暴力破解攻击',
    '会话劫持',
    '令牌泄露',
    '重放攻击'
  ],
  
  // 输入验证攻击
  inputValidation: [
    'SQL注入',
    'NoSQL注入',
    'XSS攻击',
    '命令注入',
    'LDAP注入'
  ],
  
  // 业务逻辑攻击
  businessLogic: [
    '权限提升',
    '数据篡改',
    '业务规则绕过',
    '竞态条件'
  ],
  
  // 基础设施攻击
  infrastructure: [
    'DDoS攻击',
    '中间人攻击',
    'DNS劫持',
    'SSL/TLS攻击'
  ]
};
```

### 2. OWASP API安全风险

```javascript
// OWASP API Security Top 10
const owaspApiRisks = {
  'API1': '损坏的对象级授权',
  'API2': '损坏的用户认证',
  'API3': '过度的数据暴露',
  'API4': '缺乏资源和速率限制',
  'API5': '损坏的函数级授权',
  'API6': '批量分配',
  'API7': '安全配置错误',
  'API8': '注入',
  'API9': '资产管理不当',
  'API10': '日志记录和监控不足'
};
```

## API认证机制

### 1. API密钥认证

```javascript
// API密钥认证中间件
const apiKeys = new Map([
  ['ak_1234567890abcdef', { 
    userId: 'user123', 
    permissions: ['read', 'write'],
    rateLimit: 1000,
    expiresAt: new Date('2024-12-31')
  }],
  ['ak_fedcba0987654321', { 
    userId: 'user456', 
    permissions: ['read'],
    rateLimit: 100,
    expiresAt: new Date('2024-12-31')
  }]
]);

function apiKeyAuth(req, res, next) {
  const apiKey = req.headers['x-api-key'] || req.query.api_key;
  
  if (!apiKey) {
    return res.status(401).json({ 
      error: 'API密钥缺失',
      code: 'MISSING_API_KEY'
    });
  }
  
  const keyInfo = apiKeys.get(apiKey);
  
  if (!keyInfo) {
    return res.status(401).json({ 
      error: '无效的API密钥',
      code: 'INVALID_API_KEY'
    });
  }
  
  if (keyInfo.expiresAt < new Date()) {
    return res.status(401).json({ 
      error: 'API密钥已过期',
      code: 'EXPIRED_API_KEY'
    });
  }
  
  req.apiKey = apiKey;
  req.user = { id: keyInfo.userId };
  req.permissions = keyInfo.permissions;
  req.rateLimit = keyInfo.rateLimit;
  
  next();
}

// 使用API密钥认证
app.use('/api/v1', apiKeyAuth);
```

### 2. JWT令牌认证

```javascript
const jwt = require('jsonwebtoken');

// JWT认证中间件
function jwtAuth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ 
      error: '访问令牌缺失',
      code: 'MISSING_TOKEN'
    });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 检查令牌是否在黑名单中
    if (isTokenBlacklisted(token)) {
      return res.status(401).json({ 
        error: '令牌已失效',
        code: 'TOKEN_BLACKLISTED'
      });
    }
    
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: '令牌已过期',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    return res.status(401).json({ 
      error: '无效的令牌',
      code: 'INVALID_TOKEN'
    });
  }
}

// 令牌黑名单管理
const tokenBlacklist = new Set();

function isTokenBlacklisted(token) {
  return tokenBlacklist.has(token);
}

function blacklistToken(token) {
  tokenBlacklist.add(token);
}
```

### 3. OAuth 2.0认证

```javascript
const passport = require('passport');
const OAuth2Strategy = require('passport-oauth2');

// OAuth 2.0配置
passport.use('oauth2', new OAuth2Strategy({
  authorizationURL: 'https://oauth.provider.com/oauth/authorize',
  tokenURL: 'https://oauth.provider.com/oauth/token',
  clientID: process.env.OAUTH_CLIENT_ID,
  clientSecret: process.env.OAUTH_CLIENT_SECRET,
  callbackURL: '/auth/oauth2/callback'
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // 验证用户信息
    const user = await findOrCreateUser(profile);
    return done(null, user);
  } catch (error) {
    return done(error, null);
  }
}));

// OAuth 2.0路由
app.get('/auth/oauth2', passport.authenticate('oauth2'));
app.get('/auth/oauth2/callback', 
  passport.authenticate('oauth2', { failureRedirect: '/login' }),
  (req, res) => {
    // 生成JWT令牌
    const token = jwt.sign(
      { userId: req.user.id, email: req.user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    res.json({ token, user: req.user });
  }
);
```

## API授权机制

### 1. 基于角色的访问控制（RBAC）

```javascript
// 角色定义
const roles = {
  admin: ['read', 'write', 'delete', 'manage'],
  editor: ['read', 'write'],
  viewer: ['read']
};

// 权限检查中间件
function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: '未认证' });
    }
    
    const userRole = req.user.role;
    const userPermissions = roles[userRole] || [];
    
    if (!userPermissions.includes(permission)) {
      return res.status(403).json({ 
        error: '权限不足',
        required: permission,
        current: userPermissions
      });
    }
    
    next();
  };
}

// 使用权限控制
app.get('/api/users', requirePermission('read'), getUsers);
app.post('/api/users', requirePermission('write'), createUser);
app.delete('/api/users/:id', requirePermission('delete'), deleteUser);
```

### 2. 基于属性的访问控制（ABAC）

```javascript
// ABAC策略引擎
class ABACEngine {
  constructor() {
    this.policies = [];
  }
  
  addPolicy(policy) {
    this.policies.push(policy);
  }
  
  evaluate(user, resource, action, context) {
    for (const policy of this.policies) {
      if (this.matchesPolicy(user, resource, action, context, policy)) {
        return policy.effect === 'allow';
      }
    }
    return false; // 默认拒绝
  }
  
  matchesPolicy(user, resource, action, context, policy) {
    return this.matchesRule(user, policy.subject) &&
           this.matchesRule(resource, policy.resource) &&
           this.matchesRule(action, policy.action) &&
           this.matchesRule(context, policy.context);
  }
  
  matchesRule(attributes, rule) {
    for (const [key, value] of Object.entries(rule)) {
      if (attributes[key] !== value) {
        return false;
      }
    }
    return true;
  }
}

// 创建ABAC引擎
const abac = new ABACEngine();

// 添加策略
abac.addPolicy({
  subject: { role: 'admin' },
  resource: { type: 'user' },
  action: { name: 'delete' },
  context: { time: 'business_hours' },
  effect: 'allow'
});

// ABAC中间件
function abacAuth(resourceType, action) {
  return (req, res, next) => {
    const user = req.user;
    const resource = { type: resourceType, id: req.params.id };
    const context = { 
      time: new Date().getHours() >= 9 && new Date().getHours() <= 17 ? 'business_hours' : 'after_hours',
      ip: req.ip
    };
    
    if (abac.evaluate(user, resource, { name: action }, context)) {
      next();
    } else {
      res.status(403).json({ error: '访问被拒绝' });
    }
  };
}
```

### 3. 资源级授权

```javascript
// 资源所有权检查
async function checkResourceOwnership(req, res, next) {
  const resourceId = req.params.id;
  const userId = req.user.id;
  
  try {
    const resource = await Resource.findById(resourceId);
    
    if (!resource) {
      return res.status(404).json({ error: '资源不存在' });
    }
    
    // 检查资源所有权
    if (resource.ownerId !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: '无权访问此资源' });
    }
    
    req.resource = resource;
    next();
  } catch (error) {
    res.status(500).json({ error: '服务器错误' });
  }
}

// 使用资源级授权
app.get('/api/posts/:id', jwtAuth, checkResourceOwnership, getPost);
app.put('/api/posts/:id', jwtAuth, checkResourceOwnership, updatePost);
app.delete('/api/posts/:id', jwtAuth, checkResourceOwnership, deletePost);
```

## 输入验证和清理

### 1. 请求数据验证

```javascript
const Joi = require('joi');

// 用户注册验证
const userRegistrationSchema = Joi.object({
  username: Joi.string()
    .alphanum()
    .min(3)
    .max(30)
    .required(),
  email: Joi.string()
    .email()
    .required(),
  password: Joi.string()
    .min(8)
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])'))
    .required(),
  age: Joi.number()
    .integer()
    .min(13)
    .max(120)
    .optional()
});

// 验证中间件
function validateRequest(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        error: '请求数据验证失败',
        details: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }
    
    req.validatedData = value;
    next();
  };
}

// 使用验证
app.post('/api/users', validateRequest(userRegistrationSchema), createUser);
```

### 2. SQL注入防护

```javascript
// 使用参数化查询
const mysql = require('mysql2/promise');

async function getUserById(userId) {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'mydb'
  });
  
  // ✅ 使用参数化查询
  const [rows] = await connection.execute(
    'SELECT * FROM users WHERE id = ?',
    [userId]
  );
  
  await connection.end();
  return rows[0];
}

// ❌ 避免字符串拼接
async function getUserByIdUnsafe(userId) {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'mydb'
  });
  
  // ❌ 容易受到SQL注入攻击
  const query = `SELECT * FROM users WHERE id = ${userId}`;
  const [rows] = await connection.execute(query);
  
  await connection.end();
  return rows[0];
}
```

### 3. NoSQL注入防护

```javascript
const mongoose = require('mongoose');

// 安全的MongoDB查询
async function getUsers(filters) {
  // ✅ 使用Mongoose的查询构建器
  const query = User.find();
  
  if (filters.name) {
    query.where('name').equals(filters.name);
  }
  
  if (filters.age) {
    query.where('age').gte(filters.age);
  }
  
  return await query.exec();
}

// ❌ 避免直接使用用户输入构建查询
async function getUsersUnsafe(filters) {
  // ❌ 容易受到NoSQL注入攻击
  const query = {};
  
  if (filters.name) {
    query.name = filters.name;
  }
  
  // 危险：用户可能传入恶意查询对象
  if (filters.customQuery) {
    Object.assign(query, filters.customQuery);
  }
  
  return await User.find(query);
}
```

## 速率限制

### 1. 基础速率限制

```javascript
const rateLimit = require('express-rate-limit');

// 全局速率限制
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 每个IP最多100个请求
  message: {
    error: '请求过于频繁，请稍后再试',
    retryAfter: '15分钟'
  },
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api', globalLimiter);

// 登录接口特殊限制
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 5, // 每个IP最多5次登录尝试
  message: {
    error: '登录尝试过于频繁，请15分钟后再试',
    retryAfter: '15分钟'
  },
  skipSuccessfulRequests: true // 成功请求不计入限制
});

app.use('/api/auth/login', loginLimiter);
```

### 2. 基于用户的速率限制

```javascript
// 基于用户的速率限制
const userRateLimit = new Map();

function userRateLimiter(maxRequests, windowMs) {
  return (req, res, next) => {
    const userId = req.user?.id || req.ip;
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // 获取用户请求记录
    let userRequests = userRateLimit.get(userId) || [];
    
    // 清理过期请求
    userRequests = userRequests.filter(timestamp => timestamp > windowStart);
    
    // 检查是否超过限制
    if (userRequests.length >= maxRequests) {
      return res.status(429).json({
        error: '请求频率超限',
        retryAfter: Math.ceil((userRequests[0] + windowMs - now) / 1000)
      });
    }
    
    // 记录当前请求
    userRequests.push(now);
    userRateLimit.set(userId, userRequests);
    
    next();
  };
}

// 使用基于用户的速率限制
app.use('/api/premium', jwtAuth, userRateLimiter(1000, 60 * 60 * 1000)); // 每小时1000次
```

### 3. 动态速率限制

```javascript
// 动态速率限制
class DynamicRateLimiter {
  constructor() {
    this.requests = new Map();
    this.suspiciousIPs = new Set();
  }
  
  checkLimit(req, res, next) {
    const ip = req.ip;
    const now = Date.now();
    const windowMs = 60 * 1000; // 1分钟窗口
    
    // 获取IP请求记录
    let ipRequests = this.requests.get(ip) || [];
    
    // 清理过期请求
    ipRequests = ipRequests.filter(timestamp => timestamp > now - windowMs);
    
    // 动态调整限制
    let maxRequests = 100; // 默认限制
    
    if (this.suspiciousIPs.has(ip)) {
      maxRequests = 10; // 可疑IP降低限制
    }
    
    // 检查是否超过限制
    if (ipRequests.length >= maxRequests) {
      // 标记为可疑IP
      this.suspiciousIPs.add(ip);
      
      return res.status(429).json({
        error: '请求频率超限',
        retryAfter: 60
      });
    }
    
    // 记录请求
    ipRequests.push(now);
    this.requests.set(ip, ipRequests);
    
    next();
  }
  
  // 清理可疑IP标记
  clearSuspiciousIP(ip) {
    this.suspiciousIPs.delete(ip);
  }
}

const dynamicLimiter = new DynamicRateLimiter();
app.use('/api', dynamicLimiter.checkLimit.bind(dynamicLimiter));
```

## API安全最佳实践

### 1. 安全头设置

```javascript
const helmet = require('helmet');

// 使用Helmet设置安全头
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// 自定义安全头
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});
```

### 2. CORS配置

```javascript
const cors = require('cors');

// 严格的CORS配置
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'https://myapp.com',
      'https://admin.myapp.com'
    ];
    
    // 允许无origin的请求（移动应用等）
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('CORS策略不允许此来源'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
  maxAge: 86400 // 24小时预检缓存
};

app.use(cors(corsOptions));
```

### 3. 请求日志和监控

```javascript
// 安全事件日志
const winston = require('winston');

const securityLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'security.log' }),
    new winston.transports.Console()
  ]
});

// 安全监控中间件
function securityMonitoring(req, res, next) {
  const startTime = Date.now();
  
  // 记录请求
  const requestInfo = {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  };
  
  // 检查可疑请求
  if (isSuspiciousRequest(req)) {
    securityLogger.warn('可疑请求检测', requestInfo);
  }
  
  // 记录响应
  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    
    securityLogger.info('API请求', {
      ...requestInfo,
      statusCode: res.statusCode,
      responseTime
    });
  });
  
  next();
}

function isSuspiciousRequest(req) {
  // 检查SQL注入尝试
  const sqlInjectionPatterns = [
    /union\s+select/i,
    /drop\s+table/i,
    /insert\s+into/i,
    /delete\s+from/i
  ];
  
  const queryString = JSON.stringify(req.query) + JSON.stringify(req.body);
  
  return sqlInjectionPatterns.some(pattern => pattern.test(queryString));
}

app.use(securityMonitoring);
```

## 总结

API安全是Web应用安全的核心组成部分：

1. **实施多层认证**：API密钥、JWT、OAuth 2.0等
2. **严格的授权控制**：RBAC、ABAC、资源级授权
3. **输入验证和清理**：防止注入攻击
4. **速率限制**：防止滥用和DDoS攻击
5. **安全配置**：CORS、安全头、HTTPS
6. **监控和日志**：检测和响应安全事件
7. **定期安全审计**：发现和修复安全漏洞

通过实施这些安全措施，可以大大提升API的安全性和可靠性。
