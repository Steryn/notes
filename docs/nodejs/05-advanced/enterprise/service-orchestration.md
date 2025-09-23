# 服务编排

## 📖 概述

服务编排（Service Orchestration）是一种集成模式，通过中央编排器协调多个服务的交互，实现复杂的业务流程。与服务编制（Choreography）不同，编排采用集中式控制，由编排引擎负责管理整个流程的执行。

## 🎯 学习目标

- 理解服务编排的核心概念和模式
- 掌握工作流引擎的设计和实现
- 学习BPMN和状态机编排方式
- 实现可扩展的编排中间件

## 🎼 编排引擎核心架构

### 1. 工作流引擎框架

```javascript
// 工作流引擎核心框架
class WorkflowEngine {
  constructor(config = {}) {
    this.config = config
    this.workflows = new Map()
    this.processInstances = new Map()
    this.taskQueue = new TaskQueue()
    this.executor = new WorkflowExecutor()
    this.stateManager = new StateManager()
    this.eventBus = new EventBus()
    this.serviceRegistry = new ServiceRegistry()
    this.compensationManager = new CompensationManager()
    this.status = 'stopped'
  }
  
  // 工作流定义
  class WorkflowDefinition {
    constructor(definition) {
      this.id = definition.id
      this.name = definition.name
      this.version = definition.version || '1.0.0'
      this.description = definition.description
      this.startEvent = definition.startEvent
      this.endEvents = definition.endEvents || []
      this.activities = new Map()
      this.transitions = new Map()
      this.variables = definition.variables || {}
      this.timeouts = definition.timeouts || {}
      this.compensation = definition.compensation || {}
      this.created = new Date()
      
      this.buildActivities(definition.activities)
      this.buildTransitions(definition.transitions)
    }
    
    buildActivities(activities) {
      activities.forEach(activity => {
        this.activities.set(activity.id, new Activity(activity))
      })
    }
    
    buildTransitions(transitions) {
      transitions.forEach(transition => {
        if (!this.transitions.has(transition.from)) {
          this.transitions.set(transition.from, [])
        }
        this.transitions.get(transition.from).push(new Transition(transition))
      })
    }
    
    getActivity(activityId) {
      return this.activities.get(activityId)
    }
    
    getTransitions(fromActivityId) {
      return this.transitions.get(fromActivityId) || []
    }
    
    validate() {
      // 验证工作流定义的完整性
      if (!this.startEvent) {
        throw new Error('工作流必须有开始事件')
      }
      
      if (this.endEvents.length === 0) {
        throw new Error('工作流必须有结束事件')
      }
      
      // 验证所有活动都有有效的转换
      this.activities.forEach((activity, id) => {
        if (id !== this.startEvent && !this.endEvents.includes(id)) {
          const incomingTransitions = this.findIncomingTransitions(id)
          if (incomingTransitions.length === 0) {
            throw new Error(`活动 ${id} 没有入边`)
          }
        }
      })
      
      console.log(`工作流验证通过: ${this.name}`)
    }
    
    findIncomingTransitions(activityId) {
      const incoming = []
      this.transitions.forEach((transitions, from) => {
        transitions.forEach(transition => {
          if (transition.to === activityId) {
            incoming.push(transition)
          }
        })
      })
      return incoming
    }
  }
  
  // 活动定义
  class Activity {
    constructor(definition) {
      this.id = definition.id
      this.name = definition.name
      this.type = definition.type // 'service', 'user', 'script', 'gateway'
      this.implementation = definition.implementation
      this.inputMapping = definition.inputMapping || {}
      this.outputMapping = definition.outputMapping || {}
      this.timeout = definition.timeout
      this.retries = definition.retries || 0
      this.compensation = definition.compensation
      this.condition = definition.condition
      this.parallel = definition.parallel || false
    }
    
    async execute(processInstance, context) {
      console.log(`执行活动: ${this.name} [${this.type}]`)
      
      const activityContext = {
        ...context,
        activity: this,
        processInstance,
        startTime: new Date()
      }
      
      try {
        // 映射输入参数
        const inputs = this.mapInputs(processInstance.variables, context)
        activityContext.inputs = inputs
        
        let result
        
        switch (this.type) {
          case 'service':
            result = await this.executeServiceActivity(activityContext)
            break
          case 'user':
            result = await this.executeUserActivity(activityContext)
            break
          case 'script':
            result = await this.executeScriptActivity(activityContext)
            break
          case 'gateway':
            result = await this.executeGatewayActivity(activityContext)
            break
          case 'timer':
            result = await this.executeTimerActivity(activityContext)
            break
          default:
            throw new Error(`不支持的活动类型: ${this.type}`)
        }
        
        // 映射输出参数
        if (result && this.outputMapping) {
          this.mapOutputs(result, processInstance.variables)
        }
        
        console.log(`活动完成: ${this.name}`)
        
        return {
          status: 'completed',
          result,
          duration: Date.now() - activityContext.startTime.getTime()
        }
        
      } catch (error) {
        console.error(`活动执行失败: ${this.name}`, error)
        
        return {
          status: 'failed',
          error: error.message,
          duration: Date.now() - activityContext.startTime.getTime()
        }
      }
    }
    
    async executeServiceActivity(context) {
      const implementation = this.implementation
      
      // 调用外部服务
      const serviceCall = {
        service: implementation.service,
        operation: implementation.operation,
        parameters: context.inputs,
        timeout: this.timeout || 30000
      }
      
      return await context.processInstance.engine.serviceRegistry.callService(serviceCall)
    }
    
    async executeUserActivity(context) {
      // 创建用户任务
      const userTask = {
        id: this.generateTaskId(),
        activityId: this.id,
        processInstanceId: context.processInstance.id,
        name: this.name,
        assignee: this.implementation.assignee,
        candidateGroups: this.implementation.candidateGroups,
        formKey: this.implementation.formKey,
        variables: context.inputs,
        created: new Date(),
        status: 'created'
      }
      
      // 添加到任务队列
      await context.processInstance.engine.taskQueue.addTask(userTask)
      
      // 暂停流程实例，等待用户完成任务
      context.processInstance.status = 'waiting'
      
      return { taskId: userTask.id, status: 'waiting' }
    }
    
    async executeScriptActivity(context) {
      const script = this.implementation.script
      
      // 安全的脚本执行环境
      const scriptContext = {
        variables: context.processInstance.variables,
        inputs: context.inputs,
        console: {
          log: (msg) => console.log(`[Script ${this.id}] ${msg}`)
        }
      }
      
      const func = new Function('context', script)
      return func(scriptContext)
    }
    
    async executeGatewayActivity(context) {
      const gatewayType = this.implementation.gatewayType
      
      switch (gatewayType) {
        case 'exclusive':
          return await this.executeExclusiveGateway(context)
        case 'parallel':
          return await this.executeParallelGateway(context)
        case 'inclusive':
          return await this.executeInclusiveGateway(context)
        default:
          throw new Error(`不支持的网关类型: ${gatewayType}`)
      }
    }
    
    async executeExclusiveGateway(context) {
      // 排他网关：只选择第一个满足条件的分支
      const transitions = context.processInstance.workflow.getTransitions(this.id)
      
      for (const transition of transitions) {
        if (await this.evaluateCondition(transition.condition, context)) {
          return { selectedTransition: transition.id }
        }
      }
      
      throw new Error('排他网关没有满足条件的分支')
    }
    
    async executeParallelGateway(context) {
      // 并行网关：激活所有分支
      const transitions = context.processInstance.workflow.getTransitions(this.id)
      
      return { 
        selectedTransitions: transitions.map(t => t.id),
        parallel: true 
      }
    }
    
    async executeTimerActivity(context) {
      const duration = this.implementation.duration || 60000
      
      // 设置定时器
      setTimeout(() => {
        context.processInstance.engine.eventBus.emit('timer-fired', {
          processInstanceId: context.processInstance.id,
          activityId: this.id
        })
      }, duration)
      
      return { timerSet: true, duration }
    }
    
    mapInputs(processVariables, context) {
      const inputs = {}
      
      Object.entries(this.inputMapping).forEach(([paramName, expression]) => {
        inputs[paramName] = this.evaluateExpression(expression, {
          variables: processVariables,
          context
        })
      })
      
      return inputs
    }
    
    mapOutputs(result, processVariables) {
      Object.entries(this.outputMapping).forEach(([variableName, expression]) => {
        processVariables[variableName] = this.evaluateExpression(expression, {
          result,
          variables: processVariables
        })
      })
    }
    
    evaluateExpression(expression, context) {
      // 简化的表达式求值
      if (expression.startsWith('${') && expression.endsWith('}')) {
        const path = expression.slice(2, -1)
        return this.getNestedValue(context, path)
      }
      return expression
    }
    
    async evaluateCondition(condition, context) {
      if (!condition) return true
      
      try {
        const func = new Function('context', `return ${condition}`)
        return func({
          variables: context.processInstance.variables,
          inputs: context.inputs
        })
      } catch (error) {
        console.error('条件求值失败:', condition, error)
        return false
      }
    }
    
    getNestedValue(obj, path) {
      return path.split('.').reduce((current, key) => 
        current && current[key] !== undefined ? current[key] : undefined, obj)
    }
    
    generateTaskId() {
      return `task_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
    }
  }
  
  // 转换定义
  class Transition {
    constructor(definition) {
      this.id = definition.id
      this.from = definition.from
      this.to = definition.to
      this.condition = definition.condition
      this.name = definition.name
    }
  }
  
  // 流程实例
  class ProcessInstance {
    constructor(workflow, initiator, inputs = {}) {
      this.id = this.generateInstanceId()
      this.workflow = workflow
      this.initiator = initiator
      this.variables = { ...workflow.variables, ...inputs }
      this.currentActivities = [workflow.startEvent]
      this.completedActivities = []
      this.activeTokens = [{ activityId: workflow.startEvent, tokenId: this.generateTokenId() }]
      this.status = 'running'
      this.started = new Date()
      this.ended = null
      this.history = []
      this.engine = null
    }
    
    addHistoryEntry(entry) {
      this.history.push({
        ...entry,
        timestamp: new Date()
      })
    }
    
    updateStatus(status) {
      this.status = status
      if (status === 'completed' || status === 'failed' || status === 'terminated') {
        this.ended = new Date()
      }
      
      this.addHistoryEntry({
        type: 'status-change',
        status: status
      })
    }
    
    moveToken(fromActivityId, toActivityId, tokenId) {
      // 移除当前位置的令牌
      this.activeTokens = this.activeTokens.filter(token => 
        !(token.activityId === fromActivityId && token.tokenId === tokenId)
      )
      
      // 添加新位置的令牌
      this.activeTokens.push({
        activityId: toActivityId,
        tokenId: tokenId || this.generateTokenId()
      })
      
      // 更新当前活动
      this.currentActivities = Array.from(new Set(
        this.activeTokens.map(token => token.activityId)
      ))
      
      this.addHistoryEntry({
        type: 'token-move',
        from: fromActivityId,
        to: toActivityId,
        tokenId
      })
    }
    
    completeActivity(activityId) {
      if (!this.completedActivities.includes(activityId)) {
        this.completedActivities.push(activityId)
      }
      
      this.addHistoryEntry({
        type: 'activity-completed',
        activityId
      })
    }
    
    generateInstanceId() {
      return `proc_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`
    }
    
    generateTokenId() {
      return `token_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
    }
    
    getDuration() {
      const endTime = this.ended || new Date()
      return endTime.getTime() - this.started.getTime()
    }
    
    getProgress() {
      const totalActivities = this.workflow.activities.size
      const completedCount = this.completedActivities.length
      
      return {
        total: totalActivities,
        completed: completedCount,
        percentage: totalActivities > 0 ? (completedCount / totalActivities) * 100 : 0
      }
    }
  }
  
  // 注册工作流
  registerWorkflow(workflowDefinition) {
    const workflow = new this.WorkflowDefinition(workflowDefinition)
    workflow.validate()
    
    this.workflows.set(workflow.id, workflow)
    console.log(`工作流注册: ${workflow.name} v${workflow.version}`)
    
    return workflow
  }
  
  // 启动流程实例
  async startProcess(workflowId, initiator, inputs = {}) {
    const workflow = this.workflows.get(workflowId)
    
    if (!workflow) {
      throw new Error(`工作流不存在: ${workflowId}`)
    }
    
    const processInstance = new this.ProcessInstance(workflow, initiator, inputs)
    processInstance.engine = this
    
    this.processInstances.set(processInstance.id, processInstance)
    
    console.log(`流程启动: ${workflow.name} [${processInstance.id}]`)
    
    // 开始执行
    await this.executeProcess(processInstance)
    
    return processInstance
  }
  
  // 执行流程
  async executeProcess(processInstance) {
    try {
      while (processInstance.status === 'running' && processInstance.activeTokens.length > 0) {
        const currentTokens = [...processInstance.activeTokens]
        
        for (const token of currentTokens) {
          await this.executeActivity(processInstance, token.activityId, token.tokenId)
        }
        
        // 检查是否到达结束事件
        const endReached = processInstance.activeTokens.some(token => 
          processInstance.workflow.endEvents.includes(token.activityId)
        )
        
        if (endReached) {
          processInstance.updateStatus('completed')
          console.log(`流程完成: ${processInstance.id}`)
          break
        }
        
        // 防止无限循环
        await this.delay(100)
      }
      
    } catch (error) {
      console.error(`流程执行失败: ${processInstance.id}`, error)
      processInstance.updateStatus('failed')
      
      // 触发补偿
      await this.triggerCompensation(processInstance, error)
    }
  }
  
  // 执行活动
  async executeActivity(processInstance, activityId, tokenId) {
    if (processInstance.workflow.endEvents.includes(activityId)) {
      // 到达结束事件
      processInstance.completeActivity(activityId)
      return
    }
    
    const activity = processInstance.workflow.getActivity(activityId)
    
    if (!activity) {
      throw new Error(`活动不存在: ${activityId}`)
    }
    
    console.log(`执行活动: ${activity.name} [${activityId}]`)
    
    const result = await activity.execute(processInstance, { tokenId })
    
    if (result.status === 'completed') {
      processInstance.completeActivity(activityId)
      
      // 查找下一个活动
      const transitions = processInstance.workflow.getTransitions(activityId)
      
      if (result.parallel && result.selectedTransitions) {
        // 并行分支
        result.selectedTransitions.forEach(transitionId => {
          const transition = transitions.find(t => t.id === transitionId)
          if (transition) {
            processInstance.moveToken(activityId, transition.to, this.generateTokenId())
          }
        })
      } else if (result.selectedTransition) {
        // 选择特定转换
        const transition = transitions.find(t => t.id === result.selectedTransition)
        if (transition) {
          processInstance.moveToken(activityId, transition.to, tokenId)
        }
      } else {
        // 默认转换
        for (const transition of transitions) {
          if (!transition.condition || await this.evaluateTransitionCondition(transition, processInstance)) {
            processInstance.moveToken(activityId, transition.to, tokenId)
            break
          }
        }
      }
      
    } else if (result.status === 'waiting') {
      // 等待外部事件或用户操作
      console.log(`活动等待: ${activity.name}`)
      
    } else if (result.status === 'failed') {
      // 活动失败，触发错误处理
      await this.handleActivityError(processInstance, activityId, result.error)
    }
  }
  
  async evaluateTransitionCondition(transition, processInstance) {
    if (!transition.condition) return true
    
    try {
      const func = new Function('variables', `return ${transition.condition}`)
      return func(processInstance.variables)
    } catch (error) {
      console.error('转换条件求值失败:', transition.condition, error)
      return false
    }
  }
  
  // 处理活动错误
  async handleActivityError(processInstance, activityId, error) {
    console.error(`活动错误处理: ${activityId}`, error)
    
    const activity = processInstance.workflow.getActivity(activityId)
    
    // 检查是否有重试配置
    if (activity.retries > 0) {
      activity.retries--
      console.log(`重试活动: ${activityId} (剩余: ${activity.retries})`)
      
      // 延迟后重试
      await this.delay(2000)
      return
    }
    
    // 检查是否有错误处理流程
    const errorTransitions = processInstance.workflow.getTransitions(activityId)
      .filter(t => t.condition && t.condition.includes('error'))
    
    if (errorTransitions.length > 0) {
      // 执行错误处理流程
      console.log(`执行错误处理流程: ${activityId}`)
      return
    }
    
    // 无法处理错误，终止流程
    processInstance.updateStatus('failed')
    throw new Error(`活动执行失败且无法恢复: ${activityId}`)
  }
  
  // 触发补偿
  async triggerCompensation(processInstance, error) {
    console.log(`触发补偿流程: ${processInstance.id}`)
    
    const compensationActivities = processInstance.completedActivities
      .map(activityId => processInstance.workflow.getActivity(activityId))
      .filter(activity => activity.compensation)
      .reverse() // 按相反顺序补偿
    
    for (const activity of compensationActivities) {
      try {
        await this.executeCompensation(processInstance, activity)
      } catch (compensationError) {
        console.error(`补偿失败: ${activity.id}`, compensationError)
      }
    }
  }
  
  async executeCompensation(processInstance, activity) {
    console.log(`执行补偿: ${activity.name}`)
    
    const compensation = activity.compensation
    
    if (compensation.type === 'service') {
      await this.serviceRegistry.callService({
        service: compensation.service,
        operation: compensation.operation,
        parameters: compensation.parameters || {}
      })
    } else if (compensation.type === 'script') {
      const func = new Function('variables', compensation.script)
      func(processInstance.variables)
    }
  }
  
  // 完成用户任务
  async completeUserTask(taskId, userId, outputs = {}) {
    const task = await this.taskQueue.getTask(taskId)
    
    if (!task) {
      throw new Error(`任务不存在: ${taskId}`)
    }
    
    if (task.status !== 'created') {
      throw new Error(`任务状态无效: ${task.status}`)
    }
    
    const processInstance = this.processInstances.get(task.processInstanceId)
    
    if (!processInstance) {
      throw new Error(`流程实例不存在: ${task.processInstanceId}`)
    }
    
    // 更新流程变量
    Object.assign(processInstance.variables, outputs)
    
    // 标记任务完成
    await this.taskQueue.completeTask(taskId, userId, outputs)
    
    // 恢复流程执行
    if (processInstance.status === 'waiting') {
      processInstance.updateStatus('running')
      await this.executeProcess(processInstance)
    }
    
    console.log(`用户任务完成: ${taskId}`)
  }
  
  // 获取流程实例
  getProcessInstance(instanceId) {
    return this.processInstances.get(instanceId)
  }
  
  // 获取活跃流程实例
  getActiveProcessInstances() {
    return Array.from(this.processInstances.values())
      .filter(instance => instance.status === 'running' || instance.status === 'waiting')
  }
  
  // 终止流程实例
  async terminateProcessInstance(instanceId, reason) {
    const processInstance = this.processInstances.get(instanceId)
    
    if (!processInstance) {
      throw new Error(`流程实例不存在: ${instanceId}`)
    }
    
    processInstance.updateStatus('terminated')
    processInstance.variables.terminationReason = reason
    
    console.log(`流程终止: ${instanceId} - ${reason}`)
  }
  
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
  
  generateTokenId() {
    return `token_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
  }
  
  // 启动引擎
  async start() {
    console.log('工作流引擎启动...')
    
    await this.taskQueue.start()
    await this.executor.start()
    await this.serviceRegistry.start()
    await this.compensationManager.start()
    
    this.status = 'running'
    console.log('工作流引擎启动完成')
  }
  
  // 停止引擎
  async stop() {
    console.log('工作流引擎停止...')
    
    await this.taskQueue.stop()
    await this.executor.stop()
    await this.serviceRegistry.stop()
    await this.compensationManager.stop()
    
    this.status = 'stopped'
    console.log('工作流引擎停止完成')
  }
  
  // 获取引擎状态
  getEngineStatus() {
    return {
      status: this.status,
      workflows: this.workflows.size,
      activeProcesses: this.getActiveProcessInstances().length,
      totalProcesses: this.processInstances.size
    }
  }
}
```

### 2. 支持组件实现

```javascript
// 任务队列
class TaskQueue {
  constructor() {
    this.tasks = new Map()
    this.status = 'stopped'
  }
  
