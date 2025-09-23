# Kubernetes编排

## 📖 概述

Kubernetes（K8s）是一个开源的容器编排平台，用于自动化容器化应用程序的部署、扩展和管理。它提供了强大的服务发现、负载均衡、存储编排、自动回滚等功能，是现代云原生应用的标准编排解决方案。

## 🎯 学习目标

- 掌握 Kubernetes 核心概念和架构
- 学习 Pod、Service、Deployment 等基本对象
- 了解配置管理和存储编排
- 掌握应用部署和扩缩容策略

## 🏗️ 核心概念

### 1. 基本架构

```yaml
# Kubernetes 集群架构示意
apiVersion: v1
kind: Namespace
metadata:
  name: nodejs-app
  labels:
    name: nodejs-app
    environment: production
---
# 应用部署
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nodejs-app
  namespace: nodejs-app
  labels:
    app: nodejs-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: nodejs-app
  template:
    metadata:
      labels:
        app: nodejs-app
    spec:
      containers:
      - name: nodejs-app
        image: nodejs-app:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: PORT
          value: "3000"
```

### 2. Pod 配置

```yaml
# pod.yaml
apiVersion: v1
kind: Pod
metadata:
  name: nodejs-app-pod
  labels:
    app: nodejs-app
    version: v1.0.0
spec:
  containers:
  - name: app
    image: nodejs-app:latest
    ports:
    - containerPort: 3000
      name: http
    env:
    - name: NODE_ENV
      value: "production"
    - name: DB_HOST
      valueFrom:
        configMapKeyRef:
          name: app-config
          key: database-host
    - name: DB_PASSWORD
      valueFrom:
        secretKeyRef:
          name: app-secrets
          key: database-password
    resources:
      requests:
        memory: "128Mi"
        cpu: "100m"
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
    volumeMounts:
    - name: app-logs
      mountPath: /app/logs
    - name: app-config
      mountPath: /app/config
      readOnly: true
  volumes:
  - name: app-logs
    emptyDir: {}
  - name: app-config
    configMap:
      name: app-config
  restartPolicy: Always
  nodeSelector:
    disktype: ssd
  tolerations:
  - key: "app-tier"
    operator: "Equal"
    value: "frontend"
    effect: "NoSchedule"
```

## 📦 部署管理

### 1. Deployment 配置

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nodejs-app
  namespace: nodejs-app
  labels:
    app: nodejs-app
    tier: frontend
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 1
  selector:
    matchLabels:
      app: nodejs-app
  template:
    metadata:
      labels:
        app: nodejs-app
        tier: frontend
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "3000"
        prometheus.io/path: "/metrics"
    spec:
      serviceAccountName: nodejs-app-sa
      containers:
      - name: nodejs-app
        image: nodejs-app:v1.2.3
        imagePullPolicy: IfNotPresent
        ports:
        - containerPort: 3000
          name: http
          protocol: TCP
        env:
        - name: NODE_ENV
          value: "production"
        - name: PORT
          value: "3000"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: database-credentials
              key: url
        - name: REDIS_URL
          valueFrom:
            configMapKeyRef:
              name: app-config
              key: redis-url
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: jwt-secret
        resources:
          requests:
            memory: "256Mi"
            cpu: "200m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /health
            port: http
            scheme: HTTP
          initialDelaySeconds: 60
          periodSeconds: 30
          timeoutSeconds: 5
          successThreshold: 1
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /ready
            port: http
            scheme: HTTP
          initialDelaySeconds: 10
          periodSeconds: 10
          timeoutSeconds: 3
          successThreshold: 1
          failureThreshold: 3
        startupProbe:
          httpGet:
            path: /startup
            port: http
          initialDelaySeconds: 10
          periodSeconds: 10
          timeoutSeconds: 3
          failureThreshold: 30
        volumeMounts:
        - name: app-logs
          mountPath: /app/logs
        - name: tmp-volume
          mountPath: /tmp
        securityContext:
          runAsNonRoot: true
          runAsUser: 1001
          runAsGroup: 1001
          allowPrivilegeEscalation: false
          readOnlyRootFilesystem: true
          capabilities:
            drop:
            - ALL
      volumes:
      - name: app-logs
        emptyDir:
          sizeLimit: 1Gi
      - name: tmp-volume
        emptyDir:
          sizeLimit: 500Mi
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
          - weight: 100
            podAffinityTerm:
              labelSelector:
                matchExpressions:
                - key: app
                  operator: In
                  values:
                  - nodejs-app
              topologyKey: kubernetes.io/hostname
      topologySpreadConstraints:
      - maxSkew: 1
        topologyKey: zone
        whenUnsatisfiable: DoNotSchedule
        labelSelector:
          matchLabels:
            app: nodejs-app
