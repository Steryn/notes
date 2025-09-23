# Docker生产环境部署

## 🎯 学习目标

- 掌握生产环境Docker部署策略和最佳实践
- 学会容器编排和高可用架构设计
- 了解负载均衡、服务发现和故障恢复机制
- 掌握持续集成/持续部署(CI/CD)流程

## 📚 生产环境部署概述

### 1. 生产环境要求

```javascript
// 生产环境部署要求
const productionRequirements = {
  availability: {
    uptime: '99.9%+ SLA要求',
    redundancy: '多实例冗余',
    failover: '自动故障转移',
    disaster_recovery: '灾难恢复计划'
  },
  
  performance: {
    latency: '低延迟响应',
    throughput: '高吞吐量',
    scalability: '弹性扩缩容',
    resource_optimization: '资源优化'
  },
  
  security: {
    access_control: '访问控制',
    data_protection: '数据保护',
    network_security: '网络安全',
    compliance: '合规要求'
  },
  
  monitoring: {
    health_checks: '健康检查',
    metrics_collection: '指标收集',
    alerting: '告警机制',
    logging: '日志管理'
  },
  
  deployment: {
    zero_downtime: '零停机部署',
    rollback: '快速回滚',
    blue_green: '蓝绿部署',
    canary: '金丝雀发布'
  }
};

console.log('生产环境要求:', productionRequirements);
```

### 2. 部署架构选择

```bash
# 1. 单机部署（适合小型应用）
docker-compose -f docker-compose.prod.yml up -d

# 2. Docker Swarm集群（中型应用）
docker swarm init
docker stack deploy -c docker-stack.yml myapp

# 3. Kubernetes集群（大型应用）
kubectl apply -f k8s-manifests/

# 4. 云服务部署（托管服务）
# AWS ECS, Google Cloud Run, Azure Container Instances
```

## 🚀 高可用部署架构

### 1. Docker Swarm生产部署

```yaml
# docker-stack.yml - Swarm集群部署
version: '3.8'

services:
  # 前端负载均衡
  proxy:
    image: nginx:alpine
    ports:
      - target: 80
        published: 80
        mode: host
      - target: 443
        published: 443
        mode: host
    configs:
      - source: nginx_config
        target: /etc/nginx/nginx.conf
    secrets:
      - ssl_certificate
      - ssl_private_key
    deploy:
      mode: global
      placement:
        constraints:
          - node.role == manager
      update_config:
        parallelism: 1
        delay: 30s
        failure_action: rollback
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3
    networks:
      - frontend
      - monitoring

  # Web应用服务
  web:
    image: myapp:${VERSION:-latest}
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://app:${DB_PASSWORD}@database:5432/myapp
      - REDIS_URL=redis://cache:6379
    secrets:
      - db_password
      - jwt_secret
    configs:
      - source: app_config
        target: /app/config/production.yml
    deploy:
      replicas: 3
      placement:
        max_replicas_per_node: 1
        constraints:
          - node.labels.type == worker
      update_config:
        parallelism: 1
        delay: 10s
        failure_action: rollback
        monitor: 60s
      rollback_config:
        parallelism: 1
        delay: 0s
        monitor: 60s
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s
    networks:
      - frontend
      - backend
    volumes:
      - app_uploads:/app/uploads

  # 数据库服务
  database:
    image: postgres:13
    environment:
      - POSTGRES_DB=myapp
      - POSTGRES_USER=app
      - POSTGRES_PASSWORD_FILE=/run/secrets/db_password
    secrets:
      - db_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    deploy:
      replicas: 1
      placement:
        constraints:
          - node.labels.type == database
      restart_policy:
        condition: on-failure
        delay: 10s
        max_attempts: 3
      resources:
        limits:
          memory: 2G
        reservations:
          memory: 1G
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U app -d myapp"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - backend

  # 缓存服务
  cache:
    image: redis:alpine
    command: redis-server --appendonly yes --maxmemory 512mb --maxmemory-policy allkeys-lru
    volumes:
      - redis_data:/data
    deploy:
      replicas: 1
      placement:
        constraints:
          - node.labels.type == cache
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3
      resources:
        limits:
          memory: 512M
        reservations:
          memory: 256M
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 3
    networks:
      - backend

  # 消息队列
  queue:
    image: rabbitmq:3-management
    environment:
      - RABBITMQ_DEFAULT_USER=admin
      - RABBITMQ_DEFAULT_PASS_FILE=/run/secrets/rabbitmq_password
    secrets:
      - rabbitmq_password
    volumes:
      - rabbitmq_data:/var/lib/rabbitmq
    deploy:
      replicas: 1
      placement:
        constraints:
          - node.labels.type == queue
      restart_policy:
        condition: on-failure
        delay: 10s
        max_attempts: 3
    networks:
      - backend

  # 工作进程
  worker:
    image: myapp:${VERSION:-latest}
    command: ["npm", "run", "worker"]
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://app:${DB_PASSWORD}@database:5432/myapp
      - REDIS_URL=redis://cache:6379
      - RABBITMQ_URL=amqp://admin:${RABBITMQ_PASSWORD}@queue:5672
    secrets:
      - db_password
      - rabbitmq_password
    deploy:
      replicas: 2
      placement:
        constraints:
          - node.labels.type == worker
      update_config:
        parallelism: 1
        delay: 10s
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
    networks:
      - backend

# 网络定义
networks:
  frontend:
    driver: overlay
    attachable: true
  backend:
    driver: overlay
    internal: true
  monitoring:
    driver: overlay
    attachable: true

# 数据卷定义
volumes:
  postgres_data:
    driver: local
  redis_data:
    driver: local
  rabbitmq_data:
    driver: local
  app_uploads:
    driver: local

# 配置文件
configs:
  nginx_config:
    external: true
  app_config:
    external: true

# 密钥管理
secrets:
  db_password:
    external: true
  jwt_secret:
    external: true
  rabbitmq_password:
    external: true
  ssl_certificate:
    external: true
  ssl_private_key:
    external: true
```

