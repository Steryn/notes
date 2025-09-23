# 微服务架构

## 📖 概述

微服务架构是一种将应用程序构建为一组小型、独立服务的架构模式。每个服务运行在自己的进程中，通过轻量级机制（通常是HTTP API）进行通信，具有独立部署、技术多样性和故障隔离等优势。

## 🎯 学习目标

- 理解微服务架构的核心概念和设计原则
- 掌握服务拆分和边界设计方法
- 学习微服务通信和数据管理模式
- 实现完整的微服务治理体系

## 🏗️ 微服务架构框架

### 1. 微服务治理平台

```javascript
// 微服务治理平台
class MicroservicesGovernancePlatform {
  constructor() {
    this.serviceRegistry = new ServiceRegistry()
    this.configurationManager = new ConfigurationManager()
    this.serviceDiscovery = new ServiceDiscovery()
    this.circuitBreaker = new CircuitBreaker()
    this.rateLimiter = new RateLimiter()
    this.metricsCollector = new MetricsCollector()
    this.distributedTracing = new DistributedTracing()
    this.apiGateway = new APIGateway()
    this.serviceMonitor = new ServiceMonitor()
  }
  
  // 服务注册中心
  class ServiceRegistry {
    constructor() {
      this.services = new Map()
      this.instances = new Map()
      this.healthChecks = new Map()
      this.schemas = new Map()
    }
    
    // 注册服务
    registerService(serviceDefinition) {
      const service = {
        id: serviceDefinition.id || this.generateServiceId(),
        name: serviceDefinition.name,
        version: serviceDefinition.version,
        description: serviceDefinition.description,
        owner: serviceDefinition.owner,
        api: serviceDefinition.api,
        dependencies: serviceDefinition.dependencies || [],
        tags: serviceDefinition.tags || [],
        metadata: serviceDefinition.metadata || {},
        registeredAt: new Date()
      }
      
      this.services.set(service.id, service)
      
      // 注册API Schema
      if (serviceDefinition.schema) {
        this.schemas.set(service.id, serviceDefinition.schema)
      }
      
      console.log(`服务注册: ${service.name} v${service.version}`)
      
      return service
    }
    
    // 注册服务实例
    registerInstance(serviceId, instanceConfig) {
      const instance = {
        id: instanceConfig.id || this.generateInstanceId(),
        serviceId: serviceId,
        host: instanceConfig.host,
        port: instanceConfig.port,
        protocol: instanceConfig.protocol || 'http',
        healthCheckUrl: instanceConfig.healthCheckUrl,
        metadata: instanceConfig.metadata || {},
        status: 'starting',
        registeredAt: new Date(),
        lastHeartbeat: new Date()
      }
      
      if (!this.instances.has(serviceId)) {
        this.instances.set(serviceId, new Map())
      }
      
      this.instances.get(serviceId).set(instance.id, instance)
      
      // 设置健康检查
      if (instance.healthCheckUrl) {
        this.setupHealthCheck(instance)
      }
      
      console.log(`实例注册: ${instance.host}:${instance.port} (${serviceId})`)
      
      return instance
    }
    
    // 注销服务实例
    deregisterInstance(serviceId, instanceId) {
      const serviceInstances = this.instances.get(serviceId)
      
      if (serviceInstances && serviceInstances.has(instanceId)) {
        const instance = serviceInstances.get(instanceId)
        
        // 停止健康检查
        const healthCheckKey = `${serviceId}:${instanceId}`
        if (this.healthChecks.has(healthCheckKey)) {
          clearInterval(this.healthChecks.get(healthCheckKey))
          this.healthChecks.delete(healthCheckKey)
        }
        
        serviceInstances.delete(instanceId)
        console.log(`实例注销: ${instance.host}:${instance.port}`)
        
        return true
      }
      
      return false
    }
    
    // 发现服务实例
    discoverInstances(serviceName, criteria = {}) {
      let serviceId = null
      
      // 查找服务ID
      for (const [id, service] of this.services) {
        if (service.name === serviceName) {
          serviceId = id
          break
        }
      }
      
      if (!serviceId) {
        return []
      }
      
      const serviceInstances = this.instances.get(serviceId)
      if (!serviceInstances) {
        return []
      }
      
      let instances = Array.from(serviceInstances.values())
      
      // 过滤健康实例
      if (criteria.healthyOnly !== false) {
        instances = instances.filter(instance => instance.status === 'healthy')
      }
      
      // 按标签过滤
      if (criteria.tags) {
        instances = instances.filter(instance => 
          criteria.tags.every(tag => instance.metadata.tags?.includes(tag))
        )
      }
      
      // 按区域过滤
      if (criteria.region) {
        instances = instances.filter(instance => 
          instance.metadata.region === criteria.region
        )
      }
      
      return instances
    }
    
    // 设置健康检查
    setupHealthCheck(instance) {
      const healthCheckKey = `${instance.serviceId}:${instance.id}`
      
      const healthCheckInterval = setInterval(async () => {
        try {
          const isHealthy = await this.performHealthCheck(instance)
          
          instance.status = isHealthy ? 'healthy' : 'unhealthy'
          instance.lastHeartbeat = new Date()
          
          if (!isHealthy) {
            console.warn(`实例健康检查失败: ${instance.host}:${instance.port}`)
          }
          
        } catch (error) {
          instance.status = 'unhealthy'
          console.error(`健康检查异常: ${instance.host}:${instance.port}`, error)
        }
      }, 30000) // 30秒间隔
      
      this.healthChecks.set(healthCheckKey, healthCheckInterval)
    }
    
    async performHealthCheck(instance) {
      const axios = require('axios')
      
      try {
        const url = `${instance.protocol}://${instance.host}:${instance.port}${instance.healthCheckUrl}`
        const response = await axios.get(url, { timeout: 5000 })
        
        return response.status === 200
        
      } catch (error) {
        return false
      }
    }
    
    // 获取服务依赖图
    getServiceDependencyGraph() {
      const graph = {
        nodes: [],
        edges: []
      }
      
      // 添加节点
      this.services.forEach(service => {
        graph.nodes.push({
          id: service.id,
          name: service.name,
          version: service.version,
          instanceCount: this.instances.get(service.id)?.size || 0
        })
      })
      
      // 添加边
      this.services.forEach(service => {
        service.dependencies.forEach(dependency => {
          graph.edges.push({
            from: service.id,
            to: dependency.serviceId || dependency,
            type: dependency.type || 'synchronous'
          })
        })
      })
      
      return graph
    }
    
    generateServiceId() {
      return `svc_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
    }
    
    generateInstanceId() {
      return `inst_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`
    }
    
    // 获取注册中心统计
    getRegistryStatistics() {
      const stats = {
        totalServices: this.services.size,
        totalInstances: 0,
        healthyInstances: 0,
        serviceBreakdown: {}
      }
      
      this.instances.forEach((serviceInstances, serviceId) => {
        const service = this.services.get(serviceId)
        const instances = Array.from(serviceInstances.values())
        
        stats.totalInstances += instances.length
        stats.healthyInstances += instances.filter(i => i.status === 'healthy').length
        
        stats.serviceBreakdown[service.name] = {
          total: instances.length,
          healthy: instances.filter(i => i.status === 'healthy').length,
          unhealthy: instances.filter(i => i.status === 'unhealthy').length
        }
      })
      
      return stats
    }
  }
  
  // 配置管理器
  class ConfigurationManager {
    constructor() {
      this.configurations = new Map()
      this.watchers = new Map()
      this.versions = new Map()
    }
    
    // 设置配置
    setConfiguration(service, environment, config) {
      const key = `${service}:${environment}`
      const version = (this.versions.get(key) || 0) + 1
      
      const configEntry = {
        service,
        environment,
        config,
        version,
        updatedAt: new Date(),
        updatedBy: 'system'
      }
      
      this.configurations.set(key, configEntry)
      this.versions.set(key, version)
      
      // 通知监听者
      this.notifyWatchers(key, configEntry)
      
      console.log(`配置更新: ${service} (${environment}) v${version}`)
      
      return configEntry
    }
    
    // 获取配置
    getConfiguration(service, environment) {
      const key = `${service}:${environment}`
      return this.configurations.get(key)
    }
    
    // 监听配置变化
    watchConfiguration(service, environment, callback) {
      const key = `${service}:${environment}`
      
      if (!this.watchers.has(key)) {
        this.watchers.set(key, new Set())
      }
      
      this.watchers.get(key).add(callback)
      
      console.log(`配置监听: ${service} (${environment})`)
      
      // 返回取消监听的函数
      return () => {
        const watchers = this.watchers.get(key)
        if (watchers) {
          watchers.delete(callback)
        }
      }
    }
    
    // 通知监听者
    notifyWatchers(key, configEntry) {
      const watchers = this.watchers.get(key)
      
      if (watchers) {
        watchers.forEach(callback => {
          try {
            callback(configEntry)
          } catch (error) {
            console.error('配置监听回调错误:', error)
          }
        })
      }
    }
    
    // 获取配置历史
    getConfigurationHistory(service, environment) {
      // 这里可以实现配置历史记录
      return []
    }
  }
  
  // 熔断器
  class CircuitBreaker {
    constructor() {
      this.circuits = new Map()
      this.defaultConfig = {
        failureThreshold: 5,
        recoveryTimeout: 60000,
        monitoringPeriod: 10000,
        expectedErrors: ['ECONNREFUSED', 'ETIMEDOUT']
      }
    }
    
    // 创建熔断器
    createCircuit(serviceId, config = {}) {
      const circuitConfig = { ...this.defaultConfig, ...config }
      
      const circuit = {
        serviceId,
        state: 'closed', // 'closed', 'open', 'half-open'
        failures: 0,
        lastFailureTime: null,
        lastSuccessTime: null,
        config: circuitConfig,
        statistics: {
          totalRequests: 0,
          successfulRequests: 0,
          failedRequests: 0,
          rejectedRequests: 0
        }
      }
      
      this.circuits.set(serviceId, circuit)
      
      console.log(`熔断器创建: ${serviceId}`)
      
      return circuit
    }
    
    // 执行请求
    async execute(serviceId, operation) {
      let circuit = this.circuits.get(serviceId)
      
      if (!circuit) {
        circuit = this.createCircuit(serviceId)
      }
      
      // 检查熔断器状态
      if (!this.canExecute(circuit)) {
        circuit.statistics.rejectedRequests++
        throw new Error(`熔断器开启: ${serviceId}`)
      }
      
      circuit.statistics.totalRequests++
      
      try {
        const result = await operation()
        
        this.onSuccess(circuit)
        
        return result
        
      } catch (error) {
        this.onFailure(circuit, error)
        throw error
      }
    }
    
    // 检查是否可以执行
    canExecute(circuit) {
      switch (circuit.state) {
        case 'closed':
          return true
          
        case 'open':
          // 检查是否可以尝试恢复
          if (Date.now() - circuit.lastFailureTime > circuit.config.recoveryTimeout) {
            circuit.state = 'half-open'
            console.log(`熔断器半开: ${circuit.serviceId}`)
            return true
          }
          return false
          
        case 'half-open':
          return true
          
        default:
          return false
      }
    }
    
    // 成功回调
    onSuccess(circuit) {
      circuit.failures = 0
      circuit.lastSuccessTime = Date.now()
      circuit.statistics.successfulRequests++
      
      if (circuit.state === 'half-open') {
        circuit.state = 'closed'
        console.log(`熔断器关闭: ${circuit.serviceId}`)
      }
    }
    
    // 失败回调
    onFailure(circuit, error) {
      circuit.statistics.failedRequests++
      
      // 检查是否是预期错误
      if (this.isExpectedError(circuit, error)) {
        circuit.failures++
        circuit.lastFailureTime = Date.now()
        
        // 检查是否达到失败阈值
        if (circuit.failures >= circuit.config.failureThreshold) {
          circuit.state = 'open'
          console.log(`熔断器开启: ${circuit.serviceId}`)
        }
      }
    }
    
    // 检查是否是预期错误
    isExpectedError(circuit, error) {
      return circuit.config.expectedErrors.some(expectedError => 
        error.code === expectedError || error.message.includes(expectedError)
      )
    }
    
    // 获取熔断器状态
    getCircuitState(serviceId) {
      const circuit = this.circuits.get(serviceId)
      
      if (!circuit) {
        return null
      }
      
      return {
        serviceId: circuit.serviceId,
        state: circuit.state,
        failures: circuit.failures,
        lastFailureTime: circuit.lastFailureTime,
        lastSuccessTime: circuit.lastSuccessTime,
        statistics: circuit.statistics
      }
    }
    
    // 获取所有熔断器状态
    getAllCircuitStates() {
      const states = {}
      
      this.circuits.forEach((circuit, serviceId) => {
        states[serviceId] = this.getCircuitState(serviceId)
      })
      
      return states
    }
  }
  
  // 分布式追踪
  class DistributedTracing {
    constructor() {
      this.traces = new Map()
      this.spans = new Map()
      this.samplingRate = 0.1 // 10%采样率
    }
    
    // 开始追踪
    startTrace(operationName, parentSpanId = null) {
      const traceId = parentSpanId ? this.extractTraceId(parentSpanId) : this.generateTraceId()
      const spanId = this.generateSpanId()
      
      const span = {
        traceId,
        spanId,
        parentSpanId,
        operationName,
        startTime: Date.now(),
        endTime: null,
        duration: null,
        tags: {},
        logs: [],
        status: 'active'
      }
      
      this.spans.set(spanId, span)
      
      // 如果是新的trace，创建trace记录
      if (!parentSpanId) {
        this.traces.set(traceId, {
          traceId,
          rootSpanId: spanId,
          spans: new Set([spanId]),
          startTime: Date.now(),
          endTime: null,
          status: 'active'
        })
      } else {
        // 添加到现有trace
        const trace = this.traces.get(traceId)
        if (trace) {
          trace.spans.add(spanId)
        }
      }
      
      console.log(`开始追踪: ${operationName} (${spanId})`)
      
      return spanId
    }
    
    // 结束追踪
    finishTrace(spanId, tags = {}, logs = []) {
      const span = this.spans.get(spanId)
      
      if (!span) {
        return
      }
      
      span.endTime = Date.now()
      span.duration = span.endTime - span.startTime
      span.tags = { ...span.tags, ...tags }
      span.logs = [...span.logs, ...logs]
      span.status = 'completed'
      
      // 检查trace是否完成
      const trace = this.traces.get(span.traceId)
      if (trace) {
        const allSpansCompleted = Array.from(trace.spans).every(spanId => {
          const s = this.spans.get(spanId)
          return s && s.status === 'completed'
        })
        
        if (allSpansCompleted) {
          trace.endTime = Date.now()
          trace.status = 'completed'
        }
      }
      
      console.log(`结束追踪: ${span.operationName} (${span.duration}ms)`)
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
    
    // 获取追踪信息
    getTrace(traceId) {
      const trace = this.traces.get(traceId)
      
      if (!trace) {
        return null
      }
      
      const spans = Array.from(trace.spans).map(spanId => this.spans.get(spanId))
      
      return {
        ...trace,
        spans: spans.filter(span => span !== undefined)
      }
    }
    
    // 获取性能统计
    getPerformanceStatistics() {
      const stats = {
        totalTraces: this.traces.size,
        completedTraces: 0,
        averageDuration: 0,
        operationStats: {}
      }
      
      let totalDuration = 0
      let completedCount = 0
      
      this.traces.forEach(trace => {
        if (trace.status === 'completed') {
          stats.completedTraces++
          const duration = trace.endTime - trace.startTime
          totalDuration += duration
          completedCount++
        }
      })
      
      if (completedCount > 0) {
        stats.averageDuration = totalDuration / completedCount
      }
      
      // 操作统计
      this.spans.forEach(span => {
        if (span.status === 'completed') {
          if (!stats.operationStats[span.operationName]) {
            stats.operationStats[span.operationName] = {
              count: 0,
              totalDuration: 0,
              averageDuration: 0
            }
          }
          
          const opStats = stats.operationStats[span.operationName]
          opStats.count++
          opStats.totalDuration += span.duration
          opStats.averageDuration = opStats.totalDuration / opStats.count
        }
      })
      
      return stats
    }
    
    generateTraceId() {
      return `trace_${Date.now()}_${Math.random().toString(36).substr(2, 12)}`
    }
    
    generateSpanId() {
      return `span_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`
    }
    
    extractTraceId(spanId) {
      const span = this.spans.get(spanId)
      return span ? span.traceId : null
    }
  }
  
  // 微服务通信管理器
  class MicroserviceCommunicationManager {
    constructor() {
      this.httpClient = new EnhancedHttpClient()
      this.messageQueue = new MessageQueueClient()
      this.eventBus = new EventBus()
    }
    
    // 增强的HTTP客户端
    class EnhancedHttpClient {
      constructor() {
        this.defaultTimeout = 30000
        this.retryConfig = {
          maxRetries: 3,
          backoffFactor: 2,
          initialDelay: 1000
        }
      }
      
      async request(serviceId, path, options = {}) {
        const config = {
          timeout: options.timeout || this.defaultTimeout,
          retries: options.retries || this.retryConfig.maxRetries,
          headers: {
            'Content-Type': 'application/json',
            'X-Request-ID': this.generateRequestId(),
            'X-Service-ID': options.sourceServiceId || 'unknown',
            ...options.headers
          },
          ...options
        }
        
        let lastError
        
        for (let attempt = 0; attempt <= config.retries; attempt++) {
          try {
            const instance = await this.selectServiceInstance(serviceId)
            const url = `${instance.protocol}://${instance.host}:${instance.port}${path}`
            
            const response = await this.performRequest(url, config)
            
            return response
            
          } catch (error) {
            lastError = error
            
            if (attempt < config.retries && this.shouldRetry(error)) {
              const delay = this.calculateBackoffDelay(attempt)
              await this.delay(delay)
              continue
            }
            
            break
          }
        }
        
        throw lastError
      }
      
      async performRequest(url, config) {
        const axios = require('axios')
        
        return await axios({
          url,
          method: config.method || 'GET',
          data: config.data,
          headers: config.headers,
          timeout: config.timeout
        })
      }
      
      shouldRetry(error) {
        return error.code === 'ECONNRESET' || 
               error.code === 'ETIMEDOUT' ||
               (error.response && error.response.status >= 500)
      }
      
      calculateBackoffDelay(attempt) {
        return this.retryConfig.initialDelay * Math.pow(this.retryConfig.backoffFactor, attempt)
      }
      
      async selectServiceInstance(serviceId) {
        // 这里应该调用服务发现
        return {
          protocol: 'http',
          host: 'localhost',
          port: 8080
        }
      }
      
      generateRequestId() {
        return `req_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`
      }
      
      delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms))
      }
    }
  }
  
  // 启动微服务治理平台
  async start() {
    console.log('启动微服务治理平台...')
    
    // 启动各个组件
    await this.metricsCollector.start()
    await this.serviceMonitor.start()
    
    console.log('微服务治理平台启动完成')
  }
  
  // 停止微服务治理平台
  async stop() {
    console.log('停止微服务治理平台...')
    
    // 停止各个组件
    await this.metricsCollector.stop()
    await this.serviceMonitor.stop()
    
    console.log('微服务治理平台停止完成')
  }
  
  // 获取平台状态
  getPlatformStatus() {
    return {
      serviceRegistry: this.serviceRegistry.getRegistryStatistics(),
      circuitBreaker: this.circuitBreaker.getAllCircuitStates(),
      distributedTracing: this.distributedTracing.getPerformanceStatistics(),
      timestamp: new Date()
    }
  }
}

