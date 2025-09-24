# HTTP模块和网络编程

## 🎯 学习目标

- 掌握Node.js HTTP模块的基本使用
- 学会创建HTTP服务器和客户端
- 理解HTTP请求和响应的处理
- 掌握URL解析和查询参数处理
- 学会处理不同的HTTP方法
- 了解WebSocket基础概念

## 📚 HTTP模块基础

### 创建HTTP服务器

```javascript
const http = require('http');

// 创建HTTP服务器
const server = http.createServer((req, res) => {
  // 设置响应头
  res.writeHead(200, {
    'Content-Type': 'text/html; charset=utf-8'
  });
  
  // 发送响应
  res.end('<h1>Hello, Node.js HTTP Server!</h1>');
});

// 监听端口
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});

// 处理服务器错误
server.on('error', (err) => {
  console.error('服务器错误:', err);
});
```

### 处理不同的HTTP方法

```javascript
const http = require('http');

const server = http.createServer((req, res) => {
  const { method, url } = req;
  
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // 处理预检请求
  if (method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  switch (method) {
    case 'GET':
      handleGet(req, res);
      break;
    case 'POST':
      handlePost(req, res);
      break;
    case 'PUT':
      handlePut(req, res);
      break;
    case 'DELETE':
      handleDelete(req, res);
      break;
    default:
      res.writeHead(405, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: '方法不允许' }));
  }
});

function handleGet(req, res) {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ 
    message: 'GET请求成功',
    method: 'GET',
    url: req.url,
    timestamp: new Date().toISOString()
  }));
}

function handlePost(req, res) {
  let body = '';
  
  req.on('data', chunk => {
    body += chunk.toString();
  });
  
  req.on('end', () => {
    try {
      const data = JSON.parse(body);
      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        message: 'POST请求成功',
        receivedData: data,
        timestamp: new Date().toISOString()
      }));
    } catch (error) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: '无效的JSON数据' }));
    }
  });
}

function handlePut(req, res) {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ 
    message: 'PUT请求成功',
    method: 'PUT',
    url: req.url
  }));
}

function handleDelete(req, res) {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ 
    message: 'DELETE请求成功',
    method: 'DELETE',
    url: req.url
  }));
}

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`HTTP服务器运行在 http://localhost:${PORT}`);
});
```

## 🔗 URL解析和查询参数

### 解析URL

```javascript
const http = require('http');
const url = require('url');

const server = http.createServer((req, res) => {
  // 解析URL
  const parsedUrl = url.parse(req.url, true);
  const { pathname, query } = parsedUrl;
  
  res.writeHead(200, { 'Content-Type': 'application/json' });
  
  const response = {
    pathname,
    query,
    method: req.method,
    headers: req.headers
  };
  
  res.end(JSON.stringify(response, null, 2));
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`URL解析服务器运行在 http://localhost:${PORT}`);
  
  // 测试URL
  console.log('测试URL:');
  console.log('http://localhost:3000/api/users?page=1&limit=10');
  console.log('http://localhost:3000/search?q=nodejs&category=programming');
});
```

### 路由处理

```javascript
const http = require('http');
const url = require('url');

// 路由表
const routes = {
  '/': (req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
      <h1>欢迎来到Node.js服务器</h1>
      <ul>
        <li><a href="/api/users">用户列表</a></li>
        <li><a href="/api/products">产品列表</a></li>
        <li><a href="/about">关于我们</a></li>
      </ul>
    `);
  },
  
  '/api/users': (req, res) => {
    const users = [
      { id: 1, name: '张三', email: 'zhangsan@example.com' },
      { id: 2, name: '李四', email: 'lisi@example.com' },
      { id: 3, name: '王五', email: 'wangwu@example.com' }
    ];
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(users, null, 2));
  },
  
  '/api/products': (req, res) => {
    const products = [
      { id: 1, name: '笔记本电脑', price: 5999 },
      { id: 2, name: '智能手机', price: 2999 },
      { id: 3, name: '平板电脑', price: 1999 }
    ];
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(products, null, 2));
  },
  
  '/about': (req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
      <h1>关于我们</h1>
      <p>这是一个使用Node.js原生HTTP模块创建的简单服务器。</p>
      <a href="/">返回首页</a>
    `);
  }
};

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url);
  const pathname = parsedUrl.pathname;
  
  // 查找路由
  const handler = routes[pathname];
  
  if (handler) {
    handler(req, res);
  } else {
    // 404处理
    res.writeHead(404, { 'Content-Type': 'text/html' });
    res.end(`
      <h1>404 - 页面未找到</h1>
      <p>请求的页面 "${pathname}" 不存在。</p>
      <a href="/">返回首页</a>
    `);
  }
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`路由服务器运行在 http://localhost:${PORT}`);
});
```

## 📤 HTTP客户端

### 发送HTTP请求

```javascript
const http = require('http');
const https = require('https');