  async start() {
    this.status = 'running'
    console.log('任务队列启动')
  }
  
  async stop() {
    this.status = 'stopped'
    console.log('任务队列停止')
  }
  
  async addTask(task) {
    this.tasks.set(task.id, task)
    console.log(`任务添加: ${task.name} [${task.id}]`)
  }
  
  async getTask(taskId) {
    return this.tasks.get(taskId)
  }
  
  async completeTask(taskId, userId, outputs) {
    const task = this.tasks.get(taskId)
    if (task) {
      task.status = 'completed'
      task.completedBy = userId
      task.completedAt = new Date()
      task.outputs = outputs
    }
  }
  
  getUserTasks(userId) {
    return Array.from(this.tasks.values())
      .filter(task => task.assignee === userId && task.status === 'created')
  }
  
  getGroupTasks(groups) {
    return Array.from(this.tasks.values())
      .filter(task => 
        task.candidateGroups && 
        task.candidateGroups.some(group => groups.includes(group)) &&
        task.status === 'created'
      )
  }
}

// 服务注册表
class ServiceRegistry {
  constructor() {
    this.services = new Map()
  }
  
  async start() {
    console.log('服务注册表启动')
  }
  
  async stop() {
    console.log('服务注册表停止')
  }
  
  registerService(name, serviceConfig) {
    this.services.set(name, serviceConfig)
    console.log(`服务注册: ${name}`)
  }
  
