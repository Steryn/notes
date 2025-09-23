# Docker容器操作

## 容器基础

容器是Docker的核心概念，是镜像的运行实例。理解容器的生命周期和管理方法对于有效使用Docker至关重要。

## 容器生命周期

```
创建 → 运行 → 暂停 → 恢复 → 停止 → 删除
  ↑      ↓      ↓      ↓      ↓
  └──────┴──────┴──────┴──────┘
     重启/启动
```

## 容器创建和运行

### 基本运行命令

```bash
# 运行容器（前台）
docker run nginx:latest

# 运行容器（后台）
docker run -d nginx:latest

# 运行容器并指定名称
docker run -d --name my-nginx nginx:latest

# 运行容器并映射端口
docker run -d -p 8080:80 nginx:latest

# 运行容器并挂载数据卷
docker run -d -v /host/path:/container/path nginx:latest
```

### 交互式容器

```bash
# 运行交互式容器
docker run -it ubuntu:20.04 /bin/bash

# 运行容器并保持运行
docker run -itd ubuntu:20.04 /bin/bash

# 进入运行中的容器
docker exec -it container_id /bin/bash
```

### 容器配置参数

| 参数 | 说明 | 示例 |
|------|------|------|
| `-d` | 后台运行 | `docker run -d nginx` |
| `-it` | 交互式终端 | `docker run -it ubuntu /bin/bash` |
| `-p` | 端口映射 | `docker run -p 8080:80 nginx` |
| `-v` | 数据卷挂载 | `docker run -v /host:/container nginx` |
| `-e` | 环境变量 | `docker run -e MYSQL_ROOT_PASSWORD=123456 mysql` |
| `--name` | 容器名称 | `docker run --name my-app nginx` |
| `--rm` | 自动删除 | `docker run --rm nginx` |
| `--restart` | 重启策略 | `docker run --restart=always nginx` |
| `--network` | 网络模式 | `docker run --network=bridge nginx` |
| `--memory` | 内存限制 | `docker run --memory=512m nginx` |
| `--cpus` | CPU限制 | `docker run --cpus=1.5 nginx` |

## 容器管理命令

### 查看容器

```bash
# 查看运行中的容器
docker ps

# 查看所有容器（包括停止的）
docker ps -a

# 查看容器ID
docker ps -q

# 格式化输出
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# 查看容器详细信息
docker inspect container_id

# 查看容器日志
docker logs container_id

# 实时查看日志
docker logs -f container_id

# 查看最近100行日志
docker logs --tail 100 container_id
```

### 容器控制

```bash
# 启动容器
docker start container_id

# 停止容器
docker stop container_id

# 重启容器
docker restart container_id

# 暂停容器
docker pause container_id

# 恢复容器
docker unpause container_id

# 强制停止容器
docker kill container_id

# 删除容器
docker rm container_id

# 强制删除运行中的容器
docker rm -f container_id
```

### 容器交互

```bash
# 进入运行中的容器
docker exec -it container_id /bin/bash

# 在容器中执行命令
docker exec container_id ls -la

# 复制文件到容器
docker cp file.txt container_id:/path/to/destination

# 从容器复制文件
docker cp container_id:/path/to/file.txt ./
```

## 容器资源管理

### 资源限制

```bash
# 限制内存使用
docker run -d --memory=512m --name limited-container nginx

# 限制CPU使用
docker run -d --cpus=1.5 --name cpu-limited nginx

# 限制磁盘I/O
docker run -d --device-read-bps /dev/sda:1mb nginx

# 查看资源使用情况
docker stats container_id

# 查看所有容器资源使用
docker stats
```

### 重启策略

```bash
# 不自动重启（默认）
docker run --restart=no nginx

# 总是重启
docker run --restart=always nginx

# 失败时重启
docker run --restart=on-failure nginx

# 失败时重启，最多5次
docker run --restart=on-failure:5 nginx

# 除非手动停止，否则总是重启
docker run --restart=unless-stopped nginx
```

## 容器网络

### 网络模式

```bash
# 桥接网络（默认）
docker run --network=bridge nginx

# 主机网络
docker run --network=host nginx

# 无网络
docker run --network=none nginx

# 自定义网络
docker network create my-network
docker run --network=my-network nginx
```

### 端口映射

```bash
# 映射单个端口
docker run -p 8080:80 nginx

# 映射多个端口
docker run -p 8080:80 -p 8443:443 nginx

# 映射到特定IP
docker run -p 127.0.0.1:8080:80 nginx

# 随机端口映射
docker run -P nginx
```

## 容器数据管理

### 数据卷挂载

```bash
# 挂载主机目录
docker run -v /host/path:/container/path nginx

# 挂载数据卷
docker volume create my-volume
docker run -v my-volume:/container/path nginx

# 只读挂载
docker run -v /host/path:/container/path:ro nginx

# 挂载单个文件
docker run -v /host/file.txt:/container/file.txt nginx
```