// 微服务实例基类
class MicroserviceBase {
  constructor(serviceConfig) {
    this.config = serviceConfig
    this.serviceId = serviceConfig.id
    this.serviceName = serviceConfig.name
    this.version = serviceConfig.version
    this.port = serviceConfig.port
    
    this.server = null
    this.status = 'stopped'
    this.governance = null
    
    this.healthChecks = []
    this.metrics = new Map()
  }
  
  // 连接到治理平台
  connectToGovernance(governancePlatform) {
    this.governance = governancePlatform
    
    // 注册服务
    const serviceDefinition = {
      id: this.serviceId,
      name: this.serviceName,
      version: this.version,
      description: this.config.description,
      api: this.config.api,
      dependencies: this.config.dependencies || []
    }
    
    this.governance.serviceRegistry.registerService(serviceDefinition)
    
    // 注册实例
    const instanceConfig = {
      host: 'localhost',
      port: this.port,
      healthCheckUrl: '/health'
    }
    
    this.governance.serviceRegistry.registerInstance(this.serviceId, instanceConfig)
    
    console.log(`服务连接到治理平台: ${this.serviceName}`)
  }
  
  // 启动微服务
  async start() {
    try {
      console.log(`启动微服务: ${this.serviceName}`)
      
      this.status = 'starting'
      
      // 启动HTTP服务器
      await this.startHttpServer()
      
      // 注册健康检查
      this.registerHealthChecks()
      
      this.status = 'running'
      
      console.log(`微服务启动完成: ${this.serviceName} (端口: ${this.port})`)
      
    } catch (error) {
      this.status = 'failed'
      console.error(`微服务启动失败: ${this.serviceName}`, error)
      throw error
    }
  }
  
