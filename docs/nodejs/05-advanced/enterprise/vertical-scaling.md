# 垂直扩展

## 📖 概述

垂直扩展（Vertical Scaling）通过增加单个服务器的资源（CPU、内存、存储）来提高系统性能。虽然存在硬件上限，但垂直扩展实现简单，是许多应用的首选扩展方式。

## 🎯 学习目标

- 理解垂直扩展的核心概念和适用场景
- 掌握资源监控和容量规划技术
- 学习动态资源调整和优化策略
- 实现智能的垂直扩展管理系统

## 📊 垂直扩展管理

### 1. 资源管理框架

```javascript
// 垂直扩展资源管理框架
class VerticalScalingManager {
  constructor(config = {}) {
    this.config = config
    this.resourceMonitor = new ResourceMonitor()
    this.capacityPlanner = new CapacityPlanner()
    this.resourceOptimizer = new ResourceOptimizer()
    this.scalingExecutor = new ScalingExecutor()
    this.performanceProfiler = new PerformanceProfiler()
    this.costAnalyzer = new CostAnalyzer()
  }
  
  // 资源监控器
  class ResourceMonitor {
    constructor() {
      this.metrics = new Map()
      this.thresholds = {
        cpu: { warning: 70, critical: 85 },
        memory: { warning: 75, critical: 90 },
        disk: { warning: 80, critical: 95 },
        network: { warning: 80, critical: 95 }
      }
      this.alerts = []
      this.monitoringInterval = null
    }
    
    // 开始监控
    startMonitoring(intervalMs = 10000) {
      if (this.monitoringInterval) {
        console.log('资源监控已在运行')
        return
      }
      
      console.log('开始资源监控')
      
      this.monitoringInterval = setInterval(async () => {
        await this.collectMetrics()
      }, intervalMs)
    }
    
    // 停止监控
    stopMonitoring() {
      if (this.monitoringInterval) {
        clearInterval(this.monitoringInterval)
        this.monitoringInterval = null
        console.log('停止资源监控')
      }
    }
    
    // 收集系统指标
    async collectMetrics() {
      try {
        const metrics = await this.gatherSystemMetrics()
        
        this.recordMetrics(metrics)
        this.checkThresholds(metrics)
        
      } catch (error) {
        console.error('指标收集失败:', error)
      }
    }
    
    async gatherSystemMetrics() {
      // 模拟收集系统指标
      const metrics = {
        timestamp: new Date(),
        cpu: {
          usage: Math.random() * 100,
          cores: 4,
          loadAverage: Math.random() * 4
        },
        memory: {
          total: 8192, // MB
          used: Math.random() * 8192,
          available: 0,
          usage: 0
        },
        disk: {
          total: 100, // GB
          used: Math.random() * 100,
          available: 0,
          usage: 0,
          iops: Math.random() * 1000
        },
        network: {
          bytesIn: Math.random() * 1000000,
          bytesOut: Math.random() * 1000000,
          packetsIn: Math.random() * 10000,
          packetsOut: Math.random() * 10000,
          bandwidth: 1000 // Mbps
        },
        processes: {
          total: Math.floor(Math.random() * 200),
          running: Math.floor(Math.random() * 50),
          sleeping: Math.floor(Math.random() * 150)
        }
      }
      
      // 计算衍生指标
      metrics.memory.available = metrics.memory.total - metrics.memory.used
      metrics.memory.usage = (metrics.memory.used / metrics.memory.total) * 100
      
      metrics.disk.available = metrics.disk.total - metrics.disk.used
      metrics.disk.usage = (metrics.disk.used / metrics.disk.total) * 100
      
      metrics.network.utilizationIn = (metrics.network.bytesIn * 8 / 1000000) / metrics.network.bandwidth * 100
      metrics.network.utilizationOut = (metrics.network.bytesOut * 8 / 1000000) / metrics.network.bandwidth * 100
      
      return metrics
    }
    
    recordMetrics(metrics) {
      const key = 'system_metrics'
      
      if (!this.metrics.has(key)) {
        this.metrics.set(key, [])
      }
      
      const history = this.metrics.get(key)
      history.push(metrics)
      
      // 保持最近1小时的数据 (360个点，10秒间隔)
      if (history.length > 360) {
        history.shift()
      }
    }
    
    checkThresholds(metrics) {
      this.checkResourceThreshold('cpu', metrics.cpu.usage, metrics.timestamp)
      this.checkResourceThreshold('memory', metrics.memory.usage, metrics.timestamp)
      this.checkResourceThreshold('disk', metrics.disk.usage, metrics.timestamp)
      
      const networkUtilization = Math.max(metrics.network.utilizationIn, metrics.network.utilizationOut)
      this.checkResourceThreshold('network', networkUtilization, metrics.timestamp)
    }
    
    checkResourceThreshold(resourceType, value, timestamp) {
      const threshold = this.thresholds[resourceType]
      
      if (!threshold) return
      
      let alertLevel = null
      
      if (value >= threshold.critical) {
        alertLevel = 'critical'
      } else if (value >= threshold.warning) {
        alertLevel = 'warning'
      }
      
      if (alertLevel) {
        this.createAlert(resourceType, value, alertLevel, timestamp)
      }
    }
    
    createAlert(resourceType, value, level, timestamp) {
      const alert = {
        id: this.generateAlertId(),
        timestamp: timestamp,
        type: 'resource_threshold',
        resource: resourceType,
        value: value.toFixed(2),
        level: level,
        threshold: this.thresholds[resourceType][level],
        message: `${resourceType.toUpperCase()} ${level}: ${value.toFixed(2)}% (阈值: ${this.thresholds[resourceType][level]}%)`
      }
      
      this.alerts.push(alert)
      
      // 保持最近100个告警
      if (this.alerts.length > 100) {
        this.alerts.shift()
      }
      
      console.warn(`资源告警: ${alert.message}`)
    }
    
    // 获取资源统计
    getResourceStats(timeRange = 3600000) { // 默认1小时
      const cutoff = Date.now() - timeRange
      const history = this.metrics.get('system_metrics') || []
      
      const recentMetrics = history.filter(m => 
        m.timestamp.getTime() > cutoff
      )
      
      if (recentMetrics.length === 0) {
        return null
      }
      
      const stats = {
        timeRange,
        dataPoints: recentMetrics.length,
        cpu: this.calculateResourceStats(recentMetrics, 'cpu.usage'),
        memory: this.calculateResourceStats(recentMetrics, 'memory.usage'),
        disk: this.calculateResourceStats(recentMetrics, 'disk.usage'),
        network: {
          in: this.calculateResourceStats(recentMetrics, 'network.utilizationIn'),
          out: this.calculateResourceStats(recentMetrics, 'network.utilizationOut')
        }
      }
      
      return stats
    }
    
    calculateResourceStats(metrics, path) {
      const values = metrics.map(m => this.getNestedValue(m, path)).filter(v => v !== undefined)
      
      if (values.length === 0) return null
      
      const sorted = [...values].sort((a, b) => a - b)
      
      return {
        min: Math.min(...values),
        max: Math.max(...values),
        avg: values.reduce((sum, v) => sum + v, 0) / values.length,
        p50: this.percentile(sorted, 0.5),
        p95: this.percentile(sorted, 0.95),
        p99: this.percentile(sorted, 0.99),
        current: values[values.length - 1]
      }
    }
    
    getNestedValue(obj, path) {
      return path.split('.').reduce((current, key) => 
        current && current[key] !== undefined ? current[key] : undefined, obj)
    }
    
    percentile(sortedValues, p) {
      const index = Math.ceil(sortedValues.length * p) - 1
      return sortedValues[Math.max(0, index)]
    }
    
    generateAlertId() {
      return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
    }
    
    // 获取活跃告警
    getActiveAlerts(severityFilter = null) {
      const thirtyMinutesAgo = Date.now() - 30 * 60 * 1000
      
      let activeAlerts = this.alerts.filter(alert => 
        alert.timestamp.getTime() > thirtyMinutesAgo
      )
      
      if (severityFilter) {
        activeAlerts = activeAlerts.filter(alert => alert.level === severityFilter)
      }
      
      return activeAlerts.sort((a, b) => b.timestamp - a.timestamp)
    }
  }
  
  // 容量规划器
  class CapacityPlanner {
    constructor() {
      this.resourceProfiles = new Map()
      this.growthProjections = new Map()
    }
    
    // 创建资源配置文件
    createResourceProfile(profileConfig) {
      const profile = {
        id: profileConfig.id || this.generateProfileId(),
        name: profileConfig.name,
        currentResources: profileConfig.currentResources,
        maxResources: profileConfig.maxResources,
        constraints: profileConfig.constraints || {},
        upgradeOptions: this.generateUpgradeOptions(profileConfig.currentResources),
        created: new Date()
      }
      
      this.resourceProfiles.set(profile.id, profile)
      console.log(`资源配置文件创建: ${profile.name}`)
      
      return profile
    }
    
    generateUpgradeOptions(currentResources) {
      const options = []
      
      // CPU升级选项
      const cpuOptions = [2, 4, 8, 16, 32, 64]
      const nextCpuOptions = cpuOptions.filter(cpu => cpu > currentResources.cpu)
      
      nextCpuOptions.forEach(cpu => {
        options.push({
          type: 'cpu_upgrade',
          description: `CPU升级到 ${cpu} 核心`,
          changes: { cpu: cpu },
          estimatedCost: this.estimateUpgradeCost('cpu', currentResources.cpu, cpu),
          impact: this.estimatePerformanceImpact('cpu', currentResources.cpu, cpu)
        })
      })
      
      // 内存升级选项
      const memoryOptions = [4, 8, 16, 32, 64, 128] // GB
      const nextMemoryOptions = memoryOptions.filter(mem => mem > currentResources.memory)
      
      nextMemoryOptions.forEach(memory => {
        options.push({
          type: 'memory_upgrade',
          description: `内存升级到 ${memory} GB`,
          changes: { memory: memory },
          estimatedCost: this.estimateUpgradeCost('memory', currentResources.memory, memory),
          impact: this.estimatePerformanceImpact('memory', currentResources.memory, memory)
        })
      })
      
      // 存储升级选项
      const storageOptions = [100, 200, 500, 1000, 2000] // GB
      const nextStorageOptions = storageOptions.filter(storage => storage > currentResources.storage)
      
      nextStorageOptions.forEach(storage => {
        options.push({
          type: 'storage_upgrade',
          description: `存储升级到 ${storage} GB`,
          changes: { storage: storage },
          estimatedCost: this.estimateUpgradeCost('storage', currentResources.storage, storage),
          impact: this.estimatePerformanceImpact('storage', currentResources.storage, storage)
        })
      })
      
      return options
    }
    
    estimateUpgradeCost(resourceType, currentValue, newValue) {
      const costPerUnit = {
        cpu: 50,    // $50 per core per month
        memory: 10, // $10 per GB per month
        storage: 1  // $1 per GB per month
      }
      
      const additionalUnits = newValue - currentValue
      return additionalUnits * costPerUnit[resourceType]
    }
    
    estimatePerformanceImpact(resourceType, currentValue, newValue) {
      const improvementRatio = newValue / currentValue
      
      const impactFactors = {
        cpu: 0.8,      // CPU升级80%效果转化
        memory: 0.6,   // 内存升级60%效果转化
        storage: 0.4   // 存储升级40%效果转化
      }
      
      const expectedImprovement = (improvementRatio - 1) * impactFactors[resourceType] * 100
      
      return {
        type: resourceType,
        expectedImprovement: `${expectedImprovement.toFixed(1)}%`,
        confidence: this.calculateConfidence(resourceType, improvementRatio)
      }
    }
    
    calculateConfidence(resourceType, improvementRatio) {
      // 升级幅度越大，信心度越低
      if (improvementRatio <= 2) return 'high'
      if (improvementRatio <= 4) return 'medium'
      return 'low'
    }
    
    // 分析扩展需求
    analyzeScalingNeed(resourceStats, profileId) {
      const profile = this.resourceProfiles.get(profileId)
      
      if (!profile) {
        throw new Error(`资源配置文件不存在: ${profileId}`)
      }
      
      const analysis = {
        profileId,
        timestamp: new Date(),
        recommendations: [],
        urgency: 'low',
        totalCost: 0
      }
      
      // 分析CPU需求
      if (resourceStats.cpu && resourceStats.cpu.p95 > 80) {
        const cpuRecommendation = this.generateResourceRecommendation(
          'cpu', 
          resourceStats.cpu, 
          profile.currentResources.cpu,
          profile.upgradeOptions.filter(opt => opt.type === 'cpu_upgrade')
        )
        
        if (cpuRecommendation) {
          analysis.recommendations.push(cpuRecommendation)
          analysis.totalCost += cpuRecommendation.cost
          
          if (resourceStats.cpu.p95 > 90) {
            analysis.urgency = 'high'
          } else {
            analysis.urgency = 'medium'
          }
        }
      }
      
      // 分析内存需求
      if (resourceStats.memory && resourceStats.memory.p95 > 85) {
        const memoryRecommendation = this.generateResourceRecommendation(
          'memory',
          resourceStats.memory,
          profile.currentResources.memory,
          profile.upgradeOptions.filter(opt => opt.type === 'memory_upgrade')
        )
        
        if (memoryRecommendation) {
          analysis.recommendations.push(memoryRecommendation)
          analysis.totalCost += memoryRecommendation.cost
          
          if (resourceStats.memory.p95 > 95) {
            analysis.urgency = 'high'
          } else if (analysis.urgency !== 'high') {
            analysis.urgency = 'medium'
          }
        }
      }
      
      // 分析存储需求
      if (resourceStats.disk && resourceStats.disk.p95 > 90) {
        const storageRecommendation = this.generateResourceRecommendation(
          'storage',
          resourceStats.disk,
          profile.currentResources.storage,
          profile.upgradeOptions.filter(opt => opt.type === 'storage_upgrade')
        )
        
        if (storageRecommendation) {
          analysis.recommendations.push(storageRecommendation)
          analysis.totalCost += storageRecommendation.cost
          
          if (resourceStats.disk.p95 > 95) {
            analysis.urgency = 'high'
          }
        }
      }
      
      return analysis
    }
    
    generateResourceRecommendation(resourceType, stats, currentValue, upgradeOptions) {
      if (!upgradeOptions.length) return null
      
      // 选择最小的满足需求的升级选项
      const targetUtilization = 70 // 目标利用率70%
      const requiredCapacity = currentValue * (stats.p95 / targetUtilization)
      
      const suitableOption = upgradeOptions.find(option => 
        option.changes[resourceType] >= requiredCapacity
      )
      
      if (!suitableOption) {
        // 选择最大的升级选项
        return upgradeOptions[upgradeOptions.length - 1]
      }
      
      return {
        resourceType,
        currentValue,
        recommendedValue: suitableOption.changes[resourceType],
        currentUtilization: stats.p95,
        targetUtilization,
        description: suitableOption.description,
        cost: suitableOption.estimatedCost,
        impact: suitableOption.impact,
        urgency: stats.p95 > 95 ? 'critical' : stats.p95 > 85 ? 'high' : 'medium'
      }
    }
    
    generateProfileId() {
      return `profile_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
    }
    
    // 预测未来需求
    predictFutureNeeds(profileId, growthRate, timeHorizon) {
      const profile = this.resourceProfiles.get(profileId)
      
      if (!profile) {
        throw new Error(`资源配置文件不存在: ${profileId}`)
      }
      
      const predictions = []
      
      for (let month = 1; month <= timeHorizon; month++) {
        const growthFactor = Math.pow(1 + growthRate / 100, month)
        
        const predictedNeeds = {
          month,
          cpu: profile.currentResources.cpu * growthFactor,
          memory: profile.currentResources.memory * growthFactor,
          storage: profile.currentResources.storage * growthFactor,
          networkBandwidth: (profile.currentResources.networkBandwidth || 1000) * growthFactor
        }
        
        // 检查是否超出当前配置限制
        const needsUpgrade = this.checkUpgradeNeed(predictedNeeds, profile.currentResources)
        
        predictions.push({
          ...predictedNeeds,
          needsUpgrade,
          recommendedUpgrades: needsUpgrade ? this.getRecommendedUpgrades(predictedNeeds, profile) : []
        })
      }
      
      return {
        profileId,
        growthRate,
        timeHorizon,
        predictions,
        summary: this.generatePredictionSummary(predictions)
      }
    }
    
    checkUpgradeNeed(predicted, current) {
      return predicted.cpu > current.cpu * 0.8 ||
             predicted.memory > current.memory * 0.8 ||
             predicted.storage > current.storage * 0.8
    }
    
    getRecommendedUpgrades(predicted, profile) {
      const upgrades = []
      
      if (predicted.cpu > profile.currentResources.cpu * 0.8) {
        const cpuOption = profile.upgradeOptions.find(opt => 
          opt.type === 'cpu_upgrade' && opt.changes.cpu >= predicted.cpu * 1.25
        )
        if (cpuOption) upgrades.push(cpuOption)
      }
      
      if (predicted.memory > profile.currentResources.memory * 0.8) {
        const memoryOption = profile.upgradeOptions.find(opt => 
          opt.type === 'memory_upgrade' && opt.changes.memory >= predicted.memory * 1.25
        )
        if (memoryOption) upgrades.push(memoryOption)
      }
      
      if (predicted.storage > profile.currentResources.storage * 0.8) {
        const storageOption = profile.upgradeOptions.find(opt => 
          opt.type === 'storage_upgrade' && opt.changes.storage >= predicted.storage * 1.25
        )
        if (storageOption) upgrades.push(storageOption)
      }
      
      return upgrades
    }
    
    generatePredictionSummary(predictions) {
      const firstUpgradeMonth = predictions.find(p => p.needsUpgrade)?.month
      const totalUpgrades = predictions.filter(p => p.needsUpgrade).length
      
      return {
        firstUpgradeNeeded: firstUpgradeMonth,
        monthsRequiringUpgrade: totalUpgrades,
        upgradeFrequency: totalUpgrades > 0 ? predictions.length / totalUpgrades : 0
      }
    }
  }
  
  // 资源优化器
  class ResourceOptimizer {
    constructor() {
      this.optimizationRules = new Map()
      this.optimizationHistory = []
    }
    
    // 添加优化规则
    addOptimizationRule(rule) {
      this.optimizationRules.set(rule.id, rule)
      console.log(`优化规则添加: ${rule.name}`)
    }
    
    // 分析优化机会
    analyzeOptimizationOpportunities(resourceStats, applicationMetrics = {}) {
      const opportunities = []
      
      // CPU优化分析
      if (resourceStats.cpu) {
        const cpuOpportunities = this.analyzeCPUOptimization(resourceStats.cpu, applicationMetrics)
        opportunities.push(...cpuOpportunities)
      }
      
      // 内存优化分析
      if (resourceStats.memory) {
        const memoryOpportunities = this.analyzeMemoryOptimization(resourceStats.memory, applicationMetrics)
        opportunities.push(...memoryOpportunities)
      }
      
      // 存储优化分析
      if (resourceStats.disk) {
        const storageOpportunities = this.analyzeStorageOptimization(resourceStats.disk, applicationMetrics)
        opportunities.push(...storageOpportunities)
      }
      
      return {
        timestamp: new Date(),
        totalOpportunities: opportunities.length,
        opportunities: opportunities.sort((a, b) => b.impact - a.impact)
      }
    }
    
    analyzeCPUOptimization(cpuStats, appMetrics) {
      const opportunities = []
      
      // CPU利用率过低
      if (cpuStats.avg < 30) {
        opportunities.push({
          type: 'cpu_overprovisioning',
          category: 'cost_optimization',
          description: 'CPU利用率过低，考虑降级配置',
          currentUtilization: cpuStats.avg,
          potentialSavings: 30,
          impact: 7,
          recommendations: [
            '监控一段时间确认利用率稳定偏低',
            '考虑降级到更小的CPU配置',
            '评估应用的CPU需求模式'
          ]
        })
      }
      
      // CPU利用率过高且存在性能问题
      if (cpuStats.p95 > 85 && appMetrics.responseTime > 1000) {
        opportunities.push({
          type: 'cpu_bottleneck',
          category: 'performance_optimization',
          description: 'CPU成为性能瓶颈，需要升级',
          currentUtilization: cpuStats.p95,
          expectedImprovement: '50%',
          impact: 9,
          recommendations: [
            '立即升级CPU配置',
            '优化应用代码减少CPU密集计算',
            '考虑使用缓存减少CPU负载'
          ]
        })
      }
      
      return opportunities
    }
    
    analyzeMemoryOptimization(memoryStats, appMetrics) {
      const opportunities = []
      
      // 内存利用率过低
      if (memoryStats.avg < 40) {
        opportunities.push({
          type: 'memory_overprovisioning',
          category: 'cost_optimization',
          description: '内存利用率过低，考虑降级配置',
          currentUtilization: memoryStats.avg,
          potentialSavings: 25,
          impact: 6,
          recommendations: [
            '分析应用内存使用模式',
            '考虑降级到更小的内存配置',
            '检查是否存在内存泄漏'
          ]
        })
      }
      
      // 内存压力过大
      if (memoryStats.p95 > 90) {
        opportunities.push({
          type: 'memory_pressure',
          category: 'performance_optimization',
          description: '内存压力过大，可能影响性能',
          currentUtilization: memoryStats.p95,
          expectedImprovement: '40%',
          impact: 8,
          recommendations: [
            '增加内存配置',
            '优化应用内存使用',
            '实施更激进的垃圾回收策略'
          ]
        })
      }
      
      return opportunities
    }
    
    analyzeStorageOptimization(diskStats, appMetrics) {
      const opportunities = []
      
      // 存储空间不足
      if (diskStats.p95 > 85) {
        opportunities.push({
          type: 'storage_space_low',
          category: 'capacity_optimization',
          description: '存储空间不足，需要扩容',
          currentUtilization: diskStats.p95,
          urgency: 'high',
          impact: 8,
          recommendations: [
            '立即扩展存储容量',
            '清理不必要的文件',
            '实施数据归档策略'
          ]
        })
      }
      
      return opportunities
    }
    
    // 生成优化计划
    generateOptimizationPlan(opportunities, constraints = {}) {
      const plan = {
        id: this.generatePlanId(),
        timestamp: new Date(),
        phases: [],
        totalEstimatedSavings: 0,
        totalEstimatedCost: 0,
        estimatedROI: 0
      }
      
      // 按优先级和影响度分组
      const highImpact = opportunities.filter(opp => opp.impact >= 8)
      const mediumImpact = opportunities.filter(opp => opp.impact >= 5 && opp.impact < 8)
      const lowImpact = opportunities.filter(opp => opp.impact < 5)
      
      // 第一阶段：高影响度优化
      if (highImpact.length > 0) {
        plan.phases.push({
          phase: 1,
          name: '高优先级优化',
          duration: '1-2周',
          opportunities: highImpact,
          estimatedCost: this.calculatePhaseCost(highImpact),
          estimatedSavings: this.calculatePhaseSavings(highImpact)
        })
      }
      
      // 第二阶段：中等影响度优化
      if (mediumImpact.length > 0) {
        plan.phases.push({
          phase: 2,
          name: '中等优先级优化',
          duration: '2-4周',
          opportunities: mediumImpact,
          estimatedCost: this.calculatePhaseCost(mediumImpact),
          estimatedSavings: this.calculatePhaseSavings(mediumImpact)
        })
      }
      
      // 第三阶段：低影响度优化
      if (lowImpact.length > 0) {
        plan.phases.push({
          phase: 3,
          name: '长期优化',
          duration: '1-3个月',
          opportunities: lowImpact,
          estimatedCost: this.calculatePhaseCost(lowImpact),
          estimatedSavings: this.calculatePhaseSavings(lowImpact)
        })
      }
      
      // 计算总体指标
      plan.totalEstimatedCost = plan.phases.reduce((sum, phase) => sum + phase.estimatedCost, 0)
      plan.totalEstimatedSavings = plan.phases.reduce((sum, phase) => sum + phase.estimatedSavings, 0)
      plan.estimatedROI = plan.totalEstimatedCost > 0 ? 
        (plan.totalEstimatedSavings - plan.totalEstimatedCost) / plan.totalEstimatedCost * 100 : 0
      
      return plan
    }
    
    calculatePhaseCost(opportunities) {
      return opportunities.reduce((sum, opp) => {
        return sum + (opp.implementationCost || 1000) // 默认实施成本
      }, 0)
    }
    
    calculatePhaseSavings(opportunities) {
      return opportunities.reduce((sum, opp) => {
        return sum + (opp.potentialSavings || 0)
      }, 0)
    }
    
    generatePlanId() {
      return `plan_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
    }
  }
  
  // 执行垂直扩展
  async executeVerticalScaling(scalingPlan) {
    console.log(`执行垂直扩展计划: ${scalingPlan.id}`)
    
    const execution = {
      planId: scalingPlan.id,
      startTime: new Date(),
      steps: [],
      status: 'running',
      errors: []
    }
    
    try {
      for (const phase of scalingPlan.phases) {
        const phaseResult = await this.executePhase(phase)
        execution.steps.push(phaseResult)
        
        if (!phaseResult.success) {
          throw new Error(`阶段执行失败: ${phase.name}`)
        }
      }
      
      execution.status = 'completed'
      execution.endTime = new Date()
      
      console.log(`垂直扩展完成: ${scalingPlan.id}`)
      
    } catch (error) {
      execution.status = 'failed'
      execution.endTime = new Date()
      execution.errors.push(error.message)
      
      console.error(`垂直扩展失败: ${scalingPlan.id}`, error)
    }
    
    return execution
  }
  
  async executePhase(phase) {
    console.log(`执行阶段: ${phase.name}`)
    
    const phaseExecution = {
      phase: phase.phase,
      name: phase.name,
      startTime: new Date(),
      actions: [],
      success: true
    }
    
    for (const opportunity of phase.opportunities) {
      try {
        const actionResult = await this.executeOptimization(opportunity)
        phaseExecution.actions.push(actionResult)
        
      } catch (error) {
        phaseExecution.success = false
        phaseExecution.actions.push({
          opportunity: opportunity.type,
          success: false,
          error: error.message
        })
      }
    }
    
    phaseExecution.endTime = new Date()
    
    return phaseExecution
  }
  
  async executeOptimization(opportunity) {
    console.log(`执行优化: ${opportunity.type}`)
    
    // 模拟优化执行
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    return {
      opportunity: opportunity.type,
      success: true,
      executedAt: new Date(),
      estimatedImpact: opportunity.expectedImprovement || '未知'
    }
  }
}

// 使用示例
async function demonstrateVerticalScaling() {
  console.log('=== 垂直扩展演示 ===')
  
  const manager = new VerticalScalingManager()
  
  // 创建资源配置文件
  const profile = manager.capacityPlanner.createResourceProfile({
    name: 'web-server-profile',
    currentResources: {
      cpu: 4,     // 4核
      memory: 8,  // 8GB
      storage: 100 // 100GB
    },
    maxResources: {
      cpu: 64,
      memory: 128,
      storage: 2000
    }
  })
  
  // 开始资源监控
  manager.resourceMonitor.startMonitoring(5000) // 5秒间隔
  
  // 等待收集一些数据
  await new Promise(resolve => setTimeout(resolve, 15000))
  
  // 获取资源统计
  const resourceStats = manager.resourceMonitor.getResourceStats()
  
  if (resourceStats) {
    console.log('CPU统计:', resourceStats.cpu)
    console.log('内存统计:', resourceStats.memory)
    
    // 分析扩展需求
    const scalingAnalysis = manager.capacityPlanner.analyzeScalingNeed(resourceStats, profile.id)
    console.log('扩展分析:', scalingAnalysis)
    
    // 分析优化机会
    const optimizationAnalysis = manager.resourceOptimizer.analyzeOptimizationOpportunities(resourceStats)
    console.log('优化机会:', optimizationAnalysis.opportunities.length, '个')
    
    // 生成优化计划
    if (optimizationAnalysis.opportunities.length > 0) {
      const optimizationPlan = manager.resourceOptimizer.generateOptimizationPlan(optimizationAnalysis.opportunities)
      console.log('优化计划:', optimizationPlan.phases.length, '个阶段')
      console.log('预估ROI:', optimizationPlan.estimatedROI.toFixed(2), '%')
    }
    
    // 预测未来需求
    const futurePrediction = manager.capacityPlanner.predictFutureNeeds(profile.id, 15, 12) // 15%增长率，12个月
    console.log('未来需求预测:', futurePrediction.summary)
  }
  
  // 停止监控
  manager.resourceMonitor.stopMonitoring()
  
  return manager
}

module.exports = {
  VerticalScalingManager
}
```

## 📚 最佳实践总结

1. **资源监控**：实时监控系统资源使用情况
2. **容量规划**：基于历史数据和增长预测进行容量规划
3. **性能分析**：深入分析性能瓶颈和优化机会
4. **成本优化**：平衡性能需求和成本控制
5. **渐进式升级**：分阶段进行资源升级避免风险
6. **自动化扩展**：基于指标的自动垂直扩展
7. **回滚机制**：保留回滚能力以应对升级问题
8. **监控告警**：建立完善的监控和告警体系

通过掌握垂直扩展技术，您将能够有效优化单机性能和资源利用效率。
