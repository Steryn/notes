# 结构型模式

## 📖 概述

结构型模式关注如何将类和对象组合成更大的结构。这些模式解释了如何组合对象和类以获得新功能，同时保持结构的灵活性和高效性。

## 🎯 学习目标

- 掌握七种结构型设计模式的实现
- 理解对象组合和类组合的差异
- 学习适配器模式解决接口不兼容问题
- 实现装饰器模式动态扩展功能

## 🔌 Adapter 适配器模式

### 1. 接口适配实现

```javascript
// 目标接口（期望的接口）
class ModernPaymentGateway {
  processPayment(amount, currency, cardInfo) {
    throw new Error('processPayment方法必须被实现')
  }
  
  refundPayment(transactionId, amount) {
    throw new Error('refundPayment方法必须被实现')
  }
  
  getTransactionStatus(transactionId) {
    throw new Error('getTransactionStatus方法必须被实现')
  }
}

// 被适配者（遗留系统）
class LegacyPaymentSystem {
  constructor() {
    this.transactions = new Map()
  }
  
  // 旧接口方法
  makePayment(data) {
    const transactionId = `legacy_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
    
    console.log(`遗留系统处理支付: ${data.total} ${data.currencyCode}`)
    
    this.transactions.set(transactionId, {
      id: transactionId,
      amount: data.total,
      currency: data.currencyCode,
      status: 'completed',
      timestamp: new Date(),
      cardLast4: data.card.number.slice(-4)
    })
    
    return {
      success: true,
      transactionRef: transactionId,
      message: 'Payment processed successfully'
    }
  }
  
  cancelPayment(transactionRef, refundAmount) {
    const transaction = this.transactions.get(transactionRef)
    
    if (!transaction) {
      return {
        success: false,
        message: 'Transaction not found'
      }
    }
    
    console.log(`遗留系统退款: ${refundAmount} ${transaction.currency}`)
    
    // 创建退款记录
    const refundId = `refund_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
    this.transactions.set(refundId, {
      id: refundId,
      originalTransaction: transactionRef,
      amount: refundAmount,
      currency: transaction.currency,
      status: 'refunded',
      timestamp: new Date(),
      type: 'refund'
    })
    
    return {
      success: true,
      refundRef: refundId,
      message: 'Refund processed successfully'
    }
  }
  
  checkStatus(transactionRef) {
    const transaction = this.transactions.get(transactionRef)
    
    if (!transaction) {
      return {
        found: false,
        message: 'Transaction not found'
      }
    }
    
    return {
      found: true,
      status: transaction.status,
      details: transaction
    }
  }
}

// 适配器实现
class PaymentAdapter extends ModernPaymentGateway {
  constructor(legacySystem) {
    super()
    this.legacySystem = legacySystem
  }
  
  // 适配processPayment方法
  async processPayment(amount, currency, cardInfo) {
    try {
      // 将现代接口参数转换为遗留系统格式
      const legacyData = {
        total: amount,
        currencyCode: currency,
        card: {
          number: cardInfo.number,
          expiry: cardInfo.expiryDate,
          cvv: cardInfo.cvv,
          holder: cardInfo.holderName
        }
      }
      
      const result = this.legacySystem.makePayment(legacyData)
      
      // 将遗留系统响应转换为现代格式
      return {
        success: result.success,
        transactionId: result.transactionRef,
        amount: amount,
        currency: currency,
        status: result.success ? 'completed' : 'failed',
        message: result.message,
        timestamp: new Date()
      }
      
    } catch (error) {
      console.error('支付适配器错误:', error)
      
      return {
        success: false,
        transactionId: null,
        amount: amount,
        currency: currency,
        status: 'failed',
        message: '支付处理失败',
        error: error.message,
        timestamp: new Date()
      }
    }
  }
  
  // 适配refundPayment方法
  async refundPayment(transactionId, amount) {
    try {
      const result = this.legacySystem.cancelPayment(transactionId, amount)
      
      return {
        success: result.success,
        refundId: result.refundRef,
        originalTransactionId: transactionId,
        refundAmount: amount,
        status: result.success ? 'refunded' : 'failed',
        message: result.message,
        timestamp: new Date()
      }
      
    } catch (error) {
      console.error('退款适配器错误:', error)
      
      return {
        success: false,
        refundId: null,
        originalTransactionId: transactionId,
        refundAmount: amount,
        status: 'failed',
        message: '退款处理失败',
        error: error.message,
        timestamp: new Date()
      }
    }
  }
  
  // 适配getTransactionStatus方法
  async getTransactionStatus(transactionId) {
    try {
      const result = this.legacySystem.checkStatus(transactionId)
      
      if (!result.found) {
        return {
          found: false,
          transactionId: transactionId,
          message: '交易未找到'
        }
      }
      
      return {
        found: true,
        transactionId: transactionId,
        status: result.status,
        amount: result.details.amount,
        currency: result.details.currency,
        timestamp: result.details.timestamp,
        details: result.details
      }
      
    } catch (error) {
      console.error('状态查询适配器错误:', error)
      
      return {
        found: false,
        transactionId: transactionId,
        message: '状态查询失败',
        error: error.message
      }
    }
  }
}

// 多个第三方服务适配器
class StripeAdapter extends ModernPaymentGateway {
  constructor(stripeClient) {
    super()
    this.stripe = stripeClient
  }
  
  async processPayment(amount, currency, cardInfo) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: amount * 100, // Stripe使用分为单位
        currency: currency.toLowerCase(),
        payment_method_data: {
          type: 'card',
          card: {
            number: cardInfo.number,
            exp_month: parseInt(cardInfo.expiryDate.split('/')[0]),
            exp_year: parseInt(cardInfo.expiryDate.split('/')[1]),
            cvc: cardInfo.cvv
          }
        },
        confirm: true
      })
      
      return {
        success: paymentIntent.status === 'succeeded',
        transactionId: paymentIntent.id,
        amount: amount,
        currency: currency,
        status: paymentIntent.status,
        message: 'Stripe payment processed',
        timestamp: new Date()
      }
      
    } catch (error) {
      return {
        success: false,
        transactionId: null,
        amount: amount,
        currency: currency,
        status: 'failed',
        message: error.message,
        timestamp: new Date()
      }
    }
  }
  
  async refundPayment(transactionId, amount) {
    try {
      const refund = await this.stripe.refunds.create({
        payment_intent: transactionId,
        amount: amount * 100
      })
      
      return {
        success: refund.status === 'succeeded',
        refundId: refund.id,
        originalTransactionId: transactionId,
        refundAmount: amount,
        status: refund.status,
        message: 'Stripe refund processed',
        timestamp: new Date()
      }
      
    } catch (error) {
      return {
        success: false,
        refundId: null,
        originalTransactionId: transactionId,
        refundAmount: amount,
        status: 'failed',
        message: error.message,
        timestamp: new Date()
      }
    }
  }
  
  async getTransactionStatus(transactionId) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(transactionId)
      
      return {
        found: true,
        transactionId: transactionId,
        status: paymentIntent.status,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency.toUpperCase(),
        timestamp: new Date(paymentIntent.created * 1000),
        details: paymentIntent
      }
      
    } catch (error) {
      return {
        found: false,
        transactionId: transactionId,
        message: error.message
      }
    }
  }
}

// 统一支付网关（支持多个适配器）
class UnifiedPaymentGateway {
  constructor() {
    this.adapters = new Map()
    this.defaultAdapter = null
    this.routingRules = []
  }
  
  registerAdapter(name, adapter) {
    if (!(adapter instanceof ModernPaymentGateway)) {
      throw new Error('适配器必须实现ModernPaymentGateway接口')
    }
    
    this.adapters.set(name, adapter)
    console.log(`注册支付适配器: ${name}`)
    
    if (!this.defaultAdapter) {
      this.defaultAdapter = name
    }
  }
  
  setDefaultAdapter(name) {
    if (!this.adapters.has(name)) {
      throw new Error(`适配器不存在: ${name}`)
    }
    
    this.defaultAdapter = name
    console.log(`设置默认适配器: ${name}`)
  }
  
  addRoutingRule(rule) {
    this.routingRules.push(rule)
    console.log(`添加路由规则: ${rule.name}`)
  }
  
  selectAdapter(amount, currency, cardInfo) {
    // 根据路由规则选择适配器
    for (const rule of this.routingRules) {
      if (rule.condition(amount, currency, cardInfo)) {
        console.log(`选择适配器: ${rule.adapter} (规则: ${rule.name})`)
        return rule.adapter
      }
    }
    
    console.log(`使用默认适配器: ${this.defaultAdapter}`)
    return this.defaultAdapter
  }
  
  async processPayment(amount, currency, cardInfo, preferredAdapter = null) {
    const adapterName = preferredAdapter || this.selectAdapter(amount, currency, cardInfo)
    const adapter = this.adapters.get(adapterName)
    
    if (!adapter) {
      throw new Error(`适配器不存在: ${adapterName}`)
    }
    
    console.log(`使用 ${adapterName} 处理支付`)
    
    try {
      const result = await adapter.processPayment(amount, currency, cardInfo)
      result.processor = adapterName
      return result
      
    } catch (error) {
      console.error(`支付处理失败 [${adapterName}]:`, error)
      
      // 故障转移到默认适配器
      if (adapterName !== this.defaultAdapter) {
        console.log(`故障转移到默认适配器: ${this.defaultAdapter}`)
        return this.processPayment(amount, currency, cardInfo, this.defaultAdapter)
      }
      
      throw error
    }
  }
  
  async refundPayment(transactionId, amount, processorHint = null) {
    let adapter
    
    if (processorHint && this.adapters.has(processorHint)) {
      adapter = this.adapters.get(processorHint)
    } else {
      // 如果没有处理器提示，尝试从交易ID推断
      adapter = this.adapters.get(this.defaultAdapter)
    }
    
    return await adapter.refundPayment(transactionId, amount)
  }
  
  async getTransactionStatus(transactionId, processorHint = null) {
    if (processorHint && this.adapters.has(processorHint)) {
      const adapter = this.adapters.get(processorHint)
      return await adapter.getTransactionStatus(transactionId)
    }
    
    // 查询所有适配器
    for (const [name, adapter] of this.adapters) {
      try {
        const result = await adapter.getTransactionStatus(transactionId)
        if (result.found) {
          result.processor = name
          return result
        }
      } catch (error) {
        console.warn(`适配器 ${name} 查询失败:`, error.message)
      }
    }
    
    return {
      found: false,
      transactionId: transactionId,
      message: '所有适配器都未找到该交易'
    }
  }
}
```

## 🎨 Decorator 装饰器模式

### 1. 功能装饰实现

```javascript
// 基础组件接口
class Component {
  execute(context) {
    throw new Error('execute方法必须被实现')
  }
  
  getDescription() {
    throw new Error('getDescription方法必须被实现')
  }
  
  getCost() {
    throw new Error('getCost方法必须被实现')
  }
}

// 具体组件
class HttpService extends Component {
  constructor(config = {}) {
    super()
    this.config = config
    this.name = 'HttpService'
  }
  
  execute(context) {
    console.log('执行HTTP服务请求')
    
    return {
      success: true,
      data: `HTTP响应数据: ${JSON.stringify(context.request)}`,
      timestamp: new Date(),
      service: this.name
    }
  }
  
  getDescription() {
    return '基础HTTP服务'
  }
  
  getCost() {
    return 1.0 // 基础成本
  }
}

// 装饰器基类
class ServiceDecorator extends Component {
  constructor(component) {
    super()
    this.component = component
  }
  
  execute(context) {
    return this.component.execute(context)
  }
  
  getDescription() {
    return this.component.getDescription()
  }
  
  getCost() {
    return this.component.getCost()
  }
}

// 具体装饰器：缓存装饰器
class CacheDecorator extends ServiceDecorator {
  constructor(component, cacheConfig = {}) {
    super(component)
    this.cache = new Map()
    this.ttl = cacheConfig.ttl || 60000 // 默认1分钟
    this.maxSize = cacheConfig.maxSize || 100
    this.hitCount = 0
    this.missCount = 0
  }
  
  execute(context) {
    const cacheKey = this.generateCacheKey(context)
    
    // 检查缓存
    const cached = this.cache.get(cacheKey)
    if (cached && this.isValid(cached)) {
      this.hitCount++
      console.log(`缓存命中: ${cacheKey}`)
      
      return {
        ...cached.data,
        fromCache: true,
        cacheHit: true
      }
    }
    
    this.missCount++
    console.log(`缓存未命中: ${cacheKey}`)
    
    // 执行原始请求
    const result = super.execute(context)
    
    // 存储到缓存
    this.storeInCache(cacheKey, result)
    
    return {
      ...result,
      fromCache: false,
      cacheHit: false
    }
  }
  
  generateCacheKey(context) {
    return JSON.stringify(context.request) + '_' + context.userId
  }
  
  isValid(cached) {
    return Date.now() - cached.timestamp < this.ttl
  }
  
  storeInCache(key, data) {
    // 检查缓存大小限制
    if (this.cache.size >= this.maxSize) {
      this.evictOldest()
    }
    
    this.cache.set(key, {
      data: data,
      timestamp: Date.now()
    })
  }
  
  evictOldest() {
    const oldestKey = this.cache.keys().next().value
    this.cache.delete(oldestKey)
    console.log(`缓存淘汰: ${oldestKey}`)
  }
  
  getDescription() {
    return `${super.getDescription()} + 缓存 (TTL: ${this.ttl}ms)`
  }
  
  getCost() {
    return super.getCost() + 0.2
  }
  
  getCacheStats() {
    const total = this.hitCount + this.missCount
    return {
      hitCount: this.hitCount,
      missCount: this.missCount,
      hitRate: total > 0 ? this.hitCount / total : 0,
      cacheSize: this.cache.size,
      maxSize: this.maxSize
    }
  }
}

// 具体装饰器：重试装饰器
class RetryDecorator extends ServiceDecorator {
  constructor(component, retryConfig = {}) {
    super(component)
    this.maxRetries = retryConfig.maxRetries || 3
    this.backoffStrategy = retryConfig.backoffStrategy || 'exponential'
    this.initialDelay = retryConfig.initialDelay || 1000
    this.retryOn = retryConfig.retryOn || ['error', 'timeout']
  }
  
  async execute(context) {
    let lastError
    
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`尝试执行 (${attempt + 1}/${this.maxRetries + 1})`)
        
        const result = await super.execute(context)
        
        // 检查是否需要重试
        if (this.shouldRetry(result, attempt)) {
          lastError = new Error(`结果需要重试: ${result.error || '未知错误'}`)
          await this.delay(attempt)
          continue
        }
        
        return {
          ...result,
          attemptCount: attempt + 1,
          retried: attempt > 0
        }
        
      } catch (error) {
        lastError = error
        console.error(`执行失败 (尝试 ${attempt + 1}):`, error.message)
        
        if (attempt < this.maxRetries && this.shouldRetryOnError(error)) {
          await this.delay(attempt)
          continue
        }
        
        break
      }
    }
    
    console.error('所有重试都失败了')
    throw lastError
  }
  
  shouldRetry(result, attempt) {
    if (attempt >= this.maxRetries) {
      return false
    }
    
    return !result.success && this.retryOn.includes('error')
  }
  
  shouldRetryOnError(error) {
    // 可以根据错误类型决定是否重试
    return true
  }
  
  async delay(attempt) {
    let delayMs
    
    switch (this.backoffStrategy) {
      case 'linear':
        delayMs = this.initialDelay * (attempt + 1)
        break
      case 'exponential':
        delayMs = this.initialDelay * Math.pow(2, attempt)
        break
      case 'fixed':
      default:
        delayMs = this.initialDelay
        break
    }
    
    console.log(`重试延迟: ${delayMs}ms`)
    return new Promise(resolve => setTimeout(resolve, delayMs))
  }
  
  getDescription() {
    return `${super.getDescription()} + 重试 (最大${this.maxRetries}次)`
  }
  
  getCost() {
    return super.getCost() + 0.1
  }
}

// 具体装饰器：限流装饰器
class RateLimitDecorator extends ServiceDecorator {
  constructor(component, limitConfig = {}) {
    super(component)
    this.maxRequests = limitConfig.maxRequests || 100
    this.windowMs = limitConfig.windowMs || 60000 // 1分钟窗口
    this.requests = new Map() // userId -> 请求记录
  }
  
  execute(context) {
    const userId = context.userId || 'anonymous'
    
    if (!this.checkRateLimit(userId)) {
      throw new Error(`用户 ${userId} 超出请求限制`)
    }
    
    this.recordRequest(userId)
    
    const result = super.execute(context)
    
    return {
      ...result,
      rateLimitApplied: true,
      remainingRequests: this.getRemainingRequests(userId)
    }
  }
  
  checkRateLimit(userId) {
    const userRequests = this.requests.get(userId)
    
    if (!userRequests) {
      return true
    }
    
    // 清理过期请求
    const now = Date.now()
    userRequests.requests = userRequests.requests.filter(
      timestamp => now - timestamp < this.windowMs
    )
    
    return userRequests.requests.length < this.maxRequests
  }
  
  recordRequest(userId) {
    if (!this.requests.has(userId)) {
      this.requests.set(userId, { requests: [] })
    }
    
    this.requests.get(userId).requests.push(Date.now())
  }
  
  getRemainingRequests(userId) {
    const userRequests = this.requests.get(userId)
    
    if (!userRequests) {
      return this.maxRequests
    }
    
    return Math.max(0, this.maxRequests - userRequests.requests.length)
  }
  
  getDescription() {
    return `${super.getDescription()} + 限流 (${this.maxRequests}/${this.windowMs}ms)`
  }
  
  getCost() {
    return super.getCost() + 0.05
  }
  
  getRateLimitStats() {
    const stats = {
      totalUsers: this.requests.size,
      userStats: []
    }
    
    this.requests.forEach((data, userId) => {
      stats.userStats.push({
        userId,
        currentRequests: data.requests.length,
        remainingRequests: this.getRemainingRequests(userId)
      })
    })
    
    return stats
  }
}

// 具体装饰器：日志装饰器
class LoggingDecorator extends ServiceDecorator {
  constructor(component, logConfig = {}) {
    super(component)
    this.logLevel = logConfig.logLevel || 'info'
    this.includeRequest = logConfig.includeRequest !== false
    this.includeResponse = logConfig.includeResponse !== false
    this.maskSensitiveData = logConfig.maskSensitiveData !== false
  }
  
  execute(context) {
    const startTime = Date.now()
    const requestId = this.generateRequestId()
    
    this.logRequest(requestId, context, startTime)
    
    try {
      const result = super.execute(context)
      const endTime = Date.now()
      
      this.logResponse(requestId, result, endTime - startTime)
      
      return {
        ...result,
        requestId,
        executionTime: endTime - startTime
      }
      
    } catch (error) {
      const endTime = Date.now()
      this.logError(requestId, error, endTime - startTime)
      throw error
    }
  }
  
  logRequest(requestId, context, timestamp) {
    if (this.includeRequest) {
      const logData = {
        requestId,
        timestamp: new Date(timestamp).toISOString(),
        type: 'request',
        service: this.component.constructor.name,
        context: this.maskSensitiveData ? this.maskData(context) : context
      }
      
      console.log(`[${this.logLevel.toUpperCase()}] Request:`, JSON.stringify(logData, null, 2))
    }
  }
  
  logResponse(requestId, result, duration) {
    if (this.includeResponse) {
      const logData = {
        requestId,
        timestamp: new Date().toISOString(),
        type: 'response',
        success: result.success,
        duration: `${duration}ms`,
        result: this.maskSensitiveData ? this.maskData(result) : result
      }
      
      console.log(`[${this.logLevel.toUpperCase()}] Response:`, JSON.stringify(logData, null, 2))
    }
  }
  
  logError(requestId, error, duration) {
    const logData = {
      requestId,
      timestamp: new Date().toISOString(),
      type: 'error',
      duration: `${duration}ms`,
      error: {
        message: error.message,
        stack: error.stack
      }
    }
    
    console.error('[ERROR] Error:', JSON.stringify(logData, null, 2))
  }
  
  maskData(data) {
    const masked = JSON.parse(JSON.stringify(data))
    const sensitiveFields = ['password', 'token', 'apiKey', 'secret']
    
    const maskRecursive = (obj) => {
      if (typeof obj !== 'object' || obj === null) {
        return obj
      }
      
      for (const key in obj) {
        if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
          obj[key] = '*'.repeat(8)
        } else if (typeof obj[key] === 'object') {
          maskRecursive(obj[key])
        }
      }
    }
    
    maskRecursive(masked)
    return masked
  }
  
  generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`
  }
  
  getDescription() {
    return `${super.getDescription()} + 日志记录`
  }
  
  getCost() {
    return super.getCost() + 0.01
  }
}

