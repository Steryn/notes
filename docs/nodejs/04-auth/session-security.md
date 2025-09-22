# 会话安全

## 1. 会话安全概述

会话安全是Web应用程序安全的核心环节，涉及保护用户会话免受各种安全威胁，如会话劫持、会话固定和会话泄露等。在用户认证后，会话管理系统负责维护用户身份，因此确保会话安全对于防止未授权访问和保护用户数据至关重要。

## 2. 常见的会话安全威胁

### 2.1 会话劫持（Session Hijacking）

攻击者通过各种手段获取用户的会话ID，然后使用该ID冒充用户进行操作。常见的会话劫持方法包括：

- **网络嗅探**：在不安全的网络中捕获包含会话ID的数据包
- **跨站脚本攻击（XSS）**：通过注入恶意脚本获取用户会话ID
- **会话固定攻击**：强制用户使用攻击者已知的会话ID
- **中间人攻击（MITM）**：拦截和修改客户端与服务器之间的通信

### 2.2 会话固定（Session Fixation）

攻击者固定（设置）用户的会话ID，然后诱导用户登录，从而获得对用户账户的访问权限。

### 2.3 会话泄露（Session Leakage）

会话ID通过URL、日志文件或其他不安全的渠道泄露给未授权方。

### 2.4 会话重放（Session Replay）

攻击者记录有效的会话数据，然后在稍后重新发送这些数据以获得未授权访问。

## 3. 会话安全的核心防御措施

### 3.1 使用HTTPS保护会话传输

始终使用HTTPS加密客户端与服务器之间的通信，防止会话ID被网络嗅探。

**配置示例**：

```javascript
const express = require('express');
const https = require('https');
const fs = require('fs');
const session = require('express-session');
const app = express();

// 配置会话cookie为仅HTTPS
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true, // 仅通过HTTPS发送cookie
    httpOnly: true,
    sameSite: 'strict'
  }
}));

// 重定向HTTP请求到HTTPS
app.use((req, res, next) => {
  if (!req.secure && process.env.NODE_ENV === 'production') {
    return res.redirect(`https://${req.headers.host}${req.url}`);
  }
  next();
});

// 加载SSL证书
const options = {
  key: fs.readFileSync('path/to/private.key'),
  cert: fs.readFileSync('path/to/certificate.crt')
};

// 启动HTTPS服务器
https.createServer(options, app).listen(443);

// 启动HTTP服务器（仅用于重定向）
app.listen(80);
```

### 3.2 设置安全的Cookie属性

使用`httpOnly`、`secure`和`sameSite`等Cookie属性增强会话安全性。

**属性说明**：

- `httpOnly`：防止客户端JavaScript访问cookie，减轻XSS攻击风险
- `secure`：确保cookie仅通过HTTPS连接传输
- `sameSite`：控制跨站请求时cookie的发送方式，减少CSRF攻击风险
- `domain`和`path`：限制cookie的作用域
- `maxAge`：设置cookie的过期时间

**配置示例**：

```javascript
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,        // 防止XSS
    secure: true,          // 仅HTTPS
    sameSite: 'strict',    // 防止CSRF
    maxAge: 24 * 60 * 60 * 1000, // 24小时过期
    domain: '.example.com', // 设置域名（可选）
    path: '/',             // 设置路径（可选）
    signed: true           // 对cookie进行签名
  }
}));
```

### 3.3 使用长而随机的会话ID

确保会话ID具有足够的长度和随机性，使其难以被猜测或暴力破解。

**Express-Session配置**：

```javascript
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  genid: function(req) {
    // 使用crypto模块生成随机ID
    return require('crypto').randomBytes(32).toString('hex'); // 使用32字节随机数
  },
  cookie: {
    // 其他cookie配置...
  }
}));
```

### 3.4 防止会话固定攻击

在用户权限变更（如登录、权限升级）时，始终生成新的会话ID。

**实现示例**：

```javascript
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  // 验证用户凭据
  authenticateUser(username, password)
    .then(user => {
      // 生成新的会话ID（防止会话固定攻击）
      req.session.regenerate((err) => {
        if (err) {
          return res.status(500).send('服务器错误');
        }
        
        // 设置新的会话数据
        req.session.isAuthenticated = true;
        req.session.user = user;
        
        res.redirect('/dashboard');
      });
    })
    .catch(err => {
      res.status(401).send('认证失败');
    });
});
```

### 3.5 实现会话过期机制

设置合理的会话过期时间，并实现空闲超时功能。

**实现示例**：

```javascript
// 配置会话过期时间
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000 // 24小时后过期
  }
}));

