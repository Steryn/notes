# 路由和中间件

## 🎯 学习目标

- 理解Express路由的基本概念和使用方法
- 掌握不同HTTP方法的路由定义
- 学会使用路由参数和查询参数
- 理解中间件的概念和执行顺序
- 掌握常用内置中间件和自定义中间件
- 学会组织和模块化路由

## 📚 路由基础

### 什么是路由？

路由是指确定应用程序如何响应客户端对特定端点的请求，该端点是URI（或路径）和特定HTTP请求方法（GET、POST等）的组合。

每个路由可以具有一个或多个处理函数，这些函数在路由匹配时执行。

### 基本路由定义

Express提供了多种定义路由的方法：

```javascript
const express = require('express');
const app = express();

// GET方法路由
app.get('/', (req, res) => {
  res.send('GET请求');
});

// POST方法路由
app.post('/', (req, res) => {
  res.send('POST请求');
});

// PUT方法路由
app.put('/', (req, res) => {
  res.send('PUT请求');
});

// DELETE方法路由
app.delete('/', (req, res) => {
  res.send('DELETE请求');
});
```

### 路由方法

Express支持多种HTTP请求方法，对应不同的路由方法：

- `app.get()`
- `app.post()`
- `app.put()`
- `app.delete()`
- `app.patch()`
- `app.head()`
- `app.options()`

还有特殊方法`app.all()`，用于所有HTTP方法：

```javascript
app.all('/secret', (req, res, next) => {
  console.log('访问了secret页面');
  next(); // 传递控制权到下一个处理器
});
```

## 🔄 路由路径

路由路径可以是字符串、字符串模式或正则表达式。

### 字符串路径

```javascript
// 匹配 /about
app.get('/about', (req, res) => {
  res.send('关于页面');
});

// 匹配 /random.text
app.get('/random.text', (req, res) => {
  res.send('随机文本');
});
```

### 字符串模式路径

使用以下字符组合可以定义模式路径：

- `?` 表示前面的字符是可选的
- `+` 表示前面的字符出现一次或多次
- `*` 表示任意字符的任意组合
- `()` 表示分组

```javascript
// 匹配 acd 和 abcd
app.get('/ab?cd', (req, res) => {
  res.send('ab?cd');
});

// 匹配 abcd、abbcd、abbbcd等
app.get('/ab+cd', (req, res) => {
  res.send('ab+cd');
});

// 匹配 abcd、abxcd、abRANDOMcd等
app.get('/ab*cd', (req, res) => {
  res.send('ab*cd');
});

// 匹配 /abe 和 /abcde
app.get('/a(bc)d', (req, res) => {
  res.send('a(bc)d');
});
```

### 正则表达式路径

```javascript
// 匹配任何包含字母a的路径
app.get(/a/, (req, res) => {
  res.send('/a/');
});

// 匹配以fly结尾的路径
app.get(/.*fly$/, (req, res) => {
  res.send('/.*fly$/');
});
```

## 📦 路由参数

路由参数是URL中的命名段，用于捕获URL中的值。捕获的值存储在`req.params`对象中。

```javascript
// 匹配 /user/123
app.get('/user/:userId', (req, res) => {
  res.send(`用户ID: ${req.params.userId}`);
});

// 匹配 /user/123/books/456
app.get('/user/:userId/books/:bookId', (req, res) => {
  res.send(`用户ID: ${req.params.userId}, 图书ID: ${req.params.bookId}`);
});
```

### 正则表达式参数

```javascript
// 只匹配数字用户ID
app.get('/user/:userId(\d+)', (req, res) => {
  res.send(`数字用户ID: ${req.params.userId}`);
});
```

## 🔍 查询参数

查询参数是URL中`?`后面的部分，存储在`req.query`对象中。

```javascript
// 匹配 /search?q=javascript&category=tutorials
app.get('/search', (req, res) => {
  const { q, category } = req.query;
  res.send(`搜索: ${q}, 分类: ${category}`);
});
```

## ⚙️ 中间件

### 什么是中间件？

中间件函数是可以访问请求对象（req）、响应对象（res）和应用程序请求-响应循环中的下一个中间件函数的函数。下一个中间件函数通常由名为`next`的参数表示。

中间件函数可以执行以下任务：

