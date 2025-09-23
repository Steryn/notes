# 文档目录结构总结

## 📁 重新整理后的目录结构

```

├── README.md                    # 主学习指南
├── 01-basics/                   # 第一阶段：基础概念
│   ├── README.md               # 基础概念总览
│   ├── modules.md              # 模块系统
│   ├── async.md                # 异步编程
│   ├── filesystem.md           # 文件系统
│   └── http.md                 # HTTP模块
├── 02-express/                  # 第二阶段：Express框架
│   └── README.md               # Express框架总览
├── 03-database/                 # 第三阶段：数据库操作
│   └── README.md               # 数据库操作总览
├── 04-auth/                     # 第四阶段：认证授权
│   └── README.md               # 认证授权总览
└── 05-advanced/                 # 第五阶段：高级主题
    ├── README.md               # 高级主题总览
    ├── performance.md            # 性能优化与监控
    ├── microservices.md          # 微服务架构
    ├── database.md               # 数据库高级应用
    ├── security.md               # 安全与认证
    ├── testing.md                # 测试与质量保证
    ├── devops.md                 # DevOps与CI/CD
    ├── advanced.md               # 高级Node.js特性
    ├── cloud.md                  # 云原生开发
    └── enterprise.md             # 企业级应用
```

## 🎯 学习路径

### 第一阶段：基础概念 (01-basics)

- [Node.js基础概念](./01-basics/README.md)
- [模块系统](./01-basics/modules.md)
- [异步编程](./01-basics/async.md)
- [文件系统操作](./01-basics/filesystem.md)
- [HTTP模块使用](./01-basics/http.md)

### 第二阶段：Express框架 (02-express)

- [Express基础](./02-express/README.md)
- [路由和中间件](./02-express/routing-middleware.md)
- [请求处理/响应处理](./02-express/requests-responses.md)
- [静态文件服务](./02-express/static-files.md)
- [错误处理](./02-express/error-handling.md)

### 第三阶段：数据库操作 (03-database)

- [数据库基础](./03-database/README.md)
- [数据库基础概念](./03-database/database-basics.md)
- [连接管理](./03-database/connection-management.md)
- [查询优化](./03-database/query-optimization.md)
- [事务处理](./03-database/transactions.md)
- [MongoDB基础](./03-database/mongodb-basics.md)
- [文档操作](./03-database/document-operations.md)
- [聚合查询](./03-database/aggregation.md)
- [索引优化](./03-database/indexing.md)
- [MySQL基础](./03-database/mysql-basics.md)
- [表设计](./03-database/table-design.md)
- [SQL查询](./03-database/sql-queries.md)
- [性能优化](./03-database/performance.md)
- [Mongoose使用](./03-database/mongoose.md)
- [Sequelize使用](./03-database/sequelize.md)
- [TypeORM使用](./03-database/typeorm.md)
- [数据验证](./03-database/validation.md)

### 第四阶段：认证授权 (04-auth)

- [认证基础](./04-auth/README.md)
- [认证概念](./04-auth/authentication-basics.md)
- [授权机制](./04-auth/authorization.md)
- [安全策略](./04-auth/security-policies.md)
- [权限控制](./04-auth/access-control.md)
- [JWT基础](./04-auth/jwt-basics.md)
- [令牌生成](./04-auth/jwt-token-generation.md)
- [令牌验证](./04-auth/jwt-token-validation.md)
- [令牌刷新](./04-auth/jwt-token-refresh.md)
- [密码加密](./04-auth/password-encryption.md)
- [哈希算法](./04-auth/hashing-algorithms.md)
- [盐值使用](./04-auth/salt-usage.md)
- [密码策略](./04-auth/password-policies.md)
- [会话基础](./04-auth/session-basics.md)
- [会话存储](./04-auth/session-storage.md)
- [会话安全](./04-auth/session-security.md)
- [会话过期](./04-auth/session-expiration.md)
- [API安全基础](./04-auth/api-security-basics.md)
- [输入验证](./04-auth/input-validation.md)
- [CORS配置](./04-auth/cors-configuration.md)
- [安全头设置](./04-auth/security-headers.md)

### 第五阶段：高级主题 (05-advanced)

- [高级主题总览](./05-advanced/advanced/README.md)
- [性能优化与监控](./05-advanced/performance/README.md)
- [微服务架构](./05-advanced/microservices/README.md)
- [数据库高级应用](./05-advanced/database/README.md)
- [安全与认证](./05-advanced/security/README.md)
- [测试与质量保证](./05-advanced/testing/README.md)
- [DevOps与CI/CD](./05-advanced/devops/README.md)
- [高级Node.js特性](./05-advanced/advanced/README.md)
- [云原生开发](./05-advanced/cloud/README.md)
- [企业级应用](./05-advanced/enterprise/README.md)

## 🛠️ 实践项目路径

### 基础实践项目

- [前端应用](./practise/frontend-app/) - Vue3 + Vite + TypeScript
- [后端API](./practise/backend-api/) - Node.js + Express + JWT
- [项目说明](./practise/README.md) - 完整项目介绍

### 高级主题实践

- [性能优化示例](./practise/advanced-examples/performance-optimization/) - 内存分析、CPU分析
- [微服务示例](./practise/advanced-examples/microservices/) - 服务拆分、服务发现
- [安全实践示例](./practise/advanced-examples/security-practices/) - 认证系统、数据加密
- [启动脚本](./practise/advanced-examples/start-all.js) - 一键启动所有示例

## 📚 文件命名规范

### 目录命名

- 使用数字前缀表示学习顺序
- 使用英文名称便于理解
- 使用连字符分隔单词

### 文件命名

- README.md：每个目录的主入口文件
- 具体主题.md：详细的学习内容
- 使用英文名称便于维护

## 🔗 链接关系

### 内部链接

- 使用相对路径链接
- 保持链接的一致性
- 便于文档维护

### 外部链接

- 链接到官方文档
- 链接到相关资源
- 保持链接的有效性

## 📝 维护建议

1. **保持结构一致**：新增内容时保持目录结构的一致性
2. **更新链接**：修改文件位置时及时更新相关链接
3. **版本控制**：使用Git管理文档版本
4. **定期检查**：定期检查链接的有效性

## 🚀 使用说明

### 快速导航

#### 开始学习

1. [主学习指南](./README.md) - 完整学习路径
2. [基础概念](./01-basics/README.md) - 从零开始
3. [实践项目](./practise/README.md) - 动手实践

#### 按阶段学习

- **新手入门**: [01-basics](./01-basics/) → [02-express](./02-express/)
- **进阶开发**: [03-database](./03-database/) → [04-auth](./04-auth/)
- **高级主题**: [05-advanced](./05-advanced/) - 选择感兴趣的方向

#### 实践项目

- **基础项目**: [前端应用](./practise/frontend-app/) + [后端API](./practise/backend-api/)
- **高级示例**: [性能优化](./practise/advanced-examples/performance-optimization/) + [微服务](./practise/advanced-examples/microservices/) + [安全实践](./practise/advanced-examples/security-practices/)

### 学习顺序

1. 按照数字前缀顺序学习
2. 每个阶段都有明确的学习目标
3. 理论与实践相结合
4. 使用快速导航快速定位内容

### 实践项目

- 每个阶段都有对应的实践项目
- 项目位于 `../practise/` 目录
- 包含基础项目和高级示例
- 支持一键启动所有示例

### 扩展学习

- 每个主题都可以进一步扩展
- 可以添加更多的实践案例
- 可以链接到外部资源
- 建议结合官方文档深入学习

---

现在您的文档结构已经整理完毕，可以开始系统性的Node.js学习之旅了！🚀
