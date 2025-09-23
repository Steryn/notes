# Docker基础

## 📋 概述

Docker是一个开源的容器化平台，允许开发者将应用程序及其依赖项打包到轻量级、可移植的容器中，实现"一次构建，到处运行"的目标。

## 🎯 学习目标

- 理解Docker的核心概念和架构
- 掌握Docker的基本命令和操作
- 学会编写Dockerfile
- 了解Docker网络和数据管理
- 掌握容器化Node.js应用的最佳实践

## 📚 核心概念

### 容器 vs 虚拟机

```
虚拟机架构:
┌─────────────────────────────────────┐
│           应用程序A  应用程序B        │
│           ─────────  ─────────       │
│           Guest OS   Guest OS        │
│           ─────────  ─────────       │
│              Hypervisor             │
│           ─────────────────────      │
│               Host OS               │
│           ─────────────────────      │
│              硬件层                  │
└─────────────────────────────────────┘

Docker架构:
┌─────────────────────────────────────┐
│        应用程序A    应用程序B         │
│        ────────    ────────         │
│        容器A        容器B            │
│        ────────────────────         │
│           Docker Engine             │
│        ────────────────────         │
│            Host OS                  │
│        ────────────────────         │
│             硬件层                   │
└─────────────────────────────────────┘
```

### Docker组件

#### 1. Docker Engine

```bash
# 查看Docker版本信息
docker version

# 查看系统信息
docker system info

# 查看Docker状态
docker system df
```

#### 2. 镜像（Images）

```bash
# 列出本地镜像
docker images

# 搜索镜像
docker search node

# 拉取镜像
docker pull node:18-alpine

# 删除镜像
docker rmi node:18-alpine

# 查看镜像历史
docker history node:18-alpine
```

#### 3. 容器（Containers）

```bash
# 运行容器
docker run -d --name my-app -p 3000:3000 node:18-alpine

# 列出运行中的容器
docker ps

# 列出所有容器
docker ps -a

# 停止容器
docker stop my-app

# 启动容器
docker start my-app

# 删除容器
docker rm my-app

# 查看容器日志
docker logs my-app

# 进入容器
docker exec -it my-app sh
```

## 🛠 Docker基本操作

### Node.js应用容器化示例

#### 1. 简单的Node.js应用

```javascript
// app.js
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.json({
    message: 'Hello from Docker!',
    timestamp: new Date().toISOString(),
    version: process.env.APP_VERSION || '1.0.0'
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', uptime: process.uptime() });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
});
```

```json
{
  "name": "docker-node-app",
  "version": "1.0.0",
  "main": "app.js",
  "scripts": {
    "start": "node app.js",
    "dev": "nodemon app.js"
  },
  "dependencies": {
    "express": "^4.18.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.0"
  }
}
```

#### 2. 基础Dockerfile

```dockerfile
# 使用官方Node.js运行时作为基础镜像
FROM node:18-alpine

# 设置工作目录
WORKDIR /usr/src/app

# 复制package.json和package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production

# 复制应用源代码
COPY . .

# 创建非root用户
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# 更改文件所有权
RUN chown -R nextjs:nodejs /usr/src/app
USER nextjs

# 暴露端口
EXPOSE 3000

# 定义环境变量
ENV NODE_ENV=production

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# 启动应用
CMD ["npm", "start"]
```

#### 3. 构建和运行

```bash
# 构建镜像
docker build -t my-node-app:1.0.0 .

# 运行容器
docker run -d \
  --name my-app \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e APP_VERSION=1.0.0 \
  my-node-app:1.0.0

# 测试应用
curl http://localhost:3000
curl http://localhost:3000/health
```

## 🔧 高级Dockerfile技巧

### 多阶段构建

