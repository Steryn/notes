# Docker数据卷

## 🎯 学习目标

- 深入理解Docker数据持久化机制
- 掌握volumes、bind mounts和tmpfs的使用
- 学会数据备份、恢复和迁移
- 了解数据卷的性能优化和最佳实践

## 📚 数据持久化概述

### 1. 数据存储类型

```javascript
// Docker数据存储类型
const dockerStorage = {
  types: {
    volumes: {
      description: 'Docker管理的数据卷',
      location: '/var/lib/docker/volumes/',
      management: 'Docker完全管理',
      features: ['跨平台兼容', '备份恢复简单', '驱动程序支持'],
      use_cases: ['生产环境', '数据库存储', '应用数据']
    },
    
    bind_mounts: {
      description: '绑定挂载宿主机目录',
      location: '宿主机文件系统任意位置',
      management: '用户管理',
      features: ['高性能', '直接访问', '实时同步'],
      use_cases: ['开发环境', '配置文件', '日志目录']
    },
    
    tmpfs: {
      description: '临时文件系统',
      location: '内存中',
      management: '系统管理',
      features: ['高速访问', '安全性好', '重启清空'],
      use_cases: ['临时数据', '缓存文件', '敏感信息']
    }
  },
  
  characteristics: {
    persistence: 'volumes > bind_mounts > tmpfs',
    performance: 'tmpfs > bind_mounts > volumes',
    security: 'volumes > tmpfs > bind_mounts',
    portability: 'volumes > bind_mounts > tmpfs'
  }
};

console.log('Docker存储类型:', dockerStorage);
```

### 2. 存储驱动和文件系统

```bash
# 查看存储驱动信息
docker info | grep -A 10 "Storage Driver"

# 常见存储驱动
# overlay2 - 推荐的存储驱动
# aufs - 旧版Ubuntu默认
# devicemapper - CentOS/RHEL默认  
# btrfs - SUSE默认
# zfs - 支持高级特性

# 查看文件系统使用情况
docker system df
docker system df -v  # 详细信息
```

## 💾 Docker Volumes详解

### 1. 卷的基本操作

```bash
# 创建数据卷
docker volume create my-volume
docker volume create --driver local my-local-volume

# 查看数据卷列表
docker volume ls
docker volume ls --filter dangling=true  # 未使用的卷

# 查看卷详细信息
docker volume inspect my-volume

# 删除数据卷
docker volume rm my-volume
docker volume prune  # 删除未使用的卷

# 删除所有未使用的卷
docker volume prune -f
```

### 2. 使用数据卷

```bash
# 创建并使用数据卷
docker run -d --name web-server \
  -v my-volume:/usr/share/nginx/html \
  nginx:alpine

# 使用匿名卷
docker run -d --name app \
  -v /app/data \
  myapp:latest

# 使用命名卷与选项
docker run -d --name database \
  -v db-data:/var/lib/postgresql/data:z \
  postgres:13

# 使用多个数据卷
docker run -d --name complex-app \
  -v app-data:/app/data \
  -v app-logs:/app/logs \
  -v app-config:/app/config:ro \
  myapp:latest
```

### 3. 高级卷配置

```bash
# 创建带标签的数据卷
docker volume create \
  --label environment=production \
  --label project=myapp \
  prod-data

# 创建NFS数据卷
docker volume create \
  --driver local \
  --opt type=nfs \
  --opt o=addr=192.168.1.100,rw \
  --opt device=:/path/to/dir \
  nfs-volume

# 创建CIFS/SMB数据卷
docker volume create \
  --driver local \
  --opt type=cifs \
  --opt o=username=user,password=pass \
  --opt device=//server/share \
  cifs-volume
```

## 🔗 Bind Mounts详解

### 1. 基本绑定挂载

```bash
# 绑定挂载目录
docker run -d --name web \
  -v /host/path:/container/path \
  nginx:alpine

# 绑定挂载文件
docker run -d --name app \
  -v /host/config.yml:/app/config.yml:ro \
  myapp:latest

# 使用绝对路径
docker run -d --name dev-env \
  -v $(pwd):/workspace \
  -w /workspace \
  node:16-alpine

# 绑定挂载多个目录
docker run -d --name full-stack \
  -v /host/src:/app/src \
  -v /host/public:/app/public \
  -v /host/config:/app/config:ro \
  fullstack:latest
```

