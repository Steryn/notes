# Docker镜像操作

## 镜像基础

Docker镜像是容器的基础，理解镜像的工作原理对于有效使用Docker至关重要。

## 镜像结构

### 分层存储

Docker镜像采用分层存储架构，每一层都是只读的：

```
┌─────────────────────────────────┐
│        应用层 (可写层)            │
├─────────────────────────────────┤
│        配置文件层                │
├─────────────────────────────────┤
│        依赖库层                  │
├─────────────────────────────────┤
│        运行时环境层              │
├─────────────────────────────────┤
│        操作系统层                │
└─────────────────────────────────┘
```

### 镜像ID和标签

- **镜像ID**：每个镜像都有唯一的SHA256哈希值
- **标签**：人类可读的名称，如 `nginx:1.21` 或 `ubuntu:20.04`

## 镜像操作命令

### 查看镜像

```bash
# 列出本地镜像
docker images
docker image ls

# 显示镜像ID
docker images -q

# 显示所有镜像（包括中间层）
docker images -a

# 按创建时间排序
docker images --sort=time

# 格式化输出
docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"
```

### 搜索镜像

```bash
# 在Docker Hub搜索镜像
docker search nginx

# 限制搜索结果数量
docker search --limit 5 nginx

# 搜索官方镜像
docker search --filter is-official=true nginx
```

### 拉取镜像

```bash
# 拉取最新版本
docker pull nginx

# 拉取指定版本
docker pull nginx:1.21

# 拉取所有标签
docker pull -a nginx

# 从私有仓库拉取
docker pull myregistry.com/myapp:v1.0
```

### 推送镜像

```bash
# 标记镜像
docker tag nginx:latest myregistry.com/nginx:v1.0

# 推送镜像
docker push myregistry.com/nginx:v1.0

# 推送所有标签
docker push -a myregistry.com/nginx
```

### 删除镜像

```bash
# 删除指定镜像
docker rmi nginx:latest

# 强制删除镜像
docker rmi -f nginx:latest

# 删除所有未使用的镜像
docker image prune

# 删除所有镜像（包括正在使用的）
docker rmi $(docker images -q)

# 删除悬空镜像（没有标签的镜像）
docker image prune -f
```

## 镜像构建

### 从Dockerfile构建

```bash
# 构建镜像
docker build -t myapp:latest .

# 指定Dockerfile路径
docker build -f /path/to/Dockerfile -t myapp:latest .

# 构建时传递参数
docker build --build-arg VERSION=1.0 -t myapp:latest .

# 不使用缓存构建
docker build --no-cache -t myapp:latest .
```

### 从容器创建镜像

```bash
# 从运行中的容器创建镜像
docker commit container_id myapp:v1.0

# 添加提交信息
docker commit -m "添加新功能" -a "作者名" container_id myapp:v1.0
```

## 镜像导入导出

### 导出镜像

```bash
# 导出镜像为tar文件
docker save -o nginx.tar nginx:latest

# 导出多个镜像
docker save -o images.tar nginx:latest ubuntu:20.04

# 导出到标准输出
docker save nginx:latest | gzip > nginx.tar.gz
```

### 导入镜像

```bash
# 从tar文件导入镜像
docker load -i nginx.tar

# 从标准输入导入
docker load < nginx.tar

# 从压缩文件导入
gunzip -c nginx.tar.gz | docker load
```

## 镜像信息查看

### 查看镜像详细信息

```bash
# 查看镜像详细信息
docker inspect nginx:latest

# 查看特定信息
docker inspect -f '{{.Config.Env}}' nginx:latest

# 查看镜像历史
docker history nginx:latest

# 查看镜像大小
docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"
```

### 镜像分析

```bash
# 分析镜像层
docker history --no-trunc nginx:latest

# 查看镜像配置
docker inspect nginx:latest | jq '.[0].Config'

# 查看镜像环境变量
docker inspect nginx:latest | jq '.[0].Config.Env'
```

