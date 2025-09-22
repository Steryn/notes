# 安全头设置

## 概述

HTTP安全头是Web应用安全的重要组成部分，用于指示浏览器如何安全地处理网页内容。正确设置安全头可以防止多种攻击，包括XSS、点击劫持、MIME类型嗅探等。

## 核心安全头

### 1. Content-Security-Policy (CSP)

```javascript
const helmet = require('helmet');

// 基础CSP配置
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", "data:", "https:"],
    connectSrc: ["'self'"],
    fontSrc: ["'self'"],
    objectSrc: ["'none'"],
    mediaSrc: ["'self'"],
    frameSrc: ["'none'"]
  }
}));

// 严格的CSP配置
const strictCSP = {
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "https://trusted-cdn.com"],
    styleSrc: ["'self'", "https://fonts.googleapis.com"],
    imgSrc: ["'self'", "data:", "https://images.example.com"],
    connectSrc: ["'self'", "https://api.example.com"],
    fontSrc: ["'self'", "https://fonts.gstatic.com"],
    objectSrc: ["'none'"],
    mediaSrc: ["'self'"],
    frameSrc: ["'none'"],
    baseUri: ["'self'"],
    formAction: ["'self'"],
    frameAncestors: ["'none'"],
    upgradeInsecureRequests: []
  }
};

app.use(helmet.contentSecurityPolicy(strictCSP));
```

### 2. X-Frame-Options

```javascript
// 防止点击劫持攻击
app.use(helmet.frameguard({ action: 'deny' }));

// 或者使用自定义中间件
app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'DENY');
  next();
});

// 允许特定域名嵌入
app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  next();
});

// 允许特定域名嵌入（不推荐）
app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'ALLOW-FROM https://trusted-site.com');
  next();
});
```

### 3. X-Content-Type-Options

```javascript
// 防止MIME类型嗅探攻击
app.use(helmet.noSniff());

// 或者使用自定义中间件
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  next();
});
```

### 4. X-XSS-Protection

```javascript
// 启用XSS过滤器
app.use(helmet.xssFilter());

// 或者使用自定义中间件
app.use((req, res, next) => {
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});
```

### 5. Strict-Transport-Security (HSTS)

```javascript
// HSTS配置
app.use(helmet.hsts({
  maxAge: 31536000, // 1年
  includeSubDomains: true,
  preload: true
}));

// 或者使用自定义中间件
app.use((req, res, next) => {
  if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  next();
});
```

## 完整安全头配置

### 1. 使用Helmet的完整配置

```javascript
const helmet = require('helmet');

// 完整的Helmet配置
app.use(helmet({
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://trusted-cdn.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.example.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
      upgradeInsecureRequests: []
    }
  },
  
  // HTTP Strict Transport Security
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  
  // X-Frame-Options
  frameguard: { action: 'deny' },
  
  // X-Content-Type-Options
  noSniff: true,
  
  // X-XSS-Protection
  xssFilter: true,
  
  // Referrer Policy
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  
  // Permissions Policy
  permissionsPolicy: {
    camera: [],
    microphone: [],
    geolocation: [],
    payment: [],
    usb: []
  }
}));
```

### 2. 自定义安全头中间件

```javascript
// 自定义安全头中间件
function securityHeaders(req, res, next) {
  // 基础安全头
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions Policy
  res.setHeader('Permissions-Policy', 
    'camera=(), microphone=(), geolocation=(), payment=(), usb=()'
  );
  
  // HSTS (仅HTTPS)
  if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
    res.setHeader('Strict-Transport-Security', 
      'max-age=31536000; includeSubDomains; preload'
    );
  }
  
  // 自定义安全头
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
  res.setHeader('X-Download-Options', 'noopen');
  res.setHeader('X-DNS-Prefetch-Control', 'off');
  
  next();
}

app.use(securityHeaders);
```

## 高级安全头配置

### 1. 动态CSP配置

