# API认证

## 1. API认证概述

API认证是确保API资源只被授权用户或系统访问的关键机制。与传统的用户界面认证不同，API认证通常需要处理多种场景，包括用户直接访问、服务间通信、第三方应用集成等。一个强大的API认证系统不仅要保证安全性，还需要提供良好的开发者体验和可扩展性。

## 2. API认证的主要挑战

- **多种客户端类型**：需要支持浏览器、移动应用、服务端应用等不同类型的客户端
- **安全性与可用性平衡**：在保证安全的同时，提供便捷的开发者体验
- **令牌管理**：处理令牌的生成、验证、刷新和撤销
- **授权范围控制**：精细控制API访问权限
- **跨平台兼容性**：确保认证机制在各种环境中都能正常工作
- **性能考量**：认证过程不应成为系统性能瓶颈
- **审计与监控**：记录和分析API访问模式，以便检测异常行为

## 3. 常见的API认证方法

### 3.1 基本认证（Basic Authentication）

基本认证是最基础的HTTP认证方法，通过在请求头中发送Base64编码的用户名和密码实现认证。

**特点**：

- 实现简单
- 安全性较低（凭证易于解码）
- 通常只应在HTTPS环境下使用

**实现示例**：

```javascript
const express = require('express');
const app = express();

// 基本认证中间件
function basicAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    res.setHeader('WWW-Authenticate', 'Basic realm="API Access"');
    return res.status(401).json({ error: '未提供认证信息' });
  }
  
  const base64Credentials = authHeader.split(' ')[1];
  const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
  const [username, password] = credentials.split(':');
  
  // 验证用户凭据（实际应用中应从数据库或其他安全存储中验证）
  if (username === 'admin' && password === 'password') {
    req.user = { username: 'admin', role: 'admin' };
    return next();
  }
  
  res.setHeader('WWW-Authenticate', 'Basic realm="API Access"');
  res.status(401).json({ error: '认证失败' });
}

// 受保护的API端点
app.get('/api/resource', basicAuth, (req, res) => {
  res.json({ data: '受保护的资源', user: req.user });
});

app.listen(3000, () => {
  console.log('服务器运行在端口3000');
});
```

### 3.2 API密钥认证

API密钥是分配给开发者或应用程序的唯一标识符，通常通过请求头或查询参数发送。

**特点**：

- 实现简单，易于集成
- 适用于服务间通信
- 缺乏细粒度的访问控制
- 密钥泄露风险高

**实现示例**：

```javascript
const express = require('express');
const app = express();

// 模拟存储的API密钥（实际应用中应存储在安全的数据库中）
const validApiKeys = {
  'user1': { key: 'api_key_123', role: 'user' },
  'admin1': { key: 'admin_key_456', role: 'admin' }
};

// API密钥认证中间件
function apiKeyAuth(req, res, next) {
  // 从请求头或查询参数中获取API密钥
  const apiKey = req.headers['x-api-key'] || req.query.api_key;
  
  if (!apiKey) {
    return res.status(401).json({ error: '未提供API密钥' });
  }
  
  // 验证API密钥
  const user = Object.values(validApiKeys).find(user => user.key === apiKey);
  
  if (!user) {
    return res.status(401).json({ error: '无效的API密钥' });
  }
  
  // 存储用户信息用于后续请求处理
  req.user = user;
  next();
}

// 受保护的API端点
app.get('/api/resource', apiKeyAuth, (req, res) => {
  res.json({ data: '受保护的资源', userRole: req.user.role });
});

app.listen(3000, () => {
  console.log('服务器运行在端口3000');
});
```

### 3.3 OAuth 2.0

OAuth 2.0是一种开放标准的授权协议，允许第三方应用在不获取用户凭证的情况下访问用户资源。

**主要角色**：

- 资源所有者（Resource Owner）：用户
- 客户端（Client）：请求访问资源的应用程序
- 授权服务器（Authorization Server）：负责认证用户并颁发令牌
- 资源服务器（Resource Server）：托管受保护资源的服务器

