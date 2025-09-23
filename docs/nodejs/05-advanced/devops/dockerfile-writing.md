# Dockerfile编写

## 📋 概述

Dockerfile是用于构建Docker镜像的文本文件，包含了一系列指令来定义镜像的构建过程。编写高效、安全的Dockerfile是容器化应用的关键技能。

## 🎯 学习目标

- 掌握Dockerfile的语法和指令
- 学会编写高效的多阶段构建
- 了解镜像优化和安全最佳实践
- 掌握Node.js应用的容器化技巧

## 📚 Dockerfile指令详解

### 基础指令

#### FROM - 基础镜像

```dockerfile
# 使用官方Node.js镜像
FROM node:18-alpine

# 使用特定版本
FROM node:18.17.0-alpine3.18

# 多阶段构建
FROM node:18-alpine AS builder
FROM node:18-alpine AS runtime

# 使用参数化基础镜像
ARG NODE_VERSION=18
FROM node:${NODE_VERSION}-alpine
```

#### WORKDIR - 工作目录

```dockerfile
# 设置工作目录
WORKDIR /usr/src/app

# 相对路径（相对于之前的WORKDIR）
WORKDIR /usr/src
WORKDIR app  # 等同于 /usr/src/app
```

#### COPY 和 ADD

```dockerfile
# COPY - 复制文件（推荐）
COPY package*.json ./
COPY src/ ./src/
COPY . .

# 设置文件所有权
COPY --chown=node:node package*.json ./

# ADD - 复制文件（支持URL和压缩包）
ADD https://example.com/file.tar.gz /tmp/
ADD archive.tar.gz /usr/src/app/  # 自动解压

# 使用.dockerignore优化复制
COPY . .
```

#### RUN - 执行命令

```dockerfile
# 单行命令
RUN npm install

# 多行命令（推荐）
RUN npm ci --only=production && \
    npm cache clean --force && \
    rm -rf /tmp/*

# 使用SHELL形式
RUN ["npm", "install"]

# 安装系统包
RUN apk add --no-cache \
    curl \
    dumb-init \
    && rm -rf /var/cache/apk/*
```

#### ENV - 环境变量

```dockerfile
# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3000
ENV APP_VERSION=1.0.0

# 多个变量
ENV NODE_ENV=production \
    PORT=3000 \
    APP_VERSION=1.0.0

# 使用ARG构建时变量
ARG BUILD_ENV=production
ENV NODE_ENV=${BUILD_ENV}
```

#### EXPOSE - 暴露端口

```dockerfile
# 暴露端口（仅文档作用）
EXPOSE 3000
EXPOSE 3000/tcp
EXPOSE 53/udp

# 使用变量
ENV PORT=3000
EXPOSE $PORT
```

#### USER - 用户设置

```dockerfile
# 创建用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# 切换用户
USER nextjs

# 或使用现有用户
USER node
```

#### CMD 和 ENTRYPOINT

```dockerfile
# CMD - 默认命令（可被覆盖）
CMD ["npm", "start"]
CMD ["node", "app.js"]

# ENTRYPOINT - 入口点（不可被覆盖）
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "app.js"]

# 组合使用
ENTRYPOINT ["node"]
CMD ["app.js"]
```

## 🛠 Node.js应用Dockerfile示例

### 基础版本

```dockerfile
FROM node:18-alpine

WORKDIR /usr/src/app

# 复制依赖文件
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production

# 复制源代码
COPY . .

# 暴露端口
EXPOSE 3000

# 启动应用
CMD ["npm", "start"]
```

### 优化版本

```dockerfile
FROM node:18-alpine

# 安装系统依赖
RUN apk add --no-cache \
    dumb-init \
    curl \
    && rm -rf /var/cache/apk/*

# 创建应用用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

WORKDIR /usr/src/app

# 复制并安装依赖（利用缓存）
COPY --chown=nextjs:nodejs package*.json ./
RUN npm ci --only=production && \
    npm cache clean --force

# 复制源代码
COPY --chown=nextjs:nodejs . .

# 切换到非root用户
USER nextjs

# 设置环境变量
ENV NODE_ENV=production \
    PORT=3000

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# 使用dumb-init处理信号
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "app.js"]
```

### 多阶段构建版本

```dockerfile
# 构建阶段
FROM node:18-alpine AS builder

WORKDIR /usr/src/app

# 复制依赖文件
COPY package*.json ./

# 安装所有依赖（包括开发依赖）
RUN npm ci

# 复制源代码
COPY . .

# 构建应用
RUN npm run build && \
    npm prune --production

# 生产阶段
FROM node:18-alpine AS production

# 安装系统依赖
RUN apk add --no-cache \
    dumb-init \
    curl \
    && rm -rf /var/cache/apk/*

# 创建应用用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

WORKDIR /usr/src/app

# 从构建阶段复制文件
COPY --from=builder --chown=nextjs:nodejs /usr/src/app/dist ./dist
COPY --from=builder --chown=nextjs:nodejs /usr/src/app/node_modules ./node_modules
COPY --chown=nextjs:nodejs package.json ./

# 切换用户
USER nextjs

# 环境变量
ENV NODE_ENV=production \
    PORT=3000

EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/app.js"]
```

