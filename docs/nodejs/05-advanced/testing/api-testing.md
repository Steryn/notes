# API测试

## 📋 概述

API测试是验证应用程序编程接口（API）功能、可靠性、性能和安全性的测试实践。在Node.js应用中，API测试确保HTTP端点正确处理请求和响应，是确保服务质量的重要环节。

## 🎯 学习目标

- 理解API测试的核心概念和重要性
- 掌握使用Supertest进行HTTP API测试
- 学会测试RESTful API的各种场景
- 了解API测试的最佳实践和常见模式

## 🛠 API测试工具链

### 核心工具对比

```javascript
const APITestingTools = {
  SUPERTEST: {
    description: 'Node.js HTTP断言库',
    pros: ['与Jest集成好', '语法简洁', '支持Express应用'],
    cons: ['仅支持Node.js', '功能相对基础'],
    useCase: '单元和集成测试'
  },
  
  NEWMAN: {
    description: 'Postman集合的命令行运行器',
    pros: ['GUI工具支持', '丰富的测试脚本', '团队协作'],
    cons: ['学习成本高', '配置复杂'],
    useCase: 'API文档测试'
  },
  
  AXIOS: {
    description: 'HTTP客户端库',
    pros: ['灵活性高', 'Promise支持', '拦截器功能'],
    cons: ['需要更多样板代码', '断言需额外配置'],
    useCase: '自定义测试场景'
  },
  
  PACTJS: {
    description: '契约测试框架',
    pros: ['消费者驱动契约', '服务间测试'],
    cons: ['概念复杂', '设置繁琐'],
    useCase: '微服务API契约'
  }
};
```

### 环境搭建

```bash
# 安装基础测试依赖
npm install --save-dev supertest jest
npm install --save-dev nock  # HTTP请求模拟
npm install --save-dev faker # 测试数据生成

# 安装类型定义
npm install --save-dev @types/supertest
npm install --save-dev @types/jest
```

## 🚀 Supertest基础

### 基本API测试

```javascript
// app.js - 简单的Express应用
const express = require('express');
const app = express();

app.use(express.json());

// 内存存储（实际应用中使用数据库）
let users = [
  { id: 1, name: 'John Doe', email: 'john@example.com' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
];
let nextId = 3;

// 路由定义
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.get('/api/users', (req, res) => {
  res.json(users);
});

app.get('/api/users/:id', (req, res) => {
  const user = users.find(u => u.id === parseInt(req.params.id));
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json(user);
});

app.post('/api/users', (req, res) => {
  const { name, email } = req.body;
  
  // 验证
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }
  
  // 检查邮箱重复
  if (users.some(u => u.email === email)) {
    return res.status(409).json({ error: 'Email already exists' });
  }
  
  const user = { id: nextId++, name, email };
  users.push(user);
  
  res.status(201).json(user);
});

app.put('/api/users/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const userIndex = users.findIndex(u => u.id === id);
  
  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  const { name, email } = req.body;
  users[userIndex] = { ...users[userIndex], name, email };
  
  res.json(users[userIndex]);
});

app.delete('/api/users/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const userIndex = users.findIndex(u => u.id === id);
  
  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  users.splice(userIndex, 1);
  res.status(204).send();
});

module.exports = app;
```

### 基础API测试用例

