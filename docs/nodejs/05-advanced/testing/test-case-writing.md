# 测试用例编写

## 📋 概述

测试用例编写是软件测试的核心技能，直接影响测试的有效性和代码质量。好的测试用例应该清晰、可维护、全面覆盖功能需求，并能快速定位问题。本文档将系统介绍如何在Node.js项目中编写高质量的测试用例。

## 🎯 学习目标

- 掌握测试用例设计的基本原则和方法
- 学会编写清晰、可维护的测试代码
- 了解不同类型功能的测试策略
- 掌握测试数据管理和边界条件测试

## 📚 测试用例设计原则

### FIRST原则

```javascript
const FIRSTPrinciples = {
  FAST: {
    principle: '快速执行',
    description: '测试应该能够快速运行，理想情况下毫秒级完成',
    example: '单元测试应避免网络调用、文件IO等耗时操作'
  },
  
  ISOLATED: {
    principle: '独立隔离',
    description: '测试之间不应相互依赖，可以任意顺序执行',
    example: '每个测试前重置状态，使用独立的测试数据'
  },
  
  REPEATABLE: {
    principle: '可重复执行',
    description: '在任何环境下运行多次都能得到相同结果',
    example: '避免依赖系统时间、随机数等不确定因素'
  },
  
  SELF_VALIDATING: {
    principle: '自我验证',
    description: '测试结果明确，不需要人工判断成功或失败',
    example: '使用断言明确验证期望结果'
  },
  
  TIMELY: {
    principle: '及时编写',
    description: '测试应该在编写功能代码的同时或之前编写',
    example: 'TDD方法或功能完成后立即编写测试'
  }
};
```

### 测试用例结构

```javascript
// AAA模式：Arrange-Act-Assert
describe('用户服务', () => {
  describe('创建用户功能', () => {
    it('应该成功创建有效用户', () => {
      // Arrange - 准备测试数据和环境
      const userService = new UserService();
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 30
      };
      
      // Act - 执行被测试的操作
      const result = userService.createUser(userData);
      
      // Assert - 验证结果
      expect(result).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          name: userData.name,
          email: userData.email,
          createdAt: expect.any(Date)
        })
      );
    });
  });
});
```

## 🔍 不同类型功能的测试策略

### 纯函数测试

```javascript
// math-utils.js
class MathUtils {
  static add(a, b) {
    if (typeof a !== 'number' || typeof b !== 'number') {
      throw new Error('Both arguments must be numbers');
    }
    return a + b;
  }
  
  static factorial(n) {
    if (!Number.isInteger(n) || n < 0) {
      throw new Error('Argument must be a non-negative integer');
    }
    if (n === 0 || n === 1) return 1;
    return n * this.factorial(n - 1);
  }
  
  static isPrime(n) {
    if (!Number.isInteger(n) || n < 2) return false;
    for (let i = 2; i <= Math.sqrt(n); i++) {
      if (n % i === 0) return false;
    }
    return true;
  }
}

module.exports = MathUtils;
```