  async callService(serviceCall) {
    const service = this.services.get(serviceCall.service)
    
    if (!service) {
      throw new Error(`服务不存在: ${serviceCall.service}`)
    }
    
    console.log(`调用服务: ${serviceCall.service}.${serviceCall.operation}`)
    
    // 模拟服务调用
    if (service.type === 'http') {
      const axios = require('axios')
      
      const response = await axios.post(
        `${service.endpoint}/${serviceCall.operation}`,
        serviceCall.parameters,
        { timeout: serviceCall.timeout }
      )
      
      return response.data
    } else if (service.type === 'mock') {
      // 模拟服务响应
      await new Promise(resolve => setTimeout(resolve, 1000))
      return { success: true, data: serviceCall.parameters }
    }
    
    throw new Error(`不支持的服务类型: ${service.type}`)
  }
}

// 事件总线
class EventBus {
  constructor() {
    this.listeners = new Map()
  }
  
  on(event, listener) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event).push(listener)
  }
  
  emit(event, data) {
    const eventListeners = this.listeners.get(event)
    if (eventListeners) {
      eventListeners.forEach(listener => {
        try {
          listener(data)
        } catch (error) {
          console.error(`事件监听器错误: ${event}`, error)
        }
      })
    }
  }
  
  off(event, listener) {
    const eventListeners = this.listeners.get(event)
    if (eventListeners) {
      const index = eventListeners.indexOf(listener)
      if (index > -1) {
        eventListeners.splice(index, 1)
      }
    }
  }
}

