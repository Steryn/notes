# 负载均衡

## 📖 概述

负载均衡（Load Balancing）是一种在多个服务器之间分配网络流量的技术，确保没有单一服务器承担过多负载。它是构建高可用、高性能分布式系统的核心技术。

## 🎯 学习目标

- 理解负载均衡的核心概念和算法
- 掌握不同层级的负载均衡技术
- 学习健康检查和故障转移机制
- 实现智能的负载均衡管理系统

## ⚖️ 负载均衡架构

### 1. 负载均衡器框架

```javascript
// 负载均衡器核心框架
class LoadBalancerFramework {
  constructor(config = {}) {
    this.config = config
    this.algorithms = new Map()
    this.backends = new Map()
    this.healthCheckers = new Map()
    this.trafficRouter = new TrafficRouter()
    this.sessionManager = new SessionManager()
    this.statisticsCollector = new StatisticsCollector()
    this.circuitBreaker = new CircuitBreaker()
    
    // 注册内置算法
    this.registerBuiltinAlgorithms()
  }
  
  // 后端服务器管理
  class Backend {
    constructor(config) {
      this.id = config.id || this.generateId()
      this.name = config.name
      this.host = config.host
      this.port = config.port
      this.weight = config.weight || 1
      this.maxConnections = config.maxConnections || 1000
      this.protocol = config.protocol || 'http'
      this.ssl = config.ssl || false
      this.backup = config.backup || false
      
      // 状态信息
      this.status = 'unknown' // 'healthy', 'unhealthy', 'unknown', 'maintenance'
      this.currentConnections = 0
      this.totalRequests = 0
      this.totalErrors = 0
      this.lastHealthCheck = null
      this.responseTime = 0
      this.lastError = null
      
      // 统计信息
      this.statistics = {
        requestsPerSecond: 0,
        averageResponseTime: 0,
        errorRate: 0,
        uptime: 0,
        lastRestart: new Date()
      }
      
      this.created = new Date()
    }
    
    getEndpoint() {
      const protocol = this.ssl ? 'https' : this.protocol
      return `${protocol}://${this.host}:${this.port}`
    }
    
    isAvailable() {
      return this.status === 'healthy' && 
             this.currentConnections < this.maxConnections
    }
    
    incrementConnections() {
      this.currentConnections++
    }
    
    decrementConnections() {
      this.currentConnections = Math.max(0, this.currentConnections - 1)
    }
    
    recordRequest(responseTime, isError = false) {
      this.totalRequests++
      
      if (isError) {
        this.totalErrors++
      }
      
      // 更新平均响应时间
      this.responseTime = (this.responseTime + responseTime) / 2
      
      // 更新统计信息
      this.updateStatistics()
    }
    
    updateStatistics() {
      const now = Date.now()
      const uptime = now - this.statistics.lastRestart.getTime()
      
      this.statistics.uptime = uptime
      this.statistics.averageResponseTime = this.responseTime
      this.statistics.errorRate = this.totalRequests > 0 ? 
        (this.totalErrors / this.totalRequests) * 100 : 0
    }
    
    generateId() {
      return `backend_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
    }
    
    getInfo() {
      return {
        id: this.id,
        name: this.name,
        endpoint: this.getEndpoint(),
        status: this.status,
        weight: this.weight,
        currentConnections: this.currentConnections,
        maxConnections: this.maxConnections,
        totalRequests: this.totalRequests,
        totalErrors: this.totalErrors,
        responseTime: this.responseTime,
        statistics: this.statistics,
        backup: this.backup,
        lastHealthCheck: this.lastHealthCheck
      }
    }
  }
  
  // 负载均衡算法
  class LoadBalancingAlgorithm {
    constructor(name) {
      this.name = name
    }
    
    select(backends, request = null) {
      throw new Error('select方法必须被实现')
    }
    
    filterAvailableBackends(backends) {
      return backends.filter(backend => backend.isAvailable())
    }
  }
  
  // 轮询算法
  class RoundRobinAlgorithm extends LoadBalancingAlgorithm {
    constructor() {
      super('round_robin')
      this.currentIndex = 0
    }
    
    select(backends, request) {
      const available = this.filterAvailableBackends(backends)
      
      if (available.length === 0) {
        return null
      }
      
      const selected = available[this.currentIndex % available.length]
      this.currentIndex = (this.currentIndex + 1) % available.length
      
      return selected
    }
  }
  
  // 加权轮询算法
  class WeightedRoundRobinAlgorithm extends LoadBalancingAlgorithm {
    constructor() {
      super('weighted_round_robin')
      this.weightedList = []
      this.currentIndex = 0
    }
    
    select(backends, request) {
      const available = this.filterAvailableBackends(backends)
      
      if (available.length === 0) {
        return null
      }
      
      // 重建加权列表
      this.buildWeightedList(available)
      
      if (this.weightedList.length === 0) {
        return available[0]
      }
      
      const selected = this.weightedList[this.currentIndex % this.weightedList.length]
      this.currentIndex = (this.currentIndex + 1) % this.weightedList.length
      
      return selected
    }
    
    buildWeightedList(backends) {
      this.weightedList = []
      
      backends.forEach(backend => {
        for (let i = 0; i < backend.weight; i++) {
          this.weightedList.push(backend)
        }
      })
    }
  }
  
  // 最少连接算法
  class LeastConnectionsAlgorithm extends LoadBalancingAlgorithm {
    constructor() {
      super('least_connections')
    }
    
    select(backends, request) {
      const available = this.filterAvailableBackends(backends)
      
      if (available.length === 0) {
        return null
      }
      
      return available.reduce((min, backend) => {
        if (!min) return backend
        
        const minRatio = min.currentConnections / min.weight
        const backendRatio = backend.currentConnections / backend.weight
        
        return backendRatio < minRatio ? backend : min
      }, null)
    }
  }
  
  // 加权响应时间算法
  class WeightedResponseTimeAlgorithm extends LoadBalancingAlgorithm {
    constructor() {
      super('weighted_response_time')
    }
    
    select(backends, request) {
      const available = this.filterAvailableBackends(backends)
      
      if (available.length === 0) {
        return null
      }
      
      // 计算每个后端的得分（权重/响应时间）
      const scored = available.map(backend => ({
        backend,
        score: backend.weight / Math.max(backend.responseTime, 1)
      }))
      
      // 选择得分最高的后端
      return scored.reduce((best, current) => 
        current.score > best.score ? current : best
      ).backend
    }
  }
  
  // IP哈希算法
  class IPHashAlgorithm extends LoadBalancingAlgorithm {
    constructor() {
      super('ip_hash')
    }
    
    select(backends, request) {
      const available = this.filterAvailableBackends(backends)
      
      if (available.length === 0) {
        return null
      }
      
      if (!request || !request.clientIP) {
        // 如果没有客户端IP，退回到轮询
        return available[0]
      }
      
      const hash = this.hashIP(request.clientIP)
      const index = hash % available.length
      
      return available[index]
    }
    
    hashIP(ip) {
      let hash = 0
      for (let i = 0; i < ip.length; i++) {
        const char = ip.charCodeAt(i)
        hash = ((hash << 5) - hash) + char
        hash = hash & hash // 转换为32位整数
      }
      return Math.abs(hash)
    }
  }
  
  // 一致性哈希算法
  class ConsistentHashAlgorithm extends LoadBalancingAlgorithm {
    constructor() {
      super('consistent_hash')
      this.ring = new Map()
      this.virtualNodes = 150 // 每个后端的虚拟节点数
      this.sortedKeys = []
    }
    
    select(backends, request) {
      const available = this.filterAvailableBackends(backends)
      
      if (available.length === 0) {
        return null
      }
      
      // 重建哈希环
      this.buildHashRing(available)
      
      if (!request || !request.sessionId) {
        return available[0]
      }
      
      const hash = this.hashString(request.sessionId)
      return this.findBackend(hash)
    }
    
    buildHashRing(backends) {
      this.ring.clear()
      this.sortedKeys = []
      
      backends.forEach(backend => {
        for (let i = 0; i < this.virtualNodes; i++) {
          const virtualKey = `${backend.id}:${i}`
          const hash = this.hashString(virtualKey)
          this.ring.set(hash, backend)
          this.sortedKeys.push(hash)
        }
      })
      
      this.sortedKeys.sort((a, b) => a - b)
    }
    
    findBackend(hash) {
      if (this.sortedKeys.length === 0) {
        return null
      }
      
      // 找到第一个大于等于hash的key
      let index = this.sortedKeys.findIndex(key => key >= hash)
      
      // 如果没有找到，使用第一个key（环形结构）
      if (index === -1) {
        index = 0
      }
      
      const key = this.sortedKeys[index]
      return this.ring.get(key)
    }
    
    hashString(str) {
      let hash = 0
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i)
        hash = ((hash << 5) - hash) + char
        hash = hash & hash
      }
      return Math.abs(hash)
    }
  }
  
  // 健康检查器
  class HealthChecker {
    constructor(config = {}) {
      this.interval = config.interval || 30000 // 30秒
      this.timeout = config.timeout || 5000   // 5秒
      this.retries = config.retries || 3
      this.checkPath = config.checkPath || '/health'
      this.expectedStatus = config.expectedStatus || 200
      this.isRunning = false
      this.checkTimer = null
    }
    
    start(backends) {
      if (this.isRunning) {
        return
      }
      
      this.isRunning = true
      this.backends = backends
      
      console.log('开始健康检查')
      
      // 立即执行一次检查
      this.performHealthCheck()
      
      // 设置定期检查
      this.checkTimer = setInterval(() => {
        this.performHealthCheck()
      }, this.interval)
    }
    
    stop() {
      if (!this.isRunning) {
        return
      }
      
      this.isRunning = false
      
      if (this.checkTimer) {
        clearInterval(this.checkTimer)
        this.checkTimer = null
      }
      
      console.log('停止健康检查')
    }
    
    async performHealthCheck() {
      if (!this.backends) {
        return
      }
      
      const checkPromises = Array.from(this.backends.values()).map(backend => 
        this.checkBackend(backend)
      )
      
      await Promise.allSettled(checkPromises)
    }
    
    async checkBackend(backend) {
      const startTime = Date.now()
      
      try {
        const isHealthy = await this.executeHealthCheck(backend)
        const responseTime = Date.now() - startTime
        
        const previousStatus = backend.status
        backend.status = isHealthy ? 'healthy' : 'unhealthy'
        backend.lastHealthCheck = new Date()
        backend.responseTime = responseTime
        
        if (previousStatus !== backend.status) {
          console.log(`后端状态变化: ${backend.name} ${previousStatus} -> ${backend.status}`)
        }
        
      } catch (error) {
        backend.status = 'unhealthy'
        backend.lastHealthCheck = new Date()
        backend.lastError = error.message
        
        console.error(`健康检查失败: ${backend.name}`, error.message)
      }
    }
    
    async executeHealthCheck(backend) {
      const axios = require('axios')
      
      const url = `${backend.getEndpoint()}${this.checkPath}`
      
      try {
        const response = await axios.get(url, {
          timeout: this.timeout,
          validateStatus: (status) => status === this.expectedStatus
        })
        
        return response.status === this.expectedStatus
        
      } catch (error) {
        if (error.code === 'ECONNRESET' || error.code === 'ECONNREFUSED') {
          return false
        }
        throw error
      }
    }
  }
  
  // 流量路由器
  class TrafficRouter {
    constructor() {
      this.rules = []
      this.defaultAlgorithm = 'round_robin'
    }
    
    addRoutingRule(rule) {
      this.rules.push({
        id: this.generateRuleId(),
        ...rule,
        created: new Date()
      })
      
      // 按优先级排序
      this.rules.sort((a, b) => (b.priority || 0) - (a.priority || 0))
      
      console.log(`添加路由规则: ${rule.name}`)
    }
    
    route(request, backends, algorithms) {
      // 查找匹配的路由规则
      const matchedRule = this.findMatchingRule(request)
      
      if (matchedRule) {
        console.log(`应用路由规则: ${matchedRule.name}`)
        
        // 过滤后端
        const filteredBackends = this.filterBackends(backends, matchedRule.backendFilter)
        
        // 选择算法
        const algorithmName = matchedRule.algorithm || this.defaultAlgorithm
        const algorithm = algorithms.get(algorithmName)
        
        if (algorithm && filteredBackends.length > 0) {
          return algorithm.select(filteredBackends, request)
        }
      }
      
      // 使用默认算法
      const defaultAlgorithm = algorithms.get(this.defaultAlgorithm)
      return defaultAlgorithm ? defaultAlgorithm.select(Array.from(backends.values()), request) : null
    }
    
    findMatchingRule(request) {
      for (const rule of this.rules) {
        if (this.evaluateConditions(request, rule.conditions)) {
          return rule
        }
      }
      return null
    }
    
    evaluateConditions(request, conditions) {
      if (!conditions || conditions.length === 0) {
        return true
      }
      
      return conditions.every(condition => this.evaluateCondition(request, condition))
    }
    
    evaluateCondition(request, condition) {
      switch (condition.type) {
        case 'path':
          return this.matchPath(request.path, condition.pattern)
        case 'header':
          return this.matchHeader(request.headers, condition.header, condition.value)
        case 'query':
          return this.matchQuery(request.query, condition.parameter, condition.value)
        case 'client_ip':
          return this.matchClientIP(request.clientIP, condition.cidr)
        default:
          return false
      }
    }
    
    matchPath(path, pattern) {
      if (pattern.includes('*')) {
        const regex = new RegExp(pattern.replace(/\*/g, '.*'))
        return regex.test(path)
      }
      return path === pattern
    }
    
    matchHeader(headers, headerName, expectedValue) {
      const actualValue = headers[headerName.toLowerCase()]
      return actualValue === expectedValue
    }
    
    matchQuery(query, parameter, expectedValue) {
      return query[parameter] === expectedValue
    }
    
    matchClientIP(clientIP, cidr) {
      // 简化的CIDR匹配
      if (!cidr.includes('/')) {
        return clientIP === cidr
      }
      
      // 这里需要实现更复杂的CIDR匹配逻辑
      return false
    }
    
    filterBackends(backends, filter) {
      if (!filter) {
        return Array.from(backends.values())
      }
      
      return Array.from(backends.values()).filter(backend => {
        if (filter.tags) {
          return filter.tags.every(tag => backend.tags && backend.tags.includes(tag))
        }
        
        if (filter.region) {
          return backend.region === filter.region
        }
        
        if (filter.exclude_backup !== undefined) {
          return backend.backup !== filter.exclude_backup
        }
        
        return true
      })
    }
    
    generateRuleId() {
      return `rule_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
    }
  }
  
  // 注册内置算法
  registerBuiltinAlgorithms() {
    this.algorithms.set('round_robin', new RoundRobinAlgorithm())
    this.algorithms.set('weighted_round_robin', new WeightedRoundRobinAlgorithm())
    this.algorithms.set('least_connections', new LeastConnectionsAlgorithm())
    this.algorithms.set('weighted_response_time', new WeightedResponseTimeAlgorithm())
    this.algorithms.set('ip_hash', new IPHashAlgorithm())
    this.algorithms.set('consistent_hash', new ConsistentHashAlgorithm())
  }
  
  // 添加后端服务器
  addBackend(config) {
    const backend = new this.Backend(config)
    this.backends.set(backend.id, backend)
    
    console.log(`添加后端服务器: ${backend.name} (${backend.getEndpoint()})`)
    
    return backend
  }
  
  // 移除后端服务器
  removeBackend(backendId) {
    const backend = this.backends.get(backendId)
    
    if (backend) {
      this.backends.delete(backendId)
      console.log(`移除后端服务器: ${backend.name}`)
      return true
    }
    
    return false
  }
  
  // 选择后端服务器
  selectBackend(request, algorithmName = 'round_robin') {
    const algorithm = this.algorithms.get(algorithmName)
    
    if (!algorithm) {
      throw new Error(`负载均衡算法不存在: ${algorithmName}`)
    }
    
    // 通过流量路由器选择后端
    const selected = this.trafficRouter.route(request, this.backends, this.algorithms)
    
    if (selected) {
      selected.incrementConnections()
      console.log(`选择后端: ${selected.name} (当前连接: ${selected.currentConnections})`)
    }
    
    return selected
  }
  
  // 处理请求完成
  handleRequestComplete(backend, responseTime, isError = false) {
    if (backend) {
      backend.decrementConnections()
      backend.recordRequest(responseTime, isError)
      
      // 更新统计信息
      this.statisticsCollector.recordRequest(backend.id, responseTime, isError)
    }
  }
  
  // 启动负载均衡器
  start() {
    console.log('启动负载均衡器')
    
    // 启动健康检查
    const healthChecker = new this.HealthChecker()
    healthChecker.start(this.backends)
    this.healthCheckers.set('default', healthChecker)
    
    // 启动统计收集
    this.statisticsCollector.start()
  }
  
  // 停止负载均衡器
  stop() {
    console.log('停止负载均衡器')
    
    // 停止健康检查
    this.healthCheckers.forEach(checker => checker.stop())
    this.healthCheckers.clear()
    
    // 停止统计收集
    this.statisticsCollector.stop()
  }
  
  // 获取负载均衡器状态
  getStatus() {
    const backends = Array.from(this.backends.values()).map(backend => backend.getInfo())
    
    const healthyBackends = backends.filter(b => b.status === 'healthy').length
    const totalBackends = backends.length
    
    return {
      status: healthyBackends > 0 ? 'healthy' : 'unhealthy',
      totalBackends,
      healthyBackends,
      algorithms: Array.from(this.algorithms.keys()),
      routingRules: this.trafficRouter.rules.length,
      backends,
      statistics: this.statisticsCollector.getStatistics()
    }
  }
}

