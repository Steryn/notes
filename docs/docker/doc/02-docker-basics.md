# Docker基本概念

## 🎯 学习目标

- 深入理解Docker的核心概念
- 掌握镜像、容器、仓库的关系
- 学会使用基本的Docker命令
- 了解Docker的分层架构和存储原理

## 📚 核心概念详解

### 1. 镜像（Images）

Docker镜像是一个只读的模板，包含了运行应用程序所需的所有内容。

```javascript
// 镜像概念解析
const dockerImage = {
  definition: '只读的应用程序模板',
  
  characteristics: {
    layered: '分层存储结构',
    immutable: '不可变性',
    cacheable: '可缓存复用',
    portable: '跨平台移植'
  },
  
  structure: {
    baseLayer: '基础操作系统层',
    appLayer: '应用程序层',
    configLayer: '配置文件层',
    metadataLayer: '元数据层'
  },
  
  naming: {
    format: 'registry/namespace/repository:tag',
    examples: [
      'nginx:latest',
      'node:16-alpine',
      'mysql:8.0',
      'ubuntu:20.04'
    ]
  }
};

console.log('Docker镜像概念:', dockerImage);
```

#### 镜像分层架构

```bash
# 查看镜像层级结构
docker history nginx:latest

# 查看镜像详细信息
docker inspect nginx:latest

# 查看镜像大小
docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"
```

```mermaid
graph TD
    A[应用层] --> B[依赖层]
    B --> C[运行时层]
    C --> D[基础OS层]
    D --> E[内核层]
    
    style A fill:#ff9999
    style B fill:#ffcc99
    style C fill:#ffff99
    style D fill:#ccffcc
    style E fill:#ccccff
```

### 2. 容器（Containers）

容器是镜像的运行实例，提供了隔离的运行环境。

```javascript
// 容器概念解析
const dockerContainer = {
  definition: '镜像的可运行实例',
  
  lifecycle: {
    created: '容器已创建但未启动',
    running: '容器正在运行',
    paused: '容器已暂停',
    stopped: '容器已停止',
    deleted: '容器已删除'
  },
  
  features: {
    isolation: '进程和文件系统隔离',
    networking: '独立的网络栈',
    storage: '可写的容器层',
    resources: 'CPU和内存限制'
  },
  
  components: {
    process: '主进程和子进程',
    filesystem: '联合文件系统',
    network: '虚拟网络接口',
    metadata: '容器配置信息'
  }
};

console.log('Docker容器概念:', dockerContainer);
```

#### 容器生命周期管理

```bash
# 创建容器（不启动）
docker create --name my-nginx nginx:latest

# 启动容器
docker start my-nginx

# 创建并启动容器
docker run --name web-server -d -p 8080:80 nginx:latest

# 查看容器状态
docker ps                 # 运行中的容器
docker ps -a             # 所有容器
docker ps -q             # 只显示容器ID

# 暂停和恢复容器
docker pause my-nginx
docker unpause my-nginx

# 停止容器
docker stop my-nginx      # 优雅停止
docker kill my-nginx      # 强制停止

# 重启容器
docker restart my-nginx

# 删除容器
docker rm my-nginx        # 删除已停止的容器
docker rm -f my-nginx     # 强制删除运行中的容器
```

### 3. 仓库（Registry）

Docker仓库是存储和分发镜像的服务。

```javascript
// 仓库概念解析
const dockerRegistry = {
  definition: '镜像存储和分发服务',
  
  types: {
    public: {
      'Docker Hub': 'hub.docker.com - 官方公共仓库',
      'Quay.io': 'quay.io - Red Hat的容器仓库',
      'GitHub Container Registry': 'ghcr.io - GitHub容器仓库'
    },
    private: {
      'Harbor': '企业级私有仓库',
      'Nexus': 'Sonatype的制品仓库',
      'AWS ECR': 'Amazon弹性容器仓库'
    }
  },
  
  structure: {
    namespace: '命名空间/组织',
    repository: '镜像仓库',
    tag: '版本标签',
    manifest: '镜像清单'
  },
  
  operations: {
    push: '推送镜像到仓库',
    pull: '从仓库拉取镜像',
    search: '搜索镜像',
    login: '登录仓库认证'
  }
};

console.log('Docker仓库概念:', dockerRegistry);
```

