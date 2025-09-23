# Jest框架

## 📋 概述

Jest是Facebook开发的JavaScript测试框架，专为Node.js和React应用设计。它提供了完整的测试解决方案，包括测试运行器、断言库、模拟功能和代码覆盖率分析，是Node.js生态系统中最受欢迎的测试框架之一。

## 🎯 学习目标

- 掌握Jest的安装、配置和基本使用
- 学会编写各种类型的Jest测试
- 了解Jest的高级功能和最佳实践
- 掌握Jest的模拟和异步测试技巧

## 🚀 Jest快速上手

### 安装和配置

```bash
# 初始化项目
npm init -y

# 安装Jest
npm install --save-dev jest

# 安装类型定义（TypeScript项目）
npm install --save-dev @types/jest
```

### 基础配置

```json
// package.json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:ci": "jest --ci --coverage --watchAll=false"
  },
  "jest": {
    "testEnvironment": "node",
    "collectCoverage": true,
    "coverageDirectory": "coverage",
    "testMatch": [
      "**/__tests__/**/*.js",
      "**/?(*.)+(spec|test).js"
    ]
  }
}
```

### 详细配置文件

```javascript
// jest.config.js
module.exports = {
  // 测试环境
  testEnvironment: 'node',
  
  // 根目录
  rootDir: '.',
  
  // 测试文件匹配模式
  testMatch: [
    '<rootDir>/tests/**/*.test.js',
    '<rootDir>/src/**/__tests__/**/*.js'
  ],
  
  // 忽略的文件模式
  testPathIgnorePatterns: [
    '/node_modules/',
    '/build/',
    '/dist/'
  ],
  
  // 模块路径映射
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@tests/(.*)$': '<rootDir>/tests/$1'
  },
  
  // 设置和清理文件
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  
  // 覆盖率配置
  collectCoverage: true,
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/**/index.js'
  ],
  
  // 覆盖率阈值
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    './src/services/': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    }
  },
  
  // 转换配置
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  
  // 清除模拟
  clearMocks: true,
  
  // 测试超时
  testTimeout: 10000,
  
  // 并行运行
  maxWorkers: '50%',
  
  // 详细输出
  verbose: true
};
```

## 🔍 Jest核心功能

### 基本断言

```javascript
// math.js
function add(a, b) {
  return a + b;
}

function divide(a, b) {
  if (b === 0) {
    throw new Error('Division by zero');
  }
  return a / b;
}

module.exports = { add, divide };
```

```javascript
// math.test.js
const { add, divide } = require('./math');

describe('Math functions', () => {
  // 基本相等性测试
  test('add should return sum of two numbers', () => {
    expect(add(2, 3)).toBe(5);
    expect(add(-1, 1)).toBe(0);
  });
  
  // 对象相等性测试
  test('should handle object equality', () => {
    const user = { name: 'John', age: 30 };
    expect(user).toEqual({ name: 'John', age: 30 });
    expect(user).not.toBe({ name: 'John', age: 30 }); // 不同引用
  });
  
  // 数组测试
  test('should test arrays', () => {
    const fruits = ['apple', 'banana', 'orange'];
    expect(fruits).toHaveLength(3);
    expect(fruits).toContain('banana');
    expect(fruits).toEqual(expect.arrayContaining(['apple', 'orange']));
  });
  
  // 字符串测试
  test('should test strings', () => {
    const message = 'Hello World';
    expect(message).toMatch(/World/);
    expect(message).toContain('Hello');
    expect(message).toHaveLength(11);
  });
  
  // 数字测试
  test('should test numbers', () => {
    const value = 2 + 2;
    expect(value).toBe(4);
    expect(value).toBeGreaterThan(3);
    expect(value).toBeGreaterThanOrEqual(4);
    expect(value).toBeLessThan(5);
    
    // 浮点数比较
    expect(0.1 + 0.2).toBeCloseTo(0.3);
  });
  
  // 布尔值和空值测试
  test('should test truthiness', () => {
    expect(true).toBeTruthy();
    expect(false).toBeFalsy();
    expect(null).toBeNull();
    expect(undefined).toBeUndefined();
    expect('hello').toBeDefined();
  });
  
  // 异常测试
  test('divide should throw error for division by zero', () => {
    expect(() => divide(10, 0)).toThrow();
    expect(() => divide(10, 0)).toThrow('Division by zero');
    expect(() => divide(10, 0)).toThrow(Error);
  });
});
```