**授权流程**：

1. 授权码流程（Authorization Code Flow）
2. 隐式授权流程（Implicit Flow）
3. 资源所有者密码凭证流程（Resource Owner Password Credentials Flow）
4. 客户端凭证流程（Client Credentials Flow）

**实现示例（使用Passport.js和OAuth 2.0）**：

```javascript
const express = require('express');
const passport = require('passport');
const OAuth2Strategy = require('passport-oauth2').Strategy;
const session = require('express-session');
const app = express();

// 配置会话
app.use(session({
  secret: 'your-session-secret',
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

// 配置OAuth 2.0策略
passport.use(new OAuth2Strategy({
  authorizationURL: 'https://oauth-provider.com/oauth2/authorize',
  tokenURL: 'https://oauth-provider.com/oauth2/token',
  clientID: 'your-client-id',
  clientSecret: 'your-client-secret',
  callbackURL: 'http://localhost:3000/auth/oauth2/callback'
}, (accessToken, refreshToken, profile, done) => {
  // 在此处验证用户并获取用户信息
  // 实际应用中应查询或创建用户记录
  const user = {
    id: profile.id,
    name: profile.displayName,
    accessToken: accessToken,
    refreshToken: refreshToken
  };
  return done(null, user);
}));

// 序列化和反序列化用户
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  // 实际应用中应从数据库中获取用户信息
  const user = { id, name: 'User ' + id };
  done(null, user);
});

// 启动OAuth 2.0认证流程
app.get('/auth/oauth2', passport.authenticate('oauth2'));

// OAuth 2.0回调处理
app.get('/auth/oauth2/callback', 
  passport.authenticate('oauth2', { failureRedirect: '/login' }),
  (req, res) => {
    // 认证成功后的重定向
    res.redirect('/api/protected');
  }
);

// 受保护的API端点
app.get('/api/protected', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({ data: '受保护的资源', user: req.user });
  } else {
    res.status(401).json({ error: '未认证' });
  }
});

app.listen(3000, () => {
  console.log('服务器运行在端口3000');
});
```

### 3.4 OpenID Connect (OIDC)

OpenID Connect是建立在OAuth 2.0之上的身份认证层，提供了身份验证和用户信息交换功能。

**特点**：

- 基于OAuth 2.0协议
- 提供ID令牌（ID Token）用于身份验证
- 定义了标准化的用户信息端点
- 支持发现和动态客户端注册

**实现示例（使用Passport.js和OpenID Connect）**：

```javascript
const express = require('express');
const passport = require('passport');
const { Strategy: OpenIDConnectStrategy } = require('passport-openidconnect');
const session = require('express-session');
const app = express();

// 配置会话
app.use(session({
  secret: 'your-session-secret',
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

// 配置OpenID Connect策略
passport.use(new OpenIDConnectStrategy({
  issuer: 'https://oidc-provider.com',
  authorizationURL: 'https://oidc-provider.com/oauth2/authorize',
  tokenURL: 'https://oidc-provider.com/oauth2/token',
  userInfoURL: 'https://oidc-provider.com/userinfo',
  clientID: 'your-client-id',
  clientSecret: 'your-client-secret',
  callbackURL: 'http://localhost:3000/auth/oidc/callback',
  scope: ['openid', 'profile', 'email']
}, (issuer, profile, done) => {
  // 验证用户并返回用户信息
  return done(null, profile);
}));

// 序列化和反序列化用户
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  // 实际应用中应从数据库中获取用户信息
  done(null, { id });
});

// 启动OpenID Connect认证流程
app.get('/auth/oidc', passport.authenticate('openidconnect'));

// OpenID Connect回调处理
app.get('/auth/oidc/callback', 
  passport.authenticate('openidconnect', { failureRedirect: '/login' }),
  (req, res) => {
    res.redirect('/api/protected');
  }
);

// 受保护的API端点
app.get('/api/protected', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({ data: '受保护的资源', user: req.user });
  } else {
    res.status(401).json({ error: '未认证' });
  }
});

app.listen(3000, () => {
  console.log('服务器运行在端口3000');
});
```

