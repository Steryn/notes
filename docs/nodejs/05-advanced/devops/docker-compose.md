# Docker Compose

## 📋 概述

Docker Compose是用于定义和运行多容器Docker应用程序的工具。通过YAML文件来配置应用程序的服务，然后使用一个命令创建并启动所有服务。

## 🎯 学习目标

- 掌握Docker Compose的核心概念
- 学会编写docker-compose.yml文件
- 了解服务编排和网络配置
- 掌握多环境部署策略

## 📚 核心概念

### 服务（Services）

应用程序的各个组件，每个服务运行一个镜像。

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    
  database:
    image: postgres:13
    environment:
      POSTGRES_DB: myapp
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
```

### 网络（Networks）

服务之间的通信通道。

```yaml
services:
  app:
    networks:
      - frontend
      - backend
  
  database:
    networks:
      - backend

networks:
  frontend:
    driver: bridge
  backend:
    driver: bridge
```

### 卷（Volumes）

持久化数据存储。

```yaml
services:
  database:
    image: postgres:13
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql

volumes:
  postgres_data:
```

## 🛠 Node.js应用完整示例

### 基础配置

```yaml
# docker-compose.yml
version: '3.8'

services:
  # Node.js应用
  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: node-app
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgres://user:password@postgres:5432/myapp
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis
    networks:
      - app-network
    volumes:
      - ./logs:/usr/src/app/logs
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 30s

  # PostgreSQL数据库
  postgres:
    image: postgres:13-alpine
    container_name: postgres-db
    restart: unless-stopped
    environment:
      POSTGRES_DB: myapp
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./docker/postgres/init.sql:/docker-entrypoint-initdb.d/init.sql
    networks:
      - app-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U user -d myapp"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Redis缓存
  redis:
    image: redis:7-alpine
    container_name: redis-cache
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
      - ./docker/redis/redis.conf:/usr/local/etc/redis/redis.conf
    command: redis-server /usr/local/etc/redis/redis.conf
    networks:
      - app-network
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 3

  # Nginx反向代理
  nginx:
    image: nginx:alpine
    container_name: nginx-proxy
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./docker/nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./docker/nginx/default.conf:/etc/nginx/conf.d/default.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    networks:
      - app-network

volumes:
  postgres_data:
  redis_data:

networks:
  app-network:
    driver: bridge
```

### 开发环境配置

```yaml
# docker-compose.dev.yml
version: '3.8'

services:
  app:
    build:
      context: .
      target: development
    container_name: node-app-dev
    environment:
      - NODE_ENV=development
      - DEBUG=app:*
    volumes:
      - .:/usr/src/app
      - /usr/src/app/node_modules
    command: npm run dev
    ports:
      - "3000:3000"
      - "9229:9229"  # 调试端口

  postgres:
    environment:
      POSTGRES_DB: myapp_dev
    ports:
      - "5433:5432"  # 避免与本地PostgreSQL冲突

  redis:
    ports:
      - "6380:6379"  # 避免与本地Redis冲突
```

### 生产环境配置

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  app:
    image: my-app:latest
    deploy:
      replicas: 3
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
    environment:
      - NODE_ENV=production
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  postgres:
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 2G
        reservations:
          cpus: '1.0'
          memory: 1G
    environment:
      POSTGRES_DB: myapp_prod

  nginx:
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 256M
```

## 🔧 高级配置

### 环境变量管理

```yaml
# .env文件
NODE_ENV=development
DATABASE_URL=postgres://user:password@postgres:5432/myapp
REDIS_URL=redis://redis:6379
JWT_SECRET=your-secret-key
API_PORT=3000

# docker-compose.yml中使用
services:
  app:
    environment:
      - NODE_ENV=${NODE_ENV}
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - JWT_SECRET=${JWT_SECRET}
    ports:
      - "${API_PORT}:3000"
```

### 多阶段构建集成