```dockerfile
# 多阶段构建 - 开发阶段
FROM node:18-alpine AS development
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .
CMD ["npm", "run", "dev"]

# 构建阶段
FROM node:18-alpine AS builder
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force
COPY . .
RUN npm run build

# 生产阶段
FROM node:18-alpine AS production
WORKDIR /usr/src/app

# 安装dumb-init用于信号处理
RUN apk add --no-cache dumb-init

# 创建用户
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# 从构建阶段复制文件
COPY --from=builder --chown=nextjs:nodejs /usr/src/app/dist ./dist
COPY --from=builder --chown=nextjs:nodejs /usr/src/app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /usr/src/app/package.json ./package.json

USER nextjs

EXPOSE 3000

ENV NODE_ENV=production

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/app.js"]
```

### 优化镜像大小

```dockerfile
# .dockerignore
node_modules
npm-debug.log
.git
.gitignore
README.md
.env
coverage
.nyc_output
.vscode
.idea
*.md
tests
docs

# 优化的Dockerfile
FROM node:18-alpine AS base

# 安装必要的系统依赖
RUN apk add --no-cache \
    dumb-init \
    curl \
    && rm -rf /var/cache/apk/*

WORKDIR /usr/src/app

# 复制依赖文件
COPY package*.json ./

# 生产依赖安装
FROM base AS dependencies
RUN npm ci --only=production && npm cache clean --force

# 开发阶段
FROM base AS development
RUN npm install
COPY . .
CMD ["npm", "run", "dev"]

# 构建阶段
FROM dependencies AS build
RUN npm install --only=development
COPY . .
RUN npm run build && npm prune --production

# 最终生产镜像
FROM base AS production

# 创建非root用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# 复制构建产物
COPY --from=build --chown=nextjs:nodejs /usr/src/app/dist ./dist
COPY --from=build --chown=nextjs:nodejs /usr/src/app/node_modules ./node_modules
COPY --chown=nextjs:nodejs package.json ./

USER nextjs

EXPOSE 3000

ENV NODE_ENV=production \
    PORT=3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/app.js"]
```

## 🌐 Docker网络

### 网络类型

```bash
# 查看网络列表
docker network ls

# 创建自定义网络
docker network create --driver bridge my-network

# 查看网络详情
docker network inspect my-network

# 连接容器到网络
docker network connect my-network my-container

# 断开网络连接
docker network disconnect my-network my-container
```

### 容器间通信示例

```bash
# 创建网络
docker network create app-network

# 运行Redis容器
docker run -d \
  --name redis \
  --network app-network \
  redis:7-alpine

# 运行Node.js应用容器
docker run -d \
  --name app \
  --network app-network \
  -p 3000:3000 \
  -e REDIS_URL=redis://redis:6379 \
  my-node-app:1.0.0
```

```javascript
// 在Node.js应用中连接Redis
const redis = require('redis');
const client = redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

client.on('connect', () => {
  console.log('Connected to Redis');
});

client.connect();
```

## 💾 数据管理

### 数据卷（Volumes）

```bash
# 创建数据卷
docker volume create my-data

# 查看数据卷列表
docker volume ls

# 查看数据卷详情
docker volume inspect my-data

# 使用数据卷运行容器
docker run -d \
  --name app \
  -v my-data:/usr/src/app/data \
  my-node-app:1.0.0

# 删除数据卷
docker volume rm my-data
```

### 绑定挂载（Bind Mounts）

```bash
# 开发环境热重载
docker run -d \
  --name dev-app \
  -p 3000:3000 \
  -v $(pwd):/usr/src/app \
  -v /usr/src/app/node_modules \
  my-node-app:development

# 挂载配置文件
docker run -d \
  --name app \
  -p 3000:3000 \
  -v $(pwd)/config:/usr/src/app/config:ro \
  my-node-app:1.0.0
```

### tmpfs挂载

```bash
# 临时文件系统挂载
docker run -d \
  --name app \
  --tmpfs /tmp \
  --tmpfs /usr/src/app/temp:rw,size=100m \
  my-node-app:1.0.0
```

## 🔍 监控和调试

### 容器监控

