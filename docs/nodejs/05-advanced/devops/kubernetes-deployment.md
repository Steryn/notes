# Kubernetes部署

## 📋 概述

Kubernetes是一个开源的容器编排平台，用于自动化部署、扩展和管理容器化应用程序。它提供了强大的服务发现、负载均衡、自动扩缩容等功能。

## 🎯 学习目标

- 理解Kubernetes的核心概念和架构
- 掌握Node.js应用的Kubernetes部署
- 学会编写Kubernetes配置文件
- 了解服务网格和监控配置

## 📚 核心概念

### Pod（容器组）

Kubernetes中最小的部署单元，包含一个或多个容器。

```yaml
# pod.yaml
apiVersion: v1
kind: Pod
metadata:
  name: node-app-pod
  labels:
    app: node-app
spec:
  containers:
  - name: app
    image: node-app:latest
    ports:
    - containerPort: 3000
    env:
    - name: NODE_ENV
      value: "production"
```

### Deployment（部署）

管理Pod的副本和更新策略。

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: node-app-deployment
  labels:
    app: node-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: node-app
  template:
    metadata:
      labels:
        app: node-app
    spec:
      containers:
      - name: app
        image: node-app:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
```

### Service（服务）

为Pod提供稳定的网络端点。

```yaml
# service.yaml
apiVersion: v1
kind: Service
metadata:
  name: node-app-service
spec:
  selector:
    app: node-app
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: ClusterIP
```

### Ingress（入口）

管理外部访问到集群内服务的HTTP和HTTPS路由。

```yaml
# ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: node-app-ingress
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  tls:
  - hosts:
    - api.example.com
    secretName: api-tls
  rules:
  - host: api.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: node-app-service
            port:
              number: 80
```

## 🛠 完整Node.js应用部署

### 应用配置

```yaml
# namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: node-app

---
# configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: node-app-config
  namespace: node-app
data:
  NODE_ENV: "production"
  LOG_LEVEL: "info"
  PORT: "3000"

---
# secret.yaml
apiVersion: v1
kind: Secret
metadata:
  name: node-app-secrets
  namespace: node-app
type: Opaque
data:
  database-url: cG9zdGdyZXM6Ly91c2VyOnBhc3N3b3JkQHBvc3RncmVzOjU0MzIvbXlhcHA=
  jwt-secret: eW91ci1qd3Qtc2VjcmV0LWtleQ==
  redis-url: cmVkaXM6Ly9yZWRpczozNjM3OQ==

---
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: node-app
  namespace: node-app
  labels:
    app: node-app
    version: v1
spec:
  replicas: 3
  selector:
    matchLabels:
      app: node-app
  template:
    metadata:
      labels:
        app: node-app
        version: v1
    spec:
      containers:
      - name: app
        image: node-app:1.0.0
        ports:
        - containerPort: 3000
          name: http
        env:
        - name: NODE_ENV
          valueFrom:
            configMapKeyRef:
              name: node-app-config
              key: NODE_ENV
        - name: PORT
          valueFrom:
            configMapKeyRef:
              name: node-app-config
              key: PORT
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: node-app-secrets
              key: database-url
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: node-app-secrets
              key: jwt-secret
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: node-app-secrets
              key: redis-url
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 3
        volumeMounts:
        - name: app-logs
          mountPath: /usr/src/app/logs
      volumes:
      - name: app-logs
        emptyDir: {}
      imagePullSecrets:
      - name: registry-secret

---
# service.yaml
apiVersion: v1
kind: Service
metadata:
  name: node-app-service
  namespace: node-app
  labels:
    app: node-app
spec:
  selector:
    app: node-app
  ports:
  - name: http
    protocol: TCP
    port: 80
    targetPort: 3000
  type: ClusterIP

---
# hpa.yaml (Horizontal Pod Autoscaler)
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: node-app-hpa
  namespace: node-app
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: node-app
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80

---
# ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: node-app-ingress
  namespace: node-app
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/rate-limit: "100"
    nginx.ingress.kubernetes.io/rate-limit-window: "1m"
spec:
  tls:
  - hosts:
    - api.example.com
    secretName: node-app-tls
  rules:
  - host: api.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: node-app-service
            port:
              number: 80
```

### 数据库部署

```yaml
# postgres-deployment.yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: postgres-pvc
  namespace: node-app
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 20Gi
  storageClassName: ssd