### 数据卷管理

```bash
# 创建数据卷
docker volume create my-volume

# 查看数据卷
docker volume ls

# 查看数据卷详细信息
docker volume inspect my-volume

# 删除数据卷
docker volume rm my-volume

# 删除未使用的数据卷
docker volume prune
```

## 实践练习

### 练习1：基础容器操作

```bash
# 1. 运行nginx容器
docker run -d --name web-server -p 8080:80 nginx:latest

# 2. 查看容器状态
docker ps

# 3. 查看容器日志
docker logs web-server

# 4. 进入容器
docker exec -it web-server /bin/bash

# 5. 在容器内查看nginx配置
cat /etc/nginx/nginx.conf

# 6. 退出容器
exit

# 7. 停止并删除容器
docker stop web-server
docker rm web-server
```

### 练习2：数据持久化

```bash
# 1. 创建数据卷
docker volume create web-data

# 2. 运行容器并挂载数据卷
docker run -d --name web-server \
  -p 8080:80 \
  -v web-data:/usr/share/nginx/html \
  nginx:latest

# 3. 进入容器并创建文件
docker exec -it web-server /bin/bash
echo "Hello from container!" > /usr/share/nginx/html/index.html
exit

# 4. 停止并删除容器
docker stop web-server
docker rm web-server

# 5. 重新运行容器，验证数据持久化
docker run -d --name web-server2 \
  -p 8081:80 \
  -v web-data:/usr/share/nginx/html \
  nginx:latest

# 6. 访问 http://localhost:8081 查看内容

# 7. 清理
docker stop web-server2
docker rm web-server2
docker volume rm web-data
```

### 练习3：容器资源限制

```bash
# 1. 运行资源受限的容器
docker run -d --name limited-nginx \
  --memory=256m \
  --cpus=0.5 \
  -p 8082:80 \
  nginx:latest

# 2. 查看资源使用情况
docker stats limited-nginx

# 3. 在容器内进行压力测试
docker exec limited-nginx /bin/bash
# 在容器内执行：
# yes > /dev/null &

# 4. 监控资源使用
docker stats limited-nginx

# 5. 清理
docker stop limited-nginx
docker rm limited-nginx
```

## 容器监控和调试

### 监控命令

```bash
# 查看容器资源使用
docker stats

# 查看容器进程
docker top container_id

# 查看容器详细信息
docker inspect container_id

# 查看容器日志
docker logs container_id

# 实时查看日志
docker logs -f container_id
```

### 调试技巧

```bash
# 进入容器调试
docker exec -it container_id /bin/bash

# 查看容器网络
docker exec container_id ip addr

# 查看容器环境变量
docker exec container_id env

# 查看容器挂载点
docker exec container_id mount
```

## 容器最佳实践

### 1. 容器设计原则

- **单一职责**：每个容器只运行一个进程
- **无状态**：容器应该是无状态的
- **可配置**：通过环境变量配置容器
- **健康检查**：实现健康检查机制

### 2. 安全最佳实践

```bash
# 以非root用户运行
docker run --user 1000:1000 nginx

# 只读根文件系统
docker run --read-only nginx

# 禁用特权模式
docker run --privileged=false nginx

# 限制系统调用
docker run --security-opt seccomp=unconfined nginx
```

### 3. 性能优化

```bash
# 使用多阶段构建减小镜像
# 合理设置资源限制
# 使用数据卷提高I/O性能
# 选择合适的网络模式
```

## 常见问题

### 1. 容器无法启动

```bash
# 查看容器日志
docker logs container_id

# 检查镜像是否存在
docker images

# 检查端口是否被占用
netstat -tulpn | grep :8080
```

### 2. 容器内无法访问网络

```bash
# 检查网络配置
docker network ls
docker network inspect bridge

# 检查DNS配置
docker exec container_id nslookup google.com
```

### 3. 数据丢失问题

```bash
# 检查数据卷挂载
docker inspect container_id | grep -A 10 "Mounts"

# 使用数据卷而不是绑定挂载
docker volume create my-data
docker run -v my-data:/data nginx
```

## 下一步

掌握容器操作后，您可以：

1. 继续学习 [Dockerfile详解](./05-dockerfile.md)
2. 学习Docker网络和数据卷的深入使用
3. 探索容器编排工具如Docker Compose

## 学习检查点

完成本章学习后，您应该能够：

- [ ] 理解容器的生命周期
- [ ] 熟练进行容器的创建、运行和管理
- [ ] 掌握容器的资源限制和配置
- [ ] 了解容器的网络和数据管理
- [ ] 解决容器相关的常见问题
