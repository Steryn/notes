# 六边形架构

## 📖 概述

六边形架构（Hexagonal Architecture），也称为端口和适配器架构（Ports and Adapters），是由Alistair Cockburn提出的一种软件架构模式。它将应用程序的核心业务逻辑与外部系统隔离，通过端口和适配器实现松耦合和高可测试性。

## 🎯 学习目标

- 理解六边形架构的核心概念和设计原则
- 掌握端口和适配器的设计与实现
- 学习依赖反转和依赖注入技术
- 实现可测试的企业级应用架构

## 🏗️ 六边形架构核心概念

### 1. 架构组件设计

```javascript
// 六边形架构核心框架
class HexagonalArchitecture {
  constructor() {
    this.core = new ApplicationCore()
    this.ports = new PortRegistry()
    this.adapters = new AdapterRegistry()
    this.dependencyContainer = new DependencyContainer()
  }
  
  // 应用核心
  class ApplicationCore {
    constructor() {
      this.domainServices = new Map()
      this.useCases = new Map()
      this.entities = new Map()
      this.valueObjects = new Map()
    }
    
    // 领域实体
    defineDomainEntity(entityConfig) {
      class Entity {
        constructor(id, data) {
          this.id = id
          this.createdAt = new Date()
          this.updatedAt = new Date()
          Object.assign(this, data)
        }
        
        // 业务规则验证
        validate() {
          const errors = []
          
          if (!this.id) {
            errors.push('实体ID不能为空')
          }
          
          // 执行实体特定的验证规则
          const customValidation = entityConfig.validationRules || []
          customValidation.forEach(rule => {
            if (!rule.validate(this)) {
              errors.push(rule.message)
            }
          })
          
          return {
            isValid: errors.length === 0,
            errors
          }
        }
        
        // 领域事件
        raiseEvent(eventType, eventData) {
          const event = {
            id: this.generateEventId(),
            type: eventType,
            entityId: this.id,
            entityType: entityConfig.name,
            data: eventData,
            timestamp: new Date()
          }
          
          // 发布事件到事件总线
          this.eventBus.publish(event)
          
          return event
        }
        
        generateEventId() {
          return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        }
      }
      
      Entity.prototype.eventBus = this.eventBus
      this.entities.set(entityConfig.name, Entity)
      
      console.log(`领域实体定义完成: ${entityConfig.name}`)
      return Entity
    }
    
    // 值对象
    defineValueObject(valueObjectConfig) {
      class ValueObject {
        constructor(data) {
          Object.assign(this, data)
          Object.freeze(this) // 值对象不可变
        }
        
        // 值相等性比较
        equals(other) {
          if (!other || other.constructor !== this.constructor) {
            return false
          }
          
          return JSON.stringify(this) === JSON.stringify(other)
        }
        
        // 值对象验证
        validate() {
          const errors = []
          
          const validationRules = valueObjectConfig.validationRules || []
          validationRules.forEach(rule => {
            if (!rule.validate(this)) {
              errors.push(rule.message)
            }
          })
          
          return {
            isValid: errors.length === 0,
            errors
          }
        }
      }
      
      this.valueObjects.set(valueObjectConfig.name, ValueObject)
      
      console.log(`值对象定义完成: ${valueObjectConfig.name}`)
      return ValueObject
    }
    
    // 领域服务
    defineDomainService(serviceConfig) {
      class DomainService {
        constructor(dependencies) {
          this.dependencies = dependencies
          this.name = serviceConfig.name
        }
        
        // 执行领域逻辑
        async execute(operation, data) {
          console.log(`执行领域服务: ${this.name}.${operation}`)
          
          // 前置条件检查
          if (serviceConfig.preconditions && serviceConfig.preconditions[operation]) {
            const precondition = serviceConfig.preconditions[operation]
            if (!await precondition(data, this.dependencies)) {
              throw new Error(`前置条件不满足: ${operation}`)
            }
          }
          
          // 执行业务逻辑
          const businessLogic = serviceConfig.operations[operation]
          if (!businessLogic) {
            throw new Error(`操作不存在: ${operation}`)
          }
          
          const result = await businessLogic(data, this.dependencies)
          
          // 后置条件检查
          if (serviceConfig.postconditions && serviceConfig.postconditions[operation]) {
            const postcondition = serviceConfig.postconditions[operation]
            if (!await postcondition(result, data, this.dependencies)) {
              throw new Error(`后置条件不满足: ${operation}`)
            }
          }
          
          return result
        }
      }
      
      this.domainServices.set(serviceConfig.name, DomainService)
      
      console.log(`领域服务定义完成: ${serviceConfig.name}`)
      return DomainService
    }
    
    // 用例定义
    defineUseCase(useCaseConfig) {
      class UseCase {
        constructor(dependencies) {
          this.dependencies = dependencies
          this.name = useCaseConfig.name
        }
        
        async execute(input) {
          console.log(`执行用例: ${this.name}`)
          
          try {
            // 输入验证
            const validationResult = this.validateInput(input)
            if (!validationResult.isValid) {
              throw new Error(`输入验证失败: ${validationResult.errors.join(', ')}`)
            }
            
            // 权限检查
            await this.checkPermissions(input)
            
            // 执行业务逻辑
            const result = await this.executeBusinessLogic(input)
            
            // 输出验证
            const outputValidation = this.validateOutput(result)
            if (!outputValidation.isValid) {
              throw new Error(`输出验证失败: ${outputValidation.errors.join(', ')}`)
            }
            
            return {
              success: true,
              data: result,
              timestamp: new Date()
            }
            
          } catch (error) {
            console.error(`用例执行失败: ${this.name}`, error)
            
            return {
              success: false,
              error: error.message,
              timestamp: new Date()
            }
          }
        }
        
        validateInput(input) {
          const errors = []
          
          // 必填字段检查
          if (useCaseConfig.requiredFields) {
            useCaseConfig.requiredFields.forEach(field => {
              if (!input[field]) {
                errors.push(`必填字段缺失: ${field}`)
              }
            })
          }
          
          // 自定义验证规则
          if (useCaseConfig.inputValidation) {
            const customErrors = useCaseConfig.inputValidation(input)
            errors.push(...customErrors)
          }
          
          return {
            isValid: errors.length === 0,
            errors
          }
        }
        
        async checkPermissions(input) {
          if (useCaseConfig.permissions) {
            const hasPermission = await this.dependencies.authorizationService
              .checkPermission(input.user, useCaseConfig.permissions)
            
            if (!hasPermission) {
              throw new Error('权限不足')
            }
          }
        }
        
        async executeBusinessLogic(input) {
          return await useCaseConfig.execute(input, this.dependencies)
        }
        
        validateOutput(output) {
          const errors = []
          
          if (useCaseConfig.outputValidation) {
            const customErrors = useCaseConfig.outputValidation(output)
            errors.push(...customErrors)
          }
          
          return {
            isValid: errors.length === 0,
            errors
          }
        }
      }
      
      this.useCases.set(useCaseConfig.name, UseCase)
      
      console.log(`用例定义完成: ${useCaseConfig.name}`)
      return UseCase
    }
  }
  
  // 端口注册表
  class PortRegistry {
    constructor() {
      this.primaryPorts = new Map() // 主要端口（驱动端口）
      this.secondaryPorts = new Map() // 次要端口（被驱动端口）
    }
    
    // 定义主要端口（入站）
    definePrimaryPort(portConfig) {
      const port = {
        name: portConfig.name,
        description: portConfig.description,
        methods: portConfig.methods || [],
        protocol: portConfig.protocol || 'http',
        version: portConfig.version || '1.0',
        contract: this.generateContract(portConfig.methods)
      }
      
      this.primaryPorts.set(port.name, port)
      
      console.log(`主要端口定义完成: ${port.name}`)
      return port
    }
    
    // 定义次要端口（出站）
    defineSecondaryPort(portConfig) {
      const port = {
        name: portConfig.name,
        description: portConfig.description,
        interface: portConfig.interface,
        version: portConfig.version || '1.0',
        contract: this.generateInterfaceContract(portConfig.interface)
      }
      
      this.secondaryPorts.set(port.name, port)
      
      console.log(`次要端口定义完成: ${port.name}`)
      return port
    }
    
    generateContract(methods) {
      return methods.map(method => ({
        name: method.name,
        parameters: method.parameters || [],
        returnType: method.returnType || 'void',
        exceptions: method.exceptions || [],
        description: method.description
      }))
    }
    
    generateInterfaceContract(interfaceDefinition) {
      return {
        methods: interfaceDefinition.methods || [],
        properties: interfaceDefinition.properties || [],
        events: interfaceDefinition.events || []
      }
    }
  }
  
  // 适配器注册表
  class AdapterRegistry {
    constructor() {
      this.primaryAdapters = new Map() // 主要适配器（入站适配器）
      this.secondaryAdapters = new Map() // 次要适配器（出站适配器）
    }
    
    // 主要适配器（Web控制器、REST API等）
    definePrimaryAdapter(adapterConfig) {
      class PrimaryAdapter {
        constructor(port, dependencies) {
          this.port = port
          this.dependencies = dependencies
          this.name = adapterConfig.name
        }
        
        // 适配器路由处理
        async handleRequest(request) {
          try {
            console.log(`主要适配器处理请求: ${this.name}`)
            
            // 请求预处理
            const processedRequest = await this.preprocessRequest(request)
            
            // 调用端口方法
            const portMethod = this.port[processedRequest.method]
            if (!portMethod) {
              throw new Error(`端口方法不存在: ${processedRequest.method}`)
            }
            
            const result = await portMethod.call(this.port, processedRequest.data)
            
            // 响应后处理
            const response = await this.postprocessResponse(result)
            
            return response
            
          } catch (error) {
            console.error(`适配器请求处理失败: ${this.name}`, error)
            return this.handleError(error)
          }
        }
        
        async preprocessRequest(request) {
          // 请求转换逻辑
          return {
            method: this.extractMethod(request),
            data: this.extractData(request),
            headers: request.headers,
            user: await this.extractUser(request)
          }
        }
        
        async postprocessResponse(result) {
          // 响应转换逻辑
          return {
            status: result.success ? 200 : 400,
            data: result.data,
            timestamp: new Date(),
            version: '1.0'
          }
        }
        
        handleError(error) {
          return {
            status: 500,
            error: error.message,
            timestamp: new Date()
          }
        }
        
        extractMethod(request) {
          return adapterConfig.methodExtractor ? 
            adapterConfig.methodExtractor(request) : 
            request.path.split('/').pop()
        }
        
        extractData(request) {
          return adapterConfig.dataExtractor ? 
            adapterConfig.dataExtractor(request) : 
            request.body
        }
        
        async extractUser(request) {
          return adapterConfig.userExtractor ? 
            await adapterConfig.userExtractor(request) : 
            null
        }
      }
      
      this.primaryAdapters.set(adapterConfig.name, PrimaryAdapter)
      
      console.log(`主要适配器定义完成: ${adapterConfig.name}`)
      return PrimaryAdapter
    }
    
    // 次要适配器（数据库、外部服务等）
    defineSecondaryAdapter(adapterConfig) {
      class SecondaryAdapter {
        constructor(configuration) {
          this.config = configuration
          this.name = adapterConfig.name
          this.connection = null
        }
        
        // 连接初始化
        async initialize() {
          try {
            console.log(`初始化次要适配器: ${this.name}`)
            
            this.connection = await adapterConfig.connectionFactory(this.config)
            
            // 健康检查
            await this.healthCheck()
            
            console.log(`适配器初始化完成: ${this.name}`)
            
          } catch (error) {
            console.error(`适配器初始化失败: ${this.name}`, error)
            throw error
          }
        }
        
        // 实现端口接口
        async execute(operation, data) {
          try {
            console.log(`执行适配器操作: ${this.name}.${operation}`)
            
            // 连接检查
            await this.ensureConnection()
            
            // 数据转换
            const adaptedData = this.adaptOutgoingData(data)
            
            // 执行操作
            const operationHandler = adapterConfig.operations[operation]
            if (!operationHandler) {
              throw new Error(`操作不存在: ${operation}`)
            }
            
            const result = await operationHandler(this.connection, adaptedData)
            
            // 结果转换
            const adaptedResult = this.adaptIncomingData(result)
            
            return adaptedResult
            
          } catch (error) {
            console.error(`适配器操作失败: ${this.name}.${operation}`, error)
            throw error
          }
        }
        
        adaptOutgoingData(data) {
          return adapterConfig.outgoingDataAdapter ? 
            adapterConfig.outgoingDataAdapter(data) : 
            data
        }
        
        adaptIncomingData(data) {
          return adapterConfig.incomingDataAdapter ? 
            adapterConfig.incomingDataAdapter(data) : 
            data
        }
        
        async ensureConnection() {
          if (!this.connection || !await this.healthCheck()) {
            await this.initialize()
          }
        }
        
        async healthCheck() {
          try {
            if (adapterConfig.healthCheck) {
              return await adapterConfig.healthCheck(this.connection)
            }
            return true
          } catch (error) {
            return false
          }
        }
        
        async disconnect() {
          if (this.connection && adapterConfig.disconnect) {
            await adapterConfig.disconnect(this.connection)
            this.connection = null
          }
        }
      }
      
      this.secondaryAdapters.set(adapterConfig.name, SecondaryAdapter)
      
      console.log(`次要适配器定义完成: ${adapterConfig.name}`)
      return SecondaryAdapter
    }
  }
}
```

