# Docker Compose

## Compose基础

Docker Compose是一个用于定义和运行多容器Docker应用程序的工具。通过YAML文件配置应用程序的服务，然后使用单个命令创建和启动所有服务。

## Compose的优势

### 1. 简化多容器管理

- 一个命令启动所有服务
- 统一的服务配置管理
- 自动服务依赖处理

### 2. 环境一致性

- 开发、测试、生产环境配置一致
- 版本控制友好的配置文件
- 可重复的部署过程

### 3. 服务编排

- 定义服务间关系
- 自动网络创建
- 数据卷管理

## Compose文件结构

### 基本结构

```yaml
version: '3.8'

services:
  web:
    image: nginx:alpine
    ports:
      - "8080:80"
    volumes:
      - ./html:/usr/share/nginx/html

  database:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: password
    volumes:
      - db-data:/var/lib/mysql

volumes:
  db-data:
```

### 版本说明

| 版本 | Docker Engine版本 | 主要特性 |
|------|------------------|----------|
| 3.8 | 19.03.0+ | 最新特性，推荐使用 |
| 3.7 | 18.06.0+ | 支持deploy配置 |
| 3.6 | 18.02.0+ | 支持外部网络 |
| 3.5 | 17.12.0+ | 支持secrets |

## 服务配置

### 基础配置

```yaml
services:
  web:
    # 镜像配置
    image: nginx:alpine
    
    # 构建配置
    build:
      context: .
      dockerfile: Dockerfile
      args:
        - VERSION=1.0
    
    # 容器名称
    container_name: my-web-app
    
    # 重启策略
    restart: unless-stopped
    
    # 环境变量
    environment:
      - NODE_ENV=production
      - PORT=3000
    
    # 环境变量文件
    env_file:
      - .env
      - .env.production
```

### 网络配置

```yaml
services:
  web:
    image: nginx:alpine
    networks:
      - frontend
      - backend
  
  database:
    image: mysql:8.0
    networks:
      - backend

networks:
  frontend:
    driver: bridge
  backend:
    driver: bridge
    internal: true
```

### 数据卷配置

```yaml
services:
  web:
    image: nginx:alpine
    volumes:
      # 命名数据卷
      - web-data:/usr/share/nginx/html
      # 绑定挂载
      - ./config:/etc/nginx/conf.d
      # 只读挂载
      - ./static:/usr/share/nginx/static:ro

  database:
    image: mysql:8.0
    volumes:
      - db-data:/var/lib/mysql
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql

volumes:
  web-data:
  db-data:
    driver: local
```

### 端口配置

```yaml
services:
  web:
    image: nginx:alpine
    ports:
      # 简单映射
      - "8080:80"
      # 指定IP
      - "127.0.0.1:8080:80"
      # 随机端口
      - "80"
      # UDP端口
      - "8080:80/udp"
```

## Compose命令

### 基本命令

```bash
# 启动服务
docker-compose up

# 后台启动服务
docker-compose up -d

# 构建并启动服务
docker-compose up --build

# 启动特定服务
docker-compose up web database

# 停止服务
docker-compose down

# 停止并删除数据卷
docker-compose down -v

# 停止并删除镜像
docker-compose down --rmi all
```

### 服务管理

```bash
# 启动服务
docker-compose start

# 停止服务
docker-compose stop

# 重启服务
docker-compose restart

# 重启特定服务
docker-compose restart web

# 查看服务状态
docker-compose ps

# 查看服务日志
docker-compose logs

# 实时查看日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs web
```

### 服务操作

```bash
# 进入服务容器
docker-compose exec web bash

# 在服务中执行命令
docker-compose exec web ls -la

# 扩展服务实例
docker-compose up --scale web=3

# 构建服务
docker-compose build

# 拉取服务镜像
docker-compose pull
```

## 实践练习

### 练习1：基础Web应用

创建`docker-compose.yml`：

```yaml
version: '3.8'

services:
  web:
    image: nginx:alpine
    ports:
      - "8080:80"
    volumes:
      - ./html:/usr/share/nginx/html
    restart: unless-stopped

  database:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: password
      MYSQL_DATABASE: myapp
      MYSQL_USER: user
      MYSQL_PASSWORD: password
    volumes:
      - db-data:/var/lib/mysql
    ports:
      - "3306:3306"
    restart: unless-stopped

volumes:
  db-data:
```

创建`html/index.html`：

```html
<!DOCTYPE html>
<html>
<head>
    <title>Docker Compose练习</title>
</head>
<body>
    <h1>Hello Docker Compose!</h1>
    <p>这是一个多容器应用示例</p>
</body>
</html>
```