```

### 2. Service 配置

```yaml
# service.yaml
apiVersion: v1
kind: Service
metadata:
  name: nodejs-app-service
  namespace: nodejs-app
  labels:
    app: nodejs-app
  annotations:
    service.beta.kubernetes.io/aws-load-balancer-type: "nlb"
spec:
  type: ClusterIP
  ports:
  - port: 80
    targetPort: http
    protocol: TCP
    name: http
  selector:
    app: nodejs-app
---
# 负载均衡服务
apiVersion: v1
kind: Service
metadata:
  name: nodejs-app-lb
  namespace: nodejs-app
  labels:
    app: nodejs-app
  annotations:
    service.beta.kubernetes.io/aws-load-balancer-type: "nlb"
    service.beta.kubernetes.io/aws-load-balancer-cross-zone-load-balancing-enabled: "true"
spec:
  type: LoadBalancer
  ports:
  - port: 80
    targetPort: http
    protocol: TCP
    name: http
  - port: 443
    targetPort: https
    protocol: TCP
    name: https
  selector:
    app: nodejs-app
  sessionAffinity: None
---
# Headless Service (用于 StatefulSet)
apiVersion: v1
kind: Service
metadata:
  name: nodejs-app-headless
  namespace: nodejs-app
  labels:
    app: nodejs-app
spec:
  clusterIP: None
  ports:
  - port: 3000
    targetPort: http
    name: http
  selector:
    app: nodejs-app
```

## 🔧 配置管理

### 1. ConfigMap 配置

```yaml
# configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
  namespace: nodejs-app
  labels:
    app: nodejs-app