### 2. 集群初始化脚本

```bash
#!/bin/bash
# setup-swarm-cluster.sh

set -e

# 配置变量
MANAGER_NODE="manager1"
WORKER_NODES="worker1 worker2"
DATABASE_NODE="db1"
CACHE_NODE="cache1"

echo "🏗️ 初始化Docker Swarm集群"
echo "=========================="

# 1. 初始化Swarm集群
echo "📋 初始化Swarm管理节点..."
docker swarm init --advertise-addr $(hostname -I | awk '{print $1}')

# 获取加入token
MANAGER_TOKEN=$(docker swarm join-token manager -q)
WORKER_TOKEN=$(docker swarm join-token worker -q)

echo "管理节点Token: $MANAGER_TOKEN"
echo "工作节点Token: $WORKER_TOKEN"

# 2. 设置节点标签
echo "🏷️ 设置节点标签..."
docker node update --label-add type=manager $MANAGER_NODE

for worker in $WORKER_NODES; do
    docker node update --label-add type=worker $worker
done

docker node update --label-add type=database $DATABASE_NODE
docker node update --label-add type=cache $CACHE_NODE

# 3. 创建网络
echo "🌐 创建Overlay网络..."
docker network create --driver overlay --attachable frontend
docker network create --driver overlay --internal backend
docker network create --driver overlay --attachable monitoring

# 4. 创建secrets
echo "🔐 创建secrets..."
echo "super-secret-db-password" | docker secret create db_password -
echo "jwt-super-secret-key" | docker secret create jwt_secret -
echo "rabbitmq-admin-password" | docker secret create rabbitmq_password -

# SSL证书
if [ -f "./ssl/cert.pem" ] && [ -f "./ssl/key.pem" ]; then
    docker secret create ssl_certificate ./ssl/cert.pem
    docker secret create ssl_private_key ./ssl/key.pem
fi

# 5. 创建configs
echo "📄 创建configs..."
docker config create nginx_config ./nginx/nginx.conf
docker config create app_config ./app/production.yml

# 6. 部署应用栈
echo "🚀 部署应用栈..."
export VERSION=$(git rev-parse --short HEAD)
docker stack deploy -c docker-stack.yml myapp

echo "✅ Swarm集群部署完成!"
echo ""
echo "检查服务状态:"
docker service ls
echo ""
echo "检查节点状态:"
docker node ls
```

## 🔄 零停机部署策略

### 1. 蓝绿部署

