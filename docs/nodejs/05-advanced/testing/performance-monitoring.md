# 性能监控

## 🎯 学习目标

- 掌握性能监控的基本概念和方法
- 学会使用各种性能监控工具
- 理解性能指标和优化策略
- 掌握实时性能监控和告警
- 学会性能数据分析和报告

## 📚 目录

1. [性能监控基础](#性能监控基础)
2. [性能指标](#性能指标)
3. [监控工具](#监控工具)
4. [Node.js性能监控](#nodejs性能监控)
5. [前端性能监控](#前端性能监控)
6. [数据库性能监控](#数据库性能监控)
7. [实时监控和告警](#实时监控和告警)
8. [性能分析和优化](#性能分析和优化)
9. [监控最佳实践](#监控最佳实践)

## 性能监控基础

### 什么是性能监控

性能监控是持续观察、测量和分析应用程序性能的过程，包括：

- **实时监控**：持续观察系统状态
- **性能指标**：量化性能数据
- **趋势分析**：识别性能变化模式
- **告警机制**：及时发现问题
- **优化建议**：提供改进方向

### 监控架构

```text
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   应用程序      │    │   监控代理      │    │   监控平台      │
│                 │    │                 │    │                 │
│ - 性能数据      │───►│ - 数据收集      │───►│ - 数据存储      │
│ - 业务指标      │    │ - 数据预处理    │    │ - 数据分析      │
│ - 错误日志      │    │ - 数据发送      │    │ - 可视化展示    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 性能指标

### 系统性能指标

```javascript
// CPU使用率监控
const os = require('os')

function getCPUUsage() {
  const cpus = os.cpus()
  let totalIdle = 0
  let totalTick = 0
  
  cpus.forEach(cpu => {
    for (let type in cpu.times) {
      totalTick += cpu.times[type]
    }
    totalIdle += cpu.times.idle
  })
  
  return {
    idle: totalIdle / cpus.length,
    total: totalTick / cpus.length,
    usage: 100 - ~~(100 * totalIdle / totalTick)
  }
}

// 内存使用监控
function getMemoryUsage() {
  const total = os.totalmem()
  const free = os.freemem()
  const used = total - free
  
  return {
    total: total,
    used: used,
    free: free,
    usage: (used / total) * 100
  }
}

// 磁盘使用监控
const fs = require('fs')

function getDiskUsage(path = '/') {
  const stats = fs.statSync(path)
  return {
    total: stats.size,
    used: stats.size - stats.free,
    free: stats.free,
    usage: ((stats.size - stats.free) / stats.size) * 100
  }
}
```

### 应用性能指标

```javascript
// HTTP请求性能监控
const express = require('express')
const app = express()

// 请求时间监控中间件
app.use((req, res, next) => {
  const start = Date.now()
  
  res.on('finish', () => {
    const duration = Date.now() - start
    console.log(`${req.method} ${req.url} - ${duration}ms`)
    
    // 记录到监控系统
    recordMetric('http_request_duration', duration, {
      method: req.method,
      url: req.url,
      status: res.statusCode
    })
  })
  
  next()
})

// 数据库查询性能监控
function monitorDatabaseQuery(query, params) {
  const start = Date.now()
  
  return query(params).then(result => {
    const duration = Date.now() - start
    console.log(`Database query - ${duration}ms`)
    
    recordMetric('database_query_duration', duration, {
      query: query.name || 'unknown',
      params: JSON.stringify(params)
    })
    
    return result
  })
}
```

### 业务性能指标

```javascript
// 业务指标监控
class BusinessMetrics {
  constructor() {
    this.metrics = new Map()
  }
  
  // 用户注册成功率
  recordUserRegistration(success) {
    this.incrementMetric('user_registration_total', { success })
    if (success) {
      this.incrementMetric('user_registration_success')
    } else {
      this.incrementMetric('user_registration_failure')
    }
  }
  
  // 订单处理时间
  recordOrderProcessing(orderId, duration) {
    this.recordMetric('order_processing_duration', duration, {
      order_id: orderId
    })
  }
  
  // 支付成功率
  recordPayment(success, amount) {
    this.incrementMetric('payment_total', { success })
    this.recordMetric('payment_amount', amount, { success })
  }
  
  incrementMetric(name, labels = {}) {
    const key = `${name}_${JSON.stringify(labels)}`
    this.metrics.set(key, (this.metrics.get(key) || 0) + 1)
  }
  
  recordMetric(name, value, labels = {}) {
    const key = `${name}_${JSON.stringify(labels)}`
    const values = this.metrics.get(key) || []
    values.push({ value, timestamp: Date.now() })
    this.metrics.set(key, values)
  }
}
```

## 监控工具

### Prometheus + Grafana

```javascript
// Prometheus客户端配置
const client = require('prom-client')

// 创建指标
const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
})

const activeConnections = new client.Gauge({
  name: 'active_connections',
  help: 'Number of active connections'
})

const totalRequests = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
})

// Express中间件
app.use((req, res, next) => {
  const start = Date.now()
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000
    const route = req.route ? req.route.path : req.path
    
    httpRequestDuration
      .labels(req.method, route, res.statusCode)
      .observe(duration)
    
    totalRequests
      .labels(req.method, route, res.statusCode)
      .inc()
  })
  
  next()
})

// 启动指标服务器
app.get('/metrics', (req, res) => {
  res.set('Content-Type', client.register.contentType)
  res.end(client.register.metrics())
})
```

### New Relic监控

```javascript
// New Relic配置
const newrelic = require('newrelic')

// 自定义指标
newrelic.recordMetric('Custom/UserRegistrations', 1)
newrelic.recordMetric('Custom/OrderValue', 99.99)

// 自定义事件
newrelic.recordCustomEvent('UserAction', {
  action: 'login',
  userId: '12345',
  timestamp: Date.now()
})

// 数据库查询监控
const mysql = require('mysql2/promise')

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'password',
  database: 'mydb'
})

// 包装数据库查询
async function query(sql, params) {
  return newrelic.startSegment('Database/MySQL', true, async () => {
    const [rows] = await connection.execute(sql, params)
    return rows
  })
}
```

### DataDog监控

```javascript
// DataDog配置
const tracer = require('dd-trace').init({
  service: 'my-node-app',
  env: 'production',
  version: '1.0.0'
})

// 自定义span
const span = tracer.startSpan('custom-operation')
span.setTag('user.id', '12345')
span.setTag('operation.type', 'data-processing')

try {
  // 执行操作
  await processData()
  span.setTag('success', true)
} catch (error) {
  span.setTag('error', true)
  span.setTag('error.message', error.message)
  throw error
} finally {
  span.finish()
}

// HTTP请求监控
const express = require('express')
const app = express()

app.use(tracer.express())

app.get('/api/users', async (req, res) => {
  const span = tracer.startSpan('get-users')
  
  try {
    const users = await getUsers()
    res.json(users)
  } finally {
    span.finish()
  }
})
```

## Node.js性能监控

### 进程监控

```javascript
// 进程性能监控
const process = require('process')

class ProcessMonitor {
  constructor() {
    this.startTime = Date.now()
    this.metrics = {
      cpuUsage: 0,
      memoryUsage: 0,
      eventLoopLag: 0,
      activeHandles: 0,
      activeRequests: 0
    }
  }
  
  // CPU使用率监控
  monitorCPUUsage() {
    setInterval(() => {
      const usage = process.cpuUsage()
      this.metrics.cpuUsage = usage.user + usage.system
    }, 1000)
  }
  
  // 内存使用监控
  monitorMemoryUsage() {
    setInterval(() => {
      const usage = process.memoryUsage()
      this.metrics.memoryUsage = {
        rss: usage.rss,
        heapTotal: usage.heapTotal,
        heapUsed: usage.heapUsed,
        external: usage.external
      }
    }, 1000)
  }
  
  // 事件循环延迟监控
  monitorEventLoopLag() {
    const start = process.hrtime()
    
    setImmediate(() => {
      const delta = process.hrtime(start)
      const lag = delta[0] * 1000 + delta[1] / 1000000
      this.metrics.eventLoopLag = lag
    })
  }
  
  // 句柄和请求监控
  monitorHandlesAndRequests() {
    setInterval(() => {
      this.metrics.activeHandles = process._getActiveHandles().length
      this.metrics.activeRequests = process._getActiveRequests().length
    }, 1000)
  }
  
  start() {
    this.monitorCPUUsage()
    this.monitorMemoryUsage()
    this.monitorEventLoopLag()
    this.monitorHandlesAndRequests()
  }
  
  getMetrics() {
    return {
      ...this.metrics,
      uptime: Date.now() - this.startTime,
      pid: process.pid,
      version: process.version
    }
  }
}

const monitor = new ProcessMonitor()
monitor.start()
```

### 内存泄漏监控

```javascript
// 内存泄漏检测
const v8 = require('v8')

class MemoryLeakDetector {
  constructor() {
    this.baseline = null
    this.threshold = 50 * 1024 * 1024 // 50MB
    this.checkInterval = 30000 // 30秒
  }
  
  start() {
    // 设置基线
    this.baseline = this.getMemoryUsage()
    
    setInterval(() => {
      this.checkMemoryLeak()
    }, this.checkInterval)
  }
  
  getMemoryUsage() {
    const usage = process.memoryUsage()
    const heapStats = v8.getHeapStatistics()
    
    return {
      rss: usage.rss,
      heapTotal: usage.heapTotal,
      heapUsed: usage.heapUsed,
      external: usage.external,
      heapSizeLimit: heapStats.heap_size_limit,
      totalHeapSize: heapStats.total_heap_size,
      usedHeapSize: heapStats.used_heap_size
    }
  }
  
  checkMemoryLeak() {
    const current = this.getMemoryUsage()
    
    if (this.baseline) {
      const heapGrowth = current.heapUsed - this.baseline.heapUsed
      
      if (heapGrowth > this.threshold) {
        console.warn('潜在内存泄漏检测:', {
          heapGrowth: heapGrowth,
          threshold: this.threshold,
          current: current,
          baseline: this.baseline
        })
        
        // 触发垃圾回收
        if (global.gc) {
          global.gc()
        }
        
        // 更新基线
        this.baseline = current
      }
    }
  }
  
  // 强制垃圾回收
  forceGC() {
    if (global.gc) {
      global.gc()
      return true
    }
    return false
  }
}

const leakDetector = new MemoryLeakDetector()
leakDetector.start()
```

### 错误监控

```javascript
// 错误监控和报告
class ErrorMonitor {
  constructor() {
    this.errorCounts = new Map()
    this.errorHistory = []
    this.maxHistorySize = 1000
  }
  
  // 全局错误处理
  setupGlobalErrorHandlers() {
    process.on('uncaughtException', (error) => {
      this.recordError('uncaughtException', error)
      this.shutdown()
    })
    
    process.on('unhandledRejection', (reason, promise) => {
      this.recordError('unhandledRejection', reason)
    })
    
    process.on('warning', (warning) => {
      this.recordError('warning', warning)
    })
  }
  
  recordError(type, error) {
    const errorInfo = {
      type: type,
      message: error.message || error,
      stack: error.stack,
      timestamp: Date.now(),
      pid: process.pid
    }
    
    // 记录错误历史
    this.errorHistory.push(errorInfo)
    if (this.errorHistory.length > this.maxHistorySize) {
      this.errorHistory.shift()
    }
    
    // 统计错误次数
    const key = `${type}:${errorInfo.message}`
    this.errorCounts.set(key, (this.errorCounts.get(key) || 0) + 1)
    
    // 发送到监控系统
    this.sendToMonitoring(errorInfo)
  }
  
  sendToMonitoring(errorInfo) {
    // 发送到外部监控系统
    console.error('Error recorded:', errorInfo)
    
    // 可以集成Sentry、Bugsnag等
    // Sentry.captureException(error)
  }
  
  getErrorStats() {
    return {
      totalErrors: this.errorHistory.length,
      errorCounts: Object.fromEntries(this.errorCounts),
      recentErrors: this.errorHistory.slice(-10)
    }
  }
  
  shutdown() {
    console.log('Shutting down due to uncaught exception')
    process.exit(1)
  }
}

const errorMonitor = new ErrorMonitor()
errorMonitor.setupGlobalErrorHandlers()
```

## 前端性能监控

### 页面性能监控

```javascript
// 前端性能监控
class FrontendPerformanceMonitor {
  constructor() {
    this.metrics = {}
    this.init()
  }
  
  init() {
    // 页面加载性能
    this.measurePageLoad()
    
    // 资源加载性能
    this.measureResourceTiming()
    
    // 用户交互性能
    this.measureUserInteraction()
    
    // 错误监控
    this.measureErrors()
  }
  
  measurePageLoad() {
    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0]
      
      this.metrics.pageLoad = {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        totalTime: navigation.loadEventEnd - navigation.fetchStart,
        firstPaint: this.getFirstPaint(),
        firstContentfulPaint: this.getFirstContentfulPaint()
      }
      
      this.sendMetrics('pageLoad', this.metrics.pageLoad)
    })
  }
  
  measureResourceTiming() {
    const resources = performance.getEntriesByType('resource')
    
    resources.forEach(resource => {
      const timing = {
        name: resource.name,
        duration: resource.duration,
        size: resource.transferSize,
        type: resource.initiatorType
      }
      
      this.sendMetrics('resourceTiming', timing)
    })
  }
  
  measureUserInteraction() {
    // 点击响应时间
    document.addEventListener('click', (event) => {
      const start = performance.now()
      
      requestAnimationFrame(() => {
        const end = performance.now()
        const responseTime = end - start
        
        this.sendMetrics('clickResponse', {
          responseTime: responseTime,
          target: event.target.tagName,
          className: event.target.className
        })
      })
    })
    
    // 滚动性能
    let scrollStart = 0
    document.addEventListener('scroll', () => {
      if (scrollStart === 0) {
        scrollStart = performance.now()
      }
      
      requestAnimationFrame(() => {
        const scrollEnd = performance.now()
        const scrollDuration = scrollEnd - scrollStart
        
        if (scrollDuration > 16) { // 超过一帧的时间
          this.sendMetrics('scrollPerformance', {
            duration: scrollDuration,
            threshold: 16
          })
        }
        
        scrollStart = 0
      })
    })
  }
  
  measureErrors() {
    window.addEventListener('error', (event) => {
      this.sendMetrics('javascriptError', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error ? event.error.stack : null
      })
    })
    
    window.addEventListener('unhandledrejection', (event) => {
      this.sendMetrics('unhandledRejection', {
        reason: event.reason,
        promise: event.promise
      })
    })
  }
  
  getFirstPaint() {
    const paintEntries = performance.getEntriesByType('paint')
    const firstPaint = paintEntries.find(entry => entry.name === 'first-paint')
    return firstPaint ? firstPaint.startTime : null
  }
  
  getFirstContentfulPaint() {
    const paintEntries = performance.getEntriesByType('paint')
    const firstContentfulPaint = paintEntries.find(entry => entry.name === 'first-contentful-paint')
    return firstContentfulPaint ? firstContentfulPaint.startTime : null
  }
  
  sendMetrics(type, data) {
    // 发送到后端监控系统
    fetch('/api/metrics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: type,
        data: data,
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent
      })
    }).catch(error => {
      console.error('Failed to send metrics:', error)
    })
  }
}

