# 集成基础

## 📖 概述

企业应用集成（EAI）是连接不同系统、应用程序和数据源的过程。通过有效的集成策略，企业可以实现数据共享、流程自动化和系统互操作，从而提高业务效率和响应能力。

## 🎯 学习目标

- 理解企业集成的核心概念和模式
- 掌握同步和异步集成方式
- 学习消息传递和数据转换技术
- 实现可靠的集成中间件系统

## 🏗️ 集成架构基础

### 1. 集成模式框架

```javascript
// 集成模式基础框架
class IntegrationFramework {
  constructor() {
    this.endpoints = new Map()
    this.transformers = new Map()
    this.routers = new Map()
    this.filters = new Map()
    this.channels = new Map()
    this.messageStore = new MessageStore()
    this.errorHandler = new ErrorHandler()
  }
  
  // 端点管理
  class Endpoint {
    constructor(config) {
      this.id = config.id
      this.name = config.name
      this.type = config.type // 'inbound', 'outbound', 'bidirectional'
      this.protocol = config.protocol // 'http', 'tcp', 'file', 'database'
      this.address = config.address
      this.configuration = config.configuration || {}
      this.status = 'stopped'
      this.statistics = {
        messagesReceived: 0,
        messagesSent: 0,
        errors: 0,
        lastActivity: null
      }
    }
    
    async start() {
      try {
        console.log(`启动端点: ${this.name} (${this.protocol})`)
        
        await this.initialize()
        this.status = 'running'
        
        console.log(`端点启动成功: ${this.name}`)
        
      } catch (error) {
        console.error(`端点启动失败: ${this.name}`, error)
        this.status = 'error'
        throw error
      }
    }
    
    async stop() {
      try {
        console.log(`停止端点: ${this.name}`)
        
        await this.cleanup()
        this.status = 'stopped'
        
        console.log(`端点停止成功: ${this.name}`)
        
      } catch (error) {
        console.error(`端点停止失败: ${this.name}`, error)
        throw error
      }
    }
    
    async send(message) {
      if (this.status !== 'running') {
        throw new Error(`端点未运行: ${this.name}`)
      }
      
      try {
        console.log(`发送消息: ${this.name}`)
        
        const result = await this.sendMessage(message)
        
        this.statistics.messagesSent++
        this.statistics.lastActivity = new Date()
        
        return result
        
      } catch (error) {
        this.statistics.errors++
        console.error(`消息发送失败: ${this.name}`, error)
        throw error
      }
    }
    
    async receive(callback) {
      if (this.status !== 'running') {
        throw new Error(`端点未运行: ${this.name}`)
      }
      
      try {
        await this.receiveMessage(callback)
        
      } catch (error) {
        this.statistics.errors++
        console.error(`消息接收失败: ${this.name}`, error)
        throw error
      }
    }
    
    // 抽象方法 - 子类实现
    async initialize() {
      throw new Error('initialize方法必须被实现')
    }
    
    async cleanup() {
      throw new Error('cleanup方法必须被实现')
    }
    
    async sendMessage(message) {
      throw new Error('sendMessage方法必须被实现')
    }
    
    async receiveMessage(callback) {
      throw new Error('receiveMessage方法必须被实现')
    }
    
    getStatistics() {
      return { ...this.statistics }
    }
  }
  
  // HTTP端点实现
  class HttpEndpoint extends Endpoint {
    constructor(config) {
      super(config)
      this.server = null
      this.client = null
    }
    
    async initialize() {
      if (this.type === 'inbound' || this.type === 'bidirectional') {
        await this.startServer()
      }
      
      if (this.type === 'outbound' || this.type === 'bidirectional') {
        await this.initializeClient()
      }
    }
    
    async startServer() {
      const express = require('express')
      this.server = express()
      
      this.server.use(express.json())
      this.server.use(express.urlencoded({ extended: true }))
      
      // 设置路由
      this.server.all('*', async (req, res) => {
        try {
          const message = this.createMessageFromRequest(req)
          
          if (this.messageCallback) {
            const response = await this.messageCallback(message)
            res.json(response || { success: true })
          } else {
            res.json({ success: true, message: 'Message received' })
          }
          
          this.statistics.messagesReceived++
          this.statistics.lastActivity = new Date()
          
        } catch (error) {
          this.statistics.errors++
          res.status(500).json({ error: error.message })
        }
      })
      
      const port = this.configuration.port || 3000
      
      return new Promise((resolve, reject) => {
        this.server.listen(port, (error) => {
          if (error) {
            reject(error)
          } else {
            console.log(`HTTP服务器启动在端口 ${port}`)
            resolve()
          }
        })
      })
    }
    
    async initializeClient() {
      // HTTP客户端初始化
      this.client = {
        baseURL: this.address,
        timeout: this.configuration.timeout || 30000,
        headers: this.configuration.headers || {}
      }
    }
    
    async sendMessage(message) {
      if (!this.client) {
        throw new Error('HTTP客户端未初始化')
      }
      
      const axios = require('axios')
      
      const config = {
        method: message.method || 'POST',
        url: this.client.baseURL,
        data: message.body,
        headers: {
          ...this.client.headers,
          ...message.headers
        },
        timeout: this.client.timeout
      }
      
      const response = await axios(config)
      
      return {
        statusCode: response.status,
        headers: response.headers,
        body: response.data,
        timestamp: new Date()
      }
    }
    
    async receiveMessage(callback) {
      this.messageCallback = callback
    }
    
    createMessageFromRequest(req) {
      return {
        id: this.generateMessageId(),
        method: req.method,
        path: req.path,
        headers: req.headers,
        query: req.query,
        body: req.body,
        timestamp: new Date(),
        source: this.name
      }
    }
    
    generateMessageId() {
      return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`
    }
    
    async cleanup() {
      if (this.server) {
        this.server.close()
        this.server = null
      }
    }
  }
  
  // 消息转换器
  class MessageTransformer {
    constructor(config) {
      this.id = config.id
      this.name = config.name
      this.sourceFormat = config.sourceFormat
      this.targetFormat = config.targetFormat
      this.transformationRules = config.transformationRules || []
      this.statistics = {
        transformationsCount: 0,
        errors: 0
      }
    }
    
    async transform(message) {
      try {
        console.log(`转换消息: ${this.name} (${this.sourceFormat} -> ${this.targetFormat})`)
        
        let transformedMessage = { ...message }
        
        // 应用转换规则
        for (const rule of this.transformationRules) {
          transformedMessage = await this.applyRule(transformedMessage, rule)
        }
        
        // 格式转换
        transformedMessage = await this.convertFormat(transformedMessage)
        
        this.statistics.transformationsCount++
        
        return transformedMessage
        
      } catch (error) {
        this.statistics.errors++
        console.error(`消息转换失败: ${this.name}`, error)
        throw error
      }
    }
    
    async applyRule(message, rule) {
      switch (rule.type) {
        case 'map':
          return this.mapFields(message, rule)
        case 'filter':
          return this.filterFields(message, rule)
        case 'enrich':
          return await this.enrichMessage(message, rule)
        case 'validate':
          this.validateMessage(message, rule)
          return message
        default:
          console.warn(`未知转换规则类型: ${rule.type}`)
          return message
      }
    }
    
    mapFields(message, rule) {
      const mapped = { ...message }
      
      rule.mappings.forEach(mapping => {
        const sourceValue = this.getNestedValue(message, mapping.source)
        this.setNestedValue(mapped, mapping.target, sourceValue)
        
        // 如果需要删除源字段
        if (mapping.deleteSource) {
          this.deleteNestedValue(mapped, mapping.source)
        }
      })
      
      return mapped
    }
    
    filterFields(message, rule) {
      const filtered = {}
      
      rule.allowedFields.forEach(field => {
        const value = this.getNestedValue(message, field)
        if (value !== undefined) {
          this.setNestedValue(filtered, field, value)
        }
      })
      
      return filtered
    }
    
    async enrichMessage(message, rule) {
      const enriched = { ...message }
      
      for (const enrichment of rule.enrichments) {
        switch (enrichment.type) {
          case 'timestamp':
            this.setNestedValue(enriched, enrichment.field, new Date())
            break
          case 'uuid':
            this.setNestedValue(enriched, enrichment.field, this.generateUUID())
            break
          case 'lookup':
            const lookupValue = await this.performLookup(enrichment.lookup, message)
            this.setNestedValue(enriched, enrichment.field, lookupValue)
            break
          case 'constant':
            this.setNestedValue(enriched, enrichment.field, enrichment.value)
            break
        }
      }
      
      return enriched
    }
    
    validateMessage(message, rule) {
      rule.validations.forEach(validation => {
        const value = this.getNestedValue(message, validation.field)
        
        switch (validation.type) {
          case 'required':
            if (value === undefined || value === null) {
              throw new Error(`必填字段缺失: ${validation.field}`)
            }
            break
          case 'type':
            if (typeof value !== validation.expectedType) {
              throw new Error(`字段类型错误: ${validation.field}`)
            }
            break
          case 'regex':
            if (!validation.pattern.test(value)) {
              throw new Error(`字段格式错误: ${validation.field}`)
            }
            break
          case 'range':
            if (value < validation.min || value > validation.max) {
              throw new Error(`字段值超出范围: ${validation.field}`)
            }
            break
        }
      })
    }
    
    async convertFormat(message) {
      if (this.sourceFormat === this.targetFormat) {
        return message
      }
      
      switch (this.targetFormat) {
        case 'json':
          return this.toJSON(message)
        case 'xml':
          return this.toXML(message)
        case 'csv':
          return this.toCSV(message)
        case 'edi':
          return this.toEDI(message)
        default:
          throw new Error(`不支持的目标格式: ${this.targetFormat}`)
      }
    }
    
    toJSON(message) {
      return {
        ...message,
        body: typeof message.body === 'string' ? 
          JSON.parse(message.body) : 
          message.body
      }
    }
    
    toXML(message) {
      // 简化的XML转换
      const xmlBuilder = require('xmlbuilder')
      const root = xmlBuilder.create('message')
      
      this.objectToXML(root, message.body)
      
      return {
        ...message,
        body: root.end({ pretty: true }),
        headers: {
          ...message.headers,
          'Content-Type': 'application/xml'
        }
      }
    }
    
    objectToXML(parent, obj) {
      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'object' && value !== null) {
          const child = parent.ele(key)
          this.objectToXML(child, value)
        } else {
          parent.ele(key, value)
        }
      }
    }
    
    // 工具方法
    getNestedValue(obj, path) {
      return path.split('.').reduce((current, key) => 
        current && current[key] !== undefined ? current[key] : undefined, obj)
    }
    
    setNestedValue(obj, path, value) {
      const keys = path.split('.')
      const lastKey = keys.pop()
      const target = keys.reduce((current, key) => {
        if (!current[key]) current[key] = {}
        return current[key]
      }, obj)
      target[lastKey] = value
    }
    
    deleteNestedValue(obj, path) {
      const keys = path.split('.')
      const lastKey = keys.pop()
      const target = keys.reduce((current, key) => current && current[key], obj)
      if (target) delete target[lastKey]
    }
    
    generateUUID() {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0
        const v = c == 'x' ? r : (r & 0x3 | 0x8)
        return v.toString(16)
      })
    }
    
    async performLookup(lookup, message) {
      // 简化的查找实现
      console.log(`执行查找: ${lookup.table}`)
      return `lookup_result_${Date.now()}`
    }
    
    getStatistics() {
      return { ...this.statistics }
    }
  }
  
  // 消息路由器
  class MessageRouter {
    constructor(config) {
      this.id = config.id
      this.name = config.name
      this.routes = config.routes || []
      this.defaultRoute = config.defaultRoute
      this.statistics = {
        messagesRouted: 0,
        routeStatistics: {}
      }
    }
    
    async route(message) {
      try {
        console.log(`路由消息: ${this.name}`)
        
        // 查找匹配的路由
        const matchedRoutes = []
        
        for (const route of this.routes) {
          if (await this.evaluateCondition(message, route.condition)) {
            matchedRoutes.push(route)
          }
        }
        
        // 如果没有匹配的路由，使用默认路由
        if (matchedRoutes.length === 0 && this.defaultRoute) {
          matchedRoutes.push(this.defaultRoute)
        }
        
        if (matchedRoutes.length === 0) {
          throw new Error('没有匹配的路由规则')
        }
        
        // 路由消息
        const routingResults = []
        
        for (const route of matchedRoutes) {
          try {
            const result = await this.routeToDestination(message, route)
            routingResults.push(result)
            
            // 更新统计
            this.updateRouteStatistics(route.id, true)
            
          } catch (error) {
            console.error(`路由失败: ${route.id}`, error)
            this.updateRouteStatistics(route.id, false)
            
            routingResults.push({
              routeId: route.id,
              success: false,
              error: error.message
            })
          }
        }
        
        this.statistics.messagesRouted++
        
        return routingResults
        
      } catch (error) {
        console.error(`消息路由失败: ${this.name}`, error)
        throw error
      }
    }
    
    async evaluateCondition(message, condition) {
      if (!condition) {
        return true // 无条件则匹配
      }
      
      switch (condition.type) {
        case 'header':
          return this.evaluateHeaderCondition(message, condition)
        case 'body':
          return this.evaluateBodyCondition(message, condition)
        case 'javascript':
          return this.evaluateJavaScriptCondition(message, condition)
        case 'xpath':
          return this.evaluateXPathCondition(message, condition)
        default:
          console.warn(`未知条件类型: ${condition.type}`)
          return false
      }
    }
    
    evaluateHeaderCondition(message, condition) {
      const headerValue = message.headers[condition.header]
      
      switch (condition.operator) {
        case 'equals':
          return headerValue === condition.value
        case 'contains':
          return headerValue && headerValue.includes(condition.value)
        case 'regex':
          return headerValue && new RegExp(condition.value).test(headerValue)
        default:
          return false
      }
    }
    
    evaluateBodyCondition(message, condition) {
      const bodyValue = this.getNestedValue(message.body, condition.field)
      
      switch (condition.operator) {
        case 'equals':
          return bodyValue === condition.value
        case 'greater':
          return bodyValue > condition.value
        case 'less':
          return bodyValue < condition.value
        case 'contains':
          return bodyValue && bodyValue.includes && bodyValue.includes(condition.value)
        case 'exists':
          return bodyValue !== undefined
        default:
          return false
      }
    }
    
    evaluateJavaScriptCondition(message, condition) {
      try {
        // 安全的JavaScript条件评估
        const context = {
          message,
          headers: message.headers,
          body: message.body
        }
        
        const func = new Function('context', `return ${condition.expression}`)
        return func(context)
        
      } catch (error) {
        console.error('JavaScript条件评估失败:', error)
        return false
      }
    }
    
    async routeToDestination(message, route) {
      console.log(`路由到目标: ${route.destination}`)
      
      // 应用路由级别的转换
      let routedMessage = message
      
      if (route.transformer) {
        routedMessage = await route.transformer.transform(message)
      }
      
      // 发送到目标端点
      const result = await route.destination.send(routedMessage)
      
      return {
        routeId: route.id,
        destinationId: route.destination.id,
        success: true,
        result: result
      }
    }
    
    updateRouteStatistics(routeId, success) {
      if (!this.statistics.routeStatistics[routeId]) {
        this.statistics.routeStatistics[routeId] = {
          attempts: 0,
          successes: 0,
          failures: 0
        }
      }
      
      const stats = this.statistics.routeStatistics[routeId]
      stats.attempts++
      
      if (success) {
        stats.successes++
      } else {
        stats.failures++
      }
    }
    
    getNestedValue(obj, path) {
      return path.split('.').reduce((current, key) => 
        current && current[key] !== undefined ? current[key] : undefined, obj)
    }
    
    getStatistics() {
      return { ...this.statistics }
    }
  }
}