```bash
#!/bin/bash
# blue-green-deploy.sh

set -e

STACK_NAME="myapp"
NEW_VERSION=$1
CURRENT_ENV="blue"
TARGET_ENV="green"

if [ -z "$NEW_VERSION" ]; then
    echo "Usage: $0 <version>"
    exit 1
fi

echo "🔄 蓝绿部署开始"
echo "当前环境: $CURRENT_ENV"
echo "目标环境: $TARGET_ENV"
echo "新版本: $NEW_VERSION"

# 1. 部署到目标环境
echo "📦 部署新版本到 $TARGET_ENV 环境..."
export VERSION=$NEW_VERSION
export ENVIRONMENT=$TARGET_ENV

docker stack deploy -c docker-stack.yml ${STACK_NAME}-${TARGET_ENV}

# 2. 等待服务就绪
echo "⏳ 等待服务启动..."
timeout=300
counter=0

while [ $counter -lt $timeout ]; do
    ready_services=$(docker service ls --filter name=${STACK_NAME}-${TARGET_ENV} --format "{{.Replicas}}" | grep -c "^[0-9]*/[0-9]*$" || echo 0)
    total_services=$(docker service ls --filter name=${STACK_NAME}-${TARGET_ENV} --quiet | wc -l)
    
    if [ $ready_services -eq $total_services ] && [ $total_services -gt 0 ]; then
        echo "✅ 所有服务已就绪"
        break
    fi
    
    echo "等待服务就绪... ($ready_services/$total_services)"
    sleep 10
    counter=$((counter + 10))
done

if [ $counter -eq $timeout ]; then
    echo "❌ 服务启动超时"
    exit 1
fi

# 3. 健康检查
echo "🏥 执行健康检查..."
health_check_url="http://localhost:8080/health"  # 通过负载均衡器访问

for i in {1..10}; do
    if curl -f $health_check_url >/dev/null 2>&1; then
        echo "✅ 健康检查通过"
        break
    fi
    
    if [ $i -eq 10 ]; then
        echo "❌ 健康检查失败"
        echo "回滚部署..."
        docker stack rm ${STACK_NAME}-${TARGET_ENV}
        exit 1
    fi
    
    echo "健康检查重试 $i/10..."
    sleep 10
done

# 4. 切换流量
echo "🔀 切换流量到新环境..."
# 更新负载均衡器配置
docker service update --config-rm nginx_config_old --config-add source=nginx_config_new,target=/etc/nginx/nginx.conf ${STACK_NAME}-proxy

# 5. 验证流量切换
echo "🔍 验证流量切换..."
sleep 30

# 6. 清理旧环境
read -p "是否删除旧环境 $CURRENT_ENV? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🧹 清理旧环境..."
    docker stack rm ${STACK_NAME}-${CURRENT_ENV}
    echo "✅ 蓝绿部署完成"
else
    echo "⚠️ 保留旧环境，请手动清理"
fi
```

### 2. 金丝雀发布

```bash
#!/bin/bash
# canary-deploy.sh

STACK_NAME="myapp"
NEW_VERSION=$1
CANARY_PERCENTAGE=${2:-10}

echo "🐤 金丝雀发布开始"
echo "新版本: $NEW_VERSION"
echo "金丝雀流量比例: $CANARY_PERCENTAGE%"

# 1. 部署金丝雀版本
echo "📦 部署金丝雀版本..."
export VERSION=$NEW_VERSION
export REPLICAS=1

docker service create \
    --name ${STACK_NAME}-web-canary \
    --network frontend \
    --network backend \
    --label canary=true \
    --label version=$NEW_VERSION \
    myapp:$NEW_VERSION

# 2. 配置负载均衡器权重
echo "⚖️ 配置流量分发..."
# 更新nginx配置，设置upstream权重
cat > nginx-canary.conf << EOF
upstream backend {
    server myapp-web:3000 weight=$((100-CANARY_PERCENTAGE));
    server myapp-web-canary:3000 weight=$CANARY_PERCENTAGE;
}
EOF

docker config create nginx_config_canary nginx-canary.conf
docker service update --config-add source=nginx_config_canary,target=/etc/nginx/nginx.conf ${STACK_NAME}-proxy

# 3. 监控金丝雀版本
echo "📊 监控金丝雀版本..."
monitor_duration=300  # 5分钟监控期
monitor_interval=30

for ((i=0; i<monitor_duration; i+=monitor_interval)); do
    # 检查错误率
    error_rate=$(curl -s http://localhost:9090/api/v1/query?query='rate(http_requests_total{job="myapp-canary",status=~"5.."}[5m])' | jq '.data.result[0].value[1]' | tr -d '"')
    
    if (( $(echo "$error_rate > 0.05" | bc -l) )); then
        echo "❌ 金丝雀版本错误率过高: $error_rate"
        echo "🔄 回滚金丝雀版本..."
        docker service rm ${STACK_NAME}-web-canary
        docker service update --config-rm nginx_config_canary ${STACK_NAME}-proxy
        exit 1
    fi
    
    echo "✅ 金丝雀版本运行正常 (错误率: $error_rate)"
    sleep $monitor_interval
done

# 4. 全量发布
echo "🚀 金丝雀版本验证通过，开始全量发布..."
docker service update --image myapp:$NEW_VERSION ${STACK_NAME}-web

# 等待更新完成
docker service logs -f ${STACK_NAME}-web &
LOGS_PID=$!

while true; do
    replicas=$(docker service ls --filter name=${STACK_NAME}-web --format "{{.Replicas}}")
    if [[ $replicas =~ ^([0-9]+)/\1$ ]]; then
        echo "✅ 全量发布完成"
        kill $LOGS_PID 2>/dev/null || true
        break
    fi
    sleep 10
done

# 5. 清理金丝雀版本
echo "🧹 清理金丝雀版本..."
docker service rm ${STACK_NAME}-web-canary
docker config rm nginx_config_canary

echo "🎉 金丝雀发布完成!"
```

