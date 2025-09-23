# Docker Compose

## 🎯 学习目标

- 深入理解Docker Compose的概念和工作原理
- 掌握docker-compose.yml文件的编写技巧
- 学会多容器应用的编排和管理
- 了解服务发现、负载均衡和扩缩容机制

## 📚 Docker Compose概述

### 1. 什么是Docker Compose

```javascript
// Docker Compose概念
const dockerCompose = {
  definition: '用于定义和运行多容器Docker应用的工具',
  
  core_concepts: {
    service: '应用的组成部分，如web服务、数据库等',
    project: '一组相关联的服务',
    container: '服务的运行实例'
  },
  
  workflow: [
    '定义应用环境 (Dockerfile)',
    '定义服务组合 (docker-compose.yml)',
    '启动完整应用 (docker-compose up)'
  ],
  
  advantages: [
    '简化多容器应用部署',
    '环境一致性保证',
    '开发生产环境统一',
    '服务依赖管理',
    '一键启停扩缩容'
  ],
  
  use_cases: [
    '开发环境搭建',
    '自动化测试',
    '单机部署',
    '原型验证'
  ]
};

console.log('Docker Compose概念:', dockerCompose);
```

### 2. 基本命令

```bash
# 基础操作
docker-compose up                 # 启动所有服务
docker-compose up -d              # 后台启动
docker-compose up --build         # 重新构建并启动
docker-compose down               # 停止并删除容器
docker-compose down -v            # 同时删除数据卷

# 服务管理
docker-compose start              # 启动已存在的容器
docker-compose stop               # 停止服务
docker-compose restart            # 重启服务
docker-compose pause              # 暂停服务
docker-compose unpause            # 恢复服务

# 查看状态
docker-compose ps                 # 查看服务状态
docker-compose logs               # 查看日志
docker-compose logs -f web        # 实时查看web服务日志
docker-compose top                # 查看运行进程

# 执行命令
docker-compose exec web bash      # 进入web服务容器
docker-compose run web ls         # 在新容器中运行命令

# 扩缩容
docker-compose up --scale web=3   # 扩展web服务到3个实例
docker-compose scale web=2        # 缩减web服务到2个实例
```

## 📝 docker-compose.yml详解

### 1. 基本结构

```yaml
# docker-compose.yml基本结构
version: '3.8'  # Compose文件版本

services:       # 服务定义
  web:
    # 服务配置
  db:
    # 服务配置

volumes:        # 数据卷定义（可选）
  # 卷配置

networks:       # 网络定义（可选）
  # 网络配置

secrets:        # 密钥定义（可选）
  # 密钥配置

configs:        # 配置定义（可选）
  # 配置项
```

### 2. 服务配置详解

```yaml
version: '3.8'

services:
  web:
    # 镜像配置
    image: nginx:alpine              # 使用现有镜像
    # build: .                       # 或从Dockerfile构建
    
    # 构建配置
    build:
      context: .                     # 构建上下文
      dockerfile: Dockerfile.prod    # 指定Dockerfile
      args:                          # 构建参数
        NODE_ENV: production
        API_URL: https://api.example.com
      target: production             # 多阶段构建目标
    
    # 容器配置
    container_name: my-web-server    # 自定义容器名
    hostname: web-server             # 容器主机名
    
    # 端口映射
    ports:
      - "80:80"                      # 主机端口:容器端口
      - "443:443"
      - "127.0.0.1:8080:8080"       # 绑定特定IP
    
    # 环境变量
    environment:
      - NODE_ENV=production          # 数组格式
      - DEBUG=false
    # 或对象格式
    environment:
      NODE_ENV: production
      DEBUG: false
    
    # 环境变量文件
    env_file:
      - .env
      - .env.production
    
    # 数据卷
    volumes:
      - ./src:/app/src               # 绑定挂载
      - node_modules:/app/node_modules  # 命名卷
      - /tmp                         # 匿名卷
    
    # 网络配置
    networks:
      - frontend
      - backend
    
    # 依赖关系
    depends_on:
      - db
      - redis
    
    # 健康检查
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s
    
    # 重启策略
    restart: unless-stopped          # no, always, on-failure, unless-stopped
    
    # 资源限制
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 256M
    
    # 日志配置
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "3"
    
    # 安全配置
    user: "1000:1000"               # 用户ID:组ID
    read_only: true                 # 只读根文件系统
    tmpfs:
      - /tmp
      - /var/cache
    
    # 标签
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.web.rule=Host(`example.com`)"
```

