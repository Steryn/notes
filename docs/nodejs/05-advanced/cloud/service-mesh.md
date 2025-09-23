# 服务网格

## 📖 概述

服务网格是一种基础设施层，用于处理微服务架构中服务间的通信。它通过透明的代理层提供流量管理、安全、可观测性等功能，让开发者专注于业务逻辑而不用关心服务间通信的复杂性。

## 🎯 学习目标

- 理解服务网格的核心概念和架构
- 掌握 Istio 服务网格的部署和配置
- 学习流量管理和安全策略
- 了解服务网格的监控和故障排查

## 🏗️ 服务网格架构

### 1. 核心组件

```javascript
// 服务网格管理器
class ServiceMeshManager {
  constructor() {
    this.controlPlane = new ControlPlane()
    this.dataPlane = new DataPlane()
    this.services = new Map()
    this.policies = new Map()
    this.telemetry = new TelemetryCollector()
  }
  
  // 控制平面
  class ControlPlane {
    constructor() {
      this.pilot = new PilotService()      // 服务发现和配置
      this.citadel = new CitadelService()  // 证书管理
      this.galley = new GalleyService()    // 配置验证
      this.mixer = new MixerService()      // 策略和遥测
    }
    
    async registerService(serviceInfo) {
      const service = {
        name: serviceInfo.name,
        version: serviceInfo.version,
        endpoints: serviceInfo.endpoints,
        labels: serviceInfo.labels || {},
        registeredAt: new Date(),
        status: 'active'
      }
      
      // 服务发现注册
      await this.pilot.registerService(service)
      
      // 生成证书
      const certificate = await this.citadel.issueCertificate(service)
      service.certificate = certificate
      
      // 配置验证
      await this.galley.validateServiceConfig(service)
      
      console.log(`服务注册成功: ${service.name}`)
      return service
    }
    
    async updateTrafficPolicy(serviceName, policy) {
      // 验证策略配置
      await this.galley.validatePolicy(policy)
      
      // 应用流量策略
      await this.pilot.applyTrafficPolicy(serviceName, policy)
      
      // 通知数据平面更新
      await this.notifyDataPlane(serviceName, policy)
      
      console.log(`流量策略更新: ${serviceName}`)
    }
  }
  
  // 数据平面
  class DataPlane {
    constructor() {
      this.proxies = new Map()
      this.loadBalancer = new ServiceMeshLoadBalancer()
      this.circuitBreaker = new CircuitBreaker()
    }
    
    // Envoy 代理管理
    registerProxy(serviceId, proxyConfig) {
      const proxy = {
        id: serviceId,
        config: proxyConfig,
        status: 'active',
        metrics: {
          requestCount: 0,
          errorCount: 0,
          latency: [],
          lastUpdate: new Date()
        }
      }
      
      this.proxies.set(serviceId, proxy)
      console.log(`代理注册: ${serviceId}`)
    }
    
    async routeRequest(request, sourceService, targetService) {
      const sourceProxy = this.proxies.get(sourceService)
      const targetProxy = this.proxies.get(targetService)
      
      if (!sourceProxy || !targetProxy) {
        throw new Error('服务代理不存在')
      }
      
      // 应用流量策略
      const routingDecision = await this.makeRoutingDecision(request, targetService)
      
      // 负载均衡
      const targetEndpoint = await this.loadBalancer.selectEndpoint(
        targetService, 
        routingDecision.strategy
      )
      
      // 熔断检查
      if (this.circuitBreaker.isOpen(targetEndpoint)) {
        throw new Error('服务熔断中')
      }
      
      // 执行请求
      const startTime = Date.now()
      
      try {
        const response = await this.executeRequest(request, targetEndpoint)
        
        // 记录成功指标
        this.recordMetrics(targetService, 'success', Date.now() - startTime)
        this.circuitBreaker.recordSuccess(targetEndpoint)
        
        return response
      } catch (error) {
        // 记录失败指标
        this.recordMetrics(targetService, 'error', Date.now() - startTime)
        this.circuitBreaker.recordFailure(targetEndpoint)
        
        throw error
      }
    }
    
    async makeRoutingDecision(request, targetService) {
      // 获取流量策略
      const policy = await this.getTrafficPolicy(targetService)
      
      // 基于权重的路由
      if (policy.weightedRouting) {
        return this.applyWeightedRouting(request, policy.weightedRouting)
      }
      
      // 基于头部的路由
      if (policy.headerRouting) {
        return this.applyHeaderRouting(request, policy.headerRouting)
      }
      
      // 默认路由
      return { strategy: 'round_robin', version: 'stable' }
    }
  }
}
```