## 🏗️ CI/CD流水线

### 1. GitLab CI/CD配置

```yaml
# .gitlab-ci.yml
stages:
  - test
  - build
  - security
  - deploy-staging
  - deploy-production

variables:
  DOCKER_DRIVER: overlay2
  DOCKER_TLS_CERTDIR: "/certs"
  REGISTRY: registry.gitlab.com
  IMAGE_NAME: $REGISTRY/$CI_PROJECT_PATH
  VERSION: $CI_COMMIT_SHA

services:
  - docker:20.10.16-dind

before_script:
  - docker login -u $CI_REGISTRY_USER -p $CI_REGISTRY_PASSWORD $CI_REGISTRY

# 测试阶段
test:unit:
  stage: test
  script:
    - docker build --target test -t $IMAGE_NAME:test .
    - docker run --rm $IMAGE_NAME:test npm run test:unit
  coverage: '/Statements\s*:\s*([^%]+)/'
  artifacts:
    reports:
      coverage_report:
        coverage_format: cobertura
        path: coverage/cobertura-coverage.xml

test:integration:
  stage: test
  services:
    - postgres:13
  variables:
    POSTGRES_DB: test_db
    POSTGRES_USER: test
    POSTGRES_PASSWORD: test123
  script:
    - docker build --target test -t $IMAGE_NAME:test .
    - docker run --rm --network host -e DATABASE_URL=postgresql://test:test123@localhost:5432/test_db $IMAGE_NAME:test npm run test:integration

# 构建阶段
build:
  stage: build
  script:
    - docker build -t $IMAGE_NAME:$VERSION -t $IMAGE_NAME:latest .
    - docker push $IMAGE_NAME:$VERSION
    - docker push $IMAGE_NAME:latest
  only:
    - main
    - develop

# 安全扫描
security:scan:
  stage: security
  script:
    - docker run --rm -v /var/run/docker.sock:/var/run/docker.sock aquasec/trivy image --exit-code 1 --severity HIGH,CRITICAL $IMAGE_NAME:$VERSION
  allow_failure: false
  only:
    - main
    - develop

# 部署到staging环境
deploy:staging:
  stage: deploy-staging
  environment:
    name: staging
    url: https://staging.myapp.com
  script:
    - echo "Deploying to staging environment"
    - docker context use staging
    - export VERSION=$CI_COMMIT_SHA
    - docker stack deploy -c docker-stack.yml myapp-staging
    - ./scripts/wait-for-deployment.sh myapp-staging
    - ./scripts/run-smoke-tests.sh staging.myapp.com
  only:
    - develop

# 部署到生产环境
deploy:production:
  stage: deploy-production
  environment:
    name: production
    url: https://myapp.com
  script:
    - echo "Deploying to production environment"
    - docker context use production
    - export VERSION=$CI_COMMIT_SHA
    - ./scripts/blue-green-deploy.sh $VERSION
  when: manual
  only:
    - main

# 回滚作业
rollback:production:
  stage: deploy-production
  environment:
    name: production
    url: https://myapp.com
  script:
    - echo "Rolling back production deployment"
    - docker context use production
    - ./scripts/rollback.sh
  when: manual
  only:
    - main
```