运行应用：

```bash
# 启动服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs

# 停止服务
docker-compose down
```

### 练习2：Node.js应用

创建`docker-compose.yml`：

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://user:password@db:5432/myapp
    depends_on:
      - db
      - redis
    restart: unless-stopped

  db:
    image: postgres:13
    environment:
      POSTGRES_DB: myapp
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
    volumes:
      - postgres-data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:alpine
    volumes:
      - redis-data:/data
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - app
    restart: unless-stopped

volumes:
  postgres-data:
  redis-data:
```

创建`Dockerfile`：

```dockerfile
FROM node:16-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
```

创建`package.json`：

```json
{
  "name": "docker-compose-app",
  "version": "1.0.0",
  "description": "Docker Compose练习应用",
  "main": "app.js",
  "scripts": {
    "start": "node app.js"
  },
  "dependencies": {
    "express": "^4.18.0",
    "pg": "^8.7.0",
    "redis": "^4.0.0"
  }
}
```

创建`app.js`：

```javascript
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.json({
    message: 'Hello Docker Compose!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`应用运行在端口 ${port}`);
});
```

### 练习3：开发环境配置

创建`docker-compose.dev.yml`：

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile.dev
    ports:
      - "3000:3000"
    volumes:
      - .:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: postgres:13
    environment:
      POSTGRES_DB: myapp_dev
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
    volumes:
      - postgres-dev-data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    restart: unless-stopped

volumes:
  postgres-dev-data:
```

创建`Dockerfile.dev`：

```dockerfile
FROM node:16-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]
```

## 高级配置

### 健康检查

```yaml
services:
  web:
    image: nginx:alpine
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

### 资源限制

```yaml
services:
  web:
    image: nginx:alpine
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 256M
```

### 服务依赖

```yaml
services:
  web:
    image: nginx:alpine
    depends_on:
      - database
      - redis
    condition: service_healthy

  database:
    image: mysql:8.0
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 30s
      timeout: 10s
      retries: 3
```

## 环境管理

### 多环境配置

```yaml
# docker-compose.yml (基础配置)
version: '3.8'

services:
  web:
    image: nginx:alpine
    ports:
      - "${PORT:-8080}:80"
    environment:
      - NODE_ENV=${NODE_ENV:-production}

# docker-compose.override.yml (开发环境)
version: '3.8'

services:
  web:
    volumes:
      - ./html:/usr/share/nginx/html
    ports:
      - "8080:80"

# docker-compose.prod.yml (生产环境)
version: '3.8'

services:
  web:
    restart: always
    deploy:
      replicas: 3
```

### 环境变量文件

创建`.env`：

```
NODE_ENV=production
PORT=8080
DATABASE_URL=postgresql://user:password@db:5432/myapp
```

## 最佳实践

### 1. 文件组织

```
project/
├── docker-compose.yml
├── docker-compose.dev.yml
├── docker-compose.prod.yml
├── .env
├── .env.example
├── Dockerfile
├── Dockerfile.dev
└── services/
    ├── web/
    ├── api/
    └── database/
```

### 2. 安全配置

```yaml
services:
  web:
    image: nginx:alpine
    user: "1000:1000"
    read_only: true
    tmpfs:
      - /tmp
      - /var/cache/nginx
```

### 3. 性能优化

```yaml
services:
  web:
    image: nginx:alpine
    deploy:
      resources:
        limits:
          memory: 512M
        reservations:
          memory: 256M
```

## 常见问题

### 1. 服务启动失败

```bash
# 查看详细日志
docker-compose logs web

# 检查服务状态
docker-compose ps

# 重新构建服务
docker-compose up --build
```

### 2. 网络连接问题

```bash
# 检查网络配置
docker-compose exec web ping database

# 查看网络信息
docker network ls
docker network inspect project_default
```

### 3. 数据卷问题

```bash
# 检查数据卷
docker volume ls
docker volume inspect project_db-data

# 清理数据卷
docker-compose down -v
```

## 下一步

掌握Docker Compose后，您可以：

1. 继续学习 [Docker多阶段构建](./09-multi-stage-builds.md)
2. 学习Docker Swarm集群编排
3. 探索Kubernetes容器编排

## 学习检查点

完成本章学习后，您应该能够：

- [ ] 理解Docker Compose的基本概念和优势
- [ ] 熟练编写docker-compose.yml文件
- [ ] 掌握Compose命令的使用
- [ ] 了解多环境配置管理
- [ ] 解决Compose相关的常见问题