  // 停止微服务
  async stop() {
    try {
      console.log(`停止微服务: ${this.serviceName}`)
      
      this.status = 'stopping'
      
      // 从治理平台注销
      if (this.governance) {
        this.governance.serviceRegistry.deregisterInstance(this.serviceId, this.instanceId)
      }
      
      // 停止HTTP服务器
      if (this.server) {
        this.server.close()
      }
      
      this.status = 'stopped'
      
      console.log(`微服务停止完成: ${this.serviceName}`)
      
    } catch (error) {
      console.error(`微服务停止失败: ${this.serviceName}`, error)
    }
  }
  
  // 启动HTTP服务器
  async startHttpServer() {
    const express = require('express')
    const app = express()
    
    // 中间件
    app.use(express.json())
    app.use(this.createLoggingMiddleware())
    app.use(this.createMetricsMiddleware())
    
    // 健康检查端点
    app.get('/health', (req, res) => {
      const healthStatus = this.performHealthChecks()
      res.status(healthStatus.healthy ? 200 : 500).json(healthStatus)
    })
    
    // 指标端点
    app.get('/metrics', (req, res) => {
      res.json(this.getMetrics())
    })
    
    // 注册业务路由
    this.registerRoutes(app)
    
    return new Promise((resolve, reject) => {
      this.server = app.listen(this.port, (error) => {
        if (error) {
          reject(error)
        } else {
          resolve()
        }
      })
    })
  }
  