// 消息存储
class MessageStore {
  constructor() {
    this.messages = new Map()
    this.config = {
      maxMessages: 10000,
      retentionPeriod: 7 * 24 * 60 * 60 * 1000 // 7天
    }
  }
  
  async store(message) {
    const messageId = message.id || this.generateMessageId()
    
    const storedMessage = {
      id: messageId,
      originalMessage: { ...message },
      storedAt: new Date(),
      status: 'stored',
      attempts: 0,
      lastAttempt: null,
      errors: []
    }
    
    this.messages.set(messageId, storedMessage)
    
    // 检查存储限制
    await this.enforceStorageLimits()
    
    console.log(`消息存储: ${messageId}`)
    return messageId
  }
  
  async retrieve(messageId) {
    const message = this.messages.get(messageId)
    
    if (!message) {
      return null
    }
    
    console.log(`消息检索: ${messageId}`)
    return message
  }
  
  async updateStatus(messageId, status, error = null) {
    const message = this.messages.get(messageId)
    
    if (!message) {
      throw new Error(`消息不存在: ${messageId}`)
    }
    
    message.status = status
    message.lastAttempt = new Date()
    message.attempts++
    
    if (error) {
      message.errors.push({
        timestamp: new Date(),
        error: error.message || error
      })
    }
    
    console.log(`消息状态更新: ${messageId} -> ${status}`)
  }
  
