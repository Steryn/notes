# Docker数据卷

## 数据卷基础

Docker数据卷是容器数据持久化的核心机制。理解数据卷的使用对于构建可靠的生产环境应用至关重要。

## 为什么需要数据卷？

### 容器数据的特点

- **临时性**：容器删除时，容器内的数据也会丢失
- **隔离性**：容器间数据无法直接共享
- **性能**：容器文件系统性能可能不如主机文件系统

### 数据卷的优势

- **持久化**：数据独立于容器生命周期
- **共享**：多个容器可以共享同一数据卷
- **备份**：便于数据备份和恢复
- **性能**：直接访问主机文件系统，性能更好

## 数据卷类型

### 1. 命名数据卷（Named Volumes）

- Docker管理的存储位置
- 推荐用于生产环境
- 支持备份和迁移

### 2. 绑定挂载（Bind Mounts）

- 直接挂载主机目录
- 开发环境常用
- 实时同步文件变化

### 3. tmpfs挂载

- 存储在内存中
- 临时数据存储
- 容器停止后数据丢失

## 数据卷管理命令

### 创建数据卷

```bash
# 创建命名数据卷
docker volume create my-volume

# 创建数据卷并指定驱动
docker volume create --driver local my-volume

# 创建数据卷并指定选项
docker volume create --driver local \
  --opt type=none \
  --opt device=/host/path \
  --opt o=bind \
  my-volume
```

### 查看数据卷

```bash
# 列出所有数据卷
docker volume ls

# 查看数据卷详细信息
docker volume inspect my-volume

# 查看数据卷使用情况
docker system df -v
```

### 删除数据卷

```bash
# 删除指定数据卷
docker volume rm my-volume

# 删除所有未使用的数据卷
docker volume prune

# 强制删除数据卷
docker volume rm -f my-volume
```

## 数据卷使用

### 命名数据卷

```bash
# 运行容器并挂载命名数据卷
docker run -d --name web-server \
  -v web-data:/usr/share/nginx/html \
  nginx:alpine

# 查看数据卷位置
docker volume inspect web-data

# 备份数据卷
docker run --rm -v web-data:/data -v $(pwd):/backup \
  alpine tar czf /backup/web-data-backup.tar.gz -C /data .
```

### 绑定挂载

```bash
# 挂载主机目录
docker run -d --name web-server \
  -v /host/html:/usr/share/nginx/html \
  nginx:alpine

# 挂载单个文件
docker run -d --name web-server \
  -v /host/nginx.conf:/etc/nginx/nginx.conf:ro \
  nginx:alpine

# 只读挂载
docker run -d --name web-server \
  -v /host/html:/usr/share/nginx/html:ro \
  nginx:alpine
```

### tmpfs挂载

```bash
# 挂载tmpfs
docker run -d --name web-server \
  --tmpfs /tmp \
  nginx:alpine

# 指定tmpfs选项
docker run -d --name web-server \
  --tmpfs /tmp:rw,size=100m,noexec,nosuid,nodev \
  nginx:alpine
```

## 实践练习

### 练习1：基础数据卷操作

```bash
# 1. 创建数据卷
docker volume create web-data

# 2. 运行容器并挂载数据卷
docker run -d --name web-server \
  -v web-data:/usr/share/nginx/html \
  nginx:alpine

# 3. 进入容器并创建文件
docker exec -it web-server sh
echo "Hello from volume!" > /usr/share/nginx/html/index.html
exit

# 4. 停止并删除容器
docker stop web-server
docker rm web-server

# 5. 重新运行容器，验证数据持久化
docker run -d --name web-server2 \
  -v web-data:/usr/share/nginx/html \
  nginx:alpine

# 6. 访问 http://localhost:8080 查看内容
docker run -d --name web-server2 \
  -p 8080:80 \
  -v web-data:/usr/share/nginx/html \
  nginx:alpine

# 7. 清理
docker stop web-server2
docker rm web-server2
docker volume rm web-data
```

### 练习2：数据卷备份和恢复

```bash
# 1. 创建数据卷并添加数据
docker volume create app-data
docker run --rm -v app-data:/data alpine sh -c 'echo "重要数据" > /data/important.txt'

# 2. 备份数据卷
docker run --rm -v app-data:/data -v $(pwd):/backup \
  alpine tar czf /backup/app-data-backup.tar.gz -C /data .

# 3. 删除原数据卷
docker volume rm app-data

# 4. 创建新数据卷
docker volume create app-data-new

# 5. 恢复数据
docker run --rm -v app-data-new:/data -v $(pwd):/backup \
  alpine tar xzf /backup/app-data-backup.tar.gz -C /data

# 6. 验证恢复
docker run --rm -v app-data-new:/data alpine cat /data/important.txt

# 7. 清理
docker volume rm app-data-new
rm app-data-backup.tar.gz
```

