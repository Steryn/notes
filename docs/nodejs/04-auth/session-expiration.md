# 会话过期

## 概述

会话过期是Web应用安全的重要机制，用于自动终止用户会话，防止长期未使用的会话被恶意利用。合理的会话过期策略可以平衡用户体验和安全性。

## 会话过期类型

### 1. 绝对过期时间

```javascript
const session = require('express-session');

// 设置绝对过期时间（从会话创建开始计算）
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000 // 24小时后绝对过期
  }
}));
```

### 2. 滑动过期时间

```javascript
// 设置滑动过期时间（每次请求都重置过期时间）
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  rolling: true, // 启用滑动过期
  cookie: {
    maxAge: 30 * 60 * 1000 // 30分钟无活动后过期
  }
}));
```

### 3. 混合过期策略

```javascript
// 结合绝对和滑动过期
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: {
    maxAge: 2 * 60 * 60 * 1000 // 最大2小时
  }
}));

// 自定义滑动过期逻辑
app.use((req, res, next) => {
  if (req.session.user) {
    const now = Date.now();
    const lastActivity = req.session.lastActivity || now;
    const sessionStart = req.session.sessionStart || now;
    const maxSessionTime = 2 * 60 * 60 * 1000; // 2小时最大会话时间
    const inactivityTime = 30 * 60 * 1000; // 30分钟无活动时间
    
    // 检查是否超过最大会话时间
    if (now - sessionStart > maxSessionTime) {
      req.session.destroy(() => {
        res.status(401).json({ message: '会话已过期，请重新登录' });
      });
      return;
    }
    
    // 检查是否超过无活动时间
    if (now - lastActivity > inactivityTime) {
      req.session.destroy(() => {
        res.status(401).json({ message: '会话因无活动而过期' });
      });
      return;
    }
    
    // 更新最后活动时间
    req.session.lastActivity = now;
  }
  
  next();
});
```

## 会话过期实现

### 1. 基础过期检查

```javascript
// 会话过期检查中间件
function checkSessionExpiration(req, res, next) {
  if (req.session.user) {
    const now = new Date();
    const lastAccess = req.session.lastAccess || req.session.user.loginTime;
    const sessionTimeout = 30 * 60 * 1000; // 30分钟
    
    if (now - lastAccess > sessionTimeout) {
      // 会话过期，销毁会话
      req.session.destroy((err) => {
        if (err) {
          console.error('会话销毁失败:', err);
        }
        res.status(401).json({ 
          message: '会话已过期，请重新登录',
          code: 'SESSION_EXPIRED'
        });
      });
      return;
    }
    
    // 更新最后访问时间
    req.session.lastAccess = now;
  }
  
  next();
}

// 应用中间件
app.use(checkSessionExpiration);
```

### 2. 多级过期策略

```javascript
// 多级会话过期策略
class SessionExpirationManager {
  constructor() {
    this.warningTime = 5 * 60 * 1000; // 5分钟警告
    this.expirationTime = 30 * 60 * 1000; // 30分钟过期
    this.maxSessionTime = 8 * 60 * 60 * 1000; // 8小时最大会话时间
  }
  
  checkExpiration(req, res, next) {
    if (!req.session.user) {
      return next();
    }
    
    const now = Date.now();
    const lastActivity = req.session.lastActivity || req.session.user.loginTime;
    const sessionStart = req.session.sessionStart || req.session.user.loginTime;
    const timeSinceActivity = now - lastActivity;
    const totalSessionTime = now - sessionStart;
    
    // 检查最大会话时间
    if (totalSessionTime > this.maxSessionTime) {
      this.expireSession(req, res, '会话时间过长，请重新登录');
      return;
    }
    
    // 检查过期时间
    if (timeSinceActivity > this.expirationTime) {
      this.expireSession(req, res, '会话因无活动而过期');
      return;
    }
    
    // 检查警告时间
    if (timeSinceActivity > this.warningTime) {
      req.session.warningShown = true;
      res.locals.sessionWarning = {
        remainingTime: this.expirationTime - timeSinceActivity,
        message: '会话即将过期，请保存工作'
      };
    }
    
    // 更新最后活动时间
    req.session.lastActivity = now;
    next();
  }
  
  expireSession(req, res, message) {
    req.session.destroy((err) => {
      if (err) {
        console.error('会话销毁失败:', err);
      }
      res.status(401).json({ 
        message,
        code: 'SESSION_EXPIRED'
      });
    });
  }
}

const sessionManager = new SessionExpirationManager();
app.use(sessionManager.checkExpiration.bind(sessionManager));
```

### 3. 基于角色的过期策略

