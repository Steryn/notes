# Docker多阶段构建

## 多阶段构建基础

多阶段构建是Docker的一个强大功能，允许在单个Dockerfile中使用多个FROM指令。每个FROM指令可以使用不同的基础镜像，并且可以从前面的阶段复制文件到后面的阶段。

## 为什么需要多阶段构建？

### 传统构建的问题

- **镜像过大**：包含构建工具和源代码
- **安全风险**：构建工具可能包含漏洞
- **资源浪费**：运行时不需要构建工具

### 多阶段构建的优势

- **减小镜像大小**：只包含运行时需要的文件
- **提高安全性**：移除构建工具和源代码
- **优化构建过程**：并行构建多个阶段
- **简化部署**：生产镜像更轻量

## 基本语法

### 简单多阶段构建

```dockerfile
# 构建阶段
FROM node:16 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# 生产阶段
FROM nginx:alpine AS production
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### 命名阶段

```dockerfile
# 依赖安装阶段
FROM node:16 AS dependencies
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# 构建阶段
FROM node:16 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# 生产阶段
FROM node:16-alpine AS production
WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY package*.json ./
EXPOSE 3000
CMD ["npm", "start"]
```

## 实践练习

### 练习1：Node.js应用多阶段构建

创建`Dockerfile`：

```dockerfile
# 构建阶段
FROM node:16 AS builder
WORKDIR /app

# 复制package文件
COPY package*.json ./

# 安装依赖
RUN npm ci

# 复制源代码
COPY . .

# 构建应用
RUN npm run build

# 生产阶段
FROM node:16-alpine AS production

# 创建非root用户
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

WORKDIR /app

# 复制构建产物
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

# 设置权限
RUN chown -R nextjs:nodejs /app
USER nextjs

EXPOSE 3000

CMD ["npm", "start"]
```

创建`package.json`：

```json
{
  "name": "multi-stage-app",
  "version": "1.0.0",
  "description": "多阶段构建示例",
  "main": "dist/app.js",
  "scripts": {
    "build": "tsc",
    "start": "node dist/app.js",
    "dev": "ts-node src/app.ts"
  },
  "dependencies": {
    "express": "^4.18.0"
  },
  "devDependencies": {
    "typescript": "^4.7.0",
    "ts-node": "^10.8.0",
    "@types/express": "^4.17.0"
  }
}
```

### 练习2：Go应用多阶段构建

创建`Dockerfile`：

```dockerfile
# 构建阶段
FROM golang:1.19-alpine AS builder

# 安装必要的包
RUN apk add --no-cache git

WORKDIR /app

# 复制go mod文件
COPY go.mod go.sum ./

# 下载依赖
RUN go mod download

# 复制源代码
COPY . .

# 构建应用
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o main .

# 生产阶段
FROM alpine:latest AS production

# 安装ca证书
RUN apk --no-cache add ca-certificates

WORKDIR /root/

# 复制二进制文件
COPY --from=builder /app/main .

# 暴露端口
EXPOSE 8080

# 运行应用
CMD ["./main"]
```

### 练习3：Java应用多阶段构建

创建`Dockerfile`：

```dockerfile
# 构建阶段
FROM maven:3.8-openjdk-11 AS builder

WORKDIR /app

# 复制pom文件
COPY pom.xml .

# 下载依赖
RUN mvn dependency:go-offline -B

# 复制源代码
COPY src ./src

# 构建应用
RUN mvn clean package -DskipTests

# 生产阶段
FROM openjdk:11-jre-slim AS production

WORKDIR /app

# 创建非root用户
RUN groupadd -r appuser && useradd -r -g appuser appuser