### 3.5 JWT (JSON Web Token) 认证

JWT是一种紧凑的、URL安全的令牌格式，用于在各方之间安全地传输信息。JWT通常用于API认证和信息交换。

**特点**：

- 自包含：令牌包含所有必要的信息
- 无状态：服务器不需要在会话中存储令牌信息
- 可验证：使用签名确保令牌的完整性
- 可扩展：支持多种加密算法

**实现示例**：

```javascript
const express = require('express');
const jwt = require('jsonwebtoken');
const app = express();
app.use(express.json());

const SECRET_KEY = 'your-secret-key';

// 登录端点，用于生成JWT令牌
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  
  // 验证用户凭据（实际应用中应从数据库中验证）
  if (username === 'admin' && password === 'password') {
    // 创建payload
    const payload = {
      id: '123',
      username: 'admin',
      role: 'admin',
      exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1小时后过期
    };
    
    // 生成JWT令牌
    const token = jwt.sign(payload, SECRET_KEY, { algorithm: 'HS256' });
    
    res.json({ token });
  } else {
    res.status(401).json({ error: '认证失败' });
  }
});

// JWT认证中间件
function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ error: '未提供认证信息' });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    // 验证JWT令牌
    const user = jwt.verify(token, SECRET_KEY);
    req.user = user;
    next();
  } catch (error) {
    res.status(403).json({ error: '无效的令牌' });
  }
}

// 受保护的API端点
app.get('/api/protected', authenticateJWT, (req, res) => {
  res.json({ data: '受保护的资源', user: req.user });
});

app.listen(3000, () => {
  console.log('服务器运行在端口3000');
});
```

## 4. API认证的最佳实践

### 4.1 选择合适的认证方法

根据不同的应用场景选择合适的认证方法：

- 内部服务间通信：API密钥或客户端凭证流程
- 用户直接访问：OAuth 2.0授权码流程或OpenID Connect
- 简单应用或原型：基本认证（仅在开发环境）
- 无状态API：JWT认证

### 4.2 安全性最佳实践

- **始终使用HTTPS**：防止中间人攻击和凭证泄露
- **实施令牌过期机制**：设置合理的令牌过期时间
- **使用强加密算法**：如JWT使用HS256或更安全的算法
- **保护密钥安全**：避免在客户端存储密钥，使用环境变量管理密钥
- **实现速率限制**：防止暴力破解攻击
- **验证所有输入**：防止注入攻击

**实现示例（使用express-rate-limit进行速率限制）**：

```javascript
const express = require('express');
const rateLimit = require('express-rate-limit');
const app = express();

// 配置速率限制
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 5, // 每个IP最多尝试5次登录
  message: {
    error: '登录尝试过于频繁，请稍后再试',
    retryAfter: 900 // 秒
  },
  standardHeaders: true,
  legacyHeaders: false
});

// 应用速率限制到登录端点
app.post('/api/login', loginLimiter, (req, res) => {
  // 登录逻辑
});

app.listen(3000, () => {
  console.log('服务器运行在端口3000');
});
```

### 4.3 令牌管理最佳实践

- **使用短期访问令牌和长期刷新令牌**：平衡安全性和用户体验
- **实现令牌撤销机制**：允许用户撤销已颁发的令牌
- **安全存储令牌**：服务端使用安全的存储机制，客户端使用安全的存储（如HTTP Only Cookie）
- **加密敏感信息**：不要在令牌中存储敏感信息，必要时进行加密

**实现示例（令牌撤销）**：

