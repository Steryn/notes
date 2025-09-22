# 微服务架构

## 🎯 学习目标

- 理解微服务架构的核心概念
- 掌握服务拆分策略
- 学会服务间通信
- 了解微服务治理

## 📚 核心概念

### 什么是微服务？

微服务是一种架构风格，它将单一应用程序开发为一组小型服务，每个服务运行在自己的进程中，并通过轻量级机制（通常是HTTP API）进行通信。

### 微服务的优势

- **技术多样性**：每个服务可以使用不同的技术栈
- **独立部署**：服务可以独立开发和部署
- **可扩展性**：可以独立扩展不同的服务
- **故障隔离**：一个服务的故障不会影响整个系统

### 微服务的挑战

- **分布式复杂性**：网络延迟、故障处理
- **数据一致性**：分布式事务管理
- **服务发现**：动态服务注册与发现
- **监控和调试**：跨服务的问题追踪

## 🛠️ 实践案例

### 1. 基础微服务架构

```javascript
// user-service.js - 用户服务
const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

class UserService {
  constructor(port = 3001) {
    this.app = express();
    this.port = port;
    this.users = new Map();
    this.setupMiddleware();
    this.setupRoutes();
  }

  setupMiddleware() {
    this.app.use(cors());
    this.app.use(express.json());
  }

  setupRoutes() {
    // 获取所有用户
    this.app.get('/users', (req, res) => {
      const users = Array.from(this.users.values());
      res.json({ success: true, data: users });
    });

    // 获取特定用户
    this.app.get('/users/:id', (req, res) => {
      const user = this.users.get(req.params.id);
      if (!user) {
        return res.status(404).json({ success: false, message: '用户不存在' });
      }
      res.json({ success: true, data: user });
    });

    // 创建用户
    this.app.post('/users', (req, res) => {
      const { name, email } = req.body;
      const user = {
        id: uuidv4(),
        name,
        email,
        createdAt: new Date().toISOString()
      };
      this.users.set(user.id, user);
      res.status(201).json({ success: true, data: user });
    });

    // 健康检查
    this.app.get('/health', (req, res) => {
      res.json({ 
        service: 'user-service',
        status: 'healthy',
        timestamp: new Date().toISOString()
      });
    });
  }

  start() {
    this.app.listen(this.port, () => {
      console.log(`👤 用户服务运行在端口 ${this.port}`);
    });
  }
}

module.exports = UserService;
```

## 📝 总结

在这一章中，我们学习了：

1. **微服务基础**：微服务的概念、优势和挑战
2. **服务拆分**：如何将单体应用拆分为微服务
3. **服务发现**：服务注册与发现的实现
4. **API网关**：统一入口和路由管理
5. **服务启动**：微服务集群的启动和管理

## 🔗 下一步

接下来我们将学习：

- [服务通信](./communication.md)
- [容器化部署](./containerization.md)
- [服务网格](./service-mesh.md)

继续学习，掌握微服务架构的核心技能！🚀