```javascript
// math-utils.test.js
const MathUtils = require('./math-utils');

describe('MathUtils', () => {
  describe('add方法', () => {
    // 正常情况测试
    describe('正常输入', () => {
      it('应该正确计算两个正数的和', () => {
        expect(MathUtils.add(2, 3)).toBe(5);
        expect(MathUtils.add(10, 15)).toBe(25);
      });
      
      it('应该正确处理负数', () => {
        expect(MathUtils.add(-5, 3)).toBe(-2);
        expect(MathUtils.add(-5, -3)).toBe(-8);
        expect(MathUtils.add(5, -3)).toBe(2);
      });
      
      it('应该正确处理零', () => {
        expect(MathUtils.add(0, 5)).toBe(5);
        expect(MathUtils.add(5, 0)).toBe(5);
        expect(MathUtils.add(0, 0)).toBe(0);
      });
      
      it('应该正确处理小数', () => {
        expect(MathUtils.add(0.1, 0.2)).toBeCloseTo(0.3);
        expect(MathUtils.add(1.5, 2.7)).toBeCloseTo(4.2);
      });
      
      it('应该正确处理大数', () => {
        expect(MathUtils.add(Number.MAX_SAFE_INTEGER, 0))
          .toBe(Number.MAX_SAFE_INTEGER);
      });
    });
    
    // 异常情况测试
    describe('异常输入', () => {
      it('应该在参数不是数字时抛出错误', () => {
        expect(() => MathUtils.add('2', 3)).toThrow('Both arguments must be numbers');
        expect(() => MathUtils.add(2, '3')).toThrow('Both arguments must be numbers');
        expect(() => MathUtils.add('a', 'b')).toThrow('Both arguments must be numbers');
      });
      
      it('应该在参数为null或undefined时抛出错误', () => {
        expect(() => MathUtils.add(null, 3)).toThrow();
        expect(() => MathUtils.add(2, undefined)).toThrow();
        expect(() => MathUtils.add(null, undefined)).toThrow();
      });
    });
  });
  
  describe('factorial方法', () => {
    it('应该正确计算阶乘', () => {
      expect(MathUtils.factorial(0)).toBe(1);
      expect(MathUtils.factorial(1)).toBe(1);
      expect(MathUtils.factorial(5)).toBe(120);
      expect(MathUtils.factorial(6)).toBe(720);
    });
    
    it('应该拒绝负数', () => {
      expect(() => MathUtils.factorial(-1)).toThrow();
      expect(() => MathUtils.factorial(-5)).toThrow();
    });
    
    it('应该拒绝非整数', () => {
      expect(() => MathUtils.factorial(1.5)).toThrow();
      expect(() => MathUtils.factorial(3.14)).toThrow();
    });
  });
  
  describe('isPrime方法', () => {
    it('应该正确识别质数', () => {
      expect(MathUtils.isPrime(2)).toBe(true);
      expect(MathUtils.isPrime(3)).toBe(true);
      expect(MathUtils.isPrime(5)).toBe(true);
      expect(MathUtils.isPrime(7)).toBe(true);
      expect(MathUtils.isPrime(11)).toBe(true);
      expect(MathUtils.isPrime(97)).toBe(true);
    });
    
    it('应该正确识别合数', () => {
      expect(MathUtils.isPrime(4)).toBe(false);
      expect(MathUtils.isPrime(6)).toBe(false);
      expect(MathUtils.isPrime(8)).toBe(false);
      expect(MathUtils.isPrime(9)).toBe(false);
      expect(MathUtils.isPrime(100)).toBe(false);
    });
    
    it('应该正确处理边界情况', () => {
      expect(MathUtils.isPrime(0)).toBe(false);
      expect(MathUtils.isPrime(1)).toBe(false);
      expect(MathUtils.isPrime(-1)).toBe(false);
    });
  });
});
```

### 有状态类的测试

```javascript
// shopping-cart.js
class ShoppingCart {
  constructor() {
    this.items = [];
    this.discountRate = 0;
  }
  
  addItem(product, quantity = 1) {
    if (!product || !product.id || !product.price) {
      throw new Error('Invalid product');
    }
    
    if (quantity <= 0) {
      throw new Error('Quantity must be positive');
    }
    
    const existingItem = this.items.find(item => item.product.id === product.id);
    
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      this.items.push({ product, quantity });
    }
  }
  
  removeItem(productId) {
    const index = this.items.findIndex(item => item.product.id === productId);
    if (index !== -1) {
      this.items.splice(index, 1);
    }
  }
  
  updateQuantity(productId, quantity) {
    if (quantity <= 0) {
      throw new Error('Quantity must be positive');
    }
    
    const item = this.items.find(item => item.product.id === productId);
    if (item) {
      item.quantity = quantity;
    }
  }
  
  setDiscount(rate) {
    if (rate < 0 || rate > 1) {
      throw new Error('Discount rate must be between 0 and 1');
    }
    this.discountRate = rate;
  }
  
  getTotal() {
    const subtotal = this.items.reduce(
      (sum, item) => sum + (item.product.price * item.quantity),
      0
    );
    return subtotal * (1 - this.discountRate);
  }
  
  getItemCount() {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
  }
  
  clear() {
    this.items = [];
    this.discountRate = 0;
  }
  
  isEmpty() {
    return this.items.length === 0;
  }
}

module.exports = ShoppingCart;
```