### 2. Istio 配置管理

```yaml
# istio-config.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: nodejs-app
  labels:
    istio-injection: enabled
---
# 服务定义
apiVersion: v1
kind: Service
metadata:
  name: nodejs-api
  namespace: nodejs-app
  labels:
    app: nodejs-api
    version: v1
spec:
  ports:
  - port: 3000
    name: http
  selector:
    app: nodejs-api
---
# Deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nodejs-api-v1
  namespace: nodejs-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: nodejs-api
      version: v1
  template:
    metadata:
      labels:
        app: nodejs-api
        version: v1
    spec:
      containers:
      - name: nodejs-api
        image: nodejs-api:v1
        ports:
        - containerPort: 3000
        env:
        - name: VERSION
          value: "v1"
---
# VirtualService - 流量路由
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: nodejs-api
  namespace: nodejs-app
spec:
  hosts:
  - nodejs-api
  http:
  - match:
    - headers:
        canary:
          exact: "true"
    route:
    - destination:
        host: nodejs-api
        subset: v2
      weight: 100
  - route:
    - destination:
        host: nodejs-api
        subset: v1
      weight: 90
    - destination:
        host: nodejs-api
        subset: v2
      weight: 10
---
# DestinationRule - 负载均衡和熔断
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: nodejs-api
  namespace: nodejs-app
spec:
  host: nodejs-api
  trafficPolicy:
    loadBalancer:
      simple: LEAST_CONN
    connectionPool:
      tcp:
        maxConnections: 100
      http:
        http1MaxPendingRequests: 50
        maxRequestsPerConnection: 10
    circuitBreaker:
      consecutiveErrors: 5
      interval: 30s
      baseEjectionTime: 30s
      maxEjectionPercent: 50
    outlierDetection:
      consecutive5xxErrors: 3
      interval: 30s
      baseEjectionTime: 30s
  subsets:
  - name: v1
    labels:
      version: v1
  - name: v2
    labels:
      version: v2
```

### 3. 流量管理

