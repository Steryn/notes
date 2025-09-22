# CORS配置

## 概述

CORS（Cross-Origin Resource Sharing，跨域资源共享）是一种Web安全机制，用于控制浏览器是否允许一个域名的Web应用访问另一个域名的资源。正确配置CORS对于现代Web应用的安全性和功能至关重要。

## CORS基础概念

### 1. 同源策略

```javascript
// 同源策略示例
const sameOriginExamples = {
  // ✅ 同源（协议、域名、端口都相同）
  'https://example.com/app.js': 'https://example.com/api/data',
  'http://localhost:3000/app.js': 'http://localhost:3000/api/data',
  
  // ❌ 不同源
  'https://example.com/app.js': 'https://api.example.com/data', // 子域名不同
  'http://example.com/app.js': 'https://example.com/api/data',  // 协议不同
  'http://example.com:3000/app.js': 'http://example.com:8080/api/data' // 端口不同
};
```

### 2. CORS预检请求

```javascript
// 预检请求示例
const preflightRequest = {
  method: 'OPTIONS',
  headers: {
    'Origin': 'https://myapp.com',
    'Access-Control-Request-Method': 'POST',
    'Access-Control-Request-Headers': 'Content-Type, Authorization'
  }
};

// 预检响应
const preflightResponse = {
  status: 200,
  headers: {
    'Access-Control-Allow-Origin': 'https://myapp.com',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400' // 24小时缓存
  }
};
```

## Express CORS配置

### 1. 基础CORS配置

```javascript
const express = require('express');
const cors = require('cors');
const app = express();

// 最简单的CORS配置（允许所有来源）
app.use(cors());

// 基础CORS配置
app.use(cors({
  origin: true, // 允许所有来源
  credentials: true, // 允许发送Cookie
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

### 2. 严格CORS配置

```javascript
// 严格的白名单CORS配置
const allowedOrigins = [
  'https://myapp.com',
  'https://www.myapp.com',
  'https://admin.myapp.com',
  'http://localhost:3000', // 开发环境
  'http://localhost:8080'  // 开发环境
];

