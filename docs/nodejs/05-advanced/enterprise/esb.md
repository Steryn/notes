# ESB 企业服务总线

## 📖 概述

企业服务总线（Enterprise Service Bus，ESB）是一种集成架构模式，提供了一个通用的消息传递和服务交互基础设施。ESB充当企业中不同系统和服务之间的中介，实现松耦合的集成和通信。

## 🎯 学习目标

- 理解ESB的核心概念和架构模式
- 掌握服务注册发现和路由机制
- 学习消息转换和协议适配技术
- 实现可扩展的ESB中间件系统

## 🚌 ESB核心架构

### 1. ESB基础框架

```javascript
// ESB核心框架
class EnterpriseServiceBus {
  constructor(config = {}) {
    this.config = config
    this.serviceRegistry = new ServiceRegistry()
    this.messageRouter = new MessageRouter()
    this.protocolAdapters = new Map()
    this.transformationEngine = new TransformationEngine()
    this.securityManager = new SecurityManager()
    this.auditLogger = new AuditLogger()
    this.monitoringService = new MonitoringService()
    this.status = 'stopped'
    this.startTime = null
  }
  
  // 服务注册表
  class ServiceRegistry {
    constructor() {
      this.services = new Map()
      this.serviceTypes = new Map()
      this.healthChecks = new Map()
      this.loadBalancers = new Map()
    }
    
    // 注册服务
    async registerService(serviceConfig) {
      const service = {
        id: serviceConfig.id || this.generateServiceId(),
        name: serviceConfig.name,
        version: serviceConfig.version || '1.0.0',
        description: serviceConfig.description,
        endpoint: serviceConfig.endpoint,
        contract: serviceConfig.contract,
        protocols: serviceConfig.protocols || ['http'],
        capabilities: serviceConfig.capabilities || [],
        metadata: serviceConfig.metadata || {},
        status: 'registered',
        registeredAt: new Date(),
        lastHeartbeat: new Date(),
        healthStatus: 'unknown'
      }
      
      // 验证服务配置
      await this.validateService(service)
      
      // 存储服务信息
      this.services.set(service.id, service)
      
      // 按类型分组
      if (!this.serviceTypes.has(service.name)) {
        this.serviceTypes.set(service.name, new Set())
      }
      this.serviceTypes.get(service.name).add(service.id)
      
      // 设置健康检查
      if (service.contract.healthCheck) {
        this.setupHealthCheck(service)
      }
      
      // 设置负载均衡
      this.setupLoadBalancer(service)
      
      console.log(`服务注册成功: ${service.name}[${service.id}]`)
      
      return service
    }
    
    // 注销服务
    async unregisterService(serviceId) {
      const service = this.services.get(serviceId)
      
      if (!service) {
        throw new Error(`服务不存在: ${serviceId}`)
      }
      
      // 从类型分组中移除
      const typeSet = this.serviceTypes.get(service.name)
      if (typeSet) {
        typeSet.delete(serviceId)
        if (typeSet.size === 0) {
          this.serviceTypes.delete(service.name)
        }
      }
      
      // 停止健康检查
      if (this.healthChecks.has(serviceId)) {
        clearInterval(this.healthChecks.get(serviceId))
        this.healthChecks.delete(serviceId)
      }
      
      // 移除负载均衡器
      this.loadBalancers.delete(serviceId)
      
      // 删除服务
      this.services.delete(serviceId)
      
      console.log(`服务注销成功: ${service.name}[${serviceId}]`)
      
      return true
    }
    
    // 发现服务
    discoverServices(criteria = {}) {
      const results = []
      
      this.services.forEach(service => {
        if (this.matchesCriteria(service, criteria)) {
          results.push({
            ...service,
            // 不返回敏感信息
            metadata: this.filterMetadata(service.metadata)
          })
        }
      })
      
      return results
    }
    
    // 按名称获取服务
    getServicesByName(serviceName) {
      const serviceIds = this.serviceTypes.get(serviceName)
      
      if (!serviceIds) {
        return []
      }
      
      return Array.from(serviceIds)
        .map(id => this.services.get(id))
        .filter(service => service.status === 'active')
    }
    
    // 获取健康的服务实例
    getHealthyServices(serviceName) {
      const services = this.getServicesByName(serviceName)
      
      return services.filter(service => 
        service.healthStatus === 'healthy' || service.healthStatus === 'unknown'
      )
    }
    
    // 选择服务实例（负载均衡）
    selectServiceInstance(serviceName, strategy = 'round_robin') {
      const healthyServices = this.getHealthyServices(serviceName)
      
      if (healthyServices.length === 0) {
        throw new Error(`没有可用的服务实例: ${serviceName}`)
      }
      
      const loadBalancer = this.loadBalancers.get(serviceName)
      
      if (loadBalancer) {
        return loadBalancer.selectInstance(healthyServices, strategy)
      }
      
      // 默认选择第一个
      return healthyServices[0]
    }
    
    // 设置健康检查
    setupHealthCheck(service) {
      if (!service.contract.healthCheck) {
        return
      }
      
      const checkInterval = service.contract.healthCheck.interval || 30000
      
      const healthCheckTimer = setInterval(async () => {
        try {
          const isHealthy = await this.performHealthCheck(service)
          
          service.healthStatus = isHealthy ? 'healthy' : 'unhealthy'
          service.lastHeartbeat = new Date()
          
          if (!isHealthy) {
            console.warn(`服务健康检查失败: ${service.name}[${service.id}]`)
          }
          
        } catch (error) {
          service.healthStatus = 'unhealthy'
          console.error(`健康检查异常: ${service.name}[${service.id}]`, error)
        }
      }, checkInterval)
      
      this.healthChecks.set(service.id, healthCheckTimer)
    }
    
    async performHealthCheck(service) {
      const healthCheckConfig = service.contract.healthCheck
      
      // HTTP健康检查
      if (healthCheckConfig.type === 'http') {
        const axios = require('axios')
        
        try {
          const response = await axios.get(
            `${service.endpoint}${healthCheckConfig.path}`,
            { timeout: healthCheckConfig.timeout || 5000 }
          )
          
          return response.status >= 200 && response.status < 300
        } catch (error) {
          return false
        }
      }
      
      // TCP健康检查
      if (healthCheckConfig.type === 'tcp') {
        const net = require('net')
        
        return new Promise(resolve => {
          const socket = new net.Socket()
          
          socket.setTimeout(healthCheckConfig.timeout || 5000)
          
          socket.on('connect', () => {
            socket.destroy()
            resolve(true)
          })
          
          socket.on('timeout', () => {
            socket.destroy()
            resolve(false)
          })
          
          socket.on('error', () => {
            resolve(false)
          })
          
          const url = new URL(service.endpoint)
          socket.connect(url.port, url.hostname)
        })
      }
      
      return true
    }
    
    // 设置负载均衡器
    setupLoadBalancer(service) {
      if (this.loadBalancers.has(service.name)) {
        return
      }
      
      const loadBalancer = new LoadBalancer({
        strategy: service.contract.loadBalancing?.strategy || 'round_robin',
        healthCheckEnabled: !!service.contract.healthCheck
      })
      
      this.loadBalancers.set(service.name, loadBalancer)
    }
    
    validateService(service) {
      if (!service.name) {
        throw new Error('服务名称不能为空')
      }
      
      if (!service.endpoint) {
        throw new Error('服务端点不能为空')
      }
      
      if (!service.contract) {
        throw new Error('服务契约不能为空')
      }
    }
    
    matchesCriteria(service, criteria) {
      if (criteria.name && service.name !== criteria.name) {
        return false
      }
      
      if (criteria.version && service.version !== criteria.version) {
        return false
      }
      
      if (criteria.capabilities && criteria.capabilities.length > 0) {
        const hasAllCapabilities = criteria.capabilities.every(cap => 
          service.capabilities.includes(cap)
        )
        if (!hasAllCapabilities) {
          return false
        }
      }
      
      if (criteria.protocol && !service.protocols.includes(criteria.protocol)) {
        return false
      }
      
      if (criteria.healthStatus && service.healthStatus !== criteria.healthStatus) {
        return false
      }
      
      return true
    }
    
    filterMetadata(metadata) {
      // 过滤敏感信息
      const filtered = { ...metadata }
      const sensitiveKeys = ['password', 'secret', 'key', 'token']
      
      sensitiveKeys.forEach(key => {
        if (filtered[key]) {
          filtered[key] = '***'
        }
      })
      
      return filtered
    }
    
    generateServiceId() {
      return `svc_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`
    }
    
    getRegistryStatistics() {
      const stats = {
        totalServices: this.services.size,
        servicesByType: {},
        healthStatus: { healthy: 0, unhealthy: 0, unknown: 0 },
        protocolDistribution: {}
      }
      
      this.services.forEach(service => {
        // 按类型统计
        stats.servicesByType[service.name] = 
          (stats.servicesByType[service.name] || 0) + 1
        
        // 健康状态统计
        stats.healthStatus[service.healthStatus] = 
          (stats.healthStatus[service.healthStatus] || 0) + 1
        
        // 协议分布统计
        service.protocols.forEach(protocol => {
          stats.protocolDistribution[protocol] = 
            (stats.protocolDistribution[protocol] || 0) + 1
        })
      })
      
      return stats
    }
  }
  
  // 消息路由器
  class MessageRouter {
    constructor() {
      this.routes = new Map()
      this.routingPolicies = new Map()
      this.messageQueue = []
      this.routingStatistics = new Map()
    }
    
    // 添加路由规则
    addRoute(routeConfig) {
      const route = {
        id: routeConfig.id || this.generateRouteId(),
        name: routeConfig.name,
        source: routeConfig.source,
        destination: routeConfig.destination,
        conditions: routeConfig.conditions || [],
        transformations: routeConfig.transformations || [],
        filters: routeConfig.filters || [],
        priority: routeConfig.priority || 0,
        enabled: routeConfig.enabled !== false,
        createdAt: new Date()
      }
      
      this.routes.set(route.id, route)
      
      // 初始化路由统计
      this.routingStatistics.set(route.id, {
        messagesRouted: 0,
        errors: 0,
        averageLatency: 0,
        lastUsed: null
      })
      
      console.log(`路由规则添加: ${route.name}[${route.id}]`)
      
      return route
    }
    
    // 路由消息
    async routeMessage(message, context = {}) {
      const routingContext = {
        ...context,
        messageId: message.id || this.generateMessageId(),
        routingStartTime: Date.now(),
        routingPath: []
      }
      
      console.log(`开始路由消息: ${routingContext.messageId}`)
      
      try {
        // 查找匹配的路由
        const matchedRoutes = await this.findMatchingRoutes(message, routingContext)
        
        if (matchedRoutes.length === 0) {
          throw new Error('没有找到匹配的路由规则')
        }
        
        // 按优先级排序
        matchedRoutes.sort((a, b) => b.priority - a.priority)
        
        const routingResults = []
        
        // 执行路由
        for (const route of matchedRoutes) {
          try {
            const result = await this.executeRoute(message, route, routingContext)
            routingResults.push(result)
            
            // 更新统计信息
            this.updateRoutingStatistics(route.id, true, Date.now() - routingContext.routingStartTime)
            
          } catch (routeError) {
            console.error(`路由执行失败: ${route.name}`, routeError)
            
            routingResults.push({
              routeId: route.id,
              routeName: route.name,
              success: false,
              error: routeError.message
            })
            
            // 更新错误统计
            this.updateRoutingStatistics(route.id, false, Date.now() - routingContext.routingStartTime)
          }
        }
        
        return {
          messageId: routingContext.messageId,
          routingResults,
          totalLatency: Date.now() - routingContext.routingStartTime,
          routingPath: routingContext.routingPath
        }
        
      } catch (error) {
        console.error(`消息路由失败: ${routingContext.messageId}`, error)
        throw error
      }
    }
    
    async findMatchingRoutes(message, context) {
      const matchedRoutes = []
      
      for (const route of this.routes.values()) {
        if (!route.enabled) {
          continue
        }
        
        // 检查源匹配
        if (route.source && !this.matchesSource(message, route.source)) {
          continue
        }
        
        // 检查条件匹配
        let allConditionsMet = true
        
        for (const condition of route.conditions) {
          if (!await this.evaluateCondition(message, condition, context)) {
            allConditionsMet = false
            break
          }
        }
        
        if (allConditionsMet) {
          matchedRoutes.push(route)
        }
      }
      
      return matchedRoutes
    }
    
    async executeRoute(message, route, context) {
      console.log(`执行路由: ${route.name}`)
      
      let processedMessage = { ...message }
      
      // 应用过滤器
      for (const filter of route.filters) {
        processedMessage = await this.applyFilter(processedMessage, filter, context)
      }
      
      // 应用转换
      for (const transformation of route.transformations) {
        processedMessage = await this.applyTransformation(processedMessage, transformation, context)
      }
      
      // 发送到目标
      const deliveryResult = await this.deliverMessage(processedMessage, route.destination, context)
      
      // 记录路由路径
      context.routingPath.push({
        routeId: route.id,
        routeName: route.name,
        destination: route.destination,
        timestamp: new Date()
      })
      
      return {
        routeId: route.id,
        routeName: route.name,
        success: true,
        deliveryResult
      }
    }
    
    async deliverMessage(message, destination, context) {
      // 根据目标类型选择投递方式
      switch (destination.type) {
        case 'service':
          return await this.deliverToService(message, destination, context)
        case 'queue':
          return await this.deliverToQueue(message, destination, context)
        case 'topic':
          return await this.deliverToTopic(message, destination, context)
        case 'endpoint':
          return await this.deliverToEndpoint(message, destination, context)
        default:
          throw new Error(`不支持的目标类型: ${destination.type}`)
      }
    }
    
    async deliverToService(message, destination, context) {
      // 通过服务注册表获取服务实例
      const serviceRegistry = context.serviceRegistry
      const serviceInstance = serviceRegistry.selectServiceInstance(destination.serviceName)
      
      if (!serviceInstance) {
        throw new Error(`服务不可用: ${destination.serviceName}`)
      }
      
      // 调用服务
      const axios = require('axios')
      
      const response = await axios.post(
        `${serviceInstance.endpoint}${destination.path || ''}`,
        message.body,
        {
          headers: {
            ...message.headers,
            'X-ESB-Message-ID': message.id,
            'X-ESB-Source': message.source
          },
          timeout: destination.timeout || 30000
        }
      )
      
      return {
        serviceId: serviceInstance.id,
        serviceName: serviceInstance.name,
        statusCode: response.status,
        response: response.data,
        deliveredAt: new Date()
      }
    }
    
    async deliverToQueue(message, destination, context) {
      // 投递到消息队列
      console.log(`投递到队列: ${destination.queueName}`)
      
      // 这里可以集成具体的消息队列实现（如RabbitMQ、Kafka等）
      return {
        queueName: destination.queueName,
        messageId: message.id,
        deliveredAt: new Date()
      }
    }
    
    matchesSource(message, sourcePattern) {
      if (sourcePattern === '*') {
        return true
      }
      
      if (sourcePattern.startsWith('regex:')) {
        const regex = new RegExp(sourcePattern.substring(6))
        return regex.test(message.source)
      }
      
      return message.source === sourcePattern
    }
    
    async evaluateCondition(message, condition, context) {
      switch (condition.type) {
        case 'header':
          return this.evaluateHeaderCondition(message, condition)
        case 'content':
          return this.evaluateContentCondition(message, condition)
        case 'size':
          return this.evaluateSizeCondition(message, condition)
        case 'time':
          return this.evaluateTimeCondition(message, condition)
        default:
          return true
      }
    }
    
    updateRoutingStatistics(routeId, success, latency) {
      const stats = this.routingStatistics.get(routeId)
      
      if (stats) {
        stats.messagesRouted++
        stats.lastUsed = new Date()
        
        if (success) {
          // 更新平均延迟
          stats.averageLatency = (stats.averageLatency * (stats.messagesRouted - 1) + latency) / stats.messagesRouted
        } else {
          stats.errors++
        }
      }
    }
    
    generateRouteId() {
      return `route_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
    }
    
    generateMessageId() {
      return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`
    }
    
    getRoutingStatistics() {
      const stats = {}
      
      this.routingStatistics.forEach((stat, routeId) => {
        const route = this.routes.get(routeId)
        stats[routeId] = {
          routeName: route?.name || 'Unknown',
          ...stat,
          successRate: stat.messagesRouted > 0 ? 
            (stat.messagesRouted - stat.errors) / stat.messagesRouted : 0
        }
      })
      
      return stats
    }
  }
  
  // 协议适配器管理
  registerProtocolAdapter(protocol, adapter) {
    this.protocolAdapters.set(protocol, adapter)
    console.log(`协议适配器注册: ${protocol}`)
  }
  
  // 启动ESB
  async start() {
    try {
      console.log('启动企业服务总线...')
      
      this.startTime = new Date()
      
      // 启动监控服务
      await this.monitoringService.start()
      
      // 启动安全管理器
      await this.securityManager.start()
      
      // 启动审计日志
      await this.auditLogger.start()
      
      this.status = 'running'
      
      console.log('企业服务总线启动完成')
      
    } catch (error) {
      console.error('ESB启动失败:', error)
      this.status = 'error'
      throw error
    }
  }
  
  // 停止ESB
  async stop() {
    try {
      console.log('停止企业服务总线...')
      
      // 停止监控服务
      await this.monitoringService.stop()
      
      // 停止安全管理器
      await this.securityManager.stop()
      
      // 停止审计日志
      await this.auditLogger.stop()
      
      this.status = 'stopped'
      
      console.log('企业服务总线停止完成')
      
    } catch (error) {
      console.error('ESB停止失败:', error)
      throw error
    }
  }
  
  // 处理消息
  async processMessage(message, options = {}) {
    const processingStartTime = Date.now()
    
    try {
      // 审计日志
      await this.auditLogger.logMessageReceived(message)
      
      // 安全检查
      await this.securityManager.validateMessage(message)
      
      // 消息路由
      const routingResult = await this.messageRouter.routeMessage(message, {
        serviceRegistry: this.serviceRegistry,
        transformationEngine: this.transformationEngine,
        ...options
      })
      
      // 监控记录
      await this.monitoringService.recordMessageProcessed(message, routingResult, processingStartTime)
      
      return routingResult
      
    } catch (error) {
      // 错误日志
      await this.auditLogger.logMessageError(message, error)
      
      // 监控记录
      await this.monitoringService.recordMessageError(message, error, processingStartTime)
      
      throw error
    }
  }
  
  // 获取ESB状态
  getStatus() {
    return {
      status: this.status,
      startTime: this.startTime,
      uptime: this.startTime ? Date.now() - this.startTime.getTime() : 0,
      services: this.serviceRegistry.getRegistryStatistics(),
      routing: this.messageRouter.getRoutingStatistics(),
      monitoring: this.monitoringService.getStatistics()
    }
  }
}

// 负载均衡器
class LoadBalancer {
  constructor(config = {}) {
    this.strategy = config.strategy || 'round_robin'
    this.healthCheckEnabled = config.healthCheckEnabled || false
    this.counters = new Map()
  }
  
  selectInstance(instances, strategy = null) {
    const activeStrategy = strategy || this.strategy
    
    if (instances.length === 0) {
      throw new Error('没有可用的服务实例')
    }
    
    if (instances.length === 1) {
      return instances[0]
    }
    
    switch (activeStrategy) {
      case 'round_robin':
        return this.roundRobinSelect(instances)
      case 'random':
        return this.randomSelect(instances)
      case 'least_connections':
        return this.leastConnectionsSelect(instances)
      case 'weighted':
        return this.weightedSelect(instances)
      default:
        return this.roundRobinSelect(instances)
    }
  }
  
  roundRobinSelect(instances) {
    const key = 'round_robin_counter'
    const counter = this.counters.get(key) || 0
    const selectedIndex = counter % instances.length
    
    this.counters.set(key, counter + 1)
    
    return instances[selectedIndex]
  }
  
  randomSelect(instances) {
    const randomIndex = Math.floor(Math.random() * instances.length)
    return instances[randomIndex]
  }
  
  leastConnectionsSelect(instances) {
    // 简化实现，选择连接数最少的实例
    return instances.reduce((least, current) => {
      const leastConnections = least.metadata?.connections || 0
      const currentConnections = current.metadata?.connections || 0
      
      return currentConnections < leastConnections ? current : least
    })
  }
  
  weightedSelect(instances) {
    const totalWeight = instances.reduce((sum, instance) => 
      sum + (instance.metadata?.weight || 1), 0)
    
    let random = Math.random() * totalWeight
    
    for (const instance of instances) {
      random -= (instance.metadata?.weight || 1)
      if (random <= 0) {
        return instance
      }
    }
    
    return instances[instances.length - 1]
  }
}

// 安全管理器
class SecurityManager {
  constructor() {
    this.authenticationProviders = new Map()
    this.authorizationPolicies = new Map()
    this.encryptionKeys = new Map()
    this.accessLog = []
  }
  
  async start() {
    console.log('安全管理器启动')
  }
  
  async stop() {
    console.log('安全管理器停止')
  }
  
  async validateMessage(message) {
    // 简化的安全验证
    if (message.headers && message.headers['X-Security-Token']) {
      return this.validateSecurityToken(message.headers['X-Security-Token'])
    }
    
    return true
  }
  
  async validateSecurityToken(token) {
    // JWT令牌验证逻辑
    console.log(`验证安全令牌: ${token.substring(0, 10)}...`)
    return true
  }
}

// 审计日志
class AuditLogger {
  constructor() {
    this.logs = []
    this.maxLogs = 10000
  }
  
  async start() {
    console.log('审计日志启动')
  }
  
  async stop() {
    console.log('审计日志停止')
  }
  
  async logMessageReceived(message) {
    this.addLog({
      type: 'message_received',
      messageId: message.id,
      source: message.source,
      timestamp: new Date()
    })
  }
  
  async logMessageError(message, error) {
    this.addLog({
      type: 'message_error',
      messageId: message.id,
      error: error.message,
      timestamp: new Date()
    })
  }
  
  addLog(logEntry) {
    this.logs.push(logEntry)
    
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs)
    }
  }
  
  getLogs(filter = {}) {
    return this.logs.filter(log => {
      if (filter.type && log.type !== filter.type) {
        return false
      }
      
      if (filter.since && log.timestamp < filter.since) {
        return false
      }
      
      return true
    })
  }
}

// 监控服务
class MonitoringService {
  constructor() {
    this.metrics = {
      messagesProcessed: 0,
      messagesErrored: 0,
      averageLatency: 0,
      peakLatency: 0,
      throughput: 0
    }
    this.startTime = null
  }
  
  async start() {
    this.startTime = new Date()
    console.log('监控服务启动')
  }
  
  async stop() {
    console.log('监控服务停止')
  }
  
  async recordMessageProcessed(message, result, startTime) {
    const latency = Date.now() - startTime
    
    this.metrics.messagesProcessed++
    this.metrics.averageLatency = 
      (this.metrics.averageLatency * (this.metrics.messagesProcessed - 1) + latency) / 
      this.metrics.messagesProcessed
    
    if (latency > this.metrics.peakLatency) {
      this.metrics.peakLatency = latency
    }
    
    this.updateThroughput()
  }
  
  async recordMessageError(message, error, startTime) {
    this.metrics.messagesErrored++
  }
  
  updateThroughput() {
    if (this.startTime) {
      const runtimeSeconds = (Date.now() - this.startTime.getTime()) / 1000
      this.metrics.throughput = this.metrics.messagesProcessed / runtimeSeconds
    }
  }
  
  getStatistics() {
    return {
      ...this.metrics,
      errorRate: this.metrics.messagesProcessed > 0 ? 
        this.metrics.messagesErrored / this.metrics.messagesProcessed : 0,
      uptime: this.startTime ? Date.now() - this.startTime.getTime() : 0
    }
  }
}
```

### 2. ESB应用示例

```javascript
// ESB实际应用示例
class ESBApplication {
  constructor() {
    this.esb = new EnterpriseServiceBus({
      name: 'Enterprise ESB',
      version: '1.0.0'
    })
    
    this.setupServices()
    this.setupRoutes()
  }
  
  async setupServices() {
    // 注册用户服务
    await this.esb.serviceRegistry.registerService({
      name: 'UserService',
      version: '1.0.0',
      description: '用户管理服务',
      endpoint: 'http://user-service:8080',
      protocols: ['http', 'https'],
      capabilities: ['user-management', 'authentication'],
      contract: {
        interface: 'REST',
        operations: [
          {
            name: 'createUser',
            method: 'POST',
            path: '/users',
            parameters: ['user'],
            returns: 'User'
          },
          {
            name: 'getUser',
            method: 'GET',
            path: '/users/{id}',
            parameters: ['id'],
            returns: 'User'
          }
        ],
        healthCheck: {
          type: 'http',
          path: '/health',
          interval: 30000,
          timeout: 5000
        },
        loadBalancing: {
          strategy: 'round_robin'
        }
      },
      metadata: {
        team: 'user-team',
        environment: 'production'
      }
    })
    
    // 注册订单服务
    await this.esb.serviceRegistry.registerService({
      name: 'OrderService',
      version: '2.0.0',
      description: '订单管理服务',
      endpoint: 'http://order-service:8081',
      protocols: ['http'],
      capabilities: ['order-management', 'payment'],
      contract: {
        interface: 'REST',
        operations: [
          {
            name: 'createOrder',
            method: 'POST',
            path: '/orders',
            parameters: ['order'],
            returns: 'Order'
          },
          {
            name: 'getOrder',
            method: 'GET',
            path: '/orders/{id}',
            parameters: ['id'],
            returns: 'Order'
          }
        ],
        healthCheck: {
          type: 'http',
          path: '/actuator/health',
          interval: 30000
        }
      }
    })
    
    // 注册通知服务
    await this.esb.serviceRegistry.registerService({
      name: 'NotificationService',
      version: '1.1.0',
      description: '消息通知服务',
      endpoint: 'http://notification-service:8082',
      protocols: ['http'],
      capabilities: ['email', 'sms', 'push'],
      contract: {
        interface: 'REST',
        operations: [
          {
            name: 'sendNotification',
            method: 'POST',
            path: '/notifications',
            parameters: ['notification'],
            returns: 'Result'
          }
        ],
        healthCheck: {
          type: 'http',
          path: '/health',
          interval: 30000
        }
      }
    })
  }
  
  async setupRoutes() {
    // 用户创建路由
    this.esb.messageRouter.addRoute({
      name: 'CreateUserRoute',
      source: 'api-gateway',
      conditions: [
        {
          type: 'header',
          header: 'X-Operation',
          operator: 'equals',
          value: 'create-user'
        },
        {
          type: 'content',
          field: 'action',
          operator: 'equals',
          value: 'create'
        }
      ],
      transformations: [
        {
          type: 'header-mapping',
          mappings: [
            { from: 'X-Request-ID', to: 'X-Correlation-ID' },
            { from: 'Authorization', to: 'X-Auth-Token' }
          ]
        },
        {
          type: 'content-transformation',
          rules: [
            { from: 'user_name', to: 'username' },
            { from: 'email_address', to: 'email' }
          ]
        }
      ],
      destination: {
        type: 'service',
        serviceName: 'UserService',
        path: '/users',
        timeout: 10000
      },
      priority: 10,
      enabled: true
    })
    
    // 订单创建路由（带通知）
    this.esb.messageRouter.addRoute({
      name: 'CreateOrderWithNotificationRoute',
      source: 'mobile-app',
      conditions: [
        {
          type: 'header',
          header: 'Content-Type',
          operator: 'equals',
          value: 'application/json'
        },
        {
          type: 'content',
          field: 'type',
          operator: 'equals',
          value: 'order'
        }
      ],
      transformations: [
        {
          type: 'enrichment',
          rules: [
            { field: 'timestamp', value: '${now}' },
            { field: 'source', value: 'mobile-app' }
          ]
        }
      ],
      destination: {
        type: 'service',
        serviceName: 'OrderService',
        path: '/orders'
      },
      postActions: [
        {
          type: 'route',
          destination: {
            type: 'service',
            serviceName: 'NotificationService',
            path: '/notifications'
          },
          condition: 'success',
          messageTransformation: {
            template: {
              type: 'order-confirmation',
              orderId: '${response.orderId}',
              customerEmail: '${request.customerEmail}',
              message: 'Your order has been created successfully'
            }
          }
        }
      ],
      priority: 15
    })
    
    // 错误处理路由
    this.esb.messageRouter.addRoute({
      name: 'ErrorHandlingRoute',
      source: '*',
      conditions: [
        {
          type: 'header',
          header: 'X-Error-Occurred',
          operator: 'exists'
        }
      ],
      destination: {
        type: 'queue',
        queueName: 'error-queue'
      },
      transformations: [
        {
          type: 'error-enrichment',
          rules: [
            { field: 'errorTimestamp', value: '${now}' },
            { field: 'errorSource', value: '${header.X-Error-Source}' }
          ]
        }
      ],
      priority: 5
    })
  }
  
  async start() {
    console.log('启动ESB应用程序...')
    
    try {
      // 启动ESB
      await this.esb.start()
      
      // 设置API端点
      await this.setupAPIEndpoints()
      
      console.log('ESB应用程序启动完成')
      
    } catch (error) {
      console.error('ESB应用程序启动失败:', error)
      throw error
    }
  }
  
  async setupAPIEndpoints() {
    const express = require('express')
    const app = express()
    
    app.use(express.json())
    
    // ESB状态端点
    app.get('/esb/status', (req, res) => {
      res.json(this.esb.getStatus())
    })
    
    // 服务发现端点
    app.get('/esb/services', (req, res) => {
      const services = this.esb.serviceRegistry.discoverServices(req.query)
      res.json(services)
    })
    
    // 消息处理端点
    app.post('/esb/message', async (req, res) => {
      try {
        const message = {
          id: req.headers['x-message-id'] || this.generateMessageId(),
          source: req.headers['x-source'] || 'unknown',
          headers: req.headers,
          body: req.body,
          timestamp: new Date()
        }
        
        const result = await this.esb.processMessage(message)
        
        res.json({
          success: true,
          messageId: message.id,
          routingResult: result
        })
        
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error.message
        })
      }
    })
    
    // 路由统计端点
    app.get('/esb/routing/statistics', (req, res) => {
      res.json(this.esb.messageRouter.getRoutingStatistics())
    })
    
    const port = process.env.ESB_PORT || 9000
    
    app.listen(port, () => {
      console.log(`ESB API服务启动在端口 ${port}`)
    })
  }
  
  generateMessageId() {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`
  }
  
  async stop() {
    console.log('停止ESB应用程序...')
    
    try {
      await this.esb.stop()
      console.log('ESB应用程序停止完成')
      
    } catch (error) {
      console.error('ESB应用程序停止失败:', error)
      throw error
    }
  }
}