  async search(criteria) {
    const results = []
    
    this.messages.forEach((message, id) => {
      if (this.matchesCriteria(message, criteria)) {
        results.push(message)
      }
    })
    
    return results
  }
  
  matchesCriteria(message, criteria) {
    if (criteria.status && message.status !== criteria.status) {
      return false
    }
    
    if (criteria.fromDate && message.storedAt < criteria.fromDate) {
      return false
    }
    
    if (criteria.toDate && message.storedAt > criteria.toDate) {
      return false
    }
    
    if (criteria.source && message.originalMessage.source !== criteria.source) {
      return false
    }
    
    return true
  }
  
  async enforceStorageLimits() {
    const now = new Date()
    
    // 删除过期消息
    const expiredMessages = []
    
    this.messages.forEach((message, id) => {
      if (now - message.storedAt > this.config.retentionPeriod) {
        expiredMessages.push(id)
      }
    })
    
    expiredMessages.forEach(id => {
      this.messages.delete(id)
      console.log(`删除过期消息: ${id}`)
    })
    
    // 检查消息数量限制
    if (this.messages.size > this.config.maxMessages) {
      const sortedMessages = Array.from(this.messages.entries())
        .sort(([, a], [, b]) => a.storedAt - b.storedAt)
      
      const toDelete = sortedMessages.slice(0, this.messages.size - this.config.maxMessages)
      
      toDelete.forEach(([id]) => {
        this.messages.delete(id)
        console.log(`删除旧消息: ${id}`)
      })
    }
  }
  