// 初始化前端性能监控
const performanceMonitor = new FrontendPerformanceMonitor()
```

## 数据库性能监控

### MySQL性能监控

```javascript
// MySQL性能监控
const mysql = require('mysql2/promise')

class MySQLPerformanceMonitor {
  constructor(connection) {
    this.connection = connection
    this.queryStats = new Map()
    this.slowQueryThreshold = 1000 // 1秒
  }
  
  // 监控查询性能
  async executeQuery(sql, params = []) {
    const start = Date.now()
    
    try {
      const [rows] = await this.connection.execute(sql, params)
      const duration = Date.now() - start
      
      this.recordQueryStats(sql, duration, true)
      
      if (duration > this.slowQueryThreshold) {
        this.recordSlowQuery(sql, duration, params)
      }
      
      return rows
    } catch (error) {
      const duration = Date.now() - start
      this.recordQueryStats(sql, duration, false)
      throw error
    }
  }
  
  recordQueryStats(sql, duration, success) {
    const queryType = this.getQueryType(sql)
    const key = `${queryType}_${success ? 'success' : 'error'}`
    
    const stats = this.queryStats.get(key) || {
      count: 0,
      totalDuration: 0,
      avgDuration: 0,
      minDuration: Infinity,
      maxDuration: 0
    }
    
    stats.count++
    stats.totalDuration += duration
    stats.avgDuration = stats.totalDuration / stats.count
    stats.minDuration = Math.min(stats.minDuration, duration)
    stats.maxDuration = Math.max(stats.maxDuration, duration)
    
    this.queryStats.set(key, stats)
  }
  