```javascript
// tests/api/users.test.js
const request = require('supertest');
const app = require('../../app');

describe('Users API', () => {
  // 每个测试前重置数据
  beforeEach(() => {
    // 重置用户数据（实际项目中重置数据库）
    const users = require('../../app').users;
    users.length = 0;
    users.push(
      { id: 1, name: 'John Doe', email: 'john@example.com' },
      { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
    );
  });
  
  describe('GET /health', () => {
    it('应该返回健康状态', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);
      
      expect(response.body).toEqual({
        status: 'OK',
        timestamp: expect.any(String)
      });
    });
  });
  
  describe('GET /api/users', () => {
    it('应该返回所有用户列表', async () => {
      const response = await request(app)
        .get('/api/users')
        .expect(200);
      
      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toEqual({
        id: 1,
        name: 'John Doe',
        email: 'john@example.com'
      });
    });
    
    it('应该设置正确的响应头', async () => {
      await request(app)
        .get('/api/users')
        .expect('Content-Type', /json/)
        .expect(200);
    });
  });
  
  describe('GET /api/users/:id', () => {
    it('应该返回指定用户', async () => {
      const response = await request(app)
        .get('/api/users/1')
        .expect(200);
      
      expect(response.body).toEqual({
        id: 1,
        name: 'John Doe',
        email: 'john@example.com'
      });
    });
    
    it('应该在用户不存在时返回404', async () => {
      const response = await request(app)
        .get('/api/users/999')
        .expect(404);
      
      expect(response.body).toEqual({
        error: 'User not found'
      });
    });
    
    it('应该处理无效的ID格式', async () => {
      await request(app)
        .get('/api/users/invalid')
        .expect(404);
    });
  });
  
  describe('POST /api/users', () => {
    it('应该创建新用户', async () => {
      const newUser = {
        name: 'Alice Johnson',
        email: 'alice@example.com'
      };
      
      const response = await request(app)
        .post('/api/users')
        .send(newUser)
        .expect(201);
      
      expect(response.body).toEqual({
        id: expect.any(Number),
        name: newUser.name,
        email: newUser.email
      });
      
      // 验证用户确实被创建
      await request(app)
        .get(`/api/users/${response.body.id}`)
        .expect(200);
    });
    
    it('应该验证必需字段', async () => {
      const invalidUser = { name: 'Test User' }; // 缺少email
      
      const response = await request(app)
        .post('/api/users')
        .send(invalidUser)
        .expect(400);
      
      expect(response.body).toEqual({
        error: 'Name and email are required'
      });
    });
    
    it('应该拒绝重复邮箱', async () => {
      const duplicateUser = {
        name: 'Another John',
        email: 'john@example.com' // 已存在的邮箱
      };
      
      const response = await request(app)
        .post('/api/users')
        .send(duplicateUser)
        .expect(409);
      
      expect(response.body).toEqual({
        error: 'Email already exists'
      });
    });
    
    it('应该处理空的请求体', async () => {
      await request(app)
        .post('/api/users')
        .send({})
        .expect(400);
    });
  });
  
  describe('PUT /api/users/:id', () => {
    it('应该更新现有用户', async () => {
      const updateData = {
        name: 'John Updated',
        email: 'john.updated@example.com'
      };
      
      const response = await request(app)
        .put('/api/users/1')
        .send(updateData)
        .expect(200);
      
      expect(response.body).toEqual({
        id: 1,
        name: updateData.name,
        email: updateData.email
      });
    });
    
    it('应该在用户不存在时返回404', async () => {
      const updateData = {
        name: 'Test User',
        email: 'test@example.com'
      };
      
      await request(app)
        .put('/api/users/999')
        .send(updateData)
        .expect(404);
    });
  });
  
  describe('DELETE /api/users/:id', () => {
    it('应该删除现有用户', async () => {
      await request(app)
        .delete('/api/users/1')
        .expect(204);
      
      // 验证用户已被删除
      await request(app)
        .get('/api/users/1')
        .expect(404);
    });
    
    it('应该在用户不存在时返回404', async () => {
      await request(app)
        .delete('/api/users/999')
        .expect(404);
    });
  });
});
```

## 🔐 认证和授权测试

### JWT认证API测试