- 执行代码
- 修改请求和响应对象
- 结束请求-响应循环
- 调用堆栈中的下一个中间件

如果当前中间件函数没有结束请求-响应循环，它必须调用`next()`将控制权传递给下一个中间件函数。否则，请求将被挂起。

### 中间件类型

Express应用程序可以使用以下类型的中间件：

1. **应用级中间件**
2. **路由器级中间件**
3. **错误处理中间件**
4. **内置中间件**
5. **第三方中间件**

### 应用级中间件

使用`app.use()`和`app.METHOD()`函数将应用级中间件绑定到应用程序对象实例。

```javascript
const express = require('express');
const app = express();

// 不指定路径的中间件，每次请求都会执行
app.use((req, res, next) => {
  console.log('时间:', Date.now());
  next();
});

// 指定路径的中间件，只在路径匹配时执行
app.use('/user/:id', (req, res, next) => {
  console.log('请求URL:', req.originalUrl);
  next();
});

// 挂载到特定路径和方法
app.get('/user/:id', (req, res, next) => {
  res.send(`用户信息: ${req.params.id}`);
});
```

### 路由器级中间件

路由器级中间件的工作方式与应用级中间件类似，只不过它绑定到`express.Router()`实例。

```javascript
const express = require('express');
const router = express.Router();

// 在路由器上使用中间件
router.use((req, res, next) => {
  console.log('路由器级中间件');
  next();
});

router.get('/user/:id', (req, res, next) => {
  res.send(`用户ID: ${req.params.id}`);
});

app.use('/api', router);
```

### 错误处理中间件

错误处理中间件始终采用四个参数：`(err, req, res, next)`。

```javascript
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('服务器内部错误!');
});
```

### 内置中间件

Express提供了以下内置中间件函数：

- `express.static` - 提供静态文件
- `express.json` - 解析JSON请求体
- `express.urlencoded` - 解析URL编码的请求体

```javascript
// 解析JSON请求体
app.use(express.json());

// 解析URL编码的请求体
app.use(express.urlencoded({ extended: true }));

// 提供静态文件
app.use(express.static('public'));
```

### 第三方中间件

安装并使用第三方中间件，例如`morgan`日志中间件：

```bash
npm install morgan
```

```javascript
const morgan = require('morgan');

app.use(morgan('combined'));
```

## 🔄 中间件执行顺序

中间件按照它们被加载的顺序执行。

```javascript
const express = require('express');
const app = express();

// 第一个中间件
app.use((req, res, next) => {
  console.log('第一个中间件');
  next();
});

// 第二个中间件
app.use((req, res, next) => {
  console.log('第二个中间件');
  next();
});

// 路由处理器
app.get('/', (req, res) => {
  res.send('Hello World!');
});

// 第三个中间件（不会执行，因为路由处理器已发送响应）
app.use((req, res, next) => {
  console.log('第三个中间件');
  next();
});
```

## 📁 模块化路由

使用`express.Router`类创建模块化的路由处理器。

```javascript
// routes/users.js
const express = require('express');
const router = express.Router();

// 中间件特定于此路由器
router.use((req, res, next) => {
  console.log('用户路由时间:', Date.now());
  next();
});

// 定义路由
router.get('/', (req, res) => {
  res.send('用户首页');
});

router.get('/profile', (req, res) => {
  res.send('用户资料');
});

module.exports = router;
```

```javascript
// app.js
const usersRouter = require('./routes/users');
app.use('/users', usersRouter);
```

## 🛠️ 实践练习

1. 创建一个简单的博客应用，包含以下路由：
   - GET /posts - 获取所有文章列表
   - GET /posts/:id - 获取特定文章
   - POST /posts - 创建新文章
   - PUT /posts/:id - 更新文章
   - DELETE /posts/:id - 删除文章

2. 实现一个日志中间件，记录每个请求的方法、URL和时间戳。

3. 创建一个验证中间件，检查请求中是否包含API密钥。

4. 使用express.Router组织博客应用的路由。

## 📖 进一步阅读

- [Express官方路由文档](https://expressjs.com/en/guide/routing.html)
- [Express中间件使用指南](https://expressjs.com/en/guide/using-middleware.html)
- [express.Router API](https://expressjs.com/en/4x/api.html#router)
