# 模块系统和包管理

## 🎯 学习目标

- 理解Node.js模块系统的工作原理
- 掌握CommonJS模块的导入和导出
- 学会使用npm进行包管理
- 了解ES6模块和CommonJS的区别
- 掌握模块的查找和加载机制

## 📚 模块系统基础

### 什么是模块？

模块是Node.js应用程序的基本组成部分，每个文件都被视为一个独立的模块。模块系统允许我们：

- 将代码分割成可重用的部分
- 避免全局命名空间污染
- 实现代码的封装和抽象

### CommonJS模块系统

Node.js使用CommonJS模块系统，这是Node.js的默认模块系统。

## 📤 导出模块

### 1. 使用 module.exports

```javascript
// math.js
function add(a, b) {
  return a + b;
}

function subtract(a, b) {
  return a - b;
}

function multiply(a, b) {
  return a * b;
}

// 导出单个函数
module.exports = add;

// 或者导出多个函数
module.exports = {
  add,
  subtract,
  multiply
};

// 或者分别导出
module.exports.add = add;
module.exports.subtract = subtract;
module.exports.multiply = multiply;
```

### 2. 使用 exports（简写）

```javascript
// utils.js
exports.formatDate = function(date) {
  return date.toLocaleDateString();
};

exports.formatTime = function(date) {
  return date.toLocaleTimeString();
};

exports.isValidEmail = function(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};
```

### 3. 导出类和构造函数

```javascript
// user.js
class User {
  constructor(name, email) {
    this.name = name;
    this.email = email;
    this.createdAt = new Date();
  }

  greet() {
    return `Hello, I'm ${this.name}`;
  }

  getInfo() {
    return {
      name: this.name,
      email: this.email,
      createdAt: this.createdAt
    };
  }
}

module.exports = User;
```

## 📥 导入模块

### 1. 使用 require()

```javascript
// app.js
const math = require('./math');
const utils = require('./utils');
const User = require('./user');

// 使用导入的模块
console.log(math.add(5, 3));        // 8
console.log(utils.formatDate(new Date()));

const user = new User('张三', 'zhangsan@example.com');
console.log(user.greet());
```

### 2. 解构导入

```javascript
// 从对象中解构需要的函数
const { add, subtract, multiply } = require('./math');
const { formatDate, isValidEmail } = require('./utils');

console.log(add(10, 5));           // 15
console.log(subtract(10, 5));      // 5
console.log(isValidEmail('test@example.com')); // true
```

### 3. 导入内置模块

```javascript
const fs = require('fs');
const path = require('path');
const http = require('http');
const os = require('os');

// 使用内置模块
console.log(os.platform());        // 操作系统平台
console.log(path.join(__dirname, 'data.txt')); // 路径拼接
```

## 🔍 模块查找机制

Node.js按以下顺序查找模块：

### 1. 核心模块

```javascript
const fs = require('fs');        // 内置模块
const path = require('path');    // 内置模块
```

### 2. 相对路径模块

```javascript
const utils = require('./utils');        // 当前目录
const config = require('../config');     // 上级目录
const helper = require('./helpers/helper'); // 子目录
```

### 3. 绝对路径模块

```javascript
const myModule = require('/absolute/path/to/module');
```

### 4. node_modules目录

```javascript
const express = require('express');      // 第三方模块
const lodash = require('lodash');        // 第三方模块
```

### 模块查找顺序

```
1. 检查是否是核心模块
2. 检查当前目录的 node_modules
3. 检查父目录的 node_modules
4. 继续向上查找，直到根目录
5. 检查全局安装的模块
```

## 📦 npm包管理

### 初始化项目

```bash
# 创建新的package.json
npm init

# 快速创建（使用默认值）
npm init -y
```

### 安装包

```bash
# 安装生产依赖
npm install express
npm install --save express

# 安装开发依赖
npm install --save-dev nodemon
npm install -D jest

# 全局安装
npm install -g nodemon

# 安装特定版本
npm install express@4.18.0
```

### package.json详解

```json
{
  "name": "my-node-app",
  "version": "1.0.0",
  "description": "我的Node.js应用",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js",
    "test": "jest"
  },
  "keywords": ["node", "express", "api"],
  "author": "您的名字",
  "license": "MIT",
  "dependencies": {
    "express": "^4.18.0",
    "lodash": "^4.17.21"
  },
  "devDependencies": {
    "nodemon": "^2.0.20",
    "jest": "^29.0.0"
  }
}
```

### 常用npm命令

```bash
# 查看已安装的包
npm list
npm list --depth=0

# 查看过时的包
npm outdated

# 更新包
npm update
npm update express

# 卸载包
npm uninstall express
npm uninstall -D nodemon

# 查看包信息
npm info express
npm view express versions

# 清理缓存
npm cache clean --force
```

## 🔄 ES6模块 vs CommonJS

### ES6模块语法

```javascript
// math.mjs (注意文件扩展名)
export function add(a, b) {
  return a + b;
}

export function subtract(a, b) {
  return a - b;
}

// 默认导出
export default function multiply(a, b) {
  return a * b;
}

// 导入
import multiply, { add, subtract } from './math.mjs';
```

### 在Node.js中使用ES6模块

```json
// package.json
{
  "type": "module"
}
```

或者使用 `.mjs` 扩展名。

## 🛠️ 实践项目：模块化计算器

让我们创建一个模块化的计算器项目：

### 1. 项目结构

```
calculator/
├── package.json
├── index.js
├── lib/
│   ├── math.js
│   ├── utils.js
│   └── validator.js
└── tests/
    └── math.test.js
```

### 2. 创建数学模块

```javascript
// lib/math.js
function add(a, b) {
  return a + b;
}