### 异步测试

```javascript
// async-functions.js
const axios = require('axios');

async function fetchUser(id) {
  const response = await axios.get(`/users/${id}`);
  return response.data;
}

function fetchUserCallback(id, callback) {
  setTimeout(() => {
    if (id === '1') {
      callback(null, { id: '1', name: 'John' });
    } else {
      callback(new Error('User not found'));
    }
  }, 100);
}

function fetchUserPromise(id) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (id === '1') {
        resolve({ id: '1', name: 'John' });
      } else {
        reject(new Error('User not found'));
      }
    }, 100);
  });
}

module.exports = { fetchUser, fetchUserCallback, fetchUserPromise };
```

```javascript
// async-functions.test.js
const axios = require('axios');
const { fetchUser, fetchUserCallback, fetchUserPromise } = require('./async-functions');

// Mock axios
jest.mock('axios');
const mockedAxios = axios;

describe('Async functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  // 使用async/await测试
  test('fetchUser should return user data', async () => {
    const userData = { id: '1', name: 'John' };
    mockedAxios.get.mockResolvedValue({ data: userData });
    
    const result = await fetchUser('1');
    
    expect(result).toEqual(userData);
    expect(mockedAxios.get).toHaveBeenCalledWith('/users/1');
  });
  
  // 测试异步错误
  test('fetchUser should handle errors', async () => {
    mockedAxios.get.mockRejectedValue(new Error('Network error'));
    
    await expect(fetchUser('999')).rejects.toThrow('Network error');
  });
  
  // 使用done回调测试
  test('fetchUserCallback should return user data', (done) => {
    fetchUserCallback('1', (error, user) => {
      expect(error).toBeNull();
      expect(user).toEqual({ id: '1', name: 'John' });
      done();
    });
  });
  
  test('fetchUserCallback should handle errors', (done) => {
    fetchUserCallback('999', (error, user) => {
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('User not found');
      expect(user).toBeUndefined();
      done();
    });
  });
  
  // 使用resolves/rejects匹配器
  test('fetchUserPromise should resolve with user data', () => {
    return expect(fetchUserPromise('1')).resolves.toEqual({
      id: '1',
      name: 'John'
    });
  });
  
  test('fetchUserPromise should reject for invalid id', () => {
    return expect(fetchUserPromise('999')).rejects.toThrow('User not found');
  });
  
  // 使用async/await的resolves/rejects
  test('fetchUserPromise with async/await resolves', async () => {
    await expect(fetchUserPromise('1')).resolves.toEqual({
      id: '1',
      name: 'John'
    });
  });
});
```

## 🎭 Jest模拟功能

### 函数模拟

```javascript
// user-service.js
const axios = require('axios');

class UserService {
  constructor(apiBaseUrl = 'https://api.example.com') {
    this.apiBaseUrl = apiBaseUrl;
  }
  
  async getUser(id) {
    const response = await axios.get(`${this.apiBaseUrl}/users/${id}`);
    return response.data;
  }
  
  async createUser(userData) {
    const response = await axios.post(`${this.apiBaseUrl}/users`, userData);
    return response.data;
  }
  
  processUserData(user, processor) {
    return processor(user);
  }
}

module.exports = UserService;
```

