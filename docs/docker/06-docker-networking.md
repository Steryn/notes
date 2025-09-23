# Docker网络

## 网络基础

Docker网络是容器之间以及容器与外部世界通信的基础。理解Docker网络对于构建复杂的多容器应用至关重要。

## Docker网络类型

### 1. Bridge网络（默认）

- 默认网络模式
- 容器间可以相互通信
- 通过端口映射访问外部

### 2. Host网络

- 容器直接使用主机网络
- 性能最好，但隔离性最差
- 端口直接暴露在主机上

### 3. None网络

- 禁用网络功能
- 容器完全隔离
- 适用于特殊安全需求

### 4. Overlay网络

- 跨主机容器通信
- 用于Docker Swarm集群
- 支持服务发现

### 5. Macvlan网络

- 容器获得MAC地址
- 直接连接到物理网络
- 适用于遗留应用

## 网络管理命令

### 查看网络

```bash
# 列出所有网络
docker network ls

# 查看网络详细信息
docker network inspect bridge

# 查看容器网络信息
docker inspect container_id | grep -A 20 "NetworkSettings"
```

### 创建网络

```bash
# 创建自定义网络
docker network create my-network

# 创建网络并指定子网
docker network create --subnet=172.20.0.0/16 my-network

# 创建网络并指定网关
docker network create --subnet=172.20.0.0/16 --gateway=172.20.0.1 my-network

# 创建网络并指定驱动
docker network create --driver bridge my-network
```

### 连接网络

```bash
# 运行容器时连接到网络
docker run --network=my-network nginx

# 将运行中的容器连接到网络
docker network connect my-network container_id

# 断开容器与网络的连接
docker network disconnect my-network container_id
```

### 删除网络

```bash
# 删除网络
docker network rm my-network

# 删除所有未使用的网络
docker network prune
```

## 网络配置

### 端口映射

```bash
# 映射单个端口
docker run -p 8080:80 nginx

# 映射多个端口
docker run -p 8080:80 -p 8443:443 nginx

# 映射到特定IP
docker run -p 127.0.0.1:8080:80 nginx

# 映射到随机端口
docker run -P nginx

# 映射UDP端口
docker run -p 8080:80/udp nginx
```

### 环境变量

```bash
# 设置容器主机名
docker run --hostname=web-server nginx

# 设置DNS服务器
docker run --dns=8.8.8.8 nginx

# 设置DNS搜索域
docker run --dns-search=example.com nginx

# 添加主机条目
docker run --add-host=db:192.168.1.100 nginx
```

## 实践练习

### 练习1：基础网络操作

```bash
# 1. 查看默认网络
docker network ls

# 2. 创建自定义网络
docker network create --subnet=172.20.0.0/16 my-app-network

# 3. 运行两个容器并连接到同一网络
docker run -d --name web-server --network=my-app-network nginx:alpine
docker run -d --name db-server --network=my-app-network mysql:8.0

# 4. 测试容器间通信
docker exec web-server ping db-server

# 5. 查看网络详细信息
docker network inspect my-app-network

# 6. 清理
docker stop web-server db-server
docker rm web-server db-server
docker network rm my-app-network
```

### 练习2：多网络容器

```bash
# 1. 创建两个网络
docker network create frontend-network
docker network create backend-network

# 2. 运行前端容器
docker run -d --name frontend --network=frontend-network nginx:alpine

# 3. 运行后端容器
docker run -d --name backend --network=backend-network node:16-alpine

# 4. 将后端容器连接到前端网络
docker network connect frontend-network backend

# 5. 测试通信
docker exec frontend ping backend
docker exec backend ping frontend

# 6. 查看容器网络配置
docker inspect frontend | grep -A 20 "NetworkSettings"
docker inspect backend | grep -A 20 "NetworkSettings"

# 7. 清理
docker stop frontend backend
docker rm frontend backend
docker network rm frontend-network backend-network
```

### 练习3：端口映射和负载均衡

```bash
# 1. 运行多个nginx容器
docker run -d --name nginx1 -p 8080:80 nginx:alpine
docker run -d --name nginx2 -p 8081:80 nginx:alpine
docker run -d --name nginx3 -p 8082:80 nginx:alpine

# 2. 修改每个容器的默认页面
docker exec nginx1 sh -c 'echo "Server 1" > /usr/share/nginx/html/index.html'
docker exec nginx2 sh -c 'echo "Server 2" > /usr/share/nginx/html/index.html'
docker exec nginx3 sh -c 'echo "Server 3" > /usr/share/nginx/html/index.html'

# 3. 测试访问
curl http://localhost:8080
curl http://localhost:8081
curl http://localhost:8082

# 4. 清理
docker stop nginx1 nginx2 nginx3
docker rm nginx1 nginx2 nginx3
```