---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: postgres
  namespace: node-app
spec:
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
      - name: postgres
        image: postgres:13-alpine
        ports:
        - containerPort: 5432
        env:
        - name: POSTGRES_DB
          value: myapp
        - name: POSTGRES_USER
          value: user
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: postgres-secret
              key: password
        volumeMounts:
        - name: postgres-storage
          mountPath: /var/lib/postgresql/data
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        livenessProbe:
          exec:
            command:
            - pg_isready
            - -U
            - user
            - -d
            - myapp
          initialDelaySeconds: 30
          periodSeconds: 10
      volumes:
      - name: postgres-storage
        persistentVolumeClaim:
          claimName: postgres-pvc

---
apiVersion: v1
kind: Service
metadata:
  name: postgres
  namespace: node-app
spec:
  selector:
    app: postgres
  ports:
  - port: 5432
    targetPort: 5432
  type: ClusterIP

---
apiVersion: v1
kind: Secret
metadata:
  name: postgres-secret
  namespace: node-app
type: Opaque
data:
  password: cGFzc3dvcmQ=  # base64 encoded 'password'
```

### Redis部署

```yaml
# redis-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: redis
  namespace: node-app
spec:
  replicas: 1
  selector:
    matchLabels:
      app: redis
  template:
    metadata:
      labels:
        app: redis
    spec:
      containers:
      - name: redis
        image: redis:7-alpine
        ports:
        - containerPort: 6379
        command: ["redis-server"]
        args: ["--appendonly", "yes"]
        volumeMounts:
        - name: redis-storage
          mountPath: /data
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "200m"
        livenessProbe:
          exec:
            command:
            - redis-cli
            - ping
          initialDelaySeconds: 30
          periodSeconds: 10
      volumes:
      - name: redis-storage
        emptyDir: {}

---
apiVersion: v1
kind: Service
metadata:
  name: redis
  namespace: node-app
spec:
  selector:
    app: redis
  ports:
  - port: 6379
    targetPort: 6379
  type: ClusterIP
```

## 🔧 高级配置

### 滚动更新策略

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: node-app
spec:
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 1
      maxSurge: 1
  template:
    spec:
      containers:
      - name: app
        image: node-app:1.1.0
        # 优雅关闭配置
        lifecycle:
          preStop:
            exec:
              command: ["/bin/sh", "-c", "sleep 15"]
        # 终止宽限期
      terminationGracePeriodSeconds: 30
```

### 蓝绿部署

```yaml
# blue-green-deployment.yaml
apiVersion: argoproj.io/v1alpha1
kind: Rollout
metadata:
  name: node-app-rollout
  namespace: node-app
spec:
  replicas: 5
  strategy:
    blueGreen:
      activeService: node-app-active
      previewService: node-app-preview
      autoPromotionEnabled: false
      scaleDownDelaySeconds: 30
      prePromotionAnalysis:
        templates:
        - templateName: success-rate
        args:
        - name: service-name
          value: node-app-preview
      postPromotionAnalysis:
        templates:
        - templateName: success-rate
        args:
        - name: service-name
          value: node-app-active
  selector:
    matchLabels:
      app: node-app
  template:
    metadata:
      labels:
        app: node-app
    spec:
      containers:
      - name: app
        image: node-app:1.2.0
```

### 金丝雀部署

```yaml
# canary-deployment.yaml
apiVersion: argoproj.io/v1alpha1
kind: Rollout
metadata:
  name: node-app-canary
  namespace: node-app
spec:
  replicas: 10
  strategy:
    canary:
      steps:
      - setWeight: 10
      - pause: {duration: 1m}
      - setWeight: 20
      - pause: {duration: 1m}
      - setWeight: 50
      - pause: {duration: 1m}
      - setWeight: 100
      canaryService: node-app-canary
      stableService: node-app-stable
      trafficRouting:
        nginx:
          stableIngress: node-app-ingress
  selector:
    matchLabels:
      app: node-app
  template:
    metadata:
      labels:
        app: node-app
    spec:
      containers:
      - name: app
        image: node-app:1.3.0
```

## 📊 监控和日志

### Prometheus监控