```javascript
// 流量管理器
class TrafficManager {
  constructor() {
    this.routingRules = new Map()
    this.loadBalancers = new Map()
    this.retryPolicies = new Map()
    this.timeoutPolicies = new Map()
  }
  
  // 金丝雀发布
  async setupCanaryDeployment(serviceName, canaryConfig) {
    const routingRule = {
      service: serviceName,
      type: 'canary',
      rules: [
        {
          match: {
            headers: {
              'x-canary': 'true'
            }
          },
          route: {
            destination: `${serviceName}-canary`,
            weight: 100
          }
        },
        {
          match: {},
          route: [
            {
              destination: `${serviceName}-stable`,
              weight: canaryConfig.stableWeight || 90
            },
            {
              destination: `${serviceName}-canary`,
              weight: canaryConfig.canaryWeight || 10
            }
          ]
        }
      ]
    }
    
    this.routingRules.set(serviceName, routingRule)
    
    // 应用路由规则
    await this.applyRoutingRule(serviceName, routingRule)
    
    console.log(`金丝雀发布配置完成: ${serviceName}`)
  }
  
  // A/B 测试
  async setupABTesting(serviceName, abConfig) {
    const routingRule = {
      service: serviceName,
      type: 'ab_testing',
      rules: [
        {
          match: {
            headers: {
              'user-group': 'beta'
            }
          },
          route: {
            destination: `${serviceName}-beta`,
            weight: 100
          }
        },
        {
          match: {},
          route: {
            destination: `${serviceName}-stable`,
            weight: 100
          }
        }
      ]
    }
    
    this.routingRules.set(serviceName, routingRule)
    await this.applyRoutingRule(serviceName, routingRule)
    
    console.log(`A/B测试配置完成: ${serviceName}`)
  }
  
  // 蓝绿部署
  async setupBlueGreenDeployment(serviceName, deploymentConfig) {
    const currentColor = deploymentConfig.currentColor || 'blue'
    const targetColor = currentColor === 'blue' ? 'green' : 'blue'
    
    // 部署到目标环境
    await this.deployToEnvironment(serviceName, targetColor, deploymentConfig.newVersion)
    
    // 健康检查
    const healthCheck = await this.performHealthCheck(`${serviceName}-${targetColor}`)
    
    if (!healthCheck.healthy) {
      throw new Error('新版本健康检查失败')
    }
    
    // 切换流量
    const routingRule = {
      service: serviceName,
      type: 'blue_green',
      rules: [
        {
          match: {},
          route: {
            destination: `${serviceName}-${targetColor}`,
            weight: 100
          }
        }
      ]
    }
    
    this.routingRules.set(serviceName, routingRule)
    await this.applyRoutingRule(serviceName, routingRule)
    
    console.log(`蓝绿部署完成: ${serviceName} -> ${targetColor}`)
    
    // 清理旧环境
    setTimeout(async () => {
      await this.cleanupEnvironment(`${serviceName}-${currentColor}`)
    }, deploymentConfig.cleanupDelay || 300000) // 5分钟后清理
  }
  
  // 故障注入
  async injectFault(serviceName, faultConfig) {
    const faultRule = {
      service: serviceName,
      type: 'fault_injection',
      fault: {
        delay: faultConfig.delay ? {
          percentage: faultConfig.delay.percentage,
          fixedDelay: faultConfig.delay.duration
        } : null,
        abort: faultConfig.abort ? {
          percentage: faultConfig.abort.percentage,
          httpStatus: faultConfig.abort.statusCode
        } : null
      }
    }
    
    await this.applyFaultRule(serviceName, faultRule)
    
    console.log(`故障注入配置: ${serviceName}`)
  }
  
  // 重试策略
  setupRetryPolicy(serviceName, retryConfig) {
    const retryPolicy = {
      attempts: retryConfig.attempts || 3,
      perTryTimeout: retryConfig.perTryTimeout || '2s',
      retryOn: retryConfig.retryOn || '5xx,reset,connect-failure,refused-stream',
      retryRemoteLocalities: retryConfig.retryRemoteLocalities || false
    }
    
    this.retryPolicies.set(serviceName, retryPolicy)
    
    console.log(`重试策略配置: ${serviceName}`)
  }
  
  // 超时策略
  setupTimeoutPolicy(serviceName, timeoutConfig) {
    const timeoutPolicy = {
      timeout: timeoutConfig.timeout || '10s',
      idleTimeout: timeoutConfig.idleTimeout || '60s'
    }
    
    this.timeoutPolicies.set(serviceName, timeoutPolicy)
    
    console.log(`超时策略配置: ${serviceName}`)
  }
}
```

## 🔒 安全策略

### 1. mTLS 配置

```yaml
# mtls-policy.yaml
apiVersion: security.istio.io/v1beta1
kind: PeerAuthentication
metadata:
  name: default
  namespace: nodejs-app
spec:
  mtls:
    mode: STRICT
---
# 授权策略
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: nodejs-api-authz
  namespace: nodejs-app
spec:
  selector:
    matchLabels:
      app: nodejs-api
  rules:
  - from:
    - source:
        principals: ["cluster.local/ns/nodejs-app/sa/api-client"]
  - to:
    - operation:
        methods: ["GET", "POST"]
        paths: ["/api/*"]
  - when:
    - key: request.headers[authorization]
      values: ["Bearer *"]
---
# JWT 认证
apiVersion: security.istio.io/v1beta1
kind: RequestAuthentication
metadata:
  name: jwt-auth
  namespace: nodejs-app
spec:
  selector:
    matchLabels:
      app: nodejs-api
  jwtRules:
  - issuer: "https://auth.example.com"
    jwksUri: "https://auth.example.com/.well-known/jwks.json"
    audiences:
    - "nodejs-api"
```

### 2. 安全策略管理