```javascript
const express = require('express');
const jwt = require('jsonwebtoken');
const app = express();
app.use(express.json());

const SECRET_KEY = 'your-secret-key';
const revokedTokens = new Set(); // 实际应用中应使用持久化存储

// JWT认证中间件，增加令牌撤销检查
function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ error: '未提供认证信息' });
  }
  
  const token = authHeader.split(' ')[1];
  
  // 检查令牌是否已被撤销
  if (revokedTokens.has(token)) {
    return res.status(403).json({ error: '令牌已被撤销' });
  }
  
  try {
    const user = jwt.verify(token, SECRET_KEY);
    req.user = user;
    req.token = token; // 保存令牌用于后续操作
    next();
  } catch (error) {
    res.status(403).json({ error: '无效的令牌' });
  }
}

// 令牌撤销端点
app.post('/api/logout', authenticateJWT, (req, res) => {
  // 将令牌添加到撤销列表
  revokedTokens.add(req.token);
  
  // 可选：设置过期时间自动清理
  setTimeout(() => {
    revokedTokens.delete(req.token);
  }, 3600000); // 1小时后自动清理
  
  res.json({ message: '注销成功' });
});

app.listen(3000, () => {
  console.log('服务器运行在端口3000');
});
```

### 4.4 API设计最佳实践

- **提供清晰的API文档**：详细说明认证方法和使用示例
- **使用标准化的错误响应**：提供一致的错误代码和描述
- **实现版本控制**：允许API演进而不破坏现有客户端
- **支持跨域资源共享（CORS）**：便于Web应用集成
- **提供详细的API使用统计**：帮助开发者监控和优化API使用

**实现示例（CORS支持）**：

```javascript
const express = require('express');
const cors = require('cors');
const app = express();

// 配置CORS
const corsOptions = {
  origin: ['https://allowed-domain.com', 'http://localhost:3001'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
  credentials: true,
  maxAge: 86400 // 24小时
};

// 应用CORS配置
app.use(cors(corsOptions));

// 处理预检请求
app.options('*', cors(corsOptions));

app.listen(3000, () => {
  console.log('服务器运行在端口3000');
});
```

## 5. API认证性能优化

### 5.1 减少数据库查询

在认证过程中，减少不必要的数据库查询可以显著提高性能。可以使用缓存机制来存储频繁访问的用户数据和会话信息。

**实现示例（使用Redis缓存用户信息）**：

```javascript
const express = require('express');
const jwt = require('jsonwebtoken');
const redis = require('redis');
const app = express();
app.use(express.json());

const SECRET_KEY = 'your-secret-key';

// 创建Redis客户端
const redisClient = redis.createClient({
  host: 'localhost',
  port: 6379
});

redisClient.connect().catch(console.error);

// JWT认证中间件，使用Redis缓存用户信息
async function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ error: '未提供认证信息' });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    // 验证JWT令牌
    const decoded = jwt.verify(token, SECRET_KEY);
    const userId = decoded.id;
    
    // 尝试从Redis获取用户信息
    const cachedUser = await redisClient.get(`user:${userId}`);
    
    if (cachedUser) {
      req.user = JSON.parse(cachedUser);
      return next();
    }
    
    // Redis中没有缓存，从数据库获取用户信息
    // 这里模拟从数据库查询
    const dbUser = {
      id: userId,
      username: decoded.username,
      role: decoded.role,
      permissions: ['read', 'write']
    };
    
    // 将用户信息存入Redis缓存（设置过期时间）
    await redisClient.setEx(
      `user:${userId}`,
      3600, // 1小时过期
      JSON.stringify(dbUser)
    );
    
    req.user = dbUser;
    next();
  } catch (error) {
    res.status(403).json({ error: '无效的令牌' });
  }
}

// 受保护的API端点
app.get('/api/protected', authenticateJWT, (req, res) => {
  res.json({ data: '受保护的资源', user: req.user });
});

app.listen(3000, () => {
  console.log('服务器运行在端口3000');
});
```

### 5.2 批处理认证请求

对于批量操作，可以考虑实现批处理认证机制，减少每个请求单独认证的开销。

### 5.3 优化令牌验证

