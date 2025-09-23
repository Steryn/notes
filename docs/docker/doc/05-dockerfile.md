# Dockerfile详解

## 🎯 学习目标

- 深入理解Dockerfile的工作原理和最佳实践
- 掌握高级Dockerfile指令和优化技巧
- 学会多阶段构建和缓存优化
- 了解不同语言和框架的Dockerfile模式

## 📚 Dockerfile深入解析

### 1. Dockerfile工作原理

```javascript
// Dockerfile构建过程
const dockerfileBuildProcess = {
  parsing: {
    description: 'Docker守护进程解析Dockerfile',
    steps: [
      '读取Dockerfile内容',
      '验证语法正确性',
      '解析指令和参数',
      '构建执行计划'
    ]
  },

  building: {
    description: '逐层构建镜像',
    process: [
      '从基础镜像开始',
      '为每个指令创建新层',
      '执行指令并提交更改',
      '生成最终镜像'
    ]
  },

  caching: {
    description: '构建缓存机制',
    rules: [
      '指令内容不变则使用缓存',
      'COPY/ADD检查文件内容变化',
      '缓存失效后续指令重新执行',
      '使用--no-cache可禁用缓存'
    ]
  },

  context: {
    description: '构建上下文',
    components: [
      'Dockerfile所在目录',
      '构建时发送给Docker守护进程的文件',
      '.dockerignore文件控制包含内容',
      '远程Git仓库也可作为上下文'
    ]
  }
};

console.log('Dockerfile构建过程:', dockerfileBuildProcess);
```

### 2. 高级指令详解

```dockerfile
# ARG - 构建参数
ARG NODE_VERSION=16
ARG BUILD_ENV=production
FROM node:${NODE_VERSION}-alpine

# 多行参数
ARG DEBIAN_FRONTEND=noninteractive \
    TZ=Asia/Shanghai \
    LANG=en_US.UTF-8

# ENV - 环境变量
ENV NODE_ENV=${BUILD_ENV}
ENV PATH="/app/bin:${PATH}"

# 一次设置多个环境变量
ENV NPM_CONFIG_REGISTRY=https://registry.npm.taobao.org \
    NPM_CONFIG_CACHE=/tmp/.npm \
    NPM_CONFIG_LOGLEVEL=warn

# LABEL - 元数据标签
LABEL maintainer="developer@example.com"
LABEL version="1.0.0"
LABEL description="Node.js application"

# 一次设置多个标签
LABEL org.opencontainers.image.title="My App" \
      org.opencontainers.image.description="A sample Node.js application" \
      org.opencontainers.image.version="1.0.0" \
      org.opencontainers.image.created="2023-01-01T00:00:00Z" \
      org.opencontainers.image.source="https://github.com/user/repo"

# ONBUILD - 延迟执行指令
ONBUILD COPY package*.json ./
ONBUILD RUN npm ci --only=production
ONBUILD COPY . .

# SHELL - 更改默认shell
SHELL ["/bin/bash", "-c"]

# STOPSIGNAL - 停止信号
STOPSIGNAL SIGTERM
```

### 3. 复杂的RUN指令

```dockerfile
# 链式命令减少层数
RUN apt-get update && \
    apt-get install -y \
        curl \
        git \
        python3 \
        build-essential && \
    rm -rf /var/lib/apt/lists/* && \
    npm install -g pm2 && \
    npm cache clean --force

# 使用heredoc语法（Docker 23.0+）
RUN <<EOF
apt-get update
apt-get install -y curl git
rm -rf /var/lib/apt/lists/*
EOF

# 多行shell脚本
RUN <<'EOF'
#!/bin/bash
set -e

# 安装Node.js
curl -fsSL https://deb.nodesource.com/setup_16.x | bash -
apt-get install -y nodejs

# 配置npm
npm config set registry https://registry.npm.taobao.org
npm config set cache /tmp/.npm

# 清理
apt-get clean
rm -rf /var/lib/apt/lists/*
EOF

# 条件执行
RUN if [ "$BUILD_ENV" = "development" ]; then \
        npm install; \
    else \
        npm ci --only=production; \
    fi
```

### 4. 高级COPY和ADD

```dockerfile
# COPY基础用法
COPY src/ /app/src/
COPY package*.json ./

# 设置文件权限和所有者
COPY --chown=node:node package*.json ./
COPY --chmod=755 script.sh /usr/local/bin/

# 从特定构建阶段复制
COPY --from=builder /app/dist /usr/share/nginx/html
COPY --from=node:16-alpine /usr/local/bin/node /usr/local/bin/

# 使用通配符
COPY config/*.json /app/config/
COPY src/**/*.js /app/src/

# ADD特殊功能
ADD https://example.com/file.tar.gz /tmp/
ADD --chown=app:app archive.tar.gz /app/

# 自动解压（仅本地文件）
ADD app.tar.gz /app/

# 保持目录结构
ADD --keep-git-dir=true https://github.com/user/repo.git /src
```

## 🏗️ 多阶段构建详解

### 1. 基础多阶段构建

