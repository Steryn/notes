# Express框架入门

## 🎯 学习目标

- 理解Express框架的核心概念和优势
- 学会安装和配置Express应用
- 掌握Express的基本路由和中间件使用
- 了解Express的请求和响应对象
- 学会处理静态文件和模板引擎
- 掌握错误处理和调试技巧

## 📚 Express框架基础

### 什么是Express？

Express是一个基于Node.js平台的Web应用开发框架，它提供了一系列强大的特性来帮助开发者快速构建Web应用和API。

**Express的主要特点：**

- **轻量级**：核心功能简洁，易于学习和使用
- **灵活**：支持多种中间件，可扩展性强
- **快速**：基于Node.js，性能优秀
- **成熟**：社区活跃，生态丰富
- **RESTful**：天然支持RESTful API开发

### Express vs 原生HTTP模块

| 特性 | 原生HTTP | Express |
|------|----------|---------|
| 路由处理 | 手动解析URL | 内置路由系统 |
| 中间件 | 需要自己实现 | 丰富的中间件生态 |
| 静态文件 | 需要手动处理 | 内置静态文件服务 |
| 模板引擎 | 需要集成 | 支持多种模板引擎 |
| 错误处理 | 手动处理 | 内置错误处理机制 |
| 开发效率 | 较低 | 高 |

## 🚀 快速开始

### 安装Express

```bash
# 创建新项目
mkdir my-express-app
cd my-express-app

# 初始化项目
npm init -y

# 安装Express
npm install express

# 安装开发依赖
npm install --save-dev nodemon
```

### 第一个Express应用

```javascript
// app.js
const express = require('express');
const app = express();
const PORT = 3000;

// 基本路由
app.get('/', (req, res) => {
  res.send('<h1>欢迎来到Express世界！</h1>');
});

app.get('/api/hello', (req, res) => {
  res.json({
    message: 'Hello, Express!',
    timestamp: new Date().toISOString()
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`Express服务器运行在 http://localhost:${PORT}`);
});
```

### 更新package.json

```json
{
  "name": "my-express-app",
  "version": "1.0.0",
  "description": "我的第一个Express应用",
  "main": "app.js",
  "scripts": {
    "start": "node app.js",
    "dev": "nodemon app.js"
  },
  "dependencies": {
    "express": "^4.18.0"
  },
  "devDependencies": {
    "nodemon": "^2.0.20"
  }
}
```

运行应用：

```bash
npm run dev
```

## 🛣️ 路由基础

### 基本路由

```javascript
const express = require('express');
const app = express();

// GET路由
app.get('/', (req, res) => {
  res.send('首页');
});

app.get('/about', (req, res) => {
  res.send('关于我们');
});

// POST路由
app.post('/api/users', (req, res) => {
  res.json({ message: '创建用户成功' });
});

// PUT路由
app.put('/api/users/:id', (req, res) => {
  res.json({ message: `更新用户 ${req.params.id}` });
});

// DELETE路由
app.delete('/api/users/:id', (req, res) => {
  res.json({ message: `删除用户 ${req.params.id}` });
});

// 处理所有HTTP方法
app.all('/api/test', (req, res) => {
  res.json({
    method: req.method,
    message: '处理所有HTTP方法'
  });
});
```

### 路由参数

```javascript
// 路径参数
app.get('/users/:id', (req, res) => {
  const userId = req.params.id;
  res.json({ userId, message: `获取用户 ${userId} 的信息` });
});

// 多个参数
app.get('/users/:id/posts/:postId', (req, res) => {
  const { id, postId } = req.params;
  res.json({
    userId: id,
    postId: postId,
    message: `获取用户 ${id} 的帖子 ${postId}`
  });
});

// 查询参数
app.get('/search', (req, res) => {
  const { q, page = 1, limit = 10 } = req.query;
  res.json({
    query: q,
    page: parseInt(page),
    limit: parseInt(limit),
    message: '搜索结果'
  });
});
```

### 路由模块化

```javascript
// routes/users.js
const express = require('express');
const router = express.Router();

