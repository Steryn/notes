# Docker容器操作

## 🎯 学习目标

- 掌握容器的创建、运行和生命周期管理
- 学会容器的网络配置和数据管理
- 理解容器的资源限制和性能优化
- 掌握容器的监控、调试和故障排除

## 📚 容器生命周期管理

### 1. 容器创建和启动

```bash
# 创建但不启动容器
docker create --name my-nginx nginx:alpine

# 创建并启动容器
docker run --name web-server nginx:alpine

# 后台运行容器
docker run -d --name web-server nginx:alpine

# 交互式运行容器
docker run -it --name ubuntu-container ubuntu:20.04 /bin/bash

# 一次性运行容器（运行后自动删除）
docker run --rm alpine echo "Hello World"

# 从已有容器创建新容器
docker commit web-server my-nginx:custom
docker run -d --name new-web my-nginx:custom
```

### 2. 容器控制操作

```bash
# 启动已停止的容器
docker start web-server

# 重启容器
docker restart web-server

# 停止容器（优雅关闭）
docker stop web-server

# 强制停止容器
docker kill web-server

# 暂停容器
docker pause web-server

# 恢复暂停的容器
docker unpause web-server

# 重命名容器
docker rename old-name new-name
```

### 3. 容器状态查看

```bash
# 查看运行中的容器
docker ps

# 查看所有容器（包括已停止的）
docker ps -a

# 查看容器资源使用情况
docker stats

# 查看容器详细信息
docker inspect web-server

# 查看容器进程
docker top web-server

# 查看容器端口映射
docker port web-server

# 查看容器文件系统变化
docker diff web-server
```

## 🌐 容器网络配置

### 1. 端口映射

```bash
# 映射单个端口
docker run -d -p 8080:80 nginx:alpine

# 映射多个端口
docker run -d -p 8080:80 -p 8443:443 nginx:alpine

# 映射到指定IP
docker run -d -p 127.0.0.1:8080:80 nginx:alpine

# 映射到随机端口
docker run -d -P nginx:alpine

# 查看端口映射
docker port web-server
```

### 2. 网络模式

```javascript
// Docker网络模式说明
const networkModes = {
  bridge: {
    description: '默认网络模式，容器连接到docker0网桥',
    usage: 'docker run --network bridge nginx',
    characteristics: [
      '容器间可以通信',
      '需要端口映射才能从宿主机访问',
      '每个容器有独立的IP地址'
    ]
  },

  host: {
    description: '容器直接使用宿主机网络',
    usage: 'docker run --network host nginx',
    characteristics: [
      '性能最佳',
      '容器直接绑定宿主机端口',
      '失去网络隔离性'
    ]
  },

  none: {
    description: '容器没有网络连接',
    usage: 'docker run --network none alpine',
    characteristics: [
      '完全隔离的网络环境',
      '只有回环接口',
      '需要手动配置网络'
    ]
  },

  container: {
    description: '与其他容器共享网络',
    usage: 'docker run --network container:other-container nginx',
    characteristics: [
      '共享网络命名空间',
      '可以通过localhost通信',
      '共享端口空间'
    ]
  },

  custom: {
    description: '自定义网络',
    usage: 'docker run --network my-network nginx',
    characteristics: [
      '更好的容器间通信',
      '自动DNS解析',
      '网络隔离'
    ]
  }
};

console.log('Docker网络模式:', networkModes);
```

### 3. 自定义网络

```bash
# 创建自定义网络
docker network create my-network
docker network create --driver bridge --subnet=172.20.0.0/16 my-custom-network

# 查看网络列表
docker network ls

# 查看网络详情
docker network inspect my-network

# 将容器连接到网络
docker run -d --name web --network my-network nginx:alpine
docker network connect my-network existing-container

# 断开容器网络连接
docker network disconnect my-network web

# 删除网络
docker network rm my-network

# 清理未使用的网络
docker network prune
```

## 💾 容器数据管理

### 1. 数据卷（Volumes）

```bash
# 创建命名卷
docker volume create my-volume

# 查看卷列表
docker volume ls

# 查看卷详情
docker volume inspect my-volume

# 使用卷挂载
docker run -d -v my-volume:/data alpine
docker run -d --mount source=my-volume,target=/data alpine

# 删除卷
docker volume rm my-volume

# 清理未使用的卷
docker volume prune
```