### 3. 完整应用示例

```yaml
# docker-compose.yml - 完整的Web应用栈
version: '3.8'

services:
  # 前端服务
  frontend:
    build:
      context: ./frontend
      target: production
    container_name: myapp-frontend
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ssl-certs:/etc/ssl/certs:ro
    networks:
      - frontend
    depends_on:
      - backend
    restart: unless-stopped
    labels:
      - "com.example.description=Frontend service"
      - "com.example.department=engineering"

  # 后端API服务
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.prod
      args:
        NODE_ENV: production
    container_name: myapp-backend
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://app:${DB_PASSWORD}@database:5432/myapp
      REDIS_URL: redis://cache:6379
      JWT_SECRET: ${JWT_SECRET}
    env_file:
      - .env.production
    volumes:
      - app-uploads:/app/uploads
      - app-logs:/app/logs
    networks:
      - frontend
      - backend
    depends_on:
      database:
        condition: service_healthy
      cache:
        condition: service_started
    healthcheck:
      test: ["CMD", "node", "healthcheck.js"]
      interval: 30s
      timeout: 5s
      retries: 3
    restart: unless-stopped
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 1G

  # 数据库服务
  database:
    image: postgres:13
    container_name: myapp-database
    environment:
      POSTGRES_DB: myapp
      POSTGRES_USER: app
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./db/init.sql:/docker-entrypoint-initdb.d/init.sql:ro
    networks:
      - backend
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U app -d myapp"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped
    deploy:
      resources:
        limits:
          memory: 512M

  # 缓存服务
  cache:
    image: redis:alpine
    container_name: myapp-cache
    command: redis-server --appendonly yes
    volumes:
      - redis-data:/data
    networks:
      - backend
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 3
    restart: unless-stopped

  # 消息队列
  queue:
    image: rabbitmq:3-management
    container_name: myapp-queue
    environment:
      RABBITMQ_DEFAULT_USER: admin
      RABBITMQ_DEFAULT_PASS: ${RABBITMQ_PASSWORD}
    ports:
      - "15672:15672"  # 管理界面
    volumes:
      - rabbitmq-data:/var/lib/rabbitmq
    networks:
      - backend
    restart: unless-stopped

  # 工作进程
  worker:
    build:
      context: ./backend
      target: worker
    container_name: myapp-worker
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://app:${DB_PASSWORD}@database:5432/myapp
      REDIS_URL: redis://cache:6379
      RABBITMQ_URL: amqp://admin:${RABBITMQ_PASSWORD}@queue:5672
    volumes:
      - app-logs:/app/logs
    networks:
      - backend
    depends_on:
      - database
      - cache
      - queue
    restart: unless-stopped
    deploy:
      replicas: 2

# 数据卷定义
volumes:
  postgres-data:
    driver: local
  redis-data:
    driver: local
  rabbitmq-data:
    driver: local
  app-uploads:
    driver: local
  app-logs:
    driver: local
  ssl-certs:
    external: true  # 外部创建的卷

# 网络定义
networks:
  frontend:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16
  backend:
    driver: bridge
    internal: true  # 内部网络，无外网访问
```

## 🚀 高级功能

### 1. 多环境配置

```yaml
# docker-compose.yml (基础配置)
version: '3.8'

services:
  web:
    build: .
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: development
    volumes:
      - .:/app
      - /app/node_modules

  db:
    image: postgres:13
    environment:
      POSTGRES_DB: myapp_dev
      POSTGRES_PASSWORD: dev123
```

```yaml
# docker-compose.override.yml (开发环境覆盖)
version: '3.8'

services:
  web:
    volumes:
      - .:/app:cached  # macOS性能优化
    environment:
      DEBUG: true
      HOT_RELOAD: true
    command: npm run dev

  db:
    ports:
      - "5432:5432"  # 暴露数据库端口用于调试
```