```javascript
// shopping-cart.test.js
const ShoppingCart = require('./shopping-cart');

describe('ShoppingCart', () => {
  let cart;
  let sampleProducts;
  
  beforeEach(() => {
    cart = new ShoppingCart();
    sampleProducts = [
      { id: '1', name: 'Apple', price: 1.99 },
      { id: '2', name: 'Banana', price: 0.99 },
      { id: '3', name: 'Orange', price: 2.49 }
    ];
  });
  
  describe('初始状态', () => {
    it('应该创建空购物车', () => {
      expect(cart.isEmpty()).toBe(true);
      expect(cart.getItemCount()).toBe(0);
      expect(cart.getTotal()).toBe(0);
    });
  });
  
  describe('添加商品', () => {
    it('应该成功添加单个商品', () => {
      cart.addItem(sampleProducts[0], 2);
      
      expect(cart.isEmpty()).toBe(false);
      expect(cart.getItemCount()).toBe(2);
      expect(cart.items).toHaveLength(1);
      expect(cart.items[0]).toEqual({
        product: sampleProducts[0],
        quantity: 2
      });
    });
    
    it('应该合并相同商品', () => {
      cart.addItem(sampleProducts[0], 2);
      cart.addItem(sampleProducts[0], 3);
      
      expect(cart.items).toHaveLength(1);
      expect(cart.items[0].quantity).toBe(5);
      expect(cart.getItemCount()).toBe(5);
    });
    
    it('应该添加不同商品到购物车', () => {
      cart.addItem(sampleProducts[0], 1);
      cart.addItem(sampleProducts[1], 2);
      
      expect(cart.items).toHaveLength(2);
      expect(cart.getItemCount()).toBe(3);
    });
    
    it('应该在数量为默认值时添加1个商品', () => {
      cart.addItem(sampleProducts[0]);
      
      expect(cart.items[0].quantity).toBe(1);
    });
    
    it('应该拒绝无效商品', () => {
      expect(() => cart.addItem(null)).toThrow('Invalid product');
      expect(() => cart.addItem({})).toThrow('Invalid product');
      expect(() => cart.addItem({ id: '1' })).toThrow('Invalid product');
      expect(() => cart.addItem({ price: 1.99 })).toThrow('Invalid product');
    });
    
    it('应该拒绝无效数量', () => {
      expect(() => cart.addItem(sampleProducts[0], 0)).toThrow('Quantity must be positive');
      expect(() => cart.addItem(sampleProducts[0], -1)).toThrow('Quantity must be positive');
    });
  });
  
  describe('移除商品', () => {
    beforeEach(() => {
      cart.addItem(sampleProducts[0], 2);
      cart.addItem(sampleProducts[1], 1);
    });
    
    it('应该成功移除存在的商品', () => {
      cart.removeItem('1');
      
      expect(cart.items).toHaveLength(1);
      expect(cart.items[0].product.id).toBe('2');
      expect(cart.getItemCount()).toBe(1);
    });
    
    it('应该忽略不存在的商品ID', () => {
      const originalLength = cart.items.length;
      cart.removeItem('999');
      
      expect(cart.items).toHaveLength(originalLength);
    });
  });
  
  describe('更新数量', () => {
    beforeEach(() => {
      cart.addItem(sampleProducts[0], 2);
    });
    
    it('应该成功更新商品数量', () => {
      cart.updateQuantity('1', 5);
      
      expect(cart.items[0].quantity).toBe(5);
      expect(cart.getItemCount()).toBe(5);
    });
    
    it('应该忽略不存在的商品ID', () => {
      cart.updateQuantity('999', 5);
      
      expect(cart.items[0].quantity).toBe(2); // 保持原数量
    });
    
    it('应该拒绝无效数量', () => {
      expect(() => cart.updateQuantity('1', 0)).toThrow('Quantity must be positive');
      expect(() => cart.updateQuantity('1', -1)).toThrow('Quantity must be positive');
    });
  });
  
  describe('折扣功能', () => {
    beforeEach(() => {
      cart.addItem(sampleProducts[0], 1); // $1.99
      cart.addItem(sampleProducts[1], 2); // $0.99 x 2 = $1.98
      // 总计: $3.97
    });
    
    it('应该正确应用折扣', () => {
      cart.setDiscount(0.1); // 10% 折扣
      
      expect(cart.getTotal()).toBeCloseTo(3.97 * 0.9);
    });
    
    it('应该处理0折扣', () => {
      cart.setDiscount(0);
      
      expect(cart.getTotal()).toBeCloseTo(3.97);
    });
    
    it('应该处理100%折扣', () => {
      cart.setDiscount(1);
      
      expect(cart.getTotal()).toBe(0);
    });
    
    it('应该拒绝无效折扣率', () => {
      expect(() => cart.setDiscount(-0.1)).toThrow('Discount rate must be between 0 and 1');
      expect(() => cart.setDiscount(1.1)).toThrow('Discount rate must be between 0 and 1');
    });
  });
  
  describe('计算总价', () => {
    it('应该正确计算多个商品的总价', () => {
      cart.addItem(sampleProducts[0], 2); // $1.99 x 2 = $3.98
      cart.addItem(sampleProducts[1], 3); // $0.99 x 3 = $2.97
      cart.addItem(sampleProducts[2], 1); // $2.49 x 1 = $2.49
      // 总计: $9.44
      
      expect(cart.getTotal()).toBeCloseTo(9.44);
    });
    
    it('应该在应用折扣后正确计算总价', () => {
      cart.addItem(sampleProducts[0], 1); // $1.99
      cart.setDiscount(0.2); // 20% 折扣
      
      expect(cart.getTotal()).toBeCloseTo(1.99 * 0.8);
    });
  });
  
  describe('清空购物车', () => {
    beforeEach(() => {
      cart.addItem(sampleProducts[0], 2);
      cart.addItem(sampleProducts[1], 1);
      cart.setDiscount(0.1);
    });
    
    it('应该清空所有商品和重置状态', () => {
      cart.clear();
      
      expect(cart.isEmpty()).toBe(true);
      expect(cart.getItemCount()).toBe(0);
      expect(cart.getTotal()).toBe(0);
      expect(cart.items).toHaveLength(0);
    });
  });
});
```