// 获取所有用户
router.get('/', (req, res) => {
  res.json([
    { id: 1, name: '张三', email: 'zhangsan@example.com' },
    { id: 2, name: '李四', email: 'lisi@example.com' }
  ]);
});

// 获取特定用户
router.get('/:id', (req, res) => {
  const userId = req.params.id;
  res.json({
    id: userId,
    name: '张三',
    email: 'zhangsan@example.com'
  });
});

// 创建用户
router.post('/', (req, res) => {
  res.status(201).json({
    message: '用户创建成功',
    user: req.body
  });
});

module.exports = router;
```

```javascript
// app.js
const express = require('express');
const userRoutes = require('./routes/users');

const app = express();

// 使用路由模块
app.use('/api/users', userRoutes);

app.listen(3000, () => {
  console.log('服务器运行在 http://localhost:3000');
});
```

## 🔧 中间件

### 什么是中间件？

中间件是在请求和响应之间执行的函数，它可以：

- 执行代码
- 修改请求和响应对象
- 结束请求-响应循环
- 调用下一个中间件

### 内置中间件

```javascript
const express = require('express');
const app = express();

// 解析JSON请求体
app.use(express.json());

// 解析URL编码的请求体
app.use(express.urlencoded({ extended: true }));

// 提供静态文件服务
app.use(express.static('public'));

// 基本路由
app.get('/', (req, res) => {
  res.send('Hello Express!');
});
```

### 自定义中间件

```javascript
// 日志中间件
function logger(req, res, next) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  next(); // 调用下一个中间件
}

// 认证中间件
function authenticate(req, res, next) {
  const token = req.headers.authorization;
  
  if (!token) {
    return res.status(401).json({ error: '需要认证令牌' });
  }
  
  // 这里应该验证token
  if (token === 'valid-token') {
    req.user = { id: 1, name: '张三' };
    next();
  } else {
    res.status(401).json({ error: '无效的认证令牌' });
  }
}

// 错误处理中间件
function errorHandler(err, req, res, next) {
  console.error(err.stack);
  res.status(500).json({ error: '服务器内部错误' });
}

// 使用中间件
app.use(logger);
app.use(authenticate);

app.get('/protected', (req, res) => {
  res.json({ message: '受保护的内容', user: req.user });
});

app.use(errorHandler);
```

### 中间件执行顺序

```javascript
const express = require('express');
const app = express();

// 中间件1
app.use((req, res, next) => {
  console.log('中间件1');
  next();
});

// 中间件2
app.use((req, res, next) => {
  console.log('中间件2');
  next();
});

// 路由处理
app.get('/', (req, res) => {
  console.log('路由处理');
  res.send('Hello!');
});

// 错误处理中间件（必须在最后）
app.use((err, req, res, next) => {
  console.log('错误处理中间件');
  res.status(500).send('出错了！');
});
```

## 📝 请求和响应

### 请求对象 (req)

```javascript
app.get('/api/users/:id', (req, res) => {
  // 请求参数
  console.log('路径参数:', req.params);
  console.log('查询参数:', req.query);
  console.log('请求体:', req.body);
  
  // 请求头
  console.log('用户代理:', req.get('User-Agent'));
  console.log('内容类型:', req.get('Content-Type'));
  
  // 请求信息
  console.log('请求方法:', req.method);
  console.log('请求URL:', req.url);
  console.log('请求路径:', req.path);
  console.log('请求协议:', req.protocol);
  console.log('请求主机:', req.get('host'));
  
  // IP地址
  console.log('客户端IP:', req.ip);
  console.log('远程地址:', req.connection.remoteAddress);
  
  res.json({ message: '请求信息已记录' });
});
```

### 响应对象 (res)

```javascript
app.get('/api/response-demo', (req, res) => {
  // 设置状态码
  res.status(200);
  
  // 设置响应头
  res.set('Content-Type', 'application/json');
  res.set('X-Custom-Header', 'MyValue');
  
  // 发送JSON响应
  res.json({
    message: 'JSON响应',
    data: { id: 1, name: '张三' }
  });
});