  // 创建日志中间件
  createLoggingMiddleware() {
    return (req, res, next) => {
      const requestId = req.headers['x-request-id'] || this.generateRequestId()
      const startTime = Date.now()
      
      req.requestId = requestId
      
      res.on('finish', () => {
        const duration = Date.now() - startTime
        console.log(`${req.method} ${req.path} ${res.statusCode} ${duration}ms [${requestId}]`)
      })
      
      next()
    }
  }
  
  // 创建指标中间件
  createMetricsMiddleware() {
    return (req, res, next) => {
      const startTime = Date.now()
      
      res.on('finish', () => {
        const duration = Date.now() - startTime
        
        // 记录请求指标
        this.recordMetric('http_requests_total', 1, {
          method: req.method,
          path: req.path,
          status: res.statusCode
        })
        
        this.recordMetric('http_request_duration', duration, {
          method: req.method,
          path: req.path
        })
      })
      
      next()
    }
  }
  
  // 注册路由 (子类实现)
  registerRoutes(app) {
    // 子类实现具体的业务路由
  }
  
  // 注册健康检查
  registerHealthChecks() {
    this.healthChecks.push({
      name: 'service_status',
      check: () => ({ healthy: this.status === 'running' })
    })
    
    this.healthChecks.push({
      name: 'memory_usage',
      check: () => {
        const memUsage = process.memoryUsage()
        const heapUsedMB = memUsage.heapUsed / 1024 / 1024
        return {
          healthy: heapUsedMB < 500, // 500MB阈值
          details: { heapUsedMB: heapUsedMB.toFixed(2) }
        }
      }
    })
  }
  