```javascript
// 不同角色使用不同的过期时间
const roleExpirationTimes = {
  admin: 15 * 60 * 1000,    // 管理员15分钟
  user: 30 * 60 * 1000,     // 普通用户30分钟
  guest: 5 * 60 * 1000      // 访客5分钟
};

function checkRoleBasedExpiration(req, res, next) {
  if (!req.session.user) {
    return next();
  }
  
  const userRole = req.session.user.role || 'guest';
  const expirationTime = roleExpirationTimes[userRole];
  const now = Date.now();
  const lastActivity = req.session.lastActivity || req.session.user.loginTime;
  
  if (now - lastActivity > expirationTime) {
    req.session.destroy(() => {
      res.status(401).json({ 
        message: `${userRole}会话已过期，请重新登录`,
        code: 'SESSION_EXPIRED'
      });
    });
    return;
  }
  
  req.session.lastActivity = now;
  next();
}

app.use(checkRoleBasedExpiration);
```

## 会话续期机制

### 1. 自动续期

```javascript
// 自动续期中间件
function autoRenewSession(req, res, next) {
  if (req.session.user) {
    const now = Date.now();
    const lastActivity = req.session.lastActivity || req.session.user.loginTime;
    const renewalThreshold = 10 * 60 * 1000; // 10分钟
    
    // 如果距离上次活动超过10分钟，自动续期
    if (now - lastActivity > renewalThreshold) {
      req.session.lastActivity = now;
      req.session.renewedAt = now;
      console.log('会话已自动续期');
    }
  }
  
  next();
}

app.use(autoRenewSession);
```

### 2. 手动续期

```javascript
// 手动续期API
app.post('/api/session/renew', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ message: '未登录' });
  }
  
  const now = Date.now();
  const lastActivity = req.session.lastActivity || req.session.user.loginTime;
  const maxRenewalTime = 25 * 60 * 1000; // 25分钟
  
  // 只有在25分钟内才能续期
  if (now - lastActivity > maxRenewalTime) {
    return res.status(400).json({ 
      message: '会话已过期，无法续期',
      code: 'CANNOT_RENEW'
    });
  }
  
  // 续期会话
  req.session.lastActivity = now;
  req.session.renewedAt = now;
  req.session.renewalCount = (req.session.renewalCount || 0) + 1;
  
  res.json({ 
    message: '会话续期成功',
    expiresAt: new Date(now + 30 * 60 * 1000)
  });
});
```

### 3. 条件续期

```javascript
// 基于用户行为的条件续期
function conditionalSessionRenewal(req, res, next) {
  if (req.session.user) {
    const now = Date.now();
    const lastActivity = req.session.lastActivity || req.session.user.loginTime;
    const timeSinceActivity = now - lastActivity;
    
    // 检查用户活动类型
    const isImportantActivity = req.path.includes('/api/') || 
                               req.path.includes('/admin/') ||
                               req.method !== 'GET';
    
    if (isImportantActivity && timeSinceActivity < 20 * 60 * 1000) {
      // 重要活动且时间未超过20分钟，自动续期
      req.session.lastActivity = now;
      req.session.autoRenewed = true;
    }
  }
  
  next();
}

app.use(conditionalSessionRenewal);
```

## 过期通知机制

### 1. 客户端通知

```javascript
// 会话过期警告API
app.get('/api/session/status', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ 
      status: 'expired',
      message: '会话已过期'
    });
  }
  
  const now = Date.now();
  const lastActivity = req.session.lastActivity || req.session.user.loginTime;
  const timeSinceActivity = now - lastActivity;
  const warningTime = 5 * 60 * 1000; // 5分钟警告
  const expirationTime = 30 * 60 * 1000; // 30分钟过期
  
  const remainingTime = expirationTime - timeSinceActivity;
  
  if (remainingTime <= 0) {
    return res.status(401).json({ 
      status: 'expired',
      message: '会话已过期'
    });
  }
  
  if (remainingTime <= warningTime) {
    return res.json({ 
      status: 'warning',
      remainingTime,
      message: '会话即将过期'
    });
  }
  
  res.json({ 
    status: 'active',
    remainingTime,
    message: '会话正常'
  });
});
```

### 2. 前端集成

```javascript
// 前端会话监控
class SessionMonitor {
  constructor() {
    this.checkInterval = 60000; // 每分钟检查一次
    this.warningShown = false;
    this.startMonitoring();
  }
  
  startMonitoring() {
    setInterval(() => {
      this.checkSessionStatus();
    }, this.checkInterval);
  }
  
  async checkSessionStatus() {
    try {
      const response = await fetch('/api/session/status');
      const data = await response.json();
      
      if (data.status === 'expired') {
        this.handleSessionExpired();
      } else if (data.status === 'warning' && !this.warningShown) {
        this.showWarning(data.remainingTime);
      }
    } catch (error) {
      console.error('会话状态检查失败:', error);
    }
  }
  
  showWarning(remainingTime) {
    this.warningShown = true;
    const minutes = Math.ceil(remainingTime / 60000);
    
    if (confirm(`会话将在${minutes}分钟后过期，是否续期？`)) {
      this.renewSession();
    }
  }
  
  async renewSession() {
    try {
      const response = await fetch('/api/session/renew', {
        method: 'POST'
      });
      
      if (response.ok) {
        alert('会话已续期');
        this.warningShown = false;
      } else {
        this.handleSessionExpired();
      }
    } catch (error) {
      console.error('会话续期失败:', error);
      this.handleSessionExpired();
    }
  }
  
  handleSessionExpired() {
    alert('会话已过期，请重新登录');
    window.location.href = '/login';
  }
}

// 启动会话监控
new SessionMonitor();
```