### 2. 挂载选项

```bash
# 只读挂载
docker run -v /host/data:/app/data:ro nginx:alpine

# 读写挂载（默认）
docker run -v /host/data:/app/data:rw nginx:alpine

# SELinux标签
docker run -v /host/data:/app/data:z nginx:alpine  # 私有标签
docker run -v /host/data:/app/data:Z nginx:alpine  # 共享标签

# 绑定传播选项
docker run -v /host/data:/app/data:shared nginx:alpine     # 共享传播
docker run -v /host/data:/app/data:slave nginx:alpine      # 从属传播
docker run -v /host/data:/app/data:private nginx:alpine    # 私有传播

# 一致性选项（macOS）
docker run -v /host/data:/app/data:cached nginx:alpine     # 宿主机优先
docker run -v /host/data:/app/data:delegated nginx:alpine  # 容器优先
docker run -v /host/data:/app/data:consistent nginx:alpine # 强一致性
```

### 3. 开发环境实例

```bash
# Node.js开发环境
docker run -it --rm \
  --name node-dev \
  -v $(pwd):/app \
  -v /app/node_modules \
  -w /app \
  -p 3000:3000 \
  node:16-alpine \
  npm run dev

# Python开发环境
docker run -it --rm \
  --name python-dev \
  -v $(pwd):/app \
  -v python-packages:/usr/local/lib/python3.9/site-packages \
  -w /app \
  -p 8000:8000 \
  python:3.9-slim \
  python app.py

# 数据库开发环境
docker run -d \
  --name dev-postgres \
  -v $(pwd)/data:/var/lib/postgresql/data \
  -v $(pwd)/init.sql:/docker-entrypoint-initdb.d/init.sql:ro \
  -e POSTGRES_PASSWORD=dev123 \
  -p 5432:5432 \
  postgres:13
```

## 💨 tmpfs挂载

### 1. 临时文件系统用法

```bash
# 基本tmpfs挂载
docker run -d --name app \
  --tmpfs /tmp \
  nginx:alpine

# 带选项的tmpfs挂载
docker run -d --name secure-app \
  --tmpfs /tmp:rw,noexec,nosuid,size=1g \
  myapp:latest

# 使用--mount语法
docker run -d --name app \
  --mount type=tmpfs,destination=/tmp,tmpfs-size=512m \
  nginx:alpine

# 多个tmpfs挂载
docker run -d --name app \
  --tmpfs /tmp:size=512m \
  --tmpfs /var/cache:size=256m,noexec \
  myapp:latest
```

### 2. 性能敏感应用

```bash
# 数据库临时文件
docker run -d --name mysql-fast \
  -v mysql-data:/var/lib/mysql \
  --tmpfs /tmp:size=1g \
  --tmpfs /var/lib/mysql-tmp:size=2g \
  -e MYSQL_ROOT_PASSWORD=secret \
  mysql:8.0

# 缓存应用
docker run -d --name redis-cache \
  --tmpfs /data:size=2g,noexec \
  redis:alpine redis-server --save ""

# 编译环境
docker run --rm \
  -v $(pwd):/src \
  --tmpfs /tmp:size=4g \
  -w /src \
  gcc:latest \
  make -j$(nproc)
```

## 🛠️ 实际应用场景

### 1. 数据库数据管理

```bash
# PostgreSQL数据管理
docker run -d --name postgres-prod \
  -v postgres-data:/var/lib/postgresql/data \
  -v postgres-logs:/var/log/postgresql \
  -v $(pwd)/postgresql.conf:/etc/postgresql/postgresql.conf:ro \
  -e POSTGRES_PASSWORD=secret \
  -p 5432:5432 \
  postgres:13

# MySQL数据管理
docker run -d --name mysql-prod \
  -v mysql-data:/var/lib/mysql \
  -v mysql-logs:/var/log/mysql \
  -v $(pwd)/my.cnf:/etc/mysql/my.cnf:ro \
  --tmpfs /tmp:size=1g \
  -e MYSQL_ROOT_PASSWORD=secret \
  mysql:8.0

# MongoDB数据管理
docker run -d --name mongo-prod \
  -v mongo-data:/data/db \
  -v mongo-configdb:/data/configdb \
  -v $(pwd)/mongod.conf:/etc/mongod.conf:ro \
  -p 27017:27017 \
  mongo:5.0 mongod --config /etc/mongod.conf
```