```yaml
# monitoring.yaml
apiVersion: v1
kind: ServiceMonitor
metadata:
  name: node-app-metrics
  namespace: node-app
  labels:
    app: node-app
spec:
  selector:
    matchLabels:
      app: node-app
  endpoints:
  - port: metrics
    interval: 30s
    path: /metrics

---
apiVersion: v1
kind: Service
metadata:
  name: node-app-metrics
  namespace: node-app
  labels:
    app: node-app
spec:
  selector:
    app: node-app
  ports:
  - name: metrics
    port: 9090
    targetPort: 9090

---
# PrometheusRule for alerting
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: node-app-alerts
  namespace: node-app
spec:
  groups:
  - name: node-app
    rules:
    - alert: NodeAppDown
      expr: up{job="node-app"} == 0
      for: 1m
      labels:
        severity: critical
      annotations:
        summary: "Node.js application is down"
        description: "Node.js application has been down for more than 1 minute"
    
    - alert: NodeAppHighErrorRate
      expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
      for: 5m
      labels:
        severity: warning
      annotations:
        summary: "High error rate detected"
        description: "Error rate is above 10% for 5 minutes"
    
    - alert: NodeAppHighMemoryUsage
      expr: container_memory_usage_bytes{pod=~"node-app-.*"} / container_spec_memory_limit_bytes > 0.8
      for: 5m
      labels:
        severity: warning
      annotations:
        summary: "High memory usage"
        description: "Memory usage is above 80% for 5 minutes"
```

### 日志收集

```yaml
# fluentd-config.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: fluentd-config
  namespace: kube-system
data:
  fluent.conf: |
    <source>
      @type tail
      path /var/log/containers/node-app-*.log
      pos_file /var/log/fluentd-containers.log.pos
      tag kubernetes.*
      format json
    </source>
    
    <match kubernetes.**>
      @type elasticsearch
      host elasticsearch.logging.svc.cluster.local
      port 9200
      index_name kubernetes
      type_name fluentd
    </match>

---
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: fluentd
  namespace: kube-system
spec:
  selector:
    matchLabels:
      name: fluentd
  template:
    metadata:
      labels:
        name: fluentd
    spec:
      containers:
      - name: fluentd
        image: fluent/fluentd-kubernetes-daemonset:v1-debian-elasticsearch
        env:
        - name: FLUENT_ELASTICSEARCH_HOST
          value: "elasticsearch.logging.svc.cluster.local"
        - name: FLUENT_ELASTICSEARCH_PORT
          value: "9200"
        volumeMounts:
        - name: varlog
          mountPath: /var/log
        - name: varlibdockercontainers
          mountPath: /var/lib/docker/containers
          readOnly: true
        - name: config
          mountPath: /fluentd/etc/fluent.conf
          subPath: fluent.conf
      volumes:
      - name: varlog
        hostPath:
          path: /var/log
      - name: varlibdockercontainers
        hostPath:
          path: /var/lib/docker/containers
      - name: config
        configMap:
          name: fluentd-config
```

## 🚀 部署和管理

### 部署脚本

```bash
#!/bin/bash
# deploy.sh

set -e

NAMESPACE="node-app"
IMAGE_TAG=${1:-latest}

echo "🚀 Deploying Node.js application to Kubernetes..."

# 创建命名空间
kubectl create namespace $NAMESPACE --dry-run=client -o yaml | kubectl apply -f -

# 应用配置
echo "📦 Applying configurations..."
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secrets.yaml

# 部署数据库
echo "💾 Deploying database..."
kubectl apply -f k8s/postgres-deployment.yaml
kubectl apply -f k8s/redis-deployment.yaml

# 等待数据库就绪
echo "⏳ Waiting for database to be ready..."
kubectl wait --for=condition=ready pod -l app=postgres -n $NAMESPACE --timeout=300s
kubectl wait --for=condition=ready pod -l app=redis -n $NAMESPACE --timeout=300s

# 更新应用镜像标签
sed -i "s|node-app:.*|node-app:$IMAGE_TAG|g" k8s/deployment.yaml

# 部署应用
echo "🚀 Deploying application..."
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/ingress.yaml
kubectl apply -f k8s/hpa.yaml

# 等待部署完成
echo "⏳ Waiting for deployment to complete..."
kubectl rollout status deployment/node-app -n $NAMESPACE --timeout=600s

# 验证部署
echo "🔍 Verifying deployment..."
kubectl get pods -n $NAMESPACE
kubectl get services -n $NAMESPACE
kubectl get ingress -n $NAMESPACE

echo "✅ Deployment completed successfully!"
```

### 健康检查脚本

