# 容器化部署

## 📖 概述

容器化是现代应用部署的标准方式，通过将应用程序及其依赖项打包到轻量级、可移植的容器中，实现一致的运行环境。Docker 是最流行的容器化平台，为 Node.js 应用提供了完整的容器化解决方案。

## 🎯 学习目标

- 掌握 Docker 容器化基础
- 学习 Node.js 应用容器化最佳实践
- 了解多阶段构建和优化技巧
- 掌握容器编排和部署策略

## 🚀 Docker 基础

### 1. 基本 Dockerfile

```dockerfile
# 基础镜像
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 复制 package 文件
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production && npm cache clean --force

# 复制应用代码
COPY . .

# 创建非 root 用户
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# 更改文件所有者
RUN chown -R nextjs:nodejs /app
USER nextjs

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

# 启动命令
CMD ["node", "server.js"]
```

### 2. 多阶段构建

```dockerfile
# 多阶段构建 - 构建阶段
FROM node:18-alpine AS builder

WORKDIR /app

# 复制 package 文件
COPY package*.json ./

# 安装所有依赖（包括开发依赖）
RUN npm ci

# 复制源代码
COPY . .

# 构建应用
RUN npm run build

# 运行测试
RUN npm test

# 生产阶段
FROM node:18-alpine AS production

WORKDIR /app

# 复制 package 文件
COPY package*.json ./

# 只安装生产依赖
RUN npm ci --only=production && npm cache clean --force

# 从构建阶段复制构建结果
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public

# 复制必要的配置文件
COPY --from=builder /app/config ./config

# 创建用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# 更改所有者
RUN chown -R nextjs:nodejs /app
USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

CMD ["node", "dist/server.js"]
```

### 3. 优化的 Dockerfile

```dockerfile
# 使用特定版本的 Alpine 镜像
FROM node:18.17.0-alpine3.18

# 设置环境变量
ENV NODE_ENV=production
ENV NPM_CONFIG_LOGLEVEL=warn
ENV NPM_CONFIG_COLOR=false

# 安装系统依赖
RUN apk add --no-cache \
    dumb-init \
    curl \
    && rm -rf /var/cache/apk/*

# 创建应用目录
WORKDIR /app

# 创建用户和组
RUN addgroup -g 1001 -S nodejs && \
    adduser -S -D -H -u 1001 -s /sbin/nologin nodejs

# 复制 package 文件并安装依赖
COPY --chown=nodejs:nodejs package*.json ./
RUN npm ci --only=production --silent && \
    npm cache clean --force --silent

# 复制应用代码
COPY --chown=nodejs:nodejs . .

# 设置正确的权限
RUN chmod -R 755 /app

# 切换到非 root 用户
USER nodejs

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# 使用 dumb-init 作为 PID 1
ENTRYPOINT ["dumb-init", "--"]

# 启动应用
CMD ["node", "server.js"]
```

## 🔧 应用配置

### 1. 环境变量管理

```javascript
// config/index.js
const config = {
  // 服务器配置
  server: {
    port: parseInt(process.env.PORT) || 3000,
    host: process.env.HOST || '0.0.0.0',
    env: process.env.NODE_ENV || 'development'
  },
  
  // 数据库配置
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    name: process.env.DB_NAME || 'myapp',
    user: process.env.DB_USER || 'user',
    password: process.env.DB_PASSWORD || 'password',
    ssl: process.env.DB_SSL === 'true'
  },
  
  // Redis 配置
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || '',
    db: parseInt(process.env.REDIS_DB) || 0
  },
  
  // 日志配置
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json'
  },
  
  // 安全配置
  security: {
    jwtSecret: process.env.JWT_SECRET || 'default-secret',
    corsOrigins: process.env.CORS_ORIGINS ? 
      process.env.CORS_ORIGINS.split(',') : ['http://localhost:3000']
  }
};

// 验证必需的环境变量
const requiredEnvVars = [
  'DB_HOST',
  'DB_USER', 
  'DB_PASSWORD',
  'JWT_SECRET'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('缺少必需的环境变量:', missingVars.join(', '));
  process.exit(1);
}

module.exports = config;
```

### 2. 健康检查端点