```javascript
// auth-api.test.js
const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../app');

describe('Authentication API', () => {
  const JWT_SECRET = 'test-secret';
  let authToken;
  
  beforeEach(() => {
    // 生成测试用的JWT令牌
    authToken = jwt.sign(
      { userId: 1, email: 'test@example.com' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
  });
  
  describe('POST /api/auth/login', () => {
    it('应该成功登录并返回令牌', async () => {
      const credentials = {
        email: 'john@example.com',
        password: 'password123'
      };
      
      const response = await request(app)
        .post('/api/auth/login')
        .send(credentials)
        .expect(200);
      
      expect(response.body).toEqual({
        token: expect.any(String),
        user: {
          id: expect.any(Number),
          email: credentials.email,
          name: expect.any(String)
        }
      });
      
      // 验证JWT令牌格式
      expect(response.body.token).toMatch(/^[A-Za-z0-9-_]+\\.[A-Za-z0-9-_]+\\.[A-Za-z0-9-_]+$/);
    });
    
    it('应该拒绝无效凭据', async () => {
      const invalidCredentials = {
        email: 'john@example.com',
        password: 'wrongpassword'
      };
      
      const response = await request(app)
        .post('/api/auth/login')
        .send(invalidCredentials)
        .expect(401);
      
      expect(response.body).toEqual({
        error: 'Invalid credentials'
      });
    });
    
    it('应该验证邮箱格式', async () => {
      const invalidEmail = {
        email: 'invalid-email',
        password: 'password123'
      };
      
      await request(app)
        .post('/api/auth/login')
        .send(invalidEmail)
        .expect(400);
    });
  });
  
  describe('Protected Routes', () => {
    it('应该允许有效令牌访问', async () => {
      const response = await request(app)
        .get('/api/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(response.body).toEqual({
        userId: 1,
        email: 'test@example.com'
      });
    });
    
    it('应该拒绝无令牌的请求', async () => {
      await request(app)
        .get('/api/profile')
        .expect(401);
    });
    
    it('应该拒绝无效令牌', async () => {
      await request(app)
        .get('/api/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
    
    it('应该拒绝过期令牌', async () => {
      const expiredToken = jwt.sign(
        { userId: 1, email: 'test@example.com' },
        JWT_SECRET,
        { expiresIn: '-1h' } // 已过期
      );
      
      await request(app)
        .get('/api/profile')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);
    });
  });
  
  describe('Role-based Access', () => {
    it('应该允许管理员访问管理接口', async () => {
      const adminToken = jwt.sign(
        { userId: 1, email: 'admin@example.com', role: 'admin' },
        JWT_SECRET,
        { expiresIn: '1h' }
      );
      
      await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });
    
    it('应该拒绝普通用户访问管理接口', async () => {
      const userToken = jwt.sign(
        { userId: 2, email: 'user@example.com', role: 'user' },
        JWT_SECRET,
        { expiresIn: '1h' }
      );
      
      await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });
  });
});
```

## 📊 API响应测试

### 响应格式和内容验证

```javascript
// response-validation.test.js
const request = require('supertest');
const app = require('../../app');

describe('API Response Validation', () => {
  describe('Response Structure', () => {
    it('应该返回正确的JSON结构', async () => {
      const response = await request(app)
        .get('/api/users')
        .expect(200);
      
      // 验证响应结构
      expect(response.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(Number),
            name: expect.any(String),
            email: expect.any(String)
          })
        ])
      );
    });
    
    it('应该返回分页信息', async () => {
      const response = await request(app)
        .get('/api/users?page=1&limit=10')
        .expect(200);
      
      expect(response.body).toEqual({
        data: expect.any(Array),
        pagination: {
          page: 1,
          limit: 10,
          total: expect.any(Number),
          totalPages: expect.any(Number)
        }
      });
    });
  });
  
  describe('Error Response Format', () => {
    it('应该返回标准错误格式', async () => {
      const response = await request(app)
        .get('/api/users/999')
        .expect(404);
      
      expect(response.body).toEqual({
        error: expect.any(String),
        code: 'USER_NOT_FOUND',
        timestamp: expect.any(String),
        path: '/api/users/999'
      });
    });
    
    it('应该返回验证错误详情', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({ name: '', email: 'invalid-email' })
        .expect(400);
      
      expect(response.body).toEqual({
        error: 'Validation failed',
        details: expect.arrayContaining([
          expect.objectContaining({
            field: 'name',
            message: expect.any(String)
          }),
          expect.objectContaining({
            field: 'email',
            message: expect.any(String)
          })
        ])
      });
    });
  });
  
  describe('Response Headers', () => {
    it('应该设置正确的Content-Type', async () => {
      await request(app)
        .get('/api/users')
        .expect('Content-Type', /application\\/json/)
        .expect(200);
    });
    
    it('应该设置CORS头', async () => {
      await request(app)
        .get('/api/users')
        .expect('Access-Control-Allow-Origin', '*')
        .expect(200);
    });
    
    it('应该设置缓存头', async () => {
      await request(app)
        .get('/api/users')
        .expect('Cache-Control', 'no-cache')
        .expect(200);
    });
  });
  
  describe('Response Time', () => {
    it('应该在合理时间内响应', async () => {
      const startTime = Date.now();
      
      await request(app)
        .get('/api/users')
        .expect(200);
      
      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(1000); // 1秒内
    });
  });
});
```

