# Docker网络

## 🎯 学习目标

- 深入理解Docker网络模型和架构
- 掌握各种网络驱动程序的使用场景
- 学会自定义网络的创建和管理
- 了解容器间通信和服务发现机制

## 📚 Docker网络架构

### 1. 网络模型概述

```javascript
// Docker网络架构
const dockerNetworking = {
  architecture: {
    cni: 'Container Network Interface - 容器网络接口标准',
    libnetwork: 'Docker网络库，实现网络功能',
    drivers: '网络驱动程序，提供具体网络实现',
    endpoints: '网络端点，容器的网络接口'
  },

  components: {
    bridge: 'Linux网桥，连接容器到宿主机',
    veth: '虚拟以太网对，连接容器和网桥',
    iptables: '防火墙规则，实现端口映射和隔离',
    namespace: '网络命名空间，实现网络隔离'
  },

  workflow: [
    '创建网络命名空间',
    '创建veth对连接容器和网桥',
    '配置IP地址和路由',
    '设置iptables规则',
    '启用网络通信'
  ]
};

console.log('Docker网络架构:', dockerNetworking);
```

### 2. 网络驱动程序类型

```bash
# 查看可用网络驱动
docker network ls
docker info | grep -A 10 "Network:"

# 默认网络
docker network inspect bridge
docker network inspect host
docker network inspect none
```

## 🌉 网络驱动详解

### 1. Bridge网络（默认）

```bash
# 查看默认bridge网络
docker network inspect bridge

# 创建容器使用默认bridge
docker run -d --name web1 nginx:alpine
docker run -d --name web2 nginx:alpine

# 查看容器IP地址
docker inspect web1 | grep IPAddress
docker inspect web2 | grep IPAddress

# 容器间通信测试
docker exec web1 ping web2  # 失败，默认bridge不支持容器名解析
docker exec web1 ping 172.17.0.3  # 成功，使用IP地址
```

#### 自定义Bridge网络

```bash
# 创建自定义bridge网络
docker network create my-bridge

# 创建带参数的bridge网络
docker network create \
  --driver bridge \
  --subnet=172.20.0.0/16 \
  --ip-range=172.20.240.0/20 \
  --gateway=172.20.0.1 \
  my-custom-bridge

# 查看网络详情
docker network inspect my-custom-bridge

# 使用自定义网络运行容器
docker run -d --name app1 --network my-bridge nginx:alpine
docker run -d --name app2 --network my-bridge nginx:alpine

# 测试容器名解析
docker exec app1 ping app2  # 成功，自定义bridge支持DNS解析
```

### 2. Host网络

```bash
# 使用host网络模式
docker run -d --name web-host --network host nginx:alpine

# 查看网络配置
docker exec web-host ip addr show
docker exec web-host netstat -tulpn

# 注意：容器直接使用宿主机网络，端口直接绑定到宿主机
curl http://localhost:80  # 直接访问，无需端口映射
```

### 3. None网络

```bash
# 创建无网络容器
docker run -d --name isolated --network none alpine sleep 3600

# 查看网络接口（只有回环接口）
docker exec isolated ip addr show

# 手动配置网络（高级用法）
# 创建网络命名空间
sudo ip netns add test-ns

# 创建veth对
sudo ip link add veth0 type veth peer name veth1

# 配置网络接口
sudo ip link set veth1 netns test-ns
sudo ip netns exec test-ns ip addr add 192.168.1.2/24 dev veth1
sudo ip netns exec test-ns ip link set veth1 up
```

### 4. Container网络

```bash
# 创建主容器
docker run -d --name main-app nginx:alpine

# 创建共享网络的容器
docker run -d --name sidecar --network container:main-app alpine sleep 3600

# 验证网络共享
docker exec main-app ip addr show
docker exec sidecar ip addr show  # 相同的网络配置

# 测试网络共享
docker exec sidecar curl http://localhost:80  # 可以访问nginx
```

### 5. 第三方网络驱动

```bash
# Macvlan网络（给容器分配物理网络IP）
docker network create -d macvlan \
  --subnet=192.168.1.0/24 \
  --gateway=192.168.1.1 \
  -o parent=eth0 \
  macvlan-net

# IPvlan网络
docker network create -d ipvlan \
  --subnet=192.168.1.0/24 \
  --gateway=192.168.1.1 \
  -o parent=eth0 \
  ipvlan-net

# Overlay网络（Swarm模式）
docker swarm init
docker network create -d overlay my-overlay
```

## 🔧 高级网络配置

### 1. 网络安全和隔离

```bash
# 创建隔离的网络
docker network create --internal private-network

# 创建容器在隔离网络中
docker run -d --name db --network private-network postgres:13
docker run -d --name app --network private-network myapp:latest

# 测试隔离性
docker exec app ping 8.8.8.8  # 失败，无法访问外网
docker exec app ping db        # 成功，内部通信正常
```

### 2. 网络别名和服务发现

