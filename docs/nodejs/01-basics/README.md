# Node.js 基础概念

## 🎯 学习目标

- 理解Node.js是什么以及它的核心特性
- 掌握Node.js的安装和基本使用
- 了解Node.js的架构和运行机制
- 学会使用Node.js REPL进行交互式编程

## 📚 核心概念

### 什么是Node.js？

Node.js是一个基于Chrome V8 JavaScript引擎构建的JavaScript运行时环境。它允许我们在服务器端运行JavaScript代码。

**主要特点：**

- **单线程**：使用事件循环处理并发
- **非阻塞I/O**：异步处理输入输出操作
- **跨平台**：支持Windows、macOS、Linux
- **丰富的生态系统**：npm包管理器提供大量第三方模块

### Node.js架构

```
┌─────────────────┐
│   JavaScript    │  ← 您的应用代码
├─────────────────┤
│   Node.js API   │  ← fs, http, path等模块
├─────────────────┤
│   V8 Engine     │  ← JavaScript执行引擎
├─────────────────┤
│   libuv         │  ← 事件循环和线程池
├─────────────────┤
│   Operating     │  ← 操作系统
│   System        │
└─────────────────┘
```

### 事件驱动编程

Node.js采用事件驱动、非阻塞I/O模型：

```javascript
// 事件驱动示例
const EventEmitter = require('events');

class MyEmitter extends EventEmitter {}

const myEmitter = new MyEmitter();

// 监听事件
myEmitter.on('event', (data) => {
  console.log('事件触发:', data);
});

// 触发事件
myEmitter.emit('event', 'Hello World');
```

## 🛠️ 安装和设置

### 安装Node.js

1. **使用官方安装包**
   - 访问 [nodejs.org](https://nodejs.org/)
   - 下载LTS版本（推荐）
   - 按照安装向导完成安装

2. **使用包管理器**

   ```bash
   # macOS (使用Homebrew)
   brew install node
   
   # Ubuntu/Debian
   sudo apt-get install nodejs npm
   
   # Windows (使用Chocolatey)
   choco install nodejs
   ```

3. **使用版本管理器（推荐）**

   ```bash
   # 安装nvm (Node Version Manager)
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
   
   # 安装最新LTS版本
   nvm install --lts
   nvm use --lts
   ```

### 验证安装

```bash
# 检查Node.js版本
node --version
# 或
node -v

# 检查npm版本
npm --version
# 或
npm -v
```

## 🚀 第一个Node.js程序

### 1. 创建项目目录

```bash
mkdir my-first-node-app
cd my-first-node-app
```

### 2. 初始化项目

```bash
npm init -y
```

这会创建 `package.json` 文件。

### 3. 创建第一个程序

创建 `app.js` 文件：

```javascript
// app.js
console.log('Hello, Node.js!');

// 获取当前时间
const now = new Date();
console.log(`当前时间: ${now.toLocaleString()}`);

// 简单的计算
const a = 10;
const b = 20;
console.log(`${a} + ${b} = ${a + b}`);
```

### 4. 运行程序

```bash
node app.js
```

输出：

```
Hello, Node.js!
当前时间: 2024/1/15 下午2:30:45
10 + 20 = 30
```

## 🔧 Node.js REPL

REPL（Read-Eval-Print Loop）是Node.js的交互式命令行工具。

### 启动REPL

```bash
node
```

### REPL常用命令

```javascript
// 基本使用
> 1 + 1
2

> const name = 'Node.js'
undefined

> console.log(`Hello, ${name}!`)
Hello, Node.js!
undefined

// 多行输入
> function greet(name) {
...   return `Hello, ${name}!`;
... }
undefined

> greet('World')
'Hello, World!'

// REPL命令
.help          // 显示帮助
.exit          // 退出REPL
.clear         // 清除当前上下文
.save filename // 保存当前会话
.load filename // 加载文件到REPL
```

## 📁 项目结构

典型的Node.js项目结构：

```
my-node-app/
├── package.json          # 项目配置和依赖
├── package-lock.json     # 依赖版本锁定
├── node_modules/         # 第三方模块
├── src/                  # 源代码
│   ├── index.js         # 入口文件
│   ├── routes/          # 路由文件
│   ├── models/          # 数据模型
│   └── utils/           # 工具函数
├── public/              # 静态文件
├── tests/               # 测试文件
├── docs/                # 文档
└── README.md            # 项目说明
```

## 🎯 实践练习

### 练习1：计算器程序

创建一个简单的计算器程序：

```javascript
// calculator.js
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function calculate(operation, a, b) {
  switch (operation) {
    case '+':
      return a + b;
    case '-':
      return a - b;
    case '*':
      return a * b;
    case '/':
      return b !== 0 ? a / b : '错误：除数不能为零';
    default:
      return '错误：不支持的运算';
  }
}

rl.question('请输入第一个数字: ', (num1) => {
  rl.question('请输入运算符 (+, -, *, /): ', (operator) => {
    rl.question('请输入第二个数字: ', (num2) => {
      const result = calculate(operator, parseFloat(num1), parseFloat(num2));
      console.log(`结果: ${result}`);
      rl.close();
    });
  });
});
```

### 练习2：文件信息查看器

创建一个程序来查看文件信息：

```javascript
// file-info.js
const fs = require('fs');
const path = require('path');

function getFileInfo(filePath) {
  try {
    const stats = fs.statSync(filePath);
    const ext = path.extname(filePath);
    const basename = path.basename(filePath);
    
    console.log('文件信息:');
    console.log(`文件名: ${basename}`);
    console.log(`扩展名: ${ext}`);
    console.log(`大小: ${stats.size} 字节`);
    console.log(`创建时间: ${stats.birthtime}`);
    console.log(`修改时间: ${stats.mtime}`);
    console.log(`是否为文件: ${stats.isFile()}`);
    console.log(`是否为目录: ${stats.isDirectory()}`);
  } catch (error) {
    console.error('错误:', error.message);
  }
}

// 使用示例
const filePath = process.argv[2];
if (filePath) {
  getFileInfo(filePath);
} else {
  console.log('请提供文件路径作为参数');
  console.log('用法: node file-info.js <文件路径>');
}
```

## 📝 总结

在这一章中，我们学习了：

1. **Node.js基础概念**：什么是Node.js，它的特点和架构
2. **安装和设置**：如何安装Node.js和验证安装
3. **第一个程序**：创建和运行简单的Node.js程序
4. **REPL使用**：交互式编程环境的使用
5. **项目结构**：典型的Node.js项目组织方式
6. **实践练习**：通过实际编程巩固知识

## 🔗 下一步

接下来我们将学习：

- [模块系统和包管理](./modules.md)
- [事件循环和异步编程](./async.md)
- [文件系统操作](./filesystem.md)

继续学习，掌握Node.js的核心概念！🚀