#### 仓库操作示例

```bash
# 搜索镜像
docker search nginx

# 拉取镜像
docker pull nginx:latest
docker pull nginx:1.21-alpine

# 查看本地镜像
docker images
docker images nginx

# 给镜像打标签
docker tag nginx:latest myregistry.com/nginx:v1.0

# 推送镜像到仓库
docker login myregistry.com
docker push myregistry.com/nginx:v1.0

# 删除本地镜像
docker rmi nginx:latest
docker rmi -f nginx:latest    # 强制删除
```

## 🔧 基本Docker命令

### 信息查看命令

```bash
# 系统信息
docker info                  # Docker系统信息
docker version              # Docker版本信息
docker system df            # 磁盘使用情况
docker system events        # 实时事件流

# 帮助信息
docker --help               # Docker帮助
docker run --help           # 具体命令帮助
```

### 镜像管理命令

```bash
# 镜像操作
docker images                           # 列出镜像
docker images -a                        # 显示所有镜像（包括中间层）
docker images --filter "dangling=true"  # 显示悬空镜像
docker images --format "json"           # JSON格式输出

# 镜像清理
docker image prune                      # 清理悬空镜像
docker image prune -a                   # 清理未使用的镜像
docker rmi $(docker images -q)         # 删除所有镜像
```

### 容器管理命令

```bash
# 容器运行
docker run nginx                        # 前台运行
docker run -d nginx                     # 后台运行
docker run -it ubuntu bash             # 交互式运行
docker run --rm ubuntu echo "hello"    # 运行后自动删除

# 容器操作
docker exec -it container_name bash    # 进入运行中的容器
docker attach container_name           # 附加到容器主进程
docker logs container_name             # 查看容器日志
docker logs -f container_name          # 实时查看日志

# 容器清理
docker container prune                  # 清理停止的容器
docker rm $(docker ps -aq)            # 删除所有容器
```

### 网络和存储命令

```bash
# 网络管理
docker network ls                       # 列出网络
docker network create my-network       # 创建网络
docker network inspect bridge          # 查看网络详情
docker network rm my-network           # 删除网络

# 存储管理
docker volume ls                        # 列出数据卷
docker volume create my-volume         # 创建数据卷
docker volume inspect my-volume        # 查看数据卷详情
docker volume rm my-volume             # 删除数据卷
```

## 🛠️ 实际操作示例

### 1. 运行Web服务器

```bash
# 运行Nginx服务器
docker run -d \
  --name web-server \
  -p 8080:80 \
  -v $(pwd)/html:/usr/share/nginx/html:ro \
  nginx:alpine

# 创建测试页面
mkdir -p html
echo "<h1>Hello Docker!</h1>" > html/index.html

# 访问服务
curl http://localhost:8080

# 查看容器日志
docker logs web-server

# 进入容器
docker exec -it web-server sh
```

### 2. 运行数据库

```bash
# 运行MySQL数据库
docker run -d \
  --name mysql-db \
  -e MYSQL_ROOT_PASSWORD=my-secret-pw \
  -e MYSQL_DATABASE=testdb \
  -p 3306:3306 \
  -v mysql-data:/var/lib/mysql \
  mysql:8.0

# 连接数据库
docker exec -it mysql-db mysql -uroot -p

# 查看数据库容器资源使用
docker stats mysql-db
```

### 3. 多容器应用

```bash
# 创建网络
docker network create app-network

# 运行数据库
docker run -d \
  --name app-db \
  --network app-network \
  -e POSTGRES_DB=appdb \
  -e POSTGRES_USER=appuser \
  -e POSTGRES_PASSWORD=apppass \
  postgres:13

# 运行应用
docker run -d \
  --name app-server \
  --network app-network \
  -p 3000:3000 \
  -e DATABASE_URL=postgresql://appuser:apppass@app-db:5432/appdb \
  node:16-alpine \
  sh -c "npm start"

# 查看网络连接
docker network inspect app-network
```

## 📊 Docker分层存储

### 联合文件系统（Union File System）

