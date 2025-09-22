# 请求处理和响应

## 🎯 学习目标

- 理解Express中的请求对象（req）和响应对象（res）
- 掌握获取请求数据的各种方法
- 学会发送不同类型的响应
- 了解HTTP状态码的使用
- 掌握请求和响应的高级特性
- 理解内容协商和响应格式化

## 📚 请求对象 (req)

请求对象（req）包含HTTP请求的所有信息，如请求头、请求参数、请求体等。

### 请求头 (Headers)

```javascript
// 获取所有请求头
app.get('/', (req, res) => {
  console.log(req.headers);
  res.send('查看控制台输出');
});

// 获取特定请求头
app.get('/user-agent', (req, res) => {
  const userAgent = req.get('User-Agent');
  // 或者使用
  // const userAgent = req.headers['user-agent'];
  res.send(`User-Agent: ${userAgent}`);
});
```

### 请求参数

我们已经在路由部分了解了请求参数，这里再详细说明一下：

```javascript
// 路由参数
app.get('/user/:id', (req, res) => {
  const userId = req.params.id;
  res.send(`用户ID: ${userId}`);
});

// 查询参数
app.get('/search', (req, res) => {
  const { q, category } = req.query;
  res.send(`搜索词: ${q}, 分类: ${category}`);
});
```

### 请求体 (Body)

要访问请求体，需要使用中间件来解析不同格式的数据：

```javascript
// 解析JSON格式的请求体
app.use(express.json());

// 解析URL编码的请求体
app.use(express.urlencoded({ extended: true }));

// 处理JSON请求体
app.post('/api/users', (req, res) => {
  const { name, email } = req.body;
  res.json({
    message: '用户创建成功',
    user: { name, email }
  });
});

// 处理表单数据
app.post('/contact', (req, res) => {
  const { name, email, message } = req.body;
  res.send(`感谢 ${name} 的留言`);
});
```

### 其他有用的请求属性

```javascript
app.get('/info', (req, res) => {
  res.json({
    method: req.method,           // HTTP方法
    url: req.url,                 // 请求URL
    originalUrl: req.originalUrl, // 原始请求URL
    protocol: req.protocol,       // 协议 (http/https)
    hostname: req.hostname,       // 主机名
    ip: req.ip,                   // 客户端IP地址
    path: req.path,               // 请求路径
    query: req.query              // 查询字符串参数
  });
});
```

## 📤 响应对象 (res)

响应对象（res）提供了一系列方法用于向客户端发送响应。

### 发送响应

#### res.send()

发送各种类型的数据响应：

```javascript
// 发送字符串
app.get('/text', (req, res) => {
  res.send('Hello World');
});

// 发送HTML
app.get('/html', (req, res) => {
  res.send('<h1>Hello World</h1>');
});

// 发送JSON
app.get('/json', (req, res) => {
  res.send({ message: 'Hello World' });
});

// 发送Buffer
app.get('/buffer', (req, res) => {
  res.send(Buffer.from('Hello World'));
});

// 发送数组或对象
app.get('/array', (req, res) => {
  res.send([1, 2, 3, 4, 5]);
});
```

#### res.json()

发送JSON响应：

```javascript
app.get('/api/data', (req, res) => {
  res.json({
    name: 'John',
    age: 30,
    city: 'New York'
  });
});
```

#### res.jsonp()

发送支持JSONP的JSON响应：

```javascript
app.get('/api/data', (req, res) => {
  res.jsonp({
    name: 'John',
    age: 30
  });
});
```

### 设置状态码

#### res.status()

设置HTTP状态码：

```javascript
app.get('/not-found', (req, res) => {
  res.status(404).send('页面未找到');
});

app.post('/create', (req, res) => {
  res.status(201).json({ message: '创建成功' });
});

app.get('/error', (req, res) => {
  res.status(500).json({ error: '服务器内部错误' });
});
```

### 设置响应头

#### res.set()

设置响应头：