### 2. 依赖注入容器

```javascript
// 依赖注入容器实现
class DependencyContainer {
  constructor() {
    this.services = new Map()
    this.instances = new Map()
    this.factories = new Map()
    this.scopes = new Map()
  }
  
  // 注册服务
  register(name, definition, options = {}) {
    const serviceDefinition = {
      name,
      definition,
      scope: options.scope || 'singleton', // singleton, transient, scoped
      dependencies: options.dependencies || [],
      factory: options.factory || null,
      lifecycle: {
        onCreate: options.onCreate || null,
        onDestroy: options.onDestroy || null
      }
    }
    
    this.services.set(name, serviceDefinition)
    
    console.log(`服务注册完成: ${name}`)
    return this
  }
  
  // 注册工厂
  registerFactory(name, factory, options = {}) {
    const factoryDefinition = {
      name,
      factory,
      scope: options.scope || 'singleton',
      dependencies: options.dependencies || []
    }
    
    this.factories.set(name, factoryDefinition)
    
    console.log(`工厂注册完成: ${name}`)
    return this
  }
  
  // 解析服务
  async resolve(name, scope = null) {
    try {
      const serviceDefinition = this.services.get(name)
      if (!serviceDefinition) {
        throw new Error(`服务未注册: ${name}`)
      }
      
      // 根据作用域决定实例化策略
      switch (serviceDefinition.scope) {
        case 'singleton':
          return await this.resolveSingleton(serviceDefinition)
        case 'transient':
          return await this.resolveTransient(serviceDefinition)
        case 'scoped':
          return await this.resolveScoped(serviceDefinition, scope)
        default:
          throw new Error(`未知的服务作用域: ${serviceDefinition.scope}`)
      }
      
    } catch (error) {
      console.error(`服务解析失败: ${name}`, error)
      throw error
    }
  }
  
  async resolveSingleton(serviceDefinition) {
    const name = serviceDefinition.name
    
    if (this.instances.has(name)) {
      return this.instances.get(name)
    }
    
    const instance = await this.createInstance(serviceDefinition)
    this.instances.set(name, instance)
    
    return instance
  }
  
  async resolveTransient(serviceDefinition) {
    return await this.createInstance(serviceDefinition)
  }
  
  async resolveScoped(serviceDefinition, scope) {
    const scopeKey = `${scope}:${serviceDefinition.name}`
    
    if (!this.scopes.has(scope)) {
      this.scopes.set(scope, new Map())
    }
    
    const scopedInstances = this.scopes.get(scope)
    
    if (scopedInstances.has(serviceDefinition.name)) {
      return scopedInstances.get(serviceDefinition.name)
    }
    
    const instance = await this.createInstance(serviceDefinition)
    scopedInstances.set(serviceDefinition.name, instance)
    
    return instance
  }
  
  async createInstance(serviceDefinition) {
    console.log(`创建服务实例: ${serviceDefinition.name}`)
    
    // 解析依赖
    const dependencies = await this.resolveDependencies(serviceDefinition.dependencies)
    
    let instance
    
    if (serviceDefinition.factory) {
      // 使用工厂创建
      instance = await serviceDefinition.factory(dependencies)
    } else if (typeof serviceDefinition.definition === 'function') {
      // 构造函数实例化
      instance = new serviceDefinition.definition(dependencies)
    } else {
      // 直接使用对象
      instance = serviceDefinition.definition
    }
    
    // 生命周期回调
    if (serviceDefinition.lifecycle.onCreate) {
      await serviceDefinition.lifecycle.onCreate(instance, dependencies)
    }
    
    return instance
  }
  
  async resolveDependencies(dependencies) {
    const resolved = {}
    
    for (const dependency of dependencies) {
      if (typeof dependency === 'string') {
        resolved[dependency] = await this.resolve(dependency)
      } else if (typeof dependency === 'object') {
        resolved[dependency.name] = await this.resolve(dependency.service, dependency.scope)
      }
    }
    
    return resolved
  }
  
  // 创建作用域
  createScope(scopeName) {
    const scope = {
      name: scopeName,
      instances: new Map(),
      disposed: false
    }
    
    this.scopes.set(scopeName, scope.instances)
    
    // 返回作用域控制器
    return {
      resolve: async (serviceName) => {
        if (scope.disposed) {
          throw new Error('作用域已释放')
        }
        return await this.resolve(serviceName, scopeName)
      },
      
      dispose: async () => {
        if (scope.disposed) return
        
        const scopedInstances = this.scopes.get(scopeName)
        if (scopedInstances) {
          // 调用销毁回调
          for (const [serviceName, instance] of scopedInstances) {
            const serviceDefinition = this.services.get(serviceName)
            if (serviceDefinition?.lifecycle.onDestroy) {
              try {
                await serviceDefinition.lifecycle.onDestroy(instance)
              } catch (error) {
                console.error(`服务销毁失败: ${serviceName}`, error)
              }
            }
          }
          
          scopedInstances.clear()
          this.scopes.delete(scopeName)
        }
        
        scope.disposed = true
        console.log(`作用域已释放: ${scopeName}`)
      }
    }
  }
}
```