### 练习3：多容器共享数据卷

```bash
# 1. 创建共享数据卷
docker volume create shared-data

# 2. 运行写入容器
docker run -d --name writer \
  -v shared-data:/data \
  alpine sh -c 'while true; do echo "$(date): 数据写入" >> /data/log.txt; sleep 5; done'

# 3. 运行读取容器
docker run -d --name reader \
  -v shared-data:/data \
  alpine sh -c 'while true; do tail -f /data/log.txt; sleep 2; done'

# 4. 查看共享数据
docker exec writer cat /data/log.txt
docker exec reader cat /data/log.txt

# 5. 清理
docker stop writer reader
docker rm writer reader
docker volume rm shared-data
```

## 数据卷驱动

### 本地驱动

```bash
# 创建本地数据卷
docker volume create --driver local my-local-volume

# 创建NFS数据卷
docker volume create --driver local \
  --opt type=nfs \
  --opt o=addr=192.168.1.100,rw \
  --opt device=:/path/to/nfs \
  my-nfs-volume
```

### 第三方驱动

```bash
# 安装Rex-Ray驱动
docker plugin install rexray/ebs

# 创建EBS数据卷
docker volume create --driver rexray/ebs my-ebs-volume
```

## 数据卷最佳实践

### 1. 数据卷命名

```bash
# 使用有意义的名称
docker volume create app-database-data
docker volume create app-logs
docker volume create app-config
```

### 2. 数据卷组织

```bash
# 按应用组织数据卷
docker volume create myapp-db-data
docker volume create myapp-uploads
docker volume create myapp-logs
```

### 3. 权限管理

```bash
# 设置正确的文件权限
docker run -v my-volume:/data \
  --user 1000:1000 \
  alpine chown -R 1000:1000 /data
```

## 数据卷监控

### 查看数据卷使用情况

```bash
# 查看所有数据卷使用情况
docker system df -v

# 查看特定数据卷大小
docker run --rm -v my-volume:/data alpine du -sh /data
```

### 数据卷健康检查

```bash
# 检查数据卷可写性
docker run --rm -v my-volume:/data alpine touch /data/test-write

# 检查数据卷权限
docker run --rm -v my-volume:/data alpine ls -la /data
```

## 数据卷安全

### 1. 访问控制

```bash
# 使用只读挂载
docker run -v my-volume:/data:ro alpine

# 限制用户权限
docker run --user 1000:1000 -v my-volume:/data alpine
```

### 2. 数据加密

```bash
# 使用加密数据卷
docker volume create --driver local \
  --opt type=tmpfs \
  --opt device=tmpfs \
  --opt o=size=100m,encryption \
  encrypted-volume
```

## 常见问题

### 1. 数据卷权限问题

```bash
# 检查文件权限
docker run --rm -v my-volume:/data alpine ls -la /data

# 修复权限
docker run --rm -v my-volume:/data alpine chown -R 1000:1000 /data
```

### 2. 数据卷空间不足

```bash
# 检查磁盘空间
df -h

# 清理未使用的数据卷
docker volume prune
```

### 3. 数据卷无法删除

```bash
# 检查数据卷使用情况
docker volume inspect my-volume

# 强制删除
docker volume rm -f my-volume
```

## 性能优化

### 1. 选择合适的存储驱动

```bash
# 使用高性能存储
docker volume create --driver local \
  --opt type=tmpfs \
  --opt device=tmpfs \
  --opt o=size=1g \
  high-performance-volume
```

### 2. 数据卷缓存

```bash
# 使用缓存挂载
docker run -v my-volume:/data:cached alpine
```

## 下一步

掌握数据卷后，您可以：

1. 继续学习 [Docker Compose](./08-docker-compose.md)
2. 学习数据卷的高级用法
3. 探索容器编排中的数据管理

## 学习检查点

完成本章学习后，您应该能够：

- [ ] 理解数据卷的作用和类型
- [ ] 熟练进行数据卷的创建和管理
- [ ] 掌握数据卷的备份和恢复
- [ ] 了解数据卷的安全和性能考虑
- [ ] 解决数据卷相关的常见问题
