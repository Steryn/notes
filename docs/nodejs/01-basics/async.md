# 事件循环和异步编程

## 🎯 学习目标

- 理解Node.js事件循环的工作原理
- 掌握回调函数的使用和回调地狱问题
- 学会使用Promise进行异步编程
- 掌握async/await语法糖
- 了解事件驱动编程模式
- 学会处理异步错误

## 📚 事件循环基础

### 什么是事件循环？

事件循环是Node.js的核心机制，它允许Node.js执行非阻塞I/O操作，尽管JavaScript是单线程的。

### 事件循环阶段

```
┌───────────────────────────┐
┌─>│           timers          │
│  └─────────────┬─────────────┘
│  ┌─────────────┴─────────────┐
│  │     pending callbacks     │
│  └─────────────┬─────────────┘
│  ┌─────────────┴─────────────┐
│  │       idle, prepare       │
│  └─────────────┬─────────────┘      ┌───────────────┐
│  ┌─────────────┴─────────────┐      │   incoming:   │
│  │           poll            │<─────┤  connections, │
│  └─────────────┬─────────────┘      │   data, etc.  │
│  ┌─────────────┴─────────────┐      └───────────────┘
│  │           check           │
│  └─────────────┬─────────────┘
│  ┌─────────────┴─────────────┐
└──┤      close callbacks      │
   └───────────────────────────┘
```

### 事件循环示例

```javascript
console.log('1. 同步代码开始');

setTimeout(() => {
  console.log('2. setTimeout 回调');
}, 0);

setImmediate(() => {
  console.log('3. setImmediate 回调');
});

process.nextTick(() => {
  console.log('4. nextTick 回调');
});

console.log('5. 同步代码结束');

// 输出顺序：
// 1. 同步代码开始
// 5. 同步代码结束
// 4. nextTick 回调
// 2. setTimeout 回调
// 3. setImmediate 回调
```

## 🔄 回调函数

### 基本回调

```javascript
// 简单的回调函数
function greet(name, callback) {
  console.log(`Hello, ${name}!`);
  callback();
}

function sayGoodbye() {
  console.log('Goodbye!');
}

greet('张三', sayGoodbye);
// 输出：
// Hello, 张三!
// Goodbye!
```

### 异步回调

```javascript
const fs = require('fs');

// 异步文件读取
fs.readFile('data.txt', 'utf8', (err, data) => {
  if (err) {
    console.error('读取文件错误:', err);
    return;
  }
  console.log('文件内容:', data);
});

console.log('这行代码会先执行');
```

### 回调地狱问题

```javascript
// 回调地狱示例
fs.readFile('file1.txt', 'utf8', (err1, data1) => {
  if (err1) {
    console.error(err1);
    return;
  }
  
  fs.readFile('file2.txt', 'utf8', (err2, data2) => {
    if (err2) {
      console.error(err2);
      return;
    }
    
    fs.readFile('file3.txt', 'utf8', (err3, data3) => {
      if (err3) {
        console.error(err3);
        return;
      }
      
      // 处理所有数据
      console.log('所有文件读取完成');
      console.log(data1, data2, data3);
    });
  });
});
```

## 🎯 Promise

### 创建Promise

```javascript
// 基本Promise创建
const myPromise = new Promise((resolve, reject) => {
  const success = true;
  
  if (success) {
    resolve('操作成功');
  } else {
    reject('操作失败');
  }
});

// 使用Promise
myPromise
  .then(result => {
    console.log(result);
  })
  .catch(error => {
    console.error(error);
  });
```

### Promise链式调用

```javascript
function readFilePromise(filename) {
  return new Promise((resolve, reject) => {
    fs.readFile(filename, 'utf8', (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
}

// 链式调用
readFilePromise('file1.txt')
  .then(data1 => {
    console.log('文件1:', data1);
    return readFilePromise('file2.txt');
  })
  .then(data2 => {
    console.log('文件2:', data2);
    return readFilePromise('file3.txt');
  })
  .then(data3 => {
    console.log('文件3:', data3);
    console.log('所有文件读取完成');
  })
  .catch(error => {
    console.error('读取文件错误:', error);
  });
```

### Promise.all和Promise.race

