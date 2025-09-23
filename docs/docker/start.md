# Docker学习计划项目

欢迎来到Docker学习计划项目！这是一个完整的Docker学习资源，从基础概念到高级应用，帮助您系统性地掌握Docker技术。

## 📚 项目结构

```
docker-practise/
├── README.md                    # 项目总览
├── doc/                         # 学习文档
│   ├── README.md               # 学习路径指南
│   ├── 01-docker-introduction.md    # Docker简介与安装
│   ├── 02-docker-basics.md          # Docker基本概念
│   ├── 03-docker-images.md          # Docker镜像操作
│   ├── 04-docker-containers.md      # Docker容器操作
│   ├── 05-dockerfile.md             # Dockerfile详解
│   ├── 06-docker-networking.md      # Docker网络
│   ├── 07-docker-volumes.md         # Docker数据卷
│   ├── 08-docker-compose.md         # Docker Compose
│   ├── 09-multi-stage-builds.md     # Docker多阶段构建
│   ├── 10-docker-security.md        # Docker安全最佳实践
│   ├── 11-production-deployment.md  # Docker生产环境部署
│   └── 12-monitoring-logging.md     # Docker监控与日志
└── practise/                    # 实践项目
    ├── README.md               # 实践项目说明
    ├── vue-app/               # Vue.js应用示例
    │   ├── src/               # Vue源代码
    │   ├── Dockerfile         # 生产环境Dockerfile
    │   ├── Dockerfile.dev     # 开发环境Dockerfile
    │   ├── docker-compose.yml # 生产环境编排
    │   ├── docker-compose.dev.yml # 开发环境编排
    │   ├── nginx.conf         # Nginx配置
    │   └── nginx-proxy.conf   # 反向代理配置
    └── examples/              # 各种Docker示例
        ├── basic/             # 基础示例
        │   └── hello-world/   # Hello World示例
        └── networking/        # 网络示例
            ├── docker-compose.yml
            └── html/
```

## 🎯 学习目标

完成这个学习计划后，您将能够：

- ✅ **理解Docker核心概念**：镜像、容器、仓库、网络、数据卷
- ✅ **掌握Docker基本操作**：构建、运行、管理容器和镜像
- ✅ **编写高效Dockerfile**：多阶段构建、最佳实践、安全配置
- ✅ **使用Docker Compose**：多容器编排、服务管理、环境配置
- ✅ **部署生产应用**：安全配置、监控日志、性能优化
- ✅ **解决实际问题**：故障排除、性能调优、安全加固

## 🚀 快速开始

### 1. 环境准备

确保您的系统已安装Docker：

```bash
# 检查Docker版本
docker --version
docker-compose --version

# 如果未安装，请参考 doc/01-docker-introduction.md
```

### 2. 学习路径

#### 基础篇（1-4章）

1. [Docker简介与安装](./01-docker-introduction.md)
2. [Docker基本概念](./02-docker-basics.md)
3. [Docker镜像操作](./03-docker-images.md)
4. [Docker容器操作](./04-docker-containers.md)

#### 中级篇（5-8章）

5. [Dockerfile详解](./05-dockerfile.md)
6. [Docker网络](./06-docker-networking.md)
7. [Docker数据卷](./07-docker-volumes.md)
8. [Docker Compose](./08-docker-compose.md)

#### 高级篇（9-12章）

9. [Docker多阶段构建](./09-multi-stage-builds.md)
10. [Docker安全最佳实践](./10-docker-security.md)
11. [Docker生产环境部署](./11-production-deployment.md)
12. [Docker监控与日志](./12-monitoring-logging.md)

### 3. 实践项目

#### Vue.js应用示例

```bash
# 进入Vue应用目录
cd practise/vue-app

# 开发环境
docker-compose -f docker-compose.dev.yml up -d

# 生产环境
docker-compose up -d

# 访问应用
# 开发环境: http://localhost:5173
# 生产环境: http://localhost:80
```

#### 基础示例

```bash
# Hello World示例
cd practise/examples/basic/hello-world
docker build -t hello-world .
docker run hello-world

# 网络示例
cd practise/examples/networking
docker-compose up -d
# 访问: http://localhost:8080
```

## 📖 学习建议

### 1. 循序渐进

- 按照文档顺序学习，每个概念都要理解透彻
- 每学完一章，都要在实践项目中尝试相关操作
- 遇到问题及时查阅文档或寻求帮助

### 2. 动手实践

- 不要只看文档，一定要动手操作
- 尝试修改配置，观察结果变化
- 记录学习过程中的重要发现和问题

### 3. 项目驱动

- 以Vue.js项目为主线，逐步应用所学知识
- 从简单的单容器部署到复杂的多容器编排
- 从开发环境到生产环境的完整流程

### 4. 持续学习

- 关注Docker官方更新和最佳实践
- 参与社区讨论，分享经验
- 探索更高级的容器编排技术

## 🛠️ 技术栈

### 核心技术

- **Docker**: 容器化平台
- **Docker Compose**: 多容器编排
- **Nginx**: 反向代理和负载均衡
- **Vue.js**: 前端框架
- **Node.js**: 后端运行时
- **PostgreSQL**: 关系型数据库
- **Redis**: 缓存数据库

### 开发工具

- **Vite**: 前端构建工具
- **TypeScript**: 类型安全的JavaScript
- **ESLint**: 代码质量检查
- **Prettier**: 代码格式化
- **Vitest**: 单元测试框架

### 监控工具

- **Prometheus**: 监控和告警
- **Grafana**: 数据可视化
- **ELK Stack**: 日志管理
- **Docker Stats**: 容器监控

## 📋 学习检查点

### 基础阶段

- [ ] 能够安装和配置Docker环境
- [ ] 理解镜像、容器、仓库的基本概念
- [ ] 熟练使用基本的Docker命令
- [ ] 能够构建和运行简单的容器

### 中级阶段

- [ ] 能够编写高效的Dockerfile
- [ ] 掌握Docker网络和数据卷的使用
- [ ] 熟练使用Docker Compose进行多容器编排
- [ ] 能够解决常见的Docker问题

### 高级阶段

- [ ] 掌握多阶段构建和镜像优化
- [ ] 了解Docker安全最佳实践
- [ ] 能够部署生产环境的Docker应用
- [ ] 掌握监控、日志和故障排除

## 🤝 贡献指南

欢迎为这个项目做出贡献！

### 如何贡献

1. Fork这个项目
2. 创建您的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交您的更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开一个Pull Request

### 贡献类型

- 📝 文档改进
- 🐛 Bug修复
- ✨ 新功能添加
- 🎨 代码优化
- 📚 示例项目

## 📞 获取帮助

如果您在学习过程中遇到问题：

1. **查阅文档**: 首先查看相关章节的详细说明
2. **检查示例**: 参考实践项目中的配置
3. **搜索问题**: 在GitHub Issues中搜索类似问题
4. **提交问题**: 如果找不到解决方案，请提交新的Issue
5. **社区讨论**: 参与Docker社区讨论

## 🙏 致谢

感谢所有为Docker生态做出贡献的开发者和社区成员！

---

**开始您的Docker学习之旅吧！** 🐳

记住：Docker不仅仅是一个工具，更是一种思维方式。通过容器化，我们可以构建更加可靠、可扩展、可维护的应用程序。

祝您学习愉快！🚀