使用高效的令牌验证算法，避免在每个请求上执行复杂的验证逻辑。

**JWT验证优化示例**：

```javascript
const express = require('express');
const jwt = require('jsonwebtoken');
const app = express();

// 缓存公钥或密钥
const SECRET_KEY = 'your-secret-key';

// 配置JWT验证选项
const jwtOptions = {
  algorithms: ['HS256'],
  ignoreExpiration: false // 不忽略过期时间
};

// 优化的JWT认证中间件
function optimizedAuthenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ error: '未提供认证信息' });
  }
  
  // 快速检查令牌格式
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ error: '无效的认证格式' });
  }
  
  const token = parts[1];
  
  try {
    // 使用预配置的选项验证令牌
    const user = jwt.verify(token, SECRET_KEY, jwtOptions);
    req.user = user;
    next();
  } catch (error) {
    // 细化错误处理
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: '令牌已过期' });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({ error: '无效的令牌' });
    }
    res.status(403).json({ error: '认证失败' });
  }
}

// 应用中间件到所有API路由
app.use('/api', optimizedAuthenticateJWT);

// API端点
app.get('/api/resource', (req, res) => {
  res.json({ data: '受保护的资源', user: req.user });
});

app.listen(3000, () => {
  console.log('服务器运行在端口3000');
});
```

## 6. 实践项目：构建完整的API认证系统

### 6.1 项目概述

创建一个完整的API认证系统，支持多种认证方法，包括JWT、OAuth 2.0和API密钥认证，并实现细粒度的访问控制和安全机制。

### 6.2 技术栈

- Node.js + Express
- MongoDB（用户存储）
- Redis（缓存和会话存储）
- JWT（无状态认证）
- Passport.js（认证中间件）
- bcrypt（密码哈希）
- Helmet（安全头部设置）
- Express-rate-limit（速率限制）
- CORS（跨域支持）

### 6.3 项目结构

```
api-auth-system/
├── app.js
├── config/
│   ├── index.js
│   ├── database.js
│   ├── security.js
│   └── oauth.js
├── models/
│   ├── User.js
│   ├── ApiKey.js
│   └── TokenBlacklist.js
├── routes/
│   ├── authRoutes.js
│   ├── userRoutes.js
│   ├── apiRoutes.js
│   └── oauthRoutes.js
├── middlewares/
│   ├── auth.js
│   ├── rateLimit.js
│   ├── errorHandler.js
│   └── validation.js
├── utils/
│   ├── tokenUtils.js
│   ├── cryptoUtils.js
│   └── logger.js
└── docs/
    └── api-docs.yml
```

### 6.4 核心代码实现

**1. 安全配置 (config/security.js)**

```javascript
module.exports = {
  jwt: {
    secret: process.env.JWT_SECRET || 'your-jwt-secret-key',
    accessTokenExpiry: '1h',
    refreshTokenExpiry: '7d',
    algorithm: 'HS256'
  },
  bcrypt: {
    saltRounds: 12
  },
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15分钟
    maxRequests: 100,
    loginAttempts: 5
  },
  apiKey: {
    headerName: 'X-API-Key',
    queryParamName: 'api_key'
  }
};
```

**2. 加密工具 (utils/cryptoUtils.js)**

```javascript
const bcrypt = require('bcrypt');
const securityConfig = require('../config/security');
const crypto = require('crypto');

// 密码哈希
exports.hashPassword = async (password) => {
  return await bcrypt.hash(password, securityConfig.bcrypt.saltRounds);
};

// 密码验证
exports.verifyPassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

// 生成API密钥
exports.generateApiKey = () => {
  return crypto.randomBytes(32).toString('hex');
};

// 生成随机字符串
exports.generateRandomString = (length = 16) => {
  return crypto.randomBytes(length).toString('hex');
};
```

**3. 令牌工具 (utils/tokenUtils.js)**