### 2. 应用数据分离

```bash
# Web应用数据分离
docker network create app-network

# 数据库层
docker run -d --name database \
  --network app-network \
  -v db-data:/var/lib/postgresql/data \
  -e POSTGRES_DB=myapp \
  -e POSTGRES_USER=appuser \
  -e POSTGRES_PASSWORD=secret \
  postgres:13

# 文件存储层
docker run -d --name file-storage \
  --network app-network \
  -v uploads:/app/uploads \
  -v static-files:/app/static \
  file-server:latest

# 应用层
docker run -d --name app-server \
  --network app-network \
  -v app-logs:/app/logs \
  -v app-config:/app/config:ro \
  -p 3000:3000 \
  myapp:latest

# 反向代理层
docker run -d --name nginx-proxy \
  --network app-network \
  -v nginx-logs:/var/log/nginx \
  -v $(pwd)/nginx.conf:/etc/nginx/nginx.conf:ro \
  -p 80:80 \
  nginx:alpine
```

### 3. 开发环境完整配置

```bash
#!/bin/bash
# setup-dev-environment.sh

# 创建开发网络
docker network create dev-network

# 创建开发数据卷
docker volume create dev-postgres-data
docker volume create dev-redis-data
docker volume create dev-uploads

# 启动PostgreSQL
docker run -d --name dev-postgres \
  --network dev-network \
  -v dev-postgres-data:/var/lib/postgresql/data \
  -v $(pwd)/dev-init.sql:/docker-entrypoint-initdb.d/init.sql:ro \
  -e POSTGRES_DB=devdb \
  -e POSTGRES_USER=dev \
  -e POSTGRES_PASSWORD=dev123 \
  -p 5432:5432 \
  postgres:13

# 启动Redis
docker run -d --name dev-redis \
  --network dev-network \
  -v dev-redis-data:/data \
  -p 6379:6379 \
  redis:alpine

# 启动应用（开发模式）
docker run -d --name dev-app \
  --network dev-network \
  -v $(pwd):/app \
  -v /app/node_modules \
  -v dev-uploads:/app/uploads \
  -w /app \
  -p 3000:3000 \
  -e NODE_ENV=development \
  -e DATABASE_URL=postgresql://dev:dev123@dev-postgres:5432/devdb \
  -e REDIS_URL=redis://dev-redis:6379 \
  node:16-alpine \
  npm run dev

echo "Development environment ready!"
echo "App: http://localhost:3000"
echo "Database: postgresql://dev:dev123@localhost:5432/devdb"
echo "Redis: redis://localhost:6379"
```

## 💾 数据备份和恢复

### 1. 数据卷备份

```bash
# 备份数据卷到tar文件
docker run --rm \
  -v source-volume:/source:ro \
  -v $(pwd):/backup \
  alpine \
  tar czf /backup/volume-backup-$(date +%Y%m%d-%H%M%S).tar.gz -C /source .

# 备份脚本
#!/bin/bash
# backup-volume.sh

VOLUME_NAME=$1
BACKUP_DIR=${2:-./backups}

if [ -z "$VOLUME_NAME" ]; then
    echo "Usage: $0 <volume-name> [backup-dir]"
    exit 1
fi

# 创建备份目录
mkdir -p $BACKUP_DIR

# 生成备份文件名
BACKUP_FILE="$BACKUP_DIR/${VOLUME_NAME}-$(date +%Y%m%d-%H%M%S).tar.gz"

# 执行备份
docker run --rm \
  -v $VOLUME_NAME:/source:ro \
  -v $(pwd)/$BACKUP_DIR:/backup \
  alpine \
  tar czf /backup/$(basename $BACKUP_FILE) -C /source .

echo "Backup created: $BACKUP_FILE"
```