app.get('/api/redirect', (req, res) => {
  // 重定向
  res.redirect('/api/users');
});

app.get('/api/download', (req, res) => {
  // 下载文件
  res.download('./public/file.txt');
});

app.get('/api/send-file', (req, res) => {
  // 发送文件
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/api/end', (req, res) => {
  // 结束响应
  res.end('响应结束');
});
```

## 📁 静态文件服务

### 基本静态文件服务

```javascript
const express = require('express');
const path = require('path');
const app = express();

// 提供静态文件服务
app.use(express.static('public'));

// 多个静态目录
app.use('/css', express.static('public/css'));
app.use('/js', express.static('public/js'));
app.use('/images', express.static('public/images'));

// 虚拟路径前缀
app.use('/static', express.static('public'));

app.listen(3000, () => {
  console.log('服务器运行在 http://localhost:3000');
});
```

### 静态文件配置

```javascript
// 配置静态文件选项
app.use(express.static('public', {
  // 设置缓存控制
  maxAge: '1d',
  
  // 设置ETag
  etag: true,
  
  // 设置Last-Modified
  lastModified: true,
  
  // 设置索引文件
  index: ['index.html', 'index.htm'],
  
  // 点文件处理
  dotfiles: 'ignore',
  
  // 大小写敏感
  caseSensitive: false,
  
  // 重定向尾部斜杠
  redirect: true
}));
```

## 🎨 模板引擎

### 安装和配置EJS

```bash
npm install ejs
```

```javascript
const express = require('express');
const app = express();

// 设置模板引擎
app.set('view engine', 'ejs');
app.set('views', './views');

// 基本路由
app.get('/', (req, res) => {
  res.render('index', {
    title: '我的网站',
    message: '欢迎来到我的网站！',
    users: [
      { name: '张三', age: 25 },
      { name: '李四', age: 30 }
    ]
  });
});

app.listen(3000, () => {
  console.log('服务器运行在 http://localhost:3000');
});
```

### EJS模板示例

```html
<!-- views/index.ejs -->
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><%= title %></title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .user { background: #f0f0f0; padding: 10px; margin: 5px 0; }
    </style>
</head>
<body>
    <h1><%= title %></h1>
    <p><%= message %></p>
    
    <h2>用户列表</h2>
    <% users.forEach(function(user) { %>
        <div class="user">
            <strong><%= user.name %></strong> - <%= user.age %>岁
        </div>
    <% }); %>
    
    <h2>条件渲染</h2>
    <% if (users.length > 0) { %>
        <p>共有 <%= users.length %> 个用户</p>
    <% } else { %>
        <p>暂无用户</p>
    <% } %>
    
    <h2>包含其他模板</h2>
    <%- include('partials/footer') %>
</body>
</html>
```

```html
<!-- views/partials/footer.ejs -->
<footer>
    <p>&copy; 2024 我的网站. 版权所有.</p>
</footer>
```

## 🚨 错误处理

### 基本错误处理

```javascript
const express = require('express');
const app = express();

// 同步错误处理
app.get('/error-sync', (req, res) => {
  throw new Error('同步错误');
});

// 异步错误处理
app.get('/error-async', async (req, res, next) => {
  try {
    // 模拟异步操作
    await new Promise((resolve, reject) => {
      setTimeout(() => {
        reject(new Error('异步错误'));
      }, 1000);
    });
  } catch (error) {
    next(error); // 传递给错误处理中间件
  }
});

// 错误处理中间件（必须在最后）
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  // 根据错误类型返回不同的响应
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: '验证错误',
      message: err.message
    });
  }
  
  if (err.name === 'CastError') {
    return res.status(400).json({
      error: '无效的ID格式'
    });
  }
  
  // 默认错误处理
  res.status(500).json({
    error: '服务器内部错误',
    message: process.env.NODE_ENV === 'development' ? err.message : '出错了'
  });
});