function subtract(a, b) {
  return a - b;
}

function multiply(a, b) {
  return a * b;
}

function divide(a, b) {
  if (b === 0) {
    throw new Error('除数不能为零');
  }
  return a / b;
}

function power(base, exponent) {
  return Math.pow(base, exponent);
}

function sqrt(number) {
  if (number < 0) {
    throw new Error('负数不能开平方根');
  }
  return Math.sqrt(number);
}

module.exports = {
  add,
  subtract,
  multiply,
  divide,
  power,
  sqrt
};
```

### 3. 创建工具模块

```javascript
// lib/utils.js
const math = require('./math');

function calculate(operation, ...args) {
  try {
    switch (operation.toLowerCase()) {
      case 'add':
        return math.add(...args);
      case 'subtract':
        return math.subtract(...args);
      case 'multiply':
        return math.multiply(...args);
      case 'divide':
        return math.divide(...args);
      case 'power':
        return math.power(...args);
      case 'sqrt':
        return math.sqrt(...args);
      default:
        throw new Error(`不支持的运算: ${operation}`);
    }
  } catch (error) {
    return { error: error.message };
  }
}

function formatResult(result) {
  if (typeof result === 'object' && result.error) {
    return `错误: ${result.error}`;
  }
  return `结果: ${result}`;
}

module.exports = {
  calculate,
  formatResult
};
```

### 4. 创建验证模块

```javascript
// lib/validator.js
function isNumber(value) {
  return typeof value === 'number' && !isNaN(value);
}

function validateNumbers(...numbers) {
  for (const num of numbers) {
    if (!isNumber(num)) {
      throw new Error(`无效的数字: ${num}`);
    }
  }
  return true;
}

function validateOperation(operation) {
  const validOperations = ['add', 'subtract', 'multiply', 'divide', 'power', 'sqrt'];
  if (!validOperations.includes(operation.toLowerCase())) {
    throw new Error(`无效的运算: ${operation}`);
  }
  return true;
}

module.exports = {
  isNumber,
  validateNumbers,
  validateOperation
};
```

### 5. 创建主程序

```javascript
// index.js
const utils = require('./lib/utils');
const validator = require('./lib/validator');

function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('用法: node index.js <运算> <数字1> [数字2]');
    console.log('支持的运算: add, subtract, multiply, divide, power, sqrt');
    return;
  }

  const [operation, ...numberArgs] = args;
  
  try {
    // 验证运算
    validator.validateOperation(operation);
    
    // 转换并验证数字
    const numbers = numberArgs.map(Number);
    validator.validateNumbers(...numbers);
    
    // 执行计算
    const result = utils.calculate(operation, ...numbers);
    console.log(utils.formatResult(result));
    
  } catch (error) {
    console.log(`错误: ${error.message}`);
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
// tests/math.test.js
const math = require('../lib/math');

// 简单的测试函数
function test(name, fn) {
  try {
    fn();
    console.log(`✅ ${name}`);
  } catch (error) {
    console.log(`❌ ${name}: ${error.message}`);
  }
}

function expect(actual) {
  return {
    toBe: (expected) => {
      if (actual !== expected) {
        throw new Error(`期望 ${expected}，但得到 ${actual}`);
      }
    },
    toThrow: (expectedError) => {
      try {
        actual();
        throw new Error('期望抛出错误，但没有抛出');
      } catch (error) {
        if (error.message !== expectedError) {
          throw new Error(`期望错误 "${expectedError}"，但得到 "${error.message}"`);
        }
      }
    }
  };
}

// 运行测试
console.log('运行数学模块测试...\n');

test('加法测试', () => {
  expect(math.add(2, 3)).toBe(5);
  expect(math.add(-1, 1)).toBe(0);
});

test('减法测试', () => {
  expect(math.subtract(5, 3)).toBe(2);
  expect(math.subtract(1, 1)).toBe(0);
});

test('乘法测试', () => {
  expect(math.multiply(2, 3)).toBe(6);
  expect(math.multiply(-2, 3)).toBe(-6);
});

test('除法测试', () => {
  expect(math.divide(6, 2)).toBe(3);
  expect(() => math.divide(1, 0)).toThrow('除数不能为零');
});

test('幂运算测试', () => {
  expect(math.power(2, 3)).toBe(8);
  expect(math.power(5, 0)).toBe(1);
});

test('平方根测试', () => {
  expect(math.sqrt(9)).toBe(3);
  expect(math.sqrt(0)).toBe(0);
  expect(() => math.sqrt(-1)).toThrow('负数不能开平方根');
});
```

### 7. 更新package.json

```json
{
  "name": "modular-calculator",
  "version": "1.0.0",
  "description": "模块化计算器项目",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "test": "node tests/math.test.js"
  },
  "keywords": ["calculator", "math", "node"],
  "author": "您的名字",
  "license": "MIT"
}
```

### 8. 使用示例

```bash
# 运行测试
npm test

# 使用计算器
node index.js add 5 3
node index.js multiply 4 7
node index.js sqrt 16
node index.js divide 10 2
```

## 📝 总结

在这一章中，我们学习了：

1. **模块系统基础**：CommonJS模块的工作原理
2. **导出和导入**：module.exports、exports和require的使用
3. **模块查找机制**：Node.js如何查找和加载模块
4. **npm包管理**：package.json、依赖管理和常用命令
5. **ES6模块**：现代JavaScript模块语法
6. **实践项目**：创建了一个完整的模块化计算器

## 🔗 下一步

接下来我们将学习：

- [事件循环和异步编程](./async.md)
- [文件系统操作](./filesystem.md)
- [HTTP模块和网络编程](./http.md)

继续学习，掌握Node.js的异步编程模型！🚀
