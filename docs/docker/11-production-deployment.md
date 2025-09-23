# Docker生产环境部署

## 生产环境概述

生产环境部署需要考虑高可用性、可扩展性、监控、日志、备份等多个方面。本章将介绍Docker在生产环境中的最佳实践。

## 部署架构

### 1. 单机部署

```
┌─────────────────────────────────┐
│           主机服务器              │
│  ┌─────────┐  ┌─────────┐       │
│  │  Web    │  │   DB    │       │
│  │ Container│  │Container│       │
│  └─────────┘  └─────────┘       │
│  ┌─────────┐  ┌─────────┐       │
│  │  Cache  │  │  Proxy  │       │
│  │ Container│  │Container│       │
│  └─────────┘  └─────────┘       │
└─────────────────────────────────┘
```

### 2. 集群部署

```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│   节点1      │  │   节点2      │  │   节点3      │
│ ┌─────────┐ │  │ ┌─────────┐ │  │ ┌─────────┐ │
│ │  Web    │ │  │ │  Web    │ │  │ │  Web    │ │
│ │Container│ │  │ │Container│ │  │ │Container│ │
│ └─────────┘ │  │ └─────────┘ │  │ └─────────┘ │
└─────────────┘  └─────────────┘  └─────────────┘
        │               │               │
        └───────────────┼───────────────┘
                        │
                ┌─────────────┐
                │  负载均衡器   │
                └─────────────┘
```

## 生产环境配置

### 1. Docker Compose生产配置

创建`docker-compose.prod.yml`：

```yaml
version: '3.8'

services:
  web:
    image: myapp:${VERSION}
    restart: unless-stopped
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 256M
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
    networks:
      - frontend
      - backend
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  database:
    image: postgres:13
    restart: unless-stopped
    environment:
      POSTGRES_DB: ${DB_NAME}
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./backups:/backups
    networks:
      - backend
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER} -d ${DB_NAME}"]
      interval: 30s
      timeout: 10s
      retries: 3

  redis:
    image: redis:alpine
    restart: unless-stopped
    command: redis-server --appendonly yes
    volumes:
      - redis-data:/data
    networks:
      - backend
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3

  nginx:
    image: nginx:alpine
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
      - nginx-logs:/var/log/nginx
    depends_on:
      - web
    networks:
      - frontend
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost/health"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  postgres-data:
    driver: local
  redis-data:
    driver: local
  nginx-logs:
    driver: local

networks:
  frontend:
    driver: bridge
  backend:
    driver: bridge
    internal: true
```

### 2. 环境变量配置

创建`.env.prod`：

```bash
# 应用配置
VERSION=1.0.0
NODE_ENV=production

# 数据库配置
DB_NAME=myapp_prod
DB_USER=myapp_user
DB_PASSWORD=secure_password_here
DATABASE_URL=postgresql://myapp_user:secure_password_here@database:5432/myapp_prod

# Redis配置
REDIS_URL=redis://redis:6379

# SSL配置
SSL_CERT_PATH=/etc/nginx/ssl/cert.pem
SSL_KEY_PATH=/etc/nginx/ssl/key.pem
```

### 3. Nginx配置

创建`nginx.conf`：

```nginx
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # 日志格式
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;
    error_log /var/log/nginx/error.log warn;

    # 基本配置
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;

    # Gzip压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    # 上游服务器
    upstream web_backend {
        server web:3000 max_fails=3 fail_timeout=30s;
        keepalive 32;
    }

    # HTTP重定向到HTTPS
    server {
        listen 80;
        server_name example.com;
        return 301 https://$server_name$request_uri;
    }

    # HTTPS服务器
    server {
        listen 443 ssl http2;
        server_name example.com;

        # SSL配置
        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
        ssl_prefer_server_ciphers off;

        # 安全头
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header X-XSS-Protection "1; mode=block";
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

        # 健康检查
        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }

        # 代理到后端
        location / {
            proxy_pass http://web_backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
            proxy_connect_timeout 30s;
            proxy_send_timeout 30s;
            proxy_read_timeout 30s;
        }
    }
}
```

## 部署流程