// 404处理
app.use((req, res) => {
  res.status(404).json({
    error: '页面未找到',
    message: `路径 ${req.url} 不存在`
  });
});
```

### 自定义错误类

```javascript
// 自定义错误类
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

// 使用自定义错误
app.get('/api/users/:id', (req, res, next) => {
  const userId = req.params.id;
  
  if (!userId || isNaN(userId)) {
    return next(new AppError('无效的用户ID', 400));
  }
  
  // 模拟查找用户
  const user = null; // 假设用户不存在
  
  if (!user) {
    return next(new AppError('用户不存在', 404));
  }
  
  res.json(user);
});

// 全局错误处理中间件
app.use((err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  
  if (process.env.NODE_ENV === 'development') {
    res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack
    });
  } else {
    // 生产环境
    if (err.isOperational) {
      res.status(err.statusCode).json({
        status: err.status,
        message: err.message
      });
    } else {
      console.error('ERROR:', err);
      res.status(500).json({
        status: 'error',
        message: '出错了'
      });
    }
  }
});
```

## 🛠️ 实践项目：博客系统

让我们创建一个简单的博客系统来实践Express的使用：

### 1. 项目结构

```
blog-system/
├── package.json
├── app.js
├── config/
│   └── database.js
├── models/
│   └── Post.js
├── routes/
│   ├── posts.js
│   └── users.js
├── views/
│   ├── index.ejs
│   ├── post.ejs
│   └── partials/
│       └── header.ejs
├── public/
│   ├── css/
│   │   └── style.css
│   └── js/
│       └── main.js
└── tests/
    └── app.test.js
```

### 2. 创建数据模型

```javascript
// models/Post.js
class Post {
  constructor() {
    this.posts = [
      {
        id: 1,
        title: 'Node.js入门指南',
        content: 'Node.js是一个基于Chrome V8引擎的JavaScript运行时...',
        author: '张三',
        createdAt: new Date('2024-01-01'),
        tags: ['Node.js', 'JavaScript', '后端']
      },
      {
        id: 2,
        title: 'Express框架详解',
        content: 'Express是一个简洁而灵活的Node.js Web应用框架...',
        author: '李四',
        createdAt: new Date('2024-01-02'),
        tags: ['Express', 'Web开发', '框架']
      }
    ];
    this.nextId = 3;
  }
  
  getAll() {
    return this.posts;
  }
  
  getById(id) {
    return this.posts.find(post => post.id === parseInt(id));
  }
  
  create(postData) {
    const newPost = {
      id: this.nextId++,
      ...postData,
      createdAt: new Date()
    };
    this.posts.push(newPost);
    return newPost;
  }
  
  update(id, postData) {
    const postIndex = this.posts.findIndex(post => post.id === parseInt(id));
    if (postIndex !== -1) {
      this.posts[postIndex] = { ...this.posts[postIndex], ...postData };
      return this.posts[postIndex];
    }
    return null;
  }
  
  delete(id) {
    const postIndex = this.posts.findIndex(post => post.id === parseInt(id));
    if (postIndex !== -1) {
      return this.posts.splice(postIndex, 1)[0];
    }
    return null;
  }
  
  search(query) {
    return this.posts.filter(post => 
      post.title.toLowerCase().includes(query.toLowerCase()) ||
      post.content.toLowerCase().includes(query.toLowerCase())
    );
  }
}

module.exports = new Post();
```

### 3. 创建路由

```javascript
// routes/posts.js
const express = require('express');
const router = express.Router();
const Post = require('../models/Post');

// 获取所有文章
router.get('/', (req, res) => {
  const posts = Post.getAll();
  res.render('index', { posts, title: '博客首页' });
});