```bash
#!/bin/bash
# health-check.sh

NAMESPACE="node-app"
SERVICE_URL="https://api.example.com"

echo "🔍 Performing health checks..."

# 检查Pod状态
echo "📊 Checking pod status..."
READY_PODS=$(kubectl get pods -n $NAMESPACE -l app=node-app -o jsonpath='{.items[*].status.conditions[?(@.type=="Ready")].status}' | tr ' ' '\n' | grep -c "True")
TOTAL_PODS=$(kubectl get pods -n $NAMESPACE -l app=node-app --no-headers | wc -l)

echo "Ready pods: $READY_PODS/$TOTAL_PODS"

if [ "$READY_PODS" -eq "$TOTAL_PODS" ] && [ "$TOTAL_PODS" -gt 0 ]; then
    echo "✅ All pods are ready"
else
    echo "❌ Some pods are not ready"
    kubectl get pods -n $NAMESPACE -l app=node-app
    exit 1
fi

# 检查服务端点
echo "🌐 Checking service endpoints..."
if curl -f -s "$SERVICE_URL/health" > /dev/null; then
    echo "✅ Service is responding"
else
    echo "❌ Service is not responding"
    exit 1
fi

# 检查HPA状态
echo "📈 Checking HPA status..."
kubectl get hpa -n $NAMESPACE

echo "🎉 All health checks passed!"
```

### 回滚脚本

```bash
#!/bin/bash
# rollback.sh

NAMESPACE="node-app"
REVISION=${1:-}

echo "🔄 Rolling back deployment..."

if [ -n "$REVISION" ]; then
    kubectl rollout undo deployment/node-app -n $NAMESPACE --to-revision=$REVISION
else
    kubectl rollout undo deployment/node-app -n $NAMESPACE
fi

echo "⏳ Waiting for rollback to complete..."
kubectl rollout status deployment/node-app -n $NAMESPACE --timeout=600s

echo "✅ Rollback completed successfully!"
```

## 🔍 故障排除

### 常用调试命令

```bash
# 查看Pod状态
kubectl get pods -n node-app
kubectl describe pod <pod-name> -n node-app

# 查看Pod日志
kubectl logs <pod-name> -n node-app -f
kubectl logs -l app=node-app -n node-app --tail=100

# 进入Pod调试
kubectl exec -it <pod-name> -n node-app -- sh

# 查看服务状态
kubectl get svc -n node-app
kubectl describe svc node-app-service -n node-app

# 查看Ingress状态
kubectl get ingress -n node-app
kubectl describe ingress node-app-ingress -n node-app

# 查看事件
kubectl get events -n node-app --sort-by=.metadata.creationTimestamp

# 查看资源使用情况
kubectl top pods -n node-app
kubectl top nodes
```

### 常见问题解决

#### 1. Pod启动失败

```bash
# 检查Pod状态和事件
kubectl describe pod <pod-name> -n node-app

# 常见原因：
# - 镜像拉取失败
# - 资源不足
# - 配置错误
# - 健康检查失败
```

#### 2. 服务无法访问

```bash
# 检查服务端点
kubectl get endpoints -n node-app

# 检查网络策略
kubectl get networkpolicies -n node-app

# 测试服务连接
kubectl run test-pod --image=busybox -it --rm -- sh
# 在Pod内测试：wget -qO- http://node-app-service/health
```

#### 3. 数据库连接问题

```bash
# 检查数据库Pod状态
kubectl get pods -l app=postgres -n node-app

# 测试数据库连接
kubectl exec -it <postgres-pod> -n node-app -- psql -U user -d myapp -c "SELECT 1;"

# 检查DNS解析
kubectl exec -it <app-pod> -n node-app -- nslookup postgres
```

## 📝 总结

Kubernetes为Node.js应用提供了强大的容器编排能力：

- **高可用性**：多副本和自动故障恢复
- **弹性扩缩容**：根据负载自动调整实例数量
- **服务发现**：内置的DNS和负载均衡
- **滚动更新**：零停机时间的应用更新
- **监控和日志**：完整的可观测性解决方案

是现代云原生应用部署的首选平台。

## 🔗 相关资源

- [Kubernetes官方文档](https://kubernetes.io/docs/)
- [kubectl命令参考](https://kubernetes.io/docs/reference/kubectl/)
- [Kubernetes最佳实践](https://kubernetes.io/docs/concepts/configuration/overview/)
- [Node.js on Kubernetes](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)