```javascript
// Promise.all - 等待所有Promise完成
Promise.all([
  readFilePromise('file1.txt'),
  readFilePromise('file2.txt'),
  readFilePromise('file3.txt')
])
.then(results => {
  console.log('所有文件内容:', results);
})
.catch(error => {
  console.error('至少一个文件读取失败:', error);
});

// Promise.race - 返回第一个完成的Promise
Promise.race([
  readFilePromise('file1.txt'),
  readFilePromise('file2.txt'),
  readFilePromise('file3.txt')
])
.then(result => {
  console.log('第一个完成的文件:', result);
})
.catch(error => {
  console.error('所有文件读取都失败:', error);
});
```

### 将回调转换为Promise

```javascript
const util = require('util');

// 使用util.promisify转换回调函数
const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);

// 现在可以使用Promise语法
readFile('data.txt', 'utf8')
  .then(data => {
    console.log('文件内容:', data);
    return writeFile('output.txt', data.toUpperCase());
  })
  .then(() => {
    console.log('文件写入成功');
  })
  .catch(error => {
    console.error('操作失败:', error);
  });
```

## ⚡ async/await

### 基本用法

```javascript
// 使用async/await重写Promise代码
async function readFiles() {
  try {
    const data1 = await readFile('file1.txt', 'utf8');
    console.log('文件1:', data1);
    
    const data2 = await readFile('file2.txt', 'utf8');
    console.log('文件2:', data2);
    
    const data3 = await readFile('file3.txt', 'utf8');
    console.log('文件3:', data3);
    
    console.log('所有文件读取完成');
  } catch (error) {
    console.error('读取文件错误:', error);
  }
}

readFiles();
```

### 并行执行

```javascript
async function readFilesParallel() {
  try {
    // 并行读取文件
    const [data1, data2, data3] = await Promise.all([
      readFile('file1.txt', 'utf8'),
      readFile('file2.txt', 'utf8'),
      readFile('file3.txt', 'utf8')
    ]);
    
    console.log('所有文件内容:', { data1, data2, data3 });
  } catch (error) {
    console.error('读取文件错误:', error);
  }
}
```

### 错误处理

```javascript
async function handleErrors() {
  try {
    const data = await readFile('nonexistent.txt', 'utf8');
    console.log(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log('文件不存在');
    } else {
      console.error('其他错误:', error.message);
    }
  }
}
```

## 🎪 事件驱动编程

### EventEmitter基础

```javascript
const EventEmitter = require('events');

class MyEmitter extends EventEmitter {}

const myEmitter = new MyEmitter();

// 监听事件
myEmitter.on('event', (data) => {
  console.log('事件触发:', data);
});

// 只监听一次
myEmitter.once('once-event', (data) => {
  console.log('一次性事件:', data);
});

// 触发事件
myEmitter.emit('event', 'Hello World');
myEmitter.emit('once-event', 'This will only fire once');
myEmitter.emit('once-event', 'This will not fire');
```

### 自定义事件类

```javascript
class UserManager extends EventEmitter {
  constructor() {
    super();
    this.users = [];
  }
  
  addUser(user) {
    this.users.push(user);
    this.emit('userAdded', user);
  }
  
  removeUser(userId) {
    const userIndex = this.users.findIndex(u => u.id === userId);
    if (userIndex !== -1) {
      const user = this.users.splice(userIndex, 1)[0];
      this.emit('userRemoved', user);
    }
  }
  
  getUserCount() {
    return this.users.length;
  }
}

// 使用自定义事件类
const userManager = new UserManager();

userManager.on('userAdded', (user) => {
  console.log(`用户 ${user.name} 已添加`);
});

userManager.on('userRemoved', (user) => {
  console.log(`用户 ${user.name} 已移除`);
});

userManager.addUser({ id: 1, name: '张三' });
userManager.addUser({ id: 2, name: '李四' });
userManager.removeUser(1);
```

## 🛠️ 实践项目：异步文件处理器

让我们创建一个异步文件处理项目：

### 1. 项目结构

```
async-file-processor/
├── package.json
├── index.js
├── lib/
│   ├── fileProcessor.js
│   ├── logger.js
│   └── utils.js
├── data/
│   ├── input/
│   └── output/
└── tests/
    └── fileProcessor.test.js
```

### 2. 创建文件处理器