```javascript
// healthcheck.js
const http = require('http');

const options = {
  host: 'localhost',
  port: process.env.PORT || 3000,
  path: '/health',
  timeout: 2000
};

const request = http.request(options, (res) => {
  console.log(`健康检查状态: ${res.statusCode}`);
  if (res.statusCode === 200) {
    process.exit(0);
  } else {
    process.exit(1);
  }
});

request.on('error', (err) => {
  console.error('健康检查失败:', err.message);
  process.exit(1);
});

request.end();

// server.js 中的健康检查路由
app.get('/health', async (req, res) => {
  const health = {
    status: 'UP',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    pid: process.pid,
    version: process.env.npm_package_version || '1.0.0'
  };
  
  try {
    // 检查数据库连接
    await checkDatabase();
    health.database = 'UP';
    
    // 检查 Redis 连接
    await checkRedis();
    health.redis = 'UP';
    
    res.status(200).json(health);
  } catch (error) {
    health.status = 'DOWN';
    health.error = error.message;
    res.status(503).json(health);
  }
});

async function checkDatabase() {
  // 数据库健康检查逻辑
  return new Promise((resolve, reject) => {
    // 执行简单查询
    db.query('SELECT 1', (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
}

async function checkRedis() {
  // Redis 健康检查逻辑
  return new Promise((resolve, reject) => {
    redis.ping((err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
}
```

### 3. 优雅关闭

```javascript
// server.js
const express = require('express');
const app = express();

let server;
let isShuttingDown = false;

// 启动服务器
function startServer() {
  server = app.listen(config.server.port, config.server.host, () => {
    console.log(`服务器运行在 ${config.server.host}:${config.server.port}`);
  });
  
  // 设置服务器超时
  server.timeout = 30000; // 30 秒
  server.keepAliveTimeout = 65000; // 65 秒
  server.headersTimeout = 66000; // 66 秒
}

// 优雅关闭处理
function gracefulShutdown(signal) {
  console.log(`收到 ${signal} 信号，开始优雅关闭...`);
  
  if (isShuttingDown) {
    console.log('已经在关闭过程中...');
    return;
  }
  
  isShuttingDown = true;
  
  // 停止接受新连接
  server.close((err) => {
    if (err) {
      console.error('关闭服务器时出错:', err);
      process.exit(1);
    }
    
    console.log('HTTP 服务器已关闭');
    
    // 关闭数据库连接
    if (db) {
      db.end(() => {
        console.log('数据库连接已关闭');
      });
    }
    
    // 关闭 Redis 连接
    if (redis) {
      redis.quit(() => {
        console.log('Redis 连接已关闭');
      });
    }
    
    console.log('优雅关闭完成');
    process.exit(0);
  });
  
  // 强制关闭超时
  setTimeout(() => {
    console.error('强制关闭超时，立即退出');
    process.exit(1);
  }, 30000);
}

// 注册信号处理
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// 处理未捕获的异常
process.on('uncaughtException', (err) => {
  console.error('未捕获的异常:', err);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的 Promise 拒绝:', reason);
  gracefulShutdown('unhandledRejection');
});

startServer();
```

## 🐳 Docker Compose