### 异步函数测试

```javascript
// async-user-service.js
const axios = require('axios');

class AsyncUserService {
  constructor(baseURL = 'https://api.example.com') {
    this.baseURL = baseURL;
    this.cache = new Map();
    this.requestQueue = [];
  }
  
  async getUser(id) {
    // 缓存检查
    if (this.cache.has(id)) {
      return this.cache.get(id);
    }
    
    try {
      const response = await axios.get(`${this.baseURL}/users/${id}`);
      const user = response.data;
      
      // 缓存结果
      this.cache.set(id, user);
      
      return user;
    } catch (error) {
      if (error.response?.status === 404) {
        throw new Error(`User ${id} not found`);
      }
      throw new Error('Failed to fetch user');
    }
  }
  
  async createUser(userData) {
    return new Promise((resolve, reject) => {
      const request = {
        id: Date.now(),
        userData,
        resolve,
        reject
      };
      
      this.requestQueue.push(request);
      this.processQueue();
    });
  }
  
  async processQueue() {
    if (this.requestQueue.length === 0) return;
    
    const request = this.requestQueue.shift();
    
    try {
      // 模拟异步处理
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const response = await axios.post(`${this.baseURL}/users`, request.userData);
      request.resolve(response.data);
    } catch (error) {
      request.reject(error);
    }
    
    // 继续处理队列
    if (this.requestQueue.length > 0) {
      setImmediate(() => this.processQueue());
    }
  }
  
  async batchGetUsers(ids) {
    const promises = ids.map(id => this.getUser(id));
    const results = await Promise.allSettled(promises);
    
    return results.map((result, index) => ({
      id: ids[index],
      success: result.status === 'fulfilled',
      data: result.status === 'fulfilled' ? result.value : null,
      error: result.status === 'rejected' ? result.reason.message : null
    }));
  }
  
  clearCache() {
    this.cache.clear();
  }
}

module.exports = AsyncUserService;
```