### 1. 自动化部署脚本

创建`deploy.sh`：

```bash
#!/bin/bash

set -e

# 配置变量
APP_NAME="myapp"
VERSION=${1:-latest}
ENVIRONMENT=${2:-production}

echo "开始部署 $APP_NAME:$VERSION 到 $ENVIRONMENT 环境"

# 1. 拉取最新镜像
echo "拉取镜像..."
docker pull $APP_NAME:$VERSION

# 2. 备份数据库
echo "备份数据库..."
docker-compose -f docker-compose.prod.yml exec -T database pg_dump -U $DB_USER $DB_NAME > backup_$(date +%Y%m%d_%H%M%S).sql

# 3. 停止旧服务
echo "停止旧服务..."
docker-compose -f docker-compose.prod.yml down

# 4. 启动新服务
echo "启动新服务..."
docker-compose -f docker-compose.prod.yml up -d

# 5. 等待服务启动
echo "等待服务启动..."
sleep 30

# 6. 健康检查
echo "执行健康检查..."
if curl -f http://localhost/health; then
    echo "部署成功！"
else
    echo "部署失败，回滚..."
    docker-compose -f docker-compose.prod.yml down
    docker-compose -f docker-compose.prod.yml up -d
    exit 1
fi

# 7. 清理旧镜像
echo "清理旧镜像..."
docker image prune -f

echo "部署完成！"
```

### 2. 蓝绿部署

创建`blue-green-deploy.sh`：

```bash
#!/bin/bash

set -e

APP_NAME="myapp"
VERSION=${1:-latest}

# 确定当前环境
if docker-compose -f docker-compose.blue.yml ps | grep -q "Up"; then
    CURRENT="blue"
    NEW="green"
    CURRENT_FILE="docker-compose.blue.yml"
    NEW_FILE="docker-compose.green.yml"
else
    CURRENT="green"
    NEW="blue"
    CURRENT_FILE="docker-compose.green.yml"
    NEW_FILE="docker-compose.blue.yml"
fi

echo "当前环境: $CURRENT, 部署到: $NEW"

# 1. 启动新环境
echo "启动新环境..."
docker-compose -f $NEW_FILE up -d

# 2. 等待新环境启动
echo "等待新环境启动..."
sleep 30

# 3. 健康检查
echo "执行健康检查..."
if curl -f http://localhost:8081/health; then
    echo "新环境健康检查通过"
else
    echo "新环境健康检查失败，停止部署"
    docker-compose -f $NEW_FILE down
    exit 1
fi

# 4. 切换流量
echo "切换流量..."
# 这里需要更新负载均衡器配置

# 5. 停止旧环境
echo "停止旧环境..."
docker-compose -f $CURRENT_FILE down

echo "蓝绿部署完成！"
```

## 监控和日志

### 1. 监控配置

创建`docker-compose.monitoring.yml`：

```yaml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus
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
      - '--storage.tsdb.retention.time=200h'
      - '--web.enable-lifecycle'

  grafana:
    image: grafana/grafana
    ports:
      - "3000:3000"
    volumes:
      - grafana-data:/var/lib/grafana
      - ./grafana/dashboards:/etc/grafana/provisioning/dashboards
      - ./grafana/datasources:/etc/grafana/provisioning/datasources
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin

  node-exporter:
    image: prom/node-exporter
    ports:
      - "9100:9100"
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/rootfs:ro
    command:
      - '--path.procfs=/host/proc'
      - '--path.rootfs=/rootfs'
      - '--path.sysfs=/host/sys'
      - '--collector.filesystem.mount-points-exclude=^/(sys|proc|dev|host|etc)($$|/)'

volumes:
  prometheus-data:
  grafana-data:
```

### 2. 日志管理

创建`docker-compose.logging.yml`：