// 装饰器工厂
class ServiceDecoratorFactory {
  static createCachedService(component, cacheConfig) {
    return new CacheDecorator(component, cacheConfig)
  }
  
  static createRetryableService(component, retryConfig) {
    return new RetryDecorator(component, retryConfig)
  }
  
  static createRateLimitedService(component, limitConfig) {
    return new RateLimitDecorator(component, limitConfig)
  }
  
  static createLoggedService(component, logConfig) {
    return new LoggingDecorator(component, logConfig)
  }
  
  // 组合多个装饰器
  static createEnhancedService(component, decorators = []) {
    let enhanced = component
    
    decorators.forEach(decorator => {
      switch (decorator.type) {
        case 'cache':
          enhanced = new CacheDecorator(enhanced, decorator.config)
          break
        case 'retry':
          enhanced = new RetryDecorator(enhanced, decorator.config)
          break
        case 'rateLimit':
          enhanced = new RateLimitDecorator(enhanced, decorator.config)
          break
        case 'logging':
          enhanced = new LoggingDecorator(enhanced, decorator.config)
          break
        default:
          console.warn(`未知装饰器类型: ${decorator.type}`)
      }
    })
    
    return enhanced
  }
}
```

## 🏢 Facade 外观模式

### 1. 统一接口实现

```javascript
// 复杂子系统组件
class DatabaseManager {
  constructor() {
    this.connection = null
    this.transactionCount = 0
  }
  
