# 水平扩展

## 📖 概述

水平扩展（Horizontal Scaling）通过增加更多服务器实例来提高系统容量和性能。与垂直扩展不同，水平扩展具有理论上无限的扩展能力，是构建大规模分布式系统的关键技术。

## 🎯 学习目标

- 理解水平扩展的核心概念和优势
- 掌握负载均衡和服务发现机制
- 学习数据分片和状态管理技术
- 实现自动化的弹性扩展系统

## 📈 水平扩展架构

### 1. 扩展管理框架

```javascript
// 水平扩展管理框架
class HorizontalScalingFramework {
  constructor(config = {}) {
    this.config = config
    this.instanceManager = new InstanceManager()
    this.loadBalancer = new LoadBalancer()
    this.serviceDiscovery = new ServiceDiscovery()
    this.autoScaler = new AutoScaler()
    this.healthMonitor = new HealthMonitor()
    this.dataSharding = new DataShardingManager()
    this.sessionManager = new SessionManager()
    this.deploymentManager = new DeploymentManager()
  }
  
  // 实例管理器
  class InstanceManager {
    constructor() {
      this.instances = new Map()
      this.instanceGroups = new Map()
      this.templates = new Map()
      this.status = 'stopped'
    }
    
    // 创建实例模板
    createTemplate(templateConfig) {
      const template = {
        id: templateConfig.id || this.generateTemplateId(),
        name: templateConfig.name,
        image: templateConfig.image,
        instanceType: templateConfig.instanceType,
        resources: {
          cpu: templateConfig.resources.cpu,
          memory: templateConfig.resources.memory,
          storage: templateConfig.resources.storage
        },
        environment: templateConfig.environment || {},
        healthCheck: templateConfig.healthCheck,
        networking: templateConfig.networking,
        securityGroups: templateConfig.securityGroups || [],
        userData: templateConfig.userData,
        created: new Date()
      }
      
      this.templates.set(template.id, template)
      console.log(`实例模板创建: ${template.name}`)
      
      return template
    }
    
    // 创建实例组
    createInstanceGroup(groupConfig) {
      const group = {
        id: groupConfig.id || this.generateGroupId(),
        name: groupConfig.name,
        templateId: groupConfig.templateId,
        minSize: groupConfig.minSize || 1,
        maxSize: groupConfig.maxSize || 10,
        desiredCapacity: groupConfig.desiredCapacity || 2,
        availabilityZones: groupConfig.availabilityZones || ['default'],
        scalingPolicies: groupConfig.scalingPolicies || [],
        instances: new Set(),
        status: 'stopped',
        created: new Date()
      }
      
      this.instanceGroups.set(group.id, group)
      console.log(`实例组创建: ${group.name} (${group.minSize}-${group.maxSize})`)
      
      return group
    }
    
    // 启动实例
    async launchInstance(templateId, groupId, options = {}) {
      const template = this.templates.get(templateId)
      const group = groupId ? this.instanceGroups.get(groupId) : null
      
      if (!template) {
        throw new Error(`实例模板不存在: ${templateId}`)
      }
      
      const instance = {
        id: this.generateInstanceId(),
        templateId: templateId,
        groupId: groupId,
        name: `${template.name}-${Date.now()}`,
        status: 'launching',
        publicIp: null,
        privateIp: this.generatePrivateIp(),
        availabilityZone: options.availabilityZone || this.selectAvailabilityZone(group),
        resources: { ...template.resources },
        environment: { ...template.environment, ...options.environment },
        launched: new Date(),
        lastHealthCheck: null,
        healthStatus: 'unknown'
      }
      
      try {
        console.log(`启动实例: ${instance.name}`)
        
        // 模拟实例启动过程
        await this.performInstanceLaunch(instance, template)
        
        instance.status = 'running'
        instance.publicIp = this.generatePublicIp()
        
        this.instances.set(instance.id, instance)
        
        // 添加到实例组
        if (group) {
          group.instances.add(instance.id)
        }
        
        console.log(`实例启动成功: ${instance.name} (${instance.privateIp})`)
        
        return instance
        
      } catch (error) {
        instance.status = 'failed'
        console.error(`实例启动失败: ${instance.name}`, error)
        throw error
      }
    }
    
    async performInstanceLaunch(instance, template) {
      // 模拟创建虚拟机
      await this.delay(2000)
      
      // 模拟配置网络
      console.log(`配置网络: ${instance.name}`)
      await this.delay(1000)
      
      // 模拟安装软件
      console.log(`安装应用: ${instance.name}`)
      await this.delay(3000)
      
      // 模拟配置健康检查
      if (template.healthCheck) {
        console.log(`配置健康检查: ${instance.name}`)
        await this.delay(500)
      }
    }
    
    // 终止实例
    async terminateInstance(instanceId) {
      const instance = this.instances.get(instanceId)
      
      if (!instance) {
        throw new Error(`实例不存在: ${instanceId}`)
      }
      
      try {
        console.log(`终止实例: ${instance.name}`)
        
        instance.status = 'terminating'
        
        // 从负载均衡器移除
        await this.removeFromLoadBalancer(instance)
        
        // 优雅关闭应用
        await this.gracefulShutdown(instance)
        
        // 模拟资源清理
        await this.delay(1000)
        
        instance.status = 'terminated'
        instance.terminated = new Date()
        
        // 从实例组移除
        if (instance.groupId) {
          const group = this.instanceGroups.get(instance.groupId)
          if (group) {
            group.instances.delete(instanceId)
          }
        }
        
        console.log(`实例终止完成: ${instance.name}`)
        
        return true
        
      } catch (error) {
        console.error(`实例终止失败: ${instance.name}`, error)
        throw error
      }
    }
    
    async removeFromLoadBalancer(instance) {
      console.log(`从负载均衡器移除: ${instance.name}`)
      // 这里会调用负载均衡器的接口
      await this.delay(500)
    }
    
    async gracefulShutdown(instance) {
      console.log(`优雅关闭应用: ${instance.name}`)
      // 等待当前请求完成
      await this.delay(2000)
    }
    
    // 扩展实例组
    async scaleInstanceGroup(groupId, targetCapacity, reason = 'manual') {
      const group = this.instanceGroups.get(groupId)
      
      if (!group) {
        throw new Error(`实例组不存在: ${groupId}`)
      }
      
      const currentCapacity = group.instances.size
      
      if (targetCapacity === currentCapacity) {
        console.log(`实例组容量无需调整: ${group.name} (${currentCapacity})`)
        return
      }
      
      console.log(`调整实例组容量: ${group.name} ${currentCapacity} -> ${targetCapacity} (${reason})`)
      
      if (targetCapacity > currentCapacity) {
        // 扩容
        const instancesToAdd = targetCapacity - currentCapacity
        
        for (let i = 0; i < instancesToAdd; i++) {
          try {
            await this.launchInstance(group.templateId, groupId)
          } catch (error) {
            console.error(`扩容实例启动失败:`, error)
          }
        }
      } else {
        // 缩容
        const instancesToRemove = currentCapacity - targetCapacity
        const instanceIds = Array.from(group.instances)
        
        // 选择要移除的实例（优先移除最新创建的）
        const instancesToTerminate = instanceIds
          .map(id => this.instances.get(id))
          .sort((a, b) => b.launched - a.launched)
          .slice(0, instancesToRemove)
        
        for (const instance of instancesToTerminate) {
          try {
            await this.terminateInstance(instance.id)
          } catch (error) {
            console.error(`缩容实例终止失败:`, error)
          }
        }
      }
      
      group.desiredCapacity = targetCapacity
    }
    
    // 获取实例组状态
    getInstanceGroupStatus(groupId) {
      const group = this.instanceGroups.get(groupId)
      
      if (!group) {
        return null
      }
      
      const instances = Array.from(group.instances)
        .map(id => this.instances.get(id))
        .filter(instance => instance)
      
      const statusCounts = instances.reduce((counts, instance) => {
        counts[instance.status] = (counts[instance.status] || 0) + 1
        return counts
      }, {})
      
      return {
        groupId: group.id,
        name: group.name,
        desiredCapacity: group.desiredCapacity,
        currentCapacity: instances.length,
        minSize: group.minSize,
        maxSize: group.maxSize,
        runningInstances: statusCounts.running || 0,
        healthyInstances: instances.filter(i => i.healthStatus === 'healthy').length,
        statusDistribution: statusCounts,
        instances: instances.map(i => ({
          id: i.id,
          name: i.name,
          status: i.status,
          healthStatus: i.healthStatus,
          privateIp: i.privateIp,
          publicIp: i.publicIp,
          launched: i.launched
        }))
      }
    }
    
    // 获取所有实例组状态
    getAllInstanceGroups() {
      const groups = []
      
      this.instanceGroups.forEach((group, groupId) => {
        groups.push(this.getInstanceGroupStatus(groupId))
      })
      
      return groups
    }
    
    selectAvailabilityZone(group) {
      if (!group || !group.availabilityZones.length) {
        return 'default'
      }
      
      // 简单的轮询选择
      const zones = group.availabilityZones
      const instanceCount = group.instances.size
      return zones[instanceCount % zones.length]
    }
    
    generateTemplateId() {
      return `tpl_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
    }
    
    generateGroupId() {
      return `grp_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
    }
    
    generateInstanceId() {
      return `inst_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`
    }
    
    generatePrivateIp() {
      return `10.0.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`
    }
    
    generatePublicIp() {
      return `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`
    }
    
    delay(ms) {
      return new Promise(resolve => setTimeout(resolve, ms))
    }
  }
  
  // 自动扩展器
  class AutoScaler {
    constructor() {
      this.policies = new Map()
      this.metrics = new Map()
      this.scalingHistory = []
      this.cooldownPeriod = 300000 // 5分钟冷却期
      this.isRunning = false
    }
    
    // 创建扩展策略
    createScalingPolicy(policyConfig) {
      const policy = {
        id: policyConfig.id || this.generatePolicyId(),
        name: policyConfig.name,
        targetGroupId: policyConfig.targetGroupId,
        metricType: policyConfig.metricType, // 'cpu', 'memory', 'requests', 'custom'
        threshold: policyConfig.threshold,
        comparisonOperator: policyConfig.comparisonOperator, // 'greater', 'less'
        evaluationPeriods: policyConfig.evaluationPeriods || 2,
        scaleDirection: policyConfig.scaleDirection, // 'up', 'down'
        scalingAdjustment: policyConfig.scalingAdjustment, // 数量或百分比
        adjustmentType: policyConfig.adjustmentType || 'absolute', // 'absolute', 'percentage'
        cooldownPeriod: policyConfig.cooldownPeriod || this.cooldownPeriod,
        enabled: policyConfig.enabled !== false,
        created: new Date(),
        lastTriggered: null
      }
      
      this.policies.set(policy.id, policy)
      console.log(`扩展策略创建: ${policy.name} (${policy.metricType} ${policy.comparisonOperator} ${policy.threshold})`)
      
      return policy
    }
    
    // 启动自动扩展
    start() {
      if (this.isRunning) {
        console.log('自动扩展器已在运行')
        return
      }
      
      this.isRunning = true
      console.log('启动自动扩展器')
      
      // 定期评估扩展策略
      this.evaluationInterval = setInterval(() => {
        this.evaluateAllPolicies()
      }, 60000) // 每分钟评估一次
    }
    
    // 停止自动扩展
    stop() {
      if (!this.isRunning) {
        return
      }
      
      this.isRunning = false
      
      if (this.evaluationInterval) {
        clearInterval(this.evaluationInterval)
        this.evaluationInterval = null
      }
      
      console.log('停止自动扩展器')
    }
    
    // 评估所有策略
    async evaluateAllPolicies() {
      if (!this.isRunning) return
      
      for (const policy of this.policies.values()) {
        if (policy.enabled) {
          try {
            await this.evaluatePolicy(policy)
          } catch (error) {
            console.error(`策略评估失败: ${policy.name}`, error)
          }
        }
      }
    }
    
    // 评估单个策略
    async evaluatePolicy(policy) {
      // 检查冷却期
      if (policy.lastTriggered) {
        const timeSinceLastTrigger = Date.now() - policy.lastTriggered.getTime()
        if (timeSinceLastTrigger < policy.cooldownPeriod) {
          return
        }
      }
      
      // 获取指标值
      const metricValue = await this.getMetricValue(policy.targetGroupId, policy.metricType)
      
      if (metricValue === null) {
        console.warn(`无法获取指标值: ${policy.metricType} for ${policy.targetGroupId}`)
        return
      }
      
      // 评估触发条件
      const shouldTrigger = this.evaluateTriggerCondition(
        metricValue, 
        policy.threshold, 
        policy.comparisonOperator
      )
      
      if (!shouldTrigger) {
        return
      }
      
      // 检查评估周期
      const metricHistory = this.getMetricHistory(policy.targetGroupId, policy.metricType)
      
      if (metricHistory.length < policy.evaluationPeriods) {
        return
      }
      
      const recentValues = metricHistory.slice(-policy.evaluationPeriods)
      const allSatisfy = recentValues.every(value => 
        this.evaluateTriggerCondition(value, policy.threshold, policy.comparisonOperator)
      )
      
      if (!allSatisfy) {
        return
      }
      
      // 触发扩展
      await this.triggerScaling(policy, metricValue)
    }
    
    async getMetricValue(groupId, metricType) {
      // 模拟获取指标值
      const metrics = {
        cpu: Math.random() * 100,
        memory: Math.random() * 100,
        requests: Math.random() * 1000,
        responseTime: Math.random() * 500
      }
      
      return metrics[metricType] || null
    }
    
    getMetricHistory(groupId, metricType) {
      const key = `${groupId}:${metricType}`
      return this.metrics.get(key) || []
    }
    
    recordMetric(groupId, metricType, value) {
      const key = `${groupId}:${metricType}`
      
      if (!this.metrics.has(key)) {
        this.metrics.set(key, [])
      }
      
      const history = this.metrics.get(key)
      history.push(value)
      
      // 保持最近1小时的数据
      if (history.length > 60) {
        history.shift()
      }
    }
    
    evaluateTriggerCondition(value, threshold, operator) {
      switch (operator) {
        case 'greater':
          return value > threshold
        case 'less':
          return value < threshold
        case 'greater_equal':
          return value >= threshold
        case 'less_equal':
          return value <= threshold
        default:
          return false
      }
    }
    
    // 触发扩展
    async triggerScaling(policy, currentMetricValue) {
      console.log(`触发扩展策略: ${policy.name} (${policy.metricType}=${currentMetricValue})`)
      
      try {
        // 计算目标容量
        const targetCapacity = await this.calculateTargetCapacity(policy)
        
        // 执行扩展
        await this.executeScaling(policy.targetGroupId, targetCapacity, policy.scaleDirection)
        
        // 记录扩展历史
        this.recordScalingEvent(policy, currentMetricValue, targetCapacity)
        
        // 更新最后触发时间
        policy.lastTriggered = new Date()
        
      } catch (error) {
        console.error(`扩展执行失败: ${policy.name}`, error)
      }
    }
    
    async calculateTargetCapacity(policy) {
      // 获取当前容量
      const currentStatus = this.instanceManager.getInstanceGroupStatus(policy.targetGroupId)
      
      if (!currentStatus) {
        throw new Error(`实例组不存在: ${policy.targetGroupId}`)
      }
      
      let targetCapacity = currentStatus.currentCapacity
      
      if (policy.adjustmentType === 'absolute') {
        if (policy.scaleDirection === 'up') {
          targetCapacity += policy.scalingAdjustment
        } else {
          targetCapacity -= policy.scalingAdjustment
        }
      } else if (policy.adjustmentType === 'percentage') {
        const adjustment = Math.ceil(currentStatus.currentCapacity * policy.scalingAdjustment / 100)
        
        if (policy.scaleDirection === 'up') {
          targetCapacity += adjustment
        } else {
          targetCapacity -= adjustment
        }
      }
      
      // 应用最小/最大容量限制
      const group = this.instanceManager.instanceGroups.get(policy.targetGroupId)
      targetCapacity = Math.max(group.minSize, Math.min(group.maxSize, targetCapacity))
      
      return targetCapacity
    }
    
    async executeScaling(groupId, targetCapacity, direction) {
      await this.instanceManager.scaleInstanceGroup(
        groupId, 
        targetCapacity, 
        `auto-scaling-${direction}`
      )
    }
    
    recordScalingEvent(policy, metricValue, targetCapacity) {
      const event = {
        timestamp: new Date(),
        policyId: policy.id,
        policyName: policy.name,
        targetGroupId: policy.targetGroupId,
        triggerMetric: policy.metricType,
        triggerValue: metricValue,
        threshold: policy.threshold,
        scaleDirection: policy.scaleDirection,
        targetCapacity: targetCapacity,
        reason: `${policy.metricType} ${policy.comparisonOperator} ${policy.threshold}`
      }
      
      this.scalingHistory.push(event)
      
      // 保持最近100个事件
      if (this.scalingHistory.length > 100) {
        this.scalingHistory.shift()
      }
      
      console.log(`扩展事件记录: ${event.reason} -> ${targetCapacity}`)
    }
    
    generatePolicyId() {
      return `policy_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
    }
    
    // 获取扩展历史
    getScalingHistory(limit = 20) {
      return this.scalingHistory
        .slice(-limit)
        .reverse()
    }
    
    // 获取策略状态
    getPolicyStatus() {
      const policies = []
      
      this.policies.forEach(policy => {
        const lastEvent = this.scalingHistory
          .filter(event => event.policyId === policy.id)
          .sort((a, b) => b.timestamp - a.timestamp)[0]
        
        policies.push({
          ...policy,
          lastEvent: lastEvent || null,
          cooldownRemaining: policy.lastTriggered ? 
            Math.max(0, policy.cooldownPeriod - (Date.now() - policy.lastTriggered.getTime())) : 0
        })
      })
      
      return policies
    }
  }
  
  // 数据分片管理器
  class DataShardingManager {
    constructor() {
      this.shards = new Map()
      this.shardingStrategy = 'hash' // 'hash', 'range', 'directory'
      this.resharding = false
    }
    
    // 创建分片
    createShard(shardConfig) {
      const shard = {
        id: shardConfig.id || this.generateShardId(),
        name: shardConfig.name,
        range: shardConfig.range, // { min, max } for range sharding
        hashRing: shardConfig.hashRing, // hash range for consistent hashing
        instances: shardConfig.instances || [],
        status: 'active',
        created: new Date(),
        lastAccess: new Date(),
        dataSize: 0,
        requestCount: 0
      }
      
      this.shards.set(shard.id, shard)
      console.log(`数据分片创建: ${shard.name}`)
      
      return shard
    }
    
    // 路由请求到分片
    routeToShard(key) {
      switch (this.shardingStrategy) {
        case 'hash':
          return this.hashBasedRouting(key)
        case 'range':
          return this.rangeBasedRouting(key)
        case 'directory':
          return this.directoryBasedRouting(key)
        default:
          throw new Error(`不支持的分片策略: ${this.shardingStrategy}`)
      }
    }
    
    hashBasedRouting(key) {
      const hash = this.calculateHash(key)
      
      for (const shard of this.shards.values()) {
        if (shard.hashRing && 
            hash >= shard.hashRing.min && 
            hash <= shard.hashRing.max) {
          shard.lastAccess = new Date()
          shard.requestCount++
          return shard
        }
      }
      
      throw new Error(`无法路由到分片: ${key}`)
    }
    
    rangeBasedRouting(key) {
      // 假设key是数字类型
      const numericKey = parseInt(key)
      
      for (const shard of this.shards.values()) {
        if (shard.range && 
            numericKey >= shard.range.min && 
            numericKey <= shard.range.max) {
          shard.lastAccess = new Date()
          shard.requestCount++
          return shard
        }
      }
      
      throw new Error(`无法路由到分片: ${key}`)
    }
    
    calculateHash(key) {
      let hash = 0
      for (let i = 0; i < key.length; i++) {
        const char = key.charCodeAt(i)
        hash = ((hash << 5) - hash) + char
        hash = hash & hash // 转换为32位整数
      }
      return Math.abs(hash)
    }
    
    // 重新分片
    async performResharding(newShardCount) {
      if (this.resharding) {
        throw new Error('重新分片正在进行中')
      }
      
      this.resharding = true
      
      try {
        console.log(`开始重新分片: ${this.shards.size} -> ${newShardCount}`)
        
        // 创建新的分片结构
        const newShards = this.createNewShardStructure(newShardCount)
        
        // 迁移数据
        await this.migrateData(newShards)
        
        // 更新分片映射
        this.shards = newShards
        
        console.log('重新分片完成')
        
      } finally {
        this.resharding = false
      }
    }
    
    createNewShardStructure(shardCount) {
      const newShards = new Map()
      const hashRangeSize = Math.floor(Math.pow(2, 32) / shardCount)
      
      for (let i = 0; i < shardCount; i++) {
        const shard = {
          id: this.generateShardId(),
          name: `shard-${i}`,
          hashRing: {
            min: i * hashRangeSize,
            max: (i + 1) * hashRangeSize - 1
          },
          instances: [],
          status: 'active',
          created: new Date(),
          lastAccess: new Date(),
          dataSize: 0,
          requestCount: 0
        }
        
        newShards.set(shard.id, shard)
      }
      
      return newShards
    }
    
    async migrateData(newShards) {
      console.log('开始数据迁移...')
      
      // 模拟数据迁移过程
      for (const oldShard of this.shards.values()) {
        console.log(`迁移分片数据: ${oldShard.name}`)
        
        // 这里需要实现实际的数据迁移逻辑
        await this.delay(1000)
      }
      
      console.log('数据迁移完成')
    }
    
    generateShardId() {
      return `shard_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
    }
    
    delay(ms) {
      return new Promise(resolve => setTimeout(resolve, ms))
    }
    
    // 获取分片统计
    getShardingStats() {
      const stats = {
        totalShards: this.shards.size,
        strategy: this.shardingStrategy,
        resharding: this.resharding,
        shards: []
      }
      
      this.shards.forEach(shard => {
        stats.shards.push({
          id: shard.id,
          name: shard.name,
          status: shard.status,
          dataSize: shard.dataSize,
          requestCount: shard.requestCount,
          lastAccess: shard.lastAccess,
          instances: shard.instances.length
        })
      })
      
      return stats
    }
  }
  
  // 会话管理器
  class SessionManager {
    constructor() {
      this.strategy = 'sticky' // 'sticky', 'shared', 'stateless'
      this.sessionStore = new Map()
      this.stickyMapping = new Map() // sessionId -> instanceId
    }
    
    // 设置会话策略
    setStrategy(strategy) {
      this.strategy = strategy
      console.log(`会话策略设置: ${strategy}`)
    }
    
    // 路由会话请求
    routeSessionRequest(sessionId, availableInstances) {
      switch (this.strategy) {
        case 'sticky':
          return this.stickySessionRouting(sessionId, availableInstances)
        case 'shared':
          return this.sharedSessionRouting(sessionId, availableInstances)
        case 'stateless':
          return this.statelessRouting(availableInstances)
        default:
          throw new Error(`不支持的会话策略: ${this.strategy}`)
      }
    }
    
    stickySessionRouting(sessionId, availableInstances) {
      const stickyInstanceId = this.stickyMapping.get(sessionId)
      
      if (stickyInstanceId) {
        const stickyInstance = availableInstances.find(inst => inst.id === stickyInstanceId)
        
        if (stickyInstance && stickyInstance.status === 'running') {
          return stickyInstance
        } else {
          // 原实例不可用，重新分配
          this.stickyMapping.delete(sessionId)
        }
      }
      
      // 分配新实例
      const selectedInstance = this.selectInstance(availableInstances)
      this.stickyMapping.set(sessionId, selectedInstance.id)
      
      console.log(`会话粘滞分配: ${sessionId} -> ${selectedInstance.id}`)
      
      return selectedInstance
    }
    
    sharedSessionRouting(sessionId, availableInstances) {
      // 共享会话存储，可以路由到任意实例
      return this.selectInstance(availableInstances)
    }
    
    statelessRouting(availableInstances) {
      // 无状态，随机选择实例
      return this.selectInstance(availableInstances)
    }
    
    selectInstance(instances) {
      const runningInstances = instances.filter(inst => inst.status === 'running')
      
      if (runningInstances.length === 0) {
        throw new Error('没有可用的运行实例')
      }
      
      // 简单轮询选择
      const index = Math.floor(Math.random() * runningInstances.length)
      return runningInstances[index]
    }
    
    // 处理实例下线
    handleInstanceTermination(instanceId) {
      // 清理粘滞会话映射
      const affectedSessions = []
      
      this.stickyMapping.forEach((mappedInstanceId, sessionId) => {
        if (mappedInstanceId === instanceId) {
          this.stickyMapping.delete(sessionId)
          affectedSessions.push(sessionId)
        }
      })
      
      if (affectedSessions.length > 0) {
        console.log(`清理粘滞会话: ${affectedSessions.length} 个会话受影响`)
      }
    }
    
    // 获取会话统计
    getSessionStats() {
      return {
        strategy: this.strategy,
        activeSessions: this.sessionStore.size,
        stickyMappings: this.stickyMapping.size
      }
    }
  }
  
  // 启动扩展框架
  async start() {
    console.log('启动水平扩展框架...')
    
    await this.serviceDiscovery.start()
    await this.healthMonitor.start()
    this.autoScaler.start()
    
    console.log('水平扩展框架启动完成')
  }
  
  // 停止扩展框架
  async stop() {
    console.log('停止水平扩展框架...')
    
    this.autoScaler.stop()
    await this.healthMonitor.stop()
    await this.serviceDiscovery.stop()
    
    console.log('水平扩展框架停止完成')
  }
  
  // 获取框架状态
  getFrameworkStatus() {
    return {
      instanceGroups: this.instanceManager.getAllInstanceGroups(),
      autoScaler: {
        isRunning: this.autoScaler.isRunning,
        policies: this.autoScaler.getPolicyStatus().length,
        recentEvents: this.autoScaler.getScalingHistory(5)
      },
      dataSharding: this.dataSharding.getShardingStats(),
      sessionManagement: this.sessionManager.getSessionStats()
    }
  }
}

// 使用示例
async function demonstrateHorizontalScaling() {
  console.log('=== 水平扩展演示 ===')
  
  const framework = new HorizontalScalingFramework()
  
  // 创建实例模板
  const webTemplate = framework.instanceManager.createTemplate({
    name: 'web-server-template',
    image: 'nginx:latest',
    instanceType: 't3.medium',
    resources: {
      cpu: 2,
      memory: 4096,
      storage: 20
    },
    healthCheck: {
      type: 'http',
      path: '/health',
      port: 80,
      interval: 30
    },
    environment: {
      NODE_ENV: 'production',
      PORT: '3000'
    }
  })
  
  // 创建实例组
  const webGroup = framework.instanceManager.createInstanceGroup({
    name: 'web-servers',
    templateId: webTemplate.id,
    minSize: 2,
    maxSize: 10,
    desiredCapacity: 3,
    availabilityZones: ['us-east-1a', 'us-east-1b', 'us-east-1c']
  })
  
  // 启动初始实例
  console.log('启动初始实例...')
  
  for (let i = 0; i < webGroup.desiredCapacity; i++) {
    await framework.instanceManager.launchInstance(webTemplate.id, webGroup.id)
  }
  
  // 创建自动扩展策略
  const scaleUpPolicy = framework.autoScaler.createScalingPolicy({
    name: 'scale-up-on-high-cpu',
    targetGroupId: webGroup.id,
    metricType: 'cpu',
    threshold: 70,
    comparisonOperator: 'greater',
    evaluationPeriods: 2,
    scaleDirection: 'up',
    scalingAdjustment: 1,
    adjustmentType: 'absolute'
  })
  
  const scaleDownPolicy = framework.autoScaler.createScalingPolicy({
    name: 'scale-down-on-low-cpu',
    targetGroupId: webGroup.id,
    metricType: 'cpu',
    threshold: 30,
    comparisonOperator: 'less',
    evaluationPeriods: 3,
    scaleDirection: 'down',
    scalingAdjustment: 1,
    adjustmentType: 'absolute'
  })
  
  // 启动框架
  await framework.start()
  
  // 模拟指标变化和自动扩展
  console.log('模拟高负载触发扩容...')
  
  for (let i = 0; i < 3; i++) {
    framework.autoScaler.recordMetric(webGroup.id, 'cpu', 85)
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
  
  // 等待扩容执行
  await new Promise(resolve => setTimeout(resolve, 3000))
  
  // 检查状态
  const status = framework.getFrameworkStatus()
  console.log('实例组状态:', status.instanceGroups[0])
  console.log('扩展历史:', status.autoScaler.recentEvents)
  
  return framework
}

module.exports = {
  HorizontalScalingFramework
}
```

## 📚 最佳实践总结

1. **实例管理**：自动化的实例生命周期管理
2. **弹性扩展**：基于指标的自动扩缩容机制
3. **负载分布**：智能的负载均衡和流量分发
4. **数据分片**：水平分片提高数据处理能力
5. **会话管理**：适应扩展的会话持久化策略
6. **健康监控**：全面的实例健康检查和恢复
7. **容错设计**：优雅处理实例故障和网络分区
8. **成本优化**：基于需求的资源动态分配

通过掌握水平扩展技术，您将能够构建可以无限扩展的分布式系统架构。