```yaml
version: '3.8'

services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:7.14.0
    environment:
      - discovery.type=single-node
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
    volumes:
      - elasticsearch-data:/usr/share/elasticsearch/data
    ports:
      - "9200:9200"

  logstash:
    image: docker.elastic.co/logstash/logstash:7.14.0
    volumes:
      - ./logstash.conf:/usr/share/logstash/pipeline/logstash.conf
    ports:
      - "5044:5044"
    depends_on:
      - elasticsearch

  kibana:
    image: docker.elastic.co/kibana/kibana:7.14.0
    ports:
      - "5601:5601"
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
    depends_on:
      - elasticsearch

  filebeat:
    image: docker.elastic.co/beats/filebeat:7.14.0
    user: root
    volumes:
      - ./filebeat.yml:/usr/share/filebeat/filebeat.yml:ro
      - /var/lib/docker/containers:/var/lib/docker/containers:ro
      - /var/run/docker.sock:/var/run/docker.sock:ro
    depends_on:
      - logstash

volumes:
  elasticsearch-data:
```

## 备份和恢复

### 1. 数据备份脚本

创建`backup.sh`：

```bash
#!/bin/bash

set -e

BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)

echo "开始备份..."

# 1. 备份数据库
echo "备份数据库..."
docker-compose -f docker-compose.prod.yml exec -T database pg_dump -U $DB_USER $DB_NAME > $BACKUP_DIR/database_$DATE.sql

# 2. 备份Redis数据
echo "备份Redis数据..."
docker-compose -f docker-compose.prod.yml exec -T redis redis-cli BGSAVE
docker cp $(docker-compose -f docker-compose.prod.yml ps -q redis):/data/dump.rdb $BACKUP_DIR/redis_$DATE.rdb

# 3. 备份配置文件
echo "备份配置文件..."
tar -czf $BACKUP_DIR/config_$DATE.tar.gz docker-compose.prod.yml nginx.conf .env.prod

# 4. 清理旧备份（保留7天）
echo "清理旧备份..."
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.rdb" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "备份完成！"
```

### 2. 数据恢复脚本

创建`restore.sh`：

```bash
#!/bin/bash

set -e

BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
    echo "请指定备份文件"
    exit 1
fi

echo "开始恢复 $BACKUP_FILE..."

# 1. 停止服务
echo "停止服务..."
docker-compose -f docker-compose.prod.yml down

# 2. 恢复数据库
echo "恢复数据库..."
docker-compose -f docker-compose.prod.yml up -d database
sleep 30
docker-compose -f docker-compose.prod.yml exec -T database psql -U $DB_USER -d $DB_NAME < $BACKUP_FILE

# 3. 启动所有服务
echo "启动所有服务..."
docker-compose -f docker-compose.prod.yml up -d

echo "恢复完成！"
```

## 性能优化

### 1. 资源优化

```yaml
# docker-compose.prod.yml
services:
  web:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
    ulimits:
      nofile:
        soft: 65536
        hard: 65536
```

### 2. 网络优化

```yaml
networks:
  frontend:
    driver: bridge
    driver_opts:
      com.docker.network.bridge.enable_icc: "true"
      com.docker.network.bridge.enable_ip_masquerade: "true"
      com.docker.network.bridge.host_binding_ipv4: "0.0.0.0"
```

## 常见问题

### 1. 服务启动失败

```bash
# 查看服务状态
docker-compose -f docker-compose.prod.yml ps

# 查看服务日志
docker-compose -f docker-compose.prod.yml logs web

# 检查资源使用
docker stats
```

### 2. 数据库连接问题

```bash
# 检查数据库状态
docker-compose -f docker-compose.prod.yml exec database pg_isready

# 检查网络连接
docker-compose -f docker-compose.prod.yml exec web ping database
```

### 3. 性能问题

```bash
# 监控资源使用
docker stats --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"

# 检查网络延迟
docker-compose -f docker-compose.prod.yml exec web ping database
```

## 下一步

掌握生产环境部署后，您可以：

1. 继续学习 [Docker监控与日志](./12-monitoring-logging.md)
2. 学习容器编排工具如Kubernetes
3. 探索云原生部署最佳实践

## 学习检查点

完成本章学习后，您应该能够：

- [ ] 理解生产环境部署的架构和配置
- [ ] 掌握自动化部署流程
- [ ] 了解监控、日志和备份策略
- [ ] 能够进行性能优化和故障排除
- [ ] 解决生产环境相关问题
