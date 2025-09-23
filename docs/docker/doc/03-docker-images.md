# Docker镜像操作

## 🎯 学习目标

- 掌握Docker镜像的查找、拉取和管理
- 学会构建自定义Docker镜像
- 理解Dockerfile的编写和最佳实践
- 掌握镜像的版本管理和分发

## 📚 镜像基础操作

### 1. 镜像查找和拉取

```bash
# 搜索镜像
docker search nginx
docker search --limit 10 node
docker search --filter stars=100 python

# 拉取镜像
docker pull nginx                    # 默认拉取latest标签
docker pull nginx:1.21-alpine       # 拉取指定版本
docker pull nginx:latest nginx:stable  # 同时拉取多个版本

# 查看拉取进度
docker pull --progress plain ubuntu:20.04

# 从私有仓库拉取
docker pull myregistry.com/myapp:v1.0
```

### 2. 镜像管理操作

```bash
# 列出本地镜像
docker images
docker images -a                     # 显示所有镜像（包括中间层）
docker images --no-trunc            # 显示完整镜像ID
docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"

# 查看镜像详细信息
docker inspect nginx:latest
docker inspect --format='{{.Config.ExposedPorts}}' nginx

# 查看镜像历史
docker history nginx:latest
docker history --no-trunc nginx:latest

# 镜像标签管理
docker tag nginx:latest myapp:v1.0
docker tag nginx:latest localhost:5000/nginx:v1.0

# 删除镜像
docker rmi nginx:latest
docker rmi -f nginx:latest          # 强制删除
docker rmi $(docker images -q)      # 删除所有镜像
```

### 3. 镜像清理和优化

```bash
# 清理悬空镜像
docker image prune

# 清理所有未使用的镜像
docker image prune -a

# 清理指定时间前的镜像
docker image prune --filter "until=24h"

# 查看镜像占用空间
docker system df
docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"
```

## 🏗️ 构建自定义镜像

### 1. Dockerfile基础

Dockerfile是用于构建镜像的文本文件，包含了一系列指令。

```dockerfile
# 基础镜像
FROM node:16-alpine

# 设置工作目录
WORKDIR /app

# 复制依赖文件
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production

# 复制应用代码
COPY . .

# 暴露端口
EXPOSE 3000

# 创建非root用户
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# 切换用户
USER nextjs

# 启动命令
CMD ["npm", "start"]
```

### 2. Dockerfile指令详解

```javascript
// Dockerfile指令说明
const dockerfileInstructions = {
  FROM: {
    purpose: '指定基础镜像',
    syntax: 'FROM <image>[:<tag>] [AS <name>]',
    examples: [
      'FROM ubuntu:20.04',
      'FROM node:16-alpine AS builder',
      'FROM scratch'  // 空镜像
    ]
  },

  WORKDIR: {
    purpose: '设置工作目录',
    syntax: 'WORKDIR /path/to/workdir',
    note: '目录不存在会自动创建'
  },

  COPY: {
    purpose: '复制文件到镜像',
    syntax: 'COPY [--chown=<user>:<group>] <src>... <dest>',
    examples: [
      'COPY package.json .',
      'COPY --chown=node:node . /app'
    ]
  },

  ADD: {
    purpose: '复制文件（支持URL和解压）',
    syntax: 'ADD [--chown=<user>:<group>] <src>... <dest>',
    note: '推荐使用COPY，除非需要解压功能'
  },

  RUN: {
    purpose: '执行命令',
    forms: {
      shell: 'RUN <command>',
      exec: 'RUN ["executable", "param1", "param2"]'
    },
    examples: [
      'RUN apt-get update && apt-get install -y curl',
      'RUN ["npm", "install"]'
    ]
  },

  CMD: {
    purpose: '指定容器启动命令',
    syntax: 'CMD ["executable","param1","param2"]',
    note: 'Dockerfile中只能有一个CMD指令'
  },

  ENTRYPOINT: {
    purpose: '配置容器启动程序',
    syntax: 'ENTRYPOINT ["executable", "param1", "param2"]',
    note: '与CMD配合使用，ENTRYPOINT不会被覆盖'
  },

  ENV: {
    purpose: '设置环境变量',
    syntax: 'ENV <key>=<value>',
    examples: [
      'ENV NODE_ENV=production',
      'ENV PATH="/app/bin:$PATH"'
    ]
  },

  ARG: {
    purpose: '定义构建参数',
    syntax: 'ARG <name>[=<default value>]',
    note: '只在构建时使用，运行时不可见'
  },

  EXPOSE: {
    purpose: '声明端口',
    syntax: 'EXPOSE <port> [<port>/<protocol>...]',
    note: '仅用于文档，不会自动发布端口'
  },

  VOLUME: {
    purpose: '创建挂载点',
    syntax: 'VOLUME ["/data"]',
    note: '创建匿名卷挂载点'
  },

  USER: {
    purpose: '指定运行用户',
    syntax: 'USER <user>[:<group>]',
    examples: ['USER node', 'USER 1001:1001']
  },

  HEALTHCHECK: {
    purpose: '健康检查',
    syntax: 'HEALTHCHECK [OPTIONS] CMD command',
    example: 'HEALTHCHECK --interval=30s CMD curl -f http://localhost/ || exit 1'
  }
};

console.log('Dockerfile指令详解:', dockerfileInstructions);
```