```dockerfile
# 构建阶段
FROM node:16 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build && npm prune --production

# 生产阶段
FROM node:16-alpine AS production
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001
WORKDIR /app
COPY --from=builder --chown=nextjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --chown=nextjs:nodejs package.json ./
USER nextjs
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

### 2. 复杂多阶段构建

```dockerfile
# 依赖安装阶段
FROM node:16-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --only=production && npm cache clean --force

# 开发依赖安装阶段
FROM node:16-alpine AS dev-deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci && npm cache clean --force

# 构建阶段
FROM dev-deps AS builder
WORKDIR /app
COPY . .
COPY --from=deps /app/node_modules ./node_modules
RUN npm run build

# 测试阶段
FROM dev-deps AS tester
WORKDIR /app
COPY . .
COPY --from=deps /app/node_modules ./node_modules
RUN npm run test

# 运行时阶段
FROM node:16-alpine AS runner
WORKDIR /app

# 创建用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# 复制必要文件
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT 3000
CMD ["node", "server.js"]
```

### 3. 条件构建阶段

```dockerfile
# 基础阶段
FROM ubuntu:20.04 AS base
RUN apt-get update && apt-get install -y curl

# 开发阶段
FROM base AS development
RUN apt-get install -y \
    git \
    vim \
    nodejs \
    npm