data:
  # 应用配置
  NODE_ENV: "production"
  LOG_LEVEL: "info"
  PORT: "3000"
  
  # 数据库配置
  database-host: "postgres-service.database.svc.cluster.local"
  database-port: "5432"
  database-name: "myapp"
  
  # Redis 配置
  redis-url: "redis://redis-service.cache.svc.cluster.local:6379"
  
  # 应用特定配置
  max-connections: "100"
  timeout: "30000"
  
  # 配置文件
  app.json: |
    {
      "server": {
        "host": "0.0.0.0",
        "port": 3000,
        "timeout": 30000
      },
      "database": {
        "pool": {
          "min": 2,
          "max": 10
        }
      },
      "cache": {
        "ttl": 3600,
        "maxSize": 1000
      }
    }
  
  nginx.conf: |
    upstream nodejs_app {
        server nodejs-app-service:80;
    }
    
    server {
        listen 80;
        server_name _;
        
        location / {
            proxy_pass http://nodejs_app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
        
        location /health {
            access_log off;
            proxy_pass http://nodejs_app/health;
        }
    }
---
# 多环境配置
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config-production
  namespace: nodejs-app
data:
  NODE_ENV: "production"
  LOG_LEVEL: "warn"
  DEBUG: "false"
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config-staging
  namespace: nodejs-app
data:
  NODE_ENV: "staging"
  LOG_LEVEL: "debug"
  DEBUG: "true"
```

### 2. Secret 管理

```yaml
# secrets.yaml
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
  namespace: nodejs-app
  labels:
    app: nodejs-app
type: Opaque
data:
  # Base64 编码的密钥
  jwt-secret: <base64-encoded-jwt-secret>
  api-key: <base64-encoded-api-key>
  database-password: <base64-encoded-password>
stringData:
  # 明文密钥（Kubernetes 会自动编码）
  database-url: "postgresql://user:password@postgres-service:5432/myapp"
  redis-password: "redis-secret-password"
---
# TLS 证书
apiVersion: v1
kind: Secret
metadata:
  name: tls-secret
  namespace: nodejs-app
type: kubernetes.io/tls
data:
  tls.crt: <base64-encoded-certificate>
  tls.key: <base64-encoded-private-key>
---
# Docker Registry 认证
apiVersion: v1
kind: Secret
metadata:
  name: registry-secret
  namespace: nodejs-app
type: kubernetes.io/dockerconfigjson
data:
  .dockerconfigjson: <base64-encoded-docker-config>
```

## 💾 存储管理

### 1. PersistentVolume 配置

```yaml
# persistent-volume.yaml
apiVersion: v1
kind: PersistentVolume
metadata:
  name: app-logs-pv
  labels:
    type: local
    app: nodejs-app
spec:
  capacity:
    storage: 10Gi
  accessModes:
    - ReadWriteOnce
  persistentVolumeReclaimPolicy: Retain
  storageClassName: fast-ssd
  local:
    path: /mnt/app-logs
  nodeAffinity:
    required:
      nodeSelectorTerms:
      - matchExpressions:
        - key: kubernetes.io/hostname
          operator: In
          values:
          - node-1
---
# PersistentVolumeClaim
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: app-logs-pvc
  namespace: nodejs-app
  labels:
    app: nodejs-app
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 5Gi
  storageClassName: fast-ssd
  selector:
    matchLabels:
      app: nodejs-app
---
# StorageClass 定义
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: fast-ssd
provisioner: kubernetes.io/aws-ebs
parameters:
  type: gp3
  iops: "3000"
  throughput: "125"
  encrypted: "true"
allowVolumeExpansion: true
volumeBindingMode: WaitForFirstConsumer
```

### 2. StatefulSet 配置

```yaml
# statefulset.yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: nodejs-app-stateful
  namespace: nodejs-app
spec:
  serviceName: nodejs-app-headless
  replicas: 3
  selector:
    matchLabels:
      app: nodejs-app-stateful
  template:
    metadata:
      labels:
        app: nodejs-app-stateful
    spec:
      containers:
      - name: nodejs-app
        image: nodejs-app:latest
        ports:
        - containerPort: 3000
          name: http
        env:
        - name: POD_NAME
          valueFrom:
            fieldRef:
              fieldPath: metadata.name
        - name: POD_NAMESPACE
          valueFrom:
            fieldRef:
              fieldPath: metadata.namespace
        volumeMounts:
        - name: data
          mountPath: /app/data
        - name: logs
          mountPath: /app/logs
        resources:
          requests:
            memory: "256Mi"
            cpu: "200m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
  volumeClaimTemplates:
  - metadata:
      name: data
    spec:
      accessModes: [ "ReadWriteOnce" ]
      storageClassName: fast-ssd
      resources:
        requests:
          storage: 10Gi
  - metadata:
      name: logs
    spec:
      accessModes: [ "ReadWriteOnce" ]
      storageClassName: standard
      resources:
        requests:
          storage: 5Gi
```

## 🔄 自动扩缩容

### 1. HorizontalPodAutoscaler

```yaml
# hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: nodejs-app-hpa
  namespace: nodejs-app
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: nodejs-app
  minReplicas: 2
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
  - type: Pods
    pods:
      metric:
        name: http_requests_per_second
      target:
        type: AverageValue
        averageValue: "100"
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 50
        periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 60
      policies:
      - type: Percent
        value: 100
        periodSeconds: 60
      - type: Pods
        value: 2
        periodSeconds: 60
      selectPolicy: Max
---
# VerticalPodAutoscaler
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: nodejs-app-vpa
  namespace: nodejs-app
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: nodejs-app
  updatePolicy:
    updateMode: "Auto"
  resourcePolicy:
    containerPolicies:
    - containerName: nodejs-app
      minAllowed:
        cpu: 100m
        memory: 128Mi
      maxAllowed:
        cpu: 2000m
        memory: 4Gi
      controlledResources: ["cpu", "memory"]
```

### 2. 自定义指标扩缩容

```yaml
# custom-metrics-hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: nodejs-app-custom-hpa
  namespace: nodejs-app
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: nodejs-app
  minReplicas: 2
  maxReplicas: 20
  metrics:
  # CPU 使用率
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 60
  
  # 自定义指标 - HTTP 请求率
  - type: Object
    object:
      metric:
        name: http_requests_per_second
      describedObject:
        apiVersion: v1
        kind: Service
        name: nodejs-app-service
      target:
        type: Value
        value: "50"
  
  # 外部指标 - SQS 队列长度
  - type: External
    external:
      metric:
        name: sqs_messages_visible
        selector:
          matchLabels:
            queue: "processing-queue"
      target:
        type: AverageValue
        averageValue: "10"
  
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 60
      policies:
      - type: Pods
        value: 3
        periodSeconds: 60
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 25
        periodSeconds: 60
```

## 🌐 网络和安全

### 1. Ingress 配置

```yaml
# ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: nodejs-app-ingress
  namespace: nodejs-app
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/use-regex: "true"
    nginx.ingress.kubernetes.io/rate-limit: "100"
    nginx.ingress.kubernetes.io/rate-limit-window: "1m"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - api.example.com
    - app.example.com
    secretName: app-tls-secret
  rules:
  - host: api.example.com
    http:
      paths:
      - path: /api/v1
        pathType: Prefix
        backend:
          service:
            name: nodejs-app-service
            port:
              number: 80
      - path: /health
        pathType: Exact
        backend:
          service:
            name: nodejs-app-service
            port:
              number: 80
  - host: app.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: nodejs-app-service
            port:
              number: 80
---
# Gateway API 配置
apiVersion: gateway.networking.k8s.io/v1beta1
kind: Gateway
metadata:
  name: nodejs-app-gateway
  namespace: nodejs-app
spec:
  gatewayClassName: istio
  listeners:
  - name: http
    hostname: "*.example.com"
    port: 80
    protocol: HTTP
    allowedRoutes:
      namespaces:
        from: Same
  - name: https
    hostname: "*.example.com"
    port: 443
    protocol: HTTPS
    tls:
      mode: Terminate
      certificateRefs:
      - name: app-tls-secret
    allowedRoutes:
      namespaces:
        from: Same
---
apiVersion: gateway.networking.k8s.io/v1beta1
kind: HTTPRoute
metadata:
  name: nodejs-app-route
  namespace: nodejs-app
spec:
  parentRefs:
  - name: nodejs-app-gateway
  hostnames:
  - "api.example.com"
  rules:
  - matches:
    - path:
        type: PathPrefix
        value: /api/v1
    backendRefs:
    - name: nodejs-app-service
      port: 80
      weight: 100
```

### 2. NetworkPolicy 安全策略

```yaml
# network-policy.yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: nodejs-app-netpol
  namespace: nodejs-app
spec:
  podSelector:
    matchLabels:
      app: nodejs-app
  policyTypes:
  - Ingress
  - Egress
  ingress:
  # 允许来自 Ingress Controller 的流量
  - from:
    - namespaceSelector:
        matchLabels:
          name: ingress-nginx
    ports:
    - protocol: TCP
      port: 3000
  # 允许来自同一命名空间的流量
  - from:
    - namespaceSelector:
        matchLabels:
          name: nodejs-app
    ports:
    - protocol: TCP
      port: 3000
  # 允许监控系统访问
  - from:
    - namespaceSelector:
        matchLabels:
          name: monitoring
    ports:
    - protocol: TCP
      port: 3000
  egress:
  # 允许访问数据库
  - to:
    - namespaceSelector:
        matchLabels:
          name: database
    ports:
    - protocol: TCP
      port: 5432
  # 允许访问 Redis
  - to:
    - namespaceSelector:
        matchLabels:
          name: cache
    ports:
    - protocol: TCP
      port: 6379
  # 允许 DNS 查询
  - to:
    - namespaceSelector:
        matchLabels:
          name: kube-system
    ports:
    - protocol: UDP
      port: 53
  # 允许 HTTPS 外部访问
  - to: []
    ports:
    - protocol: TCP
      port: 443
```

## 🔐 RBAC 权限管理

### 1. ServiceAccount 和 RBAC

```yaml
# rbac.yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: nodejs-app-sa
  namespace: nodejs-app
  labels:
    app: nodejs-app
automountServiceAccountToken: true
---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: nodejs-app-role
  namespace: nodejs-app
rules:
- apiGroups: [""]
  resources: ["pods", "services", "configmaps", "secrets"]
  verbs: ["get", "list", "watch"]
- apiGroups: ["apps"]
  resources: ["deployments", "replicasets"]
  verbs: ["get", "list", "watch"]
- apiGroups: [""]
  resources: ["events"]
  verbs: ["create"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: nodejs-app-rolebinding
  namespace: nodejs-app
subjects:
- kind: ServiceAccount
  name: nodejs-app-sa
  namespace: nodejs-app
roleRef:
  kind: Role
  name: nodejs-app-role
  apiGroup: rbac.authorization.k8s.io
---
# 集群级别权限
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: nodejs-app-cluster-role
rules:
- apiGroups: [""]
  resources: ["nodes"]
  verbs: ["get", "list"]
- apiGroups: ["metrics.k8s.io"]
  resources: ["nodes", "pods"]
  verbs: ["get", "list"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: nodejs-app-cluster-rolebinding
subjects:
- kind: ServiceAccount
  name: nodejs-app-sa
  namespace: nodejs-app
roleRef:
  kind: ClusterRole
  name: nodejs-app-cluster-role
  apiGroup: rbac.authorization.k8s.io
```

### 2. Pod Security Standards

```yaml
# pod-security-policy.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: nodejs-app
  labels:
    pod-security.kubernetes.io/enforce: restricted
    pod-security.kubernetes.io/audit: restricted
    pod-security.kubernetes.io/warn: restricted
---
apiVersion: v1
kind: Pod
metadata:
  name: secure-nodejs-pod
  namespace: nodejs-app
spec:
  serviceAccountName: nodejs-app-sa
  securityContext:
    runAsNonRoot: true
    runAsUser: 1001
    runAsGroup: 1001
    fsGroup: 1001
    seccompProfile:
      type: RuntimeDefault
  containers:
  - name: nodejs-app
    image: nodejs-app:latest
    securityContext:
      allowPrivilegeEscalation: false
      readOnlyRootFilesystem: true
      runAsNonRoot: true
      runAsUser: 1001
      runAsGroup: 1001
      capabilities:
        drop:
        - ALL
      seccompProfile:
        type: RuntimeDefault
    volumeMounts:
    - name: tmp-volume
      mountPath: /tmp
    - name: cache-volume
      mountPath: /app/.cache
  volumes:
  - name: tmp-volume
    emptyDir: {}
  - name: cache-volume
    emptyDir: {}
```

## 📊 监控和日志

### 1. Prometheus 监控

```yaml
# monitoring.yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: nodejs-app-metrics
  namespace: nodejs-app
  labels:
    app: nodejs-app
spec:
  selector:
    matchLabels:
      app: nodejs-app
  endpoints:
  - port: http
    path: /metrics
    interval: 30s
    scrapeTimeout: 10s
---
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: nodejs-app-alerts
  namespace: nodejs-app
  labels:
    app: nodejs-app
spec:
  groups:
  - name: nodejs-app.rules
    rules:
    - alert: NodejsAppDown
      expr: up{job="nodejs-app-service"} == 0
      for: 5m
      labels:
        severity: critical
      annotations:
        summary: "Node.js app is down"
        description: "Node.js app has been down for more than 5 minutes"
    
    - alert: NodejsAppHighCPU
      expr: rate(container_cpu_usage_seconds_total{pod=~"nodejs-app-.*"}[5m]) > 0.8
      for: 10m
      labels:
        severity: warning
      annotations:
        summary: "High CPU usage detected"
        description: "CPU usage is above 80% for more than 10 minutes"
    
    - alert: NodejsAppHighMemory
      expr: container_memory_usage_bytes{pod=~"nodejs-app-.*"} / container_spec_memory_limit_bytes > 0.9
      for: 5m
      labels:
        severity: warning
      annotations:
        summary: "High memory usage detected"
        description: "Memory usage is above 90% for more than 5 minutes"
    
    - alert: NodejsAppHighErrorRate
      expr: rate(http_requests_total{status=~"5.*"}[5m]) / rate(http_requests_total[5m]) > 0.1
      for: 5m
      labels:
        severity: critical
      annotations:
        summary: "High error rate detected"
        description: "Error rate is above 10% for more than 5 minutes"
```

### 2. 日志收集

```yaml
# logging.yaml
apiVersion: logging.coreos.com/v1
kind: ClusterLogForwarder
metadata:
  name: nodejs-app-logs
  namespace: openshift-logging
spec:
  outputs:
  - name: elasticsearch-output
    type: elasticsearch
    url: http://elasticsearch.logging.svc.cluster.local:9200
    elasticsearch:
      index: nodejs-app-logs
  - name: s3-output
    type: s3
    s3:
      bucket: app-logs-bucket
      region: us-east-1
  pipelines:
  - name: nodejs-app-pipeline
    inputRefs:
    - application
    filterRefs:
    - nodejs-app-filter
    outputRefs:
    - elasticsearch-output
    - s3-output
---
apiVersion: logging.coreos.com/v1
kind: ClusterLogFilter
metadata:
  name: nodejs-app-filter
spec:
  type: json
  json:
    javascript: |
      const log = record.log;
      if (log && log.kubernetes && log.kubernetes.labels && 
          log.kubernetes.labels.app === 'nodejs-app') {
        return record;
      }
      return null;
```

## 🚀 部署策略

### 1. 蓝绿部署

```yaml
# blue-green-deployment.yaml
apiVersion: argoproj.io/v1alpha1
kind: Rollout
metadata:
  name: nodejs-app-rollout
  namespace: nodejs-app
spec:
  replicas: 5
  strategy:
    blueGreen:
      activeService: nodejs-app-active
      previewService: nodejs-app-preview
      autoPromotionEnabled: false
      scaleDownDelaySeconds: 30
      prePromotionAnalysis:
        templates:
        - templateName: success-rate
        args:
        - name: service-name
          value: nodejs-app-preview
      postPromotionAnalysis:
        templates:
        - templateName: success-rate
        args:
        - name: service-name
          value: nodejs-app-active
  selector:
    matchLabels:
      app: nodejs-app
  template:
    metadata:
      labels:
        app: nodejs-app
    spec:
      containers:
      - name: nodejs-app
        image: nodejs-app:latest
        ports:
        - containerPort: 3000
        resources:
          requests:
            memory: "256Mi"
            cpu: "200m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
---
apiVersion: v1
kind: Service
metadata:
  name: nodejs-app-active
  namespace: nodejs-app
spec:
  ports:
  - port: 80
    targetPort: 3000
  selector:
    app: nodejs-app
---
apiVersion: v1
kind: Service
metadata:
  name: nodejs-app-preview
  namespace: nodejs-app
spec:
  ports:
  - port: 80
    targetPort: 3000
  selector:
    app: nodejs-app
```

### 2. 金丝雀部署

```yaml
# canary-deployment.yaml
apiVersion: argoproj.io/v1alpha1
kind: Rollout
metadata:
  name: nodejs-app-canary
  namespace: nodejs-app
spec:
  replicas: 10
  strategy:
    canary:
      steps:
      - setWeight: 10
      - pause: {duration: 5m}
      - setWeight: 20
      - pause: {duration: 5m}
      - analysis:
          templates:
          - templateName: success-rate
          args:
          - name: service-name
            value: nodejs-app-canary
      - setWeight: 50
      - pause: {duration: 10m}
      - setWeight: 80
      - pause: {duration: 5m}
      canaryService: nodejs-app-canary
      stableService: nodejs-app-stable
      trafficRouting:
        nginx:
          stableIngress: nodejs-app-ingress
          annotationPrefix: nginx.ingress.kubernetes.io
          additionalIngressAnnotations:
            canary-by-header: X-Canary
  selector:
    matchLabels:
      app: nodejs-app
  template:
    metadata:
      labels:
        app: nodejs-app
    spec:
      containers:
      - name: nodejs-app
        image: nodejs-app:latest
        ports:
        - containerPort: 3000
---
apiVersion: argoproj.io/v1alpha1
kind: AnalysisTemplate
metadata:
  name: success-rate
  namespace: nodejs-app
spec:
  args:
  - name: service-name
  metrics:
  - name: success-rate
    interval: 5m
    count: 3
    successCondition: result[0] >= 0.95
    failureLimit: 1
    provider:
      prometheus:
        address: http://prometheus.monitoring.svc.cluster.local:9090
        query: |
          sum(rate(http_requests_total{service="{{args.service-name}}",code!~"5.*"}[5m])) /
          sum(rate(http_requests_total{service="{{args.service-name}}"}[5m]))
```

## 📚 最佳实践总结

1. **资源管理**：合理设置 requests 和 limits
2. **健康检查**：实现完整的探针配置
3. **安全配置**：使用非 root 用户，只读文件系统
4. **配置分离**：使用 ConfigMap 和 Secret 管理配置
5. **网络安全**：配置 NetworkPolicy 限制网络访问
6. **监控告警**：集成 Prometheus 和 Grafana
7. **自动扩缩容**：基于指标自动调整副本数
8. **部署策略**：使用蓝绿或金丝雀部署降低风险

通过掌握这些 Kubernetes 编排技术，您将能够在生产环境中可靠地部署和管理 Node.js 应用程序。
