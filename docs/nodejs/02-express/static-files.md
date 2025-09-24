# 静态文件服务

## 🎯 学习目标

- 理解静态文件服务的概念和用途
- 学会使用express.static中间件
- 掌握静态文件服务的配置选项
- 了解虚拟路径前缀的使用
- 学会处理静态文件的缓存和安全问题

## 📚 静态文件服务基础

### 什么是静态文件？

静态文件是指内容不会改变的文件，如HTML、CSS、JavaScript、图片、字体等。Web服务器可以直接将这些文件发送给客户端，而无需进行任何处理。

### express.static中间件

Express提供了内置的中间件`express.static`来处理静态文件。只需指定包含静态资源的目录，就可以直接提供这些文件。

```javascript
const express = require('express');
const app = express();

// 提供public目录下的静态文件
app.use(express.static('public'));

app.listen(3000);
```

现在，`public`目录下的文件将可以直接访问：

public/ ├── images/ │ ├── logo.png │ └── background.jpg ├── css/ │ └── style.css ├── js/ │ └── main.js └── index.html

访问路径如下：

```javascript
- <http://localhost:3000/images/logo.png>
- <http://localhost:3000/css/style.css>
- <http://localhost:3000/js/main.js>
- <http://localhost:3000/index.html>
```

### 多个静态资源目录

可以使用多个`express.static`中间件来提供多个目录的静态文件：

```javascript
app.use(express.static('public'));
app.use(express.static('files'));
```

Express会按照中间件注册的顺序查找文件。如果在`public`目录中找不到文件，会继续在`files`目录中查找。

## ⚙️ 配置选项

### 虚拟路径前缀

可以为静态文件添加虚拟路径前缀，这样可以更好地组织资源：

```javascript
app.use('/static', express.static('public'));
```

现在访问静态文件需要添加`/static`前缀：

- <http://localhost:3000/static/images/logo.png>
- <http://localhost:3000/static/css/style.css>

### 配置对象

`express.static`接受一个配置对象作为第二个参数：

```javascript
app.use(express.static('public', {
  // 设置缓存时间（毫秒）
  maxAge: '1d',
  
  // 设置etag
  etag: true,
  
  // 设置最后修改时间
  lastModified: true,
  
  // 设置响应头
  setHeaders: (res, path, stat) => {
    res.set('x-timestamp', Date.now());
  }
}));
```

### 常用配置选项

| 选项 | 类型 | 描述 |
|------|------|------|
| `dotfiles` | String | 控制如何处理以点开头的文件（'allow'、'deny'、'ignore'） |
| `etag` | Boolean | 启用或禁用etag生成 |
| `extensions` | Array | 为文件设置后备扩展名 |
| `fallthrough` | Boolean | 当文件未找到时是否继续执行下一个中间件 |
| `immutable` | Boolean | 启用或禁用immutable指令 |
| `index` | String/Boolean/Array | 设置目录索引文件 |
| `lastModified` | Boolean | 设置Last-Modified头 |
| `maxAge` | Number/String | 设置Cache-Control头的max-age属性 |
| `redirect` | Boolean | 当路径是目录时重定向到尾部斜杠 |
| `setHeaders` | Function | 用于设置HTTP头的函数 |

### 示例配置

```javascript
app.use(express.static('public', {
  // 隐藏以点开头的文件
  dotfiles: 'ignore',
  
  // 禁用etag
  etag: false,
  
  // 设置后备扩展名
  extensions: ['html', 'htm'],
  
  // 设置索引文件
  index: ['index.html', 'default.html'],
  
  // 设置缓存时间
  maxAge: '1d',
  
  // 当路径是目录时重定向
  redirect: true,
  
  // 设置自定义响应头
  setHeaders: function (res, path, stat) {
    res.set('x-timestamp', Date.now());
  }
}));
```

## 📁 目录结构最佳实践

### 基本目录结构

project/ ├── public/ │ ├── favicon.ico │ ├── robots.txt │ ├── images/ │ │ ├── logo.png │ │ └── icons/ │ ├── stylesheets/ │ │ └── style.css │ ├── javascripts/ │ │ └── app.js │ └── uploads/ ├── views/ └── app.js

### 多环境目录结构

project/ ├── assets/ │ ├── dev/ │ │ ├── css/ │ │ └── js/ │ └── prod/ │ ├── css/ │ └── js/ ├── public/ └── app.js

```javascript
const env = process.env.NODE_ENV || 'dev';
app.use(express.static(`assets/${env}`));
```

## 🔒 安全考虑

### 限制访问目录

默认情况下，`express.static`不允许访问根目录或上级目录。但需要注意确保不会意外暴露敏感文件：

```javascript
// 不安全的做法
app.use(express.static('/'));

// 安全的做法
app.use(express.static(path.join(__dirname, 'public')));
```

### 隐藏敏感文件

使用`dotfiles`选项隐藏以点开头的文件：

```javascript
app.use(express.static('public', {
  dotfiles: 'ignore'
}));
```

### 设置内容类型

确保正确设置静态文件的内容类型：

```javascript
app.use(express.static('public', {
  setHeaders: (res, path, stat) => {
    if (path.endsWith('.jpg') || path.endsWith('.jpeg')) {
      res.set('Content-Type', 'image/jpeg');
    }
  }
}));
```

## 🚀 性能优化

### 启用缓存

设置适当的缓存头以提高性能：

```javascript
app.use(express.static('public', {
  maxAge: '1y',
  etag: true
}));
```

### 压缩静态文件

结合压缩中间件来减小文件大小：

```bash
npm install compression
```

```javascript
const compression = require('compression');

app.use(compression());
app.use(express.static('public'));
```

### 使用CDN

对于生产环境，考虑使用CDN来分发静态文件：

```javascript
// 开发环境
if (process.env.NODE_ENV === 'development') {
  app.use('/static', express.static('public'));
} 
// 生产环境使用CDN
else {
  app.use('/static', (req, res) => {
    res.redirect(`https://cdn.example.com${req.url}`);
  });
}
```

## 🛠️ 实践练习

1. 创建一个包含HTML、CSS、JavaScript和图片的完整静态网站

2. 配置不同的静态资源目录，分别用于公共资源和私有资源

3. 实现一个带有缓存控制和自定义响应头的静态文件服务

4. 创建一个开发和生产环境使用不同静态资源的配置

5. 实现一个文件上传功能，并将上传的文件作为静态资源提供

## 📖 进一步阅读

- [Express静态文件服务文档](https://expressjs.com/en/starter/static-files.html)
- [express.static API](https://expressjs.com/en/4x/api.html#express.static)
- [Web性能优化最佳实践](https://developers.google.com/web/fundamentals/performance/get-started)
- [HTTP缓存指南](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Caching)