### 2. 数据卷恢复

```bash
# 从备份恢复数据卷
docker run --rm \
  -v target-volume:/target \
  -v $(pwd):/backup \
  alpine \
  tar xzf /backup/volume-backup.tar.gz -C /target

# 恢复脚本
#!/bin/bash
# restore-volume.sh

BACKUP_FILE=$1
VOLUME_NAME=$2

if [ -z "$BACKUP_FILE" ] || [ -z "$VOLUME_NAME" ]; then
    echo "Usage: $0 <backup-file> <volume-name>"
    exit 1
fi

# 创建新数据卷（如果不存在）
docker volume create $VOLUME_NAME

# 执行恢复
docker run --rm \
  -v $VOLUME_NAME:/target \
  -v $(pwd):/backup \
  alpine \
  tar xzf /backup/$BACKUP_FILE -C /target

echo "Volume $VOLUME_NAME restored from $BACKUP_FILE"
```

### 3. 在线备份数据库

```bash
# PostgreSQL在线备份
docker exec postgres-container \
  pg_dump -U username dbname > backup.sql

# 恢复PostgreSQL
docker exec -i postgres-container \
  psql -U username dbname < backup.sql

# MySQL在线备份
docker exec mysql-container \
  mysqldump -u root -p dbname > backup.sql

# 恢复MySQL
docker exec -i mysql-container \
  mysql -u root -p dbname < backup.sql

# MongoDB备份
docker exec mongo-container \
  mongodump --db dbname --out /backup

# 恢复MongoDB
docker exec mongo-container \
  mongorestore /backup/dbname
```

## 📊 数据卷监控和管理

### 1. 数据卷监控脚本

```bash
#!/bin/bash
# volume-monitor.sh

echo "Docker数据卷监控报告 - $(date)"
echo "=================================="

echo ""
echo "📊 数据卷统计:"
docker system df -v

echo ""
echo "📋 数据卷列表:"
docker volume ls --format "table {{.Name}}\t{{.Driver}}\t{{.Scope}}"

echo ""
echo "💾 数据卷详情:"
for volume in $(docker volume ls -q); do
    echo "卷名: $volume"
    size=$(docker run --rm -v $volume:/data alpine du -sh /data 2>/dev/null | cut -f1)
    echo "  大小: ${size:-未知}"
    
    containers=$(docker ps -a --filter volume=$volume --format "{{.Names}}" | tr '\n' ' ')
    echo "  使用容器: ${containers:-无}"
    
    created=$(docker volume inspect $volume --format "{{.CreatedAt}}" 2>/dev/null)
    echo "  创建时间: ${created:-未知}"
    echo ""
done

echo "⚠️  未使用的数据卷:"
unused=$(docker volume ls --filter dangling=true -q)
if [ ! -z "$unused" ]; then
    echo "$unused"
    echo "使用 'docker volume prune' 清理"
else
    echo "✅ 无未使用的数据卷"
fi

echo ""
echo "🔍 存储驱动信息:"
docker info | grep -A 5 "Storage Driver"
```

### 2. 自动清理脚本

```bash
#!/bin/bash
# cleanup-volumes.sh

echo "🧹 Docker数据卷清理工具"
echo "========================"

# 显示当前使用情况
echo "清理前状态:"
docker system df

echo ""
echo "🔍 查找未使用的数据卷..."
unused_volumes=$(docker volume ls --filter dangling=true -q)

if [ -z "$unused_volumes" ]; then
    echo "✅ 没有发现未使用的数据卷"
else
    echo "发现以下未使用的数据卷:"
    for volume in $unused_volumes; do
        size=$(docker run --rm -v $volume:/data alpine du -sh /data 2>/dev/null | cut -f1)
        echo "  - $volume (${size:-未知大小})"
    done
    
    echo ""
    read -p "是否删除这些数据卷? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker volume prune -f
        echo "✅ 未使用的数据卷已清理"
    else
        echo "❌ 已取消清理操作"
    fi
fi

echo ""
echo "清理后状态:"
docker system df
```

## 🚀 性能优化