### 1. 基本 Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
      target: production
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DB_HOST=postgres
      - REDIS_HOST=redis
      - JWT_SECRET=your-jwt-secret
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    restart: unless-stopped
    networks:
      - app-network
    volumes:
      - ./logs:/app/logs
    healthcheck:
      test: ["CMD", "node", "healthcheck.js"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=myapp
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"
    restart: unless-stopped
    networks:
      - app-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U user -d myapp"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes --requirepass password
    volumes:
      - redis-data:/data
    ports:
      - "6379:6379"
    restart: unless-stopped
    networks:
      - app-network
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 3

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - app
    restart: unless-stopped
    networks:
      - app-network

volumes:
  postgres-data:
  redis-data:

networks:
  app-network:
    driver: bridge
```

### 2. 开发环境配置

```yaml
# docker-compose.dev.yml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile.dev
    ports:
      - "3000:3000"
      - "9229:9229"  # Node.js 调试端口
    environment:
      - NODE_ENV=development
      - DB_HOST=postgres
      - REDIS_HOST=redis
    volumes:
      - .:/app
      - /app/node_modules
    command: npm run dev
    depends_on:
      - postgres
      - redis
    networks:
      - app-network

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=myapp_dev
      - POSTGRES_USER=dev_user
      - POSTGRES_PASSWORD=dev_password
    volumes:
      - postgres-dev-data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    networks:
      - app-network

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    networks:
      - app-network

  adminer:
    image: adminer
    ports:
      - "8080:8080"
    depends_on:
      - postgres
    networks:
      - app-network

volumes:
  postgres-dev-data:

networks:
  app-network:
    driver: bridge
```

### 3. 开发用 Dockerfile

```dockerfile
# Dockerfile.dev
FROM node:18-alpine

WORKDIR /app

# 安装开发工具
RUN apk add --no-cache git

# 复制 package 文件
COPY package*.json ./

# 安装所有依赖
RUN npm install

# 复制源代码
COPY . .

# 暴露端口
EXPOSE 3000 9229

# 开发模式启动
CMD ["npm", "run", "dev"]
```

## 🔄 CI/CD 集成

### 1. GitHub Actions

```yaml
# .github/workflows/docker.yml
name: Docker Build and Deploy

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
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test
          POSTGRES_DB: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
      
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 3s
          --health-retries 5
        ports:
          - 6379:6379
    
    steps:
    - name: Checkout
      uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run linting
      run: npm run lint
    
    - name: Run tests
      run: npm test
      env:
        DB_HOST: localhost
        DB_PORT: 5432
        DB_NAME: test
        DB_USER: postgres
        DB_PASSWORD: test
        REDIS_HOST: localhost
        REDIS_PORT: 6379

  build:
    needs: test
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    
    steps:
    - name: Checkout
      uses: actions/checkout@v3
    
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
          type=sha,prefix={{branch}}-
    
    - name: Build and push Docker image
      uses: docker/build-push-action@v4
      with:
        context: .
        push: true
        tags: ${{ steps.meta.outputs.tags }}
        labels: ${{ steps.meta.outputs.labels }}
        cache-from: type=gha
        cache-to: type=gha,mode=max

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - name: Deploy to production
      uses: appleboy/ssh-action@v0.1.5
      with:
        host: ${{ secrets.HOST }}
        username: ${{ secrets.USERNAME }}
        key: ${{ secrets.SSH_KEY }}
        script: |
          cd /opt/myapp
          docker-compose pull
          docker-compose up -d
          docker system prune -f
```

### 2. 部署脚本

```bash
#!/bin/bash
# deploy.sh

set -e

# 配置变量
IMAGE_NAME="myapp"
CONTAINER_NAME="myapp-container"
PORT="3000"

echo "开始部署应用..."

# 构建新镜像
echo "构建 Docker 镜像..."
docker build -t $IMAGE_NAME:latest .

# 停止并移除旧容器
echo "停止旧容器..."
docker stop $CONTAINER_NAME 2>/dev/null || true
docker rm $CONTAINER_NAME 2>/dev/null || true

# 运行新容器
echo "启动新容器..."
docker run -d \
  --name $CONTAINER_NAME \
  --restart unless-stopped \
  -p $PORT:3000 \
  -e NODE_ENV=production \
  -e DB_HOST=host.docker.internal \
  -e REDIS_HOST=host.docker.internal \
  --health-cmd="node healthcheck.js" \
  --health-interval=30s \
  --health-timeout=10s \
  --health-retries=3 \
  $IMAGE_NAME:latest

# 等待容器启动
echo "等待容器启动..."
sleep 10

# 检查容器状态
if docker ps | grep -q $CONTAINER_NAME; then
  echo "✅ 部署成功！"
  docker logs --tail 20 $CONTAINER_NAME
else
  echo "❌ 部署失败！"
  docker logs $CONTAINER_NAME
  exit 1
fi

# 清理未使用的镜像
echo "清理未使用的镜像..."
docker image prune -f

echo "部署完成！"
```

## 📊 监控和日志

### 1. 日志配置

```javascript
// logger.js
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { 
    service: 'myapp',
    version: process.env.npm_package_version,
    hostname: require('os').hostname(),
    pid: process.pid
  },
  transports: [
    // 控制台输出（Docker 会捕获）
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// 生产环境添加文件日志
if (process.env.NODE_ENV === 'production') {
  logger.add(new winston.transports.File({
    filename: '/app/logs/error.log',
    level: 'error',
    maxsize: 5242880, // 5MB
    maxFiles: 5
  }));
  
  logger.add(new winston.transports.File({
    filename: '/app/logs/combined.log',
    maxsize: 5242880, // 5MB
    maxFiles: 5
  }));
}

module.exports = logger;
```

### 2. 监控集成

```yaml
# docker-compose.monitoring.yml
version: '3.8'

services:
  app:
    # ... 应用配置
    labels:
      - "prometheus.io/scrape=true"
      - "prometheus.io/port=3000"
      - "prometheus.io/path=/metrics"

  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
      - '--web.enable-lifecycle'
    networks:
      - app-network

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3001:3000"
    volumes:
      - grafana-data:/var/lib/grafana
      - ./grafana/dashboards:/etc/grafana/provisioning/dashboards
      - ./grafana/datasources:/etc/grafana/provisioning/datasources
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    networks:
      - app-network

  node-exporter:
    image: prom/node-exporter:latest
    ports:
      - "9100:9100"
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/rootfs:ro
    command:
      - '--path.procfs=/host/proc'
      - '--path.sysfs=/host/sys'
      - '--collector.filesystem.ignored-mount-points=^/(sys|proc|dev|host|etc)($$|/)'
    networks:
      - app-network

volumes:
  prometheus-data:
  grafana-data:
```

### 3. Prometheus 配置

```yaml
# prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  # - "first_rules.yml"
  # - "second_rules.yml"

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'node-app'
    static_configs:
      - targets: ['app:3000']
    metrics_path: '/metrics'
    scrape_interval: 5s

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']
```

## 🔒 安全最佳实践

### 1. 安全的 Dockerfile

```dockerfile
# 安全优化的 Dockerfile
FROM node:18-alpine AS base

# 更新系统包
RUN apk update && apk upgrade

# 安装安全更新
RUN apk add --no-cache dumb-init

# 创建应用目录
WORKDIR /app

# 创建非 root 用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S -D -H -u 1001 -s /sbin/nologin nodejs

# 构建阶段
FROM base AS builder

# 复制 package 文件
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production && \
    npm cache clean --force

# 复制应用代码
COPY . .

# 运行安全扫描
RUN npm audit --audit-level moderate

# 最终阶段
FROM base AS production

# 复制应用文件
COPY --from=builder --chown=nodejs:nodejs /app .

# 移除不必要的文件
RUN rm -rf /tmp/* /var/cache/apk/* /root/.npm

# 设置文件权限
RUN chmod -R 755 /app && \
    chmod 644 /app/package*.json

# 切换到非 root 用户
USER nodejs

# 暴露端口
EXPOSE 3000

# 使用 dumb-init
ENTRYPOINT ["dumb-init", "--"]

# 启动应用
CMD ["node", "server.js"]
```

### 2. 安全配置

```yaml
# docker-compose.security.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    security_opt:
      - no-new-privileges:true
    cap_drop:
      - ALL
    cap_add:
      - NET_BIND_SERVICE
    read_only: true
    tmpfs:
      - /tmp:noexec,nosuid,size=100m
      - /app/logs:noexec,nosuid,size=50m
    ulimits:
      nproc: 65535
      nofile:
        soft: 65535
        hard: 65535
    restart: unless-stopped
    networks:
      - app-network
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

networks:
  app-network:
    driver: bridge
    ipam:
      driver: default
      config:
        - subnet: 172.20.0.0/16
```

## 📚 最佳实践总结

1. **镜像优化**：使用多阶段构建，选择合适的基础镜像
2. **安全性**：使用非 root 用户，最小权限原则
3. **健康检查**：实现完整的健康检查机制
4. **优雅关闭**：正确处理信号，优雅关闭应用
5. **日志管理**：结构化日志，统一日志格式
6. **监控集成**：集成 Prometheus 和 Grafana
7. **环境管理**：使用环境变量管理配置
8. **CI/CD**：自动化构建、测试和部署流程

通过掌握这些容器化部署技术，您将能够构建安全、可靠、可扩展的容器化 Node.js 应用程序。