// 统计收集器
class StatisticsCollector {
  constructor() {
    this.stats = new Map()
    this.globalStats = {
      totalRequests: 0,
      totalErrors: 0,
      averageResponseTime: 0,
      requestsPerSecond: 0
    }
    this.isRunning = false
  }
  
  start() {
    this.isRunning = true
    
    // 定期更新统计信息
    this.statsTimer = setInterval(() => {
      this.updateGlobalStats()
    }, 10000) // 每10秒更新一次
  }
  
  stop() {
    this.isRunning = false
    
    if (this.statsTimer) {
      clearInterval(this.statsTimer)
      this.statsTimer = null
    }
  }
  
  recordRequest(backendId, responseTime, isError) {
    if (!this.stats.has(backendId)) {
      this.stats.set(backendId, {
        requests: 0,
        errors: 0,
        totalResponseTime: 0,
        averageResponseTime: 0,
        lastRequest: null
      })
    }
    
    const backendStats = this.stats.get(backendId)
    backendStats.requests++
    backendStats.totalResponseTime += responseTime
    backendStats.averageResponseTime = backendStats.totalResponseTime / backendStats.requests
    backendStats.lastRequest = new Date()
    
    if (isError) {
      backendStats.errors++
    }
    
    // 更新全局统计
    this.globalStats.totalRequests++
    if (isError) {
      this.globalStats.totalErrors++
    }
  }
  
