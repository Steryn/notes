# 错误处理

## 🎯 学习目标

- 理解Express中的错误处理机制
- 学会创建和使用错误处理中间件
- 掌握同步和异步错误的处理方法
- 了解如何自定义错误响应
- 学会记录和监控错误

## 📚 错误处理基础

### 什么是错误处理？

错误处理是指在应用程序运行过程中捕获、处理和响应错误的过程。在Web应用中，良好的错误处理机制可以提高用户体验，帮助开发者快速定位和修复问题。

### Express中的错误处理

Express内置了错误处理支持。通过定义特殊的错误处理中间件，可以捕获和处理应用中的错误。

## ⚙️ 错误处理中间件

### 基本错误处理中间件

错误处理中间件与其他中间件类似，但接受四个参数而不是三个：`(err, req, res, next)`。

```javascript
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});
```

### 定义错误处理中间件

必须在所有其他`app.use()`和路由调用之后定义错误处理中间件：

```javascript
const express = require('express');
const app = express();

// 常规中间件
app.use(express.json());

// 路由
app.get('/', (req, res) => {
  res.send('Hello World!');
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

app.listen(3000);
```

### 多个错误处理中间件

可以定义多个错误处理中间件，它们会按顺序执行：

```javascript
// 日志记录中间件
app.use((err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] ${err.stack}`);
  next(err); // 传递错误给下一个错误处理中间件
});

// 格式化错误响应
app.use((err, req, res, next) => {
  res.status(500).json({
    error: {
      message: err.message,
      code: err.code || 'INTERNAL_ERROR'
    }
  });
});
```

## 🔄 错误传递

### 同步错误

同步代码中的错误会自动传递给错误处理中间件：

```javascript
app.get('/sync-error', (req, res) => {
  throw new Error('同步错误');
});
```

### 异步错误

异步代码中的错误需要手动传递：

```javascript
// 使用回调函数
app.get('/async-error', (req, res, next) => {
  someAsyncOperation((err, data) => {
    if (err) {
      return next(err); // 传递错误
    }
    res.json(data);
  });
});

// 使用Promise
app.get('/promise-error', (req, res, next) => {
  somePromiseOperation()
    .then(data => res.json(data))
    .catch(err => next(err)); // 传递错误
});

// 使用async/await
app.get('/async-await-error', async (req, res, next) => {
  try {
    const data = await someAsyncOperation();
    res.json(data);
  } catch (err) {
    next(err); // 传递错误
  }
});
```

### 路由中的错误处理

在路由处理器中处理错误：

```javascript
app.get('/user/:id', async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return next(new Error('用户未找到')); // 传递自定义错误
    }
    res.json(user);
  } catch (err) {
    next(err); // 传递数据库错误
  }
});
```

## 📦 自定义错误

### 创建自定义错误类

```javascript
class AppError extends Error {
  constructor(message, statusCode, code) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

// 使用自定义错误
app.get('/custom-error', (req, res, next) => {
  next(new AppError('自定义错误', 400, 'BAD_REQUEST'));
});
```

### 错误处理中间件中的自定义错误

```javascript
app.use((err, req, res, next) => {
  // 处理自定义错误
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: {
        message: err.message,
        code: err.code
      }
    });
  }
  
  // 处理其他错误
  console.error(err.stack);
  res.status(500).json({
    error: {
      message: '内部服务器错误',
      code: 'INTERNAL_ERROR'
    }
  });
});
```

## 📊 错误日志记录

### 基本日志记录

```javascript
app.use((err, req, res, next) => {
  console.error({
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    error: {
      message: err.message,
      stack: err.stack
    }
  });
  next(err);
});
```

### 使用Winston记录日志

```bash
npm install winston
```

```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

app.use((err, req, res, next) => {
  logger.error({
    message: err.message,
    stack: err.stack,
    method: req.method,
    url: req.url,
    ip: req.ip
  });
  next(err);
});
```

## 🛡️ 安全考虑

### 不向客户端暴露敏感信息

```javascript
app.use((err, req, res, next) => {
  // 开发环境显示详细错误信息
  if (process.env.NODE_ENV === 'development') {
    return res.status(500).json({
      error: {
        message: err.message,
        stack: err.stack
      }
    });
  }
  
  // 生产环境只显示通用错误信息
  res.status(500).json({
    error: {
      message: '内部服务器错误'
    }
  });
});
```

### 处理未捕获的异常

```javascript
// 处理未捕获的异常
process.on('uncaughtException', (err) => {
  console.error('未捕获的异常:', err);
  process.exit(1);
});

// 处理未处理的Promise拒绝
process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的Promise拒绝:', reason);
  process.exit(1);
});
```

## 🛠️ 实践练习

1. 创建一个完整的错误处理系统，包括自定义错误类和多个错误处理中间件

2. 实现一个错误日志记录系统，将错误信息保存到文件中

3. 创建不同环境（开发、测试、生产）的错误处理策略

4. 实现一个全局错误处理中间件，能够处理各种类型的错误

5. 构建一个错误监控系统，能够收集和分析应用中的错误

## 📖 进一步阅读

- [Express错误处理文档](