```javascript
// async-user-service.test.js
const axios = require('axios');
const AsyncUserService = require('./async-user-service');

jest.mock('axios');
const mockedAxios = axios;

describe('AsyncUserService', () => {
  let userService;
  
  beforeEach(() => {
    userService = new AsyncUserService();
    jest.clearAllMocks();
  });
  
  describe('getUser', () => {
    const sampleUser = { id: '1', name: 'John Doe', email: 'john@example.com' };
    
    it('应该成功获取用户数据', async () => {
      mockedAxios.get.mockResolvedValue({ data: sampleUser });
      
      const result = await userService.getUser('1');
      
      expect(result).toEqual(sampleUser);
      expect(mockedAxios.get).toHaveBeenCalledWith('https://api.example.com/users/1');
    });
    
    it('应该缓存用户数据', async () => {
      mockedAxios.get.mockResolvedValue({ data: sampleUser });
      
      // 第一次调用
      const result1 = await userService.getUser('1');
      // 第二次调用
      const result2 = await userService.getUser('1');
      
      expect(result1).toEqual(sampleUser);
      expect(result2).toEqual(sampleUser);
      expect(mockedAxios.get).toHaveBeenCalledTimes(1); // 只调用一次API
    });
    
    it('应该处理用户不存在的情况', async () => {
      mockedAxios.get.mockRejectedValue({
        response: { status: 404 }
      });
      
      await expect(userService.getUser('999'))
        .rejects
        .toThrow('User 999 not found');
    });
    
    it('应该处理网络错误', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Network error'));
      
      await expect(userService.getUser('1'))
        .rejects
        .toThrow('Failed to fetch user');
    });
  });
  
  describe('createUser', () => {
    const userData = { name: 'Jane Doe', email: 'jane@example.com' };
    const createdUser = { id: '2', ...userData };
    
    it('应该成功创建用户', async () => {
      mockedAxios.post.mockResolvedValue({ data: createdUser });
      
      const result = await userService.createUser(userData);
      
      expect(result).toEqual(createdUser);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://api.example.com/users',
        userData
      );
    });
    
    it('应该按顺序处理多个创建请求', async () => {
      const users = [
        { name: 'User 1', email: 'user1@example.com' },
        { name: 'User 2', email: 'user2@example.com' },
        { name: 'User 3', email: 'user3@example.com' }
      ];
      
      const responses = users.map((user, index) => ({
        data: { id: String(index + 1), ...user }
      }));
      
      mockedAxios.post
        .mockResolvedValueOnce(responses[0])
        .mockResolvedValueOnce(responses[1])
        .mockResolvedValueOnce(responses[2]);
      
      const promises = users.map(user => userService.createUser(user));
      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(3);
      expect(mockedAxios.post).toHaveBeenCalledTimes(3);
    });
  });
  
  describe('batchGetUsers', () => {
    it('应该批量获取用户数据', async () => {
      const users = [
        { id: '1', name: 'User 1' },
        { id: '2', name: 'User 2' },
        { id: '3', name: 'User 3' }
      ];
      
      mockedAxios.get
        .mockResolvedValueOnce({ data: users[0] })
        .mockResolvedValueOnce({ data: users[1] })
        .mockResolvedValueOnce({ data: users[2] });
      
      const results = await userService.batchGetUsers(['1', '2', '3']);
      
      expect(results).toEqual([
        { id: '1', success: true, data: users[0], error: null },
        { id: '2', success: true, data: users[1], error: null },
        { id: '3', success: true, data: users[2], error: null }
      ]);
    });
    
    it('应该处理部分失败的情况', async () => {
      const user1 = { id: '1', name: 'User 1' };
      
      mockedAxios.get
        .mockResolvedValueOnce({ data: user1 })
        .mockRejectedValueOnce({ response: { status: 404 } })
        .mockRejectedValueOnce(new Error('Network error'));
      
      const results = await userService.batchGetUsers(['1', '999', '3']);
      
      expect(results).toEqual([
        { id: '1', success: true, data: user1, error: null },
        { id: '999', success: false, data: null, error: 'User 999 not found' },
        { id: '3', success: false, data: null, error: 'Failed to fetch user' }
      ]);
    });
  });
  
  describe('缓存管理', () => {
    it('应该能够清空缓存', async () => {
      const user = { id: '1', name: 'John Doe' };
      mockedAxios.get.mockResolvedValue({ data: user });
      
      // 第一次调用，数据被缓存
      await userService.getUser('1');
      expect(mockedAxios.get).toHaveBeenCalledTimes(1);
      
      // 清空缓存
      userService.clearCache();
      
      // 再次调用，应该重新请求API
      await userService.getUser('1');
      expect(mockedAxios.get).toHaveBeenCalledTimes(2);
    });
  });
});
```

## 🎯 边界条件和异常测试

### 边界值分析

```javascript
// validation-service.js
class ValidationService {
  static validateAge(age) {
    if (typeof age !== 'number') {
      throw new Error('Age must be a number');
    }
    
    if (age < 0) {
      throw new Error('Age cannot be negative');
    }
    
    if (age > 150) {
      throw new Error('Age cannot exceed 150');
    }
    
    return age >= 18;
  }
  
  static validateEmail(email) {
    if (typeof email !== 'string') {
      throw new Error('Email must be a string');
    }
    
    if (email.length === 0) {
      throw new Error('Email cannot be empty');
    }
    
    if (email.length > 254) {
      throw new Error('Email too long');
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
  
  static validatePassword(password) {
    if (typeof password !== 'string') {
      throw new Error('Password must be a string');
    }
    
    const errors = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    
    if (password.length > 128) {
      errors.push('Password cannot exceed 128 characters');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    if (!/[!@#$%^&*]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

module.exports = ValidationService;
```