## 实践练习

### 练习1：镜像基础操作

```bash
# 1. 搜索并拉取nginx镜像
docker search nginx
docker pull nginx:1.21

# 2. 查看镜像信息
docker images
docker inspect nginx:1.21

# 3. 查看镜像历史
docker history nginx:1.21

# 4. 运行容器测试
docker run -d -p 8080:80 --name test-nginx nginx:1.21

# 5. 访问 http://localhost:8080 验证

# 6. 清理
docker stop test-nginx
docker rm test-nginx
```

### 练习2：镜像导入导出

```bash
# 1. 导出nginx镜像
docker save -o nginx-backup.tar nginx:1.21

# 2. 删除本地镜像
docker rmi nginx:1.21

# 3. 从备份文件导入
docker load -i nginx-backup.tar

# 4. 验证镜像恢复
docker images | grep nginx

# 5. 清理备份文件
rm nginx-backup.tar
```

### 练习3：从容器创建镜像

```bash
# 1. 运行Ubuntu容器
docker run -it --name temp-ubuntu ubuntu:20.04 /bin/bash

# 2. 在容器内安装软件（在容器内执行）
apt update
apt install -y curl vim

# 3. 退出容器
exit

# 4. 从容器创建镜像
docker commit temp-ubuntu my-ubuntu:custom

# 5. 验证新镜像
docker images | grep my-ubuntu

# 6. 测试新镜像
docker run --rm my-ubuntu:custom curl --version

# 7. 清理
docker rm temp-ubuntu
```

## 镜像优化技巧

### 1. 选择合适的基础镜像

```dockerfile
# 使用Alpine Linux减小镜像大小
FROM alpine:3.14

# 使用distroless镜像提高安全性
FROM gcr.io/distroless/java:11
```

### 2. 多阶段构建

```dockerfile
# 构建阶段
FROM node:16 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# 运行阶段
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
```

### 3. 层缓存优化

```dockerfile
# 先复制依赖文件，利用缓存
COPY package*.json ./
RUN npm install

# 再复制源代码
COPY . .
RUN npm run build
```

## 镜像安全

### 1. 扫描镜像漏洞

```bash
# 使用Docker Scout扫描（需要登录）
docker scout cves nginx:latest

# 使用Trivy扫描
trivy image nginx:latest
```

### 2. 使用官方镜像

```bash
# 优先使用官方镜像
docker pull nginx:latest  # 官方镜像
docker pull bitnami/nginx  # 第三方镜像
```

### 3. 定期更新镜像

```bash
# 拉取最新版本
docker pull nginx:latest

# 检查更新
docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.CreatedAt}}"
```

## 常见问题

### 1. 镜像拉取失败

```bash
# 检查网络连接
ping registry-1.docker.io

# 配置镜像加速器（中国用户）
# 在Docker Desktop设置中添加镜像源
```

### 2. 镜像占用空间过大

```bash
# 清理未使用的镜像
docker image prune -a

# 查看镜像大小
docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"
```

### 3. 镜像标签混乱

```bash
# 查看所有标签
docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.ID}}"

# 删除悬空镜像
docker image prune -f
```

## 最佳实践

1. **使用具体标签**：避免使用latest标签
2. **定期更新**：保持镜像版本更新
3. **安全扫描**：定期扫描镜像漏洞
4. **优化大小**：使用多阶段构建减小镜像
5. **版本管理**：为镜像打上有意义的标签

## 下一步

掌握镜像操作后，您可以：

1. 继续学习 [Docker容器操作](./04-docker-containers.md)
2. 学习编写Dockerfile
3. 探索镜像构建的最佳实践

## 学习检查点

完成本章学习后，您应该能够：

- [ ] 理解Docker镜像的分层结构
- [ ] 熟练进行镜像的增删改查操作
- [ ] 掌握镜像的导入导出方法
- [ ] 了解镜像优化和安全最佳实践
- [ ] 解决镜像相关的常见问题