  recordSlowQuery(sql, duration, params) {
    console.warn('Slow query detected:', {
      sql: sql,
      duration: duration,
      params: params,
      timestamp: new Date().toISOString()
    })
    
    // 发送到监控系统
    this.sendToMonitoring('slowQuery', {
      sql: sql,
      duration: duration,
      params: params
    })
  }
  
  getQueryType(sql) {
    const trimmed = sql.trim().toLowerCase()
    if (trimmed.startsWith('select')) return 'SELECT'
    if (trimmed.startsWith('insert')) return 'INSERT'
    if (trimmed.startsWith('update')) return 'UPDATE'
    if (trimmed.startsWith('delete')) return 'DELETE'
    return 'OTHER'
  }
  
  // 获取数据库状态
  async getDatabaseStatus() {
    const queries = [
      'SHOW STATUS LIKE "Threads_connected"',
      'SHOW STATUS LIKE "Threads_running"',
      'SHOW STATUS LIKE "Questions"',
      'SHOW STATUS LIKE "Uptime"',
      'SHOW VARIABLES LIKE "max_connections"'
    ]
    
    const results = {}
    
    for (const query of queries) {
      const [rows] = await this.connection.execute(query)
      const key = rows[0].Variable_name
      const value = rows[0].Value
      results[key] = parseInt(value)
    }
    
    return results
  }
  