```javascript
// validation-service.test.js
const ValidationService = require('./validation-service');

describe('ValidationService', () => {
  describe('validateAge', () => {
    // 正常范围测试
    describe('有效年龄', () => {
      it('应该验证成年人年龄', () => {
        expect(ValidationService.validateAge(18)).toBe(true);
        expect(ValidationService.validateAge(25)).toBe(true);
        expect(ValidationService.validateAge(65)).toBe(true);
      });
      
      it('应该验证未成年人年龄', () => {
        expect(ValidationService.validateAge(17)).toBe(false);
        expect(ValidationService.validateAge(10)).toBe(false);
        expect(ValidationService.validateAge(0)).toBe(false);
      });
    });
    
    // 边界值测试
    describe('边界值', () => {
      it('应该正确处理边界年龄', () => {
        expect(ValidationService.validateAge(0)).toBe(false);    // 最小值
        expect(ValidationService.validateAge(17)).toBe(false);   // 成年边界-1
        expect(ValidationService.validateAge(18)).toBe(true);    // 成年边界
        expect(ValidationService.validateAge(150)).toBe(true);   // 最大值
      });
    });
    
    // 异常值测试
    describe('异常值', () => {
      it('应该拒绝负数年龄', () => {
        expect(() => ValidationService.validateAge(-1)).toThrow('Age cannot be negative');
        expect(() => ValidationService.validateAge(-100)).toThrow('Age cannot be negative');
      });
      
      it('应该拒绝过大年龄', () => {
        expect(() => ValidationService.validateAge(151)).toThrow('Age cannot exceed 150');
        expect(() => ValidationService.validateAge(1000)).toThrow('Age cannot exceed 150');
      });
      
      it('应该拒绝非数字类型', () => {
        expect(() => ValidationService.validateAge('18')).toThrow('Age must be a number');
        expect(() => ValidationService.validateAge(null)).toThrow('Age must be a number');
        expect(() => ValidationService.validateAge(undefined)).toThrow('Age must be a number');
        expect(() => ValidationService.validateAge({})).toThrow('Age must be a number');
      });
    });
  });
  
  describe('validateEmail', () => {
    describe('有效邮箱', () => {
      it('应该验证标准邮箱格式', () => {
        expect(ValidationService.validateEmail('test@example.com')).toBe(true);
        expect(ValidationService.validateEmail('user.name@domain.co.uk')).toBe(true);
        expect(ValidationService.validateEmail('user+tag@example.org')).toBe(true);
      });
    });
    
    describe('无效邮箱', () => {
      it('应该拒绝错误格式的邮箱', () => {
        expect(ValidationService.validateEmail('invalid-email')).toBe(false);
        expect(ValidationService.validateEmail('@example.com')).toBe(false);
        expect(ValidationService.validateEmail('test@')).toBe(false);
        expect(ValidationService.validateEmail('test.example.com')).toBe(false);
      });
    });
    
    describe('边界值和异常', () => {
      it('应该处理空字符串', () => {
        expect(() => ValidationService.validateEmail('')).toThrow('Email cannot be empty');
      });
      
      it('应该处理过长邮箱', () => {
        const longEmail = 'a'.repeat(250) + '@example.com';
        expect(() => ValidationService.validateEmail(longEmail)).toThrow('Email too long');
      });
      
      it('应该拒绝非字符串类型', () => {
        expect(() => ValidationService.validateEmail(123)).toThrow('Email must be a string');
        expect(() => ValidationService.validateEmail(null)).toThrow('Email must be a string');
      });
    });
  });
  
  describe('validatePassword', () => {
    describe('有效密码', () => {
      it('应该验证符合所有要求的密码', () => {
        const result = ValidationService.validatePassword('SecurePass123!');
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });
    
    describe('无效密码', () => {
      it('应该检测过短密码', () => {
        const result = ValidationService.validatePassword('Short1!');
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Password must be at least 8 characters long');
      });
      
      it('应该检测缺少大写字母', () => {
        const result = ValidationService.validatePassword('lowercase123!');
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Password must contain at least one uppercase letter');
      });
      
      it('应该检测缺少小写字母', () => {
        const result = ValidationService.validatePassword('UPPERCASE123!');
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Password must contain at least one lowercase letter');
      });
      
      it('应该检测缺少数字', () => {
        const result = ValidationService.validatePassword('NoNumbers!');
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Password must contain at least one number');
      });
      
      it('应该检测缺少特殊字符', () => {
        const result = ValidationService.validatePassword('NoSpecialChar123');
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Password must contain at least one special character');
      });
      
      it('应该返回多个错误', () => {
        const result = ValidationService.validatePassword('bad');
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(1);
        expect(result.errors).toContain('Password must be at least 8 characters long');
        expect(result.errors).toContain('Password must contain at least one uppercase letter');
      });
    });
    
    describe('边界值', () => {
      it('应该处理最小长度密码', () => {
        const result = ValidationService.validatePassword('MinLen1!');
        expect(result.isValid).toBe(true);
      });
      
      it('应该处理最大长度密码', () => {
        const longPassword = 'A1!' + 'a'.repeat(125);
        const result = ValidationService.validatePassword(longPassword);
        expect(result.isValid).toBe(true);
      });
      
      it('应该拒绝超长密码', () => {
        const tooLongPassword = 'A1!' + 'a'.repeat(126);
        const result = ValidationService.validatePassword(tooLongPassword);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Password cannot exceed 128 characters');
      });
    });
  });
});
```