```javascript
// 基于环境的动态CSP配置
function getCSPConfig() {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (isDevelopment) {
    return {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // 开发环境允许内联脚本
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "ws:", "wss:"], // 允许WebSocket连接
        fontSrc: ["'self'", "data:"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"]
      }
    };
  }
  
  if (isProduction) {
    return {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "https://trusted-cdn.com"],
        styleSrc: ["'self'", "https://fonts.googleapis.com"],
        imgSrc: ["'self'", "data:", "https://images.example.com"],
        connectSrc: ["'self'", "https://api.example.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],
        upgradeInsecureRequests: []
      }
    };
  }
  
  return {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  };
}

app.use(helmet.contentSecurityPolicy(getCSPConfig()));
```

### 2. 基于路由的安全头配置

```javascript
// 不同路由使用不同的安全头配置
const publicRoutes = ['/api/public', '/api/auth/login'];
const privateRoutes = ['/api/private', '/api/admin'];

// 公共路由的安全头配置
app.use('/api/public', helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  frameguard: { action: 'deny' },
  noSniff: true,
  xssFilter: true
}));

// 私有路由的安全头配置
app.use('/api/private', helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://trusted-cdn.com"],
      styleSrc: ["'self'", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "https://images.example.com"],
      connectSrc: ["'self'", "https://api.example.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
      upgradeInsecureRequests: []
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  frameguard: { action: 'deny' },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
}));
```

### 3. 自定义安全头中间件

```javascript
// 高级安全头中间件
class SecurityHeadersManager {
  constructor() {
    this.configs = new Map();
  }
  
  addConfig(route, config) {
    this.configs.set(route, config);
  }
  
  middleware() {
    return (req, res, next) => {
      const route = this.getRoute(req.path);
      const config = this.configs.get(route) || this.getDefaultConfig();
      
      this.applyHeaders(res, config);
      next();
    };
  }
  
  getRoute(path) {
    for (const [route] of this.configs) {
      if (path.startsWith(route)) {
        return route;
      }
    }
    return 'default';
  }
  
  getDefaultConfig() {
    return {
      csp: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'"],
        imgSrc: ["'self'", "data:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"]
      },
      hsts: false,
      frameguard: 'deny',
      noSniff: true,
      xssFilter: true,
      referrerPolicy: 'strict-origin-when-cross-origin'
    };
  }
  
  applyHeaders(res, config) {
    // 应用CSP
    if (config.csp) {
      const cspString = this.buildCSPString(config.csp);
      res.setHeader('Content-Security-Policy', cspString);
    }
    
    // 应用HSTS
    if (config.hsts) {
      res.setHeader('Strict-Transport-Security', 
        'max-age=31536000; includeSubDomains; preload'
      );
    }
    
    // 应用其他安全头
    res.setHeader('X-Frame-Options', config.frameguard.toUpperCase());
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', config.referrerPolicy);
  }
  
  buildCSPString(directives) {
    return Object.entries(directives)
      .map(([key, value]) => {
        if (Array.isArray(value)) {
          return `${key} ${value.join(' ')}`;
        }
        return `${key} ${value}`;
      })
      .join('; ');
  }
}

// 使用安全头管理器
const securityManager = new SecurityHeadersManager();

// 配置不同路由的安全头
securityManager.addConfig('/api/public', {
  csp: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'"],
    styleSrc: ["'self'"],
    imgSrc: ["'self'", "data:", "https:"],
    connectSrc: ["'self'"],
    fontSrc: ["'self'"],
    objectSrc: ["'none'"],
    mediaSrc: ["'self'"],
    frameSrc: ["'none'"]
  },
  hsts: false,
  frameguard: 'deny',
  noSniff: true,
  xssFilter: true,
  referrerPolicy: 'strict-origin-when-cross-origin'
});

securityManager.addConfig('/api/private', {
  csp: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "https://trusted-cdn.com"],
    styleSrc: ["'self'", "https://fonts.googleapis.com"],
    imgSrc: ["'self'", "data:", "https://images.example.com"],
    connectSrc: ["'self'", "https://api.example.com"],
    fontSrc: ["'self'", "https://fonts.gstatic.com"],
    objectSrc: ["'none'"],
    mediaSrc: ["'self'"],
    frameSrc: ["'none'"],
    baseUri: ["'self'"],
    formAction: ["'self'"],
    frameAncestors: ["'none'"],
    upgradeInsecureRequests: []
  },
  hsts: true,
  frameguard: 'deny',
  noSniff: true,
  xssFilter: true,
  referrerPolicy: 'strict-origin-when-cross-origin'
});

app.use(securityManager.middleware());
```

