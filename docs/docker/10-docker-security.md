# Docker安全最佳实践

## 安全基础

Docker安全是一个多层次的概念，涉及镜像安全、容器安全、主机安全和网络安全。理解这些安全层面对于构建安全的生产环境至关重要。

## 镜像安全

### 1. 使用官方镜像

```dockerfile
# 优先使用官方镜像
FROM nginx:1.21-alpine

# 避免使用latest标签
FROM nginx:1.21-alpine

# 定期更新基础镜像
FROM nginx:1.21.3-alpine
```

### 2. 镜像扫描

```bash
# 使用Docker Scout扫描镜像
docker scout cves nginx:latest

# 使用Trivy扫描
trivy image nginx:latest

# 使用Clair扫描
clair-scanner --ip 192.168.1.100 nginx:latest
```

### 3. 最小化镜像

```dockerfile
# 使用Alpine基础镜像
FROM alpine:3.14

# 多阶段构建
FROM node:16 AS builder
WORKDIR /app
COPY . .
RUN npm run build

FROM nginx:alpine AS production
COPY --from=builder /app/dist /usr/share/nginx/html
```

## 容器安全

### 1. 非特权用户

```dockerfile
# 创建非root用户
RUN adduser -D -s /bin/sh appuser
USER appuser

# 使用特定UID
USER 1000:1000
```

### 2. 只读文件系统

```dockerfile
# 只读根文件系统
FROM nginx:alpine
RUN apk add --no-cache dumb-init
USER nginx
ENTRYPOINT ["dumb-init", "--"]
CMD ["nginx", "-g", "daemon off;"]
```

运行容器：

```bash
# 只读文件系统
docker run --read-only nginx:alpine

# 只读文件系统，允许写入临时目录
docker run --read-only --tmpfs /tmp nginx:alpine
```

### 3. 资源限制

```bash
# 限制内存使用
docker run --memory=512m nginx:alpine

# 限制CPU使用
docker run --cpus=1.5 nginx:alpine

# 限制进程数
docker run --pids-limit=100 nginx:alpine

# 限制文件描述符
docker run --ulimit nofile=1024:1024 nginx:alpine
```

### 4. 安全选项

```bash
# 禁用特权模式
docker run --privileged=false nginx:alpine

# 禁用所有权限
docker run --cap-drop=ALL nginx:alpine

# 只添加必要权限
docker run --cap-add=NET_BIND_SERVICE nginx:alpine

# 禁用网络
docker run --network=none nginx:alpine

# 禁用IPC
docker run --ipc=none nginx:alpine
```

## 主机安全

### 1. Docker守护进程安全

```bash
# 使用TLS加密
dockerd --tlsverify --tlscacert=ca.pem --tlscert=server-cert.pem --tlskey=server-key.pem

# 限制网络访问
dockerd --host=unix:///var/run/docker.sock

# 使用systemd管理
sudo systemctl enable docker
sudo systemctl start docker
```

### 2. 文件权限

```bash
# 设置Docker socket权限
sudo chmod 660 /var/run/docker.sock
sudo chown root:docker /var/run/docker.sock

# 设置配置文件权限
sudo chmod 600 /etc/docker/daemon.json
```

### 3. 审计日志

```bash
# 启用Docker审计
sudo auditctl -w /var/lib/docker -k docker
sudo auditctl -w /etc/docker -k docker
sudo auditctl -w /usr/bin/docker -k docker
```

## 网络安全

### 1. 网络隔离

```bash
# 创建内部网络
docker network create --internal secure-network

# 使用自定义网络
docker run --network=secure-network nginx:alpine
```

### 2. 防火墙配置

```bash
# 限制Docker网络访问
iptables -A DOCKER-USER -i docker0 -j DROP

# 允许特定IP访问
iptables -A DOCKER-USER -s 192.168.1.0/24 -j ACCEPT
```

### 3. TLS加密

```bash
# 生成TLS证书
openssl genrsa -aes256 -out ca-key.pem 4096
openssl req -new -x509 -days 365 -key ca-key.pem -sha256 -out ca.pem

# 配置Docker TLS
dockerd --tlsverify --tlscacert=ca.pem --tlscert=server-cert.pem --tlskey=server-key.pem
```

## 实践练习

### 练习1：安全容器配置

创建安全配置的`Dockerfile`：

