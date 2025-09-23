# 系统监控

## 📖 概述

系统监控是确保系统稳定运行的关键技术，通过收集、分析和可视化系统运行数据，及时发现问题并采取相应措施。现代监控体系包括指标监控、日志分析、链路追踪和智能告警等多个维度。

## 🎯 学习目标

- 理解现代监控体系的核心概念和架构
- 掌握指标收集、存储和分析技术
- 学习日志聚合和分析方法
- 实现智能告警和自动化运维系统

## 📊 综合监控平台

### 1. 监控平台架构

```javascript
// 综合监控平台
class ComprehensiveMonitoringPlatform {
  constructor() {
    this.metricsCollector = new MetricsCollector()
    this.logsAggregator = new LogsAggregator()
    this.tracingSystem = new TracingSystem()
    this.alertingSystem = new AlertingSystem()
    this.dashboardManager = new DashboardManager()
    this.anomalyDetector = new AnomalyDetector()
    this.healthChecker = new HealthChecker()
    this.performanceAnalyzer = new PerformanceAnalyzer()
  }
  
  // 指标收集器
  class MetricsCollector {
    constructor() {
      this.collectors = new Map()
      this.metrics = new Map()
      this.timeSeries = new Map()
      this.aggregators = new Map()
      this.retentionPolicy = {
        raw: 24 * 60 * 60 * 1000,      // 24小时原始数据
        minute: 7 * 24 * 60 * 60 * 1000, // 7天分钟级数据
        hour: 30 * 24 * 60 * 60 * 1000,  // 30天小时级数据
        day: 365 * 24 * 60 * 60 * 1000   // 365天天级数据
      }
    }
    
    // 注册指标收集器
    registerCollector(name, collector) {
      this.collectors.set(name, collector)
      console.log(`注册指标收集器: ${name}`)
    }
    
    // 开始收集指标
    startCollection(intervalMs = 10000) {
      console.log('开始指标收集')
      
      this.collectionInterval = setInterval(async () => {
        await this.collectAllMetrics()
      }, intervalMs)
      
      // 启动数据聚合
      this.startAggregation()
    }
    
    // 停止指标收集
    stopCollection() {
      if (this.collectionInterval) {
        clearInterval(this.collectionInterval)
        this.collectionInterval = null
      }
      
      if (this.aggregationInterval) {
        clearInterval(this.aggregationInterval)
        this.aggregationInterval = null
      }
      
      console.log('停止指标收集')
    }
    
    // 收集所有指标
    async collectAllMetrics() {
      const timestamp = Date.now()
      
      for (const [name, collector] of this.collectors) {
        try {
          const metrics = await collector.collect()
          
          for (const metric of metrics) {
            this.storeMetric(name, metric, timestamp)
          }
          
        } catch (error) {
          console.error(`指标收集失败: ${name}`, error)
        }
      }
      
      // 清理过期数据
      this.cleanupExpiredData()
    }
    
    // 存储指标
    storeMetric(collectorName, metric, timestamp) {
      const metricKey = `${collectorName}.${metric.name}`
      
      if (!this.timeSeries.has(metricKey)) {
        this.timeSeries.set(metricKey, {
          name: metric.name,
          type: metric.type,
          labels: metric.labels || {},
          dataPoints: []
        })
      }
      
      const timeSeries = this.timeSeries.get(metricKey)
      timeSeries.dataPoints.push({
        timestamp,
        value: metric.value,
        labels: metric.labels || {}
      })
      
      // 限制数据点数量
      if (timeSeries.dataPoints.length > 10000) {
        timeSeries.dataPoints = timeSeries.dataPoints.slice(-8000)
      }
    }
    
    // 查询指标
    queryMetrics(query) {
      const {
        metric,
        startTime,
        endTime,
        step = 60000, // 1分钟
        aggregation = 'avg'
      } = query
      
      const timeSeries = this.timeSeries.get(metric)
      
      if (!timeSeries) {
        return null
      }
      
      // 过滤时间范围
      const filteredPoints = timeSeries.dataPoints.filter(point => 
        point.timestamp >= startTime && point.timestamp <= endTime
      )
      
      // 时间聚合
      return this.aggregateDataPoints(filteredPoints, step, aggregation)
    }
    
    // 数据点聚合
    aggregateDataPoints(dataPoints, step, aggregation) {
      const buckets = new Map()
      
      // 分桶
      dataPoints.forEach(point => {
        const bucketKey = Math.floor(point.timestamp / step) * step
        
        if (!buckets.has(bucketKey)) {
          buckets.set(bucketKey, [])
        }
        
        buckets.get(bucketKey).push(point.value)
      })
      
      // 聚合
      const result = []
      
      buckets.forEach((values, timestamp) => {
        let aggregatedValue
        
        switch (aggregation) {
          case 'avg':
            aggregatedValue = values.reduce((sum, v) => sum + v, 0) / values.length
            break
          case 'sum':
            aggregatedValue = values.reduce((sum, v) => sum + v, 0)
            break
          case 'min':
            aggregatedValue = Math.min(...values)
            break
          case 'max':
            aggregatedValue = Math.max(...values)
            break
          case 'count':
            aggregatedValue = values.length
            break
          default:
            aggregatedValue = values[values.length - 1]
        }
        
        result.push({
          timestamp,
          value: aggregatedValue
        })
      })
      
      return result.sort((a, b) => a.timestamp - b.timestamp)
    }
    
    // 启动数据聚合
    startAggregation() {
      this.aggregationInterval = setInterval(() => {
        this.performDataAggregation()
      }, 60000) // 每分钟聚合一次
    }
    
    // 执行数据聚合
    performDataAggregation() {
      const now = Date.now()
      
      // 分钟级聚合
      this.aggregateToLevel('minute', now)
      
      // 小时级聚合
      this.aggregateToLevel('hour', now)
      
      // 天级聚合
      this.aggregateToLevel('day', now)
    }
    
    aggregateToLevel(level, timestamp) {
      const intervals = {
        minute: 60 * 1000,
        hour: 60 * 60 * 1000,
        day: 24 * 60 * 60 * 1000
      }
      
      const interval = intervals[level]
      if (!interval) return
      
      // 这里实现具体的聚合逻辑
      console.log(`执行${level}级数据聚合`)
    }
    
    // 清理过期数据
    cleanupExpiredData() {
      const now = Date.now()
      
      this.timeSeries.forEach((timeSeries, key) => {
        timeSeries.dataPoints = timeSeries.dataPoints.filter(point => 
          now - point.timestamp < this.retentionPolicy.raw
        )
      })
    }
    
    // 系统指标收集器
    createSystemMetricsCollector() {
      return {
        async collect() {
          const metrics = []
          
          // CPU指标
          const cpuUsage = await this.getCPUUsage()
          metrics.push({
            name: 'cpu_usage_percent',
            type: 'gauge',
            value: cpuUsage,
            labels: { type: 'system' }
          })
          
          // 内存指标
          const memoryUsage = process.memoryUsage()
          metrics.push({
            name: 'memory_usage_bytes',
            type: 'gauge',
            value: memoryUsage.heapUsed,
            labels: { type: 'heap' }
          })
          
          metrics.push({
            name: 'memory_usage_bytes',
            type: 'gauge',
            value: memoryUsage.rss,
            labels: { type: 'rss' }
          })
          
          // 进程指标
          metrics.push({
            name: 'process_uptime_seconds',
            type: 'counter',
            value: process.uptime(),
            labels: {}
          })
          
          return metrics
        },
        
        async getCPUUsage() {
          // 简化的CPU使用率计算
          return Math.random() * 100
        }
      }
    }
    
    // HTTP指标收集器
    createHttpMetricsCollector() {
      const requestCounts = new Map()
      const responseTimes = new Map()
      
      return {
        async collect() {
          const metrics = []
          
          // 请求计数
          requestCounts.forEach((count, key) => {
            const [method, status] = key.split(':')
            metrics.push({
              name: 'http_requests_total',
              type: 'counter',
              value: count,
              labels: { method, status }
            })
          })
          
          // 响应时间
          responseTimes.forEach((times, key) => {
            const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length
            metrics.push({
              name: 'http_request_duration_ms',
              type: 'histogram',
              value: avgTime,
              labels: { endpoint: key }
            })
          })
          
          return metrics
        },
        
        recordRequest(method, status, endpoint, duration) {
          const countKey = `${method}:${status}`
          requestCounts.set(countKey, (requestCounts.get(countKey) || 0) + 1)
          
          if (!responseTimes.has(endpoint)) {
            responseTimes.set(endpoint, [])
          }
          responseTimes.get(endpoint).push(duration)
          
          // 保持最近100个响应时间
          if (responseTimes.get(endpoint).length > 100) {
            responseTimes.get(endpoint).shift()
          }
        }
      }
    }
    
    // 获取指标统计
    getMetricsStatistics() {
      return {
        totalMetrics: this.timeSeries.size,
        totalDataPoints: Array.from(this.timeSeries.values())
          .reduce((sum, series) => sum + series.dataPoints.length, 0),
        collectors: Array.from(this.collectors.keys()),
        oldestDataPoint: this.getOldestDataPointTime(),
        newestDataPoint: this.getNewestDataPointTime()
      }
    }
    
    getOldestDataPointTime() {
      let oldest = Date.now()
      
      this.timeSeries.forEach(series => {
        if (series.dataPoints.length > 0) {
          oldest = Math.min(oldest, series.dataPoints[0].timestamp)
        }
      })
      
      return oldest
    }
    
    getNewestDataPointTime() {
      let newest = 0
      
      this.timeSeries.forEach(series => {
        if (series.dataPoints.length > 0) {
          newest = Math.max(newest, series.dataPoints[series.dataPoints.length - 1].timestamp)
        }
      })
      
      return newest
    }
  }
  
  // 日志聚合器
  class LogsAggregator {
    constructor() {
      this.logStreams = new Map()
      this.logBuffer = []
      this.indexedLogs = new Map()
      this.logParsers = new Map()
      this.maxBufferSize = 10000
    }
    
    // 添加日志流
    addLogStream(name, stream) {
      this.logStreams.set(name, stream)
      
      stream.on('data', (logEntry) => {
        this.processLogEntry(name, logEntry)
      })
      
      console.log(`添加日志流: ${name}`)
    }
    
    // 处理日志条目
    processLogEntry(streamName, logEntry) {
      const processedLog = {
        id: this.generateLogId(),
        timestamp: Date.now(),
        stream: streamName,
        level: this.extractLogLevel(logEntry),
        message: logEntry.message || logEntry,
        fields: this.parseLogFields(logEntry),
        raw: logEntry
      }
      
      // 添加到缓冲区
      this.logBuffer.push(processedLog)
      
      // 索引日志
      this.indexLog(processedLog)
      
      // 检查缓冲区大小
      if (this.logBuffer.length > this.maxBufferSize) {
        this.logBuffer = this.logBuffer.slice(-this.maxBufferSize * 0.8)
      }
    }
    
    // 提取日志级别
    extractLogLevel(logEntry) {
      const message = logEntry.message || logEntry.toString()
      
      if (message.includes('ERROR') || message.includes('error')) return 'error'
      if (message.includes('WARN') || message.includes('warn')) return 'warn'
      if (message.includes('INFO') || message.includes('info')) return 'info'
      if (message.includes('DEBUG') || message.includes('debug')) return 'debug'
      
      return 'info'
    }
    
    // 解析日志字段
    parseLogFields(logEntry) {
      const fields = {}
      
      if (typeof logEntry === 'object') {
        Object.assign(fields, logEntry)
      } else {
        // 尝试解析JSON
        try {
          const parsed = JSON.parse(logEntry)
          Object.assign(fields, parsed)
        } catch (error) {
          // 解析失败，使用原始消息
          fields.message = logEntry
        }
      }
      
      return fields
    }
    
    // 索引日志
    indexLog(log) {
      // 按时间索引
      const timeKey = Math.floor(log.timestamp / 60000) // 分钟级索引
      
      if (!this.indexedLogs.has(timeKey)) {
        this.indexedLogs.set(timeKey, [])
      }
      
      this.indexedLogs.get(timeKey).push(log.id)
      
      // 清理旧索引
      this.cleanupOldIndices()
    }
    
    // 搜索日志
    searchLogs(query) {
      const {
        startTime,
        endTime,
        level,
        stream,
        keyword,
        limit = 100
      } = query
      
      let results = this.logBuffer.filter(log => {
        if (startTime && log.timestamp < startTime) return false
        if (endTime && log.timestamp > endTime) return false
        if (level && log.level !== level) return false
        if (stream && log.stream !== stream) return false
        if (keyword && !this.matchesKeyword(log, keyword)) return false
        
        return true
      })
      
      // 按时间倒序排列
      results.sort((a, b) => b.timestamp - a.timestamp)
      
      return results.slice(0, limit)
    }
    
    // 关键词匹配
    matchesKeyword(log, keyword) {
      const searchText = `${log.message} ${JSON.stringify(log.fields)}`.toLowerCase()
      return searchText.includes(keyword.toLowerCase())
    }
    
    // 获取日志统计
    getLogStatistics(timeRange = 3600000) { // 默认1小时
      const cutoff = Date.now() - timeRange
      const recentLogs = this.logBuffer.filter(log => log.timestamp > cutoff)
      
      const stats = {
        total: recentLogs.length,
        byLevel: {},
        byStream: {},
        errorRate: 0,
        topErrors: []
      }
      
      recentLogs.forEach(log => {
        // 按级别统计
        stats.byLevel[log.level] = (stats.byLevel[log.level] || 0) + 1
        
        // 按流统计
        stats.byStream[log.stream] = (stats.byStream[log.stream] || 0) + 1
      })
      
      // 计算错误率
      const errorCount = (stats.byLevel.error || 0) + (stats.byLevel.warn || 0)
      stats.errorRate = stats.total > 0 ? (errorCount / stats.total) * 100 : 0
      
      // 获取高频错误
      stats.topErrors = this.getTopErrors(recentLogs)
      
      return stats
    }
    
    // 获取高频错误
    getTopErrors(logs, limit = 5) {
      const errorCounts = new Map()
      
      logs.filter(log => log.level === 'error').forEach(log => {
        const errorKey = log.message.substring(0, 100) // 截取前100字符作为key
        errorCounts.set(errorKey, (errorCounts.get(errorKey) || 0) + 1)
      })
      
      return Array.from(errorCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([message, count]) => ({ message, count }))
    }
    
    cleanupOldIndices() {
      const cutoff = Math.floor((Date.now() - 24 * 60 * 60 * 1000) / 60000)
      
      for (const timeKey of this.indexedLogs.keys()) {
        if (timeKey < cutoff) {
          this.indexedLogs.delete(timeKey)
        }
      }
    }
    
    generateLogId() {
      return `log_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`
    }
  }
  
  // 告警系统
  class AlertingSystem {
    constructor() {
      this.rules = new Map()
      this.alerts = new Map()
      this.channels = new Map()
      this.evaluationInterval = 60000 // 1分钟
      this.evaluationTimer = null
    }
    
    // 添加告警规则
    addRule(ruleConfig) {
      const rule = {
        id: ruleConfig.id || this.generateRuleId(),
        name: ruleConfig.name,
        description: ruleConfig.description,
        metric: ruleConfig.metric,
        condition: ruleConfig.condition,
        threshold: ruleConfig.threshold,
        duration: ruleConfig.duration || 300000, // 5分钟
        severity: ruleConfig.severity || 'warning',
        channels: ruleConfig.channels || ['default'],
        enabled: ruleConfig.enabled !== false,
        created: new Date(),
        lastEvaluated: null,
        evaluationCount: 0
      }
      
      this.rules.set(rule.id, rule)
      console.log(`添加告警规则: ${rule.name}`)
      
      return rule
    }
    
    // 添加通知渠道
    addChannel(name, channel) {
      this.channels.set(name, channel)
      console.log(`添加通知渠道: ${name}`)
    }
    
    // 启动告警评估
    startEvaluation() {
      if (this.evaluationTimer) {
        return
      }
      
      console.log('启动告警评估')
      
      this.evaluationTimer = setInterval(() => {
        this.evaluateAllRules()
      }, this.evaluationInterval)
    }
    
    // 停止告警评估
    stopEvaluation() {
      if (this.evaluationTimer) {
        clearInterval(this.evaluationTimer)
        this.evaluationTimer = null
        console.log('停止告警评估')
      }
    }
    
    // 评估所有规则
    async evaluateAllRules() {
      for (const rule of this.rules.values()) {
        if (rule.enabled) {
          try {
            await this.evaluateRule(rule)
          } catch (error) {
            console.error(`规则评估失败: ${rule.name}`, error)
          }
        }
      }
    }
    
    // 评估单个规则
    async evaluateRule(rule) {
      rule.lastEvaluated = new Date()
      rule.evaluationCount++
      
      // 获取指标数据
      const metricValue = await this.getMetricValue(rule.metric)
      
      if (metricValue === null) {
        return
      }
      
      // 评估条件
      const conditionMet = this.evaluateCondition(metricValue, rule.condition, rule.threshold)
      
      if (conditionMet) {
        await this.handleAlertCondition(rule, metricValue)
      } else {
        await this.handleNormalCondition(rule)
      }
    }
    
    // 获取指标值
    async getMetricValue(metricQuery) {
      // 这里应该调用指标收集器获取实际数据
      // 简化为随机值
      return Math.random() * 100
    }
    
    // 评估条件
    evaluateCondition(value, condition, threshold) {
      switch (condition) {
        case 'gt': return value > threshold
        case 'gte': return value >= threshold
        case 'lt': return value < threshold
        case 'lte': return value <= threshold
        case 'eq': return value === threshold
        case 'neq': return value !== threshold
        default: return false
      }
    }
    
    // 处理告警条件
    async handleAlertCondition(rule, value) {
      const alertId = `${rule.id}_${Date.now()}`
      
      let alert = this.alerts.get(rule.id)
      
      if (!alert) {
        // 创建新告警
        alert = {
          id: alertId,
          ruleId: rule.id,
          ruleName: rule.name,
          severity: rule.severity,
          status: 'firing',
          value: value,
          threshold: rule.threshold,
          startTime: new Date(),
          endTime: null,
          duration: 0,
          notificationsSent: 0,
          lastNotification: null
        }
        
        this.alerts.set(rule.id, alert)
        
        console.log(`触发告警: ${rule.name} (值: ${value}, 阈值: ${rule.threshold})`)
        
        // 发送通知
        await this.sendNotifications(alert, rule)
        
      } else {
        // 更新现有告警
        alert.value = value
        alert.duration = Date.now() - alert.startTime.getTime()
        
        // 检查是否需要重复通知
        if (this.shouldRepeatNotification(alert, rule)) {
          await this.sendNotifications(alert, rule)
        }
      }
    }
    
    // 处理正常条件
    async handleNormalCondition(rule) {
      const alert = this.alerts.get(rule.id)
      
      if (alert && alert.status === 'firing') {
        // 告警恢复
        alert.status = 'resolved'
        alert.endTime = new Date()
        
        console.log(`告警恢复: ${rule.name}`)
        
        // 发送恢复通知
        await this.sendRecoveryNotifications(alert, rule)
        
        // 从活跃告警中移除
        this.alerts.delete(rule.id)
      }
    }
    
    // 发送通知
    async sendNotifications(alert, rule) {
      for (const channelName of rule.channels) {
        const channel = this.channels.get(channelName)
        
        if (channel) {
          try {
            await channel.sendAlert(alert, rule)
            
            alert.notificationsSent++
            alert.lastNotification = new Date()
            
          } catch (error) {
            console.error(`通知发送失败: ${channelName}`, error)
          }
        }
      }
    }
    
    // 发送恢复通知
    async sendRecoveryNotifications(alert, rule) {
      for (const channelName of rule.channels) {
        const channel = this.channels.get(channelName)
        
        if (channel && channel.sendRecovery) {
          try {
            await channel.sendRecovery(alert, rule)
          } catch (error) {
            console.error(`恢复通知发送失败: ${channelName}`, error)
          }
        }
      }
    }
    
    // 检查是否需要重复通知
    shouldRepeatNotification(alert, rule) {
      const repeatInterval = rule.repeatInterval || 3600000 // 默认1小时
      
      if (!alert.lastNotification) {
        return true
      }
      
      return Date.now() - alert.lastNotification.getTime() > repeatInterval
    }
    
    generateRuleId() {
      return `rule_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
    }
    
    // 获取告警统计
    getAlertStatistics() {
      const activeAlerts = Array.from(this.alerts.values())
      
      return {
        totalRules: this.rules.size,
        enabledRules: Array.from(this.rules.values()).filter(r => r.enabled).length,
        activeAlerts: activeAlerts.length,
        alertsBySeverity: {
          critical: activeAlerts.filter(a => a.severity === 'critical').length,
          warning: activeAlerts.filter(a => a.severity === 'warning').length,
          info: activeAlerts.filter(a => a.severity === 'info').length
        },
        channels: Array.from(this.channels.keys())
      }
    }
  }
  
  // 邮件通知渠道
  createEmailChannel(config) {
    return {
      name: 'email',
      async sendAlert(alert, rule) {
        const subject = `[${alert.severity.toUpperCase()}] ${rule.name}`
        const body = `
          告警规则: ${rule.name}
          严重程度: ${alert.severity}
          当前值: ${alert.value}
          阈值: ${alert.threshold}
          开始时间: ${alert.startTime.toISOString()}
          描述: ${rule.description}
        `
        
        console.log(`发送邮件告警: ${subject}`)
        // 这里实现实际的邮件发送逻辑
      },
      
      async sendRecovery(alert, rule) {
        const subject = `[RESOLVED] ${rule.name}`
        const body = `
          告警规则: ${rule.name} 已恢复
          持续时间: ${alert.duration}ms
          恢复时间: ${alert.endTime.toISOString()}
        `
        
        console.log(`发送恢复邮件: ${subject}`)
      }
    }
  }
  
  // 启动监控平台
  async start() {
    console.log('启动综合监控平台...')
    
    // 注册系统指标收集器
    const systemCollector = this.metricsCollector.createSystemMetricsCollector()
    this.metricsCollector.registerCollector('system', systemCollector)
    
    // 注册HTTP指标收集器
    const httpCollector = this.metricsCollector.createHttpMetricsCollector()
    this.metricsCollector.registerCollector('http', httpCollector)
    
    // 启动指标收集
    this.metricsCollector.startCollection()
    
    // 添加默认通知渠道
    const emailChannel = this.createEmailChannel({
      smtp: 'smtp.example.com',
      from: 'monitoring@example.com',
      to: ['admin@example.com']
    })
    this.alertingSystem.addChannel('email', emailChannel)
    
    // 启动告警评估
    this.alertingSystem.startEvaluation()
    
    console.log('综合监控平台启动完成')
  }
  
  // 停止监控平台
  async stop() {
    console.log('停止综合监控平台...')
    
    this.metricsCollector.stopCollection()
    this.alertingSystem.stopEvaluation()
    
    console.log('综合监控平台停止完成')
  }
  
  // 获取平台状态
  getPlatformStatus() {
    return {
      metrics: this.metricsCollector.getMetricsStatistics(),
      logs: this.logsAggregator.getLogStatistics(),
      alerts: this.alertingSystem.getAlertStatistics(),
      timestamp: new Date()
    }
  }
}