  async connect(config) {
    console.log(`连接数据库: ${config.host}:${config.port}/${config.database}`)
    this.connection = {
      id: `db_${Date.now()}`,
      config: config,
      connected: true
    }
    return this.connection
  }
  
  async disconnect() {
    if (this.connection) {
      console.log(`断开数据库连接: ${this.connection.id}`)
      this.connection.connected = false
      this.connection = null
    }
  }
  
  async beginTransaction() {
    if (!this.connection) {
      throw new Error('数据库未连接')
    }
    
    const transactionId = `tx_${++this.transactionCount}_${Date.now()}`
    console.log(`开始事务: ${transactionId}`)
    
    return {
      id: transactionId,
      started: new Date(),
      operations: []
    }
  }
  
  async commitTransaction(transaction) {
    console.log(`提交事务: ${transaction.id}`)
    transaction.committed = new Date()
    return true
  }
  
  async rollbackTransaction(transaction) {
    console.log(`回滚事务: ${transaction.id}`)
    transaction.rolledBack = new Date()
    return true
  }
  
  async executeQuery(sql, params = []) {
    if (!this.connection) {
      throw new Error('数据库未连接')
    }
    
    console.log(`执行查询: ${sql}`)
    
    // 模拟查询结果
    return {
      rows: [{ id: 1, name: 'Sample Data' }],
      affectedRows: 1,
      executionTime: Math.random() * 100
    }
  }
}