```bash
# 查看容器资源使用情况
docker stats

# 查看特定容器的统计信息
docker stats my-app

# 查看容器进程
docker top my-app

# 检查容器配置
docker inspect my-app

# 查看容器文件系统变化
docker diff my-app
```

### 日志管理

```bash
# 查看容器日志
docker logs my-app

# 实时跟踪日志
docker logs -f my-app

# 查看最近的日志
docker logs --tail 50 my-app

# 查看特定时间段的日志
docker logs --since "2023-01-01T00:00:00" --until "2023-01-02T00:00:00" my-app
```

### 调试技巧

```bash
# 进入运行中的容器
docker exec -it my-app sh

# 在容器中运行命令
docker exec my-app ps aux
docker exec my-app ls -la /usr/src/app

# 复制文件到容器
docker cp local-file.txt my-app:/usr/src/app/

# 从容器复制文件
docker cp my-app:/usr/src/app/logs ./logs

# 查看容器端口映射
docker port my-app
```

## 🚀 最佳实践

### 1. Dockerfile最佳实践

```dockerfile
# 使用特定版本的基础镜像
FROM node:18.17.0-alpine3.18

# 合并RUN指令减少层数
RUN apk add --no-cache curl dumb-init \
    && addgroup -g 1001 -S nodejs \
    && adduser -S nextjs -u 1001

# 利用构建缓存
COPY package*.json ./
RUN npm ci --only=production

# 最后复制源代码
COPY . .

# 使用非root用户
USER nextjs

# 明确指定端口
EXPOSE 3000

# 使用ENTRYPOINT和CMD
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "app.js"]
```

### 2. 安全实践

```dockerfile
# 扫描基础镜像漏洞
FROM node:18-alpine

# 更新系统包
RUN apk update && apk upgrade

# 使用非root用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# 删除不必要的包
RUN apk del wget curl

# 设置只读根文件系统
# docker run --read-only --tmpfs /tmp my-app

# 限制容器能力
# docker run --cap-drop=ALL --cap-add=NET_BIND_SERVICE my-app
```

### 3. 性能优化

```dockerfile
# 使用多阶段构建
FROM node:18-alpine AS builder
# ... 构建步骤

FROM node:18-alpine AS runtime
# ... 运行时配置

# 优化层缓存
COPY package*.json ./
RUN npm ci --only=production

# 清理缓存
RUN npm cache clean --force && \
    rm -rf /tmp/* /var/tmp/*
```

### 4. 环境配置

```bash
# 使用环境变量
docker run -d \
  --name app \
  -e NODE_ENV=production \
  -e DATABASE_URL=postgres://user:pass@db:5432/mydb \
  -e REDIS_URL=redis://redis:6379 \
  my-node-app:1.0.0

# 使用环境变量文件
docker run -d \
  --name app \
  --env-file .env.production \
  my-node-app:1.0.0
```

## 📊 常用命令参考

### 镜像操作

```bash
# 构建镜像
docker build -t name:tag .
docker build --no-cache -t name:tag .

# 标记镜像
docker tag source:tag target:tag

# 推送镜像
docker push name:tag

# 保存和加载镜像
docker save -o image.tar name:tag
docker load -i image.tar
```

### 容器操作

```bash
# 运行容器
docker run -d --name container-name image:tag
docker run -it --rm image:tag sh

# 管理容器
docker start/stop/restart container-name
docker pause/unpause container-name
docker kill container-name

# 清理操作
docker container prune  # 删除停止的容器
docker image prune      # 删除悬空镜像
docker system prune     # 清理系统
```

## 📝 总结

Docker为Node.js应用提供了：

- 一致的运行环境
- 简化的部署流程
- 高效的资源利用
- 良好的隔离性和安全性

掌握Docker是现代Node.js开发的必备技能。

## 🔗 相关资源

- [Docker官方文档](https://docs.docker.com/)
- [Docker Hub](https://hub.docker.com/)
- [Node.js官方Docker镜像](https://hub.docker.com/_/node)
- [Docker最佳实践](https://docs.docker.com/develop/dev-best-practices/)