```dockerfile
FROM nginx:1.21-alpine

# 创建非root用户
RUN addgroup -g 1001 -S nginx && \
    adduser -S -D -H -u 1001 -h /var/cache/nginx -s /sbin/nologin -G nginx -g nginx nginx

# 设置权限
RUN chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /etc/nginx/conf.d

# 切换到非root用户
USER nginx

# 暴露端口
EXPOSE 8080

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/ || exit 1

# 启动命令
CMD ["nginx", "-g", "daemon off;"]
```

运行安全容器：

```bash
# 运行安全配置的容器
docker run -d \
  --name secure-nginx \
  --read-only \
  --tmpfs /tmp \
  --tmpfs /var/cache/nginx \
  --tmpfs /var/run \
  --cap-drop=ALL \
  --cap-add=CHOWN \
  --cap-add=SETGID \
  --cap-add=SETUID \
  --memory=256m \
  --cpus=0.5 \
  -p 8080:8080 \
  secure-nginx:latest
```

### 练习2：安全网络配置

创建安全网络：

```bash
# 创建内部网络
docker network create --internal secure-backend

# 创建前端网络
docker network create secure-frontend

# 运行后端服务
docker run -d \
  --name backend \
  --network=secure-backend \
  --read-only \
  --user=1000:1000 \
  backend:latest

# 运行前端服务
docker run -d \
  --name frontend \
  --network=secure-frontend \
  -p 8080:80 \
  frontend:latest

# 连接前端到后端
docker network connect secure-backend frontend
```

### 练习3：镜像安全扫描

```bash
# 使用Trivy扫描镜像
trivy image nginx:latest

# 扫描特定漏洞
trivy image --severity HIGH,CRITICAL nginx:latest

# 生成报告
trivy image --format json --output nginx-report.json nginx:latest

# 使用Docker Scout
docker scout cves nginx:latest

# 扫描本地镜像
docker scout cves myapp:latest
```

## 安全监控

### 1. 容器监控

```bash
# 监控容器资源使用
docker stats --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"

# 监控容器进程
docker exec container_id ps aux

# 监控网络连接
docker exec container_id netstat -tulpn
```

### 2. 日志监控

```bash
# 查看容器日志
docker logs container_id

# 实时监控日志
docker logs -f container_id

# 过滤错误日志
docker logs container_id 2>&1 | grep -i error
```

### 3. 安全事件监控

```bash
# 监控Docker事件
docker events --filter type=container

# 监控安全相关事件
docker events --filter event=die --filter event=kill
```

## 合规性

### 1. CIS Docker基准

```bash
# 安装Docker Bench
git clone https://github.com/docker/docker-bench-security.git
cd docker-bench-security
sudo sh docker-bench-security.sh
```

### 2. 安全配置检查

```bash
# 检查Docker配置
docker info

# 检查容器配置
docker inspect container_id | grep -A 20 "SecurityOpt"

# 检查网络配置
docker network inspect network_name
```

## 最佳实践总结

### 1. 镜像安全

- 使用官方镜像
- 定期更新基础镜像
- 扫描镜像漏洞
- 最小化镜像大小

### 2. 容器安全

- 使用非root用户
- 只读文件系统
- 资源限制
- 最小权限原则

### 3. 主机安全

- 保护Docker守护进程
- 设置正确权限
- 启用审计日志
- 定期更新系统

### 4. 网络安全

- 网络隔离
- 防火墙配置
- TLS加密
- 最小网络权限

## 常见问题

### 1. 权限问题

```bash
# 检查用户权限
docker exec container_id id

# 检查文件权限
docker exec container_id ls -la /app

# 修复权限
docker exec container_id chown -R 1000:1000 /app
```

### 2. 网络连接问题

```bash
# 检查网络配置
docker network inspect network_name

# 检查防火墙规则
iptables -L DOCKER-USER

# 测试网络连接
docker exec container_id ping google.com
```

### 3. 资源限制问题

```bash
# 检查资源使用
docker stats container_id

# 调整资源限制
docker update --memory=1g container_id

# 检查系统资源
free -h
df -h
```

## 下一步

掌握Docker安全后，您可以：

1. 继续学习 [Docker生产环境部署](./11-production-deployment.md)
2. 学习容器编排安全
3. 探索云原生安全最佳实践

## 学习检查点

完成本章学习后，您应该能够：

- [ ] 理解Docker安全的基本概念
- [ ] 掌握镜像和容器安全配置
- [ ] 了解主机和网络安全最佳实践
- [ ] 能够进行安全监控和合规性检查
- [ ] 解决Docker安全相关问题