  generateMessageId() {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`
  }
  
  getStatistics() {
    const statusCounts = {}
    let totalSize = 0
    
    this.messages.forEach(message => {
      statusCounts[message.status] = (statusCounts[message.status] || 0) + 1
      totalSize += JSON.stringify(message).length
    })
    
    return {
      totalMessages: this.messages.size,
      statusCounts,
      totalSize,
      retentionPeriod: this.config.retentionPeriod,
      maxMessages: this.config.maxMessages
    }
  }
}

// 错误处理器
class ErrorHandler {
  constructor() {
    this.errorStrategies = new Map()
    this.defaultStrategy = 'log'
    this.errorLog = []
  }
  
  registerStrategy(name, strategy) {
    this.errorStrategies.set(name, strategy)
    console.log(`注册错误处理策略: ${name}`)
  }
  
  async handleError(error, context, strategyName = null) {
    const strategy = strategyName || this.defaultStrategy
    const errorStrategy = this.errorStrategies.get(strategy)
    
    if (!errorStrategy) {
      console.error(`错误处理策略不存在: ${strategy}`)
      return this.logError(error, context)
    }
    
    try {
      return await errorStrategy.handle(error, context)
      
    } catch (strategyError) {
      console.error('错误处理策略执行失败:', strategyError)
      return this.logError(error, context)
    }
  }
  
  logError(error, context) {
    const errorRecord = {
      id: this.generateErrorId(),
      timestamp: new Date(),
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name
      },
      context: context || {},
      severity: this.determineSeverity(error)
    }
    
    this.errorLog.push(errorRecord)
    
    console.error(`记录错误: ${errorRecord.id}`, errorRecord)
    
    // 保持错误日志大小限制
    if (this.errorLog.length > 1000) {
      this.errorLog = this.errorLog.slice(-1000)
    }
    
    return errorRecord
  }
  
  determineSeverity(error) {
    if (error.name === 'ValidationError') {
      return 'warning'
    } else if (error.name === 'ConnectionError') {
      return 'error'
    } else if (error.name === 'SecurityError') {
      return 'critical'
    } else {
      return 'error'
    }
  }
  
  getErrorStatistics() {
    const severityCounts = {}
    const errorTypes = {}
    
    this.errorLog.forEach(errorRecord => {
      const severity = errorRecord.severity
      severityCounts[severity] = (severityCounts[severity] || 0) + 1
      
      const errorType = errorRecord.error.name
      errorTypes[errorType] = (errorTypes[errorType] || 0) + 1
    })
    
    return {
      totalErrors: this.errorLog.length,
      severityCounts,
      errorTypes,
      recentErrors: this.errorLog.slice(-10)
    }
  }
  
  generateErrorId() {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
  }
}
```

### 2. 集成流程实现

```javascript
// 集成流程引擎
class IntegrationFlow {
  constructor(config) {
    this.id = config.id
    this.name = config.name
    this.description = config.description
    this.steps = config.steps || []
    this.status = 'stopped'
    this.statistics = {
      executions: 0,
      successes: 0,
      failures: 0,
      averageExecutionTime: 0
    }
  }
  
  async execute(inputMessage, context = {}) {
    const executionId = this.generateExecutionId()
    const executionContext = {
      ...context,
      executionId,
      flowId: this.id,
      startTime: new Date()
    }
    
    console.log(`执行集成流程: ${this.name} (${executionId})`)
    
    try {
      let currentMessage = inputMessage
      const stepResults = []
      
      for (const [index, step] of this.steps.entries()) {
        console.log(`执行步骤 ${index + 1}: ${step.name}`)
        
        const stepStartTime = Date.now()
        
        try {
          const stepResult = await this.executeStep(step, currentMessage, executionContext)
          
          stepResults.push({
            stepIndex: index,
            stepName: step.name,
            success: true,
            executionTime: Date.now() - stepStartTime,
            result: stepResult
          })
          
          // 更新当前消息为步骤输出
          if (stepResult && stepResult.outputMessage) {
            currentMessage = stepResult.outputMessage
          }
          
        } catch (stepError) {
          console.error(`步骤执行失败: ${step.name}`, stepError)
          
          stepResults.push({
            stepIndex: index,
            stepName: step.name,
            success: false,
            executionTime: Date.now() - stepStartTime,
            error: stepError.message
          })
          
          // 检查错误处理策略
          if (step.onError === 'continue') {
            console.log('忽略错误，继续执行')
            continue
          } else if (step.onError === 'stop') {
            console.log('停止流程执行')
            break
          } else {
            throw stepError
          }
        }
      }
      
      const executionTime = Date.now() - executionContext.startTime.getTime()
      
      // 更新统计信息
      this.updateStatistics(true, executionTime)
      
      const result = {
        executionId,
        success: true,
        inputMessage,
        outputMessage: currentMessage,
        stepResults,
        executionTime,
        completedAt: new Date()
      }
      
      console.log(`流程执行完成: ${this.name} (${executionTime}ms)`)
      return result
      
    } catch (error) {
      const executionTime = Date.now() - executionContext.startTime.getTime()
      
      // 更新统计信息
      this.updateStatistics(false, executionTime)
      
      console.error(`流程执行失败: ${this.name}`, error)
      
      throw {
        executionId,
        success: false,
        error: error.message,
        executionTime,
        failedAt: new Date()
      }
    }
  }
  
  async executeStep(step, message, context) {
    switch (step.type) {
      case 'transform':
        return await this.executeTransformStep(step, message, context)
      case 'route':
        return await this.executeRouteStep(step, message, context)
      case 'filter':
        return await this.executeFilterStep(step, message, context)
      case 'enrich':
        return await this.executeEnrichStep(step, message, context)
      case 'validate':
        return await this.executeValidateStep(step, message, context)
      case 'custom':
        return await this.executeCustomStep(step, message, context)
      default:
        throw new Error(`未知步骤类型: ${step.type}`)
    }
  }
  
  async executeTransformStep(step, message, context) {
    const transformer = step.transformer
    
    if (!transformer) {
      throw new Error('转换步骤缺少转换器')
    }
    
    const transformedMessage = await transformer.transform(message)
    
    return {
      outputMessage: transformedMessage,
      transformations: transformer.transformationRules.length
    }
  }
  
  async executeRouteStep(step, message, context) {
    const router = step.router
    
    if (!router) {
      throw new Error('路由步骤缺少路由器')
    }
    
    const routingResults = await router.route(message)
    
    return {
      routingResults,
      routedDestinations: routingResults.length
    }
  }
  
  async executeFilterStep(step, message, context) {
    const condition = step.condition
    
    if (!condition) {
      throw new Error('过滤步骤缺少条件')
    }
    
    const passed = await this.evaluateCondition(message, condition, context)
    
    if (!passed) {
      throw new Error('消息被过滤器阻止')
    }
    
    return {
      outputMessage: message,
      filterPassed: true
    }
  }
  
  async executeEnrichStep(step, message, context) {
    const enrichments = step.enrichments || []
    let enrichedMessage = { ...message }
    
    for (const enrichment of enrichments) {
      enrichedMessage = await this.applyEnrichment(enrichedMessage, enrichment, context)
    }
    
    return {
      outputMessage: enrichedMessage,
      enrichmentsApplied: enrichments.length
    }
  }
  
  async executeValidateStep(step, message, context) {
    const validations = step.validations || []
    const errors = []
    
    for (const validation of validations) {
      try {
        await this.performValidation(message, validation, context)
      } catch (validationError) {
        errors.push({
          validation: validation.name,
          error: validationError.message
        })
      }
    }
    
    if (errors.length > 0) {
      throw new Error(`验证失败: ${errors.map(e => e.error).join(', ')}`)
    }
    
    return {
      outputMessage: message,
      validationsPassed: validations.length
    }
  }
  
  async executeCustomStep(step, message, context) {
    const customHandler = step.handler
    
    if (!customHandler) {
      throw new Error('自定义步骤缺少处理器')
    }
    
    return await customHandler(message, context, step.config)
  }
  
  updateStatistics(success, executionTime) {
    this.statistics.executions++
    
    if (success) {
      this.statistics.successes++
    } else {
      this.statistics.failures++
    }
    
    // 更新平均执行时间
    const totalTime = this.statistics.averageExecutionTime * (this.statistics.executions - 1) + executionTime
    this.statistics.averageExecutionTime = totalTime / this.statistics.executions
  }
  
  generateExecutionId() {
    return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`
  }
  
