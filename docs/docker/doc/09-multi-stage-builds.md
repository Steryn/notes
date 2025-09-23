# Docker多阶段构建

## 🎯 学习目标

- 深入理解多阶段构建的原理和优势
- 掌握复杂多阶段构建的设计模式
- 学会构建缓存优化和并行构建技巧
- 了解跨平台构建和CI/CD集成

## 📚 多阶段构建概述

### 1. 什么是多阶段构建

```javascript
// 多阶段构建概念
const multiStageBuild = {
  definition: '在单个Dockerfile中使用多个FROM指令，创建多个构建阶段',
  
  advantages: [
    '显著减小最终镜像大小',
    '提高构建安全性',
    '简化构建流程',
    '更好的缓存利用',
    '支持并行构建'
  ],
  
  use_cases: [
    '编译型语言应用 (Go, Java, C++)',
    '前端应用构建',
    '依赖安装和清理',
    '测试和生产镜像分离',
    '多架构镜像构建'
  ],
  
  best_practices: [
    '使用语义化的阶段名称',
    '最小化最终阶段内容',
    '优化构建缓存',
    '并行构建独立阶段',
    '选择最小的基础镜像'
  ]
};

console.log('多阶段构建概念:', multiStageBuild);
```

### 2. 基本语法和结构

```dockerfile
# 基本多阶段构建结构
FROM node:16 AS dependencies
# 依赖安装阶段

FROM node:16 AS build
# 构建阶段

FROM nginx:alpine AS runtime
# 运行时阶段
COPY --from=build /app/dist /usr/share/nginx/html
```

## 🛠️ 构建模式和最佳实践

### 1. 依赖分离模式

```dockerfile
# Dockerfile.node-app
# 阶段1: 安装生产依赖
FROM node:16-alpine AS prod-deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# 阶段2: 安装所有依赖
FROM node:16-alpine AS all-deps
WORKDIR /app
COPY package*.json ./
RUN npm ci && npm cache clean --force

# 阶段3: 构建应用
FROM all-deps AS build
COPY . .
RUN npm run build && npm run test

# 阶段4: 生产运行时
FROM node:16-alpine AS runtime
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

WORKDIR /app
USER nextjs

# 只复制必要的文件
COPY --from=prod-deps --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=build --chown=nextjs:nodejs /app/dist ./dist
COPY --from=build --chown=nextjs:nodejs /app/package.json ./

EXPOSE 3000
CMD ["node", "dist/index.js"]
```

### 2. 编译优化模式

```dockerfile
# Dockerfile.go-app
# 阶段1: 构建环境
FROM golang:1.19-alpine AS builder

# 安装构建工具
RUN apk add --no-cache git ca-certificates tzdata

WORKDIR /app

# 复制go mod文件并下载依赖
COPY go.mod go.sum ./
RUN go mod download && go mod verify

# 复制源代码
COPY . .

# 构建应用
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build \
    -ldflags='-w -s -extldflags "-static"' \
    -a -installsuffix cgo \
    -o main .

# 阶段2: 最小运行时
FROM scratch AS runtime

# 从builder复制必要文件
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
COPY --from=builder /usr/share/zoneinfo /usr/share/zoneinfo
COPY --from=builder /app/main /

# 设置环境变量
ENV TZ=Asia/Shanghai

EXPOSE 8080
ENTRYPOINT ["/main"]
```

### 3. 测试集成模式

```dockerfile
# Dockerfile.with-tests
# 阶段1: 基础环境
FROM python:3.9-slim AS base
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 阶段2: 开发依赖
FROM base AS dev-deps
COPY requirements-dev.txt .
RUN pip install --no-cache-dir -r requirements-dev.txt

# 阶段3: 测试阶段
FROM dev-deps AS test
COPY . .
RUN python -m pytest tests/ --cov=src --cov-report=term-missing
RUN python -m flake8 src/
RUN python -m mypy src/

# 阶段4: 安全扫描
FROM dev-deps AS security
COPY . .
RUN safety check
RUN bandit -r src/

# 阶段5: 生产构建
FROM base AS production
COPY --from=test /app/src ./src
COPY --from=test /app/main.py ./

# 创建非root用户
RUN useradd --create-home --shell /bin/bash app
USER app

EXPOSE 8000
CMD ["python", "main.py"]
```

## 🚀 高级构建技巧

### 1. 并行构建优化