```javascript
// user-service.test.js
const axios = require('axios');
const UserService = require('./user-service');

// 模拟整个模块
jest.mock('axios');
const mockedAxios = axios;

describe('UserService', () => {
  let userService;
  
  beforeEach(() => {
    userService = new UserService();
    jest.clearAllMocks();
  });
  
  describe('getUser', () => {
    test('should fetch user data', async () => {
      const userData = { id: '1', name: 'John Doe' };
      mockedAxios.get.mockResolvedValue({ data: userData });
      
      const result = await userService.getUser('1');
      
      expect(result).toEqual(userData);
      expect(mockedAxios.get).toHaveBeenCalledWith('https://api.example.com/users/1');
      expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    });
    
    test('should handle API errors', async () => {
      mockedAxios.get.mockRejectedValue(new Error('API Error'));
      
      await expect(userService.getUser('1')).rejects.toThrow('API Error');
    });
  });
  
  describe('createUser', () => {
    test('should create new user', async () => {
      const userData = { name: 'Jane Doe', email: 'jane@example.com' };
      const createdUser = { id: '2', ...userData };
      
      mockedAxios.post.mockResolvedValue({ data: createdUser });
      
      const result = await userService.createUser(userData);
      
      expect(result).toEqual(createdUser);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://api.example.com/users',
        userData
      );
    });
  });
  
  describe('processUserData', () => {
    test('should call processor function', () => {
      const user = { id: '1', name: 'John' };
      const mockProcessor = jest.fn().mockReturnValue('processed');
      
      const result = userService.processUserData(user, mockProcessor);
      
      expect(result).toBe('processed');
      expect(mockProcessor).toHaveBeenCalledWith(user);
      expect(mockProcessor).toHaveBeenCalledTimes(1);
    });
  });
});
```

### 高级模拟技巧

```javascript
// advanced-mocking.test.js
describe('Advanced Mocking', () => {
  // 模拟返回值
  test('should mock different return values', () => {
    const mockFn = jest.fn();
    
    // 单次返回值
    mockFn.mockReturnValue('default');
    expect(mockFn()).toBe('default');
    
    // 单次返回值（一次性）
    mockFn.mockReturnValueOnce('first');
    mockFn.mockReturnValueOnce('second');
    
    expect(mockFn()).toBe('first');
    expect(mockFn()).toBe('second');
    expect(mockFn()).toBe('default'); // 回到默认值
  });
  
  // 模拟异步返回值
  test('should mock async return values', async () => {
    const mockAsyncFn = jest.fn();
    
    mockAsyncFn.mockResolvedValue('success');
    await expect(mockAsyncFn()).resolves.toBe('success');
    
    mockAsyncFn.mockRejectedValue(new Error('failed'));
    await expect(mockAsyncFn()).rejects.toThrow('failed');
  });
  
  // 模拟实现
  test('should mock implementation', () => {
    const mockFn = jest.fn();
    
    mockFn.mockImplementation((x, y) => x + y);
    expect(mockFn(2, 3)).toBe(5);
    
    // 一次性实现
    mockFn.mockImplementationOnce((x, y) => x * y);
    expect(mockFn(2, 3)).toBe(6);
    expect(mockFn(2, 3)).toBe(5); // 回到原实现
  });
  
  // 验证调用
  test('should verify function calls', () => {
    const mockFn = jest.fn();
    
    mockFn('arg1', 'arg2');
    mockFn('arg3');
    
    // 验证调用次数
    expect(mockFn).toHaveBeenCalledTimes(2);
    
    // 验证调用参数
    expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2');
    expect(mockFn).toHaveBeenLastCalledWith('arg3');
    
    // 验证调用顺序
    expect(mockFn).toHaveBeenNthCalledWith(1, 'arg1', 'arg2');
    expect(mockFn).toHaveBeenNthCalledWith(2, 'arg3');
  });
});
```

### 部分模拟

```javascript
// utils.js
const axios = require('axios');

function formatDate(date) {
  return date.toISOString().split('T')[0];
}

async function fetchData(url) {
  const response = await axios.get(url);
  return response.data;
}

function processArray(arr) {
  return arr.map(item => item.toUpperCase());
}

module.exports = { formatDate, fetchData, processArray };
```