```mermaid
graph TD
    A[容器层 - 可写] --> B[镜像层4 - 只读]
    B --> C[镜像层3 - 只读]
    C --> D[镜像层2 - 只读]
    D --> E[镜像层1 - 只读]
    E --> F[基础层 - 只读]
    
    style A fill:#ff9999
    style B fill:#ffcc99
    style C fill:#ffff99
    style D fill:#ccffcc
    style E fill:#ccccff
    style F fill:#e6ccff
```

### 存储驱动程序

```bash
# 查看存储驱动
docker info | grep "Storage Driver"

# 常见存储驱动
# overlay2 - 推荐的存储驱动
# aufs - 旧版Ubuntu默认
# devicemapper - CentOS/RHEL默认
# btrfs - SUSE默认
```

### 写时复制（Copy-on-Write）

```javascript
// 写时复制机制
const copyOnWrite = {
  principle: '只有在修改文件时才复制到容器层',
  
  benefits: [
    '节省存储空间',
    '快速启动容器',
    '高效镜像分享'
  ],
  
  process: {
    read: '直接从镜像层读取文件',
    write: '复制文件到容器层再修改',
    delete: '在容器层创建删除标记'
  },
  
  optimization: [
    '使用.dockerignore减少构建上下文',
    '合并RUN指令减少层数',
    '使用多阶段构建优化镜像大小'
  ]
};

console.log('写时复制机制:', copyOnWrite);
```

## 🔍 容器监控和调试

### 容器状态监控

```bash
# 实时监控容器资源使用
docker stats

# 监控特定容器
docker stats web-server mysql-db

# 查看容器进程
docker top web-server

# 查看容器文件系统变化
docker diff web-server

# 查看容器端口映射
docker port web-server
```

### 容器调试技巧

```bash
# 查看容器启动命令
docker inspect web-server | grep -A 10 '"Cmd"'

# 查看容器环境变量
docker inspect web-server | grep -A 10 '"Env"'

# 查看容器挂载点
docker inspect web-server | grep -A 10 '"Mounts"'

# 进入容器调试
docker exec -it web-server /bin/bash
docker exec -it web-server /bin/sh

# 从容器复制文件
docker cp web-server:/etc/nginx/nginx.conf ./nginx.conf
docker cp ./index.html web-server:/usr/share/nginx/html/
```

### 日志管理

```bash
# 查看容器日志
docker logs web-server
docker logs -f web-server              # 实时查看
docker logs --tail 100 web-server      # 查看最后100行
docker logs --since 2023-01-01 web-server  # 查看指定时间后的日志

# 配置日志驱动
docker run -d \
  --log-driver json-file \
  --log-opt max-size=10m \
  --log-opt max-file=3 \
  nginx:alpine
```

## 🎯 最佳实践

### 1. 镜像最佳实践

```bash
# 使用官方基础镜像
FROM node:16-alpine

# 使用特定版本标签
FROM nginx:1.21-alpine

# 多阶段构建
FROM node:16-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
```

### 2. 容器最佳实践

```bash
# 使用非root用户
docker run --user 1000:1000 nginx

# 限制资源使用
docker run -m 512m --cpus="1.5" nginx

# 设置重启策略
docker run --restart unless-stopped nginx

# 使用健康检查
docker run --health-cmd="curl -f http://localhost/ || exit 1" nginx
```

### 3. 安全最佳实践

```bash
# 使用只读根文件系统
docker run --read-only nginx

# 删除不必要的能力
docker run --cap-drop ALL --cap-add NET_BIND_SERVICE nginx

# 使用安全计算模式
docker run --security-opt seccomp=default.json nginx
```

## 📝 下一步

现在您已经掌握了Docker的基本概念，接下来学习：

1. **[Docker镜像操作](./03-docker-images.md)** - 深入学习镜像的构建和管理
2. **[Docker容器操作](./04-docker-containers.md)** - 掌握容器的高级操作技巧

## 🎯 本章要点

- ✅ 镜像是只读模板，容器是镜像的运行实例
- ✅ Docker使用分层存储和写时复制机制
- ✅ 仓库用于存储和分发镜像
- ✅ 掌握基本的Docker命令操作
- ✅ 了解容器监控和调试方法

继续深入学习Docker技术！🐳