  sendToMonitoring(type, data) {
    // 发送到监控系统
    console.log(`Monitoring: ${type}`, data)
  }
  
  getStats() {
    return {
      queryStats: Object.fromEntries(this.queryStats),
      timestamp: Date.now()
    }
  }
}

// 使用示例
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'password',
  database: 'mydb'
})

const monitor = new MySQLPerformanceMonitor(connection)
```

## 实时监控和告警

### 告警系统

```javascript
// 告警系统
class AlertSystem {
  constructor() {
    this.rules = new Map()
    this.alerts = []
    this.notificationChannels = []
  }
  
  // 添加告警规则
  addRule(name, condition, threshold, severity = 'warning') {
    this.rules.set(name, {
      condition: condition,
      threshold: threshold,
      severity: severity,
      lastTriggered: null,
      cooldown: 300000 // 5分钟冷却期
    })
  }
  
  // 检查告警条件
  checkAlerts(metrics) {
    for (const [ruleName, rule] of this.rules) {
      if (this.shouldCheckRule(rule)) {
        const triggered = this.evaluateCondition(rule.condition, metrics, rule.threshold)
        
        if (triggered) {
          this.triggerAlert(ruleName, rule, metrics)
        }
      }
    }
  }
  
  shouldCheckRule(rule) {
    const now = Date.now()
    return !rule.lastTriggered || (now - rule.lastTriggered) > rule.cooldown
  }
  