const corsOptions = {
  origin: function (origin, callback) {
    // 允许无origin的请求（移动应用、Postman等）
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('CORS策略不允许此来源'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin'
  ],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
  maxAge: 86400, // 24小时预检缓存
  optionsSuccessStatus: 200 // 兼容旧版浏览器
};

app.use(cors(corsOptions));
```

### 3. 动态CORS配置

```javascript
// 基于环境的动态CORS配置
function getCorsConfig() {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (isDevelopment) {
    return {
      origin: true, // 开发环境允许所有来源
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
    };
  }
  
  if (isProduction) {
    return {
      origin: [
        'https://myapp.com',
        'https://www.myapp.com',
        'https://admin.myapp.com'
      ],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      maxAge: 86400
    };
  }
  
  // 测试环境
  return {
    origin: ['https://test.myapp.com'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
  };
}

app.use(cors(getCorsConfig()));
```

## 高级CORS配置

### 1. 基于路由的CORS配置

```javascript
// 不同路由使用不同的CORS策略
const publicCorsOptions = {
  origin: true,
  methods: ['GET'],
  allowedHeaders: ['Content-Type']
};

const privateCorsOptions = {
  origin: ['https://myapp.com', 'https://admin.myapp.com'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

const adminCorsOptions = {
  origin: ['https://admin.myapp.com'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Admin-Token']
};

// 应用不同的CORS配置
app.use('/api/public', cors(publicCorsOptions));
app.use('/api/private', cors(privateCorsOptions));
app.use('/api/admin', cors(adminCorsOptions));
```

### 2. 基于用户角色的CORS配置

```javascript
// 基于用户角色的动态CORS配置
function createRoleBasedCors() {
  return (req, res, next) => {
    const origin = req.get('Origin');
    const userRole = req.user?.role;
    
    let corsOptions = {
      origin: false,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization']
    };
    
    // 根据用户角色设置不同的允许来源
    if (userRole === 'admin') {
      corsOptions.origin = [
        'https://myapp.com',
        'https://admin.myapp.com',
        'https://dashboard.myapp.com'
      ];
    } else if (userRole === 'user') {
      corsOptions.origin = [
        'https://myapp.com',
        'https://app.myapp.com'
      ];
    } else {
      corsOptions.origin = ['https://myapp.com'];
    }
    
    // 应用CORS配置
    cors(corsOptions)(req, res, next);
  };
}

app.use('/api', createRoleBasedCors());
```

### 3. 自定义CORS中间件

```javascript
// 自定义CORS中间件
function customCors(options = {}) {
  return (req, res, next) => {
    const origin = req.get('Origin');
    const method = req.method;
    
    // 检查来源是否被允许
    if (options.origin) {
      let isAllowed = false;
      
      if (typeof options.origin === 'function') {
        isAllowed = options.origin(origin, (err, allowed) => {
          if (err) {
            res.status(403).json({ error: 'CORS策略不允许此来源' });
            return;
          }
          if (allowed) {
            setCorsHeaders(res, origin, options);
          }
          next();
        });
      } else if (Array.isArray(options.origin)) {
        isAllowed = options.origin.includes(origin);
      } else if (options.origin === true) {
        isAllowed = true;
      }
      
      if (!isAllowed) {
        res.status(403).json({ error: 'CORS策略不允许此来源' });
        return;
      }
    }
    
    // 处理预检请求
    if (method === 'OPTIONS') {
      setCorsHeaders(res, origin, options);
      res.status(200).end();
      return;
    }
    
    // 设置CORS响应头
    setCorsHeaders(res, origin, options);
    next();
  };
}

function setCorsHeaders(res, origin, options) {
  // 设置允许的来源
  if (options.origin === true) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  } else if (Array.isArray(options.origin) && options.origin.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  // 设置允许的方法
  if (options.methods) {
    res.setHeader('Access-Control-Allow-Methods', options.methods.join(', '));
  }
  
  // 设置允许的头部
  if (options.allowedHeaders) {
    res.setHeader('Access-Control-Allow-Headers', options.allowedHeaders.join(', '));
  }
  
  // 设置暴露的头部
  if (options.exposedHeaders) {
    res.setHeader('Access-Control-Expose-Headers', options.exposedHeaders.join(', '));
  }
  
  // 设置是否允许凭据
  if (options.credentials) {
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  
  // 设置预检缓存时间
  if (options.maxAge) {
    res.setHeader('Access-Control-Max-Age', options.maxAge);
  }
}

// 使用自定义CORS中间件
app.use(customCors({
  origin: ['https://myapp.com'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

## CORS安全最佳实践

### 1. 严格的白名单策略

```javascript
// 严格的白名单配置
const strictCorsConfig = {
  origin: function (origin, callback) {
    // 开发环境允许localhost
    if (process.env.NODE_ENV === 'development') {
      if (!origin || origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
        return callback(null, true);
      }
    }
    
    // 生产环境严格白名单
    const allowedOrigins = [
      'https://myapp.com',
      'https://www.myapp.com'
    ];
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('不允许的来源'), false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 3600 // 1小时缓存
};
```

### 2. 环境变量配置

```javascript
// 使用环境变量配置CORS
const corsConfig = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['https://myapp.com'],
  credentials: process.env.CORS_CREDENTIALS === 'true',
  methods: process.env.CORS_METHODS?.split(',') || ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: process.env.CORS_HEADERS?.split(',') || ['Content-Type', 'Authorization'],
  maxAge: parseInt(process.env.CORS_MAX_AGE) || 86400
};

app.use(cors(corsConfig));
```

### 3. CORS日志和监控

```javascript
// CORS请求日志
function corsLogger(req, res, next) {
  const origin = req.get('Origin');
  const method = req.method;
  const userAgent = req.get('User-Agent');
  
  // 记录CORS请求
  console.log('CORS请求:', {
    origin,
    method,
    userAgent,
    timestamp: new Date().toISOString(),
    ip: req.ip
  });
  
  // 检查可疑请求
  if (origin && !isAllowedOrigin(origin)) {
    console.warn('可疑CORS请求:', {
      origin,
      method,
      userAgent,
      ip: req.ip,
      timestamp: new Date().toISOString()
    });
  }
  
  next();
}

function isAllowedOrigin(origin) {
  const allowedOrigins = [
    'https://myapp.com',
    'https://www.myapp.com',
    'http://localhost:3000'
  ];
  
  return allowedOrigins.includes(origin);
}

app.use(corsLogger);
```

## 常见CORS问题解决

### 1. 预检请求失败

```javascript
// 处理预检请求失败
app.options('*', (req, res) => {
  const origin = req.get('Origin');
  
  if (isAllowedOrigin(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Max-Age', '86400');
    res.status(200).end();
  } else {
    res.status(403).json({ error: 'CORS策略不允许此来源' });
  }
});
```

### 2. Cookie跨域问题

```javascript
// 解决Cookie跨域问题
const cookieCorsConfig = {
  origin: function (origin, callback) {
    // 允许特定来源
    const allowedOrigins = ['https://myapp.com', 'https://www.myapp.com'];
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('不允许的来源'), false);
    }
  },
  credentials: true, // 关键：允许发送Cookie
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Set-Cookie']
};

app.use(cors(cookieCorsConfig));

// 设置Cookie时指定SameSite
app.use((req, res, next) => {
  res.cookie('sessionId', 'value', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'none' // 跨域Cookie需要设置为none
  });
  next();
});
```

### 3. 复杂请求处理

```javascript
// 处理复杂请求的CORS
app.use((req, res, next) => {
  const origin = req.get('Origin');
  const method = req.method;
  const contentType = req.get('Content-Type');
  
  // 检查是否为复杂请求
  const isComplexRequest = 
    method !== 'GET' && method !== 'HEAD' && method !== 'POST' ||
    contentType && !['application/x-www-form-urlencoded', 'multipart/form-data', 'text/plain'].includes(contentType) ||
    req.get('Authorization');
  
  if (isComplexRequest) {
    // 复杂请求需要预检
    if (method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Max-Age', '86400');
      res.status(200).end();
      return;
    }
  }
  
  // 设置CORS响应头
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  next();
});
```

## 测试CORS配置

### 1. CORS测试工具

```javascript
// CORS测试端点
app.get('/api/cors-test', (req, res) => {
  const origin = req.get('Origin');
  const method = req.method;
  
  res.json({
    message: 'CORS测试成功',
    origin,
    method,
    timestamp: new Date().toISOString(),
    headers: {
      'Access-Control-Allow-Origin': res.get('Access-Control-Allow-Origin'),
      'Access-Control-Allow-Credentials': res.get('Access-Control-Allow-Credentials')
    }
  });
});

// 预检请求测试
app.options('/api/cors-test', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', req.get('Origin'));
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400');
  res.status(200).end();
});
```

### 2. 自动化CORS测试

```javascript
// CORS配置测试
function testCorsConfig() {
  const testCases = [
    {
      origin: 'https://myapp.com',
      expected: true,
      description: '允许的来源'
    },
    {
      origin: 'https://malicious.com',
      expected: false,
      description: '不允许的来源'
    },
    {
      origin: undefined,
      expected: true,
      description: '无来源请求'
    }
  ];
  
  testCases.forEach(testCase => {
    const corsConfig = {
      origin: ['https://myapp.com'],
      credentials: true
    };
    
    const result = corsConfig.origin(testCase.origin, (err, allowed) => {
      console.log(`${testCase.description}: ${allowed === testCase.expected ? 'PASS' : 'FAIL'}`);
    });
  });
}

// 运行测试
testCorsConfig();
```

## 总结

CORS配置是Web应用安全的重要组成部分：

1. **严格的白名单策略**：只允许信任的来源访问API
2. **环境相关配置**：开发、测试、生产环境使用不同的CORS策略
3. **基于角色的配置**：不同用户角色使用不同的CORS策略
4. **安全最佳实践**：使用环境变量、日志监控、错误处理
5. **常见问题解决**：预检请求、Cookie跨域、复杂请求处理
6. **测试和验证**：确保CORS配置正确工作

通过正确配置CORS，可以在保证安全性的同时提供良好的跨域访问体验。