  start() {
    this.status = 'running'
    console.log(`集成流程启动: ${this.name}`)
  }
  
  stop() {
    this.status = 'stopped'
    console.log(`集成流程停止: ${this.name}`)
  }
  
  getStatistics() {
    return {
      ...this.statistics,
      successRate: this.statistics.executions > 0 ? 
        this.statistics.successes / this.statistics.executions : 0,
      status: this.status
    }
  }
}

// 集成管理器
class IntegrationManager {
  constructor() {
    this.endpoints = new Map()
    this.transformers = new Map()
    this.routers = new Map()
    this.flows = new Map()
    this.framework = new IntegrationFramework()
    this.status = 'stopped'
  }
  
  // 注册组件
  registerEndpoint(endpoint) {
    this.endpoints.set(endpoint.id, endpoint)
    console.log(`注册端点: ${endpoint.name}`)
  }
  
  registerTransformer(transformer) {
    this.transformers.set(transformer.id, transformer)
    console.log(`注册转换器: ${transformer.name}`)
  }
  
  registerRouter(router) {
    this.routers.set(router.id, router)
    console.log(`注册路由器: ${router.name}`)
  }
  
  registerFlow(flow) {
    this.flows.set(flow.id, flow)
    console.log(`注册集成流程: ${flow.name}`)
  }
  