class CacheManager {
  constructor() {
    this.cache = new Map()
    this.config = null
  }
  
  initialize(config) {
    this.config = config
    console.log(`初始化缓存: ${config.type}`)
  }
  
  async get(key) {
    const value = this.cache.get(key)
    console.log(`缓存获取: ${key} -> ${value ? '命中' : '未命中'}`)
    return value || null
  }
  
  async set(key, value, ttl = 3600) {
    this.cache.set(key, {
      value: value,
      expiry: Date.now() + (ttl * 1000)
    })
    console.log(`缓存设置: ${key}`)
  }
  
  async delete(key) {
    const deleted = this.cache.delete(key)
    console.log(`缓存删除: ${key} -> ${deleted ? '成功' : '失败'}`)
    return deleted
  }
  
  async flush() {
    this.cache.clear()
    console.log('缓存清空')
  }
  
  getStats() {
    return {
      size: this.cache.size,
      type: this.config?.type || 'memory'
    }
  }
}

class LoggingManager {
  constructor() {
    this.loggers = new Map()
    this.config = null
  }
  
  initialize(config) {
    this.config = config
    console.log(`初始化日志系统: ${config.level}`)
  }
  
  getLogger(name) {
    if (!this.loggers.has(name)) {
      this.loggers.set(name, {
        name: name,
        level: this.config?.level || 'info'
      })
    }
    return this.loggers.get(name)
  }
  
