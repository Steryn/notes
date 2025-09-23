# 行为型模式

## 📖 概述

行为型模式关注对象之间的通信和职责分配。这些模式定义了对象和类之间的交互方式，使系统更加灵活，能够适应变化的需求。

## 🎯 学习目标

- 掌握主要行为型设计模式的实现
- 理解对象间的协作和通信机制
- 学习责任链和状态模式的应用
- 实现观察者和策略模式的事件系统

## 👀 Observer 观察者模式

### 1. 事件系统实现

```javascript
// 观察者接口
class Observer {
  update(subject, data) {
    throw new Error('update方法必须被实现')
  }
}

// 主题/被观察者
class Subject {
  constructor() {
    this.observers = new Map()
    this.state = {}
  }
  
  // 订阅观察者
  subscribe(eventType, observer, options = {}) {
    if (!(observer instanceof Observer) && typeof observer.update !== 'function') {
      throw new Error('观察者必须实现update方法')
    }
    
    if (!this.observers.has(eventType)) {
      this.observers.set(eventType, [])
    }
    
    const subscription = {
      observer,
      priority: options.priority || 0,
      once: options.once || false,
      filter: options.filter || null,
      subscribed: new Date(),
      id: this.generateSubscriptionId()
    }
    
    this.observers.get(eventType).push(subscription)
    
    // 按优先级排序
    this.observers.get(eventType).sort((a, b) => b.priority - a.priority)
    
    console.log(`观察者订阅: ${eventType} (ID: ${subscription.id})`)
    return subscription.id
  }
  
  // 取消订阅
  unsubscribe(eventType, subscriptionId) {
    if (!this.observers.has(eventType)) {
      return false
    }
    
    const observers = this.observers.get(eventType)
    const index = observers.findIndex(sub => sub.id === subscriptionId)
    
    if (index !== -1) {
      observers.splice(index, 1)
      console.log(`取消订阅: ${eventType} (ID: ${subscriptionId})`)
      return true
    }
    
    return false
  }
  
  // 通知观察者
  notify(eventType, data = {}) {
    if (!this.observers.has(eventType)) {
      return
    }
    
    const eventData = {
      type: eventType,
      data: data,
      subject: this,
      timestamp: new Date()
    }
    
    console.log(`通知观察者: ${eventType}`)
    
    const observers = this.observers.get(eventType).slice() // 复制数组避免修改
    const toRemove = []
    
    observers.forEach(subscription => {
      try {
        // 应用过滤器
        if (subscription.filter && !subscription.filter(eventData)) {
          return
        }
        
        // 调用观察者
        subscription.observer.update(this, eventData)
        
        // 处理一次性订阅
        if (subscription.once) {
          toRemove.push(subscription.id)
        }
        
      } catch (error) {
        console.error(`观察者通知失败 [${subscription.id}]:`, error)
      }
    })
    
    // 移除一次性订阅
    toRemove.forEach(id => this.unsubscribe(eventType, id))
  }
  
  // 设置状态并通知
  setState(newState) {
    const oldState = { ...this.state }
    this.state = { ...this.state, ...newState }
    
    this.notify('stateChanged', {
      oldState,
      newState: this.state,
      changes: newState
    })
  }
  
  getState() {
    return { ...this.state }
  }
  
  generateSubscriptionId() {
    return `sub_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`
  }
  
  getSubscriptionCount(eventType) {
    return this.observers.get(eventType)?.length || 0
  }
  
  getAllSubscriptions() {
    const subscriptions = {}
    this.observers.forEach((subs, eventType) => {
      subscriptions[eventType] = subs.map(sub => ({
        id: sub.id,
        priority: sub.priority,
        once: sub.once,
        subscribed: sub.subscribed
      }))
    })
    return subscriptions
  }
}

// 具体观察者实现
class LoggerObserver extends Observer {
  constructor(logLevel = 'info') {
    super()
    this.logLevel = logLevel
    this.name = 'LoggerObserver'
  }
  
  update(subject, eventData) {
    const logMessage = `[${this.logLevel.toUpperCase()}] ${eventData.type}: ${JSON.stringify(eventData.data)}`
    console.log(`${eventData.timestamp.toISOString()} - ${logMessage}`)
  }
}

class MetricsObserver extends Observer {
  constructor() {
    super()
    this.name = 'MetricsObserver'
    this.metrics = new Map()
  }
  
  update(subject, eventData) {
    const eventType = eventData.type
    
    if (!this.metrics.has(eventType)) {
      this.metrics.set(eventType, {
        count: 0,
        lastOccurred: null,
        firstOccurred: null
      })
    }
    
    const metric = this.metrics.get(eventType)
    metric.count++
    metric.lastOccurred = eventData.timestamp
    
    if (!metric.firstOccurred) {
      metric.firstOccurred = eventData.timestamp
    }
    
    console.log(`指标更新: ${eventType} (总计: ${metric.count})`)
  }
  
  getMetrics() {
    return Object.fromEntries(this.metrics)
  }
  
  getMetric(eventType) {
    return this.metrics.get(eventType) || null
  }
}

class EmailNotificationObserver extends Observer {
  constructor(emailService) {
    super()
    this.emailService = emailService
    this.name = 'EmailNotificationObserver'
  }
  
  update(subject, eventData) {
    // 仅处理特定事件
    const notifiableEvents = ['userRegistered', 'orderPlaced', 'paymentFailed']
    
    if (!notifiableEvents.includes(eventData.type)) {
      return
    }
    
    this.sendNotification(eventData)
  }
  
  async sendNotification(eventData) {
    try {
      const email = this.buildEmail(eventData)
      await this.emailService.send(email)
      console.log(`邮件通知发送: ${eventData.type}`)
      
    } catch (error) {
      console.error(`邮件通知发送失败: ${eventData.type}`, error)
    }
  }
  
  buildEmail(eventData) {
    const templates = {
      userRegistered: {
        subject: '欢迎注册！',
        body: `欢迎 ${eventData.data.username} 加入我们！`
      },
      orderPlaced: {
        subject: '订单确认',
        body: `您的订单 ${eventData.data.orderId} 已确认`
      },
      paymentFailed: {
        subject: '支付失败',
        body: `订单 ${eventData.data.orderId} 支付失败，请重试`
      }
    }
    
    const template = templates[eventData.type] || {
      subject: '系统通知',
      body: JSON.stringify(eventData.data)
    }
    
    return {
      to: eventData.data.email || 'admin@example.com',
      subject: template.subject,
      body: template.body,
      timestamp: eventData.timestamp
    }
  }
}

// 用户管理系统示例
class UserManager extends Subject {
  constructor() {
    super()
    this.users = new Map()
  }
  
  async registerUser(userData) {
    try {
      console.log(`注册用户: ${userData.username}`)
      
      // 验证用户数据
      this.validateUserData(userData)
      
      // 检查用户是否已存在
      if (this.users.has(userData.username)) {
        throw new Error('用户名已存在')
      }
      
      // 创建用户
      const user = {
        id: this.generateUserId(),
        username: userData.username,
        email: userData.email,
        createdAt: new Date(),
        status: 'active'
      }
      
      this.users.set(userData.username, user)
      
      // 通知观察者
      this.notify('userRegistered', {
        userId: user.id,
        username: user.username,
        email: user.email
      })
      
      return user
      
    } catch (error) {
      // 通知注册失败
      this.notify('userRegistrationFailed', {
        username: userData.username,
        error: error.message
      })
      
      throw error
    }
  }
  
  async loginUser(username, password) {
    try {
      const user = this.users.get(username)
      
      if (!user) {
        throw new Error('用户不存在')
      }
      
      if (user.status !== 'active') {
        throw new Error('用户账户已禁用')
      }
      
      // 模拟密码验证
      console.log(`用户登录: ${username}`)
      
      // 更新最后登录时间
      user.lastLogin = new Date()
      
      // 通知观察者
      this.notify('userLoggedIn', {
        userId: user.id,
        username: user.username,
        loginTime: user.lastLogin
      })
      
      return user
      
    } catch (error) {
      // 通知登录失败
      this.notify('userLoginFailed', {
        username: username,
        error: error.message,
        timestamp: new Date()
      })
      
      throw error
    }
  }
  
  validateUserData(userData) {
    if (!userData.username || userData.username.length < 3) {
      throw new Error('用户名至少3个字符')
    }
    
    if (!userData.email || !this.isValidEmail(userData.email)) {
      throw new Error('邮箱格式无效')
    }
  }
  
  isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }
  
  generateUserId() {
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
  }
  
  getUserCount() {
    return this.users.size
  }
  
  getUser(username) {
    return this.users.get(username)
  }
}
```