### 2. 部署脚本集合

```bash
#!/bin/bash
# scripts/wait-for-deployment.sh

STACK_NAME=$1
TIMEOUT=${2:-300}
INTERVAL=10

echo "⏳ 等待部署完成: $STACK_NAME"

start_time=$(date +%s)
while true; do
    current_time=$(date +%s)
    elapsed=$((current_time - start_time))
    
    if [ $elapsed -gt $TIMEOUT ]; then
        echo "❌ 部署超时"
        exit 1
    fi
    
    # 检查所有服务是否就绪
    services_ready=true
    while read service replicas; do
        if [[ ! $replicas =~ ^([0-9]+)/\1$ ]]; then
            services_ready=false
            echo "服务 $service 未就绪: $replicas"
            break
        fi
    done < <(docker service ls --filter name=$STACK_NAME --format "{{.Name}} {{.Replicas}}")
    
    if $services_ready; then
        echo "✅ 所有服务已就绪"
        break
    fi
    
    sleep $INTERVAL
done

# 额外的健康检查
echo "🏥 执行健康检查..."
./scripts/health-check.sh $STACK_NAME
```

```bash
#!/bin/bash
# scripts/health-check.sh

STACK_NAME=$1
BASE_URL=${2:-"http://localhost"}

echo "🏥 健康检查: $STACK_NAME"

# 检查各个服务端点
endpoints=(
    "/health"
    "/api/health"
    "/metrics"
)

for endpoint in "${endpoints[@]}"; do
    url="$BASE_URL$endpoint"
    echo "检查: $url"
    
    for i in {1..5}; do
        if curl -f -s --max-time 10 "$url" >/dev/null; then
            echo "✅ $endpoint 健康"
            break
        fi
        
        if [ $i -eq 5 ]; then
            echo "❌ $endpoint 健康检查失败"
            exit 1
        fi
        
        echo "重试 $i/5..."
        sleep 5
    done
done

echo "✅ 所有健康检查通过"
```

```bash
#!/bin/bash
# scripts/rollback.sh

STACK_NAME="myapp"
BACKUP_SUFFIX="backup"

echo "🔄 开始回滚操作"

# 1. 获取当前运行的版本
current_version=$(docker service inspect ${STACK_NAME}-web --format '{{.Spec.TaskTemplate.ContainerSpec.Image}}' | cut -d: -f2)
echo "当前版本: $current_version"

# 2. 获取备份版本
backup_services=$(docker service ls --filter name=${STACK_NAME}-${BACKUP_SUFFIX} --format "{{.Name}}")

if [ -z "$backup_services" ]; then
    echo "❌ 没有找到备份服务"
    exit 1
fi

# 3. 切换到备份版本
echo "🔀 切换到备份版本..."
for service in $backup_services; do
    original_service=${service%-${BACKUP_SUFFIX}}
    
    # 获取备份服务的镜像
    backup_image=$(docker service inspect $service --format '{{.Spec.TaskTemplate.ContainerSpec.Image}}')
    
    # 更新原服务
    docker service update --image $backup_image $original_service
    
    echo "服务 $original_service 已回滚到 $backup_image"
done

# 4. 等待回滚完成
./scripts/wait-for-deployment.sh $STACK_NAME

# 5. 验证回滚
./scripts/health-check.sh $STACK_NAME

echo "✅ 回滚完成"
```

## 📊 生产环境监控

### 1. 服务监控配置

