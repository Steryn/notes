# Docker简介与安装

## 什么是Docker？

Docker是一个开源的容器化平台，它允许开发者将应用程序及其依赖项打包到一个轻量级、可移植的容器中。容器可以在任何支持Docker的环境中运行，确保应用程序在不同环境中的一致性。

## Docker的核心优势

### 1. 一致性

- **开发环境一致性**：开发、测试、生产环境完全一致
- **跨平台兼容**：Windows、Linux、macOS都能运行相同的容器

### 2. 轻量级

- **资源效率**：容器共享主机操作系统内核，比虚拟机更轻量
- **快速启动**：容器启动时间通常在几秒内

### 3. 可移植性

- **一次构建，到处运行**：容器可以在任何支持Docker的环境中运行
- **简化部署**：无需担心环境差异导致的部署问题

### 4. 可扩展性

- **水平扩展**：可以轻松创建多个容器实例
- **微服务架构**：每个服务可以独立容器化

## Docker vs 虚拟机

| 特性 | Docker容器 | 虚拟机 |
|------|------------|--------|
| 资源占用 | 轻量级，共享内核 | 重量级，独立操作系统 |
| 启动时间 | 秒级 | 分钟级 |
| 性能 | 接近原生 | 有虚拟化开销 |
| 隔离性 | 进程级隔离 | 硬件级隔离 |
| 可移植性 | 高 | 中等 |

## Docker架构

```
┌─────────────────────────────────────────┐
│              Docker Client              │
│  (docker CLI, Docker Desktop, etc.)     │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│            Docker Daemon                │
│  (dockerd - 管理容器、镜像、网络等)        │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│            Docker Registry              │
│  (Docker Hub, 私有仓库等)                │
└─────────────────────────────────────────┘
```

## Docker安装

### macOS安装

#### 方法1：Docker Desktop（推荐）

1. 访问 [Docker官网](https://www.docker.com/products/docker-desktop/)
2. 下载Docker Desktop for Mac
3. 安装并启动Docker Desktop
4. 验证安装：

```bash
docker --version
docker run hello-world
```

#### 方法2：使用Homebrew

```bash
# 安装Docker Desktop
brew install --cask docker

# 启动Docker Desktop
open /Applications/Docker.app
```

### Linux安装

#### Ubuntu/Debian

```bash
# 更新包索引
sudo apt-get update

# 安装必要的包
sudo apt-get install \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

# 添加Docker官方GPG密钥
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# 设置稳定版仓库
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# 安装Docker Engine
sudo apt-get update
sudo apt-get install docker-ce docker-ce-cli containerd.io docker-compose-plugin

# 启动Docker服务
sudo systemctl start docker
sudo systemctl enable docker

# 将当前用户添加到docker组（可选）
sudo usermod -aG docker $USER
```

#### CentOS/RHEL

```bash
# 安装yum-utils
sudo yum install -y yum-utils

# 添加Docker仓库
sudo yum-config-manager \
    --add-repo \
    https://download.docker.com/linux/centos/docker-ce.repo

# 安装Docker Engine
sudo yum install docker-ce docker-ce-cli containerd.io docker-compose-plugin

# 启动Docker服务
sudo systemctl start docker
sudo systemctl enable docker
```

### Windows安装

1. 访问 [Docker官网](https://www.docker.com/products/docker-desktop/)
2. 下载Docker Desktop for Windows
3. 运行安装程序
4. 重启计算机
5. 启动Docker Desktop

## 验证安装

安装完成后，运行以下命令验证Docker是否正确安装：

```bash
# 检查Docker版本
docker --version

# 检查Docker Compose版本
docker compose version

# 运行Hello World容器
docker run hello-world

# 查看Docker系统信息
docker info
```

## 常见问题解决

### 1. Docker Desktop启动失败

- 确保系统满足最低要求
- 检查虚拟化是否启用
- 重启Docker Desktop

### 2. 权限问题（Linux）

```bash
# 将用户添加到docker组
sudo usermod -aG docker $USER

# 重新登录或运行
newgrp docker
```

### 3. 网络连接问题

- 检查防火墙设置
- 确保Docker可以访问互联网
- 配置代理（如果需要）

## 下一步

安装完成后，您可以：

1. 继续学习 [Docker基本概念](./02-docker-basics.md)
2. 尝试运行一些简单的Docker命令
3. 探索Docker Hub上的公共镜像

## 学习检查点

完成本章学习后，您应该能够：

- [ ] 理解Docker的基本概念和优势
- [ ] 区分Docker容器和虚拟机的差异
- [ ] 在您的系统上成功安装Docker
- [ ] 运行基本的Docker命令验证安装
