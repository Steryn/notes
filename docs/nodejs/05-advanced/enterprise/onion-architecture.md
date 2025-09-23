# 洋葱架构

## 📖 概述

洋葱架构（Onion Architecture）是由Jeffrey Palermo提出的一种软件架构模式，它强调依赖方向从外层指向内层，确保核心业务逻辑不依赖于外部基础设施。这种架构通过分层设计实现高度的可测试性和可维护性。

## 🎯 学习目标

- 理解洋葱架构的分层设计原则
- 掌握依赖反转和控制反转技术
- 学习领域驱动设计在洋葱架构中的应用
- 实现可测试的分层企业应用

## 🧅 洋葱架构层次设计

### 1. 架构层次实现

```javascript
// 洋葱架构核心框架
class OnionArchitecture {
  constructor() {
    this.domainCore = new DomainCore()           // 最内层：领域核心
    this.domainServices = new DomainServices()   // 第二层：领域服务
    this.applicationCore = new ApplicationCore() // 第三层：应用核心
    this.infrastructure = new Infrastructure()   // 最外层：基础设施
  }
  
  // 第一层：领域核心（Domain Core）
  class DomainCore {
    constructor() {
      this.entities = new Map()
      this.valueObjects = new Map()
      this.domainEvents = new Map()
      this.specifications = new Map()
    }
    
    // 聚合根实体
    defineAggregateRoot(aggregateConfig) {
      class AggregateRoot {
        constructor(id, data = {}) {
          this.id = id
          this.version = 0
          this.createdAt = new Date()
          this.updatedAt = new Date()
          this.domainEvents = []
          this.isDeleted = false
          
          Object.assign(this, data)
          
          // 应用创建时的业务规则
          this.applyCreationRules()
        }
        
        // 业务规则验证
        validate() {
          const errors = []
          const rules = aggregateConfig.businessRules || []
          
          rules.forEach(rule => {
            if (!rule.validate(this)) {
              errors.push({
                rule: rule.name,
                message: rule.message,
                field: rule.field
              })
            }
          })
          
          return {
            isValid: errors.length === 0,
            errors
          }
        }
        
        // 应用业务规则
        applyBusinessRule(ruleName, data) {
          const rule = aggregateConfig.businessRules?.find(r => r.name === ruleName)
          
          if (!rule) {
            throw new Error(`业务规则不存在: ${ruleName}`)
          }
          
          // 前置条件检查
          if (rule.precondition && !rule.precondition(this, data)) {
            throw new Error(`业务规则前置条件不满足: ${ruleName}`)
          }
          
          // 应用规则
          const result = rule.apply(this, data)
          
          // 更新版本和时间戳
          this.version++
          this.updatedAt = new Date()
          
          // 记录领域事件
          if (rule.event) {
            this.addDomainEvent(rule.event, result)
          }
          
          return result
        }
        
        // 添加领域事件
        addDomainEvent(eventType, data) {
          const event = {
            id: this.generateEventId(),
            type: eventType,
            aggregateId: this.id,
            aggregateType: aggregateConfig.name,
            version: this.version,
            data,
            occurredAt: new Date()
          }
          
          this.domainEvents.push(event)
          
          console.log(`领域事件添加: ${eventType}`)
          return event
        }
        
        // 获取未提交的领域事件
        getUncommittedEvents() {
          return [...this.domainEvents]
        }
        
        // 标记事件为已提交
        markEventsAsCommitted() {
          this.domainEvents = []
        }
        
        // 软删除
        markAsDeleted() {
          if (this.isDeleted) {
            throw new Error('聚合根已被删除')
          }
          
          this.isDeleted = true
          this.updatedAt = new Date()
          
          this.addDomainEvent(`${aggregateConfig.name}Deleted`, {
            deletedAt: this.updatedAt
          })
        }
        
        applyCreationRules() {
          // 应用创建时的验证规则
          const validation = this.validate()
          if (!validation.isValid) {
            throw new Error(`聚合根创建失败: ${validation.errors.map(e => e.message).join(', ')}`)
          }
          
          // 触发创建事件
          this.addDomainEvent(`${aggregateConfig.name}Created`, {
            id: this.id,
            createdAt: this.createdAt
          })
        }
        
        generateEventId() {
          return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        }
      }
      
      this.entities.set(aggregateConfig.name, AggregateRoot)
      
      console.log(`聚合根定义完成: ${aggregateConfig.name}`)
      return AggregateRoot
    }
    
    // 值对象定义
    defineValueObject(valueObjectConfig) {
      class ValueObject {
        constructor(data) {
          // 验证输入数据
          const validation = this.validateInput(data)
          if (!validation.isValid) {
            throw new Error(`值对象创建失败: ${validation.errors.join(', ')}`)
          }
          
          Object.assign(this, data)
          Object.freeze(this) // 值对象不可变
        }
        
        // 值相等性比较
        equals(other) {
          if (!other || other.constructor !== this.constructor) {
            return false
          }
          
          return this.getIdentityFields().every(field => {
            return this[field] === other[field]
          })
        }
        
        // 获取标识字段
        getIdentityFields() {
          return valueObjectConfig.identityFields || Object.keys(this)
        }
        
        // 输入验证
        validateInput(data) {
          const errors = []
          const rules = valueObjectConfig.validationRules || []
          
          rules.forEach(rule => {
            if (!rule.validate(data)) {
              errors.push(rule.message)
            }
          })
          
          return {
            isValid: errors.length === 0,
            errors
          }
        }
        
        // 创建新的值对象（不可变性）
        withChanges(changes) {
          const newData = { ...this, ...changes }
          return new this.constructor(newData)
        }
        
        toString() {
          return JSON.stringify(this)
        }
      }
      
      this.valueObjects.set(valueObjectConfig.name, ValueObject)
      
      console.log(`值对象定义完成: ${valueObjectConfig.name}`)
      return ValueObject
    }
    
    // 规约模式实现
    defineSpecification(specConfig) {
      class Specification {
        constructor() {
          this.name = specConfig.name
          this.description = specConfig.description
        }
        
        // 是否满足规约
        isSatisfiedBy(candidate) {
          return specConfig.criteria(candidate)
        }
        
        // 与操作
        and(other) {
          return new CompositeSpecification(
            this.name + '_AND_' + other.name,
            (candidate) => this.isSatisfiedBy(candidate) && other.isSatisfiedBy(candidate)
          )
        }
        
        // 或操作
        or(other) {
          return new CompositeSpecification(
            this.name + '_OR_' + other.name,
            (candidate) => this.isSatisfiedBy(candidate) || other.isSatisfiedBy(candidate)
          )
        }
        
        // 非操作
        not() {
          return new CompositeSpecification(
            'NOT_' + this.name,
            (candidate) => !this.isSatisfiedBy(candidate)
          )
        }
      }
      
      this.specifications.set(specConfig.name, Specification)
      
      console.log(`规约定义完成: ${specConfig.name}`)
      return Specification
    }
  }
  
  // 第二层：领域服务（Domain Services）
  class DomainServices {
    constructor() {
      this.services = new Map()
      this.factories = new Map()
    }
    
    // 领域服务定义
    defineDomainService(serviceConfig) {
      class DomainService {
        constructor() {
          this.name = serviceConfig.name
          this.description = serviceConfig.description
        }
        
        // 执行领域逻辑
        async execute(operation, context, data) {
          console.log(`执行领域服务: ${this.name}.${operation}`)
          
          try {
            // 前置条件检查
            await this.checkPreconditions(operation, context, data)
            
            // 执行业务逻辑
            const operationHandler = serviceConfig.operations[operation]
            if (!operationHandler) {
              throw new Error(`操作不存在: ${operation}`)
            }
            
            const result = await operationHandler(context, data)
            
            // 后置条件检查
            await this.checkPostconditions(operation, context, data, result)
            
            return result
            
          } catch (error) {
            console.error(`领域服务执行失败: ${this.name}.${operation}`, error)
            throw error
          }
        }
        
        async checkPreconditions(operation, context, data) {
          const precondition = serviceConfig.preconditions?.[operation]
          if (precondition && !await precondition(context, data)) {
            throw new Error(`前置条件不满足: ${operation}`)
          }
        }
        
        async checkPostconditions(operation, context, data, result) {
          const postcondition = serviceConfig.postconditions?.[operation]
          if (postcondition && !await postcondition(context, data, result)) {
            throw new Error(`后置条件不满足: ${operation}`)
          }
        }
      }
      
      this.services.set(serviceConfig.name, DomainService)
      
      console.log(`领域服务定义完成: ${serviceConfig.name}`)
      return DomainService
    }
    
    // 聚合工厂
    defineAggregateFactory(factoryConfig) {
      class AggregateFactory {
        constructor() {
          this.name = factoryConfig.name
          this.aggregateType = factoryConfig.aggregateType
        }
        
        // 创建聚合根
        async create(data, context = {}) {
          console.log(`创建聚合: ${this.aggregateType}`)
          
          try {
            // 数据预处理
            const processedData = await this.preprocessData(data, context)
            
            // 生成ID
            const id = await this.generateId(processedData, context)
            
            // 创建聚合根
            const AggregateClass = factoryConfig.aggregateClass
            const aggregate = new AggregateClass(id, processedData)
            
            // 应用创建后的业务规则
            await this.applyPostCreationRules(aggregate, context)
            
            console.log(`聚合创建成功: ${this.aggregateType}[${id}]`)
            return aggregate
            
          } catch (error) {
            console.error(`聚合创建失败: ${this.aggregateType}`, error)
            throw error
          }
        }
        
        // 重建聚合（从持久化状态）
        async reconstitute(id, data, events = []) {
          console.log(`重建聚合: ${this.aggregateType}[${id}]`)
          
          const AggregateClass = factoryConfig.aggregateClass
          const aggregate = new AggregateClass(id, data)
          
          // 重播事件
          for (const event of events) {
            await this.applyEvent(aggregate, event)
          }
          
          // 清除未提交的事件（因为是重建）
          aggregate.markEventsAsCommitted()
          
          return aggregate
        }
        
        async preprocessData(data, context) {
          if (factoryConfig.dataPreprocessor) {
            return await factoryConfig.dataPreprocessor(data, context)
          }
          return data
        }
        
        async generateId(data, context) {
          if (factoryConfig.idGenerator) {
            return await factoryConfig.idGenerator(data, context)
          }
          return `${this.aggregateType}-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`
        }
        
        async applyPostCreationRules(aggregate, context) {
          const rules = factoryConfig.postCreationRules || []
          
          for (const rule of rules) {
            await rule(aggregate, context)
          }
        }
        
        async applyEvent(aggregate, event) {
          const eventHandler = factoryConfig.eventHandlers?.[event.type]
          if (eventHandler) {
            await eventHandler(aggregate, event)
          }
        }
      }
      
      this.factories.set(factoryConfig.name, AggregateFactory)
      
      console.log(`聚合工厂定义完成: ${factoryConfig.name}`)
      return AggregateFactory
    }
  }
  
  // 第三层：应用核心（Application Core）
  class ApplicationCore {
    constructor() {
      this.useCases = new Map()
      this.applicationServices = new Map()
      this.commandHandlers = new Map()
      this.queryHandlers = new Map()
      this.eventHandlers = new Map()
    }
    
    // 用例定义
    defineUseCase(useCaseConfig) {
      class UseCase {
        constructor(dependencies) {
          this.dependencies = dependencies
          this.name = useCaseConfig.name
          this.description = useCaseConfig.description
        }
        
        async execute(request, context = {}) {
          console.log(`执行用例: ${this.name}`)
          
          const executionContext = {
            ...context,
            useCaseName: this.name,
            startTime: new Date(),
            requestId: this.generateRequestId()
          }
          
          try {
            // 请求验证
            await this.validateRequest(request, executionContext)
            
            // 权限检查
            await this.checkAuthorization(request, executionContext)
            
            // 执行业务逻辑
            const result = await this.executeBusinessLogic(request, executionContext)
            
            // 结果验证
            await this.validateResult(result, executionContext)
            
            // 记录成功
            this.logSuccess(executionContext, result)
            
            return {
              success: true,
              data: result,
              metadata: {
                executionTime: Date.now() - executionContext.startTime.getTime(),
                requestId: executionContext.requestId
              }
            }
            
          } catch (error) {
            this.logError(executionContext, error)
            
            return {
              success: false,
              error: {
                message: error.message,
                type: error.constructor.name,
                code: error.code || 'UNKNOWN_ERROR'
              },
              metadata: {
                executionTime: Date.now() - executionContext.startTime.getTime(),
                requestId: executionContext.requestId
              }
            }
          }
        }
        
        async validateRequest(request, context) {
          const validator = useCaseConfig.requestValidator
          if (validator) {
            const validation = await validator(request, context)
            if (!validation.isValid) {
              throw new Error(`请求验证失败: ${validation.errors.join(', ')}`)
            }
          }
        }
        
        async checkAuthorization(request, context) {
          const authChecker = useCaseConfig.authorizationChecker
          if (authChecker) {
            const isAuthorized = await authChecker(request, context)
            if (!isAuthorized) {
              throw new Error('权限不足')
            }
          }
        }
        
        async executeBusinessLogic(request, context) {
          return await useCaseConfig.executor(request, context, this.dependencies)
        }
        
        async validateResult(result, context) {
          const validator = useCaseConfig.resultValidator
          if (validator) {
            const validation = await validator(result, context)
            if (!validation.isValid) {
              throw new Error(`结果验证失败: ${validation.errors.join(', ')}`)
            }
          }
        }
        
        logSuccess(context, result) {
          console.log(`用例执行成功: ${this.name}`, {
            requestId: context.requestId,
            executionTime: Date.now() - context.startTime.getTime()
          })
        }
        
        logError(context, error) {
          console.error(`用例执行失败: ${this.name}`, {
            requestId: context.requestId,
            error: error.message,
            executionTime: Date.now() - context.startTime.getTime()
          })
        }
        
        generateRequestId() {
          return `REQ-${Date.now()}-${Math.random().toString(36).substr(2, 8)}`
        }
      }
      
      this.useCases.set(useCaseConfig.name, UseCase)
      
      console.log(`用例定义完成: ${useCaseConfig.name}`)
      return UseCase
    }
    
    // CQRS 命令处理器
    defineCommandHandler(handlerConfig) {
      class CommandHandler {
        constructor(dependencies) {
          this.dependencies = dependencies
          this.commandType = handlerConfig.commandType
        }
        
        async handle(command, context = {}) {
          console.log(`处理命令: ${this.commandType}`)
          
          try {
            // 命令验证
            await this.validateCommand(command, context)
            
            // 获取聚合根
            const aggregate = await this.loadAggregate(command, context)
            
            // 执行命令
            const result = await this.executeCommand(aggregate, command, context)
            
            // 保存聚合根
            await this.saveAggregate(aggregate, context)
            
            // 发布领域事件
            await this.publishDomainEvents(aggregate, context)
            
            return result
            
          } catch (error) {
            console.error(`命令处理失败: ${this.commandType}`, error)
            throw error
          }
        }
        
        async validateCommand(command, context) {
          const validator = handlerConfig.validator
          if (validator) {
            const validation = await validator(command, context)
            if (!validation.isValid) {
              throw new Error(`命令验证失败: ${validation.errors.join(', ')}`)
            }
          }
        }
        
        async loadAggregate(command, context) {
          const loader = handlerConfig.aggregateLoader
          if (!loader) {
            throw new Error('聚合加载器未定义')
          }
          
          return await loader(command, context, this.dependencies)
        }
        
        async executeCommand(aggregate, command, context) {
          const executor = handlerConfig.executor
          if (!executor) {
            throw new Error('命令执行器未定义')
          }
          
          return await executor(aggregate, command, context, this.dependencies)
        }
        
        async saveAggregate(aggregate, context) {
          const saver = handlerConfig.aggregateSaver
          if (!saver) {
            throw new Error('聚合保存器未定义')
          }
          
          return await saver(aggregate, context, this.dependencies)
        }
        
        async publishDomainEvents(aggregate, context) {
          const events = aggregate.getUncommittedEvents()
          
          for (const event of events) {
            await this.dependencies.eventBus.publish(event, context)
          }
          
          aggregate.markEventsAsCommitted()
        }
      }
      
      this.commandHandlers.set(handlerConfig.commandType, CommandHandler)
      
      console.log(`命令处理器定义完成: ${handlerConfig.commandType}`)
      return CommandHandler
    }
    
    // CQRS 查询处理器
    defineQueryHandler(handlerConfig) {
      class QueryHandler {
        constructor(dependencies) {
          this.dependencies = dependencies
          this.queryType = handlerConfig.queryType
        }
        
        async handle(query, context = {}) {
          console.log(`处理查询: ${this.queryType}`)
          
          try {
            // 查询验证
            await this.validateQuery(query, context)
            
            // 权限检查
            await this.checkQueryPermissions(query, context)
            
            // 执行查询
            const result = await this.executeQuery(query, context)
            
            // 结果后处理
            const processedResult = await this.postProcessResult(result, query, context)
            
            return processedResult
            
          } catch (error) {
            console.error(`查询处理失败: ${this.queryType}`, error)
            throw error
          }
        }
        
        async validateQuery(query, context) {
          const validator = handlerConfig.validator
          if (validator) {
            const validation = await validator(query, context)
            if (!validation.isValid) {
              throw new Error(`查询验证失败: ${validation.errors.join(', ')}`)
            }
          }
        }
        
        async checkQueryPermissions(query, context) {
          const permissionChecker = handlerConfig.permissionChecker
          if (permissionChecker) {
            const hasPermission = await permissionChecker(query, context, this.dependencies)
            if (!hasPermission) {
              throw new Error('查询权限不足')
            }
          }
        }
        
        async executeQuery(query, context) {
          const executor = handlerConfig.executor
          if (!executor) {
            throw new Error('查询执行器未定义')
          }
          
          return await executor(query, context, this.dependencies)
        }
        
        async postProcessResult(result, query, context) {
          const postProcessor = handlerConfig.resultPostProcessor
          if (postProcessor) {
            return await postProcessor(result, query, context, this.dependencies)
          }
          return result
        }
      }
      
      this.queryHandlers.set(handlerConfig.queryType, QueryHandler)
      
      console.log(`查询处理器定义完成: ${handlerConfig.queryType}`)
      return QueryHandler
    }
  }
  
  // 第四层：基础设施（Infrastructure）
  class Infrastructure {
    constructor() {
      this.repositories = new Map()
      this.externalServices = new Map()
      this.eventBus = new Map()
      this.caching = new Map()
    }
    
    // 仓储实现
    defineRepository(repositoryConfig) {
      class Repository {
        constructor(dataAccess, eventBus) {
          this.dataAccess = dataAccess
          this.eventBus = eventBus
          this.aggregateType = repositoryConfig.aggregateType
        }
        
        async save(aggregate) {
          console.log(`保存聚合: ${this.aggregateType}[${aggregate.id}]`)
          
          try {
            // 开始事务
            const transaction = await this.dataAccess.beginTransaction()
            
            try {
              // 保存聚合数据
              await this.persistAggregate(aggregate, transaction)
              
              // 保存领域事件
              const events = aggregate.getUncommittedEvents()
              await this.persistEvents(events, transaction)
              
              // 提交事务
              await transaction.commit()
              
              // 发布事件
              await this.publishEvents(events)
              
              // 标记事件为已提交
              aggregate.markEventsAsCommitted()
              
              console.log(`聚合保存成功: ${this.aggregateType}[${aggregate.id}]`)
              
            } catch (error) {
              await transaction.rollback()
              throw error
            }
            
          } catch (error) {
            console.error(`聚合保存失败: ${this.aggregateType}[${aggregate.id}]`, error)
            throw error
          }
        }
        
        async findById(id) {
          console.log(`查找聚合: ${this.aggregateType}[${id}]`)
          
          try {
            const data = await this.dataAccess.findById(this.aggregateType, id)
            if (!data) {
              return null
            }
            
            // 加载事件历史
            const events = await this.loadEvents(id)
            
            // 重建聚合
            const aggregate = await this.reconstituteAggregate(id, data, events)
            
            return aggregate
            
          } catch (error) {
            console.error(`聚合查找失败: ${this.aggregateType}[${id}]`, error)
            throw error
          }
        }
        
        async findBySpecification(specification, options = {}) {
          console.log(`按规约查找聚合: ${this.aggregateType}`)
          
          try {
            const criteria = this.translateSpecification(specification)
            const data = await this.dataAccess.findByCriteria(this.aggregateType, criteria, options)
            
            const aggregates = []
            for (const item of data.items) {
              const events = await this.loadEvents(item.id)
              const aggregate = await this.reconstituteAggregate(item.id, item, events)
              aggregates.push(aggregate)
            }
            
            return {
              items: aggregates,
              totalCount: data.totalCount,
              hasMore: data.hasMore
            }
            
          } catch (error) {
            console.error(`规约查找失败: ${this.aggregateType}`, error)
            throw error
          }
        }
        
        async persistAggregate(aggregate, transaction) {
          const persistor = repositoryConfig.aggregatePersistor
          if (!persistor) {
            throw new Error('聚合持久化器未定义')
          }
          
          await persistor(aggregate, transaction, this.dataAccess)
        }
        
        async persistEvents(events, transaction) {
          for (const event of events) {
            await this.dataAccess.saveEvent(event, transaction)
          }
        }
        
        async publishEvents(events) {
          for (const event of events) {
            await this.eventBus.publish(event)
          }
        }
        
        async loadEvents(aggregateId) {
          return await this.dataAccess.loadEvents(this.aggregateType, aggregateId)
        }
        
        async reconstituteAggregate(id, data, events) {
          const factory = repositoryConfig.aggregateFactory
          if (!factory) {
            throw new Error('聚合工厂未定义')
          }
          
          return await factory.reconstitute(id, data, events)
        }
        
        translateSpecification(specification) {
          const translator = repositoryConfig.specificationTranslator
          if (!translator) {
            throw new Error('规约转换器未定义')
          }
          
          return translator(specification)
        }
      }
      
      this.repositories.set(repositoryConfig.aggregateType, Repository)
      
      console.log(`仓储定义完成: ${repositoryConfig.aggregateType}`)
      return Repository
    }
  }
}
```