  evaluateCondition(condition, metrics, threshold) {
    switch (condition) {
      case 'cpu_usage_high':
        return metrics.cpuUsage > threshold
      case 'memory_usage_high':
        return metrics.memoryUsage.usage > threshold
      case 'response_time_slow':
        return metrics.avgResponseTime > threshold
      case 'error_rate_high':
        return metrics.errorRate > threshold
      case 'disk_usage_high':
        return metrics.diskUsage > threshold
      default:
        return false
    }
  }
  
  triggerAlert(ruleName, rule, metrics) {
    const alert = {
      id: Date.now(),
      ruleName: ruleName,
      severity: rule.severity,
      message: this.generateAlertMessage(ruleName, rule, metrics),
      metrics: metrics,
      timestamp: new Date().toISOString(),
      resolved: false
    }
    
    this.alerts.push(alert)
    rule.lastTriggered = Date.now()
    
    // 发送通知
    this.sendNotification(alert)
    
    console.warn('Alert triggered:', alert)
  }
  
  generateAlertMessage(ruleName, rule, metrics) {
    const messages = {
      cpu_usage_high: `CPU使用率过高: ${metrics.cpuUsage}% (阈值: ${rule.threshold}%)`,
      memory_usage_high: `内存使用率过高: ${metrics.memoryUsage.usage}% (阈值: ${rule.threshold}%)`,
      response_time_slow: `响应时间过慢: ${metrics.avgResponseTime}ms (阈值: ${rule.threshold}ms)`,
      error_rate_high: `错误率过高: ${metrics.errorRate}% (阈值: ${rule.threshold}%)`,
      disk_usage_high: `磁盘使用率过高: ${metrics.diskUsage}% (阈值: ${rule.threshold}%)`
    }
    
    return messages[ruleName] || `告警触发: ${ruleName}`
  }
  
  sendNotification(alert) {
    this.notificationChannels.forEach(channel => {
      channel.send(alert)
    })
  }
  
  // 添加通知渠道
  addNotificationChannel(channel) {
    this.notificationChannels.push(channel)
  }
  
  // 解决告警
  resolveAlert(alertId) {
    const alert = this.alerts.find(a => a.id === alertId)
    if (alert) {
      alert.resolved = true
      alert.resolvedAt = new Date().toISOString()
    }
  }
  
  getActiveAlerts() {
    return this.alerts.filter(alert => !alert.resolved)
  }
}

// 通知渠道实现
class EmailNotificationChannel {
  constructor(emailConfig) {
    this.config = emailConfig
  }
  
  send(alert) {
    // 发送邮件通知
    console.log(`Sending email alert: ${alert.message}`)
  }
}

class SlackNotificationChannel {
  constructor(webhookUrl) {
    this.webhookUrl = webhookUrl
  }
  
  send(alert) {
    // 发送Slack通知
    console.log(`Sending Slack alert: ${alert.message}`)
  }
}

// 使用示例
const alertSystem = new AlertSystem()

// 添加告警规则
alertSystem.addRule('cpu_high', 'cpu_usage_high', 80, 'critical')
alertSystem.addRule('memory_high', 'memory_usage_high', 90, 'warning')
alertSystem.addRule('response_slow', 'response_time_slow', 2000, 'warning')

// 添加通知渠道
alertSystem.addNotificationChannel(new EmailNotificationChannel({}))
alertSystem.addNotificationChannel(new SlackNotificationChannel(''))
```

## 性能分析和优化

### 性能分析工具

```javascript
// 性能分析器
class PerformanceProfiler {
  constructor() {
    this.profiles = new Map()
    this.activeProfiles = new Map()
  }
  
  // 开始性能分析
  startProfile(name) {
    const profile = {
      name: name,
      startTime: Date.now(),
      startMemory: process.memoryUsage(),
      startCPU: process.cpuUsage()
    }
    
    this.activeProfiles.set(name, profile)
    return profile
  }
  