  log(level, message, meta = {}) {
    const timestamp = new Date().toISOString()
    console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`, meta)
  }
  
  info(message, meta) {
    this.log('info', message, meta)
  }
  
  error(message, meta) {
    this.log('error', message, meta)
  }
  
  warn(message, meta) {
    this.log('warn', message, meta)
  }
  
  debug(message, meta) {
    this.log('debug', message, meta)
  }
}

class SecurityManager {
  constructor() {
    this.policies = new Map()
    this.sessions = new Map()
  }
  
  initialize(config) {
    this.config = config
    console.log(`初始化安全管理器`)
  }
  
  authenticateUser(credentials) {
    console.log(`用户认证: ${credentials.username}`)
    
    // 模拟认证
    const user = {
      id: `user_${Date.now()}`,
      username: credentials.username,
      roles: ['user'],
      authenticated: true
    }
    
    return user
  }
  
  createSession(user) {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`
    const session = {
      id: sessionId,
      userId: user.id,
      created: new Date(),
      lastAccess: new Date(),
      active: true
    }
    
    this.sessions.set(sessionId, session)
    console.log(`创建会话: ${sessionId}`)
    
    return session
  }
  
  validateSession(sessionId) {
    const session = this.sessions.get(sessionId)
    
    if (!session || !session.active) {
      return null
    }
    
    session.lastAccess = new Date()
    return session
  }
  