// 实现空闲超时的中间件
app.use((req, res, next) => {
  if (req.session && req.session.isAuthenticated) {
    const now = Date.now();
    const lastActivity = req.session.lastActivity || now;
    const idleTime = now - lastActivity;
    const idleTimeout = 30 * 60 * 1000; // 30分钟空闲超时
    
    if (idleTime > idleTimeout) {
      // 空闲超时，销毁会话
      req.session.destroy((err) => {
        if (err) {
          console.error(err);
        }
        res.redirect('/login?timeout=true');
      });
      return;
    }
    
    // 更新最后活动时间
    req.session.lastActivity = now;
    // 触摸会话以更新过期时间
    req.session.touch();
  }
  next();
});
```

## 4. 高级会话安全技术

### 4.1 IP地址和用户代理绑定

将会话绑定到用户的IP地址和User-Agent，检测异常的会话使用模式。

**实现示例**：

```javascript
// 生成会话时存储客户端信息
app.post('/login', (req, res) => {
  // 验证用户凭据...
  
  req.session.regenerate((err) => {
    if (err) {
      return res.status(500).send('服务器错误');
    }
    
    // 存储客户端信息用于验证
    req.session.clientInfo = {
      ip: req.ip,
      userAgent: req.headers['user-agent']
    };
    
    req.session.isAuthenticated = true;
    req.session.user = user;
    res.redirect('/dashboard');
  });
});

// 中间件：验证客户端信息
app.use((req, res, next) => {
  if (req.session && req.session.isAuthenticated && req.session.clientInfo) {
    const currentClientInfo = {
      ip: req.ip,
      userAgent: req.headers['user-agent']
    };
    
    // 比较当前客户端信息与存储的信息
    if (currentClientInfo.ip !== req.session.clientInfo.ip ||
        !currentClientInfo.userAgent.includes(req.session.clientInfo.userAgent.substring(0, 100))) {
      // 检测到异常，记录日志并要求重新登录
      console.warn('会话异常：IP或User-Agent变更', {
        expected: req.session.clientInfo,
        actual: currentClientInfo,
        userId: req.session.user.id
      });
      
      // 可选：发送安全警报给用户
      sendSecurityAlert(req.session.user.id, '检测到会话从新设备登录');
      
      // 销毁会话并要求重新登录
      req.session.destroy((err) => {
        if (err) {
          console.error(err);
        }
        res.redirect('/login?security_alert=true');
      });
      return;
    }
  }
  next();
});
```

### 4.2 会话数据加密

对敏感的会话数据进行加密存储，即使会话数据被泄露，也能保护数据的机密性。

**实现示例**：

```javascript
const crypto = require('crypto');

// 加密配置
const algorithm = 'aes-256-cbc';
const key = crypto.scryptSync(process.env.ENCRYPTION_KEY || 'default-encryption-key', 'salt', 32);

// 加密函数
function encryptData(data) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(JSON.stringify(data));
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return {
    iv: iv.toString('hex'),
    encryptedData: encrypted.toString('hex')
  };
}

// 解密函数
function decryptData(encryptedData) {
  const iv = Buffer.from(encryptedData.iv, 'hex');
  const encryptedText = Buffer.from(encryptedData.encryptedData, 'hex');
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return JSON.parse(decrypted.toString());
}

// 存储加密会话数据
app.post('/sensitive-action', (req, res) => {
  if (req.session && req.session.isAuthenticated) {
    const sensitiveData = {
      action: req.body.action,
      timestamp: Date.now(),
      metadata: req.body.metadata
    };
    
    // 加密数据后存储在会话中
    req.session.encryptedData = encryptData(sensitiveData);
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false });
  }
});

// 读取并解密会话数据
app.get('/sensitive-data', (req, res) => {
  if (req.session && req.session.isAuthenticated && req.session.encryptedData) {
    try {
      const decryptedData = decryptData(req.session.encryptedData);
      res.json({ success: true, data: decryptedData });
    } catch (error) {
      console.error('解密失败:', error);
      res.status(500).json({ success: false, error: '数据解密失败' });
    }
  } else {
    res.status(401).json({ success: false });
  }
});
```

### 4.3 双重提交Cookie防护CSRF

实现双重提交Cookie技术，为每个请求添加CSRF令牌，防止跨站请求伪造攻击。

**实现示例**：

```javascript
const crypto = require('crypto');