  // 启动集成管理器
  async start() {
    try {
      console.log('启动集成管理器...')
      
      // 启动所有端点
      for (const endpoint of this.endpoints.values()) {
        await endpoint.start()
      }
      
      // 启动所有流程
      for (const flow of this.flows.values()) {
        flow.start()
      }
      
      this.status = 'running'
      console.log('集成管理器启动完成')
      
    } catch (error) {
      console.error('集成管理器启动失败:', error)
      this.status = 'error'
      throw error
    }
  }
  
  // 停止集成管理器
  async stop() {
    try {
      console.log('停止集成管理器...')
      
      // 停止所有流程
      for (const flow of this.flows.values()) {
        flow.stop()
      }
      
      // 停止所有端点
      for (const endpoint of this.endpoints.values()) {
        await endpoint.stop()
      }
      
      this.status = 'stopped'
      console.log('集成管理器停止完成')
      
    } catch (error) {
      console.error('集成管理器停止失败:', error)
      throw error
    }
  }
  
  // 执行流程
  async executeFlow(flowId, inputMessage, context = {}) {
    const flow = this.flows.get(flowId)
    
    if (!flow) {
      throw new Error(`流程不存在: ${flowId}`)
    }
    
    if (flow.status !== 'running') {
      throw new Error(`流程未运行: ${flowId}`)
    }
    
    return await flow.execute(inputMessage, context)
  }
  