// GET请求
function makeGetRequest(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    
    const req = client.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });
    
    req.on('error', (err) => {
      reject(err);
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('请求超时'));
    });
  });
}

// POST请求
function makePostRequest(url, postData) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const urlObj = new URL(url);
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const req = client.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });
    
    req.on('error', (err) => {
      reject(err);
    });
    
    req.write(postData);
    req.end();
  });
}

// 使用示例
async function testHttpClient() {
  try {
    // 测试GET请求
    console.log('发送GET请求...');
    const getResponse = await makeGetRequest('http://httpbin.org/get');
    console.log('GET响应:', getResponse.statusCode);
    
    // 测试POST请求
    console.log('发送POST请求...');
    const postData = JSON.stringify({ name: '张三', age: 25 });
    const postResponse = await makePostRequest('http://httpbin.org/post', postData);
    console.log('POST响应:', postResponse.statusCode);
    
  } catch (error) {
    console.error('请求失败:', error.message);
  }
}

testHttpClient();
```

## 🌐 WebSocket基础

### 创建WebSocket服务器

```javascript
const http = require('http');
const WebSocket = require('ws');

// 创建HTTP服务器
const server = http.createServer();

// 创建WebSocket服务器
const wss = new WebSocket.Server({ server });

// 存储连接的客户端
const clients = new Set();

wss.on('connection', (ws, req) => {
  console.log('新的WebSocket连接');
  clients.add(ws);
  
  // 发送欢迎消息
  ws.send(JSON.stringify({
    type: 'welcome',
    message: '欢迎连接到WebSocket服务器！',
    timestamp: new Date().toISOString()
  }));
  
  // 处理消息
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      console.log('收到消息:', data);
      
      // 广播消息给所有客户端
      const broadcastMessage = {
        type: 'broadcast',
        from: 'server',
        message: data.message,
        timestamp: new Date().toISOString()
      };
      
      clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(broadcastMessage));
        }
      });
      
    } catch (error) {
      console.error('解析消息失败:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: '消息格式错误'
      }));
    }
  });
  
  // 处理连接关闭
  ws.on('close', () => {
    console.log('WebSocket连接关闭');
    clients.delete(ws);
  });
  
  // 处理错误
  ws.on('error', (error) => {
    console.error('WebSocket错误:', error);
    clients.delete(ws);
  });
});

// 定期发送心跳
setInterval(() => {
  const heartbeat = {
    type: 'heartbeat',
    timestamp: new Date().toISOString(),
    connectedClients: clients.size
  };
  
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(heartbeat));
    }
  });
}, 30000); // 每30秒发送一次心跳

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`WebSocket服务器运行在 ws://localhost:${PORT}`);
});
```

## 🛠️ 实践项目：RESTful API服务器

让我们创建一个完整的RESTful API服务器：

### 1. 项目结构

```
rest-api-server/
├── package.json
├── index.js
├── lib/
│   ├── server.js
│   ├── router.js
│   ├── middleware.js
│   └── dataStore.js
├── routes/
│   ├── users.js
│   └── products.js
└── tests/
    └── api.test.js
```

### 2. 创建数据存储

```javascript
// lib/dataStore.js
class DataStore {
  constructor() {
    this.users = [
      { id: 1, name: '张三', email: 'zhangsan@example.com', age: 25 },
      { id: 2, name: '李四', email: 'lisi@example.com', age: 30 },
      { id: 3, name: '王五', email: 'wangwu@example.com', age: 28 }
    ];
    
    this.products = [
      { id: 1, name: '笔记本电脑', price: 5999, category: '电子产品' },
      { id: 2, name: '智能手机', price: 2999, category: '电子产品' },
      { id: 3, name: '咖啡杯', price: 99, category: '生活用品' }
    ];
    
    this.nextUserId = 4;
    this.nextProductId = 4;
  }
  
  // 用户相关方法
  getAllUsers() {
    return this.users;
  }
  
  getUserById(id) {
    return this.users.find(user => user.id === parseInt(id));
  }
  
  createUser(userData) {
    const newUser = {
      id: this.nextUserId++,
      ...userData,
      createdAt: new Date().toISOString()
    };
    this.users.push(newUser);
    return newUser;
  }
  