## 会话清理

### 1. 定期清理过期会话

```javascript
// 定期清理过期会话
function cleanupExpiredSessions() {
  setInterval(async () => {
    try {
      const now = Date.now();
      const expiredSessions = [];
      
      // 这里需要根据使用的存储方式实现清理逻辑
      // 例如，如果使用Redis存储
      if (process.env.SESSION_STORE === 'redis') {
        // Redis清理逻辑
        console.log('清理Redis中的过期会话...');
      } else if (process.env.SESSION_STORE === 'mongodb') {
        // MongoDB清理逻辑
        console.log('清理MongoDB中的过期会话...');
      }
      
      console.log(`清理了${expiredSessions.length}个过期会话`);
    } catch (error) {
      console.error('会话清理失败:', error);
    }
  }, 60 * 60 * 1000); // 每小时清理一次
}

// 启动清理任务
cleanupExpiredSessions();
```

### 2. 手动清理会话

```javascript
// 手动清理特定用户的所有会话
app.delete('/api/admin/sessions/:userId', async (req, res) => {
  const { userId } = req.params;
  
  try {
    // 清理指定用户的所有会话
    await clearUserSessions(userId);
    
    res.json({ message: '用户会话已清理' });
  } catch (error) {
    console.error('清理用户会话失败:', error);
    res.status(500).json({ message: '清理失败' });
  }
});

// 清理所有过期会话
app.post('/api/admin/cleanup-sessions', async (req, res) => {
  try {
    const cleanedCount = await cleanupAllExpiredSessions();
    res.json({ 
      message: '会话清理完成',
      cleanedCount 
    });
  } catch (error) {
    console.error('批量清理会话失败:', error);
    res.status(500).json({ message: '清理失败' });
  }
});
```

## 最佳实践

### 1. 合理的过期时间设置

```javascript
// 根据应用类型设置过期时间
const expirationConfig = {
  // 银行应用：短过期时间
  banking: {
    admin: 5 * 60 * 1000,    // 5分钟
    user: 10 * 60 * 1000,    // 10分钟
    maxSession: 30 * 60 * 1000 // 最大30分钟
  },
  
  // 电商应用：中等过期时间
  ecommerce: {
    admin: 15 * 60 * 1000,   // 15分钟
    user: 30 * 60 * 1000,    // 30分钟
    maxSession: 2 * 60 * 60 * 1000 // 最大2小时
  },
  
  // 内容管理：长过期时间
  cms: {
    admin: 60 * 60 * 1000,   // 1小时
    user: 2 * 60 * 60 * 1000, // 2小时
    maxSession: 8 * 60 * 60 * 1000 // 最大8小时
  }
};
```

### 2. 安全考虑

```javascript
// 安全的会话过期配置
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  rolling: true, // 启用滑动过期
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 30 * 60 * 1000, // 30分钟
    sameSite: 'strict'
  },
  // 防止会话固定攻击
  genid: () => crypto.randomBytes(32).toString('hex')
}));
```

### 3. 监控和日志

```javascript
// 会话过期监控
const sessionMetrics = {
  totalSessions: 0,
  expiredSessions: 0,
  renewedSessions: 0,
  averageSessionTime: 0
};

function trackSessionMetrics(req, res, next) {
  if (req.session.user) {
    sessionMetrics.totalSessions++;
    
    if (req.session.renewedAt) {
      sessionMetrics.renewedSessions++;
    }
  }
  
  next();
}

// 定期输出会话统计
setInterval(() => {
  console.log('会话统计:', sessionMetrics);
}, 60 * 60 * 1000); // 每小时输出一次
```

## 总结

会话过期是Web应用安全的重要组成部分：

1. **选择合适的过期策略**：绝对过期、滑动过期或混合策略
2. **实现多级过期检查**：基于时间、角色、活动类型等
3. **提供续期机制**：自动续期、手动续期、条件续期
4. **用户友好的通知**：过期警告、状态检查、续期提示
5. **定期清理过期会话**：释放存储空间，提高性能
6. **监控和日志**：跟踪会话使用情况，优化策略

通过合理配置会话过期机制，可以在保证安全性的同时提供良好的用户体验。