```javascript
// 安全策略管理器
class SecurityPolicyManager {
  constructor() {
    this.authPolicies = new Map()
    this.authzPolicies = new Map()
    this.networkPolicies = new Map()
    this.certificateManager = new CertificateManager()
  }
  
  // JWT 认证策略
  async setupJWTAuthentication(serviceName, jwtConfig) {
    const authPolicy = {
      service: serviceName,
      type: 'jwt',
      issuer: jwtConfig.issuer,
      jwksUri: jwtConfig.jwksUri,
      audiences: jwtConfig.audiences,
      forwardOriginalToken: jwtConfig.forwardOriginalToken || false
    }
    
    this.authPolicies.set(serviceName, authPolicy)
    
    // 应用认证策略
    await this.applyAuthenticationPolicy(serviceName, authPolicy)
    
    console.log(`JWT认证策略配置: ${serviceName}`)
  }
  
  // 授权策略
  async setupAuthorizationPolicy(serviceName, authzConfig) {
    const authzPolicy = {
      service: serviceName,
      rules: authzConfig.rules.map(rule => ({
        from: rule.from || [],
        to: rule.to || [],
        when: rule.when || []
      }))
    }
    
    this.authzPolicies.set(serviceName, authzPolicy)
    
    // 应用授权策略
    await this.applyAuthorizationPolicy(serviceName, authzPolicy)
    
    console.log(`授权策略配置: ${serviceName}`)
  }
  
  // 网络策略
  async setupNetworkPolicy(serviceName, networkConfig) {
    const networkPolicy = {
      service: serviceName,
      ingress: networkConfig.ingress || [],
      egress: networkConfig.egress || []
    }
    
    this.networkPolicies.set(serviceName, networkPolicy)
    
    // 应用网络策略
    await this.applyNetworkPolicy(serviceName, networkPolicy)
    
    console.log(`网络策略配置: ${serviceName}`)
  }
  
  // 证书轮换
  async rotateCertificates(serviceName) {
    try {
      // 生成新证书
      const newCertificate = await this.certificateManager.generateCertificate(serviceName)
      
      // 更新服务证书
      await this.updateServiceCertificate(serviceName, newCertificate)
      
      // 验证证书有效性
      const isValid = await this.certificateManager.validateCertificate(newCertificate)
      
      if (!isValid) {
        throw new Error('新证书验证失败')
      }
      
      console.log(`证书轮换完成: ${serviceName}`)
      
    } catch (error) {
      console.error(`证书轮换失败: ${serviceName}`, error)
      throw error
    }
  }
}

// 证书管理器
class CertificateManager {
  constructor() {
    this.certificates = new Map()
    this.caKeys = new Map()
  }
  
  async generateCertificate(serviceName, options = {}) {
    const keyPair = await crypto.subtle.generateKey(
      {
        name: 'RSA-PSS',
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: 'SHA-256'
      },
      true,
      ['sign', 'verify']
    )
    
    const certificate = {
      serviceName,
      publicKey: keyPair.publicKey,
      privateKey: keyPair.privateKey,
      issuedAt: new Date(),
      expiresAt: new Date(Date.now() + (options.validityDays || 365) * 24 * 60 * 60 * 1000),
      serialNumber: this.generateSerialNumber(),
      issuer: options.issuer || 'Istio CA'
    }
    
    this.certificates.set(serviceName, certificate)
    
    return certificate
  }
  
  async validateCertificate(certificate) {
    // 检查过期时间
    if (certificate.expiresAt < new Date()) {
      return false
    }
    
    // 检查证书链
    // 这里简化处理，实际应该验证完整的证书链
    return true
  }
  
  generateSerialNumber() {
    return Math.floor(Math.random() * 1000000000).toString(16)
  }
}
```

## 📊 可观测性

### 1. 指标收集