```dockerfile
# Dockerfile.parallel-build
FROM node:16-alpine AS base
WORKDIR /app
COPY package*.json ./

# 阶段1a: 前端依赖
FROM base AS frontend-deps
RUN npm ci --prefix frontend && npm cache clean --force

# 阶段1b: 后端依赖
FROM base AS backend-deps  
RUN npm ci --prefix backend && npm cache clean --force

# 阶段2a: 前端构建
FROM frontend-deps AS frontend-build
COPY frontend/ ./frontend/
RUN npm run build --prefix frontend

# 阶段2b: 后端构建
FROM backend-deps AS backend-build
COPY backend/ ./backend/
RUN npm run build --prefix backend

# 阶段3: 最终镜像
FROM nginx:alpine AS final
COPY --from=frontend-build /app/frontend/dist /usr/share/nginx/html
COPY --from=backend-build /app/backend/dist /app/api
COPY nginx.conf /etc/nginx/nginx.conf
```

### 2. 缓存优化策略

```dockerfile
# Dockerfile.cache-optimized
# 利用BuildKit的缓存挂载
# syntax=docker/dockerfile:1.4
FROM node:16-alpine AS base

WORKDIR /app

# 缓存npm下载
FROM base AS deps
RUN --mount=type=cache,target=/root/.npm \
    --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=package-lock.json,target=package-lock.json \
    npm ci --only=production

# 缓存构建输出
FROM deps AS build
RUN --mount=type=cache,target=/root/.npm \
    --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=package-lock.json,target=package-lock.json \
    npm ci

COPY . .
RUN --mount=type=cache,target=/app/.next/cache \
    npm run build

# 最终阶段
FROM node:16-alpine AS runtime
WORKDIR /app

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

COPY --from=deps --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=build --chown=nextjs:nodejs /app/.next ./.next
COPY --from=build --chown=nextjs:nodejs /app/public ./public
COPY --chown=nextjs:nodejs package.json ./

USER nextjs
EXPOSE 3000
CMD ["npm", "start"]
```

### 3. 条件构建

```dockerfile
# Dockerfile.conditional
ARG BUILD_TARGET=production
ARG ENABLE_TESTS=false

FROM node:16-alpine AS base
WORKDIR /app
COPY package*.json ./

# 开发依赖（条件性安装）
FROM base AS dev-deps
RUN if [ "$BUILD_TARGET" = "development" ] || [ "$ENABLE_TESTS" = "true" ]; then \
        npm ci; \
    else \
        npm ci --only=production; \
    fi

# 测试阶段（条件性执行）
FROM dev-deps AS test
COPY . .
RUN if [ "$ENABLE_TESTS" = "true" ]; then \
        npm run test; \
        npm run lint; \
    fi

# 构建阶段
FROM test AS build
RUN npm run build

# 开发环境
FROM base AS development
COPY --from=dev-deps /app/node_modules ./node_modules
COPY . .
CMD ["npm", "run", "dev"]

# 生产环境
FROM base AS production
COPY --from=dev-deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json ./
CMD ["npm", "start"]

# 根据参数选择最终阶段
FROM ${BUILD_TARGET} AS final
```

## 🌐 跨平台构建

### 1. 多架构支持

```dockerfile
# Dockerfile.multiarch
FROM --platform=$BUILDPLATFORM golang:1.19-alpine AS builder

ARG TARGETPLATFORM
ARG BUILDPLATFORM
ARG TARGETOS
ARG TARGETARCH

WORKDIR /app

# 交叉编译工具
RUN apk add --no-cache git ca-certificates

COPY go.mod go.sum ./
RUN go mod download

COPY . .

# 根据目标平台编译
RUN CGO_ENABLED=0 GOOS=$TARGETOS GOARCH=$TARGETARCH \
    go build -ldflags="-w -s" -o main .

# 运行时镜像
FROM alpine:latest AS runtime

RUN apk --no-cache add ca-certificates tzdata
WORKDIR /app

COPY --from=builder /app/main .

EXPOSE 8080
CMD ["./main"]
```

### 2. 构建多架构镜像

```bash
# 创建并使用新的builder
docker buildx create --name mybuilder --use

# 构建多架构镜像
docker buildx build \
    --platform linux/amd64,linux/arm64,linux/arm/v7 \
    --build-arg BUILD_TARGET=production \
    -t myapp:latest \
    --push .

# 检查镜像架构
docker buildx imagetools inspect myapp:latest
```

## 🔧 实际应用示例

### 1. Java Spring Boot应用

```dockerfile
# Dockerfile.springboot
# 阶段1: 构建环境
FROM maven:3.8-openjdk-17 AS builder

WORKDIR /app

# 复制pom.xml并下载依赖（缓存优化）
COPY pom.xml .
RUN mvn dependency:go-offline -B

# 复制源码并构建
COPY src ./src
RUN mvn clean package -DskipTests -B

# 阶段2: 运行时环境
FROM openjdk:17-jre-slim AS runtime

# 安装必要工具
RUN apt-get update && apt-get install -y \
    curl \
    dumb-init \
    && rm -rf /var/lib/apt/lists/*

# 创建应用用户
RUN useradd --create-home --shell /bin/bash app

WORKDIR /app

# 复制构建产物
COPY --from=builder --chown=app:app /app/target/*.jar app.jar

# 切换用户
USER app

# JVM优化
ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0"

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
    CMD curl -f http://localhost:8080/actuator/health || exit 1

EXPOSE 8080

ENTRYPOINT ["dumb-init", "--"]
CMD java $JAVA_OPTS -jar app.jar
```