## 🧪 高级API测试场景

### 并发和竞态条件测试

```javascript
// concurrency.test.js
const request = require('supertest');
const app = require('../../app');

describe('Concurrency Testing', () => {
  it('应该处理并发创建用户', async () => {
    const userData = {
      name: 'Concurrent User',
      email: 'concurrent@example.com'
    };
    
    // 同时发送多个相同的创建请求
    const promises = Array(5).fill().map(() =>
      request(app)
        .post('/api/users')
        .send(userData)
    );
    
    const results = await Promise.allSettled(promises);
    
    // 只有一个应该成功，其他应该失败（邮箱重复）
    const successful = results.filter(r => 
      r.status === 'fulfilled' && r.value.status === 201
    );
    const failed = results.filter(r => 
      r.status === 'fulfilled' && r.value.status === 409
    );
    
    expect(successful).toHaveLength(1);
    expect(failed).toHaveLength(4);
  });
  
  it('应该处理并发更新同一用户', async () => {
    // 先创建用户
    const createResponse = await request(app)
      .post('/api/users')
      .send({ name: 'Test User', email: 'test@example.com' });
    
    const userId = createResponse.body.id;
    
    // 并发更新
    const updates = [
      { name: 'Update 1', email: 'update1@example.com' },
      { name: 'Update 2', email: 'update2@example.com' },
      { name: 'Update 3', email: 'update3@example.com' }
    ];
    
    const promises = updates.map(update =>
      request(app)
        .put(`/api/users/${userId}`)
        .send(update)
    );
    
    const results = await Promise.all(promises);
    
    // 所有更新应该成功（最后一个生效）
    results.forEach(result => {
      expect(result.status).toBe(200);
    });
  });
});
```

### 大数据量测试

```javascript
// load-testing.test.js
const request = require('supertest');
const app = require('../../app');

describe('Load Testing', () => {
  it('应该处理大量用户查询', async () => {
    // 创建大量用户
    const createPromises = Array(100).fill().map((_, index) =>
      request(app)
        .post('/api/users')
        .send({
          name: `User ${index}`,
          email: `user${index}@example.com`
        })
    );
    
    await Promise.all(createPromises);
    
    // 并发查询
    const queryPromises = Array(50).fill().map(() =>
      request(app)
        .get('/api/users')
        .expect(200)
    );
    
    const startTime = Date.now();
    const results = await Promise.all(queryPromises);
    const endTime = Date.now();
    
    // 验证所有请求都成功
    results.forEach(result => {
      expect(result.body).toHaveLength(100);
    });
    
    // 验证响应时间
    const avgResponseTime = (endTime - startTime) / 50;
    expect(avgResponseTime).toBeLessThan(100); // 平均100ms内
  });
  
  it('应该处理大请求体', async () => {
    const largeData = {
      name: 'A'.repeat(1000),
      email: 'large@example.com',
      description: 'B'.repeat(10000)
    };
    
    const response = await request(app)
      .post('/api/users')
      .send(largeData)
      .expect(201);
    
    expect(response.body.name).toBe(largeData.name);
  });
});
```

## 🔌 外部服务集成测试

### 使用Nock模拟外部API