## 🔧 高级构建技巧

### 参数化构建

```dockerfile
# 使用构建参数
ARG NODE_VERSION=18
ARG ALPINE_VERSION=3.18
FROM node:${NODE_VERSION}-alpine${ALPINE_VERSION}

ARG BUILD_DATE
ARG VCS_REF
ARG VERSION

LABEL maintainer="your-email@example.com" \
      org.label-schema.build-date=$BUILD_DATE \
      org.label-schema.name="My Node App" \
      org.label-schema.description="Description of my app" \
      org.label-schema.url="https://example.com" \
      org.label-schema.vcs-ref=$VCS_REF \
      org.label-schema.vcs-url="https://github.com/user/repo" \
      org.label-schema.vendor="Your Company" \
      org.label-schema.version=$VERSION \
      org.label-schema.schema-version="1.0"

WORKDIR /usr/src/app

# 使用构建参数
ARG NPM_TOKEN
RUN echo "//registry.npmjs.org/:_authToken=${NPM_TOKEN}" > .npmrc && \
    npm ci --only=production && \
    rm -f .npmrc

COPY . .

USER node

ENV NODE_ENV=production

CMD ["npm", "start"]
```

```bash
# 构建时传递参数
docker build \
  --build-arg NODE_VERSION=18 \
  --build-arg BUILD_DATE=$(date -u +'%Y-%m-%dT%H:%M:%SZ') \
  --build-arg VCS_REF=$(git rev-parse --short HEAD) \
  --build-arg VERSION=1.0.0 \
  --build-arg NPM_TOKEN=${NPM_TOKEN} \
  -t my-app:1.0.0 .
```

### 条件构建

```dockerfile
# 使用构建参数控制构建流程
ARG BUILD_ENV=production

FROM node:18-alpine AS base
WORKDIR /usr/src/app
COPY package*.json ./

# 开发环境
FROM base AS development
RUN npm install
COPY . .
CMD ["npm", "run", "dev"]

# 生产环境
FROM base AS production
RUN npm ci --only=production
COPY . .
CMD ["npm", "start"]

# 根据参数选择最终阶段
FROM ${BUILD_ENV} AS final
```

```bash
# 构建开发版本
docker build --target development -t my-app:dev .

# 构建生产版本
docker build --target production -t my-app:prod .

# 使用参数构建
docker build --build-arg BUILD_ENV=development -t my-app:dev .
```

### 缓存优化

```dockerfile
FROM node:18-alpine

WORKDIR /usr/src/app

# 第一层：系统依赖（很少变化）
RUN apk add --no-cache dumb-init curl

# 第二层：创建用户（很少变化）
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# 第三层：依赖安装（package.json变化时才重新构建）
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# 第四层：源代码（经常变化，放在最后）
COPY --chown=nextjs:nodejs . .

USER nextjs
EXPOSE 3000
CMD ["dumb-init", "node", "app.js"]
```

## 🔒 安全最佳实践

### 基础安全配置

```dockerfile
FROM node:18-alpine

# 更新系统包
RUN apk update && apk upgrade && \
    apk add --no-cache dumb-init && \
    rm -rf /var/cache/apk/*

# 创建非root用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001 -G nodejs

WORKDIR /usr/src/app

# 设置正确的文件权限
COPY --chown=nextjs:nodejs package*.json ./
RUN npm ci --only=production && npm cache clean --force

COPY --chown=nextjs:nodejs . .

# 删除不必要的文件
RUN rm -rf \
    .git \
    .gitignore \
    .dockerignore \
    Dockerfile* \
    README.md \
    tests \
    docs

# 切换到非root用户
USER nextjs

# 限制权限
RUN chmod -R 755 /usr/src/app

ENV NODE_ENV=production
EXPOSE 3000

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "app.js"]
```

### 安全扫描集成

```dockerfile
# 多阶段构建 - 安全扫描
FROM node:18-alpine AS security-scan

WORKDIR /app
COPY package*.json ./
RUN npm audit --audit-level high

# 主构建阶段
FROM node:18-alpine AS production

# 安装Trivy进行容器扫描
RUN apk add --no-cache curl && \
    curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b /usr/local/bin

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

# 运行安全扫描
RUN trivy fs --exit-code 1 --no-progress --severity HIGH,CRITICAL .

USER node
CMD ["npm", "start"]
```

## 📊 镜像优化

### 大小优化