```yaml
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
      target: ${BUILD_TARGET:-production}
      args:
        - NODE_VERSION=${NODE_VERSION:-18}
        - BUILD_DATE=${BUILD_DATE}
        - VCS_REF=${VCS_REF}
    image: my-app:${TAG:-latest}
```

### 健康检查配置

```yaml
services:
  app:
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 30s
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy

  postgres:
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 3
```

### 网络配置

```yaml
services:
  app:
    networks:
      - frontend
      - backend

  postgres:
    networks:
      - backend

  nginx:
    networks:
      - frontend

networks:
  frontend:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16
  backend:
    driver: bridge
    internal: true  # 内部网络，不能访问外网
```

## 📊 监控和日志

### 日志配置

```yaml
services:
  app:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
        labels: "service=app"

  # 集中化日志收集
  logstash:
    image: logstash:7.17.0
    container_name: logstash
    volumes:
      - ./docker/logstash/logstash.conf:/usr/share/logstash/pipeline/logstash.conf
    ports:
      - "5044:5044"
    networks:
      - monitoring

  elasticsearch:
    image: elasticsearch:7.17.0
    container_name: elasticsearch
    environment:
      - discovery.type=single-node
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
    volumes:
      - elasticsearch_data:/usr/share/elasticsearch/data
    networks:
      - monitoring

  kibana:
    image: kibana:7.17.0
    container_name: kibana
    ports:
      - "5601:5601"
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
    depends_on:
      - elasticsearch
    networks:
      - monitoring

volumes:
  elasticsearch_data:

networks:
  monitoring:
    driver: bridge
```

### 监控配置

```yaml
services:
  # Prometheus监控
  prometheus:
    image: prom/prometheus:latest
    container_name: prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./docker/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
    networks:
      - monitoring

  # Grafana可视化
  grafana:
    image: grafana/grafana:latest
    container_name: grafana
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana_data:/var/lib/grafana
      - ./docker/grafana/dashboards:/etc/grafana/provisioning/dashboards
      - ./docker/grafana/datasources:/etc/grafana/provisioning/datasources
    depends_on:
      - prometheus
    networks:
      - monitoring

  # Node Exporter
  node-exporter:
    image: prom/node-exporter:latest
    container_name: node-exporter
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
      - monitoring

volumes:
  prometheus_data:
  grafana_data:
```

## 🚀 部署和管理

### 常用命令

```bash
# 启动所有服务
docker-compose up -d

# 指定配置文件
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f app

# 重启服务
docker-compose restart app

# 停止所有服务
docker-compose down

# 停止并删除卷
docker-compose down -v

# 构建镜像
docker-compose build

# 拉取最新镜像
docker-compose pull

# 扩展服务
docker-compose up -d --scale app=3
```

### 生产部署脚本

```bash
#!/bin/bash
# deploy.sh

set -e

# 设置环境变量
export NODE_ENV=production
export BUILD_DATE=$(date -u +'%Y-%m-%dT%H:%M:%SZ')
export VCS_REF=$(git rev-parse --short HEAD)
export TAG=${VCS_REF}

echo "🚀 Starting deployment..."

# 构建镜像
echo "📦 Building images..."
docker-compose -f docker-compose.yml -f docker-compose.prod.yml build

# 停止旧服务
echo "⏹️  Stopping old services..."
docker-compose -f docker-compose.yml -f docker-compose.prod.yml down

# 启动新服务
echo "▶️  Starting new services..."
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# 等待服务启动
echo "⏳ Waiting for services to be ready..."
sleep 30

# 健康检查
echo "🔍 Performing health checks..."
if curl -f http://localhost/health; then
    echo "✅ Deployment successful!"
else
    echo "❌ Deployment failed!"
    docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs
    exit 1
fi

# 清理旧镜像
echo "🧹 Cleaning up old images..."
docker image prune -f

echo "🎉 Deployment completed successfully!"
```

### 备份脚本