  // 获取系统状态
  getSystemStatus() {
    const endpointStatuses = {}
    this.endpoints.forEach((endpoint, id) => {
      endpointStatuses[id] = {
        name: endpoint.name,
        status: endpoint.status,
        statistics: endpoint.getStatistics()
      }
    })
    
    const flowStatuses = {}
    this.flows.forEach((flow, id) => {
      flowStatuses[id] = {
        name: flow.name,
        status: flow.status,
        statistics: flow.getStatistics()
      }
    })
    
    return {
      systemStatus: this.status,
      endpoints: endpointStatuses,
      flows: flowStatuses,
      timestamp: new Date()
    }
  }
  
  // 健康检查
  async healthCheck() {
    const health = {
      status: 'healthy',
      timestamp: new Date(),
      components: {}
    }
    
    try {
      // 检查端点健康状态
      for (const [id, endpoint] of this.endpoints) {
        health.components[`endpoint_${id}`] = {
          status: endpoint.status,
          lastActivity: endpoint.statistics.lastActivity
        }
        
        if (endpoint.status === 'error') {
          health.status = 'unhealthy'
        }
      }
      
      // 检查流程健康状态
      for (const [id, flow] of this.flows) {
        health.components[`flow_${id}`] = {
          status: flow.status,
          successRate: flow.getStatistics().successRate
        }
        
        if (flow.getStatistics().successRate < 0.9) {
          health.status = 'degraded'
        }
      }
      
    } catch (error) {
      health.status = 'unhealthy'
      health.error = error.message
    }
    
    return health
  }
}
```

## 📚 最佳实践总结

1. **松耦合设计**：使用消息传递实现系统间的松耦合
2. **标准化接口**：定义清晰的集成接口和数据格式
3. **错误处理**：实现完善的错误处理和重试机制
4. **监控告警**：全面监控集成流程的性能和健康状况
5. **数据转换**：处理不同系统间的数据格式差异
6. **安全保护**：确保集成过程中的数据安全和访问控制
7. **性能优化**：优化消息传递和处理的性能
8. **版本管理**：管理接口和消息格式的版本兼容性

通过掌握集成基础技术，您将能够构建稳定可靠的企业应用集成解决方案。