```javascript
// 服务网格指标收集器
class ServiceMeshMetrics {
  constructor() {
    this.requestMetrics = new Map()
    this.serviceMetrics = new Map()
    this.networkMetrics = new Map()
    this.securityMetrics = new Map()
  }
  
  // 记录请求指标
  recordRequestMetric(sourceService, targetService, request, response, duration) {
    const metricKey = `${sourceService}->${targetService}`
    
    if (!this.requestMetrics.has(metricKey)) {
      this.requestMetrics.set(metricKey, {
        totalRequests: 0,
        successRequests: 0,
        errorRequests: 0,
        totalDuration: 0,
        p50Latency: 0,
        p90Latency: 0,
        p99Latency: 0,
        latencyHistory: []
      })
    }
    
    const metrics = this.requestMetrics.get(metricKey)
    
    metrics.totalRequests++
    metrics.totalDuration += duration
    metrics.latencyHistory.push(duration)
    
    if (response.status >= 200 && response.status < 400) {
      metrics.successRequests++
    } else {
      metrics.errorRequests++
    }
    
    // 保持最近1000个延迟记录
    if (metrics.latencyHistory.length > 1000) {
      metrics.latencyHistory = metrics.latencyHistory.slice(-1000)
    }
    
    // 计算百分位数
    this.updatePercentiles(metrics)
  }
  
  updatePercentiles(metrics) {
    const sorted = [...metrics.latencyHistory].sort((a, b) => a - b)
    const length = sorted.length
    
    if (length > 0) {
      metrics.p50Latency = sorted[Math.floor(length * 0.5)]
      metrics.p90Latency = sorted[Math.floor(length * 0.9)]
      metrics.p99Latency = sorted[Math.floor(length * 0.99)]
    }
  }
  
  // 记录服务指标
  recordServiceMetric(serviceName, metricType, value) {
    if (!this.serviceMetrics.has(serviceName)) {
      this.serviceMetrics.set(serviceName, {
        cpuUsage: 0,
        memoryUsage: 0,
        activeConnections: 0,
        queuedRequests: 0,
        healthStatus: 'healthy'
      })
    }
    
    const metrics = this.serviceMetrics.get(serviceName)
    metrics[metricType] = value
    metrics.lastUpdate = new Date()
  }
  
  // 生成 Prometheus 格式指标
  generatePrometheusMetrics() {
    let metrics = []
    
    // 请求指标
    this.requestMetrics.forEach((metric, key) => {
      const [source, target] = key.split('->')
      
      metrics.push(
        `istio_requests_total{source_service="${source}",destination_service="${target}"} ${metric.totalRequests}`,
        `istio_request_duration_milliseconds{source_service="${source}",destination_service="${target}",quantile="0.5"} ${metric.p50Latency}`,
        `istio_request_duration_milliseconds{source_service="${source}",destination_service="${target}",quantile="0.9"} ${metric.p90Latency}`,
        `istio_request_duration_milliseconds{source_service="${source}",destination_service="${target}",quantile="0.99"} ${metric.p99Latency}`
      )
    })
    
    // 服务指标
    this.serviceMetrics.forEach((metric, serviceName) => {
      metrics.push(
        `istio_service_cpu_usage{service="${serviceName}"} ${metric.cpuUsage}`,
        `istio_service_memory_usage{service="${serviceName}"} ${metric.memoryUsage}`,
        `istio_service_connections{service="${serviceName}"} ${metric.activeConnections}`
      )
    })
    
    return metrics.join('\n')
  }
  
  // 生成服务拓扑
  generateServiceTopology() {
    const topology = {
      nodes: [],
      edges: []
    }
    
    const services = new Set()
    
    // 收集所有服务
    this.requestMetrics.forEach((metric, key) => {
      const [source, target] = key.split('->')
      services.add(source)
      services.add(target)
    })
    
    // 生成节点
    services.forEach(service => {
      const serviceMetric = this.serviceMetrics.get(service)
      topology.nodes.push({
        id: service,
        name: service,
        status: serviceMetric?.healthStatus || 'unknown',
        metrics: serviceMetric || {}
      })
    })
    
    // 生成边
    this.requestMetrics.forEach((metric, key) => {
      const [source, target] = key.split('->')
      topology.edges.push({
        source,
        target,
        weight: metric.totalRequests,
        errorRate: metric.errorRequests / metric.totalRequests,
        avgLatency: metric.totalDuration / metric.totalRequests
      })
    })
    
    return topology
  }
}
```

### 2. 分布式追踪