```javascript
// partial-mocking.test.js
const utils = require('./utils');

// 部分模拟模块
jest.mock('./utils', () => ({
  ...jest.requireActual('./utils'),
  fetchData: jest.fn()
}));

describe('Partial Mocking', () => {
  test('should use real implementation for formatDate', () => {
    const date = new Date('2023-01-01T12:00:00Z');
    const result = utils.formatDate(date);
    expect(result).toBe('2023-01-01');
  });
  
  test('should use mocked fetchData', async () => {
    utils.fetchData.mockResolvedValue({ data: 'mocked' });
    
    const result = await utils.fetchData('/api/data');
    expect(result).toEqual({ data: 'mocked' });
  });
  
  test('should use real implementation for processArray', () => {
    const result = utils.processArray(['hello', 'world']);
    expect(result).toEqual(['HELLO', 'WORLD']);
  });
});
```

## ⏱️ Jest生命周期和钩子

### 生命周期钩子

```javascript
// lifecycle-hooks.test.js
describe('Lifecycle Hooks', () => {
  let database;
  let user;
  
  // 所有测试前执行一次
  beforeAll(async () => {
    console.log('Setting up database connection');
    database = await connectToDatabase();
  });
  
  // 所有测试后执行一次
  afterAll(async () => {
    console.log('Closing database connection');
    await database.close();
  });
  
  // 每个测试前执行
  beforeEach(async () => {
    console.log('Creating test user');
    user = await database.users.create({
      name: 'Test User',
      email: 'test@example.com'
    });
  });
  
  // 每个测试后执行
  afterEach(async () => {
    console.log('Cleaning up test data');
    await database.users.deleteMany({});
  });
  
  test('should create user', () => {
    expect(user).toBeDefined();
    expect(user.name).toBe('Test User');
  });
  
  test('should update user', async () => {
    user.name = 'Updated User';
    await user.save();
    
    expect(user.name).toBe('Updated User');
  });
  
  // 嵌套描述块有自己的生命周期
  describe('User validation', () => {
    beforeEach(() => {
      console.log('Setting up validation tests');
    });
    
    test('should validate email format', () => {
      expect(user.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    });
  });
});
```

### 测试隔离和清理

```javascript
// test-isolation.test.js
describe('Test Isolation', () => {
  let mockConsole;
  
  beforeEach(() => {
    // 模拟console.log
    mockConsole = jest.spyOn(console, 'log').mockImplementation();
  });
  
  afterEach(() => {
    // 恢复原始实现
    mockConsole.mockRestore();
    
    // 清除所有模拟
    jest.clearAllMocks();
    
    // 恢复所有模拟
    jest.restoreAllMocks();
    
    // 重置模块注册表
    jest.resetModules();
  });
  
  test('should not affect other tests', () => {
    console.log('Test message');
    expect(mockConsole).toHaveBeenCalledWith('Test message');
  });
  
  test('should start with clean state', () => {
    expect(mockConsole).not.toHaveBeenCalled();
  });
});
```

## 🔧 Jest高级配置

### 自定义匹配器

```javascript
// custom-matchers.js
expect.extend({
  toBeValidEmail(received) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const pass = emailRegex.test(received);
    
    return {
      message: () => 
        `expected ${received} ${pass ? 'not ' : ''}to be a valid email`,
      pass
    };
  },
  
  toBeWithinRange(received, floor, ceiling) {
    const pass = received >= floor && received <= ceiling;
    
    return {
      message: () =>
        `expected ${received} ${pass ? 'not ' : ''}to be within range ${floor} - ${ceiling}`,
      pass
    };
  },
  
  toHaveValidationError(received, field) {
    const hasError = received.errors && 
                    received.errors.some(error => error.field === field);
    
    return {
      message: () =>
        `expected validation result ${hasError ? 'not ' : ''}to have error for field ${field}`,
      pass: hasError
    };
  }
});
```