## 📊 测试数据管理

### 测试数据工厂

```javascript
// test-data-factory.js
const faker = require('faker');

class TestDataFactory {
  static seed(seed = 12345) {
    faker.seed(seed);
  }
  
  static createUser(overrides = {}) {
    return {
      id: faker.datatype.uuid(),
      name: faker.name.findName(),
      email: faker.internet.email().toLowerCase(),
      age: faker.datatype.number({ min: 18, max: 80 }),
      phone: faker.phone.phoneNumber(),
      address: {
        street: faker.address.streetAddress(),
        city: faker.address.city(),
        state: faker.address.state(),
        zipCode: faker.address.zipCode(),
        country: faker.address.country()
      },
      createdAt: faker.date.past(),
      isActive: faker.datatype.boolean(),
      ...overrides
    };
  }
  
  static createProduct(overrides = {}) {
    return {
      id: faker.datatype.uuid(),
      name: faker.commerce.productName(),
      description: faker.commerce.productDescription(),
      price: parseFloat(faker.commerce.price()),
      category: faker.commerce.department(),
      inStock: faker.datatype.number({ min: 0, max: 100 }),
      rating: faker.datatype.float({ min: 1, max: 5, precision: 0.1 }),
      createdAt: faker.date.past(),
      ...overrides
    };
  }
  
  static createOrder(overrides = {}) {
    const items = Array.from(
      { length: faker.datatype.number({ min: 1, max: 5 }) },
      () => ({
        product: this.createProduct(),
        quantity: faker.datatype.number({ min: 1, max: 3 }),
        price: parseFloat(faker.commerce.price())
      })
    );
    
    return {
      id: faker.datatype.uuid(),
      userId: faker.datatype.uuid(),
      items,
      total: items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
      status: faker.random.arrayElement(['pending', 'processing', 'shipped', 'delivered']),
      createdAt: faker.date.past(),
      ...overrides
    };
  }
  
  // 预定义的测试场景数据
  static scenarios = {
    validUser: () => ({
      name: 'John Doe',
      email: 'john@example.com',
      age: 30,
      phone: '+1234567890'
    }),
    
    minorUser: () => ({
      name: 'Jane Minor',
      email: 'jane@example.com',
      age: 16
    }),
    
    seniorUser: () => ({
      name: 'Bob Senior',
      email: 'bob@example.com',
      age: 75
    }),
    
    invalidEmailUser: () => ({
      name: 'Invalid User',
      email: 'invalid-email',
      age: 25
    }),
    
    expensiveProduct: () => ({
      name: 'Luxury Item',
      price: 999.99,
      category: 'Luxury'
    }),
    
    freeProduct: () => ({
      name: 'Free Sample',
      price: 0,
      category: 'Sample'
    }),
    
    outOfStockProduct: () => ({
      name: 'Out of Stock Item',
      price: 29.99,
      inStock: 0
    })
  };
  
  static createBatch(factory, count, overrides = {}) {
    return Array.from({ length: count }, () => factory(overrides));
  }
  
  static createUserBatch(count, overrides = {}) {
    return this.createBatch(this.createUser.bind(this), count, overrides);
  }
  
  static createProductBatch(count, overrides = {}) {
    return this.createBatch(this.createProduct.bind(this), count, overrides);
  }
}

module.exports = TestDataFactory;
```

### 测试数据使用示例