// 生成CSRF令牌
function generateCsrfToken() {
  return crypto.randomBytes(32).toString('hex');
}

// 中间件：为每个会话生成CSRF令牌
app.use((req, res, next) => {
  if (req.session && !req.session.csrfToken) {
    req.session.csrfToken = generateCsrfToken();
  }
  
  // 将CSRF令牌添加到响应头或视图变量中
  res.locals.csrfToken = req.session.csrfToken;
  res.setHeader('X-CSRF-Token', req.session.csrfToken);
  next();
});

// 验证CSRF令牌的中间件
function validateCsrfToken(req, res, next) {
  const csrfToken = req.body.csrfToken || req.headers['x-csrf-token'];
  
  if (!csrfToken || csrfToken !== req.session.csrfToken) {
    return res.status(403).json({ message: 'CSRF验证失败' });
  }
  
  // 可选：为每个请求生成新的CSRF令牌
  req.session.csrfToken = generateCsrfToken();
  res.locals.csrfToken = req.session.csrfToken;
  next();
}

// 应用CSRF保护到敏感路由
app.post('/change-password', validateCsrfToken, (req, res) => {
  // 密码更改逻辑...
  res.json({ success: true });
});

// HTML表单中的CSRF令牌示例
// <form method="POST" action="/change-password">
//   <input type="hidden" name="csrfToken" value="<%= csrfToken %>">
//   <!-- 其他表单字段 -->
// </form>
```

### 4.4 会话审计与监控

实现会话活动审计和监控机制，及时发现异常会话活动。

**实现示例**：

```javascript
const sessionActivityLog = [];

// 会话活动日志中间件
app.use((req, res, next) => {
  if (req.session && req.session.isAuthenticated) {
    const activity = {
      sessionId: req.sessionID,
      userId: req.session.user.id,
      timestamp: new Date(),
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      path: req.path,
      method: req.method
    };
    
    // 记录会话活动
    sessionActivityLog.push(activity);
    
    // 保留最近1000条记录
    if (sessionActivityLog.length > 1000) {
      sessionActivityLog.shift();
    }
    
    // 简单异常检测示例：短时间内从多个IP登录
    const recentActivities = sessionActivityLog.filter(
      log => log.userId === req.session.user.id &&
             Date.now() - log.timestamp.getTime() < 5 * 60 * 1000 // 5分钟内
    );
    
    const uniqueIps = [...new Set(recentActivities.map(log => log.ip))];
    if (uniqueIps.length > 3) {
      console.warn('检测到异常会话活动：短时间内从多个IP登录', {
        userId: req.session.user.id,
        ips: uniqueIps
      });
      // 可选：触发安全警报
    }
  }
  next();
});

// 管理员API：获取会话活动日志
app.get('/admin/session-logs', (req, res) => {
  // 确保请求者是管理员
  if (req.session && req.session.isAuthenticated && req.session.user.role === 'admin') {
    res.json(sessionActivityLog);
  } else {
    res.status(403).json({ message: '无权限访问' });
  }
});
```

## 5. 会话安全最佳实践

### 5.1 安全配置与会话管理

- 避免将会话ID存储在URL中
- 不在客户端存储敏感的会话数据
- 实现安全的会话销毁机制
- 定期轮换会话密钥

**实现示例**：

```javascript
// 安全的会话销毁
app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('会话销毁错误:', err);
    }
    // 清除会话cookie
    res.clearCookie('connect.sid', { 
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production'
    });
    res.redirect('/login');
  });
});

// 定期轮换会话密钥（示例使用定时任务）
let currentSecret = process.env.SESSION_SECRET || 'initial-secret';

function rotateSessionSecret() {
  // 生成新的密钥
  const newSecret = crypto.randomBytes(64).toString('hex');
  
  // 更新当前密钥（实际应用中应考虑密钥轮换策略）
  console.log('轮换会话密钥');
  currentSecret = newSecret;
  
  // 重新配置会话中间件
  // 注意：在生产环境中，需要更复杂的密钥轮换机制以避免中断用户会话
}