## 网络驱动详解

### Bridge驱动

```bash
# 创建bridge网络
docker network create --driver bridge \
  --subnet=172.20.0.0/16 \
  --gateway=172.20.0.1 \
  --ip-range=172.20.240.0/20 \
  my-bridge-network

# 运行容器
docker run -d --name web --network=my-bridge-network nginx
docker run -d --name db --network=my-bridge-network mysql

# 测试通信
docker exec web ping db
```

### Host驱动

```bash
# 创建host网络
docker network create --driver host my-host-network

# 运行容器（注意：host网络不支持端口映射）
docker run -d --name web --network=host nginx

# 直接访问主机端口
curl http://localhost:80
```

### Overlay驱动

```bash
# 创建overlay网络（需要Docker Swarm）
docker swarm init
docker network create --driver overlay my-overlay-network

# 创建服务
docker service create --name web --network=my-overlay-network nginx
```

## 网络故障排除

### 常见问题诊断

```bash
# 1. 检查网络连接
docker exec container_id ping google.com

# 2. 检查DNS解析
docker exec container_id nslookup google.com

# 3. 检查端口监听
docker exec container_id netstat -tulpn

# 4. 检查路由表
docker exec container_id ip route

# 5. 检查网络接口
docker exec container_id ip addr
```

### 网络调试工具

```bash
# 安装网络工具
docker run -it --rm --network=host nicolaka/netshoot

# 使用netshoot调试网络
docker run -it --rm --network=container:target_container nicolaka/netshoot
```

## 安全考虑

### 网络隔离

```bash
# 创建隔离网络
docker network create --internal isolated-network

# 运行容器（无法访问外部网络）
docker run -d --name isolated-app --network=isolated-network nginx
```

### 防火墙配置

```bash
# 限制容器间通信
docker network create --opt com.docker.network.bridge.enable_icc=false my-network

# 配置iptables规则
iptables -A DOCKER-USER -i docker0 -j DROP
```

## 性能优化

### 网络性能调优

```bash
# 使用host网络提高性能
docker run --network=host nginx

# 使用macvlan网络
docker network create -d macvlan \
  --subnet=192.168.1.0/24 \
  --gateway=192.168.1.1 \
  -o parent=eth0 \
  my-macvlan-network
```

### 带宽限制

```bash
# 限制容器网络带宽
docker run --network=my-network \
  --sysctl net.core.rmem_max=16777216 \
  nginx
```

## 最佳实践

### 1. 网络设计原则

- **最小权限**：只开放必要的端口
- **网络隔离**：不同服务使用不同网络
- **服务发现**：使用容器名称进行服务发现
- **负载均衡**：使用反向代理进行负载均衡

### 2. 安全最佳实践

```bash
# 使用内部网络
docker network create --internal backend-network

# 限制网络访问
docker run --network=backend-network --read-only nginx

# 使用非特权用户
docker run --user=1000:1000 nginx
```

### 3. 监控和日志

```bash
# 监控网络流量
docker stats --format "table {{.Container}}\t{{.NetIO}}"

# 查看网络日志
docker logs container_id 2>&1 | grep -i network
```

## 常见问题

### 1. 容器无法访问外部网络

```bash
# 检查DNS配置
docker exec container_id cat /etc/resolv.conf

# 检查路由表
docker exec container_id ip route

# 重启Docker服务
sudo systemctl restart docker
```

### 2. 容器间无法通信

```bash
# 检查网络连接
docker network inspect network_name

# 检查防火墙规则
iptables -L DOCKER-USER

# 检查容器网络配置
docker inspect container_id | grep -A 20 "NetworkSettings"
```

### 3. 端口映射不工作

```bash
# 检查端口占用
netstat -tulpn | grep :8080

# 检查Docker进程
ps aux | grep docker

# 重启Docker服务
sudo systemctl restart docker
```

## 下一步

掌握Docker网络后，您可以：

1. 继续学习 [Docker数据卷](./07-docker-volumes.md)
2. 学习Docker Compose进行多容器编排
3. 探索Docker Swarm集群网络

## 学习检查点

完成本章学习后，您应该能够：

- [ ] 理解Docker网络的基本概念和类型
- [ ] 熟练进行网络创建、连接和管理
- [ ] 掌握端口映射和网络配置
- [ ] 了解网络故障排除方法
- [ ] 应用网络安全和性能最佳实践