### 2. React + Node.js全栈应用

```dockerfile
# Dockerfile.fullstack
# 阶段1: 前端构建
FROM node:16-alpine AS frontend-builder

WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci --only=production

COPY frontend/ .
RUN npm run build

# 阶段2: 后端构建
FROM node:16-alpine AS backend-builder

WORKDIR /app/backend

COPY backend/package*.json ./
RUN npm ci --only=production

COPY backend/ .
RUN npm run build

# 阶段3: Nginx配置
FROM nginx:alpine AS nginx-config

COPY nginx.conf /etc/nginx/nginx.conf
COPY --from=frontend-builder /app/frontend/build /usr/share/nginx/html

# 阶段4: Node.js API服务
FROM node:16-alpine AS api-server

WORKDIR /app

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodeuser -u 1001

COPY --from=backend-builder --chown=nodeuser:nodejs /app/backend/dist ./dist
COPY --from=backend-builder --chown=nodeuser:nodejs /app/backend/node_modules ./node_modules
COPY --from=backend-builder --chown=nodeuser:nodejs /app/backend/package.json ./

USER nodeuser

EXPOSE 3000

CMD ["node", "dist/index.js"]

# 阶段5: 开发环境
FROM node:16-alpine AS development

WORKDIR /app

# 安装所有依赖
COPY package*.json ./
RUN npm ci

COPY . .

EXPOSE 3000 3001

CMD ["npm", "run", "dev"]

# 阶段6: 生产环境（可以选择不同的最终阶段）
FROM nginx:alpine AS production

# 复制前端静态文件
COPY --from=frontend-builder /app/frontend/build /usr/share/nginx/html

# 复制nginx配置
COPY nginx.prod.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### 3. Python数据科学应用

```dockerfile
# Dockerfile.datascience
# 阶段1: 基础环境
FROM python:3.9-slim AS base

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 阶段2: 依赖安装
FROM base AS deps

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 阶段3: 开发依赖
FROM deps AS dev-deps

COPY requirements-dev.txt .
RUN pip install --no-cache-dir -r requirements-dev.txt

# 阶段4: 数据处理
FROM dev-deps AS data-processing

COPY data/ ./data/
COPY scripts/preprocess.py ./scripts/
RUN python scripts/preprocess.py

# 阶段5: 模型训练
FROM data-processing AS model-training

COPY src/train.py ./src/
RUN python src/train.py

# 阶段6: 测试
FROM dev-deps AS test

COPY . .
COPY --from=data-processing /app/data/processed ./data/processed
RUN python -m pytest tests/

# 阶段7: 生产环境
FROM deps AS production

# 创建非root用户
RUN useradd --create-home --shell /bin/bash appuser

# 复制应用代码和训练好的模型
COPY --from=test /app/src ./src
COPY --from=model-training /app/models ./models
COPY main.py .

# 切换用户
USER appuser

EXPOSE 8000

CMD ["python", "main.py"]

# 阶段8: Jupyter开发环境
FROM dev-deps AS jupyter

COPY . .
COPY --from=data-processing /app/data/processed ./data/processed

EXPOSE 8888

CMD ["jupyter", "lab", "--ip=0.0.0.0", "--allow-root", "--no-browser"]
```

## 🚀 构建自动化和CI/CD

### 1. GitHub Actions集成

```yaml
# .github/workflows/docker-build.yml
name: Docker Multi-Stage Build

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Docker Buildx
      uses: docker/setup-buildx-action@v2
    
    - name: Run tests
      run: |
        docker buildx build \
          --target test \
          --load \
          -t test-image .
        docker run --rm test-image

  build-and-push:
    needs: test
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Docker Buildx
      uses: docker/setup-buildx-action@v2
    
    - name: Log in to Container Registry
      uses: docker/login-action@v2
      with:
        registry: ${{ env.REGISTRY }}
        username: ${{ github.actor }}
        password: ${{ secrets.GITHUB_TOKEN }}
    
    - name: Extract metadata
      id: meta
      uses: docker/metadata-action@v4
      with:
        images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
        tags: |
          type=ref,event=branch
          type=ref,event=pr
          type=sha
    
    - name: Build and push
      uses: docker/build-push-action@v4
      with:
        context: .
        platforms: linux/amd64,linux/arm64
        push: true
        tags: ${{ steps.meta.outputs.tags }}
        labels: ${{ steps.meta.outputs.labels }}
        cache-from: type=gha
        cache-to: type=gha,mode=max
        build-args: |
          BUILD_TARGET=production
          ENABLE_TESTS=true