// 每24小时轮换一次密钥（仅作示例，实际应根据安全需求调整频率）
setInterval(rotateSessionSecret, 24 * 60 * 60 * 1000);
```

### 5.2 防止常见攻击的实践

- 实施适当的内容安全策略（CSP）防止XSS攻击
- 使用CSRF令牌保护表单提交和AJAX请求
- 对所有用户输入进行验证和清理
- 限制会话ID的作用域（通过domain和path属性）

### 5.3 安全的开发与部署实践

- 在开发环境中也使用安全的会话配置
- 不在日志中记录会话ID或其他敏感信息
- 实施最小权限原则，会话数据只包含必要信息
- 定期进行安全审计和漏洞扫描

**日志保护示例**：

```javascript
// 安全日志记录中间件
app.use((req, res, next) => {
  // 创建请求日志，但排除敏感信息
  const safeLogData = {
    timestamp: new Date(),
    method: req.method,
    url: req.url,
    ip: req.ip,
    // 不记录会话ID
    // sessionId: req.sessionID,
    user: req.session && req.session.isAuthenticated ? 
      { id: req.session.user.id, username: req.session.user.username } : 'unauthenticated'
  };
  
  console.log('请求:', safeLogData);
  next();
});
```

## 6. 实践项目：构建安全的会话管理系统

### 6.1 项目概述

创建一个具有全面安全特性的会话管理系统，实现包括HTTPS传输、安全cookie设置、会话固定防护、CSRF保护、会话监控等功能。

### 6.2 技术栈

- Node.js + Express
- Redis（用于分布式会话存储）
- bcrypt（用于密码哈希）
- Express-Session（会话管理）
- Helmet（安全头部设置）
- dotenv（环境变量管理）

### 6.3 项目结构

```
session-security-system/
├── app.js
├── config/
│   ├── index.js
│   └── security.js
├── models/
│   └── User.js
├── routes/
│   ├── authRoutes.js
│   ├── userRoutes.js
│   └── adminRoutes.js
├── middlewares/
│   ├── authMiddleware.js
│   ├── sessionSecurityMiddleware.js
│   └── csrfMiddleware.js
└── utils/
    ├── cryptoUtils.js
    └── securityUtils.js
```

### 6.4 核心代码实现

**1. 安全配置 (config/security.js)**

```javascript
module.exports = {
  session: {
    secret: process.env.SESSION_SECRET || 'default-secret-key',
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: parseInt(process.env.SESSION_MAX_AGE || '86400000'), // 默认24小时
      domain: process.env.SESSION_DOMAIN || undefined
    },
    idleTimeout: parseInt(process.env.SESSION_IDLE_TIMEOUT || '1800000') // 默认30分钟
  },
  encryption: {
    algorithm: 'aes-256-cbc',
    key: process.env.ENCRYPTION_KEY || 'default-encryption-key'
  },
  rateLimiting: {
    windowMs: 15 * 60 * 1000, // 15分钟
    max: 100 // 每个IP的最大请求数
  }
};
```

**2. 加密工具 (utils/cryptoUtils.js)**

```javascript
const crypto = require('crypto');
const securityConfig = require('../config/security');

// 生成加密密钥
exports.getEncryptionKey = () => {
  return crypto.scryptSync(securityConfig.encryption.key, 'salt', 32);
};

// 加密数据
exports.encryptData = (data) => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(
    securityConfig.encryption.algorithm,
    exports.getEncryptionKey(),
    iv
  );
  let encrypted = cipher.update(JSON.stringify(data));
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return {
    iv: iv.toString('hex'),
    encryptedData: encrypted.toString('hex')
  };
};

// 解密数据
exports.decryptData = (encryptedData) => {
  const iv = Buffer.from(encryptedData.iv, 'hex');
  const encryptedText = Buffer.from(encryptedData.encryptedData, 'hex');
  const decipher = crypto.createDecipheriv(
    securityConfig.encryption.algorithm,
    exports.getEncryptionKey(),
    iv
  );
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return JSON.parse(decrypted.toString());
};

// 生成随机令牌
exports.generateToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};
```

**3. 安全工具 (utils/securityUtils.js)**

```javascript
const cryptoUtils = require('./cryptoUtils');

// 验证客户端信息（IP和User-Agent）
exports.verifyClientInfo = (sessionClientInfo, request) => {
  if (!sessionClientInfo) return false;
  
  const currentIp = request.ip;
  const currentUserAgent = request.headers['user-agent'] || '';
  
  // 严格比较IP，宽松比较User-Agent（因为User-Agent可能有小的变化）
  const ipMatch = currentIp === sessionClientInfo.ip;
  const userAgentMatch = currentUserAgent.includes(sessionClientInfo.userAgent.substring(0, 100));
  
  return ipMatch && userAgentMatch;
};