```javascript
const jwt = require('jsonwebtoken');
const securityConfig = require('../config/security');
const TokenBlacklist = require('../models/TokenBlacklist');

// 生成访问令牌
exports.generateAccessToken = (user) => {
  const payload = {
    id: user._id,
    username: user.username,
    role: user.role,
    type: 'access'
  };
  
  return jwt.sign(payload, securityConfig.jwt.secret, {
    algorithm: securityConfig.jwt.algorithm,
    expiresIn: securityConfig.jwt.accessTokenExpiry
  });
};

// 生成刷新令牌
exports.generateRefreshToken = (user) => {
  const payload = {
    id: user._id,
    type: 'refresh'
  };
  
  return jwt.sign(payload, securityConfig.jwt.secret, {
    algorithm: securityConfig.jwt.algorithm,
    expiresIn: securityConfig.jwt.refreshTokenExpiry
  });
};

// 验证JWT令牌
exports.verifyToken = (token) => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, securityConfig.jwt.secret, {
      algorithms: [securityConfig.jwt.algorithm]
    }, (err, decoded) => {
      if (err) {
        reject(err);
      } else {
        resolve(decoded);
      }
    });
  });
};

// 检查令牌是否被撤销
exports.isTokenRevoked = async (token) => {
  const blacklistedToken = await TokenBlacklist.findOne({ token });
  return !!blacklistedToken;
};

// 撤销令牌
exports.revokeToken = async (token) => {
  const blacklistEntry = new TokenBlacklist({
    token,
    revokedAt: new Date()
  });
  
  await blacklistEntry.save();
};
```

**4. 认证中间件 (middlewares/auth.js)**

```javascript
const tokenUtils = require('../utils/tokenUtils');
const ApiKey = require('../models/ApiKey');
const securityConfig = require('../config/security');

// JWT认证中间件
exports.authenticateJWT = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: '未提供认证信息'
      });
    }
    
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({
        success: false,
        error: '无效的认证格式'
      });
    }
    
    const token = parts[1];
    
    // 检查令牌是否被撤销
    const isRevoked = await tokenUtils.isTokenRevoked(token);
    if (isRevoked) {
      return res.status(401).json({
        success: false,
        error: '令牌已被撤销'
      });
    }
    
    // 验证令牌
    const decoded = await tokenUtils.verifyToken(token);
    
    // 检查令牌类型
    if (decoded.type !== 'access') {
      return res.status(401).json({
        success: false,
        error: '无效的访问令牌'
      });
    }
    
    req.user = decoded;
    req.token = token;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: '令牌已过期',
        needsRefresh: true
      });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: '无效的令牌'
      });
    }
    
    next(error);
  }
};

// API密钥认证中间件
exports.authenticateApiKey = async (req, res, next) => {
  try {
    // 从请求头或查询参数中获取API密钥
    const apiKey = req.headers[securityConfig.apiKey.headerName.toLowerCase()] || 
                  req.query[securityConfig.apiKey.queryParamName];
    
    if (!apiKey) {
      return res.status(401).json({
        success: false,
        error: `未提供${securityConfig.apiKey.headerName}`
      });
    }
    
    // 查询有效的API密钥
    const keyRecord = await ApiKey.findOne({ key: apiKey, active: true });
    
    if (!keyRecord) {
      return res.status(401).json({
        success: false,
        error: '无效的API密钥'
      });
    }
    
    // 检查API密钥权限
    req.apiKey = keyRecord;
    req.user = {
      id: keyRecord.userId,
      role: keyRecord.role,
      isApiKey: true
    };
    
    next();
  } catch (error) {
    next(error);
  }
};

// 角色授权中间件
exports.authorizeRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: '权限不足'
      });
    }
    
    next();
  };
};

// 组合认证中间件 - 支持JWT或API密钥
exports.authenticate = async (req, res, next) => {
  // 尝试JWT认证
  try {
    await new Promise((resolve, reject) => {
      exports.authenticateJWT(req, res, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
    return next();
  } catch (jwtError) {
    // JWT认证失败，尝试API密钥认证
    try {
      await new Promise((resolve, reject) => {
        exports.authenticateApiKey(req, res, (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
      return next();
    } catch (apiKeyError) {
      // 两种认证都失败
      return res.status(401).json({
        success: false,
        error: '认证失败，请提供有效的JWT令牌或API密钥'
      });
    }
  }
};
```