```

### 2. 构建脚本自动化

```bash
#!/bin/bash
# build.sh - 多阶段构建自动化脚本

set -e

# 配置
IMAGE_NAME="myapp"
REGISTRY="myregistry.com"
TAG=${1:-latest}
BUILD_TARGET=${2:-production}
PLATFORMS="linux/amd64,linux/arm64"

echo "🏗️ 开始多阶段构建..."
echo "镜像: $REGISTRY/$IMAGE_NAME:$TAG"
echo "目标: $BUILD_TARGET"
echo "平台: $PLATFORMS"

# 创建buildx实例
echo "📋 设置构建环境..."
docker buildx create --name multiarch --use --bootstrap 2>/dev/null || true

# 构建测试镜像
echo "🧪 运行测试..."
docker buildx build \
    --target test \
    --load \
    -t $IMAGE_NAME:test \
    .

echo "✅ 测试通过"

# 构建生产镜像
echo "🚀 构建生产镜像..."
docker buildx build \
    --platform $PLATFORMS \
    --target $BUILD_TARGET \
    --build-arg BUILD_ENV=production \
    --build-arg BUILD_DATE=$(date -u +'%Y-%m-%dT%H:%M:%SZ') \
    --build-arg BUILD_VERSION=$TAG \
    -t $REGISTRY/$IMAGE_NAME:$TAG \
    -t $REGISTRY/$IMAGE_NAME:latest \
    --push \
    .

echo "✅ 构建完成!"

# 验证镜像
echo "🔍 验证镜像..."
docker buildx imagetools inspect $REGISTRY/$IMAGE_NAME:$TAG

echo "🎉 多架构镜像构建成功!"
```

## 📊 性能优化和监控

### 1. 构建时间优化

```dockerfile
# Dockerfile.optimized
# syntax=docker/dockerfile:1.4

FROM node:16-alpine AS base
WORKDIR /app

# 使用bind mount避免大量文件复制
FROM base AS deps
RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=package-lock.json,target=package-lock.json \
    --mount=type=cache,target=/root/.npm \
    npm ci --only=production

FROM base AS build-deps  
RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=package-lock.json,target=package-lock.json \
    --mount=type=cache,target=/root/.npm \
    npm ci

FROM build-deps AS build
RUN --mount=type=bind,source=.,target=.,rw \
    --mount=type=cache,target=/app/.next/cache \
    npm run build && \
    cp -r .next/standalone /tmp/standalone && \
    cp -r .next/static /tmp/static && \
    cp -r public /tmp/public

FROM base AS runtime
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /tmp/standalone ./
COPY --from=build /tmp/static ./.next/static
COPY --from=build /tmp/public ./public

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
```

### 2. 构建分析脚本

```bash
#!/bin/bash
# analyze-build.sh

IMAGE_NAME=$1
if [ -z "$IMAGE_NAME" ]; then
    echo "Usage: $0 <image-name>"
    exit 1
fi

echo "📊 Docker镜像构建分析"
echo "======================"

echo ""
echo "🏗️ 构建历史:"
docker history --no-trunc $IMAGE_NAME

echo ""
echo "📋 镜像信息:"
docker inspect $IMAGE_NAME | jq '.[0] | {
    Id: .Id,
    Created: .Created,
    Size: .Size,
    Architecture: .Architecture,
    Os: .Os,
    Config: {
        Env: .Config.Env,
        Cmd: .Config.Cmd,
        Entrypoint: .Config.Entrypoint,
        WorkingDir: .Config.WorkingDir,
        User: .Config.User
    }
}'

echo ""
echo "📏 层级大小分析:"
docker history $IMAGE_NAME --format "table {{.CreatedBy}}\t{{.Size}}" | head -20

echo ""
echo "🔍 使用dive进行详细分析..."
if command -v dive &> /dev/null; then
    dive $IMAGE_NAME
else
    echo "安装dive工具以获得详细分析: https://github.com/wagoodman/dive"
fi
```

## 📝 下一步

现在您已经掌握了Docker多阶段构建，接下来学习：

1. **[Docker安全最佳实践](./10-docker-security.md)** - 学习容器安全配置
2. **[Docker生产环境部署](./11-production-deployment.md)** - 掌握生产部署技巧

## 🎯 本章要点

- ✅ 理解多阶段构建的原理和优势
- ✅ 掌握各种构建模式和优化技巧
- ✅ 学会跨平台构建和缓存优化
- ✅ 了解CI/CD集成和自动化构建
- ✅ 掌握构建性能监控和分析方法

继续深入学习Docker安全配置！🐳