### 2. 绑定挂载（Bind Mounts）

```bash
# 绑定挂载主机目录
docker run -d -v /host/path:/container/path nginx:alpine
docker run -d --mount type=bind,source=/host/path,target=/container/path nginx:alpine

# 只读挂载
docker run -d -v /host/path:/container/path:ro nginx:alpine

# 创建目录示例
mkdir -p ~/docker-data/nginx
echo "<h1>Hello from host!</h1>" > ~/docker-data/nginx/index.html
docker run -d -p 8080:80 -v ~/docker-data/nginx:/usr/share/nginx/html:ro nginx:alpine
```

### 3. 临时文件系统（tmpfs）

```bash
# 使用tmpfs挂载（仅Linux）
docker run -d --tmpfs /tmp nginx:alpine
docker run -d --mount type=tmpfs,destination=/tmp nginx:alpine

# 设置tmpfs选项
docker run -d --tmpfs /tmp:rw,noexec,nosuid,size=1g nginx:alpine
```

### 4. 数据容器模式

```bash
# 创建数据容器
docker create -v /data --name data-container alpine

# 其他容器使用数据容器的卷
docker run -d --volumes-from data-container nginx:alpine
docker run -d --volumes-from data-container mysql:8.0

# 备份数据容器
docker run --rm --volumes-from data-container -v $(pwd):/backup alpine tar czf /backup/data.tar.gz /data

# 恢复数据容器
docker run --rm --volumes-from data-container -v $(pwd):/backup alpine tar xzf /backup/data.tar.gz
```

## ⚙️ 容器资源限制

### 1. 内存限制

```bash
# 限制内存使用
docker run -d -m 512m nginx:alpine                    # 512MB
docker run -d --memory=1g nginx:alpine                # 1GB
docker run -d --memory=500m --memory-swap=1g nginx:alpine  # 内存500MB，交换1GB

# 禁用OOM Killer
docker run -d --oom-kill-disable nginx:alpine

# 设置内存交换行为
docker run -d --memory=500m --memory-swappiness=0 nginx:alpine
```

### 2. CPU限制

```bash
# 限制CPU使用
docker run -d --cpus="1.5" nginx:alpine               # 1.5个CPU核心
docker run -d --cpu-shares=512 nginx:alpine           # CPU权重
docker run -d --cpuset-cpus="0,1" nginx:alpine        # 指定CPU核心

# CPU配额限制
docker run -d --cpu-period=100000 --cpu-quota=50000 nginx:alpine  # 50%的CPU时间
```

### 3. 磁盘I/O限制

```bash
# 限制读写速度
docker run -d --device-read-bps /dev/sda:1mb nginx:alpine
docker run -d --device-write-bps /dev/sda:1mb nginx:alpine

# 限制读写操作次数
docker run -d --device-read-iops /dev/sda:1000 nginx:alpine
docker run -d --device-write-iops /dev/sda:1000 nginx:alpine
```

### 4. 其他资源限制

```bash
# 限制进程数
docker run -d --pids-limit 100 nginx:alpine

# 限制文件描述符
docker run -d --ulimit nofile=1024:2048 nginx:alpine

# 限制核心转储文件大小
docker run -d --ulimit core=0 nginx:alpine
```

## 🔧 容器交互操作

### 1. 进入容器

```bash
# 执行新进程进入容器
docker exec -it web-server /bin/bash
docker exec -it web-server /bin/sh

# 连接到容器主进程
docker attach web-server

# 以root用户进入容器
docker exec -it --user root web-server /bin/bash

# 执行单个命令
docker exec web-server ls -la /etc
docker exec web-server cat /var/log/nginx/access.log
```

### 2. 文件传输

```bash
# 从容器复制文件到主机
docker cp web-server:/etc/nginx/nginx.conf ./nginx.conf
docker cp web-server:/var/log/nginx/ ./logs/

# 从主机复制文件到容器
docker cp ./index.html web-server:/usr/share/nginx/html/
docker cp ./config/ web-server:/etc/myapp/

# 复制时保持权限
docker cp -a web-server:/data ./backup
```

### 3. 日志管理