# 复制jar文件
COPY --from=builder /app/target/*.jar app.jar

# 设置权限
RUN chown -R appuser:appuser /app
USER appuser

# 暴露端口
EXPOSE 8080

# 运行应用
CMD ["java", "-jar", "app.jar"]
```

## 高级技巧

### 1. 条件构建

```dockerfile
# 构建阶段
FROM node:16 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# 根据构建参数决定构建方式
ARG BUILD_ENV=production
RUN if [ "$BUILD_ENV" = "development" ]; then \
        npm run build:dev; \
    else \
        npm run build:prod; \
    fi

# 生产阶段
FROM nginx:alpine AS production
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### 2. 并行构建

```dockerfile
# 前端构建
FROM node:16 AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ .
RUN npm run build

# 后端构建
FROM node:16 AS backend-builder
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm install
COPY backend/ .
RUN npm run build

# 生产阶段
FROM nginx:alpine AS production
COPY --from=frontend-builder /app/frontend/dist /usr/share/nginx/html
COPY --from=backend-builder /app/backend/dist /usr/share/nginx/api
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### 3. 缓存优化

```dockerfile
# 依赖阶段
FROM node:16 AS dependencies
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# 构建阶段
FROM node:16 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# 生产阶段
FROM node:16-alpine AS production
WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY package*.json ./
EXPOSE 3000
CMD ["npm", "start"]
```

## 构建优化

### 1. 构建参数

```dockerfile
# 构建阶段
FROM node:16 AS builder
WORKDIR /app

# 构建参数
ARG NODE_ENV=production
ARG VERSION=1.0.0

# 环境变量
ENV NODE_ENV=$NODE_ENV
ENV VERSION=$VERSION

COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# 生产阶段
FROM nginx:alpine AS production
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

构建命令：

```bash
# 传递构建参数
docker build --build-arg NODE_ENV=production --build-arg VERSION=1.0.0 -t myapp .
```

### 2. 目标构建

```bash
# 只构建到特定阶段
docker build --target builder -t myapp:builder .

# 构建生产镜像
docker build --target production -t myapp:production .
```

### 3. 构建缓存

```bash
# 使用构建缓存
docker build --cache-from myapp:latest -t myapp .

# 不使用缓存
docker build --no-cache -t myapp .
```

## 最佳实践

### 1. 阶段命名

```dockerfile
# 使用有意义的阶段名称
FROM node:16 AS dependencies
FROM node:16 AS builder
FROM nginx:alpine AS production
```

### 2. 最小化生产镜像

```dockerfile
# 使用Alpine基础镜像
FROM nginx:alpine AS production

# 只复制必要的文件
COPY --from=builder /app/dist /usr/share/nginx/html

# 使用非root用户
RUN adduser -D -s /bin/sh appuser
USER appuser
```

### 3. 安全考虑

```dockerfile
# 生产阶段不包含构建工具
FROM nginx:alpine AS production

# 不复制源代码
COPY --from=builder /app/dist /usr/share/nginx/html

# 使用只读文件系统
RUN apk add --no-cache dumb-init
ENTRYPOINT ["dumb-init", "--"]
```

## 性能优化

### 1. 并行构建

```dockerfile
# 使用并行构建
FROM node:16 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --parallel
COPY . .
RUN npm run build --parallel
```

### 2. 层缓存优化

```dockerfile
# 先复制依赖文件
COPY package*.json ./
RUN npm install

# 再复制源代码
COPY . .
RUN npm run build
```

### 3. 构建上下文优化

创建`.dockerignore`：

```
node_modules
npm-debug.log
.git
.gitignore
README.md
.env
.nyc_output
coverage
```

## 常见问题

### 1. 构建失败

```bash
# 查看构建日志
docker build --no-cache --progress=plain -t myapp .

# 构建到特定阶段
docker build --target builder -t myapp:builder .
```

### 2. 镜像过大

```bash
# 分析镜像大小
docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"

# 查看镜像层
docker history myapp:latest
```

### 3. 构建缓慢

```bash
# 使用构建缓存
docker build --cache-from myapp:latest -t myapp .

# 优化.dockerignore文件
# 使用并行构建
```

## 下一步

掌握多阶段构建后，您可以：

1. 继续学习 [Docker安全最佳实践](./10-docker-security.md)
2. 学习Docker镜像优化技巧
3. 探索CI/CD中的多阶段构建

## 学习检查点

完成本章学习后，您应该能够：

- [ ] 理解多阶段构建的概念和优势
- [ ] 熟练编写多阶段Dockerfile
- [ ] 掌握构建优化技巧
- [ ] 了解多阶段构建的最佳实践
- [ ] 解决多阶段构建相关问题