```bash
# 创建带别名的容器
docker run -d --name web1 --network my-bridge --network-alias web nginx:alpine
docker run -d --name web2 --network my-bridge --network-alias web nginx:alpine

# 测试负载均衡
docker run --rm --network my-bridge alpine nslookup web

# 创建多网络容器
docker network create frontend
docker network create backend

docker run -d --name app \
  --network frontend \
  --network backend \
  myapp:latest

# 连接已有容器到网络
docker network connect backend app
docker network disconnect frontend app
```

### 3. 端口映射和发布

```bash
# 基本端口映射
docker run -d -p 8080:80 nginx:alpine                    # 主机8080 -> 容器80
docker run -d -p 127.0.0.1:8080:80 nginx:alpine         # 绑定到特定IP
docker run -d -p 8080:80/tcp -p 9090:9090/udp myapp     # TCP和UDP端口

# 动态端口映射
docker run -d -P nginx:alpine                           # 随机映射所有暴露端口

# 查看端口映射
docker port container-name

# 端口范围映射
docker run -d -p 8080-8090:8080-8090 nginx:alpine
```

## 🛠️ 实际应用场景

### 1. 微服务架构网络

```bash
# 创建微服务网络拓扑
docker network create frontend --subnet=172.18.0.0/16
docker network create backend --subnet=172.19.0.0/16
docker network create database --subnet=172.20.0.0/16

# 前端服务
docker run -d --name nginx-proxy \
  --network frontend \
  -p 80:80 \
  -v ./nginx.conf:/etc/nginx/nginx.conf \
  nginx:alpine

# API网关
docker run -d --name api-gateway \
  --network frontend \
  --network backend \
  -p 3000:3000 \
  myapi:latest

# 后端服务
docker run -d --name user-service \
  --network backend \
  user-service:latest

docker run -d --name order-service \
  --network backend \
  order-service:latest

# 数据库
docker run -d --name postgres-db \
  --network database \
  -e POSTGRES_PASSWORD=secret \
  postgres:13

# 连接服务到数据库网络
docker network connect database user-service
docker network connect database order-service
```

### 2. 开发环境网络

```bash
#!/bin/bash
# setup-dev-network.sh

# 创建开发网络
docker network create dev-network --subnet=172.21.0.0/16

# 启动开发服务
docker run -d --name dev-db \
  --network dev-network \
  --network-alias database \
  -e POSTGRES_DB=devdb \
  -e POSTGRES_USER=dev \
  -e POSTGRES_PASSWORD=dev123 \
  -v postgres-dev-data:/var/lib/postgresql/data \
  postgres:13

docker run -d --name dev-redis \
  --network dev-network \
  --network-alias cache \
  -v redis-dev-data:/data \
  redis:alpine

docker run -d --name dev-app \
  --network dev-network \
  -p 3000:3000 \
  -v $(pwd):/app \
  -w /app \
  -e DATABASE_URL=postgresql://dev:dev123@database:5432/devdb \
  -e REDIS_URL=redis://cache:6379 \
  node:16-alpine \
  npm run dev

echo "Development environment started!"
echo "App: http://localhost:3000"
echo "Database: postgresql://dev:dev123@localhost:5432/devdb"
```

### 3. 负载均衡网络

```bash
# 创建负载均衡网络
docker network create lb-network

# 启动多个后端服务
for i in {1..3}; do
  docker run -d --name web-$i \
    --network lb-network \
    --network-alias backend \
    nginx:alpine
done

# 启动负载均衡器
docker run -d --name load-balancer \
  --network lb-network \
  -p 80:80 \
  -v ./nginx-lb.conf:/etc/nginx/nginx.conf \
  nginx:alpine
```

```nginx
# nginx-lb.conf
upstream backend {
    server backend:80;
}

server {
    listen 80;
    location / {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 🔍 网络监控和调试

### 1. 网络诊断工具

```bash
# 安装网络诊断工具容器
docker run -it --rm --net container:target-container nicolaka/netshoot

# 或者创建诊断容器
docker run -d --name netshoot \
  --network container:target-container \
  nicolaka/netshoot sleep 3600

# 网络连通性测试
docker exec netshoot ping google.com
docker exec netshoot nslookup google.com
docker exec netshoot traceroute google.com

# 端口扫描
docker exec netshoot nmap -p 1-1000 target-host

# 网络性能测试
docker exec netshoot iperf3 -c target-host

# 抓包分析
docker exec netshoot tcpdump -i eth0 -w capture.pcap
```

### 2. 网络故障排除

```bash
# 检查网络配置
docker network ls
docker network inspect network-name

# 检查容器网络配置
docker inspect container-name | grep -A 20 NetworkSettings

# 检查端口映射
docker port container-name
netstat -tulpn | grep docker-proxy

# 检查防火墙规则
sudo iptables -t nat -L -n
sudo iptables -L DOCKER -n

# 检查网桥配置
ip addr show docker0
brctl show docker0