  // 结束性能分析
  endProfile(name) {
    const profile = this.activeProfiles.get(name)
    if (!profile) {
      throw new Error(`Profile ${name} not found`)
    }
    
    const endTime = Date.now()
    const endMemory = process.memoryUsage()
    const endCPU = process.cpuUsage(profile.startCPU)
    
    const result = {
      name: name,
      duration: endTime - profile.startTime,
      memoryDelta: {
        rss: endMemory.rss - profile.startMemory.rss,
        heapUsed: endMemory.heapUsed - profile.startMemory.heapUsed,
        heapTotal: endMemory.heapTotal - profile.startMemory.heapTotal,
        external: endMemory.external - profile.startMemory.external
      },
      cpuDelta: {
        user: endCPU.user,
        system: endCPU.system
      },
      timestamp: new Date().toISOString()
    }
    
    this.profiles.set(name, result)
    this.activeProfiles.delete(name)
    
    return result
  }
  
  // 分析性能瓶颈
  analyzeBottlenecks() {
    const analysis = {
      slowestProfiles: [],
      memoryIntensiveProfiles: [],
      cpuIntensiveProfiles: []
    }
    
    for (const [name, profile] of this.profiles) {
      // 最慢的操作
      if (profile.duration > 1000) {
        analysis.slowestProfiles.push({
          name: name,
          duration: profile.duration
        })
      }
      
      // 内存密集型操作
      if (profile.memoryDelta.heapUsed > 10 * 1024 * 1024) { // 10MB
        analysis.memoryIntensiveProfiles.push({
          name: name,
          memoryUsed: profile.memoryDelta.heapUsed
        })
      }
      
      // CPU密集型操作
      if (profile.cpuDelta.user > 1000000) { // 1秒CPU时间
        analysis.cpuIntensiveProfiles.push({
          name: name,
          cpuTime: profile.cpuDelta.user
        })
      }
    }
    
    // 排序
    analysis.slowestProfiles.sort((a, b) => b.duration - a.duration)
    analysis.memoryIntensiveProfiles.sort((a, b) => b.memoryUsed - a.memoryUsed)
    analysis.cpuIntensiveProfiles.sort((a, b) => b.cpuTime - a.cpuTime)
    
    return analysis
  }
  
  // 生成性能报告
  generateReport() {
    const analysis = this.analyzeBottlenecks()
    
    return {
      summary: {
        totalProfiles: this.profiles.size,
        slowestOperation: analysis.slowestProfiles[0],
        mostMemoryIntensive: analysis.memoryIntensiveProfiles[0],
        mostCPUIntensive: analysis.cpuIntensiveProfiles[0]
      },
      details: analysis,
      recommendations: this.generateRecommendations(analysis)
    }
  }
  
  generateRecommendations(analysis) {
    const recommendations = []
    
    if (analysis.slowestProfiles.length > 0) {
      recommendations.push({
        type: 'performance',
        message: '发现慢操作，建议优化算法或添加缓存',
        profiles: analysis.slowestProfiles.slice(0, 3)
      })
    }
    
    if (analysis.memoryIntensiveProfiles.length > 0) {
      recommendations.push({
        type: 'memory',
        message: '发现内存密集型操作，建议优化内存使用',
        profiles: analysis.memoryIntensiveProfiles.slice(0, 3)
      })
    }
    
    if (analysis.cpuIntensiveProfiles.length > 0) {
      recommendations.push({
        type: 'cpu',
        message: '发现CPU密集型操作，建议考虑异步处理或负载均衡',
        profiles: analysis.cpuIntensiveProfiles.slice(0, 3)
      })
    }
    
    return recommendations
  }
}

// 使用示例
const profiler = new PerformanceProfiler()

// 分析API端点性能
app.get('/api/users', async (req, res) => {
  const profile = profiler.startProfile('getUsers')
  
  try {
    const users = await getUsers()
    res.json(users)
  } finally {
    profiler.endProfile('getUsers')
  }
})

// 定期生成性能报告
setInterval(() => {
  const report = profiler.generateReport()
  console.log('Performance Report:', JSON.stringify(report, null, 2))
}, 300000) // 每5分钟
```

## 监控最佳实践

### 监控策略

```javascript
// 监控配置管理
class MonitoringConfig {
  constructor() {
    this.config = {
      // 性能阈值
      thresholds: {
        cpuUsage: 80,
        memoryUsage: 90,
        diskUsage: 85,
        responseTime: 2000,
        errorRate: 5
      },
      
      // 监控间隔
      intervals: {
        systemMetrics: 10000,    // 10秒
        applicationMetrics: 5000, // 5秒
        databaseMetrics: 15000,   // 15秒
        alertCheck: 30000        // 30秒
      },
      
      // 数据保留
      retention: {
        metrics: 7 * 24 * 60 * 60 * 1000,  // 7天
        logs: 30 * 24 * 60 * 60 * 1000,    // 30天
        alerts: 90 * 24 * 60 * 60 * 1000   // 90天
      }
    }
  }
  