// 获取特定文章
router.get('/:id', (req, res, next) => {
  const post = Post.getById(req.params.id);
  if (!post) {
    return next(new Error('文章不存在'));
  }
  res.render('post', { post, title: post.title });
});

// 创建文章页面
router.get('/create/new', (req, res) => {
  res.render('create', { title: '创建新文章' });
});

// 创建文章
router.post('/', (req, res) => {
  const { title, content, author, tags } = req.body;
  
  if (!title || !content) {
    return res.status(400).json({ error: '标题和内容是必填字段' });
  }
  
  const newPost = Post.create({
    title,
    content,
    author: author || '匿名',
    tags: tags ? tags.split(',').map(tag => tag.trim()) : []
  });
  
  res.redirect(`/posts/${newPost.id}`);
});

// 更新文章
router.put('/:id', (req, res) => {
  const { title, content, author, tags } = req.body;
  const updatedPost = Post.update(req.params.id, {
    title,
    content,
    author,
    tags: tags ? tags.split(',').map(tag => tag.trim()) : []
  });
  
  if (updatedPost) {
    res.json(updatedPost);
  } else {
    res.status(404).json({ error: '文章不存在' });
  }
});

// 删除文章
router.delete('/:id', (req, res) => {
  const deletedPost = Post.delete(req.params.id);
  if (deletedPost) {
    res.json({ message: '文章删除成功', post: deletedPost });
  } else {
    res.status(404).json({ error: '文章不存在' });
  }
});

// 搜索文章
router.get('/search/:query', (req, res) => {
  const results = Post.search(req.params.query);
  res.json(results);
});

module.exports = router;
```

### 4. 创建视图模板

```html
<!-- views/partials/header.ejs -->
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><%= title %> - 我的博客</title>
    <link rel="stylesheet" href="/css/style.css">
</head>
<body>
    <header>
        <nav>
            <div class="container">
                <h1><a href="/">我的博客</a></h1>
                <ul>
                    <li><a href="/">首页</a></li>
                    <li><a href="/posts/create/new">写文章</a></li>
                </ul>
            </div>
        </nav>
    </header>
    <main class="container">
```

```html
<!-- views/index.ejs -->
<%- include('partials/header') %>

<h2>最新文章</h2>
<div class="posts">
    <% posts.forEach(function(post) { %>
        <article class="post">
            <h3><a href="/posts/<%= post.id %>"><%= post.title %></a></h3>
            <div class="post-meta">
                <span>作者: <%= post.author %></span>
                <span>发布时间: <%= post.createdAt.toLocaleDateString() %></span>
            </div>
            <div class="post-content">
                <%= post.content.substring(0, 200) %>...
            </div>
            <div class="post-tags">
                <% post.tags.forEach(function(tag) { %>
                    <span class="tag"><%= tag %></span>
                <% }); %>
            </div>
        </article>
    <% }); %>
</div>

<%- include('partials/footer') %>
```

```html
<!-- views/post.ejs -->
<%- include('partials/header') %>

<article class="post-detail">
    <h1><%= post.title %></h1>
    <div class="post-meta">
        <span>作者: <%= post.author %></span>
        <span>发布时间: <%= post.createdAt.toLocaleDateString() %></span>
    </div>
    <div class="post-content">
        <%= post.content %>
    </div>
    <div class="post-tags">
        <% post.tags.forEach(function(tag) { %>
            <span class="tag"><%= tag %></span>
        <% }); %>
    </div>
    <div class="post-actions">
        <a href="/posts/<%= post.id %>/edit" class="btn btn-primary">编辑</a>
        <button onclick="deletePost(<%= post.id %>)" class="btn btn-danger">删除</button>
    </div>
</article>