  updateUser(id, userData) {
    const userIndex = this.users.findIndex(user => user.id === parseInt(id));
    if (userIndex !== -1) {
      this.users[userIndex] = { ...this.users[userIndex], ...userData };
      return this.users[userIndex];
    }
    return null;
  }
  
  deleteUser(id) {
    const userIndex = this.users.findIndex(user => user.id === parseInt(id));
    if (userIndex !== -1) {
      return this.users.splice(userIndex, 1)[0];
    }
    return null;
  }
  
  // 产品相关方法
  getAllProducts() {
    return this.products;
  }
  
  getProductById(id) {
    return this.products.find(product => product.id === parseInt(id));
  }
  
  createProduct(productData) {
    const newProduct = {
      id: this.nextProductId++,
      ...productData,
      createdAt: new Date().toISOString()
    };
    this.products.push(newProduct);
    return newProduct;
  }
  
  updateProduct(id, productData) {
    const productIndex = this.products.findIndex(product => product.id === parseInt(id));
    if (productIndex !== -1) {
      this.products[productIndex] = { ...this.products[productIndex], ...productData };
      return this.products[productIndex];
    }
    return null;
  }
  
  deleteProduct(id) {
    const productIndex = this.products.findIndex(product => product.id === parseInt(id));
    if (productIndex !== -1) {
      return this.products.splice(productIndex, 1)[0];
    }
    return null;
  }
}

module.exports = new DataStore();
```

### 3. 创建中间件

```javascript
// lib/middleware.js
const url = require('url');

// 日志中间件
function logger(req, res, next) {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.url;
  const userAgent = req.headers['user-agent'] || 'Unknown';
  
  console.log(`[${timestamp}] ${method} ${url} - ${userAgent}`);
  next();
}

// CORS中间件
function cors(req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  next();
}

// JSON解析中间件
function jsonParser(req, res, next) {
  if (req.method === 'POST' || req.method === 'PUT') {
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        req.body = body ? JSON.parse(body) : {};
        next();
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: '无效的JSON数据' }));
      }
    });
  } else {
    next();
  }
}

// 错误处理中间件
function errorHandler(err, req, res, next) {
  console.error('服务器错误:', err);
  
  res.writeHead(500, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    error: '服务器内部错误',
    message: err.message
  }));
}

// 404处理中间件
function notFound(req, res, next) {
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    error: '资源未找到',
    message: `路径 ${req.url} 不存在`
  }));
}

module.exports = {
  logger,
  cors,
  jsonParser,
  errorHandler,
  notFound
};
```

### 4. 创建路由器

```javascript
// lib/router.js
const url = require('url');

class Router {
  constructor() {
    this.routes = new Map();
  }
  
  // 注册路由
  route(method, path, handler) {
    const key = `${method.toUpperCase()} ${path}`;
    this.routes.set(key, handler);
  }
  
  // 处理请求
  handle(req, res) {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;
    const method = req.method.toUpperCase();
    const key = `${method} ${pathname}`;
    
    // 查找精确匹配
    let handler = this.routes.get(key);
    
    // 如果没有精确匹配，查找参数化路由
    if (!handler) {
      for (const [routeKey, routeHandler] of this.routes) {
        if (this.matchRoute(routeKey, method, pathname)) {
          handler = routeHandler;
          break;
        }
      }
    }
    
    if (handler) {
      req.query = parsedUrl.query;
      handler(req, res);
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: '路由未找到' }));
    }
  }
  
  // 匹配参数化路由
  matchRoute(routeKey, method, pathname) {
    const [routeMethod, routePath] = routeKey.split(' ');
    
    if (routeMethod !== method) {
      return false;
    }
    
    // 简单的参数化路由匹配
    const routeSegments = routePath.split('/');
    const pathSegments = pathname.split('/');
    
    if (routeSegments.length !== pathSegments.length) {
      return false;
    }
    
    for (let i = 0; i < routeSegments.length; i++) {
      if (routeSegments[i].startsWith(':')) {
        continue; // 参数匹配
      }
      if (routeSegments[i] !== pathSegments[i]) {
        return false;
      }
    }
    
    return true;
  }
}

module.exports = Router;
```

### 5. 创建用户路由

```javascript
// routes/users.js
const dataStore = require('../lib/dataStore');