```javascript
// 分布式追踪管理器
class DistributedTracing {
  constructor() {
    this.traces = new Map()
    this.spans = new Map()
    this.samplingRate = 0.1 // 10% 采样率
  }
  
  // 开始追踪
  startTrace(operationName, context = {}) {
    const traceId = this.generateTraceId()
    const spanId = this.generateSpanId()
    
    const trace = {
      traceId,
      operationName,
      startTime: Date.now(),
      context,
      spans: new Map(),
      tags: {},
      logs: []
    }
    
    const rootSpan = {
      traceId,
      spanId,
      parentSpanId: null,
      operationName,
      startTime: Date.now(),
      tags: {},
      logs: [],
      finished: false
    }
    
    this.traces.set(traceId, trace)
    this.spans.set(spanId, rootSpan)
    trace.spans.set(spanId, rootSpan)
    
    return { traceId, spanId }
  }
  
  // 创建子 Span
  createChildSpan(parentTraceId, parentSpanId, operationName) {
    const trace = this.traces.get(parentTraceId)
    if (!trace) {
      throw new Error('父追踪不存在')
    }
    
    const spanId = this.generateSpanId()
    const childSpan = {
      traceId: parentTraceId,
      spanId,
      parentSpanId,
      operationName,
      startTime: Date.now(),
      tags: {},
      logs: [],
      finished: false
    }
    
    this.spans.set(spanId, childSpan)
    trace.spans.set(spanId, childSpan)
    
    return spanId
  }
  
  // 添加标签
  addTag(spanId, key, value) {
    const span = this.spans.get(spanId)
    if (span) {
      span.tags[key] = value
    }
  }
  
  // 添加日志
  addLog(spanId, message, fields = {}) {
    const span = this.spans.get(spanId)
    if (span) {
      span.logs.push({
        timestamp: Date.now(),
        message,
        fields
      })
    }
  }
  
  // 完成 Span
  finishSpan(spanId, tags = {}) {
    const span = this.spans.get(spanId)
    if (span && !span.finished) {
      span.finishTime = Date.now()
      span.duration = span.finishTime - span.startTime
      span.finished = true
      
      // 添加完成时的标签
      Object.assign(span.tags, tags)
      
      // 检查是否需要采样
      if (this.shouldSample()) {
        this.exportSpan(span)
      }
    }
  }
  
  // 完成追踪
  finishTrace(traceId) {
    const trace = this.traces.get(traceId)
    if (trace) {
      trace.finishTime = Date.now()
      trace.duration = trace.finishTime - trace.startTime
      
      // 导出完整追踪
      if (this.shouldSample()) {
        this.exportTrace(trace)
      }
      
      // 清理内存
      setTimeout(() => {
        this.cleanupTrace(traceId)
      }, 60000) // 1分钟后清理
    }
  }
  
  // 采样决策
  shouldSample() {
    return Math.random() < this.samplingRate
  }
  
  // 导出 Span
  exportSpan(span) {
    // 发送到 Jaeger 或其他追踪系统
    console.log('导出 Span:', {
      traceId: span.traceId,
      spanId: span.spanId,
      operationName: span.operationName,
      duration: span.duration,
      tags: span.tags
    })
  }
  
  // 导出完整追踪
  exportTrace(trace) {
    const spans = Array.from(trace.spans.values())
    
    console.log('导出追踪:', {
      traceId: trace.traceId,
      operationName: trace.operationName,
      duration: trace.duration,
      spanCount: spans.length,
      spans: spans.map(span => ({
        spanId: span.spanId,
        parentSpanId: span.parentSpanId,
        operationName: span.operationName,
        duration: span.duration
      }))
    })
  }
  
  // 清理追踪数据
  cleanupTrace(traceId) {
    const trace = this.traces.get(traceId)
    if (trace) {
      // 删除所有相关的 spans
      trace.spans.forEach((span, spanId) => {
        this.spans.delete(spanId)
      })
      
      // 删除追踪
      this.traces.delete(traceId)
    }
  }
  
  generateTraceId() {
    return Math.random().toString(16).substr(2, 16)
  }
  
  generateSpanId() {
    return Math.random().toString(16).substr(2, 8)
  }
}

// 追踪装饰器
function traced(operationName) {
  return function(target, propertyName, descriptor) {
    const originalMethod = descriptor.value
    
    descriptor.value = async function(...args) {
      const tracing = new DistributedTracing()
      const { traceId, spanId } = tracing.startTrace(operationName)
      
      try {
        tracing.addTag(spanId, 'component', target.constructor.name)
        tracing.addTag(spanId, 'method', propertyName)
        
        const result = await originalMethod.apply(this, args)
        
        tracing.addTag(spanId, 'success', true)
        return result
      } catch (error) {
        tracing.addTag(spanId, 'success', false)
        tracing.addTag(spanId, 'error', error.message)
        tracing.addLog(spanId, 'Error occurred', { error: error.stack })
        
        throw error
      } finally {
        tracing.finishSpan(spanId)
        tracing.finishTrace(traceId)
      }
    }
  }
}
```

## 📚 最佳实践总结

1. **渐进式采用**：逐步将服务加入网格，避免大爆炸式迁移
2. **流量管理**：合理配置路由规则和负载均衡策略
3. **安全加固**：启用 mTLS 和细粒度授权策略
4. **可观测性**：全面监控服务间通信和性能指标
5. **故障处理**：配置熔断器、重试和超时策略
6. **性能优化**：监控代理开销，优化配置参数
7. **版本管理**：使用标签和版本进行流量分割
8. **运维自动化**：自动化部署、配置和故障恢复

通过掌握这些服务网格技术，您将能够构建高可用、安全、可观测的微服务架构。