```bash
#!/bin/bash
# backup.sh

set -e

BACKUP_DIR="/backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p $BACKUP_DIR

echo "📦 Creating backup in $BACKUP_DIR"

# 备份数据库
echo "💾 Backing up PostgreSQL..."
docker-compose exec -T postgres pg_dump -U user myapp > $BACKUP_DIR/postgres.sql

# 备份Redis
echo "💾 Backing up Redis..."
docker-compose exec -T redis redis-cli BGSAVE
docker cp $(docker-compose ps -q redis):/data/dump.rdb $BACKUP_DIR/

# 备份应用数据
echo "💾 Backing up application data..."
docker cp $(docker-compose ps -q app):/usr/src/app/uploads $BACKUP_DIR/

# 压缩备份
echo "🗜️  Compressing backup..."
tar -czf $BACKUP_DIR.tar.gz -C $(dirname $BACKUP_DIR) $(basename $BACKUP_DIR)
rm -rf $BACKUP_DIR

echo "✅ Backup completed: $BACKUP_DIR.tar.gz"
```

## 🔍 调试和故障排除

### 调试技巧

```yaml
# 调试配置
services:
  app:
    # 覆盖命令进行调试
    command: ["sh", "-c", "while true; do sleep 30; done"]
    
    # 或者启用调试模式
    environment:
      - DEBUG=*
      - NODE_OPTIONS=--inspect=0.0.0.0:9229
    ports:
      - "9229:9229"  # 调试端口
```

```bash
# 进入容器调试
docker-compose exec app sh

# 查看容器日志
docker-compose logs -f app

# 查看所有服务状态
docker-compose ps

# 查看网络信息
docker network ls
docker network inspect $(docker-compose ps -q)_default

# 测试服务连接
docker-compose exec app ping postgres
docker-compose exec app nc -zv redis 6379
```

### 常见问题解决

#### 1. 端口冲突

```yaml
# 使用环境变量动态分配端口
services:
  app:
    ports:
      - "${APP_PORT:-3000}:3000"
  postgres:
    ports:
      - "${DB_PORT:-5432}:5432"
```

#### 2. 依赖启动顺序

```yaml
services:
  app:
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    restart: on-failure
```

#### 3. 数据持久化问题

```yaml
services:
  postgres:
    volumes:
      # 确保数据卷正确挂载
      - postgres_data:/var/lib/postgresql/data
      # 设置正确的权限
      - ./init:/docker-entrypoint-initdb.d:ro

volumes:
  postgres_data:
    driver: local
```

## 📝 最佳实践

### 1. 配置文件组织

```
project/
├── docker-compose.yml          # 基础配置
├── docker-compose.dev.yml      # 开发环境覆盖
├── docker-compose.prod.yml     # 生产环境覆盖
├── docker-compose.test.yml     # 测试环境覆盖
├── .env                        # 环境变量
├── .env.example                # 环境变量示例
└── docker/
    ├── nginx/
    │   ├── nginx.conf
    │   └── default.conf
    ├── postgres/
    │   └── init.sql
    └── redis/
        └── redis.conf
```

### 2. 环境隔离

```bash
# 开发环境
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# 生产环境
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# 测试环境
docker-compose -f docker-compose.yml -f docker-compose.test.yml up -d
```

### 3. 安全配置

```yaml
services:
  postgres:
    environment:
      POSTGRES_PASSWORD_FILE: /run/secrets/postgres_password
    secrets:
      - postgres_password

secrets:
  postgres_password:
    file: ./secrets/postgres_password.txt
```

## 📝 总结

Docker Compose提供了强大的多容器应用编排能力：

- **简化部署**：一个命令启动整个应用栈
- **环境一致性**：开发、测试、生产环境配置统一
- **服务发现**：自动的服务间网络通信
- **扩展性**：轻松扩展和管理服务实例

是现代微服务架构和容器化部署的重要工具。

## 🔗 相关资源

- [Docker Compose官方文档](https://docs.docker.com/compose/)
- [Compose文件参考](https://docs.docker.com/compose/compose-file/)
- [Docker Compose最佳实践](https://docs.docker.com/compose/production/)
- [示例项目](https://github.com/docker/awesome-compose)