```javascript
// lib/fileProcessor.js
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const EventEmitter = require('events');

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

class FileProcessor extends EventEmitter {
  constructor(inputDir, outputDir) {
    super();
    this.inputDir = inputDir;
    this.outputDir = outputDir;
  }
  
  async processFile(filename) {
    try {
      this.emit('processing', filename);
      
      const inputPath = path.join(this.inputDir, filename);
      const outputPath = path.join(this.outputDir, `processed_${filename}`);
      
      // 读取文件
      const data = await readFile(inputPath, 'utf8');
      
      // 处理数据（转换为大写）
      const processedData = data.toUpperCase();
      
      // 写入文件
      await writeFile(outputPath, processedData);
      
      this.emit('completed', { filename, inputPath, outputPath });
      return { filename, success: true };
      
    } catch (error) {
      this.emit('error', { filename, error: error.message });
      return { filename, success: false, error: error.message };
    }
  }
  
  async processAllFiles() {
    try {
      const files = await readdir(this.inputDir);
      const results = [];
      
      this.emit('start', { fileCount: files.length });
      
      // 并行处理所有文件
      const promises = files.map(file => this.processFile(file));
      const results = await Promise.all(promises);
      
      const successCount = results.filter(r => r.success).length;
      const errorCount = results.filter(r => !r.success).length;
      
      this.emit('finish', { 
        total: files.length, 
        success: successCount, 
        errors: errorCount 
      });
      
      return results;
      
    } catch (error) {
      this.emit('error', { error: error.message });
      throw error;
    }
  }
  
  async processFilesSequentially() {
    try {
      const files = await readdir(this.inputDir);
      const results = [];
      
      this.emit('start', { fileCount: files.length });
      
      // 顺序处理文件
      for (const file of files) {
        const result = await this.processFile(file);
        results.push(result);
      }
      
      const successCount = results.filter(r => r.success).length;
      const errorCount = results.filter(r => !r.success).length;
      
      this.emit('finish', { 
        total: files.length, 
        success: successCount, 
        errors: errorCount 
      });
      
      return results;
      
    } catch (error) {
      this.emit('error', { error: error.message });
      throw error;
    }
  }
}

module.exports = FileProcessor;
```

### 3. 创建日志记录器

```javascript
// lib/logger.js
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const writeFile = promisify(fs.writeFile);
const appendFile = promisify(fs.appendFile);

class Logger {
  constructor(logFile = 'app.log') {
    this.logFile = logFile;
    this.logs = [];
  }
  
  log(level, message, data = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      data
    };
    
    this.logs.push(logEntry);
    console.log(`[${timestamp}] ${level.toUpperCase()}: ${message}`);
    
    // 异步写入日志文件
    this.writeToFile(logEntry);
  }
  
  async writeToFile(logEntry) {
    try {
      const logLine = JSON.stringify(logEntry) + '\n';
      await appendFile(this.logFile, logLine);
    } catch (error) {
      console.error('写入日志文件失败:', error);
    }
  }
  
  info(message, data) {
    this.log('info', message, data);
  }
  
  error(message, data) {
    this.log('error', message, data);
  }
  
  warn(message, data) {
    this.log('warn', message, data);
  }
  
  debug(message, data) {
    this.log('debug', message, data);
  }
  
  getLogs() {
    return this.logs;
  }
  
  async clearLogs() {
    this.logs = [];
    try {
      await writeFile(this.logFile, '');
    } catch (error) {
      console.error('清空日志文件失败:', error);
    }
  }
}

module.exports = Logger;
```

### 4. 创建工具函数

```javascript
// lib/utils.js
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const mkdir = promisify(fs.mkdir);
const stat = promisify(fs.stat);

async function ensureDirectoryExists(dirPath) {
  try {
    await stat(dirPath);
  } catch (error) {
    if (error.code === 'ENOENT') {
      await mkdir(dirPath, { recursive: true });
    } else {
      throw error;
    }
  }
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function createTestFiles(dirPath, count = 5) {
  const files = [];
  for (let i = 1; i <= count; i++) {
    const filename = `test${i}.txt`;
    const content = `这是测试文件 ${i} 的内容\n包含多行文本\n用于测试文件处理功能`;
    const filePath = path.join(dirPath, filename);
    
    fs.writeFileSync(filePath, content, 'utf8');
    files.push(filename);
  }
  return files;
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

module.exports = {
  ensureDirectoryExists,
  delay,
  createTestFiles,
  formatBytes
};
```

### 5. 创建主程序