## 安全头测试和验证

### 1. 安全头测试工具

```javascript
// 安全头测试端点
app.get('/api/security-headers-test', (req, res) => {
  const headers = {
    'Content-Security-Policy': res.get('Content-Security-Policy'),
    'X-Frame-Options': res.get('X-Frame-Options'),
    'X-Content-Type-Options': res.get('X-Content-Type-Options'),
    'X-XSS-Protection': res.get('X-XSS-Protection'),
    'Strict-Transport-Security': res.get('Strict-Transport-Security'),
    'Referrer-Policy': res.get('Referrer-Policy'),
    'Permissions-Policy': res.get('Permissions-Policy')
  };
  
  res.json({
    message: '安全头测试',
    headers,
    timestamp: new Date().toISOString()
  });
});
```

### 2. 安全头验证中间件

```javascript
// 安全头验证中间件
function validateSecurityHeaders(req, res, next) {
  const requiredHeaders = [
    'X-Content-Type-Options',
    'X-Frame-Options',
    'X-XSS-Protection'
  ];
  
  const missingHeaders = requiredHeaders.filter(header => 
    !res.get(header)
  );
  
  if (missingHeaders.length > 0) {
    console.warn('缺少安全头:', missingHeaders);
  }
  
  next();
}

app.use(validateSecurityHeaders);
```

### 3. 安全头监控

```javascript
// 安全头监控
function securityHeadersMonitoring(req, res, next) {
  const originalSetHeader = res.setHeader;
  
  res.setHeader = function(name, value) {
    // 记录安全头设置
    if (name.startsWith('X-') || 
        name === 'Content-Security-Policy' || 
        name === 'Strict-Transport-Security' ||
        name === 'Referrer-Policy' ||
        name === 'Permissions-Policy') {
      console.log(`安全头设置: ${name} = ${value}`);
    }
    
    return originalSetHeader.call(this, name, value);
  };
  
  next();
}

app.use(securityHeadersMonitoring);
```

## 环境特定配置

### 1. 开发环境配置

```javascript
// 开发环境安全头配置
if (process.env.NODE_ENV === 'development') {
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // 允许内联脚本和eval
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "ws:", "wss:"], // 允许WebSocket
        fontSrc: ["'self'", "data:"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"]
      }
    },
    hsts: false, // 开发环境不启用HSTS
    frameguard: { action: 'deny' },
    noSniff: true,
    xssFilter: true
  }));
}
```

### 2. 生产环境配置

```javascript
// 生产环境安全头配置
if (process.env.NODE_ENV === 'production') {
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "https://trusted-cdn.com"],
        styleSrc: ["'self'", "https://fonts.googleapis.com"],
        imgSrc: ["'self'", "data:", "https://images.example.com"],
        connectSrc: ["'self'", "https://api.example.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],
        upgradeInsecureRequests: []
      }
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    },
    frameguard: { action: 'deny' },
    noSniff: true,
    xssFilter: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    permissionsPolicy: {
      camera: [],
      microphone: [],
      geolocation: [],
      payment: [],
      usb: []
    }
  }));
}
```

## 总结

安全头设置是Web应用安全的重要组成部分：

1. **核心安全头**：CSP、X-Frame-Options、X-Content-Type-Options、X-XSS-Protection、HSTS
2. **完整配置**：使用Helmet或自定义中间件设置所有必要的安全头
3. **动态配置**：基于环境、路由、用户角色等动态调整安全头
4. **测试验证**：确保安全头正确设置和生效
5. **监控日志**：跟踪安全头的设置和使用情况
6. **环境特定**：开发、测试、生产环境使用不同的安全头配置

通过正确设置安全头，可以大大提升Web应用的安全性，防止多种常见攻击。