// 使用示例
async function demonstrateESB() {
  console.log('=== ESB企业服务总线演示 ===')
  
  try {
    // 创建并启动ESB应用
    const esbApp = new ESBApplication()
    await esbApp.start()
    
    // 模拟处理消息
    const testMessage = {
      id: 'test-msg-001',
      source: 'api-gateway',
      headers: {
        'X-Operation': 'create-user',
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      },
      body: {
        action: 'create',
        user_name: 'john_doe',
        email_address: 'john@example.com',
        full_name: 'John Doe'
      },
      timestamp: new Date()
    }
    
    console.log('处理测试消息...')
    const result = await esbApp.esb.processMessage(testMessage)
    
    console.log('消息处理结果:', JSON.stringify(result, null, 2))
    
    // 获取ESB状态
    const status = esbApp.esb.getStatus()
    console.log('ESB状态:', JSON.stringify(status, null, 2))
    
    // 演示服务发现
    const userServices = esbApp.esb.serviceRegistry.getServicesByName('UserService')
    console.log('用户服务实例:', userServices.length)
    
    // 停止ESB
    await esbApp.stop()
    
  } catch (error) {
    console.error('ESB演示失败:', error)
  }
}

// 如果直接运行此文件
if (require.main === module) {
  demonstrateESB()
}

module.exports = {
  EnterpriseServiceBus,
  ESBApplication,
  LoadBalancer,
  SecurityManager,
  AuditLogger,
  MonitoringService
}
```

## 📚 最佳实践总结

1. **服务注册发现**：实现动态的服务注册和健康检查机制
2. **消息路由**：基于内容和上下文的智能路由策略
3. **协议适配**：支持多种通信协议的适配和转换
4. **安全控制**：端到端的安全认证和授权机制
5. **监控审计**：全面的监控、日志和审计功能
6. **错误处理**：完善的错误处理和恢复机制
7. **性能优化**：负载均衡和性能监控
8. **可扩展性**：支持水平扩展和高可用部署

通过掌握ESB技术，您将能够构建企业级的服务集成和通信基础设施。