<script>
function deletePost(id) {
    if (confirm('确定要删除这篇文章吗？')) {
        fetch(`/posts/${id}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
            alert('文章删除成功');
            window.location.href = '/';
        })
        .catch(error => {
            alert('删除失败');
        });
    }
}
</script>

<%- include('partials/footer') %>
```

```html
<!-- views/partials/footer.ejs -->
    </main>
    <footer>
        <div class="container">
            <p>&copy; 2024 我的博客. 版权所有.</p>
        </div>
    </footer>
</body>
</html>
```

### 5. 创建样式文件

```css
/* public/css/style.css */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    line-height: 1.6;
    color: #333;
    background-color: #f4f4f4;
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
}

header {
    background: #333;
    color: white;
    padding: 1rem 0;
}

nav {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

nav h1 a {
    color: white;
    text-decoration: none;
}

nav ul {
    list-style: none;
    display: flex;
}

nav ul li {
    margin-left: 2rem;
}

nav ul li a {
    color: white;
    text-decoration: none;
    transition: color 0.3s;
}

nav ul li a:hover {
    color: #007bff;
}

main {
    padding: 2rem 0;
}

.posts {
    display: grid;
    gap: 2rem;
}

.post {
    background: white;
    padding: 2rem;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.post h3 a {
    color: #333;
    text-decoration: none;
}

.post h3 a:hover {
    color: #007bff;
}

.post-meta {
    color: #666;
    font-size: 0.9rem;
    margin: 0.5rem 0;
}

.post-meta span {
    margin-right: 1rem;
}

.post-content {
    margin: 1rem 0;
    line-height: 1.8;
}

.post-tags {
    margin-top: 1rem;
}

.tag {
    display: inline-block;
    background: #007bff;
    color: white;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.8rem;
    margin-right: 0.5rem;
}

.post-detail {
    background: white;
    padding: 2rem;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.post-actions {
    margin-top: 2rem;
    padding-top: 1rem;
    border-top: 1px solid #eee;
}

.btn {
    display: inline-block;
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 4px;
    text-decoration: none;
    cursor: pointer;
    margin-right: 1rem;
    transition: background-color 0.3s;
}

.btn-primary {
    background: #007bff;
    color: white;
}

.btn-primary:hover {
    background: #0056b3;
}

.btn-danger {
    background: #dc3545;
    color: white;
}

.btn-danger:hover {
    background: #c82333;
}

footer {
    background: #333;
    color: white;
    text-align: center;
    padding: 2rem 0;
    margin-top: 2rem;
}
```

### 6. 创建主应用

```javascript
// app.js
const express = require('express');
const path = require('path');
const app = express();

// 设置模板引擎
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// 中间件
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// 日志中间件
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// 路由
app.use('/posts', require('./routes/posts'));

// 首页路由
app.get('/', (req, res) => {
  res.redirect('/posts');
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', {
    title: '错误',
    message: err.message
  });
});

// 404处理
app.use((req, res) => {
  res.status(404).render('error', {
    title: '页面未找到',
    message: '请求的页面不存在'
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`博客系统运行在 http://localhost:${PORT}`);
});
```

### 7. 更新package.json

```json
{
  "name": "blog-system",
  "version": "1.0.0",
  "description": "基于Express的博客系统",
  "main": "app.js",
  "scripts": {
    "start": "node app.js",
    "dev": "nodemon app.js",
    "test": "node tests/app.test.js"
  },
  "dependencies": {
    "express": "^4.18.0",
    "ejs": "^3.1.8"
  },
  "devDependencies": {
    "nodemon": "^2.0.20"
  }
}
```

## 📝 总结

在这一章中，我们学习了：

1. **Express基础**：框架介绍和快速开始
2. **路由系统**：基本路由、参数路由、模块化路由
3. **中间件**：内置中间件、自定义中间件、错误处理
4. **请求响应**：req和res对象的使用
5. **静态文件**：静态文件服务和配置
6. **模板引擎**：EJS模板的使用
7. **实践项目**：创建了一个完整的博客系统

## 🔗 下一步

接下来我们将学习：

- [路由和中间件](./routing.md)
- [请求处理和响应](./request-response.md)
- [静态文件服务](./static-files.md)

继续学习，深入掌握Express的高级特性！🚀