```javascript
// custom-matchers.test.js
require('./custom-matchers');

describe('Custom Matchers', () => {
  test('should validate email format', () => {
    expect('test@example.com').toBeValidEmail();
    expect('invalid-email').not.toBeValidEmail();
  });
  
  test('should check number range', () => {
    expect(15).toBeWithinRange(10, 20);
    expect(25).not.toBeWithinRange(10, 20);
  });
  
  test('should check validation errors', () => {
    const validationResult = {
      valid: false,
      errors: [
        { field: 'email', message: 'Email is required' },
        { field: 'password', message: 'Password too short' }
      ]
    };
    
    expect(validationResult).toHaveValidationError('email');
    expect(validationResult).not.toHaveValidationError('username');
  });
});
```

### 测试环境配置

```javascript
// jest-environment-setup.js
const NodeEnvironment = require('jest-environment-node');

class CustomEnvironment extends NodeEnvironment {
  constructor(config, context) {
    super(config, context);
    
    // 自定义全局变量
    this.global.testStartTime = Date.now();
  }
  
  async setup() {
    await super.setup();
    
    // 测试环境设置
    this.global.console.log('Setting up custom test environment');
    
    // 设置全局Mock
    this.global.fetch = require('jest-fetch-mock');
  }
  
  async teardown() {
    // 清理自定义设置
    this.global.console.log('Tearing down custom test environment');
    
    await super.teardown();
  }
}

module.exports = CustomEnvironment;
```

### 性能监控

```javascript
// performance-monitoring.test.js
describe('Performance Monitoring', () => {
  test('should complete within time limit', async () => {
    const startTime = Date.now();
    
    // 执行可能耗时的操作
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    expect(duration).toBeLessThan(200);
  });
  
  test('should monitor memory usage', () => {
    const initialMemory = process.memoryUsage().heapUsed;
    
    // 创建大量对象
    const largeArray = new Array(10000).fill('test');
    
    const finalMemory = process.memoryUsage().heapUsed;
    const memoryIncrease = finalMemory - initialMemory;
    
    // 验证内存增长在合理范围内
    expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024); // 10MB
    
    // 清理
    largeArray.length = 0;
  });
});
```

## 📊 测试报告和输出

### 自定义报告器

```javascript
// custom-reporter.js
class CustomReporter {
  constructor(globalConfig, options) {
    this.globalConfig = globalConfig;
    this.options = options;
  }
  
  onRunStart(results, options) {
    console.log('🚀 Starting test run...');
  }
  
  onTestStart(test) {
    console.log(`📝 Running: ${test.path}`);
  }
  
  onTestResult(test, testResult, aggregatedResult) {
    const { testFilePath, testResults } = testResult;
    const passed = testResults.filter(t => t.status === 'passed').length;
    const failed = testResults.filter(t => t.status === 'failed').length;
    
    console.log(`✅ ${passed} passed, ❌ ${failed} failed in ${testFilePath}`);
  }
  
  onRunComplete(contexts, results) {
    console.log('📊 Test Summary:');
    console.log(`Total Tests: ${results.numTotalTests}`);
    console.log(`Passed: ${results.numPassedTests}`);
    console.log(`Failed: ${results.numFailedTests}`);
    console.log(`Time: ${results.testResults.reduce((total, result) => total + result.perfStats.end - result.perfStats.start, 0)}ms`);
  }
}

module.exports = CustomReporter;
```

## 📝 总结

Jest为Node.js应用提供了完整的测试解决方案：

- **零配置**：开箱即用，无需复杂配置
- **功能完整**：断言、模拟、覆盖率一体化
- **异步支持**：完善的异步测试支持
- **模拟强大**：灵活的模拟和间谍功能
- **报告丰富**：详细的测试报告和覆盖率分析

Jest的丰富功能和良好的开发体验使其成为Node.js测试的首选框架。

## 🔗 相关资源

- [Jest官方文档](https://jestjs.io/docs/getting-started)
- [Jest配置指南](https://jestjs.io/docs/configuration)
- [Jest匹配器参考](https://jestjs.io/docs/expect)
- [Jest最佳实践](https://github.com/goldbergyoni/javascript-testing-best-practices)