```javascript
// index.js
const path = require('path');
const FileProcessor = require('./lib/fileProcessor');
const Logger = require('./lib/logger');
const { ensureDirectoryExists, createTestFiles } = require('./lib/utils');

async function main() {
  const logger = new Logger('file-processor.log');
  const inputDir = path.join(__dirname, 'data', 'input');
  const outputDir = path.join(__dirname, 'data', 'output');
  
  try {
    // 确保目录存在
    await ensureDirectoryExists(inputDir);
    await ensureDirectoryExists(outputDir);
    
    // 创建测试文件
    logger.info('创建测试文件');
    createTestFiles(inputDir, 3);
    
    // 创建文件处理器
    const processor = new FileProcessor(inputDir, outputDir);
    
    // 设置事件监听器
    processor.on('start', (data) => {
      logger.info('开始处理文件', data);
    });
    
    processor.on('processing', (filename) => {
      logger.info(`正在处理文件: ${filename}`);
    });
    
    processor.on('completed', (data) => {
      logger.info(`文件处理完成: ${data.filename}`);
    });
    
    processor.on('error', (data) => {
      logger.error(`处理文件时出错: ${data.filename}`, data);
    });
    
    processor.on('finish', (data) => {
      logger.info('所有文件处理完成', data);
    });
    
    // 处理文件（并行）
    logger.info('开始并行处理文件');
    const parallelResults = await processor.processAllFiles();
    
    // 等待一秒
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 处理文件（顺序）
    logger.info('开始顺序处理文件');
    const sequentialResults = await processor.processFilesSequentially();
    
    // 输出结果
    console.log('\n=== 处理结果 ===');
    console.log('并行处理结果:', parallelResults);
    console.log('顺序处理结果:', sequentialResults);
    
    // 显示日志
    console.log('\n=== 日志记录 ===');
    const logs = logger.getLogs();
    logs.forEach(log => {
      console.log(`[${log.timestamp}] ${log.level.toUpperCase()}: ${log.message}`);
    });
    
  } catch (error) {
    logger.error('程序执行失败', { error: error.message });
    console.error('程序执行失败:', error);
  }
}

// 如果直接运行此文件
if (require.main === module) {
  main();
}

module.exports = { main };
```

### 6. 创建测试文件

```javascript
// tests/fileProcessor.test.js
const fs = require('fs');
const path = require('path');
const FileProcessor = require('../lib/fileProcessor');
const { ensureDirectoryExists, createTestFiles } = require('../lib/utils');

async function runTests() {
  console.log('开始运行文件处理器测试...\n');
  
  const testDir = path.join(__dirname, 'test-data');
  const inputDir = path.join(testDir, 'input');
  const outputDir = path.join(testDir, 'output');
  
  try {
    // 设置测试环境
    await ensureDirectoryExists(inputDir);
    await ensureDirectoryExists(outputDir);
    
    // 创建测试文件
    createTestFiles(inputDir, 2);
    
    // 创建文件处理器
    const processor = new FileProcessor(inputDir, outputDir);
    
    // 测试单个文件处理
    console.log('测试单个文件处理...');
    const result = await processor.processFile('test1.txt');
    console.log('结果:', result);
    
    // 测试并行处理
    console.log('\n测试并行处理...');
    const parallelResults = await processor.processAllFiles();
    console.log('并行处理结果:', parallelResults);
    
    // 验证输出文件
    console.log('\n验证输出文件...');
    const outputFiles = fs.readdirSync(outputDir);
    console.log('输出文件:', outputFiles);
    
    for (const file of outputFiles) {
      const content = fs.readFileSync(path.join(outputDir, file), 'utf8');
      console.log(`${file} 内容:`, content.substring(0, 50) + '...');
    }
    
    console.log('\n✅ 所有测试通过！');
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
  } finally {
    // 清理测试文件
    try {
      fs.rmSync(testDir, { recursive: true, force: true });
      console.log('测试文件已清理');
    } catch (error) {
      console.log('清理测试文件失败:', error.message);
    }
  }
}

// 运行测试
if (require.main === module) {
  runTests();
}

module.exports = { runTests };
```

### 7. 更新package.json

```json
{
  "name": "async-file-processor",
  "version": "1.0.0",
  "description": "异步文件处理项目",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "test": "node tests/fileProcessor.test.js"
  },
  "keywords": ["async", "file", "processing", "node"],
  "author": "您的名字",
  "license": "MIT"
}
```

## 📝 总结

在这一章中，我们学习了：

1. **事件循环**：Node.js的核心异步机制
2. **回调函数**：传统的异步编程方式
3. **Promise**：现代的异步编程解决方案
4. **async/await**：Promise的语法糖
5. **事件驱动编程**：EventEmitter的使用
6. **实践项目**：创建了一个完整的异步文件处理器

## 🔗 下一步

接下来我们将学习：

- [文件系统操作](./filesystem.md)
- [HTTP模块和网络编程](./http.md)
- [Express框架入门](../02-express/README.md)

继续学习，掌握Node.js的文件系统操作！🚀