  getThreshold(metric) {
    return this.config.thresholds[metric]
  }
  
  getInterval(type) {
    return this.config.intervals[type]
  }
  
  getRetention(type) {
    return this.config.retention[type]
  }
  
  updateThreshold(metric, value) {
    this.config.thresholds[metric] = value
  }
}

// 监控数据管理
class MonitoringDataManager {
  constructor() {
    this.metrics = new Map()
    this.logs = []
    this.alerts = []
  }
  
  // 存储指标
  storeMetric(name, value, labels = {}, timestamp = Date.now()) {
    const key = `${name}_${JSON.stringify(labels)}`
    const data = this.metrics.get(key) || []
    
    data.push({
      value: value,
      timestamp: timestamp,
      labels: labels
    })
    
    // 限制数据大小
    if (data.length > 10000) {
      data.splice(0, 1000) // 删除最旧的1000条
    }
    
    this.metrics.set(key, data)
  }
  
  // 获取指标
  getMetric(name, labels = {}, timeRange = null) {
    const key = `${name}_${JSON.stringify(labels)}`
    let data = this.metrics.get(key) || []
    
    if (timeRange) {
      const startTime = Date.now() - timeRange
      data = data.filter(item => item.timestamp >= startTime)
    }
    
    return data
  }
  
  // 计算统计信息
  calculateStats(data) {
    if (data.length === 0) return null
    
    const values = data.map(item => item.value)
    const sum = values.reduce((a, b) => a + b, 0)
    
    return {
      count: values.length,
      sum: sum,
      avg: sum / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      p50: this.percentile(values, 50),
      p95: this.percentile(values, 95),
      p99: this.percentile(values, 99)
    }
  }
  
  percentile(values, p) {
    const sorted = values.sort((a, b) => a - b)
    const index = Math.ceil((p / 100) * sorted.length) - 1
    return sorted[index]
  }
  
  // 清理过期数据
  cleanup(retentionTime) {
    const cutoffTime = Date.now() - retentionTime
    
    // 清理指标
    for (const [key, data] of this.metrics) {
      const filtered = data.filter(item => item.timestamp >= cutoffTime)
      if (filtered.length === 0) {
        this.metrics.delete(key)
      } else {
        this.metrics.set(key, filtered)
      }
    }
    
    // 清理日志
    this.logs = this.logs.filter(log => log.timestamp >= cutoffTime)
    
    // 清理告警
    this.alerts = this.alerts.filter(alert => alert.timestamp >= cutoffTime)
  }
}

// 监控服务
class MonitoringService {
  constructor() {
    this.config = new MonitoringConfig()
    this.dataManager = new MonitoringDataManager()
    this.alertSystem = new AlertSystem()
    this.isRunning = false
  }
  
  start() {
    if (this.isRunning) return
    
    this.isRunning = true
    
    // 启动各种监控
    this.startSystemMonitoring()
    this.startApplicationMonitoring()
    this.startDatabaseMonitoring()
    this.startAlertChecking()
    this.startDataCleanup()
    
    console.log('Monitoring service started')
  }
  
  stop() {
    this.isRunning = false
    console.log('Monitoring service stopped')
  }
  
  startSystemMonitoring() {
    setInterval(() => {
      if (!this.isRunning) return
      
      const cpuUsage = getCPUUsage()
      const memoryUsage = getMemoryUsage()
      const diskUsage = getDiskUsage()
      
      this.dataManager.storeMetric('cpu_usage', cpuUsage.usage)
      this.dataManager.storeMetric('memory_usage', memoryUsage.usage)
      this.dataManager.storeMetric('disk_usage', diskUsage.usage)
      
      // 检查告警
      this.alertSystem.checkAlerts({
        cpuUsage: cpuUsage.usage,
        memoryUsage: memoryUsage,
        diskUsage: diskUsage.usage
      })
    }, this.config.getInterval('systemMetrics'))
  }
  
  startApplicationMonitoring() {
    setInterval(() => {
      if (!this.isRunning) return
      
      // 应用指标监控
      const processMonitor = new ProcessMonitor()
      const metrics = processMonitor.getMetrics()
      
      this.dataManager.storeMetric('event_loop_lag', metrics.eventLoopLag)
      this.dataManager.storeMetric('active_handles', metrics.activeHandles)
      this.dataManager.storeMetric('active_requests', metrics.activeRequests)
    }, this.config.getInterval('applicationMetrics'))
  }
  