```yaml
# monitoring-stack.yml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - prometheus_data:/prometheus
      - ./prometheus.yml:/etc/prometheus/prometheus.yml:ro
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
      - '--storage.tsdb.retention.time=30d'
      - '--web.enable-lifecycle'
    deploy:
      replicas: 1
      placement:
        constraints:
          - node.role == manager
    networks:
      - monitoring

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin123
    volumes:
      - grafana_data:/var/lib/grafana
      - ./grafana/dashboards:/etc/grafana/provisioning/dashboards
      - ./grafana/datasources:/etc/grafana/provisioning/datasources
    deploy:
      replicas: 1
    networks:
      - monitoring

  alertmanager:
    image: prom/alertmanager:latest
    ports:
      - "9093:9093"
    volumes:
      - ./alertmanager.yml:/etc/alertmanager/alertmanager.yml
    deploy:
      replicas: 1
    networks:
      - monitoring

  node-exporter:
    image: prom/node-exporter:latest
    ports:
      - "9100:9100"
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/rootfs:ro
    command:
      - '--path.procfs=/host/proc'
      - '--path.rootfs=/rootfs'
      - '--path.sysfs=/host/sys'
      - '--collector.filesystem.mount-points-exclude=^/(sys|proc|dev|host|etc)($$|/)'
    deploy:
      mode: global
    networks:
      - monitoring

  cadvisor:
    image: gcr.io/cadvisor/cadvisor:latest
    ports:
      - "8080:8080"
    volumes:
      - /:/rootfs:ro
      - /var/run:/var/run:rw
      - /sys:/sys:ro
      - /var/lib/docker/:/var/lib/docker:ro
    deploy:
      mode: global
    networks:
      - monitoring

volumes:
  prometheus_data:
  grafana_data:

networks:
  monitoring:
    external: true
```

### 2. 部署状态监控脚本

```bash
#!/bin/bash
# scripts/deployment-monitor.sh

STACK_NAME=$1
SLACK_WEBHOOK_URL=$2

echo "📊 开始监控部署状态: $STACK_NAME"

# 获取部署开始时间
deployment_start=$(date +%s)

# 监控函数
monitor_deployment() {
    while true; do
        current_time=$(date +%s)
        elapsed=$((current_time - deployment_start))
        
        # 获取服务状态
        services_status=$(docker service ls --filter name=$STACK_NAME --format "{{.Name}} {{.Replicas}}")
        
        # 检查是否有失败的服务
        failed_services=""
        total_services=0
        ready_services=0
        
        while read service replicas; do
            total_services=$((total_services + 1))
            
            if [[ $replicas =~ ^([0-9]+)/\1$ ]]; then
                ready_services=$((ready_services + 1))
            else
                failed_services="$failed_services $service"
            fi
        done <<< "$services_status"
        
        # 计算进度
        if [ $total_services -gt 0 ]; then
            progress=$((ready_services * 100 / total_services))
        else
            progress=0
        fi
        
        # 发送状态更新
        message="部署进度: $progress% ($ready_services/$total_services) - 用时: ${elapsed}s"
        
        if [ ! -z "$failed_services" ]; then
            message="$message\n失败服务: $failed_services"
        fi
        
        echo "$(date): $message"
        
        # 发送到Slack
        if [ ! -z "$SLACK_WEBHOOK_URL" ]; then
            curl -X POST -H 'Content-type: application/json' \
                --data "{\"text\":\"$message\"}" \
                $SLACK_WEBHOOK_URL
        fi
        
        # 检查是否完成
        if [ $ready_services -eq $total_services ] && [ $total_services -gt 0 ]; then
            success_message="✅ 部署成功完成! 总用时: ${elapsed}s"
            echo "$success_message"
            
            if [ ! -z "$SLACK_WEBHOOK_URL" ]; then
                curl -X POST -H 'Content-type: application/json' \
                    --data "{\"text\":\"$success_message\"}" \
                    $SLACK_WEBHOOK_URL
            fi
            break
        fi
        
        # 检查是否超时
        if [ $elapsed -gt 600 ]; then  # 10分钟超时
            timeout_message="❌ 部署超时! 用时: ${elapsed}s"
            echo "$timeout_message"
            
            if [ ! -z "$SLACK_WEBHOOK_URL" ]; then
                curl -X POST -H 'Content-type: application/json' \
                    --data "{\"text\":\"$timeout_message\"}" \
                    $SLACK_WEBHOOK_URL
            fi
            exit 1
        fi
        
        sleep 30
    done
}

# 启动监控
monitor_deployment
```

## 📝 下一步

现在您已经掌握了Docker生产环境部署，接下来学习：

1. **[Docker监控与日志](./12-monitoring-logging.md)** - 深入学习监控和日志管理

## 🎯 本章要点

- ✅ 理解生产环境部署要求和架构选择
- ✅ 掌握Docker Swarm集群高可用部署
- ✅ 学会零停机部署策略（蓝绿、金丝雀）
- ✅ 了解CI/CD流水线设计和实现
- ✅ 掌握部署监控和故障处理机制

继续深入学习Docker监控与日志管理！🐳