## 🔗 Strategy 策略模式

### 1. 算法策略实现

```javascript
// 策略接口
class Strategy {
  execute(context, data) {
    throw new Error('execute方法必须被实现')
  }
  
  getName() {
    throw new Error('getName方法必须被实现')
  }
  
  getDescription() {
    return this.getName()
  }
}

// 具体策略：支付策略
class PaymentStrategy extends Strategy {
  constructor() {
    super()
    this.fees = 0
    this.processingTime = 0
  }
  
  calculateFee(amount) {
    return amount * this.fees
  }
  
  getProcessingTime() {
    return this.processingTime
  }
}

class CreditCardPaymentStrategy extends PaymentStrategy {
  constructor() {
    super()
    this.fees = 0.029 // 2.9%
    this.processingTime = 3000 // 3秒
  }
  
  async execute(context, data) {
    const { amount, cardInfo } = data
    
    console.log(`处理信用卡支付: $${amount}`)
    
    // 验证信用卡信息
    this.validateCardInfo(cardInfo)
    
    // 计算手续费
    const fee = this.calculateFee(amount)
    const totalAmount = amount + fee
    
    // 模拟支付处理
    await this.delay(this.processingTime)
    
    // 模拟支付结果
    const success = Math.random() > 0.1 // 90% 成功率
    
    const result = {
      success,
      transactionId: this.generateTransactionId(),
      amount,
      fee,
      totalAmount,
      method: 'credit_card',
      cardLast4: cardInfo.number.slice(-4),
      timestamp: new Date()
    }
    
    if (!success) {
      result.error = '信用卡支付被拒绝'
    }
    
    return result
  }
  
  validateCardInfo(cardInfo) {
    if (!cardInfo.number || cardInfo.number.length < 13) {
      throw new Error('无效的信用卡号')
    }
    
    if (!cardInfo.expiry || !this.isValidExpiry(cardInfo.expiry)) {
      throw new Error('无效的过期日期')
    }
    
    if (!cardInfo.cvv || cardInfo.cvv.length < 3) {
      throw new Error('无效的CVV')
    }
  }
  
  isValidExpiry(expiry) {
    const [month, year] = expiry.split('/')
    const expiryDate = new Date(2000 + parseInt(year), parseInt(month) - 1)
    return expiryDate > new Date()
  }
  
  getName() {
    return 'CreditCardPayment'
  }
  
  getDescription() {
    return `信用卡支付 (手续费: ${(this.fees * 100).toFixed(1)}%)`
  }
  
  generateTransactionId() {
    return `cc_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`
  }
  
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

class PayPalPaymentStrategy extends PaymentStrategy {
  constructor() {
    super()
    this.fees = 0.034 // 3.4%
    this.processingTime = 2000 // 2秒
  }
  
  async execute(context, data) {
    const { amount, paypalAccount } = data
    
    console.log(`处理PayPal支付: $${amount}`)
    
    // 验证PayPal账户
    this.validatePayPalAccount(paypalAccount)
    
    // 计算手续费
    const fee = this.calculateFee(amount)
    const totalAmount = amount + fee
    
    // 模拟支付处理
    await this.delay(this.processingTime)
    
    // 模拟支付结果
    const success = Math.random() > 0.05 // 95% 成功率
    
    const result = {
      success,
      transactionId: this.generateTransactionId(),
      amount,
      fee,
      totalAmount,
      method: 'paypal',
      account: paypalAccount.email,
      timestamp: new Date()
    }
    
    if (!success) {
      result.error = 'PayPal支付失败'
    }
    
    return result
  }
  
  validatePayPalAccount(account) {
    if (!account.email || !this.isValidEmail(account.email)) {
      throw new Error('无效的PayPal邮箱')
    }
  }
  
  isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }
  
  getName() {
    return 'PayPalPayment'
  }
  
  getDescription() {
    return `PayPal支付 (手续费: ${(this.fees * 100).toFixed(1)}%)`
  }
  
  generateTransactionId() {
    return `pp_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`
  }
  
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

class BankTransferStrategy extends PaymentStrategy {
  constructor() {
    super()
    this.fees = 0.01 // 1%
    this.processingTime = 5000 // 5秒
  }
  
  async execute(context, data) {
    const { amount, bankAccount } = data
    
    console.log(`处理银行转账: $${amount}`)
    
    // 验证银行账户
    this.validateBankAccount(bankAccount)
    
    // 计算手续费
    const fee = this.calculateFee(amount)
    const totalAmount = amount + fee
    
    // 模拟转账处理
    await this.delay(this.processingTime)
    
    // 银行转账通常成功率很高
    const success = Math.random() > 0.02 // 98% 成功率
    
    const result = {
      success,
      transactionId: this.generateTransactionId(),
      amount,
      fee,
      totalAmount,
      method: 'bank_transfer',
      bankName: bankAccount.bankName,
      accountLast4: bankAccount.accountNumber.slice(-4),
      timestamp: new Date()
    }
    
    if (!success) {
      result.error = '银行转账失败'
    }
    
    return result
  }
  
  validateBankAccount(account) {
    if (!account.accountNumber || account.accountNumber.length < 8) {
      throw new Error('无效的银行账号')
    }
    
    if (!account.routingNumber || account.routingNumber.length !== 9) {
      throw new Error('无效的路由号')
    }
    
    if (!account.bankName) {
      throw new Error('银行名称不能为空')
    }
  }
  
  getName() {
    return 'BankTransfer'
  }
  
  getDescription() {
    return `银行转账 (手续费: ${(this.fees * 100).toFixed(1)}%)`
  }
  
  generateTransactionId() {
    return `bt_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`
  }
  
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// 策略上下文
class PaymentContext {
  constructor() {
    this.strategies = new Map()
    this.defaultStrategy = null
    this.currentStrategy = null
    this.paymentHistory = []
  }
  
  // 注册策略
  registerStrategy(name, strategy) {
    if (!(strategy instanceof Strategy)) {
      throw new Error('策略必须继承Strategy类')
    }
    
    this.strategies.set(name, strategy)
    console.log(`注册支付策略: ${name}`)
    
    if (!this.defaultStrategy) {
      this.defaultStrategy = name
    }
  }
  
  // 设置当前策略
  setStrategy(strategyName) {
    if (!this.strategies.has(strategyName)) {
      throw new Error(`策略不存在: ${strategyName}`)
    }
    
    this.currentStrategy = strategyName
    console.log(`切换支付策略: ${strategyName}`)
  }
  
  // 获取可用策略
  getAvailableStrategies() {
    const strategies = []
    
    this.strategies.forEach((strategy, name) => {
      strategies.push({
        name,
        description: strategy.getDescription(),
        processingTime: strategy.getProcessingTime ? strategy.getProcessingTime() : 'N/A'
      })
    })
    
    return strategies
  }
  
  // 自动选择最佳策略
  selectBestStrategy(amount, criteria = {}) {
    const availableStrategies = Array.from(this.strategies.entries())
    
    // 根据标准评分
    const scored = availableStrategies.map(([name, strategy]) => {
      let score = 0
      
      // 手续费权重
      if (criteria.minimizeFees) {
        const fee = strategy.calculateFee ? strategy.calculateFee(amount) : 0
        score += criteria.minimizeFees * (1 - fee / amount)
      }
      
      // 处理时间权重
      if (criteria.minimizeTime) {
        const time = strategy.getProcessingTime ? strategy.getProcessingTime() : 5000
        score += criteria.minimizeTime * (1 - time / 10000) // 假设最大10秒
      }
      
      // 可靠性权重（这里简化处理）
      if (criteria.maximizeReliability) {
        const reliability = this.getStrategyReliability(name)
        score += criteria.maximizeReliability * reliability
      }
      
      return { name, strategy, score }
    })
    
    // 选择得分最高的策略
    scored.sort((a, b) => b.score - a.score)
    const best = scored[0]
    
    console.log(`自动选择最佳策略: ${best.name} (得分: ${best.score.toFixed(2)})`)
    return best.name
  }
  
  getStrategyReliability(strategyName) {
    // 根据历史记录计算可靠性
    const history = this.paymentHistory.filter(p => p.method === strategyName)
    
    if (history.length === 0) {
      return 0.9 // 默认可靠性
    }
    
    const successCount = history.filter(p => p.success).length
    return successCount / history.length
  }
  
  // 执行支付
  async executePayment(amount, paymentData, strategyName = null) {
    const strategy = strategyName || this.currentStrategy || this.defaultStrategy
    
    if (!strategy) {
      throw new Error('未设置支付策略')
    }
    
    const strategyInstance = this.strategies.get(strategy)
    
    if (!strategyInstance) {
      throw new Error(`策略不存在: ${strategy}`)
    }
    
    try {
      console.log(`执行支付: ${strategy}`)
      
      const result = await strategyInstance.execute(this, {
        amount,
        ...paymentData
      })
      
      // 记录支付历史
      this.paymentHistory.push({
        ...result,
        strategy: strategy
      })
      
      return result
      
    } catch (error) {
      console.error(`支付执行失败 [${strategy}]:`, error)
      
      // 记录失败
      this.paymentHistory.push({
        success: false,
        error: error.message,
        strategy: strategy,
        amount,
        timestamp: new Date()
      })
      
      throw error
    }
  }
  
  // 获取支付统计
  getPaymentStatistics() {
    const stats = {
      totalPayments: this.paymentHistory.length,
      successfulPayments: 0,
      failedPayments: 0,
      totalAmount: 0,
      totalFees: 0,
      strategyStats: {}
    }
    
    this.paymentHistory.forEach(payment => {
      if (payment.success) {
        stats.successfulPayments++
        stats.totalAmount += payment.amount || 0
        stats.totalFees += payment.fee || 0
      } else {
        stats.failedPayments++
      }
      
      // 策略统计
      const strategyName = payment.strategy || 'unknown'
      if (!stats.strategyStats[strategyName]) {
        stats.strategyStats[strategyName] = {
          count: 0,
          successCount: 0,
          totalAmount: 0
        }
      }
      
      stats.strategyStats[strategyName].count++
      if (payment.success) {
        stats.strategyStats[strategyName].successCount++
        stats.strategyStats[strategyName].totalAmount += payment.amount || 0
      }
    })
    
    stats.successRate = stats.totalPayments > 0 ? 
      stats.successfulPayments / stats.totalPayments : 0
    
    return stats
  }
}
```