  checkPermission(user, resource, action) {
    console.log(`权限检查: ${user.username} -> ${resource}:${action}`)
    
    // 模拟权限检查
    return user.roles.includes('admin') || action === 'read'
  }
  
  destroySession(sessionId) {
    const session = this.sessions.get(sessionId)
    if (session) {
      session.active = false
      console.log(`销毁会话: ${sessionId}`)
    }
  }
}

class NotificationManager {
  constructor() {
    this.channels = new Map()
    this.templates = new Map()
  }
  
  initialize(config) {
    this.config = config
    console.log('初始化通知管理器')
  }
  
  registerChannel(name, channel) {
    this.channels.set(name, channel)
    console.log(`注册通知渠道: ${name}`)
  }
  
  registerTemplate(name, template) {
    this.templates.set(name, template)
    console.log(`注册通知模板: ${name}`)
  }
  
  async sendNotification(channelName, templateName, data, recipients) {
    const channel = this.channels.get(channelName)
    const template = this.templates.get(templateName)
    
    if (!channel || !template) {
      throw new Error('通知渠道或模板不存在')
    }
    
    console.log(`发送通知: ${channelName}/${templateName} -> ${recipients.length} 个接收者`)
    
    // 模拟发送
    return {
      id: `notification_${Date.now()}`,
      channel: channelName,
      template: templateName,
      recipients: recipients.length,
      sent: new Date(),
      success: true
    }
  }
}