```bash
# 查看容器日志
docker logs web-server

# 实时查看日志
docker logs -f web-server

# 查看最后N行日志
docker logs --tail 100 web-server

# 查看指定时间范围的日志
docker logs --since "2023-01-01T00:00:00" web-server
docker logs --until "2023-01-31T23:59:59" web-server

# 显示时间戳
docker logs -t web-server
```

## 📊 容器监控和性能

### 1. 实时监控

```bash
# 查看容器资源使用
docker stats                          # 所有容器
docker stats web-server mysql-db      # 指定容器
docker stats --no-stream             # 一次性输出

# 自定义格式输出
docker stats --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"
```

### 2. 系统事件监控

```bash
# 监控Docker事件
docker events

# 过滤特定事件
docker events --filter container=web-server
docker events --filter event=start
docker events --filter type=network

# 指定时间范围
docker events --since "2023-01-01"
docker events --until "2023-12-31"
```

### 3. 健康检查

```bash
# 运行带健康检查的容器
docker run -d \
  --name web-with-health \
  --health-cmd="curl -f http://localhost/ || exit 1" \
  --health-interval=30s \
  --health-timeout=10s \
  --health-retries=3 \
  --health-start-period=60s \
  nginx:alpine

# 查看健康状态
docker ps
docker inspect web-with-health | grep -A 10 Health
```

## 🛠️ 实际应用示例

### 1. Web应用部署

```bash
# 部署完整的Web应用栈
# 1. 创建网络
docker network create app-network

# 2. 运行数据库
docker run -d \
  --name app-db \
  --network app-network \
  -e POSTGRES_DB=myapp \
  -e POSTGRES_USER=appuser \
  -e POSTGRES_PASSWORD=secret \
  -v postgres-data:/var/lib/postgresql/data \
  postgres:13

# 3. 运行Redis缓存
docker run -d \
  --name app-cache \
  --network app-network \
  -v redis-data:/data \
  redis:alpine

# 4. 运行应用服务器
docker run -d \
  --name app-server \
  --network app-network \
  -p 3000:3000 \
  -e DATABASE_URL=postgresql://appuser:secret@app-db:5432/myapp \
  -e REDIS_URL=redis://app-cache:6379 \
  -v app-logs:/app/logs \
  myapp:latest

# 5. 运行Nginx反向代理
docker run -d \
  --name nginx-proxy \
  --network app-network \
  -p 80:80 \
  -v ./nginx.conf:/etc/nginx/nginx.conf:ro \
  nginx:alpine
```

### 2. 开发环境容器

```bash
# 创建开发环境容器
docker run -it \
  --name dev-env \
  -v $(pwd):/workspace \
  -v ~/.ssh:/root/.ssh:ro \
  -v ~/.gitconfig:/root/.gitconfig:ro \
  -p 3000:3000 \
  -p 8080:8080 \
  --workdir /workspace \
  node:16

# 或使用VSCode Dev Container
# .devcontainer/devcontainer.json
{
  "name": "Node.js Development",
  "image": "node:16",
  "mounts": [
    "source=${localWorkspaceFolder},target=/workspace,type=bind",
    "source=${localEnv:HOME}/.ssh,target=/root/.ssh,type=bind,readonly"
  ],
  "forwardPorts": [3000, 8080],
  "workspaceFolder": "/workspace",
  "extensions": ["ms-vscode.vscode-typescript-next"]
}
```

### 3. 数据库容器

```bash
# MySQL数据库
docker run -d \
  --name mysql-server \
  -e MYSQL_ROOT_PASSWORD=rootpass \
  -e MYSQL_DATABASE=myapp \
  -e MYSQL_USER=appuser \
  -e MYSQL_PASSWORD=apppass \
  -p 3306:3306 \
  -v mysql-data:/var/lib/mysql \
  --restart unless-stopped \
  mysql:8.0

# PostgreSQL数据库
docker run -d \
  --name postgres-server \
  -e POSTGRES_PASSWORD=secret \
  -e POSTGRES_DB=myapp \
  -e POSTGRES_USER=appuser \
  -p 5432:5432 \
  -v postgres-data:/var/lib/postgresql/data \
  --restart unless-stopped \
  postgres:13

# MongoDB数据库
docker run -d \
  --name mongo-server \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=secret \
  -p 27017:27017 \
  -v mongo-data:/data/db \
  --restart unless-stopped \
  mongo:5.0
```