```yaml
# docker-compose.prod.yml (生产环境)
version: '3.8'

services:
  web:
    image: myapp:${TAG:-latest}
    environment:
      NODE_ENV: production
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
    restart: unless-stopped

  db:
    environment:
      POSTGRES_DB: myapp_prod
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres-prod-data:/var/lib/postgresql/data

volumes:
  postgres-prod-data:
    external: true
```

### 2. 环境变量管理

```bash
# .env文件
COMPOSE_PROJECT_NAME=myapp
COMPOSE_FILE=docker-compose.yml:docker-compose.override.yml

# 应用配置
NODE_ENV=development
API_PORT=3000
DB_PASSWORD=secret123
JWT_SECRET=your-jwt-secret-here
RABBITMQ_PASSWORD=rabbitmq123

# Docker配置
TAG=latest
REGISTRY=myregistry.com
```

```bash
# .env.production
COMPOSE_PROJECT_NAME=myapp-prod
COMPOSE_FILE=docker-compose.yml:docker-compose.prod.yml

NODE_ENV=production
API_PORT=3000
DB_PASSWORD=super-secret-password
JWT_SECRET=production-jwt-secret
RABBITMQ_PASSWORD=production-rabbitmq-password

TAG=v1.2.3
REGISTRY=production-registry.com
```

### 3. 服务扩缩容

```bash
# 启动时指定副本数
docker-compose up --scale web=3 --scale worker=2

# 动态扩缩容
docker-compose scale web=5
docker-compose scale worker=3

# 使用配置文件定义副本数
# docker-compose.yml
services:
  web:
    deploy:
      replicas: 3
  worker:
    deploy:
      replicas: 2
```

## 🛠️ 实际应用场景

### 1. 微服务架构

```yaml
# docker-compose.microservices.yml
version: '3.8'

services:
  # API网关
  gateway:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./gateway/nginx.conf:/etc/nginx/nginx.conf:ro
    networks:
      - frontend
    depends_on:
      - user-service
      - order-service
      - product-service

  # 用户服务
  user-service:
    build: ./services/user-service
    environment:
      SERVICE_NAME: user-service
      DATABASE_URL: postgresql://user:${USER_DB_PASSWORD}@user-db:5432/users
    networks:
      - frontend
      - user-backend
    depends_on:
      - user-db

  user-db:
    image: postgres:13
    environment:
      POSTGRES_DB: users
      POSTGRES_USER: user
      POSTGRES_PASSWORD: ${USER_DB_PASSWORD}
    volumes:
      - user-db-data:/var/lib/postgresql/data
    networks:
      - user-backend

  # 订单服务
  order-service:
    build: ./services/order-service
    environment:
      SERVICE_NAME: order-service
      DATABASE_URL: postgresql://order:${ORDER_DB_PASSWORD}@order-db:5432/orders
      USER_SERVICE_URL: http://user-service:3000
    networks:
      - frontend
      - order-backend
    depends_on:
      - order-db

  order-db:
    image: postgres:13
    environment:
      POSTGRES_DB: orders
      POSTGRES_USER: order
      POSTGRES_PASSWORD: ${ORDER_DB_PASSWORD}
    volumes:
      - order-db-data:/var/lib/postgresql/data
    networks:
      - order-backend

  # 产品服务
  product-service:
    build: ./services/product-service
    environment:
      SERVICE_NAME: product-service
      DATABASE_URL: mongodb://product-db:27017/products
    networks:
      - frontend
      - product-backend
    depends_on:
      - product-db

  product-db:
    image: mongo:5.0
    volumes:
      - product-db-data:/data/db
    networks:
      - product-backend

  # 服务发现和配置
  consul:
    image: consul:latest
    ports:
      - "8500:8500"
    networks:
      - frontend
      - user-backend
      - order-backend
      - product-backend

volumes:
  user-db-data:
  order-db-data:
  product-db-data:

networks:
  frontend:
  user-backend:
    internal: true
  order-backend:
    internal: true
  product-backend:
    internal: true
```

### 2. 开发环境工具栈