## 🔄 State 状态模式

### 1. 状态机实现

```javascript
// 状态接口
class State {
  constructor(name) {
    this.name = name
  }
  
  enter(context) {
    console.log(`进入状态: ${this.name}`)
  }
  
  exit(context) {
    console.log(`退出状态: ${this.name}`)
  }
  
  handle(context, event) {
    throw new Error('handle方法必须被实现')
  }
  
  canTransitionTo(targetState) {
    return true // 默认允许所有转换
  }
}

// 状态上下文
class StateMachine {
  constructor(initialState) {
    this.currentState = null
    this.states = new Map()
    this.transitions = new Map()
    this.history = []
    this.listeners = []
    
    if (initialState) {
      this.addState(initialState)
      this.setState(initialState.name)
    }
  }
  
  // 添加状态
  addState(state) {
    if (!(state instanceof State)) {
      throw new Error('状态必须继承State类')
    }
    
    this.states.set(state.name, state)
    console.log(`添加状态: ${state.name}`)
  }
  
  // 添加状态转换规则
  addTransition(fromState, toState, event, condition = null) {
    const transitionKey = `${fromState}:${event}`
    
    if (!this.transitions.has(transitionKey)) {
      this.transitions.set(transitionKey, [])
    }
    
    this.transitions.get(transitionKey).push({
      toState,
      condition
    })
    
    console.log(`添加转换: ${fromState} --[${event}]--> ${toState}`)
  }
  
  // 设置当前状态
  setState(stateName) {
    const newState = this.states.get(stateName)
    
    if (!newState) {
      throw new Error(`状态不存在: ${stateName}`)
    }
    
    if (this.currentState) {
      // 检查是否允许转换
      if (!this.currentState.canTransitionTo(newState)) {
        throw new Error(`不允许从 ${this.currentState.name} 转换到 ${stateName}`)
      }
      
      this.currentState.exit(this)
    }
    
    const previousState = this.currentState
    this.currentState = newState
    
    // 记录状态变化历史
    this.history.push({
      from: previousState?.name || null,
      to: newState.name,
      timestamp: new Date()
    })
    
    this.currentState.enter(this)
    
    // 通知监听器
    this.notifyStateChange(previousState, newState)
  }
  
  // 处理事件
  handleEvent(event, data = {}) {
    if (!this.currentState) {
      throw new Error('未设置当前状态')
    }
    
    console.log(`处理事件: ${event} (当前状态: ${this.currentState.name})`)
    
    // 检查是否有定义的转换
    const transitionKey = `${this.currentState.name}:${event}`
    const transitions = this.transitions.get(transitionKey)
    
    if (transitions) {
      // 查找符合条件的转换
      for (const transition of transitions) {
        if (!transition.condition || transition.condition(this, event, data)) {
          this.setState(transition.toState)
          return
        }
      }
    }
    
    // 让当前状态处理事件
    this.currentState.handle(this, event, data)
  }
  
  // 添加状态变化监听器
  addStateChangeListener(listener) {
    this.listeners.push(listener)
  }
  
  // 通知状态变化
  notifyStateChange(fromState, toState) {
    this.listeners.forEach(listener => {
      try {
        listener(fromState, toState, this)
      } catch (error) {
        console.error('状态变化监听器错误:', error)
      }
    })
  }
  
  // 获取当前状态
  getCurrentState() {
    return this.currentState
  }
  
  // 获取状态历史
  getStateHistory() {
    return [...this.history]
  }
  
  // 检查是否可以处理事件
  canHandleEvent(event) {
    if (!this.currentState) {
      return false
    }
    
    const transitionKey = `${this.currentState.name}:${event}`
    return this.transitions.has(transitionKey)
  }
  
  // 获取可用的转换
  getAvailableTransitions() {
    if (!this.currentState) {
      return []
    }
    
    const available = []
    
    this.transitions.forEach((transitions, key) => {
      const [fromState, event] = key.split(':')
      
      if (fromState === this.currentState.name) {
        transitions.forEach(transition => {
          available.push({
            event,
            toState: transition.toState,
            hasCondition: !!transition.condition
          })
        })
      }
    })
    
    return available
  }
}

// 订单状态示例
class OrderState extends State {
  constructor(name, allowedActions = []) {
    super(name)
    this.allowedActions = allowedActions
  }
  
  canPerformAction(action) {
    return this.allowedActions.includes(action)
  }
}

// 具体订单状态
class PendingOrderState extends OrderState {
  constructor() {
    super('pending', ['confirm', 'cancel', 'modify'])
  }
  
  handle(context, event, data) {
    switch (event) {
      case 'confirm':
        this.confirmOrder(context, data)
        break
      case 'cancel':
        this.cancelOrder(context, data)
        break
      case 'modify':
        this.modifyOrder(context, data)
        break
      default:
        console.warn(`待处理订单无法处理事件: ${event}`)
    }
  }
  
  confirmOrder(context, data) {
    console.log('确认订单...')
    
    // 执行确认逻辑
    if (this.validateOrder(context, data)) {
      context.orderData = { ...context.orderData, ...data }
      context.setState('confirmed')
    } else {
      console.error('订单确认失败')
    }
  }
  
  cancelOrder(context, data) {
    console.log('取消订单...')
    context.cancelReason = data.reason || '用户取消'
    context.setState('cancelled')
  }
  
  modifyOrder(context, data) {
    console.log('修改订单...')
    context.orderData = { ...context.orderData, ...data.changes }
    console.log('订单修改完成，仍为待处理状态')
  }
  
  validateOrder(context, data) {
    // 简单验证逻辑
    return context.orderData && context.orderData.items && context.orderData.items.length > 0
  }
}

class ConfirmedOrderState extends OrderState {
  constructor() {
    super('confirmed', ['ship', 'cancel'])
  }
  
  enter(context) {
    super.enter(context)
    
    // 进入确认状态时的操作
    this.reserveInventory(context)
    this.sendConfirmationEmail(context)
  }
  
  handle(context, event, data) {
    switch (event) {
      case 'ship':
        this.shipOrder(context, data)
        break
      case 'cancel':
        this.cancelOrder(context, data)
        break
      default:
        console.warn(`已确认订单无法处理事件: ${event}`)
    }
  }
  
  shipOrder(context, data) {
    console.log('发货订单...')
    context.trackingNumber = data.trackingNumber
    context.shippedAt = new Date()
    context.setState('shipped')
  }
  
  cancelOrder(context, data) {
    console.log('取消已确认订单...')
    
    // 释放库存
    this.releaseInventory(context)
    
    context.cancelReason = data.reason || '订单取消'
    context.setState('cancelled')
  }
  
  reserveInventory(context) {
    console.log('预留库存...')
    // 预留库存逻辑
  }
  
  releaseInventory(context) {
    console.log('释放库存...')
    // 释放库存逻辑
  }
  
  sendConfirmationEmail(context) {
    console.log('发送确认邮件...')
    // 发送邮件逻辑
  }
}

class ShippedOrderState extends OrderState {
  constructor() {
    super('shipped', ['deliver', 'return'])
  }
  
  enter(context) {
    super.enter(context)
    this.sendShippingNotification(context)
  }
  
  handle(context, event, data) {
    switch (event) {
      case 'deliver':
        this.deliverOrder(context, data)
        break
      case 'return':
        this.returnOrder(context, data)
        break
      default:
        console.warn(`已发货订单无法处理事件: ${event}`)
    }
  }
  
  deliverOrder(context, data) {
    console.log('订单已送达...')
    context.deliveredAt = new Date()
    context.deliverySignature = data.signature
    context.setState('delivered')
  }
  
  returnOrder(context, data) {
    console.log('订单退货...')
    context.returnReason = data.reason
    context.returnedAt = new Date()
    context.setState('returned')
  }
  
  sendShippingNotification(context) {
    console.log(`发送发货通知，跟踪号: ${context.trackingNumber}`)
  }
}

class DeliveredOrderState extends OrderState {
  constructor() {
    super('delivered', ['complete', 'return'])
  }
  
  enter(context) {
    super.enter(context)
    
    // 自动完成订单（7天后）
    setTimeout(() => {
      if (context.getCurrentState().name === 'delivered') {
        context.handleEvent('complete', { autoCompleted: true })
      }
    }, 7 * 24 * 60 * 60 * 1000) // 7天
  }
  
  handle(context, event, data) {
    switch (event) {
      case 'complete':
        this.completeOrder(context, data)
        break
      case 'return':
        this.returnOrder(context, data)
        break
      default:
        console.warn(`已送达订单无法处理事件: ${event}`)
    }
  }
  
  completeOrder(context, data) {
    console.log('完成订单...')
    context.completedAt = new Date()
    context.autoCompleted = data.autoCompleted || false
    context.setState('completed')
  }
  
  returnOrder(context, data) {
    console.log('送达后退货...')
    context.returnReason = data.reason
    context.returnedAt = new Date()
    context.setState('returned')
  }
}

class CompletedOrderState extends OrderState {
  constructor() {
    super('completed', [])
  }
  
  enter(context) {
    super.enter(context)
    this.processPayment(context)
    this.updateAnalytics(context)
  }
  
  handle(context, event, data) {
    console.warn(`已完成订单无法处理任何事件: ${event}`)
  }
  
  canTransitionTo(targetState) {
    return false // 完成状态不能转换到其他状态
  }
  
  processPayment(context) {
    console.log('处理最终付款...')
    // 处理付款逻辑
  }
  
  updateAnalytics(context) {
    console.log('更新分析数据...')
    // 更新分析逻辑
  }
}

class CancelledOrderState extends OrderState {
  constructor() {
    super('cancelled', [])
  }
  
  enter(context) {
    super.enter(context)
    this.processRefund(context)
    this.logCancellation(context)
  }
  
  handle(context, event, data) {
    console.warn(`已取消订单无法处理任何事件: ${event}`)
  }
  
  canTransitionTo(targetState) {
    return false // 取消状态不能转换到其他状态
  }
  
  processRefund(context) {
    console.log('处理退款...')
    // 退款逻辑
  }
  
  logCancellation(context) {
    console.log(`记录取消原因: ${context.cancelReason}`)
    // 记录取消原因
  }
}

// 订单管理系统
class OrderManager extends StateMachine {
  constructor() {
    super()
    
    this.orderData = {}
    this.setupStates()
    this.setupTransitions()
    this.setState('pending')
  }
  
  setupStates() {
    this.addState(new PendingOrderState())
    this.addState(new ConfirmedOrderState())
    this.addState(new ShippedOrderState())
    this.addState(new DeliveredOrderState())
    this.addState(new CompletedOrderState())
    this.addState(new CancelledOrderState())
  }
  
  setupTransitions() {
    // 待处理 -> 已确认
    this.addTransition('pending', 'confirmed', 'confirm', 
      (context, event, data) => {
        return data.paymentConfirmed === true
      })
    
    // 待处理 -> 已取消
    this.addTransition('pending', 'cancelled', 'cancel')
    
    // 已确认 -> 已发货
    this.addTransition('confirmed', 'shipped', 'ship',
      (context, event, data) => {
        return data.trackingNumber && data.trackingNumber.length > 0
      })
    
    // 已确认 -> 已取消
    this.addTransition('confirmed', 'cancelled', 'cancel')
    
    // 已发货 -> 已送达
    this.addTransition('shipped', 'delivered', 'deliver')
    
    // 已送达 -> 已完成
    this.addTransition('delivered', 'completed', 'complete')
  }
  
  createOrder(orderData) {
    this.orderData = {
      id: this.generateOrderId(),
      items: orderData.items,
      customer: orderData.customer,
      total: orderData.total,
      createdAt: new Date()
    }
    
    console.log(`创建订单: ${this.orderData.id}`)
    return this.orderData
  }
  
  generateOrderId() {
    return `order_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
  }
  
  getOrderStatus() {
    return {
      orderId: this.orderData.id,
      currentState: this.currentState.name,
      canPerformActions: this.currentState.allowedActions,
      availableTransitions: this.getAvailableTransitions(),
      history: this.getStateHistory()
    }
  }
}
```

## 📚 最佳实践总结

1. **观察者模式**：实现松耦合的事件通知机制
2. **策略模式**：封装算法族，使算法可以互换
3. **状态模式**：将状态转换逻辑封装在状态对象中
4. **命令模式**：将请求封装成对象，支持撤销和重做
5. **责任链模式**：将请求沿着处理链传递
6. **模板方法模式**：定义算法骨架，子类实现具体步骤
7. **访问者模式**：在不修改对象结构的前提下定义新操作
8. **中介者模式**：用中介对象封装对象间的交互

通过掌握行为型模式，您将能够设计出更加灵活和可维护的对象交互机制。
