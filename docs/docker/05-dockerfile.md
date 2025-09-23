# Dockerfile详解

## Dockerfile基础

Dockerfile是一个文本文件，包含了一系列指令，用于自动化构建Docker镜像。通过Dockerfile，我们可以定义镜像的构建过程，包括基础镜像、依赖安装、文件复制、环境配置等。

## Dockerfile指令

### 基础指令

#### FROM

指定基础镜像，必须是Dockerfile的第一个指令。

```dockerfile
# 使用官方镜像
FROM nginx:1.21

# 使用Alpine Linux（轻量级）
FROM alpine:3.14

# 使用多阶段构建
FROM node:16 AS builder
FROM nginx:alpine AS production
```

#### RUN

在镜像构建过程中执行命令。

```dockerfile
# 执行单个命令
RUN apt-get update

# 执行多个命令（推荐）
RUN apt-get update && \
    apt-get install -y curl && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# 使用shell形式
RUN /bin/bash -c 'source $HOME/.bashrc && echo $HOME'

# 使用exec形式（推荐）
RUN ["apt-get", "update"]
```

#### COPY

复制文件或目录到镜像中。

```dockerfile
# 复制文件
COPY package.json /app/

# 复制目录
COPY src/ /app/src/

# 复制多个文件
COPY package*.json ./

# 使用通配符
COPY *.txt /app/

# 保持文件权限
COPY --chown=user:group file.txt /app/
```

#### ADD

类似COPY，但功能更强大，支持URL和自动解压。

```dockerfile
# 复制文件（与COPY相同）
ADD package.json /app/

# 从URL下载文件
ADD https://example.com/file.tar.gz /app/

# 自动解压tar文件
ADD archive.tar.gz /app/

# 注意：优先使用COPY，除非需要ADD的特殊功能
```

#### WORKDIR

设置工作目录，后续指令将在此目录下执行。

```dockerfile
# 设置工作目录
WORKDIR /app

# 相对路径
WORKDIR src
WORKDIR ../dist

# 绝对路径
WORKDIR /usr/src/app
```

#### ENV

设置环境变量。

```dockerfile
# 设置单个环境变量
ENV NODE_ENV=production

# 设置多个环境变量
ENV NODE_ENV=production \
    PORT=3000 \
    DATABASE_URL=postgresql://localhost:5432/mydb

# 使用变量
ENV PATH=/usr/local/bin:$PATH
```

#### ARG

定义构建时参数，只在构建过程中有效。

```dockerfile
# 定义构建参数
ARG VERSION=latest
ARG BUILD_DATE

# 使用构建参数
FROM nginx:${VERSION}

# 构建时传递参数
# docker build --build-arg VERSION=1.21 .
```

### 运行时指令

#### CMD

指定容器启动时执行的默认命令。

```dockerfile
# shell形式
CMD echo "Hello World"

# exec形式（推荐）
CMD ["echo", "Hello World"]

# 作为ENTRYPOINT的参数
CMD ["--help"]
```

#### ENTRYPOINT

指定容器启动时的入口点。

```dockerfile
# shell形式
ENTRYPOINT echo "Hello"

# exec形式（推荐）
ENTRYPOINT ["echo", "Hello"]

# 与CMD结合使用
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["--help"]
```

#### EXPOSE

声明容器运行时监听的端口。

```dockerfile
# 声明单个端口
EXPOSE 80

# 声明多个端口
EXPOSE 80 443

# 声明协议
EXPOSE 80/tcp
EXPOSE 53/udp
```

### 其他指令

#### USER

指定运行容器时的用户。

```dockerfile
# 创建用户
RUN adduser -D -s /bin/sh appuser

# 切换到用户
USER appuser

# 使用UID
USER 1000
```

#### VOLUME

创建挂载点。

```dockerfile
# 创建单个挂载点
VOLUME ["/data"]

# 创建多个挂载点
VOLUME ["/data", "/logs"]
```

#### LABEL

添加元数据标签。

```dockerfile
# 添加标签
LABEL version="1.0"
LABEL description="My application"

# 添加多个标签
LABEL maintainer="developer@example.com" \
      version="1.0" \
      description="My application"
```

#### HEALTHCHECK

定义健康检查。

```dockerfile
# 使用命令检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/ || exit 1

# 禁用健康检查
HEALTHCHECK NONE
```

## 最佳实践

### 1. 多阶段构建

```dockerfile
# 构建阶段
FROM node:16 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# 运行阶段
FROM node:16-alpine AS production
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

### 2. 层缓存优化

```dockerfile
# 先复制依赖文件，利用缓存
COPY package*.json ./
RUN npm install

# 再复制源代码
COPY . .
RUN npm run build
```

### 3. 使用.dockerignore

创建`.dockerignore`文件：

```
node_modules
npm-debug.log
.git
.gitignore
README.md
.env
.nyc_output
coverage
.nyc_output
.coverage
```

### 4. 安全最佳实践

```dockerfile
# 使用非root用户
RUN adduser -D -s /bin/sh appuser
USER appuser