**5. 认证路由 (routes/authRoutes.js)**

```javascript
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { hashPassword, verifyPassword } = require('../utils/cryptoUtils');
const { generateAccessToken, generateRefreshToken, verifyToken, revokeToken } = require('../utils/tokenUtils');
const { authenticateJWT } = require('../middlewares/auth');
const { loginLimiter } = require('../middlewares/rateLimit');

// 用户注册
router.post('/register', async (req, res, next) => {
  try {
    const { username, email, password, role = 'user' } = req.body;
    
    // 验证输入
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        error: '请提供用户名、邮箱和密码'
      });
    }
    
    // 检查用户是否已存在
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: '用户名或邮箱已被使用'
      });
    }
    
    // 密码哈希
    const passwordHash = await hashPassword(password);
    
    // 创建新用户
    const newUser = new User({
      username,
      email,
      passwordHash,
      role
    });
    
    await newUser.save();
    
    res.status(201).json({
      success: true,
      message: '用户注册成功'
    });
  } catch (error) {
    next(error);
  }
});

// 用户登录
router.post('/login', loginLimiter, async (req, res, next) => {
  try {
    const { username, password } = req.body;
    
    // 验证输入
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: '请提供用户名和密码'
      });
    }
    
    // 查找用户
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({
        success: false,
        error: '用户名或密码错误'
      });
    }
    
    // 验证密码
    const isPasswordValid = await verifyPassword(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: '用户名或密码错误'
      });
    }
    
    // 生成令牌
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    
    // 更新用户最后登录时间
    user.lastLogin = new Date();
    await user.save();
    
    res.json({
      success: true,
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: '3600', // 秒
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
});

// 刷新令牌
router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: '未提供刷新令牌'
      });
    }
    
    // 验证刷新令牌
    const decoded = await verifyToken(refreshToken);
    
    // 检查令牌类型
    if (decoded.type !== 'refresh') {
      return res.status(401).json({
        success: false,
        error: '无效的刷新令牌'
      });
    }
    
    // 查找用户
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: '用户不存在'
      });
    }
    
    // 生成新的访问令牌
    const newAccessToken = generateAccessToken(user);
    
    res.json({
      success: true,
      accessToken: newAccessToken,
      tokenType: 'Bearer',
      expiresIn: '3600'
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: '刷新令牌已过期，请重新登录'
      });
    }
    next(error);
  }
});

// 用户注销
router.post('/logout', authenticateJWT, async (req, res, next) => {
  try {
    // 撤销当前访问令牌
    await revokeToken(req.token);
    
    res.json({
      success: true,
      message: '注销成功'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
```

**6. API路由 (routes/apiRoutes.js)**

```javascript
const express = require('express');
const router = express.Router();
const { authenticate, authorizeRole } = require('../middlewares/auth');

// 公开API端点
router.get('/public', (req, res) => {
  res.json({
    success: true,
    message: '这是一个公开API端点'
  });
});

// 需要认证的API端点
router.get('/protected', authenticate, (req, res) => {
  res.json({
    success: true,
    message: '这是一个受保护的API端点',
    user: req.user
  });
});

// 需要特定角色的API端点
router.get('/admin', authenticate, authorizeRole('admin'), (req, res) => {
  res.json({
    success: true,
    message: '这是一个管理员API端点',
    user: req.user
  });
});

// 用户特定的API端点
router.get('/user/:id', authenticate, (req, res, next) => {
  try {
    // 检查是否有权限访问该用户数据
    if (req.user.role !== 'admin' && req.user.id !== req.params.id) {
      return res.status(403).json({
        success: false,
        error: '权限不足'
      });
    }
    
    // 模拟获取用户数据
    const userData = {
      id: req.params.id,
      name: '用户 ' + req.params.id,
      data: '用户特定数据'
    };
    
    res.json({
      success: true,
      data: userData
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
```