// 记录安全事件
exports.logSecurityEvent = (eventType, details) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${eventType}]`, details);
  
  // 实际应用中可能需要将安全事件存储到数据库
  // 例如，可以实现一个安全事件日志系统
};
```

**4. CSRF中间件 (middlewares/csrfMiddleware.js)**

```javascript
const cryptoUtils = require('../utils/cryptoUtils');

// 生成CSRF令牌的中间件
exports.generateCsrfToken = (req, res, next) => {
  if (req.session && !req.session.csrfToken) {
    req.session.csrfToken = cryptoUtils.generateToken();
  }
  
  // 将CSRF令牌添加到响应头和本地变量
  res.locals.csrfToken = req.session.csrfToken;
  res.setHeader('X-CSRF-Token', req.session.csrfToken);
  next();
};

// 验证CSRF令牌的中间件
exports.validateCsrfToken = (req, res, next) => {
  // 跳过GET、HEAD、OPTIONS请求的CSRF验证
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }
  
  const csrfToken = req.body.csrfToken || req.headers['x-csrf-token'] || req.query.csrfToken;
  
  if (!csrfToken || csrfToken !== req.session.csrfToken) {
    // CSRF验证失败，记录安全事件
    require('../utils/securityUtils').logSecurityEvent('CSRF_FAILURE', {
      sessionId: req.sessionID,
      userId: req.session?.user?.id,
      path: req.path,
      method: req.method,
      ip: req.ip
    });
    
    return res.status(403).json({ message: 'CSRF验证失败' });
  }
  
  // 验证成功，生成新的CSRF令牌（可选）
  req.session.csrfToken = cryptoUtils.generateToken();
  res.locals.csrfToken = req.session.csrfToken;
  next();
};
```

**5. 会话安全中间件 (middlewares/sessionSecurityMiddleware.js)**

```javascript
const securityConfig = require('../config/security');
const securityUtils = require('../utils/securityUtils');

// 会话安全中间件
exports.sessionSecurity = (req, res, next) => {
  // 检查会话是否存在且已认证
  if (req.session && req.session.isAuthenticated) {
    // 1. 验证客户端信息
    if (req.session.clientInfo && !securityUtils.verifyClientInfo(req.session.clientInfo, req)) {
      securityUtils.logSecurityEvent('CLIENT_MISMATCH', {
        sessionId: req.sessionID,
        userId: req.session.user.id,
        expectedIp: req.session.clientInfo.ip,
        actualIp: req.ip,
        expectedUserAgent: req.session.clientInfo.userAgent,
        actualUserAgent: req.headers['user-agent']
      });
      
      // 销毁会话并要求重新登录
      req.session.destroy((err) => {
        if (err) {
          console.error('会话销毁错误:', err);
        }
        res.redirect('/auth/login?security_alert=client_mismatch');
      });
      return;
    }
    
    // 2. 检查会话空闲超时
    const now = Date.now();
    const lastActivity = req.session.lastActivity || now;
    const idleTime = now - lastActivity;
    
    if (idleTime > securityConfig.session.idleTimeout) {
      securityUtils.logSecurityEvent('SESSION_TIMEOUT', {
        sessionId: req.sessionID,
        userId: req.session.user.id,
        idleTime: idleTime
      });
      
      req.session.destroy((err) => {
        if (err) {
          console.error('会话销毁错误:', err);
        }
        res.redirect('/auth/login?timeout=true');
      });
      return;
    }
    
    // 3. 更新最后活动时间
    req.session.lastActivity = now;
    // 触摸会话以更新过期时间
    req.session.touch();
    
    // 4. 记录会话活动
    securityUtils.logSecurityEvent('SESSION_ACTIVITY', {
      sessionId: req.sessionID,
      userId: req.session.user.id,
      path: req.path,
      method: req.method,
      ip: req.ip
    });
  }
  
  next();
};
```

**6. 认证中间件 (middlewares/authMiddleware.js)**

```javascript
// 检查用户是否已认证
exports.isAuthenticated = (req, res, next) => {
  if (req.session && req.session.isAuthenticated) {
    next();
  } else {
    res.redirect('/auth/login');
  }
};

// 检查用户是否为管理员
exports.isAdmin = (req, res, next) => {
  if (req.session && req.session.isAuthenticated && req.session.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: '无管理员权限' });
  }
};
```