# 使用具体版本标签
FROM nginx:1.21-alpine

# 定期更新基础镜像
# 扫描漏洞
# 最小化攻击面
```

## 实践练习

### 练习1：创建简单的Web应用镜像

创建`Dockerfile`：

```dockerfile
FROM nginx:alpine

# 复制自定义配置
COPY nginx.conf /etc/nginx/nginx.conf

# 复制网站文件
COPY html/ /usr/share/nginx/html/

# 暴露端口
EXPOSE 80

# 启动命令
CMD ["nginx", "-g", "daemon off;"]
```

创建`nginx.conf`：

```nginx
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    
    server {
        listen 80;
        server_name localhost;
        
        location / {
            root /usr/share/nginx/html;
            index index.html;
        }
    }
}
```

创建`html/index.html`：

```html
<!DOCTYPE html>
<html>
<head>
    <title>Docker练习</title>
</head>
<body>
    <h1>Hello Docker!</h1>
    <p>这是一个Docker练习项目</p>
</body>
</html>
```

构建和运行：

```bash
# 构建镜像
docker build -t my-webapp:latest .

# 运行容器
docker run -d -p 8080:80 --name webapp my-webapp:latest

# 访问 http://localhost:8080
```

### 练习2：Node.js应用镜像

创建`Dockerfile`：

```dockerfile
FROM node:16-alpine

# 设置工作目录
WORKDIR /app

# 复制package文件
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production

# 复制源代码
COPY . .

# 创建非root用户
RUN adduser -D -s /bin/sh appuser && \
    chown -R appuser:appuser /app
USER appuser

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# 启动应用
CMD ["npm", "start"]
```

创建`package.json`：

```json
{
  "name": "docker-practice-app",
  "version": "1.0.0",
  "description": "Docker练习应用",
  "main": "app.js",
  "scripts": {
    "start": "node app.js"
  },
  "dependencies": {
    "express": "^4.18.0"
  }
}
```

创建`app.js`：

```javascript
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.json({ message: 'Hello Docker!', timestamp: new Date().toISOString() });
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`应用运行在端口 ${port}`);
});
```

### 练习3：多阶段构建

创建`Dockerfile`：

```dockerfile
# 构建阶段
FROM node:16 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# 生产阶段
FROM nginx:alpine AS production
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## 高级技巧

### 1. 构建参数和条件构建

```dockerfile
ARG NODE_ENV=production
ARG BUILD_DATE
ARG VCS_REF

FROM node:16-alpine

LABEL maintainer="developer@example.com" \
      build-date=$BUILD_DATE \
      vcs-ref=$VCS_REF

WORKDIR /app
COPY package*.json ./

# 根据环境安装依赖
RUN if [ "$NODE_ENV" = "development" ]; then \
        npm install; \
    else \
        npm ci --only=production; \
    fi

COPY . .

# 根据环境设置命令
CMD if [ "$NODE_ENV" = "development" ]; then \
        npm run dev; \
    else \
        npm start; \
    fi
```

### 2. 健康检查

```dockerfile
FROM nginx:alpine

COPY . /usr/share/nginx/html/

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### 3. 多架构构建

```dockerfile
FROM --platform=$BUILDPLATFORM node:16-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## 调试技巧

### 1. 构建调试

```bash
# 查看构建过程
docker build --no-cache -t myapp .

# 构建到特定阶段
docker build --target builder -t myapp:builder .

# 查看镜像层
docker history myapp:latest
```

### 2. 运行时调试

```bash
# 以调试模式运行
docker run -it --entrypoint /bin/sh myapp:latest

# 挂载源代码进行调试
docker run -v $(pwd):/app -it myapp:latest /bin/sh
```

## 常见问题

### 1. 构建失败

```bash
# 查看详细构建日志
docker build --no-cache --progress=plain -t myapp .

# 检查.dockerignore文件
cat .dockerignore
```

### 2. 镜像过大

```bash
# 分析镜像大小
docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"

# 使用多阶段构建
# 使用Alpine基础镜像
# 清理不必要的文件
```

### 3. 构建缓慢

```bash
# 使用构建缓存
# 优化Dockerfile层顺序
# 使用.dockerignore排除不必要文件
```

## 下一步

掌握Dockerfile后，您可以：

1. 继续学习 [Docker网络](./06-docker-networking.md)
2. 学习Docker Compose进行多容器管理
3. 探索CI/CD中的Docker使用

## 学习检查点

完成本章学习后，您应该能够：

- [ ] 理解Dockerfile的基本语法和指令
- [ ] 编写高效的Dockerfile
- [ ] 掌握多阶段构建技巧
- [ ] 了解Dockerfile最佳实践
- [ ] 解决Dockerfile相关问题