### 1. 存储性能优化

```bash
# 选择合适的存储驱动
# /etc/docker/daemon.json
{
  "storage-driver": "overlay2",
  "storage-opts": [
    "overlay2.override_kernel_check=true"
  ]
}

# 优化数据卷性能
docker run -d --name high-perf-db \
  -v fast-storage:/var/lib/postgresql/data \
  --mount type=tmpfs,destination=/tmp,tmpfs-size=2g \
  --shm-size=1g \
  postgres:13

# 使用本地SSD存储
docker volume create \
  --driver local \
  --opt type=none \
  --opt o=bind \
  --opt device=/mnt/ssd/docker-volumes/db-data \
  ssd-volume
```

### 2. I/O性能调优

```bash
# 调整容器I/O权重
docker run -d --name io-intensive \
  -v data-volume:/app/data \
  --blkio-weight 500 \
  --device-read-bps /dev/sda:50mb \
  --device-write-bps /dev/sda:50mb \
  myapp:latest

# 使用直接I/O
docker run -d --name database \
  -v db-data:/var/lib/mysql \
  --mount type=volume,source=db-logs,target=/var/log/mysql,volume-opt=o=direct \
  mysql:8.0

# 禁用同步写入（提高性能但降低安全性）
docker run -d --name fast-db \
  -v db-data:/var/lib/postgresql/data \
  -e POSTGRES_INITDB_ARGS="--data-checksums" \
  postgres:13 \
  -c fsync=off \
  -c synchronous_commit=off
```

## 📋 最佳实践

### 1. 数据卷使用原则

```bash
# ✅ 推荐做法

# 1. 生产环境使用命名卷
docker run -d -v app-data:/app/data myapp:latest

# 2. 开发环境使用绑定挂载
docker run -d -v $(pwd):/app myapp:dev

# 3. 临时数据使用tmpfs
docker run -d --tmpfs /tmp myapp:latest

# 4. 分离数据和应用
docker run -d \
  -v app-data:/app/data \
  -v app-logs:/app/logs \
  -v app-config:/app/config:ro \
  myapp:latest

# 5. 设置合适的权限
docker run -d \
  -v app-data:/app/data:rw \
  -v app-config:/app/config:ro \
  --user 1000:1000 \
  myapp:latest
```

### 2. 安全最佳实践

```bash
# 只读挂载配置文件
docker run -d \
  -v /host/config:/app/config:ro \
  myapp:latest

# 使用非特权用户
docker run -d \
  -v app-data:/app/data \
  --user nobody:nogroup \
  myapp:latest

# 限制挂载范围
docker run -d \
  -v /host/app-data:/app/data:Z \
  --security-opt label=type:container_file_t \
  myapp:latest
```

### 3. 备份策略

```bash
# 定期自动备份
#!/bin/bash
# cron-backup.sh (添加到crontab)

VOLUMES="app-data app-logs db-data"
BACKUP_DIR="/backup/docker-volumes"
RETENTION_DAYS=30

for volume in $VOLUMES; do
    # 创建备份
    backup_file="$BACKUP_DIR/${volume}-$(date +%Y%m%d-%H%M%S).tar.gz"
    docker run --rm \
      -v $volume:/source:ro \
      -v $BACKUP_DIR:/backup \
      alpine \
      tar czf /backup/$(basename $backup_file) -C /source .
    
    # 清理旧备份
    find $BACKUP_DIR -name "${volume}-*.tar.gz" -mtime +$RETENTION_DAYS -delete
done
```

## 📝 下一步

现在您已经掌握了Docker数据管理，接下来学习：

1. **[Docker Compose](./08-docker-compose.md)** - 学习多容器编排
2. **[Docker多阶段构建](./09-multi-stage-builds.md)** - 掌握高级构建技巧

## 🎯 本章要点

- ✅ 理解Docker三种数据存储类型的特点
- ✅ 掌握数据卷的创建、使用和管理
- ✅ 学会数据备份、恢复和迁移策略
- ✅ 了解存储性能优化技巧
- ✅ 掌握数据管理的安全最佳实践

继续深入学习Docker多容器编排！🐳