// 外观类
class ApplicationFacade {
  constructor() {
    this.database = new DatabaseManager()
    this.cache = new CacheManager()
    this.logging = new LoggingManager()
    this.security = new SecurityManager()
    this.notification = new NotificationManager()
    this.initialized = false
  }
  
  // 统一初始化
  async initialize(config) {
    console.log('初始化应用程序...')
    
    try {
      // 初始化各个子系统
      await this.database.connect(config.database)
      this.cache.initialize(config.cache)
      this.logging.initialize(config.logging)
      this.security.initialize(config.security)
      this.notification.initialize(config.notification)
      
      this.initialized = true
      console.log('应用程序初始化完成')
      
    } catch (error) {
      console.error('应用程序初始化失败:', error)
      throw error
    }
  }
  
  // 统一关闭
  async shutdown() {
    console.log('关闭应用程序...')
    
    try {
      await this.database.disconnect()
      await this.cache.flush()
      console.log('应用程序关闭完成')
      
    } catch (error) {
      console.error('应用程序关闭失败:', error)
    }
  }
  
  // 简化的用户操作接口
  async loginUser(credentials) {
    this.ensureInitialized()
    
    try {
      // 1. 用户认证
      const user = this.security.authenticateUser(credentials)
      
      if (!user.authenticated) {
        throw new Error('认证失败')
      }
      
      // 2. 创建会话
      const session = this.security.createSession(user)
      
      // 3. 记录日志
      this.logging.info('用户登录', {
        userId: user.id,
        username: user.username,
        sessionId: session.id
      })
      
      // 4. 缓存用户信息
      await this.cache.set(`user:${user.id}`, user, 3600)
      
      return {
        user,
        session,
        success: true
      }
      
    } catch (error) {
      this.logging.error('用户登录失败', {
        username: credentials.username,
        error: error.message
      })
      throw error
    }
  }
  
  async logoutUser(sessionId) {
    this.ensureInitialized()
    
    try {
      // 1. 验证会话
      const session = this.security.validateSession(sessionId)
      
      if (!session) {
        throw new Error('无效会话')
      }
      
      // 2. 销毁会话
      this.security.destroySession(sessionId)
      
      // 3. 清理缓存
      await this.cache.delete(`user:${session.userId}`)
      
      // 4. 记录日志
      this.logging.info('用户登出', {
        userId: session.userId,
        sessionId: sessionId
      })
      
      return { success: true }
      
    } catch (error) {
      this.logging.error('用户登出失败', {
        sessionId: sessionId,
        error: error.message
      })
      throw error
    }
  }
  