**7. 认证路由 (routes/authRoutes.js)**

```javascript
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const User = require('../models/User');
const cryptoUtils = require('../utils/cryptoUtils');
const securityUtils = require('../utils/securityUtils');

// 注册路由
router.get('/register', (req, res) => {
  if (req.session && req.session.isAuthenticated) {
    return res.redirect('/');
  }
  res.render('register', { csrfToken: req.session.csrfToken });
});

router.post('/register', async (req, res) => {
  try {
    const { username, password, email } = req.body;
    
    // 检查用户是否已存在
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(400).render('register', { 
        error: '用户名或邮箱已被使用',
        csrfToken: req.session.csrfToken 
      });
    }
    
    // 哈希密码
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);
    
    // 创建新用户
    const newUser = new User({
      username,
      passwordHash,
      email
    });
    
    await newUser.save();
    
    securityUtils.logSecurityEvent('USER_REGISTER', {
      username: username,
      email: email
    });
    
    res.redirect('/auth/login?registered=true');
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).render('register', { 
      error: '注册失败，请稍后再试',
      csrfToken: req.session.csrfToken 
    });
  }
});

// 登录路由
router.get('/login', (req, res) => {
  if (req.session && req.session.isAuthenticated) {
    return res.redirect('/');
  }
  
  const timeout = req.query.timeout === 'true';
  const securityAlert = req.query.security_alert;
  const registered = req.query.registered === 'true';
  
  res.render('login', {
    csrfToken: req.session.csrfToken,
    timeout,
    securityAlert,
    registered
  });
});

router.post('/login', async (req, res) => {
  try {
    const { username, password, remember } = req.body;
    
    // 查找用户
    const user = await User.findOne({ username });
    if (!user) {
      securityUtils.logSecurityEvent('LOGIN_FAILED', {
        username: username,
        reason: '用户不存在',
        ip: req.ip
      });
      return res.status(401).render('login', { 
        error: '用户名或密码错误',
        csrfToken: req.session.csrfToken 
      });
    }
    
    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      securityUtils.logSecurityEvent('LOGIN_FAILED', {
        username: username,
        reason: '密码错误',
        ip: req.ip
      });
      return res.status(401).render('login', { 
        error: '用户名或密码错误',
        csrfToken: req.session.csrfToken 
      });
    }
    
    // 登录成功，生成新的会话ID
    req.session.regenerate((err) => {
      if (err) {
        console.error('会话再生错误:', err);
        return res.status(500).render('login', { 
          error: '登录失败，请稍后再试',
          csrfToken: req.session.csrfToken 
        });
      }
      
      // 存储客户端信息用于后续验证
      req.session.clientInfo = {
        ip: req.ip,
        userAgent: req.headers['user-agent']
      };
      
      // 设置会话数据
      req.session.isAuthenticated = true;
      req.session.user = {
        id: user._id,
        username: user.username,
        role: user.role || 'user',
        email: user.email
      };
      
      // 设置最后活动时间
      req.session.lastActivity = Date.now();
      
      // 如果选择记住我，延长会话有效期
      if (remember) {
        req.session.cookie.maxAge = 7 * 24 * 60 * 60 * 1000; // 7天
      }
      
      securityUtils.logSecurityEvent('LOGIN_SUCCESS', {
        username: user.username,
        userId: user._id,
        ip: req.ip,
        userAgent: req.headers['user-agent']
      });
      
      res.redirect('/');
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).render('login', { 
      error: '登录失败，请稍后再试',
      csrfToken: req.session.csrfToken 
    });
  }
});

// 登出路由
router.get('/logout', (req, res) => {
  const userId = req.session?.user?.id;
  const username = req.session?.user?.username;
  
  req.session.destroy((err) => {
    if (err) {
      console.error('会话销毁错误:', err);
    }
    
    // 清除会话cookie
    res.clearCookie('connect.sid', {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production'
    });
    
    if (userId) {
      securityUtils.logSecurityEvent('LOGOUT', {
        username: username,
        userId: userId,
        ip: req.ip
      });
    }
    
    res.redirect('/auth/login');
  });
});

module.exports = router;
```

**8. 主应用文件 (app.js)**