```yaml
# docker-compose.dev.yml
version: '3.8'

services:
  # 应用服务
  app:
    build:
      context: .
      target: development
    volumes:
      - .:/app
      - /app/node_modules
    ports:
      - "3000:3000"
      - "9229:9229"  # Node.js调试端口
    environment:
      NODE_ENV: development
      DEBUG: app:*
    networks:
      - dev-network
    depends_on:
      - postgres
      - redis
      - mailhog

  # 数据库
  postgres:
    image: postgres:13
    environment:
      POSTGRES_DB: dev_db
      POSTGRES_USER: dev
      POSTGRES_PASSWORD: dev123
    ports:
      - "5432:5432"
    volumes:
      - postgres-dev-data:/var/lib/postgresql/data
      - ./db/init.sql:/docker-entrypoint-initdb.d/init.sql:ro
    networks:
      - dev-network

  # 缓存
  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
    networks:
      - dev-network

  # 邮件测试工具
  mailhog:
    image: mailhog/mailhog
    ports:
      - "1025:1025"  # SMTP
      - "8025:8025"  # Web UI
    networks:
      - dev-network

  # 数据库管理工具
  pgadmin:
    image: dpage/pgadmin4
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@example.com
      PGADMIN_DEFAULT_PASSWORD: admin123
    ports:
      - "5050:80"
    networks:
      - dev-network
    depends_on:
      - postgres

  # Redis管理工具
  redis-commander:
    image: rediscommander/redis-commander
    environment:
      REDIS_HOSTS: local:redis:6379
    ports:
      - "8081:8081"
    networks:
      - dev-network
    depends_on:
      - redis

  # 文档服务
  docs:
    image: nginx:alpine
    ports:
      - "8080:80"
    volumes:
      - ./docs:/usr/share/nginx/html:ro
    networks:
      - dev-network

volumes:
  postgres-dev-data:

networks:
  dev-network:
    driver: bridge
```

### 3. CI/CD测试环境

```yaml
# docker-compose.test.yml
version: '3.8'

services:
  # 测试数据库
  test-db:
    image: postgres:13
    environment:
      POSTGRES_DB: test_db
      POSTGRES_USER: test
      POSTGRES_PASSWORD: test123
    tmpfs:
      - /var/lib/postgresql/data  # 使用内存存储提高速度

  # 单元测试
  unit-tests:
    build:
      context: .
      target: test
    command: npm run test:unit
    volumes:
      - .:/app
      - /app/node_modules
    environment:
      NODE_ENV: test
    networks:
      - test-network

  # 集成测试
  integration-tests:
    build:
      context: .
      target: test
    command: npm run test:integration
    volumes:
      - .:/app
      - /app/node_modules
    environment:
      NODE_ENV: test
      DATABASE_URL: postgresql://test:test123@test-db:5432/test_db
    networks:
      - test-network
    depends_on:
      - test-db

  # E2E测试
  e2e-tests:
    build:
      context: .
      target: test
    command: npm run test:e2e
    volumes:
      - .:/app
      - /app/node_modules
    environment:
      NODE_ENV: test
      APP_URL: http://app:3000
    networks:
      - test-network
    depends_on:
      - app
      - test-db

  # 应用实例（用于E2E测试）
  app:
    build:
      context: .
      target: production
    environment:
      NODE_ENV: test
      DATABASE_URL: postgresql://test:test123@test-db:5432/test_db
    networks:
      - test-network
    depends_on:
      - test-db

networks:
  test-network:
    driver: bridge
```

## 🔧 调试和故障排除

### 1. 常见问题诊断

```bash
# 查看服务状态
docker-compose ps
docker-compose ps --services

# 查看服务日志
docker-compose logs
docker-compose logs -f web
docker-compose logs --tail=100 db

# 查看网络配置
docker-compose config
docker-compose config --services
docker-compose config --volumes

# 验证配置文件
docker-compose config --quiet  # 只验证，不输出

# 查看容器详细信息
docker-compose exec web env
docker-compose exec web ps aux
docker-compose exec web netstat -tulpn
```

### 2. 调试脚本