```javascript
app.get('/download', (req, res) => {
  res.set({
    'Content-Type': 'application/octet-stream',
    'Content-Disposition': 'attachment; filename="data.txt"'
  });
  res.send('下载文件内容');
});

// 设置单个响应头
app.get('/custom-header', (req, res) => {
  res.set('X-Custom-Header', 'MyValue');
  res.send('自定义响应头已设置');
});
```

### 内容协商

#### res.format()

根据请求的Accept头发送不同格式的响应：

```javascript
app.get('/api/users/:id', (req, res) => {
  const user = { id: req.params.id, name: 'John' };
  
  res.format({
    'text/plain': () => {
      res.send(`id: ${user.id}, name: ${user.name}`);
    },
    
    'text/html': () => {
      res.send(`<h1>User ${user.id}</h1><p>Name: ${user.name}</p>`);
    },
    
    'application/json': () => {
      res.json(user);
    },
    
    'default': () => {
      res.status(406).send('Not Acceptable');
    }
  });
});
```

### 重定向

#### res.redirect()

重定向到其他URL：

```javascript
// 临时重定向 (302)
app.get('/old-page', (req, res) => {
  res.redirect('/new-page');
});

// 永久重定向 (301)
app.get('/permanent', (req, res) => {
  res.redirect(301, '/new-location');
});

// 相对路径重定向
app.get('/home', (req, res) => {
  res.redirect('../dashboard');
});

// 绝对路径重定向
app.get('/google', (req, res) => {
  res.redirect('https://google.com');
});
```

### 渲染模板

#### res.render()

渲染模板引擎模板：

```javascript
// 首先设置模板引擎
app.set('view engine', 'ejs');

// 渲染模板
app.get('/profile', (req, res) => {
  res.render('profile', { 
    name: 'John', 
    age: 30 
  });
});
```

### 下载文件

#### res.download()

提示客户端下载文件：

```javascript
// 下载文件
app.get('/download/report', (req, res) => {
  res.download('./files/report.pdf');
});

// 指定下载文件名
app.get('/download/report', (req, res) => {
  res.download('./files/report.pdf', '财务报告.pdf');
});

// 处理下载错误
app.get('/download/report', (req, res) => {
  res.download('./files/report.pdf', 'report.pdf', (err) => {
    if (err) {
      // 处理错误
      res.status(500).send('下载失败');
    }
  });
});
```

### 结束响应

#### res.end()

结束响应过程：

```javascript
app.get('/end', (req, res) => {
  res.write('Hello ');
  res.end('World!');
});
```

## 🔄 请求和响应的高级特性

### 异步处理

在Express中处理异步操作：

```javascript
// 使用Promise
app.get('/users', async (req, res) => {
  try {
    const users = await User.findAll();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 使用回调函数
app.get('/users', (req, res) => {
  User.findAll((err, users) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(users);
  });
});
```

### 错误处理

在请求处理中正确处理错误：

```javascript
// 同步错误处理
app.get('/sync-error', (req, res) => {
  throw new Error('同步错误');
});

// 异步错误处理
app.get('/async-error', async (req, res, next) => {
  try {
    await someAsyncOperation();
  } catch (error) {
    next(error); // 传递给错误处理中间件
  }
});
```

## 🛠️ 实践练习

1. 创建一个API端点，能够处理不同类型的请求体（JSON、表单数据、纯文本）

2. 实现一个用户信息接口，支持返回JSON、XML和纯文本格式

3. 创建一个文件上传和下载功能

4. 实现一个重定向服务，根据查询参数重定向到不同的网站

5. 构建一个简单的模板渲染页面，展示用户信息

## 📖 进一步阅读

- [Express 4.x API 文档 - req](https://expressjs.com/en/4x/api.html#req)
- [Express 4.x API 文档 - res](https://expressjs.com/en/4x/api.html#res)
- [HTTP 状态码参考](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Status)
- [内容协商](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Content_negotiation)