```javascript
const express = require('express');
const session = require('express-session');
const RedisStore = require('connect-redis');
const redis = require('redis');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const app = express();

// 加载环境变量
require('dotenv').config();

// 导入配置和中间件
const securityConfig = require('./config/security');
const { generateCsrfToken, validateCsrfToken } = require('./middlewares/csrfMiddleware');
const { sessionSecurity } = require('./middlewares/sessionSecurityMiddleware');
const { isAuthenticated } = require('./middlewares/authMiddleware');

// 导入路由
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');

// 创建Redis客户端
const redisClient = redis.createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD
});

redisClient.on('error', (err) => {
  console.error('Redis连接错误:', err);
});

redisClient.connect().catch((err) => {
  console.error('Redis连接失败:', err);
});

// 设置视图引擎
app.set('view engine', 'ejs');
app.set('views', './views');

// 中间件
app.use(helmet()); // 设置安全头部
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// 配置速率限制
const limiter = rateLimit({
  windowMs: securityConfig.rateLimiting.windowMs,
  max: securityConfig.rateLimiting.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: '请求过于频繁，请稍后再试'
});

app.use(limiter);

// 配置会话中间件
app.use(session({
  secret: securityConfig.session.secret,
  resave: false,
  saveUninitialized: false,
  store: new RedisStore({
    client: redisClient,
    ttl: securityConfig.session.cookie.maxAge / 1000
  }),
  cookie: securityConfig.session.cookie,
  genid: function(req) {
    // 使用crypto模块生成随机ID
    return require('./utils/cryptoUtils').generateToken();
  }
}));

// CSRF保护
app.use(generateCsrfToken);
app.use(validateCsrfToken);

// 会话安全中间件
app.use(sessionSecurity);

// 路由
app.use('/auth', authRoutes);
app.use('/user', isAuthenticated, userRoutes);
app.use('/admin', isAuthenticated, adminRoutes);

// 首页
app.get('/', (req, res) => {
  if (req.session && req.session.isAuthenticated) {
    res.render('dashboard', {
      user: req.session.user,
      csrfToken: req.session.csrfToken
    });
  } else {
    res.render('home', {
      csrfToken: req.session.csrfToken
    });
  }
});

// 启动服务器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
  console.log(`环境: ${process.env.NODE_ENV || 'development'}`);
});
```

### 6.5 项目测试与部署

1. **安装依赖**

   ```bash
   npm install express express-session connect-redis redis helmet express-rate-limit bcrypt ejs dotenv
   ```

2. **创建.env文件**

   ```
   NODE_ENV=development
   PORT=3000
   SESSION_SECRET=your-strong-secret-key
   ENCRYPTION_KEY=your-strong-encryption-key
   REDIS_HOST=localhost
   REDIS_PORT=6379
   # REDIS_PASSWORD=your-redis-password
   ```

3. **创建视图目录和文件**
   需要创建以下EJS模板文件：
   - views/home.ejs
   - views/login.ejs
   - views/register.ejs
   - views/dashboard.ejs

4. **启动Redis服务器**

5. **运行应用**

   ```bash
   node app.js
   ```

6. **安全测试建议**
   - 使用OWASP ZAP或Burp Suite等工具进行安全测试
   - 测试会话固定攻击防护
   - 测试CSRF保护
   - 测试XSS防护（通过设置适当的Content-Security-Policy）
   - 测试会话过期和空闲超时机制

### 6.6 拓展功能建议

1. 实现多因素认证（MFA）
2. 添加地理位置和异常登录检测
3. 实现会话撤销和终止功能
4. 集成安全审计日志系统
5. 实现安全事件通知机制（如邮件或短信提醒）

## 7. 总结

会话安全是Web应用程序安全的关键环节，需要采取多层次的防护措施来保护用户会话免受各种安全威胁。本章节详细介绍了会话安全的核心概念、常见威胁以及相应的防御措施，并提供了一个全面的会话安全管理系统实践项目。

通过实施HTTPS传输、设置安全的Cookie属性、使用长而随机的会话ID、防止会话固定攻击、实现会话过期机制等基本措施，可以显著提高应用程序的会话安全性。此外，采用IP地址和用户代理绑定、会话数据加密、双重提交Cookie防护CSRF、会话审计与监控等高级技术，可以进一步增强会话安全。

在实际开发中，还应遵循安全的开发和部署实践，定期进行安全审计和漏洞扫描，确保会话管理系统的安全性随着应用程序的发展而不断提升。