// 状态管理器
class StateManager {
  constructor() {
    this.states = new Map()
  }
  
  saveState(processInstanceId, state) {
    this.states.set(processInstanceId, {
      ...state,
      timestamp: new Date()
    })
  }
  
  restoreState(processInstanceId) {
    return this.states.get(processInstanceId)
  }
  
  clearState(processInstanceId) {
    this.states.delete(processInstanceId)
  }
}

// 补偿管理器
class CompensationManager {
  constructor() {
    this.compensationLog = []
  }
  
  async start() {
    console.log('补偿管理器启动')
  }
  
  async stop() {
    console.log('补偿管理器停止')
  }
  
  logCompensation(processInstanceId, activityId, compensationData) {
    this.compensationLog.push({
      processInstanceId,
      activityId,
      compensationData,
      timestamp: new Date()
    })
  }
}

// 工作流执行器
class WorkflowExecutor {
  constructor() {
    this.executionPool = []
    this.maxConcurrency = 10
  }
  
  async start() {
    console.log('工作流执行器启动')
  }
  
  async stop() {
    console.log('工作流执行器停止')
  }
}

// 使用示例
async function demonstrateOrchestration() {
  console.log('=== 服务编排演示 ===')
  
  const engine = new WorkflowEngine()
  
  // 注册服务
  engine.serviceRegistry.registerService('user-service', {
    type: 'mock',
    endpoint: 'http://user-service:8080'
  })
  
  engine.serviceRegistry.registerService('payment-service', {
    type: 'mock',
    endpoint: 'http://payment-service:8081'
  })
  
  engine.serviceRegistry.registerService('inventory-service', {
    type: 'mock',
    endpoint: 'http://inventory-service:8082'
  })
  
  // 定义订单处理工作流
  const orderWorkflow = {
    id: 'order-process',
    name: '订单处理流程',
    version: '1.0.0',
    startEvent: 'start',
    endEvents: ['end'],
    variables: {
      orderId: null,
      customerId: null,
      amount: 0,
      status: 'pending'
    },
    activities: [
      {
        id: 'start',
        name: '开始',
        type: 'start'
      },
      {
        id: 'validate-order',
        name: '验证订单',
        type: 'service',
        implementation: {
          service: 'user-service',
          operation: 'validateOrder'
        },
        inputMapping: {
          orderId: '${variables.orderId}',
          customerId: '${variables.customerId}'
        },
        outputMapping: {
          'variables.validationResult': '${result.valid}'
        }
      },
      {
        id: 'check-inventory',
        name: '检查库存',
        type: 'service',
        implementation: {
          service: 'inventory-service',
          operation: 'checkStock'
        },
        inputMapping: {
          items: '${variables.items}'
        }
      },
      {
        id: 'approval-gateway',
        name: '审批网关',
        type: 'gateway',
        implementation: {
          gatewayType: 'exclusive'
        }
      },
      {
        id: 'manual-approval',
        name: '人工审批',
        type: 'user',
        implementation: {
          assignee: 'manager',
          formKey: 'approval-form'
        }
      },
      {
        id: 'process-payment',
        name: '处理支付',
        type: 'service',
        implementation: {
          service: 'payment-service',
          operation: 'processPayment'
        },
        compensation: {
          type: 'service',
          service: 'payment-service',
          operation: 'refundPayment'
        }
      },
      {
        id: 'update-inventory',
        name: '更新库存',
        type: 'service',
        implementation: {
          service: 'inventory-service',
          operation: 'updateStock'
        },
        compensation: {
          type: 'service',
          service: 'inventory-service',
          operation: 'restoreStock'
        }
      },
      {
        id: 'send-confirmation',
        name: '发送确认',
        type: 'script',
        implementation: {
          script: `
            console.log('发送订单确认邮件');
            context.variables.confirmationSent = true;
            return { emailSent: true };
          `
        }
      },
      {
        id: 'end',
        name: '结束',
        type: 'end'
      }
    ],
    transitions: [
      { id: 't1', from: 'start', to: 'validate-order' },
      { id: 't2', from: 'validate-order', to: 'check-inventory', condition: 'variables.validationResult === true' },
      { id: 't3', from: 'check-inventory', to: 'approval-gateway' },
      { id: 't4', from: 'approval-gateway', to: 'manual-approval', condition: 'variables.amount > 1000' },
      { id: 't5', from: 'approval-gateway', to: 'process-payment', condition: 'variables.amount <= 1000' },
      { id: 't6', from: 'manual-approval', to: 'process-payment' },
      { id: 't7', from: 'process-payment', to: 'update-inventory' },
      { id: 't8', from: 'update-inventory', to: 'send-confirmation' },
      { id: 't9', from: 'send-confirmation', to: 'end' }
    ]
  }
  
  // 启动引擎
  await engine.start()
  
  // 注册工作流
  engine.registerWorkflow(orderWorkflow)
  
  // 启动流程实例
  const processInstance = await engine.startProcess('order-process', 'user1', {
    orderId: 'ORD-001',
    customerId: 'CUST-001',
    amount: 500,
    items: [{ id: 'ITEM-001', quantity: 2 }]
  })
  
  console.log('流程实例:', processInstance.id)
  console.log('流程状态:', processInstance.status)
  
  // 模拟等待流程完成
  await new Promise(resolve => setTimeout(resolve, 5000))
  
  console.log('最终状态:', processInstance.status)
  console.log('进度:', processInstance.getProgress())
  
  return engine
}

module.exports = {
  WorkflowEngine,
  TaskQueue,
  ServiceRegistry,
  EventBus,
  StateManager,
  CompensationManager,
  WorkflowExecutor
}
```

## 📚 最佳实践总结

1. **流程建模**：清晰定义业务流程和活动边界
2. **服务解耦**：通过编排实现服务间的松耦合
3. **事务管理**：实现补偿机制保证数据一致性
4. **错误处理**：完善的异常处理和恢复机制
5. **状态管理**：持久化流程状态支持容错
6. **监控告警**：全面监控流程执行和性能
7. **版本管理**：支持工作流版本升级和迁移
8. **扩展性**：支持水平扩展和高并发处理

通过掌握服务编排技术，您将能够构建复杂的分布式业务流程。