```javascript
// external-api.test.js
const request = require('supertest');
const nock = require('nock');
const app = require('../../app');

describe('External API Integration', () => {
  beforeEach(() => {
    // 清理之前的模拟
    nock.cleanAll();
  });
  
  afterEach(() => {
    // 确保所有模拟都被使用
    expect(nock.isDone()).toBe(true);
  });
  
  it('应该调用外部邮件服务', async () => {
    // 模拟外部邮件API
    const emailAPI = nock('https://api.emailservice.com')
      .post('/send')
      .reply(200, { messageId: '123', status: 'sent' });
    
    const userData = {
      name: 'John Doe',
      email: 'john@example.com'
    };
    
    const response = await request(app)
      .post('/api/users')
      .send(userData)
      .expect(201);
    
    expect(response.body.emailSent).toBe(true);
    expect(emailAPI.isDone()).toBe(true);
  });
  
  it('应该处理外部服务错误', async () => {
    // 模拟外部服务错误
    nock('https://api.emailservice.com')
      .post('/send')
      .reply(500, { error: 'Service unavailable' });
    
    const userData = {
      name: 'Jane Doe',
      email: 'jane@example.com'
    };
    
    const response = await request(app)
      .post('/api/users')
      .send(userData)
      .expect(201); // 用户仍应创建成功
    
    expect(response.body.emailSent).toBe(false);
    expect(response.body.emailError).toBe('External service error');
  });
  
  it('应该处理外部服务超时', async () => {
    // 模拟超时
    nock('https://api.emailservice.com')
      .post('/send')
      .delay(5000) // 5秒延迟
      .reply(200, { messageId: '123' });
    
    const userData = {
      name: 'Timeout User',
      email: 'timeout@example.com'
    };
    
    const response = await request(app)
      .post('/api/users')
      .send(userData)
      .expect(201);
    
    expect(response.body.emailSent).toBe(false);
    expect(response.body.emailError).toBe('Request timeout');
  });
});
```

## 📝 API测试最佳实践

### 测试数据管理

```javascript
// test-data-factory.js
const faker = require('faker');

class TestDataFactory {
  static createUser(overrides = {}) {
    return {
      name: faker.name.findName(),
      email: faker.internet.email().toLowerCase(),
      password: faker.internet.password(8),
      age: faker.datatype.number({ min: 18, max: 80 }),
      ...overrides
    };
  }
  
  static createUsers(count, overrides = {}) {
    return Array(count).fill().map((_, index) => 
      this.createUser({
        email: `user${index}@test.com`,
        ...overrides
      })
    );
  }
  
  static createValidUser() {
    return this.createUser({
      name: 'Valid User',
      email: 'valid@example.com',
      password: 'ValidPassword123!'
    });
  }
  
  static createInvalidUser() {
    return {
      name: '',
      email: 'invalid-email',
      password: '123'
    };
  }
}

module.exports = TestDataFactory;
```

### 测试辅助工具

```javascript
// api-test-helpers.js
const request = require('supertest');

class APITestHelpers {
  constructor(app) {
    this.app = app;
  }
  
  // 登录并获取认证令牌
  async getAuthToken(credentials = { email: 'test@example.com', password: 'password' }) {
    const response = await request(this.app)
      .post('/api/auth/login')
      .send(credentials)
      .expect(200);
    
    return response.body.token;
  }
  
  // 创建认证请求
  authenticatedRequest(method, url, token) {
    return request(this.app)
      [method](url)
      .set('Authorization', `Bearer ${token}`);
  }
  
  // 批量创建用户
  async createUsers(count = 5) {
    const users = [];
    
    for (let i = 0; i < count; i++) {
      const userData = {
        name: `User ${i}`,
        email: `user${i}@example.com`
      };
      
      const response = await request(this.app)
        .post('/api/users')
        .send(userData)
        .expect(201);
      
      users.push(response.body);
    }
    
    return users;
  }
  
  // 清理测试数据
  async cleanup() {
    await request(this.app)
      .delete('/api/test/cleanup')
      .expect(200);
  }
  
  // 等待异步操作完成
  async waitForAsyncOperation(operationId, timeout = 5000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const response = await request(this.app)
        .get(`/api/operations/${operationId}`)
        .expect(200);
      
      if (response.body.status === 'completed') {
        return response.body;
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    throw new Error('Operation timeout');
  }
}

module.exports = APITestHelpers;
```

## 📝 总结

API测试是确保Node.js应用质量的关键实践：

- **功能验证**：确保API按预期工作
- **错误处理**：验证各种错误场景的处理
- **性能检查**：监控响应时间和并发处理
- **安全测试**：验证认证和授权机制
- **集成验证**：测试与外部服务的集成

通过系统化的API测试，可以确保服务的可靠性和稳定性。

## 🔗 相关资源

- [Supertest官方文档](https://github.com/visionmedia/supertest)
- [Nock模拟库](https://github.com/nock/nock)
- [API测试最佳实践](https://assertible.com/blog/7-http-api-testing-best-practices)
- [RESTful API测试指南](https://www.guru99.com/api-testing.html)