```dockerfile
# 使用Alpine Linux基础镜像
FROM node:18-alpine

# 合并RUN指令减少层数
RUN apk add --no-cache \
        curl \
        dumb-init \
    && addgroup -g 1001 -S nodejs \
    && adduser -S nextjs -u 1001 -G nodejs \
    && mkdir -p /usr/src/app \
    && chown nextjs:nodejs /usr/src/app

WORKDIR /usr/src/app

# 只复制必要文件
COPY --chown=nextjs:nodejs package*.json ./

# 安装生产依赖并清理
RUN npm ci --only=production \
    && npm cache clean --force \
    && rm -rf /tmp/*

# 复制源代码
COPY --chown=nextjs:nodejs src/ ./src/
COPY --chown=nextjs:nodejs public/ ./public/

USER nextjs

ENV NODE_ENV=production
EXPOSE 3000

CMD ["dumb-init", "node", "src/app.js"]
```

### .dockerignore文件

```dockerignore
# 版本控制
.git
.gitignore
.gitattributes

# 依赖目录
node_modules
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# 测试和覆盖率
coverage
.nyc_output
test
tests
__tests__
*.test.js
*.spec.js

# 开发工具
.vscode
.idea
*.swp
*.swo
*~

# 文档
README.md
CHANGELOG.md
LICENSE
docs

# 构建产物
dist
build
.next
.nuxt

# 环境配置
.env*
!.env.example

# 日志
logs
*.log

# 临时文件
.tmp
.temp
*.tmp
*.temp

# Docker相关
Dockerfile*
docker-compose*.yml
.dockerignore

# CI/CD
.github
.gitlab-ci.yml
.travis.yml
Jenkinsfile
```

## 🚀 实际应用示例

### Express应用完整Dockerfile

```dockerfile
# 多阶段构建 - Express应用
FROM node:18-alpine AS base

# 安装系统依赖
RUN apk add --no-cache \
    dumb-init \
    curl \
    && rm -rf /var/cache/apk/*

# 创建应用用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S express -u 1001 -G nodejs

WORKDIR /usr/src/app

# 依赖安装阶段
FROM base AS dependencies
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# 开发阶段
FROM dependencies AS development
RUN npm install
COPY . .
USER express
EXPOSE 3000
CMD ["npm", "run", "dev"]

# 构建阶段
FROM dependencies AS builder
COPY . .
RUN npm run build

# 生产阶段
FROM base AS production

# 复制生产依赖
COPY --from=dependencies --chown=express:nodejs /usr/src/app/node_modules ./node_modules

# 复制应用文件
COPY --from=builder --chown=express:nodejs /usr/src/app/dist ./dist
COPY --chown=express:nodejs package.json ./
COPY --chown=express:nodejs public ./public

# 设置用户和权限
USER express

# 环境变量
ENV NODE_ENV=production \
    PORT=3000 \
    LOG_LEVEL=info

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

EXPOSE 3000

# 启动应用
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/server.js"]
```

### Next.js应用Dockerfile

```dockerfile
FROM node:18-alpine AS base

# 安装系统依赖
RUN apk add --no-cache libc6-compat
WORKDIR /app

# 依赖安装
FROM base AS deps
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then yarn global add pnpm && pnpm i --frozen-lockfile; \
  else echo "Lockfile not found." && exit 1; \
  fi

# 构建阶段
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 禁用遥测
ENV NEXT_TELEMETRY_DISABLED 1

RUN yarn build

# 生产镜像
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# 自动利用输出跟踪来减少镜像大小
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

## 📝 构建和测试

### 构建命令

```bash
# 基本构建
docker build -t my-app:latest .

# 指定Dockerfile
docker build -f Dockerfile.prod -t my-app:prod .

# 传递构建参数
docker build \
  --build-arg NODE_VERSION=18 \
  --build-arg BUILD_DATE=$(date -u +'%Y-%m-%dT%H:%M:%SZ') \
  -t my-app:latest .

# 构建特定阶段
docker build --target production -t my-app:prod .

# 无缓存构建
docker build --no-cache -t my-app:latest .

# 使用BuildKit
DOCKER_BUILDKIT=1 docker build -t my-app:latest .
```

### 测试Dockerfile

```bash
# 运行容器测试
docker run --rm -p 3000:3000 my-app:latest

# 检查镜像大小
docker images my-app:latest

# 分析镜像层
docker history my-app:latest

# 安全扫描
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
  aquasec/trivy image my-app:latest

# 检查镜像漏洞
docker scout cves my-app:latest
```

## 📝 总结

编写高效的Dockerfile需要考虑：

- **性能优化**：利用构建缓存和多阶段构建
- **安全实践**：使用非root用户和最小权限原则
- **镜像大小**：选择合适的基础镜像和清理不必要文件
- **可维护性**：清晰的结构和适当的注释

掌握这些技巧能够构建出安全、高效、可维护的容器镜像。

## 🔗 相关资源

- [Dockerfile最佳实践](https://docs.docker.com/develop/dev-best-practices/)
- [Docker安全指南](https://docs.docker.com/engine/security/)
- [多阶段构建](https://docs.docker.com/develop/dev-best-practices/dockerfile_best-practices/)
- [Node.js Docker指南](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)