## 🔧 故障排除和调试

### 1. 常见问题诊断

```bash
# 检查容器启动失败原因
docker logs container-name

# 检查容器配置
docker inspect container-name

# 检查容器内进程
docker exec container-name ps aux

# 检查容器网络连接
docker exec container-name netstat -tulpn
docker exec container-name ping other-container

# 检查容器文件系统
docker exec container-name df -h
docker exec container-name ls -la /path/to/check
```

### 2. 调试脚本

```bash
#!/bin/bash
# container-debug.sh

CONTAINER_NAME=$1

if [ -z "$CONTAINER_NAME" ]; then
    echo "Usage: $0 <container-name>"
    exit 1
fi

echo "🔍 调试容器: $CONTAINER_NAME"
echo "================================"

echo "📊 容器状态:"
docker ps -a --filter name=$CONTAINER_NAME

echo ""
echo "📋 容器信息:"
docker inspect $CONTAINER_NAME | grep -E "(Status|RestartCount|StartedAt)"

echo ""
echo "📝 最新日志:"
docker logs --tail 20 $CONTAINER_NAME

echo ""
echo "💾 资源使用:"
docker stats --no-stream $CONTAINER_NAME

echo ""
echo "🌐 网络连接:"
docker exec $CONTAINER_NAME netstat -tulpn 2>/dev/null || echo "netstat not available"

echo ""
echo "📂 文件系统:"
docker exec $CONTAINER_NAME df -h 2>/dev/null || echo "df not available"

echo ""
echo "🔧 进程列表:"
docker exec $CONTAINER_NAME ps aux 2>/dev/null || echo "ps not available"
```

### 3. 性能优化

```bash
# 监控容器性能
#!/bin/bash
# monitor-containers.sh

while true; do
    clear
    echo "Docker容器监控 - $(date)"
    echo "================================"
    
    docker stats --no-stream --format \
        "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.BlockIO}}"
    
    echo ""
    echo "内存使用TOP 5:"
    docker stats --no-stream --format \
        "{{.Container}}\t{{.MemPerc}}" | sort -k2 -nr | head -5
    
    sleep 10
done
```

## 📋 最佳实践

### 1. 容器运行最佳实践

```bash
# ✅ 推荐做法
# 使用非root用户
docker run --user 1001:1001 nginx:alpine

# 设置重启策略
docker run --restart unless-stopped nginx:alpine

# 限制资源使用
docker run -m 512m --cpus="0.5" nginx:alpine

# 使用健康检查
docker run --health-cmd="curl -f http://localhost/ || exit 1" nginx:alpine

# 设置环境变量
docker run -e NODE_ENV=production myapp:latest

# 使用标签管理容器
docker run --label env=production --label app=web nginx:alpine
```

### 2. 安全最佳实践

```bash
# 使用只读根文件系统
docker run --read-only --tmpfs /tmp nginx:alpine

# 删除不必要的能力
docker run --cap-drop ALL --cap-add NET_BIND_SERVICE nginx:alpine

# 使用安全计算模式
docker run --security-opt seccomp=default.json nginx:alpine

# 设置SELinux标签
docker run --security-opt label=level:s0:c100,c200 nginx:alpine
```

### 3. 监控和日志最佳实践

```bash
# 配置日志驱动
docker run -d \
  --log-driver json-file \
  --log-opt max-size=10m \
  --log-opt max-file=5 \
  nginx:alpine

# 使用结构化日志
docker run -d \
  --log-driver fluentd \
  --log-opt fluentd-address=localhost:24224 \
  --log-opt tag="docker.{{.Name}}" \
  nginx:alpine
```

## 📝 下一步

现在您已经掌握了Docker容器的操作，接下来学习：

1. **[Dockerfile详解](./05-dockerfile.md)** - 深入学习Dockerfile编写技巧
2. **[Docker网络](./06-docker-networking.md)** - 掌握Docker网络管理

## 🎯 本章要点

- ✅ 掌握容器的完整生命周期管理
- ✅ 学会容器网络配置和数据管理
- ✅ 理解容器资源限制和性能优化
- ✅ 掌握容器监控、调试和故障排除
- ✅ 了解容器运行的最佳实践

继续深入学习Docker高级特性！🐳