function setupUserRoutes(router) {
  // GET /api/users - 获取所有用户
  router.route('GET', '/api/users', (req, res) => {
    const users = dataStore.getAllUsers();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(users, null, 2));
  });
  
  // GET /api/users/:id - 获取特定用户
  router.route('GET', '/api/users/:id', (req, res) => {
    const userId = req.url.split('/').pop();
    const user = dataStore.getUserById(userId);
    
    if (user) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(user, null, 2));
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: '用户未找到' }));
    }
  });
  
  // POST /api/users - 创建新用户
  router.route('POST', '/api/users', (req, res) => {
    const { name, email, age } = req.body;
    
    if (!name || !email) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: '姓名和邮箱是必填字段' }));
      return;
    }
    
    const newUser = dataStore.createUser({ name, email, age });
    res.writeHead(201, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(newUser, null, 2));
  });
  
  // PUT /api/users/:id - 更新用户
  router.route('PUT', '/api/users/:id', (req, res) => {
    const userId = req.url.split('/').pop();
    const updatedUser = dataStore.updateUser(userId, req.body);
    
    if (updatedUser) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(updatedUser, null, 2));
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: '用户未找到' }));
    }
  });
  
  // DELETE /api/users/:id - 删除用户
  router.route('DELETE', '/api/users/:id', (req, res) => {
    const userId = req.url.split('/').pop();
    const deletedUser = dataStore.deleteUser(userId);
    
    if (deletedUser) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: '用户删除成功', user: deletedUser }));
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: '用户未找到' }));
    }
  });
}

module.exports = setupUserRoutes;
```

### 6. 创建产品路由

```javascript
// routes/products.js
const dataStore = require('../lib/dataStore');

function setupProductRoutes(router) {
  // GET /api/products - 获取所有产品
  router.route('GET', '/api/products', (req, res) => {
    const products = dataStore.getAllProducts();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(products, null, 2));
  });
  
  // GET /api/products/:id - 获取特定产品
  router.route('GET', '/api/products/:id', (req, res) => {
    const productId = req.url.split('/').pop();
    const product = dataStore.getProductById(productId);
    
    if (product) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(product, null, 2));
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: '产品未找到' }));
    }
  });
  
  // POST /api/products - 创建新产品
  router.route('POST', '/api/products', (req, res) => {
    const { name, price, category } = req.body;
    
    if (!name || !price) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: '产品名称和价格是必填字段' }));
      return;
    }
    
    const newProduct = dataStore.createProduct({ name, price, category });
    res.writeHead(201, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(newProduct, null, 2));
  });
  
  // PUT /api/products/:id - 更新产品
  router.route('PUT', '/api/products/:id', (req, res) => {
    const productId = req.url.split('/').pop();
    const updatedProduct = dataStore.updateProduct(productId, req.body);
    
    if (updatedProduct) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(updatedProduct, null, 2));
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: '产品未找到' }));
    }
  });
  
  // DELETE /api/products/:id - 删除产品
  router.route('DELETE', '/api/products/:id', (req, res) => {
    const productId = req.url.split('/').pop();
    const deletedProduct = dataStore.deleteProduct(productId);
    
    if (deletedProduct) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: '产品删除成功', product: deletedProduct }));
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: '产品未找到' }));
    }
  });
}

module.exports = setupProductRoutes;
```

### 7. 创建主服务器

```javascript
// lib/server.js
const http = require('http');
const Router = require('./router');
const setupUserRoutes = require('../routes/users');
const setupProductRoutes = require('../routes/products');
const { logger, cors, jsonParser, errorHandler, notFound } = require('./middleware');

class Server {
  constructor(port = 3000) {
    this.port = port;
    this.router = new Router();
    this.setupRoutes();
  }
  
  setupRoutes() {
    // 设置用户路由
    setupUserRoutes(this.router);
    
    // 设置产品路由
    setupProductRoutes(this.router);
    
    // 健康检查路由
    this.router.route('GET', '/health', (req, res) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      }));
    });
    
    // API文档路由
    this.router.route('GET', '/', (req, res) => {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`
        <h1>RESTful API 服务器</h1>
        <h2>可用的API端点：</h2>
        <ul>
          <li><strong>GET /api/users</strong> - 获取所有用户</li>
          <li><strong>GET /api/users/:id</strong> - 获取特定用户</li>
          <li><strong>POST /api/users</strong> - 创建新用户</li>
          <li><strong>PUT /api/users/:id</strong> - 更新用户</li>
          <li><strong>DELETE /api/users/:id</strong> - 删除用户</li>
          <li><strong>GET /api/products</strong> - 获取所有产品</li>
          <li><strong>GET /api/products/:id</strong> - 获取特定产品</li>
          <li><strong>POST /api/products</strong> - 创建新产品</li>
          <li><strong>PUT /api/products/:id</strong> - 更新产品</li>
          <li><strong>DELETE /api/products/:id</strong> - 删除产品</li>
          <li><strong>GET /health</strong> - 健康检查</li>
        </ul>
      `);
    });
  }
  
  start() {
    const server = http.createServer((req, res) => {
      // 应用中间件
      logger(req, res, () => {
        cors(req, res, () => {
          jsonParser(req, res, () => {
            try {
              this.router.handle(req, res);
            } catch (error) {
              errorHandler(error, req, res, () => {});
            }
          });
        });
      });
    });
    
    server.listen(this.port, () => {
      console.log(`RESTful API服务器运行在 http://localhost:${this.port}`);
      console.log('API文档: http://localhost:' + this.port);
    });
    
    server.on('error', (err) => {
      console.error('服务器错误:', err);
    });
    
    return server;
  }
}