// 使用示例
async function demonstrateMonitoring() {
  console.log('=== 系统监控演示 ===')
  
  const platform = new ComprehensiveMonitoringPlatform()
  
  // 启动监控平台
  await platform.start()
  
  // 添加告警规则
  platform.alertingSystem.addRule({
    name: 'High CPU Usage',
    description: 'CPU使用率过高',
    metric: 'system.cpu_usage_percent',
    condition: 'gt',
    threshold: 80,
    severity: 'warning',
    channels: ['email']
  })
  
  platform.alertingSystem.addRule({
    name: 'High Memory Usage',
    description: '内存使用率过高',
    metric: 'system.memory_usage_bytes',
    condition: 'gt',
    threshold: 1000000000, // 1GB
    severity: 'critical',
    channels: ['email']
  })
  
  // 模拟日志流
  const logStream = {
    on: (event, callback) => {
      // 模拟日志事件
      setInterval(() => {
        const logEntry = {
          level: Math.random() > 0.9 ? 'error' : 'info',
          message: `Sample log message ${Date.now()}`,
          timestamp: new Date(),
          service: 'web-server'
        }
        callback(logEntry)
      }, 2000)
    }
  }
  
  platform.logsAggregator.addLogStream('application', logStream)
  
  // 等待一段时间收集数据
  await new Promise(resolve => setTimeout(resolve, 10000))
  
  // 查询指标
  const metricsQuery = {
    metric: 'system.cpu_usage_percent',
    startTime: Date.now() - 600000, // 10分钟前
    endTime: Date.now(),
    step: 60000, // 1分钟
    aggregation: 'avg'
  }
  
  const metricsData = platform.metricsCollector.queryMetrics(metricsQuery)
  console.log('指标查询结果:', metricsData?.length || 0, '个数据点')
  
  // 搜索日志
  const logQuery = {
    startTime: Date.now() - 600000,
    endTime: Date.now(),
    level: 'error',
    limit: 10
  }
  
  const logs = platform.logsAggregator.searchLogs(logQuery)
  console.log('日志搜索结果:', logs.length, '条')
  
  // 获取平台状态
  const status = platform.getPlatformStatus()
  console.log('监控平台状态:')
  console.log('- 指标数量:', status.metrics.totalMetrics)
  console.log('- 数据点数量:', status.metrics.totalDataPoints)
  console.log('- 日志总数:', status.logs.total)
  console.log('- 活跃告警:', status.alerts.activeAlerts)
  
  // 停止监控平台
  await platform.stop()
  
  console.log('系统监控演示完成')
}

module.exports = {
  ComprehensiveMonitoringPlatform
}
```

## 📚 最佳实践总结

1. **多维度监控**：指标、日志、追踪、健康检查的全面覆盖
2. **分层监控体系**：基础设施、应用、业务的分层监控
3. **智能告警**：基于阈值和异常检测的智能告警机制
4. **可视化展示**：直观的仪表板和图表展示
5. **日志聚合**：统一的日志收集、解析和搜索
6. **性能分析**：深入的性能瓶颈分析和优化建议
7. **自动化运维**：基于监控数据的自动化运维决策
8. **可观测性**：端到端的系统可观测性建设

通过掌握系统监控技术，您将能够构建高效的运维监控体系，确保系统稳定运行。