### 3. 实际应用示例

```javascript
// 电商系统六边形架构实现
class ECommerceHexagonalArchitecture {
  constructor() {
    this.container = new DependencyContainer()
    this.setupDependencies()
  }
  
  setupDependencies() {
    // 注册领域服务
    this.container.register('orderService', OrderService, {
      dependencies: ['orderRepository', 'paymentService', 'inventoryService']
    })
    
    this.container.register('userService', UserService, {
      dependencies: ['userRepository', 'emailService']
    })
    
    // 注册仓储接口（次要端口）
    this.container.register('orderRepository', OrderRepository)
    this.container.register('userRepository', UserRepository)
    
    // 注册适配器实现
    this.container.register('mongoOrderAdapter', MongoOrderAdapter, {
      dependencies: ['mongoConnection']
    })
    
    this.container.register('emailServiceAdapter', EmailServiceAdapter, {
      dependencies: ['smtpConfiguration']
    })
    
    // 注册用例
    this.container.register('createOrderUseCase', CreateOrderUseCase, {
      dependencies: ['orderService', 'userService', 'eventBus']
    })
    
    this.container.register('getUserOrdersUseCase', GetUserOrdersUseCase, {
      dependencies: ['orderService', 'userService']
    })
    
    // 注册主要适配器
    this.container.register('restApiAdapter', RestApiAdapter, {
      dependencies: ['createOrderUseCase', 'getUserOrdersUseCase']
    })
    
    this.container.register('graphqlAdapter', GraphQLAdapter, {
      dependencies: ['createOrderUseCase', 'getUserOrdersUseCase']
    })
  }
  
  // 订单领域服务
  class OrderService {
    constructor({ orderRepository, paymentService, inventoryService }) {
      this.orderRepository = orderRepository
      this.paymentService = paymentService
      this.inventoryService = inventoryService
    }
    
    async createOrder(orderData) {
      console.log('创建订单业务逻辑')
      
      // 1. 验证订单数据
      const validation = this.validateOrderData(orderData)
      if (!validation.isValid) {
        throw new Error(`订单数据无效: ${validation.errors.join(', ')}`)
      }
      
      // 2. 检查库存
      const inventoryCheck = await this.inventoryService.checkAvailability(orderData.items)
      if (!inventoryCheck.available) {
        throw new Error('库存不足')
      }
      
      // 3. 计算总价
      const totalAmount = this.calculateTotalAmount(orderData.items)
      
      // 4. 创建订单实体
      const order = new Order({
        id: this.generateOrderId(),
        userId: orderData.userId,
        items: orderData.items,
        totalAmount,
        status: 'pending',
        createdAt: new Date()
      })
      
      // 5. 保存订单
      const savedOrder = await this.orderRepository.save(order)
      
      // 6. 预留库存
      await this.inventoryService.reserve(orderData.items, savedOrder.id)
      
      return savedOrder
    }
    
    async processPayment(orderId, paymentData) {
      console.log('处理订单支付')
      
      // 1. 获取订单
      const order = await this.orderRepository.findById(orderId)
      if (!order) {
        throw new Error('订单不存在')
      }
      
      if (order.status !== 'pending') {
        throw new Error('订单状态不允许支付')
      }
      
      // 2. 处理支付
      const paymentResult = await this.paymentService.processPayment({
        amount: order.totalAmount,
        orderId: order.id,
        ...paymentData
      })
      
      // 3. 更新订单状态
      if (paymentResult.success) {
        order.status = 'paid'
        order.paymentId = paymentResult.paymentId
        order.paidAt = new Date()
        
        await this.orderRepository.update(order)
        
        // 4. 确认库存预留
        await this.inventoryService.confirm(order.items, order.id)
        
        return { success: true, order }
      } else {
        // 5. 支付失败，释放库存
        await this.inventoryService.release(order.items, order.id)
        
        order.status = 'payment_failed'
        await this.orderRepository.update(order)
        
        throw new Error(`支付失败: ${paymentResult.error}`)
      }
    }
    
    validateOrderData(orderData) {
      const errors = []
      
      if (!orderData.userId) {
        errors.push('用户ID不能为空')
      }
      
      if (!orderData.items || orderData.items.length === 0) {
        errors.push('订单项不能为空')
      }
      
      orderData.items?.forEach((item, index) => {
        if (!item.productId) {
          errors.push(`订单项${index + 1}缺少产品ID`)
        }
        if (!item.quantity || item.quantity <= 0) {
          errors.push(`订单项${index + 1}数量无效`)
        }
      })
      
      return {
        isValid: errors.length === 0,
        errors
      }
    }
    
    calculateTotalAmount(items) {
      return items.reduce((total, item) => {
        return total + (item.price * item.quantity)
      }, 0)
    }
    
    generateOrderId() {
      return `ORDER-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`
    }
  }
  
  // 创建订单用例
  class CreateOrderUseCase {
    constructor({ orderService, userService, eventBus }) {
      this.orderService = orderService
      this.userService = userService
      this.eventBus = eventBus
    }
    
    async execute(input) {
      try {
        console.log('执行创建订单用例')
        
        // 1. 验证用户
        const user = await this.userService.findById(input.userId)
        if (!user) {
          throw new Error('用户不存在')
        }
        
        // 2. 创建订单
        const order = await this.orderService.createOrder(input)
        
        // 3. 发布领域事件
        await this.eventBus.publish({
          type: 'OrderCreated',
          data: {
            orderId: order.id,
            userId: order.userId,
            totalAmount: order.totalAmount,
            timestamp: new Date()
          }
        })
        
        return {
          success: true,
          orderId: order.id,
          totalAmount: order.totalAmount,
          status: order.status
        }
        
      } catch (error) {
        console.error('创建订单失败:', error)
        
        // 发布失败事件
        await this.eventBus.publish({
          type: 'OrderCreationFailed',
          data: {
            userId: input.userId,
            error: error.message,
            timestamp: new Date()
          }
        })
        
        throw error
      }
    }
  }
  
  // REST API 适配器
  class RestApiAdapter {
    constructor({ createOrderUseCase, getUserOrdersUseCase }) {
      this.createOrderUseCase = createOrderUseCase
      this.getUserOrdersUseCase = getUserOrdersUseCase
    }
    
    async handleCreateOrder(req, res) {
      try {
        const orderData = {
          userId: req.body.userId,
          items: req.body.items,
          shippingAddress: req.body.shippingAddress
        }
        
        const result = await this.createOrderUseCase.execute(orderData)
        
        res.status(201).json({
          success: true,
          data: result,
          timestamp: new Date()
        })
        
      } catch (error) {
        res.status(400).json({
          success: false,
          error: error.message,
          timestamp: new Date()
        })
      }
    }
    
    async handleGetUserOrders(req, res) {
      try {
        const userId = req.params.userId
        const page = parseInt(req.query.page) || 1
        const limit = parseInt(req.query.limit) || 10
        
        const result = await this.getUserOrdersUseCase.execute({
          userId,
          page,
          limit
        })
        
        res.status(200).json({
          success: true,
          data: result.orders,
          pagination: result.pagination,
          timestamp: new Date()
        })
        
      } catch (error) {
        res.status(400).json({
          success: false,
          error: error.message,
          timestamp: new Date()
        })
      }
    }
  }
  
  // MongoDB 适配器
  class MongoOrderAdapter {
    constructor({ mongoConnection }) {
      this.db = mongoConnection
      this.collection = this.db.collection('orders')
    }
    
    async save(order) {
      try {
        const result = await this.collection.insertOne(order)
        return { ...order, _id: result.insertedId }
      } catch (error) {
        throw new Error(`保存订单失败: ${error.message}`)
      }
    }
    
    async findById(orderId) {
      try {
        return await this.collection.findOne({ id: orderId })
      } catch (error) {
        throw new Error(`查找订单失败: ${error.message}`)
      }
    }
    
    async update(order) {
      try {
        await this.collection.updateOne(
          { id: order.id },
          { $set: order }
        )
        return order
      } catch (error) {
        throw new Error(`更新订单失败: ${error.message}`)
      }
    }
    
    async findByUserId(userId, options = {}) {
      try {
        const { page = 1, limit = 10 } = options
        const skip = (page - 1) * limit
        
        const orders = await this.collection
          .find({ userId })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .toArray()
        
        const total = await this.collection.countDocuments({ userId })
        
        return {
          orders,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          }
        }
      } catch (error) {
        throw new Error(`查找用户订单失败: ${error.message}`)
      }
    }
  }
}
```

## 📚 最佳实践总结

1. **清晰的边界**：明确核心业务逻辑与外部系统的边界
2. **依赖反转**：核心依赖抽象，而非具体实现
3. **端口抽象**：定义清晰的端口接口契约
4. **适配器隔离**：适配器只负责协议转换，不包含业务逻辑
5. **依赖注入**：使用容器管理依赖关系
6. **测试隔离**：通过模拟适配器实现单元测试
7. **配置外部化**：将配置信息从核心逻辑中分离
8. **事件驱动**：使用领域事件实现松耦合

通过掌握六边形架构，您将能够构建高度可测试、可维护的企业级应用系统。