  // 执行健康检查
  performHealthChecks() {
    const results = {
      healthy: true,
      checks: {}
    }
    
    this.healthChecks.forEach(healthCheck => {
      try {
        const result = healthCheck.check()
        results.checks[healthCheck.name] = result
        
        if (!result.healthy) {
          results.healthy = false
        }
        
      } catch (error) {
        results.checks[healthCheck.name] = {
          healthy: false,
          error: error.message
        }
        results.healthy = false
      }
    })
    
    return results
  }
  
  // 记录指标
  recordMetric(name, value, labels = {}) {
    const key = `${name}_${JSON.stringify(labels)}`
    
    if (!this.metrics.has(key)) {
      this.metrics.set(key, {
        name,
        labels,
        values: [],
        count: 0,
        sum: 0,
        avg: 0
      })
    }
    
    const metric = this.metrics.get(key)
    metric.values.push(value)
    metric.count++
    metric.sum += value
    metric.avg = metric.sum / metric.count
    
    // 保持最近100个值
    if (metric.values.length > 100) {
      metric.values.shift()
    }
  }
  
  // 获取指标
  getMetrics() {
    const metrics = {}
    
    this.metrics.forEach((metric, key) => {
      metrics[key] = {
        name: metric.name,
        labels: metric.labels,
        count: metric.count,
        sum: metric.sum,
        avg: metric.avg,
        current: metric.values[metric.values.length - 1]
      }
    })
    
    return metrics
  }
  
  generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`
  }
}

// 使用示例
async function demonstrateMicroservices() {
  console.log('=== 微服务架构演示 ===')
  
  // 创建治理平台
  const governance = new MicroservicesGovernancePlatform()
  await governance.start()
  
  // 创建用户微服务
  class UserMicroservice extends MicroserviceBase {
    constructor() {
      super({
        id: 'user-service',
        name: 'UserService',
        version: '1.0.0',
        port: 3001,
        description: '用户管理微服务',
        api: {
          endpoints: [
            { path: '/users', method: 'GET', description: '获取用户列表' },
            { path: '/users', method: 'POST', description: '创建用户' },
            { path: '/users/:id', method: 'GET', description: '获取用户详情' }
          ]
        }
      })
      
      this.users = new Map()
    }
    
    registerRoutes(app) {
      app.get('/users', (req, res) => {
        const users = Array.from(this.users.values())
        res.json(users)
      })
      
      app.post('/users', (req, res) => {
        const user = {
          id: this.generateUserId(),
          ...req.body,
          createdAt: new Date()
        }
        
        this.users.set(user.id, user)
        
        res.status(201).json(user)
      })
      
      app.get('/users/:id', (req, res) => {
        const user = this.users.get(req.params.id)
        
        if (user) {
          res.json(user)
        } else {
          res.status(404).json({ error: 'User not found' })
        }
      })
    }
    
    generateUserId() {
      return `user_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
    }
  }
  
  // 创建订单微服务
  class OrderMicroservice extends MicroserviceBase {
    constructor() {
      super({
        id: 'order-service',
        name: 'OrderService',
        version: '1.0.0',
        port: 3002,
        description: '订单管理微服务',
        dependencies: ['user-service']
      })
      
      this.orders = new Map()
    }
    
    registerRoutes(app) {
      app.get('/orders', (req, res) => {
        const orders = Array.from(this.orders.values())
        res.json(orders)
      })
      
      app.post('/orders', async (req, res) => {
        try {
          // 验证用户存在
          await this.validateUser(req.body.userId)
          
          const order = {
            id: this.generateOrderId(),
            ...req.body,
            status: 'pending',
            createdAt: new Date()
          }
          
          this.orders.set(order.id, order)
          
          res.status(201).json(order)
          
        } catch (error) {
          res.status(400).json({ error: error.message })
        }
      })
    }
    
    async validateUser(userId) {
      // 调用用户服务验证用户
      console.log(`验证用户: ${userId}`)
      
      // 这里应该实际调用用户服务
      if (!userId) {
        throw new Error('用户ID不能为空')
      }
    }
    
    generateOrderId() {
      return `order_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
    }
  }
  
  // 启动微服务
  const userService = new UserMicroservice()
  const orderService = new OrderMicroservice()
  
  userService.connectToGovernance(governance)
  orderService.connectToGovernance(governance)
  
  await userService.start()
  await orderService.start()
  
  // 等待服务稳定
  await new Promise(resolve => setTimeout(resolve, 2000))
  
  // 获取平台状态
  const platformStatus = governance.getPlatformStatus()
  console.log('治理平台状态:', JSON.stringify(platformStatus, null, 2))
  
  // 测试服务调用
  console.log('测试服务调用...')
  
  // 模拟创建用户
  console.log('创建用户...')
  
  // 模拟创建订单
  console.log('创建订单...')
  
  // 停止服务
  await userService.stop()
  await orderService.stop()
  await governance.stop()
  
  console.log('微服务架构演示完成')
}

module.exports = {
  MicroservicesGovernancePlatform,
  MicroserviceBase
}
```

## 📚 最佳实践总结

1. **领域驱动设计**：基于业务领域进行服务拆分
2. **服务自治**：每个服务独立开发、部署和扩展
3. **API优先**：设计清晰的服务接口和契约
4. **数据分离**：每个服务管理自己的数据
5. **故障隔离**：实现熔断器和降级机制
6. **可观测性**：全面的监控、日志和追踪
7. **配置外部化**：统一的配置管理
8. **渐进式迁移**：从单体到微服务的平滑过渡

通过掌握微服务架构技术，您将能够构建现代化的分布式应用系统。