```bash
#!/bin/bash
# compose-debug.sh

PROJECT_NAME=${1:-$(basename $(pwd))}

echo "🔍 Docker Compose调试工具"
echo "项目: $PROJECT_NAME"
echo "=========================="

echo ""
echo "📋 服务状态:"
docker-compose ps

echo ""
echo "🌐 网络信息:"
docker network ls --filter name=${PROJECT_NAME}

echo ""
echo "💾 数据卷信息:"
docker volume ls --filter name=${PROJECT_NAME}

echo ""
echo "📊 资源使用:"
docker stats --no-stream $(docker-compose ps -q) 2>/dev/null

echo ""
echo "🔍 健康检查:"
for container in $(docker-compose ps -q); do
    name=$(docker inspect $container --format "{{.Name}}" | sed 's/\///')
    health=$(docker inspect $container --format "{{.State.Health.Status}}" 2>/dev/null)
    if [ "$health" != "" ]; then
        echo "  $name: $health"
    else
        echo "  $name: 无健康检查"
    fi
done

echo ""
echo "⚠️  错误检查:"
# 检查是否有退出的容器
exited=$(docker-compose ps --filter status=exited -q)
if [ ! -z "$exited" ]; then
    echo "发现退出的容器:"
    docker-compose ps --filter status=exited
else
    echo "✅ 所有容器正常运行"
fi

echo ""
echo "📝 最近日志:"
docker-compose logs --tail=10
```

### 3. 性能监控

```bash
#!/bin/bash
# compose-monitor.sh

echo "📊 Docker Compose性能监控"
echo "=========================="

# 实时监控
while true; do
    clear
    echo "监控时间: $(date)"
    echo ""
    
    echo "🏃 运行状态:"
    docker-compose ps --format "table {{.Name}}\t{{.State}}\t{{.Ports}}"
    
    echo ""
    echo "📈 资源使用:"
    docker stats --no-stream --format \
        "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.BlockIO}}" \
        $(docker-compose ps -q) 2>/dev/null
    
    echo ""
    echo "💾 存储使用:"
    docker system df
    
    sleep 5
done
```

## 📋 最佳实践

### 1. 配置文件组织

```bash
# 项目结构建议
project/
├── docker-compose.yml          # 基础配置
├── docker-compose.override.yml # 开发环境覆盖
├── docker-compose.prod.yml     # 生产环境配置
├── docker-compose.test.yml     # 测试环境配置
├── .env                        # 默认环境变量
├── .env.example               # 环境变量模板
├── .env.production            # 生产环境变量
└── compose/                   # 配置文件目录
    ├── nginx/
    │   └── nginx.conf
    ├── postgres/
    │   └── init.sql
    └── scripts/
        ├── backup.sh
        └── restore.sh
```

### 2. 安全最佳实践

```yaml
# 安全配置示例
version: '3.8'

services:
  web:
    build: .
    user: "1000:1000"              # 非root用户
    read_only: true                # 只读根文件系统
    tmpfs:
      - /tmp
      - /var/cache
    cap_drop:
      - ALL                        # 删除所有能力
    cap_add:
      - NET_BIND_SERVICE          # 只添加必要能力
    security_opt:
      - no-new-privileges:true     # 禁止提权
    secrets:
      - db_password               # 使用secrets管理敏感信息
    
secrets:
  db_password:
    file: ./secrets/db_password.txt
```

### 3. 生产环境配置

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  web:
    image: ${REGISTRY}/myapp:${TAG}
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s
    logging:
      driver: "json-file"
      options:
        max-size: "50m"
        max-file: "3"
```

## 📝 下一步

现在您已经掌握了Docker Compose，接下来学习：

1. **[Docker多阶段构建](./09-multi-stage-builds.md)** - 掌握高级构建技巧
2. **[Docker安全最佳实践](./10-docker-security.md)** - 学习安全配置

## 🎯 本章要点

- ✅ 理解Docker Compose的核心概念和工作原理
- ✅ 掌握docker-compose.yml文件的编写技巧
- ✅ 学会多环境配置和服务编排
- ✅ 了解扩缩容和服务管理机制
- ✅ 掌握调试、监控和最佳实践

继续深入学习Docker高级特性！🐳