### 3. 构建镜像

```bash
# 基本构建
docker build -t myapp:v1.0 .

# 指定Dockerfile
docker build -f Dockerfile.prod -t myapp:prod .

# 使用构建参数
docker build --build-arg NODE_ENV=production -t myapp:prod .

# 不使用缓存构建
docker build --no-cache -t myapp:v1.0 .

# 设置构建上下文
docker build -t myapp:v1.0 https://github.com/user/repo.git

# 多平台构建
docker buildx build --platform linux/amd64,linux/arm64 -t myapp:v1.0 .
```

## 🛠️ 实际构建示例

### 1. Node.js应用镜像

```dockerfile
# Dockerfile for Node.js App
FROM node:16-alpine AS builder

# 设置工作目录
WORKDIR /app

# 复制package文件
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production && npm cache clean --force

# 生产阶段
FROM node:16-alpine AS production

# 安装dumb-init
RUN apk add --no-cache dumb-init

# 创建应用用户
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# 设置工作目录
WORKDIR /app

# 从builder阶段复制依赖
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules

# 复制应用代码
COPY --chown=nextjs:nodejs . .

# 切换到非root用户
USER nextjs

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# 启动应用
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]
```

### 2. 静态网站镜像

```dockerfile
# Dockerfile for Static Website
FROM nginx:alpine

# 删除默认配置
RUN rm -rf /usr/share/nginx/html/*

# 复制静态文件
COPY dist/ /usr/share/nginx/html/

# 复制nginx配置
COPY nginx.conf /etc/nginx/nginx.conf

# 创建nginx用户
RUN addgroup -g 1001 -S nginx-group
RUN adduser -S nginx-user -u 1001 -G nginx-group

# 设置文件权限
RUN chown -R nginx-user:nginx-group /usr/share/nginx/html
RUN chown -R nginx-user:nginx-group /var/cache/nginx
RUN chown -R nginx-user:nginx-group /var/log/nginx

# 切换用户
USER nginx-user

# 暴露端口
EXPOSE 8080

# 启动nginx
CMD ["nginx", "-g", "daemon off;"]
```

### 3. Python应用镜像

```dockerfile
# Dockerfile for Python App
FROM python:3.9-slim AS base

# 设置环境变量
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# 依赖构建阶段
FROM base AS dependencies

# 安装Python依赖
COPY requirements.txt .
RUN pip install --user -r requirements.txt

# 生产阶段
FROM base AS production

# 创建应用用户
RUN useradd --create-home --shell /bin/bash app

# 设置工作目录
WORKDIR /home/app

# 从dependencies阶段复制依赖
COPY --from=dependencies --chown=app:app /root/.local /home/app/.local

# 复制应用代码
COPY --chown=app:app . .

# 切换用户
USER app

# 更新PATH
ENV PATH=/home/app/.local/bin:$PATH

# 暴露端口
EXPOSE 8000

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD python -c "import requests; requests.get('http://localhost:8000/health')"

# 启动应用
CMD ["python", "app.py"]
```

## 🔧 多阶段构建

多阶段构建可以显著减小镜像大小，提高安全性。

### 1. 基本多阶段构建

```dockerfile
# 构建阶段
FROM node:16 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# 生产阶段
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### 2. 复杂多阶段构建

```dockerfile
# 依赖安装阶段
FROM node:16-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# 构建阶段
FROM node:16-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# 运行时阶段
FROM node:16-alpine AS runner
WORKDIR /app

# 创建用户
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# 复制必要文件
COPY --from=deps --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --chown=nextjs:nodejs package.json ./

USER nextjs

EXPOSE 3000

CMD ["npm", "start"]
```

## 📦 镜像优化技巧

### 1. 减小镜像大小

```dockerfile
# 使用Alpine Linux基础镜像
FROM node:16-alpine