  updateGlobalStats() {
    const now = Date.now()
    const windowSize = 60000 // 1分钟窗口
    
    // 这里可以实现更复杂的时间窗口统计
    console.log('更新全局统计信息')
  }
  
  getStatistics() {
    return {
      global: this.globalStats,
      backends: Object.fromEntries(this.stats)
    }
  }
}

// 使用示例
async function demonstrateLoadBalancing() {
  console.log('=== 负载均衡演示 ===')
  
  const loadBalancer = new LoadBalancerFramework()
  
  // 添加后端服务器
  const backend1 = loadBalancer.addBackend({
    name: 'web-server-1',
    host: '192.168.1.10',
    port: 3000,
    weight: 3,
    tags: ['web', 'primary']
  })
  
  const backend2 = loadBalancer.addBackend({
    name: 'web-server-2',
    host: '192.168.1.11',
    port: 3000,
    weight: 2,
    tags: ['web', 'secondary']
  })
  
  const backend3 = loadBalancer.addBackend({
    name: 'web-server-3',
    host: '192.168.1.12',
    port: 3000,
    weight: 1,
    backup: true,
    tags: ['web', 'backup']
  })
  
  // 添加路由规则
  loadBalancer.trafficRouter.addRoutingRule({
    name: 'API路由',
    priority: 10,
    conditions: [
      { type: 'path', pattern: '/api/*' }
    ],
    algorithm: 'least_connections',
    backendFilter: {
      exclude_backup: true
    }
  })
  
  loadBalancer.trafficRouter.addRoutingRule({
    name: '静态资源路由',
    priority: 5,
    conditions: [
      { type: 'path', pattern: '/static/*' }
    ],
    algorithm: 'ip_hash'
  })
  
  // 启动负载均衡器
  loadBalancer.start()
  
  // 模拟请求
  console.log('模拟请求处理...')
  
  const requests = [
    { path: '/api/users', clientIP: '192.168.1.100', headers: {} },
    { path: '/api/orders', clientIP: '192.168.1.101', headers: {} },
    { path: '/static/css/main.css', clientIP: '192.168.1.100', headers: {} },
    { path: '/api/products', clientIP: '192.168.1.102', headers: {} },
    { path: '/static/js/app.js', clientIP: '192.168.1.101', headers: {} }
  ]
  
  for (const request of requests) {
    const selected = loadBalancer.selectBackend(request)
    
    if (selected) {
      console.log(`请求 ${request.path} -> ${selected.name}`)
      
      // 模拟请求处理时间
      const responseTime = Math.random() * 200 + 50
      const isError = Math.random() < 0.1 // 10%错误率
      
      // 模拟请求完成
      setTimeout(() => {
        loadBalancer.handleRequestComplete(selected, responseTime, isError)
      }, responseTime)
    } else {
      console.log(`请求 ${request.path} -> 无可用后端`)
    }
  }
  
  // 等待一段时间后检查状态
  setTimeout(() => {
    const status = loadBalancer.getStatus()
    console.log('负载均衡器状态:', status)
  }, 3000)
  
  return loadBalancer
}

module.exports = {
  LoadBalancerFramework
}
```

## 📚 最佳实践总结

1. **算法选择**：根据应用特性选择合适的负载均衡算法
2. **健康检查**：实施全面的健康检查和故障检测机制
3. **会话保持**：处理有状态应用的会话一致性需求
4. **故障转移**：快速检测和处理后端服务器故障
5. **性能监控**：持续监控负载分布和性能指标
6. **动态配置**：支持运行时动态添加和移除后端服务器
7. **流量控制**：实施请求限流和熔断机制
8. **多层负载均衡**：结合DNS、硬件和软件负载均衡

通过掌握负载均衡技术，您将能够构建高可用和高性能的分布式系统架构。