# 检查路由表
ip route show
docker exec container-name ip route show
```

### 3. 网络性能优化

```bash
# 优化网络驱动选择
# 对于单机应用，使用host网络获得最佳性能
docker run --network host high-performance-app

# 对于需要隔离的应用，使用自定义bridge
docker network create --opt com.docker.network.bridge.name=docker1 \
  --opt com.docker.network.driver.mtu=1450 \
  optimized-bridge

# 调整网络缓冲区
docker run --sysctl net.core.rmem_max=134217728 \
  --sysctl net.core.wmem_max=134217728 \
  high-throughput-app

# 使用专用网络接口
docker run --device=/dev/net/tun --cap-add=NET_ADMIN \
  network-intensive-app
```

## 🔐 网络安全最佳实践

### 1. 网络隔离策略

```bash
# 创建分层网络架构
docker network create --internal database-tier
docker network create --internal app-tier  
docker network create frontend-tier

# 数据库只能从应用层访问
docker run -d --name database --network database-tier postgres:13

# 应用同时连接到应用层和数据库层
docker run -d --name app \
  --network app-tier \
  myapp:latest
docker network connect database-tier app

# 前端只能访问应用层
docker run -d --name frontend \
  --network frontend-tier \
  --network app-tier \
  -p 80:80 \
  nginx:alpine
```

### 2. 访问控制和防火墙

```bash
# 创建受限网络
docker network create --internal \
  --opt com.docker.network.bridge.enable_icc=false \
  restricted-network

# 使用iptables限制访问
sudo iptables -I DOCKER-USER -s 172.17.0.0/16 -d 172.18.0.0/16 -j DROP

# 创建自定义防火墙规则
#!/bin/bash
# firewall-rules.sh

# 允许容器访问特定端口
iptables -I DOCKER-USER -p tcp --dport 443 -j ACCEPT
iptables -I DOCKER-USER -p tcp --dport 80 -j ACCEPT

# 阻止容器访问宿主机敏感端口
iptables -I DOCKER-USER -p tcp --dport 22 -j DROP
iptables -I DOCKER-USER -p tcp --dport 3306 -j DROP

# 限制容器间通信
iptables -I DOCKER-USER -s 172.17.0.0/16 -d 172.17.0.0/16 -j DROP
```

### 3. 加密通信

```bash
# 使用TLS加密容器间通信
docker network create --opt encrypted overlay-encrypted

# 配置证书卷
docker run -d --name secure-app \
  --network overlay-encrypted \
  -v ./certs:/etc/ssl/certs:ro \
  secure-app:latest

# 使用Consul Connect进行服务网格
docker run -d --name consul \
  -p 8500:8500 \
  consul:latest agent -dev -ui -client=0.0.0.0
```

## 📊 网络监控脚本

```bash
#!/bin/bash
# network-monitor.sh

echo "Docker网络监控报告 - $(date)"
echo "=================================="

echo ""
echo "📋 网络列表:"
docker network ls --format "table {{.Name}}\t{{.Driver}}\t{{.Scope}}"

echo ""
echo "🔌 活动连接:"
docker ps --format "table {{.Names}}\t{{.Ports}}" | grep -v "PORTS"

echo ""
echo "📊 网络统计:"
for network in $(docker network ls --format "{{.Name}}" | grep -v bridge | grep -v host | grep -v none); do
    echo "网络: $network"
    containers=$(docker network inspect $network --format "{{range .Containers}}{{.Name}} {{end}}")
    echo "  容器: $containers"
    echo "  子网: $(docker network inspect $network --format "{{range .IPAM.Config}}{{.Subnet}}{{end}}")"
    echo ""
done

echo "🌐 端口映射:"
docker ps --format "table {{.Names}}\t{{.Ports}}" | grep -E "\->"

echo ""
echo "⚠️  网络问题检查:"
# 检查是否有孤立的网络
orphaned=$(docker network ls --filter "dangling=true" -q)
if [ ! -z "$orphaned" ]; then
    echo "发现孤立网络: $orphaned"
else
    echo "✅ 无孤立网络"
fi

# 检查网络连通性
echo ""
echo "🔍 连通性测试:"
for container in $(docker ps -q); do
    name=$(docker inspect $container --format "{{.Name}}" | sed 's/\///')
    echo -n "测试 $name 网络连接: "
    if docker exec $container ping -c 1 8.8.8.8 >/dev/null 2>&1; then
        echo "✅ 正常"
    else
        echo "❌ 异常"
    fi
done
```

## 📝 下一步

现在您已经掌握了Docker网络管理，接下来学习：

1. **[Docker数据卷](./07-docker-volumes.md)** - 深入学习数据持久化管理
2. **[Docker Compose](./08-docker-compose.md)** - 掌握多容器编排

## 🎯 本章要点

- ✅ 理解Docker网络架构和驱动程序
- ✅ 掌握各种网络模式的使用场景
- ✅ 学会创建和管理自定义网络
- ✅ 了解网络安全和隔离最佳实践
- ✅ 掌握网络监控和故障排除技巧

继续深入学习Docker数据管理！🐳