# 合并RUN指令
RUN apk add --no-cache \
    curl \
    git \
    && npm install -g pm2 \
    && rm -rf /var/cache/apk/*

# 使用.dockerignore
# .dockerignore文件内容:
# node_modules
# npm-debug.log
# .git
# .gitignore
# README.md
# .env
# coverage
# .nyc_output
```

### 2. 优化层缓存

```dockerfile
# 先复制依赖文件（变化频率低）
COPY package*.json ./
RUN npm ci --only=production

# 后复制源代码（变化频率高）
COPY . .
```

### 3. 使用distroless镜像

```dockerfile
# 使用Google的distroless镜像
FROM gcr.io/distroless/nodejs:16

COPY package*.json ./
COPY node_modules ./node_modules
COPY dist ./dist

EXPOSE 3000
CMD ["dist/index.js"]
```

## 🏷️ 镜像标签管理

### 1. 标签策略

```bash
# 语义化版本标签
docker tag myapp:latest myapp:1.0.0
docker tag myapp:latest myapp:1.0
docker tag myapp:latest myapp:1

# 环境标签
docker tag myapp:latest myapp:dev
docker tag myapp:latest myapp:staging
docker tag myapp:latest myapp:prod

# Git标签
docker tag myapp:latest myapp:commit-abc123
docker tag myapp:latest myapp:branch-feature
```

### 2. 自动化标签脚本

```bash
#!/bin/bash
# build-and-tag.sh

set -e

IMAGE_NAME="myapp"
GIT_COMMIT=$(git rev-parse --short HEAD)
GIT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
VERSION=$(cat package.json | grep version | cut -d '"' -f 4)

# 构建镜像
docker build -t ${IMAGE_NAME}:${GIT_COMMIT} .

# 添加标签
docker tag ${IMAGE_NAME}:${GIT_COMMIT} ${IMAGE_NAME}:${VERSION}
docker tag ${IMAGE_NAME}:${GIT_COMMIT} ${IMAGE_NAME}:${GIT_BRANCH}

if [ "$GIT_BRANCH" = "main" ]; then
    docker tag ${IMAGE_NAME}:${GIT_COMMIT} ${IMAGE_NAME}:latest
fi

echo "Built and tagged image: ${IMAGE_NAME}:${GIT_COMMIT}"
```

## 🚀 镜像分发

### 1. 推送到Docker Hub

```bash
# 登录Docker Hub
docker login

# 推送镜像
docker push username/myapp:v1.0
docker push username/myapp:latest

# 推送所有标签
docker push --all-tags username/myapp
```

### 2. 私有仓库管理

```bash
# 登录私有仓库
docker login myregistry.com

# 标签私有仓库镜像
docker tag myapp:v1.0 myregistry.com/myapp:v1.0

# 推送到私有仓库
docker push myregistry.com/myapp:v1.0

# 从私有仓库拉取
docker pull myregistry.com/myapp:v1.0
```

### 3. 镜像签名和验证

```bash
# 启用Docker Content Trust
export DOCKER_CONTENT_TRUST=1

# 推送签名镜像
docker push username/myapp:v1.0

# 验证镜像签名
docker trust inspect --pretty username/myapp:v1.0
```

## 🔍 镜像安全扫描

### 1. 使用Docker Scout

```bash
# 扫描镜像漏洞
docker scout cves myapp:latest

# 查看镜像构成
docker scout sbom myapp:latest

# 比较镜像
docker scout compare myapp:v1.0 myapp:v2.0
```

### 2. 使用Trivy扫描

```bash
# 安装Trivy
curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b /usr/local/bin

# 扫描镜像
trivy image myapp:latest

# 扫描并生成报告
trivy image --format json --output report.json myapp:latest
```

## 📋 最佳实践

### 1. Dockerfile最佳实践

```dockerfile
# ✅ 好的做法
FROM node:16-alpine AS base

# 使用特定版本而不是latest
FROM node:16.14.2-alpine

# 创建非root用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# 设置工作目录
WORKDIR /app

# 先复制依赖文件，利用缓存
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# 复制源代码
COPY --chown=nextjs:nodejs . .

# 切换到非root用户
USER nextjs

# 使用ENTRYPOINT和CMD组合
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["npm", "start"]
```

### 2. 镜像安全最佳实践

```dockerfile
# 使用官方基础镜像
FROM node:16-alpine

# 及时更新基础镜像
RUN apk update && apk upgrade

# 删除不必要的包
RUN apk add --no-cache --virtual .build-deps \
    python3 \
    make \
    g++ \
    && npm install \
    && apk del .build-deps

# 不在镜像中存储敏感信息
# 使用ARG而不是ENV传递构建时密钥
ARG API_KEY
RUN echo "API_KEY=${API_KEY}" > /tmp/config && \
    # 使用API_KEY \
    rm /tmp/config

# 设置只读根文件系统
USER nobody
```

## 📝 下一步

现在您已经掌握了Docker镜像的操作，接下来学习：

1. **[Docker容器操作](./04-docker-containers.md)** - 深入学习容器的运行和管理
2. **[Dockerfile详解](./05-dockerfile.md)** - 高级Dockerfile编写技巧

## 🎯 本章要点

- ✅ 掌握镜像的查找、拉取和管理操作
- ✅ 学会编写高效的Dockerfile
- ✅ 理解多阶段构建的优势和用法
- ✅ 掌握镜像优化和安全最佳实践
- ✅ 了解镜像标签管理和分发流程

继续深入学习Docker容器操作！🐳