  // 简化的数据操作接口
  async saveData(entityType, data, sessionId) {
    this.ensureInitialized()
    
    // 1. 验证会话
    const session = this.security.validateSession(sessionId)
    if (!session) {
      throw new Error('未授权')
    }
    
    // 2. 获取用户信息
    let user = await this.cache.get(`user:${session.userId}`)
    if (!user) {
      throw new Error('用户信息不存在')
    }
    
    // 3. 权限检查
    if (!this.security.checkPermission(user, entityType, 'write')) {
      throw new Error('权限不足')
    }
    
    const transaction = await this.database.beginTransaction()
    
    try {
      // 4. 保存数据
      const sql = `INSERT INTO ${entityType} (data, user_id) VALUES (?, ?)`
      const result = await this.database.executeQuery(sql, [JSON.stringify(data), user.id])
      
      await this.database.commitTransaction(transaction)
      
      // 5. 清理相关缓存
      await this.cache.delete(`${entityType}:list`)
      
      // 6. 记录日志
      this.logging.info('数据保存', {
        entityType,
        userId: user.id,
        dataId: result.insertId
      })
      
      return {
        success: true,
        id: result.insertId,
        data: data
      }
      
    } catch (error) {
      await this.database.rollbackTransaction(transaction)
      
      this.logging.error('数据保存失败', {
        entityType,
        userId: user.id,
        error: error.message
      })
      
      throw error
    }
  }
  
  async getData(entityType, id, sessionId) {
    this.ensureInitialized()
    
    // 1. 验证会话
    const session = this.security.validateSession(sessionId)
    if (!session) {
      throw new Error('未授权')
    }
    
    // 2. 检查缓存
    const cacheKey = `${entityType}:${id}`
    let data = await this.cache.get(cacheKey)
    
    if (data) {
      this.logging.debug('缓存命中', { entityType, id })
      return data
    }
    
    // 3. 从数据库查询
    const sql = `SELECT * FROM ${entityType} WHERE id = ?`
    const result = await this.database.executeQuery(sql, [id])
    
    if (result.rows.length === 0) {
      return null
    }
    
    data = result.rows[0]
    
    // 4. 存入缓存
    await this.cache.set(cacheKey, data, 1800)
    
    // 5. 记录日志
    this.logging.debug('数据查询', { entityType, id })
    
    return data
  }
  
  // 简化的通知接口
  async sendUserNotification(userId, type, message, data = {}) {
    this.ensureInitialized()
    
    try {
      const result = await this.notification.sendNotification(
        'email',
        type,
        { message, ...data },
        [userId]
      )
      
      this.logging.info('通知发送', {
        userId,
        type,
        notificationId: result.id
      })
      
      return result
      
    } catch (error) {
      this.logging.error('通知发送失败', {
        userId,
        type,
        error: error.message
      })
      throw error
    }
  }
  
  // 健康检查接口
  async healthCheck() {
    const health = {
      status: 'healthy',
      timestamp: new Date(),
      services: {}
    }
    
    try {
      // 检查数据库
      health.services.database = {
        status: this.database.connection ? 'connected' : 'disconnected'
      }
      
      // 检查缓存
      health.services.cache = {
        status: 'active',
        stats: this.cache.getStats()
      }
      
      // 检查各个服务
      health.services.security = { status: 'active' }
      health.services.notification = { status: 'active' }
      health.services.logging = { status: 'active' }
      
    } catch (error) {
      health.status = 'unhealthy'
      health.error = error.message
    }
    
    return health
  }
  
  ensureInitialized() {
    if (!this.initialized) {
      throw new Error('应用程序未初始化')
    }
  }
}
```

## 📚 最佳实践总结

1. **适配器模式**：解决接口不兼容问题，支持遗留系统集成
2. **装饰器模式**：动态扩展功能，遵循开闭原则
3. **外观模式**：简化复杂子系统接口，提供统一入口
4. **组合模式**：统一处理单个对象和组合对象
5. **桥接模式**：分离抽象和实现，支持多维度变化
6. **代理模式**：控制对象访问，实现延迟加载和权限控制
7. **享元模式**：通过共享减少内存使用
8. **接口隔离**：确保客户端只依赖需要的接口

通过掌握结构型模式，您将能够设计出更加灵活和可扩展的系统架构。