module.exports = Server;
```

### 8. 创建主程序

```javascript
// index.js
const Server = require('./lib/server');

// 创建并启动服务器
const server = new Server(3000);
server.start();

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n正在关闭服务器...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n正在关闭服务器...');
  process.exit(0);
});
```

### 9. 创建测试文件

```javascript
// tests/api.test.js
const http = require('http');

// 简单的HTTP客户端测试
function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });
    
    req.on('error', (err) => {
      reject(err);
    });
    
    if (postData) {
      req.write(postData);
    }
    
    req.end();
  });
}

async function runTests() {
  console.log('开始运行API测试...\n');
  
  const baseUrl = 'localhost';
  const port = 3000;
  
  try {
    // 测试健康检查
    console.log('测试健康检查...');
    const healthResponse = await makeRequest({
      hostname: baseUrl,
      port: port,
      path: '/health',
      method: 'GET'
    });
    
    if (healthResponse.statusCode === 200) {
      console.log('✅ 健康检查通过');
    } else {
      console.log('❌ 健康检查失败');
    }
    
    // 测试获取用户列表
    console.log('测试获取用户列表...');
    const usersResponse = await makeRequest({
      hostname: baseUrl,
      port: port,
      path: '/api/users',
      method: 'GET'
    });
    
    if (usersResponse.statusCode === 200) {
      const users = JSON.parse(usersResponse.data);
      console.log(`✅ 获取用户列表成功，共 ${users.length} 个用户`);
    } else {
      console.log('❌ 获取用户列表失败');
    }
    
    // 测试创建用户
    console.log('测试创建用户...');
    const newUser = JSON.stringify({
      name: '测试用户',
      email: 'test@example.com',
      age: 25
    });
    
    const createUserResponse = await makeRequest({
      hostname: baseUrl,
      port: port,
      path: '/api/users',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(newUser)
      }
    }, newUser);
    
    if (createUserResponse.statusCode === 201) {
      const createdUser = JSON.parse(createUserResponse.data);
      console.log(`✅ 创建用户成功，ID: ${createdUser.id}`);
    } else {
      console.log('❌ 创建用户失败');
    }
    
    // 测试获取产品列表
    console.log('测试获取产品列表...');
    const productsResponse = await makeRequest({
      hostname: baseUrl,
      port: port,
      path: '/api/products',
      method: 'GET'
    });
    
    if (productsResponse.statusCode === 200) {
      const products = JSON.parse(productsResponse.data);
      console.log(`✅ 获取产品列表成功，共 ${products.length} 个产品`);
    } else {
      console.log('❌ 获取产品列表失败');
    }
    
    console.log('\n✅ 所有API测试完成！');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

// 运行测试
if (require.main === module) {
  runTests();
}

module.exports = { runTests };
```

### 10. 更新package.json

```json
{
  "name": "rest-api-server",
  "version": "1.0.0",
  "description": "Node.js RESTful API服务器",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "test": "node tests/api.test.js"
  },
  "keywords": ["rest", "api", "http", "node"],
  "author": "您的名字",
  "license": "MIT"
}
```

## 📝 总结

在这一章中，我们学习了：

1. **HTTP模块基础**：创建HTTP服务器和客户端
2. **请求处理**：处理不同的HTTP方法和路由
3. **URL解析**：解析URL和查询参数
4. **WebSocket**：实时通信的基础
5. **RESTful API**：创建完整的REST API服务器
6. **中间件**：请求处理管道
7. **实践项目**：创建了一个功能完整的API服务器

## 🔗 下一步

接下来我们将学习：

- [Express框架入门](../02-express/README.md)
- [路由和中间件](../02-express/routing-middleware.md)
- [请求处理和响应](../02-express/request-response.md)

继续学习，掌握Express框架的强大功能！🚀