### 2. 实际应用示例

```javascript
// 电商订单管理系统洋葱架构实现
class ECommerceOnionArchitecture {
  constructor() {
    this.architecture = new OnionArchitecture()
    this.setupDomain()
    this.setupServices()
    this.setupApplication()
    this.setupInfrastructure()
  }
  
  setupDomain() {
    // 订单聚合根
    const OrderAggregate = this.architecture.domainCore.defineAggregateRoot({
      name: 'Order',
      businessRules: [
        {
          name: 'minimumOrderAmount',
          message: '订单金额必须大于0',
          validate: (order) => order.totalAmount > 0,
          field: 'totalAmount'
        },
        {
          name: 'validOrderStatus',
          message: '订单状态无效',
          validate: (order) => ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'].includes(order.status),
          field: 'status'
        },
        {
          name: 'confirmOrder',
          message: '只有待确认订单可以确认',
          precondition: (order) => order.status === 'pending',
          apply: (order, data) => {
            order.status = 'confirmed'
            order.confirmedAt = new Date()
            return { status: order.status, confirmedAt: order.confirmedAt }
          },
          event: 'OrderConfirmed'
        },
        {
          name: 'cancelOrder',
          message: '只有待确认或已确认订单可以取消',
          precondition: (order) => ['pending', 'confirmed'].includes(order.status),
          apply: (order, data) => {
            order.status = 'cancelled'
            order.cancelledAt = new Date()
            order.cancellationReason = data.reason
            return { status: order.status, cancelledAt: order.cancelledAt }
          },
          event: 'OrderCancelled'
        }
      ]
    })
    
    // 订单项值对象
    const OrderItem = this.architecture.domainCore.defineValueObject({
      name: 'OrderItem',
      identityFields: ['productId', 'variant'],
      validationRules: [
        {
          validate: (data) => data.productId && data.productId.length > 0,
          message: '产品ID不能为空'
        },
        {
          validate: (data) => data.quantity > 0,
          message: '数量必须大于0'
        },
        {
          validate: (data) => data.unitPrice >= 0,
          message: '单价不能为负数'
        }
      ]
    })
    
    // 地址值对象
    const Address = this.architecture.domainCore.defineValueObject({
      name: 'Address',
      identityFields: ['street', 'city', 'postalCode', 'country'],
      validationRules: [
        {
          validate: (data) => data.street && data.street.trim().length > 0,
          message: '街道地址不能为空'
        },
        {
          validate: (data) => data.city && data.city.trim().length > 0,
          message: '城市不能为空'
        },
        {
          validate: (data) => data.postalCode && /^\d{5,6}$/.test(data.postalCode),
          message: '邮编格式无效'
        }
      ]
    })
    
    // 订单规约
    const PendingOrderSpecification = this.architecture.domainCore.defineSpecification({
      name: 'PendingOrderSpecification',
      description: '查找待处理订单',
      criteria: (order) => order.status === 'pending'
    })
    
    const HighValueOrderSpecification = this.architecture.domainCore.defineSpecification({
      name: 'HighValueOrderSpecification',
      description: '查找高价值订单',
      criteria: (order) => order.totalAmount >= 1000
    })
  }
  
  setupServices() {
    // 订单领域服务
    const OrderDomainService = this.architecture.domainServices.defineDomainService({
      name: 'OrderDomainService',
      description: '订单相关的领域逻辑',
      operations: {
        calculateShipping: async (context, data) => {
          const { items, shippingAddress, shippingMethod } = data
          
          let baseShippingCost = 10 // 基础运费
          let weightMultiplier = 0
          
          // 计算重量
          for (const item of items) {
            const product = await context.productRepository.findById(item.productId)
            weightMultiplier += (product.weight || 0.5) * item.quantity
          }
          
          // 运输方式调整
          const methodMultipliers = {
            'standard': 1.0,
            'express': 1.5,
            'overnight': 2.5
          }
          
          const methodMultiplier = methodMultipliers[shippingMethod] || 1.0
          
          return baseShippingCost + (weightMultiplier * 2) * methodMultiplier
        },
        
        validateOrderConsistency: async (context, data) => {
          const { orderId } = data
          const order = await context.orderRepository.findById(orderId)
          
          if (!order) {
            throw new Error('订单不存在')
          }
          
          // 验证库存
          for (const item of order.items) {
            const inventory = await context.inventoryRepository.findByProductId(item.productId)
            if (inventory.available < item.quantity) {
              throw new Error(`产品 ${item.productId} 库存不足`)
            }
          }
          
          // 验证价格一致性
          let calculatedTotal = 0
          for (const item of order.items) {
            const product = await context.productRepository.findById(item.productId)
            if (product.price !== item.unitPrice) {
              throw new Error(`产品 ${item.productId} 价格已变更`)
            }
            calculatedTotal += item.unitPrice * item.quantity
          }
          
          if (Math.abs(calculatedTotal - order.subtotal) > 0.01) {
            throw new Error('订单金额计算不一致')
          }
          
          return { valid: true }
        }
      },
      preconditions: {
        calculateShipping: (context, data) => {
          return data.items && data.items.length > 0 && data.shippingAddress
        },
        validateOrderConsistency: (context, data) => {
          return data.orderId
        }
      }
    })
    
    // 订单工厂
    const OrderFactory = this.architecture.domainServices.defineAggregateFactory({
      name: 'OrderFactory',
      aggregateType: 'Order',
      aggregateClass: OrderAggregate,
      dataPreprocessor: async (data, context) => {
        // 计算订单总金额
        let subtotal = 0
        for (const item of data.items) {
          subtotal += item.unitPrice * item.quantity
        }
        
        // 计算运费
        const shippingCost = await context.orderDomainService.execute(
          'calculateShipping',
          context,
          {
            items: data.items,
            shippingAddress: data.shippingAddress,
            shippingMethod: data.shippingMethod || 'standard'
          }
        )
        
        // 计算税费
        const taxRate = 0.1 // 10% 税率
        const taxAmount = subtotal * taxRate
        
        return {
          ...data,
          subtotal,
          shippingCost,
          taxAmount,
          totalAmount: subtotal + shippingCost + taxAmount,
          status: 'pending',
          createdAt: new Date()
        }
      },
      idGenerator: async (data, context) => {
        const timestamp = Date.now()
        const random = Math.random().toString(36).substr(2, 6).toUpperCase()
        return `ORD-${timestamp}-${random}`
      },
      postCreationRules: [
        async (order, context) => {
          // 预留库存
          for (const item of order.items) {
            await context.inventoryService.reserve(item.productId, item.quantity, order.id)
          }
        }
      ]
    })
  }
  
  setupApplication() {
    // 创建订单用例
    const CreateOrderUseCase = this.architecture.applicationCore.defineUseCase({
      name: 'CreateOrderUseCase',
      description: '创建新订单',
      requestValidator: async (request, context) => {
        const errors = []
        
        if (!request.customerId) {
          errors.push('客户ID不能为空')
        }
        
        if (!request.items || request.items.length === 0) {
          errors.push('订单项不能为空')
        }
        
        if (!request.shippingAddress) {
          errors.push('配送地址不能为空')
        }
        
        return {
          isValid: errors.length === 0,
          errors
        }
      },
      authorizationChecker: async (request, context) => {
        // 检查客户是否有效
        const customer = await context.dependencies.customerRepository.findById(request.customerId)
        return customer && customer.status === 'active'
      },
      executor: async (request, context, dependencies) => {
        // 创建订单
        const orderFactory = dependencies.orderFactory
        const order = await orderFactory.create(request, {
          ...context,
          ...dependencies
        })
        
        // 保存订单
        await dependencies.orderRepository.save(order)
        
        return {
          orderId: order.id,
          totalAmount: order.totalAmount,
          status: order.status,
          estimatedDelivery: this.calculateEstimatedDelivery(order.shippingMethod)
        }
      },
      resultValidator: async (result, context) => {
        const errors = []
        
        if (!result.orderId) {
          errors.push('订单ID生成失败')
        }
        
        if (result.totalAmount <= 0) {
          errors.push('订单金额无效')
        }
        
        return {
          isValid: errors.length === 0,
          errors
        }
      }
    })
    
    // 确认订单命令处理器
    const ConfirmOrderCommandHandler = this.architecture.applicationCore.defineCommandHandler({
      commandType: 'ConfirmOrderCommand',
      validator: async (command, context) => {
        const errors = []
        
        if (!command.orderId) {
          errors.push('订单ID不能为空')
        }
        
        return {
          isValid: errors.length === 0,
          errors
        }
      },
      aggregateLoader: async (command, context, dependencies) => {
        const order = await dependencies.orderRepository.findById(command.orderId)
        if (!order) {
          throw new Error('订单不存在')
        }
        return order
      },
      executor: async (aggregate, command, context, dependencies) => {
        // 验证订单一致性
        await dependencies.orderDomainService.execute(
          'validateOrderConsistency',
          { ...context, ...dependencies },
          { orderId: command.orderId }
        )
        
        // 确认订单
        const result = aggregate.applyBusinessRule('confirmOrder', {
          confirmedBy: command.confirmedBy,
          confirmationNotes: command.notes
        })
        
        return result
      },
      aggregateSaver: async (aggregate, context, dependencies) => {
        await dependencies.orderRepository.save(aggregate)
      }
    })
    
    // 获取订单查询处理器
    const GetOrderQueryHandler = this.architecture.applicationCore.defineQueryHandler({
      queryType: 'GetOrderQuery',
      validator: async (query, context) => {
        const errors = []
        
        if (!query.orderId) {
          errors.push('订单ID不能为空')
        }
        
        return {
          isValid: errors.length === 0,
          errors
        }
      },
      permissionChecker: async (query, context, dependencies) => {
        // 检查用户是否有权限查看该订单
        const order = await dependencies.orderRepository.findById(query.orderId)
        return order && (
          order.customerId === context.userId ||
          context.userRoles.includes('admin')
        )
      },
      executor: async (query, context, dependencies) => {
        const order = await dependencies.orderRepository.findById(query.orderId)
        
        if (!order) {
          throw new Error('订单不存在')
        }
        
        return {
          id: order.id,
          customerId: order.customerId,
          items: order.items,
          subtotal: order.subtotal,
          shippingCost: order.shippingCost,
          taxAmount: order.taxAmount,
          totalAmount: order.totalAmount,
          status: order.status,
          shippingAddress: order.shippingAddress,
          createdAt: order.createdAt,
          confirmedAt: order.confirmedAt
        }
      },
      resultPostProcessor: async (result, query, context, dependencies) => {
        // 添加额外信息
        if (context.userRoles.includes('admin')) {
          // 管理员可以看到更多信息
          const paymentInfo = await dependencies.paymentService.getPaymentInfo(result.id)
          result.paymentInfo = paymentInfo
        }
        
        return result
      }
    })
  }
  
  calculateEstimatedDelivery(shippingMethod) {
    const now = new Date()
    const deliveryDays = {
      'standard': 7,
      'express': 3,
      'overnight': 1
    }
    
    const days = deliveryDays[shippingMethod] || 7
    const estimatedDelivery = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)
    
    return estimatedDelivery
  }
}
```

## 📚 最佳实践总结

1. **依赖方向**：确保依赖只从外层指向内层
2. **层次隔离**：每层只与相邻层交互，不能跨层调用
3. **接口抽象**：内层定义接口，外层实现具体逻辑
4. **领域纯净**：核心领域逻辑不依赖任何外部技术
5. **测试隔离**：通过依赖注入实现单元测试隔离
6. **事件驱动**：使用领域事件实现层间解耦
7. **配置外部化**：将配置和环境相关代码放在最外层
8. **关注分离**：每层专注于自己的职责

通过掌握洋葱架构，您将能够构建高度解耦、可测试、可维护的企业级应用系统。