```javascript
// using-test-data.test.js
const TestDataFactory = require('./test-data-factory');
const UserService = require('./user-service');

describe('UserService with Test Data', () => {
  let userService;
  
  beforeEach(() => {
    userService = new UserService();
    // 设置确定性的随机种子，确保测试可重复
    TestDataFactory.seed();
  });
  
  describe('使用预定义场景', () => {
    it('应该处理有效用户', () => {
      const validUser = TestDataFactory.scenarios.validUser();
      
      const result = userService.validateUser(validUser);
      
      expect(result.isValid).toBe(true);
      expect(result.user.name).toBe('John Doe');
    });
    
    it('应该拒绝未成年用户', () => {
      const minorUser = TestDataFactory.scenarios.minorUser();
      
      const result = userService.validateUser(minorUser);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('User must be 18 or older');
    });
    
    it('应该拒绝无效邮箱', () => {
      const invalidUser = TestDataFactory.scenarios.invalidEmailUser();
      
      const result = userService.validateUser(invalidUser);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid email format');
    });
  });
  
  describe('使用动态生成数据', () => {
    it('应该处理随机生成的用户', () => {
      const randomUser = TestDataFactory.createUser({
        age: 25,
        email: 'test@example.com'
      });
      
      const result = userService.validateUser(randomUser);
      
      expect(result.isValid).toBe(true);
      expect(randomUser.age).toBe(25);
      expect(randomUser.email).toBe('test@example.com');
    });
    
    it('应该处理批量用户数据', () => {
      const users = TestDataFactory.createUserBatch(10, { isActive: true });
      
      const results = users.map(user => userService.validateUser(user));
      const validUsers = results.filter(r => r.isValid);
      
      expect(users).toHaveLength(10);
      expect(validUsers.length).toBeGreaterThan(0);
      users.forEach(user => {
        expect(user.isActive).toBe(true);
      });
    });
  });
  
  describe('边界值数据测试', () => {
    it('应该测试年龄边界值', () => {
      const boundaryAges = [17, 18, 150, 151];
      
      boundaryAges.forEach(age => {
        const user = TestDataFactory.createUser({ age });
        const result = userService.validateUser(user);
        
        if (age < 18 || age > 150) {
          expect(result.isValid).toBe(false);
        } else {
          expect(result.isValid).toBe(true);
        }
      });
    });
  });
  
  describe('参数化测试', () => {
    const testCases = [
      { email: 'valid@example.com', expected: true },
      { email: 'invalid-email', expected: false },
      { email: '', expected: false },
      { email: 'user@domain', expected: false },
      { email: '@domain.com', expected: false }
    ];
    
    test.each(testCases)('email $email should be $expected', ({ email, expected }) => {
      const user = TestDataFactory.createUser({ email });
      const result = userService.validateUser(user);
      
      expect(result.isValid).toBe(expected);
    });
  });
});
```

## 📝 测试用例最佳实践

### 测试命名约定

```javascript
// 好的测试命名
describe('UserService', () => {
  describe('createUser', () => {
    it('应该在提供有效数据时创建新用户', () => {});
    it('应该在邮箱已存在时抛出错误', () => {});
    it('应该在年龄小于18时拒绝创建', () => {});
  });
});

// 避免的测试命名
describe('UserService', () => {
  it('测试创建用户', () => {}); // 太模糊
  it('test1', () => {}); // 没有意义
  it('should work', () => {}); // 不具体
});
```

### 测试组织结构

```javascript
// 良好的测试组织
describe('购物车系统', () => {
  describe('添加商品功能', () => {
    describe('有效商品', () => {
      it('应该添加单个商品到空购物车', () => {});
      it('应该合并相同商品的数量', () => {});
      it('应该添加不同商品到购物车', () => {});
    });
    
    describe('无效商品', () => {
      it('应该拒绝null商品', () => {});
      it('应该拒绝没有ID的商品', () => {});
      it('应该拒绝负价格的商品', () => {});
    });
  });
  
  describe('移除商品功能', () => {
    beforeEach(() => {
      // 为移除测试设置初始状态
    });
    
    it('应该移除存在的商品', () => {});
    it('应该忽略不存在的商品', () => {});
  });
});
```

## 📝 总结

高质量的测试用例编写需要：

- **清晰的结构**：使用AAA模式组织测试
- **全面的覆盖**：正常流程、边界值、异常情况
- **良好的命名**：测试意图明确易懂
- **数据管理**：使用工厂模式管理测试数据
- **可维护性**：遵循FIRST原则，保持测试独立

通过系统化的测试用例编写，可以确保代码质量和功能正确性。

## 🔗 相关资源

- [Jest测试最佳实践](https://github.com/goldbergyoni/javascript-testing-best-practices)
- [测试用例设计技术](https://www.guru99.com/test-case-design-techniques.html)
- [边界值分析](https://www.softwaretestinghelp.com/boundary-value-analysis-testing/)
- [等价类划分](https://www.tutorialspoint.com/software_testing/software_testing_equivalence_partitioning.htm)