**7. 主应用文件 (app.js)**

```javascript
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const mongoose = require('mongoose');
const redis = require('redis');
const app = express();

// 加载环境变量
require('dotenv').config();

// 导入路由
const authRoutes = require('./routes/authRoutes');
const apiRoutes = require('./routes/apiRoutes');
const oauthRoutes = require('./routes/oauthRoutes');

// 导入中间件
const { errorHandler } = require('./middlewares/errorHandler');

// 配置数据库连接
const connectDB = require('./config/database');
connectDB();

// 创建Redis客户端
const redisClient = redis.createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379
});

redisClient.connect().catch((err) => {
  console.error('Redis连接失败:', err);
});

// 设置Redis为全局变量，供其他模块使用
app.set('redisClient', redisClient);

// 配置中间件
app.use(helmet()); // 设置安全头部
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'UP',
    timestamp: new Date().toISOString()
  });
});

// 路由
app.use('/api/auth', authRoutes);
app.use('/api/v1', apiRoutes);
app.use('/api/oauth', oauthRoutes);

// 错误处理中间件
app.use(errorHandler);

// 启动服务器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API服务器运行在端口 ${PORT}`);
  console.log(`环境: ${process.env.NODE_ENV || 'development'}`);
});

// 处理未捕获的异常
process.on('uncaughtException', (err) => {
  console.error('未捕获的异常:', err);
  process.exit(1);
});

// 处理未处理的Promise拒绝
process.on('unhandledRejection', (err) => {
  console.error('未处理的Promise拒绝:', err);
  process.exit(1);
});
```

### 6.5 项目测试与部署

1. **安装依赖**

   ```bash
   npm install express mongoose redis jsonwebtoken bcrypt helmet cors express-rate-limit dotenv
   ```

2. **创建.env文件**

   ```
   NODE_ENV=development
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/api-auth-system
   REDIS_HOST=localhost
   REDIS_PORT=6379
   JWT_SECRET=your-strong-jwt-secret
   CORS_ORIGIN=http://localhost:3001,https://your-frontend.com
   ```

3. **启动MongoDB和Redis服务器**

4. **运行应用**

   ```bash
   node app.js
   ```

5. **API测试**
   可以使用Postman或curl测试API端点：
   - 注册用户：POST /api/auth/register
   - 用户登录：POST /api/auth/login
   - 访问受保护资源：GET /api/v1/protected (使用登录返回的令牌)
   - 刷新令牌：POST /api/auth/refresh
   - 用户注销：POST /api/auth/logout

6. **部署建议**
   - 使用Docker容器化应用
   - 配置HTTPS证书
   - 实现自动扩展和负载均衡
   - 设置详细的日志和监控系统
   - 定期轮换密钥和密码

## 7. 总结

API认证是构建安全、可扩展API的基础。本章节详细介绍了多种API认证方法，包括基本认证、API密钥认证、OAuth 2.0、OpenID Connect和JWT认证，并提供了实现示例和最佳实践。

在选择API认证方法时，应根据应用场景、安全性要求和用户体验进行综合考虑。对于大多数现代Web应用，JWT和OAuth 2.0是较为推荐的选择。JWT提供了简单、无状态的认证机制，适用于单页应用和移动应用；而OAuth 2.0则提供了更复杂、更灵活的授权框架，适用于需要第三方应用集成的场景。

实施API认证时，应始终遵循安全性最佳实践，如使用HTTPS、实施令牌过期机制、保护密钥安全、实现速率限制等。同时，还应考虑性能优化，如减少数据库查询、优化令牌验证等，以确保API的高效运行。

通过本章节的学习和实践项目，您应该能够构建一个安全、可靠、高效的API认证系统，为您的应用程序提供坚实的安全基础。