# 生产阶段
FROM base AS production
RUN apt-get install -y nodejs npm && \
    rm -rf /var/lib/apt/lists/*

# 根据构建参数选择阶段
ARG BUILD_ENV=production
FROM ${BUILD_ENV} AS final
WORKDIR /app
COPY . .
```

## 🚀 性能优化技巧

### 1. 缓存优化

```dockerfile
# ❌ 不好的做法 - 每次都重新安装依赖
FROM node:16-alpine
WORKDIR /app
COPY . .
RUN npm install

# ✅ 好的做法 - 先复制依赖文件
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
```

### 2. 层数优化

```dockerfile
# ❌ 不好的做法 - 创建过多层
FROM ubuntu:20.04
RUN apt-get update
RUN apt-get install -y curl
RUN apt-get install -y git
RUN apt-get install -y python3
RUN rm -rf /var/lib/apt/lists/*

# ✅ 好的做法 - 合并RUN指令
FROM ubuntu:20.04
RUN apt-get update && \
    apt-get install -y \
        curl \
        git \
        python3 && \
    rm -rf /var/lib/apt/lists/*
```

### 3. 镜像大小优化

```dockerfile
# 使用多阶段构建
FROM node:16 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# 使用更小的基础镜像
FROM node:16-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package.json ./

# 或使用distroless镜像
FROM gcr.io/distroless/nodejs:16
COPY --from=builder /app/dist /app
WORKDIR /app
CMD ["index.js"]
```

## 🛠️ 实际应用模板

### 1. Node.js应用Dockerfile

```dockerfile
# Node.js 应用生产级Dockerfile
FROM node:16-alpine AS base

# 安装dumb-init
RUN apk add --no-cache dumb-init

# 创建应用目录和用户
RUN mkdir -p /home/node/app && chown -R node:node /home/node/app
WORKDIR /home/node/app

# 切换到node用户
USER node

# 依赖安装阶段
FROM base AS deps
COPY --chown=node:node package*.json ./
RUN npm ci --only=production && npm cache clean --force

# 开发依赖阶段
FROM base AS dev-deps
COPY --chown=node:node package*.json ./
RUN npm ci

# 构建阶段
FROM dev-deps AS build
COPY --chown=node:node . .
RUN npm run build

# 生产阶段
FROM base AS production
COPY --from=deps --chown=node:node /home/node/app/node_modules ./node_modules
COPY --from=build --chown=node:node /home/node/app/dist ./dist
COPY --chown=node:node package.json ./

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node healthcheck.js

# 暴露端口
EXPOSE 3000

# 启动应用
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]
```

### 2. Python应用Dockerfile

```dockerfile
# Python应用生产级Dockerfile
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

# 依赖安装阶段
FROM base AS deps
COPY requirements.txt .
RUN pip install --user -r requirements.txt

# 开发依赖阶段
FROM deps AS dev-deps
COPY requirements-dev.txt .
RUN pip install --user -r requirements-dev.txt

# 测试阶段
FROM dev-deps AS test
WORKDIR /app
COPY . .
RUN python -m pytest

# 生产阶段
FROM base AS production

# 创建应用用户
RUN useradd --create-home --shell /bin/bash app

# 设置工作目录
WORKDIR /home/app

# 从deps阶段复制依赖
COPY --from=deps --chown=app:app /root/.local /home/app/.local

# 复制应用代码
COPY --chown=app:app . .

# 切换用户
USER app

# 更新PATH
ENV PATH=/home/app/.local/bin:$PATH

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python healthcheck.py

# 暴露端口
EXPOSE 8000

# 启动应用
CMD ["python", "app.py"]
```

### 3. Java应用Dockerfile

```dockerfile
# Java应用生产级Dockerfile
FROM maven:3.8-openjdk-17 AS builder

# 设置工作目录
WORKDIR /app

# 复制pom.xml
COPY pom.xml .

# 下载依赖（利用缓存）
RUN mvn dependency:go-offline -B

# 复制源码
COPY src ./src

# 构建应用
RUN mvn clean package -DskipTests

# 生产阶段
FROM openjdk:17-jre-slim AS production

# 安装必要工具
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# 创建应用用户
RUN useradd --create-home --shell /bin/bash app

# 设置工作目录
WORKDIR /home/app

# 从构建阶段复制jar文件
COPY --from=builder --chown=app:app /app/target/*.jar app.jar

# 切换用户
USER app

# JVM优化参数
ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0"

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8080/actuator/health || exit 1

# 暴露端口
EXPOSE 8080

# 启动应用
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
```

### 4. Go应用Dockerfile

```dockerfile
# Go应用生产级Dockerfile
FROM golang:1.19-alpine AS builder

# 安装必要工具
RUN apk add --no-cache git ca-certificates tzdata

# 设置工作目录
WORKDIR /app

# 复制go mod文件
COPY go.mod go.sum ./

# 下载依赖
RUN go mod download

# 复制源码
COPY . .

# 构建应用
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o main .

# 生产阶段 - 使用scratch镜像
FROM scratch AS production

# 从builder复制必要文件
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
COPY --from=builder /usr/share/zoneinfo /usr/share/zoneinfo
COPY --from=builder /app/main /

# 暴露端口
EXPOSE 8080

# 启动应用
ENTRYPOINT ["/main"]
```

## 🔧 调试和故障排除

### 1. 构建调试技巧

```bash
# 逐步构建调试
docker build --target builder -t myapp:debug .
docker run -it myapp:debug /bin/bash

# 查看构建过程
docker build --progress=plain --no-cache .

# 查看构建历史
docker history myapp:latest

# 查看构建上下文
docker build --dry-run .
```

### 2. 多平台构建

```dockerfile
# Dockerfile支持多平台
FROM --platform=$BUILDPLATFORM golang:1.19-alpine AS builder

ARG TARGETPLATFORM
ARG BUILDPLATFORM
ARG TARGETOS
ARG TARGETARCH

WORKDIR /app
COPY . .

RUN CGO_ENABLED=0 GOOS=$TARGETOS GOARCH=$TARGETARCH go build -o main .

FROM alpine:latest
RUN apk --no-cache add ca-certificates
COPY --from=builder /app/main /
ENTRYPOINT ["/main"]
```

```bash
# 构建多平台镜像
docker buildx create --name builder --use
docker buildx build --platform linux/amd64,linux/arm64 -t myapp:latest --push .
```

### 3. 构建优化分析

```bash
# 分析镜像层
docker history --no-trunc myapp:latest

# 使用dive分析镜像
docker run --rm -it \
    -v /var/run/docker.sock:/var/run/docker.sock \
    wagoodman/dive:latest myapp:latest

# 使用hadolint检查Dockerfile
docker run --rm -i hadolint/hadolint < Dockerfile
```

## 📋 最佳实践总结

### 1. 安全最佳实践

```dockerfile
# ✅ 使用非root用户
FROM node:16-alpine
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001
USER nextjs

# ✅ 不在镜像中存储敏感信息
# 使用ARG传递构建时密钥
ARG API_KEY
RUN echo "Building with API_KEY" && \
    # 使用API_KEY进行构建 \
    unset API_KEY

# ✅ 使用官方基础镜像
FROM node:16-alpine  # 而不是 FROM ubuntu

# ✅ 及时更新和清理
RUN apt-get update && \
    apt-get install -y package && \
    rm -rf /var/lib/apt/lists/*
```

### 2. 性能最佳实践

```dockerfile
# ✅ 利用缓存
COPY package*.json ./
RUN npm ci --only=production
COPY . .

# ✅ 最小化层数
RUN apt-get update && apt-get install -y \
    package1 \
    package2 && \
    rm -rf /var/lib/apt/lists/*

# ✅ 使用多阶段构建
FROM node:16 AS builder
# 构建步骤
FROM node:16-alpine AS production
COPY --from=builder /app/dist ./dist
```

### 3. 维护性最佳实践

```dockerfile
# ✅ 添加标签
LABEL maintainer="team@example.com" \
      version="1.0.0" \
      description="Application description"

# ✅ 使用.dockerignore
# .dockerignore内容:
# node_modules
# .git
# .env
# *.log

# ✅ 健康检查
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# ✅ 信号处理
STOPSIGNAL SIGTERM
```

## 📝 下一步

现在您已经掌握了Dockerfile的高级技巧，接下来学习：

1. **[Docker网络](./06-docker-networking.md)** - 深入学习Docker网络管理
2. **[Docker数据卷](./07-docker-volumes.md)** - 掌握数据持久化管理

## 🎯 本章要点

- ✅ 掌握Dockerfile的高级指令和用法
- ✅ 学会多阶段构建和性能优化
- ✅ 了解不同语言的Dockerfile最佳实践
- ✅ 掌握构建调试和故障排除技巧
- ✅ 理解安全和维护性最佳实践

继续深入学习Docker网络管理！🐳