  startDatabaseMonitoring() {
    setInterval(() => {
      if (!this.isRunning) return
      
      // 数据库监控
      // 实现数据库监控逻辑
    }, this.config.getInterval('databaseMetrics'))
  }
  
  startAlertChecking() {
    setInterval(() => {
      if (!this.isRunning) return
      
      // 定期检查告警
      // 实现告警检查逻辑
    }, this.config.getInterval('alertCheck'))
  }
  
  startDataCleanup() {
    setInterval(() => {
      if (!this.isRunning) return
      
      // 清理过期数据
      this.dataManager.cleanup(this.config.getRetention('metrics'))
    }, 24 * 60 * 60 * 1000) // 每天清理一次
  }
  
  // 获取监控仪表板数据
  getDashboardData() {
    const now = Date.now()
    const oneHour = 60 * 60 * 1000
    
    return {
      systemMetrics: {
        cpu: this.dataManager.getMetric('cpu_usage', {}, oneHour),
        memory: this.dataManager.getMetric('memory_usage', {}, oneHour),
        disk: this.dataManager.getMetric('disk_usage', {}, oneHour)
      },
      applicationMetrics: {
        eventLoopLag: this.dataManager.getMetric('event_loop_lag', {}, oneHour),
        activeHandles: this.dataManager.getMetric('active_handles', {}, oneHour)
      },
      alerts: this.alertSystem.getActiveAlerts(),
      timestamp: now
    }
  }
}

// 启动监控服务
const monitoringService = new MonitoringService()
monitoringService.start()
```

## 🎯 实践项目

### 项目1：完整的监控系统

创建一个完整的Node.js应用监控系统：

```javascript
// 监控系统主文件
const express = require('express')
const app = express()

// 监控中间件
app.use((req, res, next) => {
  const start = Date.now()
  
  res.on('finish', () => {
    const duration = Date.now() - start
    monitoringService.recordHTTPRequest({
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: duration
    })
  })
  
  next()
})

// 监控API端点
app.get('/api/monitoring/dashboard', (req, res) => {
  const data = monitoringService.getDashboardData()
  res.json(data)
})

app.get('/api/monitoring/metrics/:name', (req, res) => {
  const { name } = req.params
  const { labels, timeRange } = req.query
  
  const data = monitoringService.getMetric(name, labels, timeRange)
  res.json(data)
})

app.get('/api/monitoring/alerts', (req, res) => {
  const alerts = monitoringService.getActiveAlerts()
  res.json(alerts)
})

// 启动服务器
app.listen(3000, () => {
  console.log('Monitoring service running on port 3000')
})
```

### 项目2：性能优化建议系统

```javascript
// 性能优化建议系统
class PerformanceOptimizer {
  constructor() {
    this.rules = [
      {
        name: 'high_cpu_usage',
        condition: (metrics) => metrics.cpuUsage > 80,
        suggestion: '考虑优化CPU密集型操作或增加服务器资源'
      },
      {
        name: 'memory_leak',
        condition: (metrics) => metrics.memoryGrowth > 100 * 1024 * 1024,
        suggestion: '检查内存泄漏，优化对象生命周期管理'
      },
      {
        name: 'slow_database_queries',
        condition: (metrics) => metrics.avgQueryTime > 1000,
        suggestion: '优化数据库查询，添加索引或使用缓存'
      }
    ]
  }
  
  analyze(metrics) {
    const suggestions = []
    
    this.rules.forEach(rule => {
      if (rule.condition(metrics)) {
        suggestions.push({
          rule: rule.name,
          suggestion: rule.suggestion,
          severity: this.getSeverity(rule.name),
          timestamp: new Date().toISOString()
        })
      }
    })
    
    return suggestions
  }
  
  getSeverity(ruleName) {
    const severityMap = {
      'high_cpu_usage': 'high',
      'memory_leak': 'critical',
      'slow_database_queries': 'medium'
    }
    
    return severityMap[ruleName] || 'low'
  }
}
```

## 📝 总结

通过本指南，您已经掌握了：

1. **性能监控基础**：监控概念、架构和指标
2. **监控工具**：Prometheus、Grafana、New Relic、DataDog
3. **Node.js监控**：进程、内存、错误监控
4. **前端监控**：页面性能、用户交互监控
5. **数据库监控**：查询性能、连接状态监控
6. **告警系统**：实时监控和告警机制
7. **性能分析**：瓶颈识别和优化建议
8. **最佳实践**：监控策略和数据管理

### 下一步学习

- [负载测试](./load-testing.md) - 系统负载测试方法
- [压力测试](./stress-testing.md) - 系统压力测试
- [DevOps与CI/CD](../devops/README.md) - 持续集成和部署

继续学习，掌握性能监控技能！🚀
