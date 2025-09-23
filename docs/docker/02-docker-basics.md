# Docker基本概念

## 核心概念

### 1. 镜像（Image）

Docker镜像是只读的模板，包含了运行应用程序所需的所有内容：代码、运行时、库、环境变量和配置文件。

**特点：**

- 分层存储：镜像由多个只读层组成
- 不可变：镜像一旦创建就不能修改
- 可复用：一个镜像可以创建多个容器

### 2. 容器（Container）

容器是镜像的运行实例，是一个轻量级、可执行的独立软件包。

**特点：**

- 可写层：在镜像基础上添加一个可写层
- 生命周期：可以启动、停止、删除
- 隔离性：每个容器都有独立的文件系统、网络和进程空间

### 3. 仓库（Repository）

仓库是集中存储镜像的地方，类似于代码仓库。

**类型：**

- **公共仓库**：Docker Hub（默认）
- **私有仓库**：企业内部使用
- **本地仓库**：本地存储的镜像

## Docker工作流程

```
1. 编写Dockerfile
   ↓
2. 构建镜像 (docker build)
   ↓
3. 运行容器 (docker run)
   ↓
4. 管理容器 (start/stop/restart)
```

## 基本命令

### 镜像相关命令

```bash
# 查看本地镜像
docker images
# 或者
docker image ls

# 搜索镜像
docker search nginx

# 拉取镜像
docker pull nginx:latest

# 删除镜像
docker rmi nginx:latest
# 或者
docker image rm nginx:latest

# 查看镜像详细信息
docker inspect nginx:latest

# 查看镜像历史
docker history nginx:latest
```

### 容器相关命令

```bash
# 运行容器
docker run nginx:latest

# 运行容器并进入交互模式
docker run -it ubuntu:latest /bin/bash

# 后台运行容器
docker run -d nginx:latest

# 指定容器名称
docker run --name my-nginx nginx:latest

# 端口映射
docker run -p 8080:80 nginx:latest

# 查看运行中的容器
docker ps

# 查看所有容器（包括停止的）
docker ps -a

# 停止容器
docker stop container_id

# 启动已停止的容器
docker start container_id

# 重启容器
docker restart container_id

# 删除容器
docker rm container_id

# 强制删除运行中的容器
docker rm -f container_id
```

### 容器交互命令

```bash
# 进入运行中的容器
docker exec -it container_id /bin/bash

# 查看容器日志
docker logs container_id

# 查看容器详细信息
docker inspect container_id

# 查看容器进程
docker top container_id

# 查看容器资源使用情况
docker stats container_id
```

## 实践练习

### 练习1：运行第一个容器

```bash
# 1. 拉取hello-world镜像
docker pull hello-world

# 2. 运行hello-world容器
docker run hello-world

# 3. 查看容器列表
docker ps -a
```

### 练习2：运行Web服务器

```bash
# 1. 拉取nginx镜像
docker pull nginx:latest

# 2. 运行nginx容器，映射端口
docker run -d -p 8080:80 --name my-nginx nginx:latest

# 3. 访问 http://localhost:8080 查看nginx欢迎页面

# 4. 查看容器状态
docker ps

# 5. 查看容器日志
docker logs my-nginx

# 6. 停止并删除容器
docker stop my-nginx
docker rm my-nginx
```

### 练习3：交互式容器

```bash
# 1. 运行Ubuntu容器并进入bash
docker run -it ubuntu:latest /bin/bash

# 2. 在容器内执行命令
apt update
apt install -y curl
curl --version

# 3. 退出容器
exit

# 4. 查看容器
docker ps -a
```

## 常用参数说明

### docker run 参数

| 参数 | 说明 | 示例 |
|------|------|------|
| `-d` | 后台运行 | `docker run -d nginx` |
| `-it` | 交互式终端 | `docker run -it ubuntu /bin/bash` |
| `-p` | 端口映射 | `docker run -p 8080:80 nginx` |
| `-v` | 数据卷挂载 | `docker run -v /host/path:/container/path nginx` |
| `-e` | 环境变量 | `docker run -e MYSQL_ROOT_PASSWORD=123456 mysql` |
| `--name` | 容器名称 | `docker run --name my-app nginx` |
| `--rm` | 容器停止后自动删除 | `docker run --rm nginx` |

## 镜像命名规范

```
[仓库地址/]命名空间/镜像名:标签

示例：
- nginx:latest
- ubuntu:20.04
- mysql:8.0
- myregistry.com/myapp:v1.0
```

## 容器生命周期

```
创建 → 运行 → 停止 → 删除
  ↑      ↓      ↓
  └──────┴──────┘
     重启/启动
```

## 最佳实践

### 1. 镜像管理

- 使用具体的标签而不是latest
- 定期清理未使用的镜像
- 使用多阶段构建减小镜像大小

### 2. 容器管理

- 为容器指定有意义的名称
- 使用--rm参数运行临时容器
- 定期清理停止的容器

### 3. 资源管理

- 限制容器的CPU和内存使用
- 使用数据卷持久化重要数据
- 合理配置端口映射

## 常见问题

### 1. 容器无法启动

```bash
# 查看容器日志
docker logs container_id

# 检查镜像是否存在
docker images
```

### 2. 端口冲突

```bash
# 查看端口占用
netstat -tulpn | grep :8080

# 使用不同端口
docker run -p 8081:80 nginx
```

### 3. 容器内无法访问网络

```bash
# 检查网络配置
docker network ls
docker network inspect bridge
```

## 下一步

掌握基本概念后，您可以：

1. 继续学习 [Docker镜像操作](./03-docker-images.md)
2. 尝试运行不同类型的容器
3. 探索Docker Hub上的更多镜像

## 学习检查点

完成本章学习后，您应该能够：

- [ ] 理解Docker的核心概念（镜像、容器、仓库）
- [ ] 熟练使用基本的Docker命令
- [ ] 运行简单的容器应用
- [ ] 管理容器的生命周期
- [ ] 解决常见的Docker问题
