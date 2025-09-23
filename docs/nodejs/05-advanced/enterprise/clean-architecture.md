# 清洁架构

## 📖 概述

清洁架构（Clean Architecture）是由Robert C. Martin（Uncle Bob）提出的软件架构模式，它强调关注点分离、依赖规则和架构边界，确保业务逻辑独立于外部关注点，创建可测试、可维护的系统。

## 🎯 学习目标

- 理解清洁架构的核心原则和依赖规则
- 掌握架构层次和边界设计
- 学习用例驱动开发和SOLID原则应用
- 实现高度解耦的企业级应用架构

## 🏛️ 清洁架构核心原则

### 1. 架构层次设计

```javascript
// 清洁架构框架实现
class CleanArchitecture {
  constructor() {
    this.entities = new EntityLayer()
    this.useCases = new UseCaseLayer()
    this.interfaceAdapters = new InterfaceAdapterLayer()
    this.frameworks = new FrameworksAndDriversLayer()
    this.dependencyInjector = new DependencyInjector()
  }
  
  // 第一层：实体层（Entities）
  class EntityLayer {
    constructor() {
      this.entities = new Map()
      this.valueObjects = new Map()
      this.businessRules = new Map()
    }
    
    // 企业业务规则实体
    defineEntity(entityConfig) {
      class Entity {
        constructor(id, data = {}) {
          this.id = id
          this.createdAt = data.createdAt || new Date()
          this.updatedAt = data.updatedAt || new Date()
          this.version = data.version || 1
          
          // 应用实体数据
          Object.assign(this, this.sanitizeData(data))
          
          // 验证实体
          this.validate()
        }
        
        // 核心业务规则验证
        validate() {
          const errors = []
          const rules = entityConfig.businessRules || []
          
          rules.forEach(rule => {
            if (!rule.condition(this)) {
              errors.push({
                rule: rule.name,
                message: rule.message,
                severity: rule.severity || 'error'
              })
            }
          })
          
          if (errors.length > 0) {
            throw new BusinessRuleViolationError('实体业务规则验证失败', errors)
          }
          
          return true
        }
        
        // 应用业务规则
        applyBusinessRule(ruleName, params = {}) {
          const rule = entityConfig.businessRules?.find(r => r.name === ruleName)
          
          if (!rule) {
            throw new Error(`业务规则不存在: ${ruleName}`)
          }
          
          if (!rule.condition(this)) {
            throw new BusinessRuleViolationError(
              `业务规则条件不满足: ${ruleName}`,
              [{ rule: ruleName, message: rule.message }]
            )
          }
          
          const result = rule.action(this, params)
          
          // 更新时间戳和版本
          this.updatedAt = new Date()
          this.version++
          
          return result
        }
        
        // 获取实体标识
        getIdentity() {
          return {
            id: this.id,
            type: entityConfig.name,
            version: this.version
          }
        }
        
        // 实体相等性比较
        equals(other) {
          if (!other || other.constructor !== this.constructor) {
            return false
          }
          
          return this.id === other.id
        }
        
        // 数据清理
        sanitizeData(data) {
          const sanitized = {}
          const allowedFields = entityConfig.fields || []
          
          allowedFields.forEach(field => {
            if (data.hasOwnProperty(field)) {
              sanitized[field] = data[field]
            }
          })
          
          return sanitized
        }
        
        // 获取快照
        getSnapshot() {
          return {
            id: this.id,
            type: entityConfig.name,
            data: this.toPlainObject(),
            version: this.version,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
          }
        }
        
        toPlainObject() {
          const result = {}
          const fields = entityConfig.fields || []
          
          fields.forEach(field => {
            if (this.hasOwnProperty(field)) {
              result[field] = this[field]
            }
          })
          
          return result
        }
      }
      
      this.entities.set(entityConfig.name, Entity)
      console.log(`实体定义完成: ${entityConfig.name}`)
      return Entity
    }
    
    // 值对象定义
    defineValueObject(valueObjectConfig) {
      class ValueObject {
        constructor(data) {
          // 验证输入
          this.validateInput(data)
          
          // 设置属性
          Object.assign(this, data)
          
          // 冻结对象（不可变性）
          Object.freeze(this)
        }
        
        validateInput(data) {
          const rules = valueObjectConfig.validationRules || []
          const errors = []
          
          rules.forEach(rule => {
            if (!rule.validate(data)) {
              errors.push(rule.message)
            }
          })
          
          if (errors.length > 0) {
            throw new ValidationError('值对象验证失败', errors)
          }
        }
        
        // 值相等性
        equals(other) {
          if (!other || other.constructor !== this.constructor) {
            return false
          }
          
          const identityFields = valueObjectConfig.identityFields || Object.keys(this)
          
          return identityFields.every(field => {
            return this[field] === other[field]
          })
        }
        
        // 创建修改版本
        withChanges(changes) {
          const newData = { ...this.toPlainObject(), ...changes }
          return new this.constructor(newData)
        }
        
        toPlainObject() {
          const result = {}
          Object.keys(this).forEach(key => {
            result[key] = this[key]
          })
          return result
        }
        
        toString() {
          return JSON.stringify(this.toPlainObject())
        }
      }
      
      this.valueObjects.set(valueObjectConfig.name, ValueObject)
      console.log(`值对象定义完成: ${valueObjectConfig.name}`)
      return ValueObject
    }
  }
  
  // 第二层：用例层（Use Cases）
  class UseCaseLayer {
    constructor() {
      this.useCases = new Map()
      this.interactors = new Map()
      this.ports = new Map()
    }
    
    // 用例定义
    defineUseCase(useCaseConfig) {
      class UseCase {
        constructor(dependencies) {
          this.dependencies = dependencies
          this.name = useCaseConfig.name
          this.description = useCaseConfig.description
        }
        
        async execute(inputData, presenter) {
          const context = this.createExecutionContext(inputData)
          
          try {
            console.log(`执行用例: ${this.name}`)
            
            // 1. 输入验证
            const validationResult = await this.validateInput(inputData, context)
            if (!validationResult.isValid) {
              return presenter.presentValidationError(validationResult.errors)
            }
            
            // 2. 授权检查
            const authResult = await this.checkAuthorization(inputData, context)
            if (!authResult.authorized) {
              return presenter.presentAuthorizationError(authResult.reason)
            }
            
            // 3. 执行业务逻辑
            const businessResult = await this.executeBusinessLogic(inputData, context)
            
            // 4. 输出验证
            const outputValidation = await this.validateOutput(businessResult, context)
            if (!outputValidation.isValid) {
              return presenter.presentInternalError('输出验证失败')
            }
            
            // 5. 呈现结果
            return presenter.presentSuccess(businessResult)
            
          } catch (error) {
            console.error(`用例执行失败: ${this.name}`, error)
            
            if (error instanceof BusinessRuleViolationError) {
              return presenter.presentBusinessRuleViolation(error.message, error.violations)
            } else if (error instanceof ValidationError) {
              return presenter.presentValidationError(error.errors)
            } else {
              return presenter.presentInternalError(error.message)
            }
          }
        }
        
        createExecutionContext(inputData) {
          return {
            executionId: this.generateExecutionId(),
            startTime: new Date(),
            useCaseName: this.name,
            userId: inputData.userId,
            sessionId: inputData.sessionId,
            metadata: inputData.metadata || {}
          }
        }
        
        async validateInput(inputData, context) {
          const validator = useCaseConfig.inputValidator
          if (!validator) {
            return { isValid: true, errors: [] }
          }
          
          return await validator(inputData, context, this.dependencies)
        }
        
        async checkAuthorization(inputData, context) {
          const authChecker = useCaseConfig.authorizationChecker
          if (!authChecker) {
            return { authorized: true }
          }
          
          return await authChecker(inputData, context, this.dependencies)
        }
        
        async executeBusinessLogic(inputData, context) {
          const executor = useCaseConfig.businessLogicExecutor
          if (!executor) {
            throw new Error('业务逻辑执行器未定义')
          }
          
          return await executor(inputData, context, this.dependencies)
        }
        
        async validateOutput(output, context) {
          const validator = useCaseConfig.outputValidator
          if (!validator) {
            return { isValid: true, errors: [] }
          }
          
          return await validator(output, context, this.dependencies)
        }
        
        generateExecutionId() {
          return `${this.name}-${Date.now()}-${Math.random().toString(36).substr(2, 8)}`
        }
      }
      
      this.useCases.set(useCaseConfig.name, UseCase)
      console.log(`用例定义完成: ${useCaseConfig.name}`)
      return UseCase
    }
    
    // 输入端口定义
    defineInputPort(portConfig) {
      class InputPort {
        constructor() {
          this.name = portConfig.name
          this.description = portConfig.description
        }
        
        // 定义用例方法
        async executeUseCase(useCaseName, inputData, presenter) {
          const useCase = this.useCases.get(useCaseName)
          if (!useCase) {
            throw new Error(`用例不存在: ${useCaseName}`)
          }
          
          return await useCase.execute(inputData, presenter)
        }
      }
      
      const inputPortMethods = portConfig.methods || []
      inputPortMethods.forEach(method => {
        InputPort.prototype[method.name] = async function(inputData, presenter) {
          return await this.executeUseCase(method.useCase, inputData, presenter)
        }
      })
      
      this.ports.set(portConfig.name, InputPort)
      console.log(`输入端口定义完成: ${portConfig.name}`)
      return InputPort
    }
    
    // 输出端口定义（接口）
    defineOutputPort(portConfig) {
      class OutputPort {
        constructor() {
          this.name = portConfig.name
          this.description = portConfig.description
        }
        
        // 抽象方法 - 由适配器实现
        async save(entity) {
          throw new Error('保存方法必须由适配器实现')
        }
        
        async findById(id) {
          throw new Error('查找方法必须由适配器实现')
        }
        
        async findByCriteria(criteria) {
          throw new Error('按条件查找方法必须由适配器实现')
        }
        
        async delete(id) {
          throw new Error('删除方法必须由适配器实现')
        }
      }
      
      // 添加自定义方法
      const customMethods = portConfig.methods || []
      customMethods.forEach(method => {
        OutputPort.prototype[method.name] = function(...args) {
          throw new Error(`${method.name} 方法必须由适配器实现`)
        }
      })
      
      this.ports.set(portConfig.name, OutputPort)
      console.log(`输出端口定义完成: ${portConfig.name}`)
      return OutputPort
    }
  }
  
  // 第三层：接口适配器层（Interface Adapters）
  class InterfaceAdapterLayer {
    constructor() {
      this.controllers = new Map()
      this.presenters = new Map()
      this.gateways = new Map()
    }
    
    // 控制器定义
    defineController(controllerConfig) {
      class Controller {
        constructor(inputPort) {
          this.inputPort = inputPort
          this.name = controllerConfig.name
        }
        
        async handleRequest(request, response) {
          try {
            console.log(`控制器处理请求: ${this.name}`)
            
            // 1. 请求预处理
            const preprocessedRequest = await this.preprocessRequest(request)
            
            // 2. 输入数据转换
            const inputData = await this.convertRequestToInputData(preprocessedRequest)
            
            // 3. 创建呈现器
            const presenter = this.createPresenter(response)
            
            // 4. 执行用例
            const result = await this.inputPort[controllerConfig.method](inputData, presenter)
            
            return result
            
          } catch (error) {
            console.error(`控制器处理失败: ${this.name}`, error)
            return this.handleError(error, response)
          }
        }
        
        async preprocessRequest(request) {
          const preprocessor = controllerConfig.requestPreprocessor
          if (preprocessor) {
            return await preprocessor(request)
          }
          return request
        }
        
        async convertRequestToInputData(request) {
          const converter = controllerConfig.inputConverter
          if (!converter) {
            throw new Error('输入转换器未定义')
          }
          
          return await converter(request)
        }
        
        createPresenter(response) {
          const PresenterClass = controllerConfig.presenterClass
          if (!PresenterClass) {
            throw new Error('呈现器类未定义')
          }
          
          return new PresenterClass(response)
        }
        
        handleError(error, response) {
          const errorHandler = controllerConfig.errorHandler
          if (errorHandler) {
            return errorHandler(error, response)
          }
          
          // 默认错误处理
          return {
            status: 500,
            message: '内部服务器错误',
            timestamp: new Date()
          }
        }
      }
      
      this.controllers.set(controllerConfig.name, Controller)
      console.log(`控制器定义完成: ${controllerConfig.name}`)
      return Controller
    }
    
    // 呈现器定义
    definePresenter(presenterConfig) {
      class Presenter {
        constructor(response) {
          this.response = response
          this.name = presenterConfig.name
        }
        
        // 成功响应
        presentSuccess(data) {
          const formattedData = this.formatSuccessData(data)
          
          return {
            success: true,
            data: formattedData,
            timestamp: new Date(),
            version: '1.0'
          }
        }
        
        // 验证错误响应
        presentValidationError(errors) {
          return {
            success: false,
            error: {
              type: 'VALIDATION_ERROR',
              message: '输入验证失败',
              details: errors
            },
            timestamp: new Date()
          }
        }
        
        // 授权错误响应
        presentAuthorizationError(reason) {
          return {
            success: false,
            error: {
              type: 'AUTHORIZATION_ERROR',
              message: '授权失败',
              reason: reason
            },
            timestamp: new Date()
          }
        }
        
        // 业务规则违反响应
        presentBusinessRuleViolation(message, violations) {
          return {
            success: false,
            error: {
              type: 'BUSINESS_RULE_VIOLATION',
              message: message,
              violations: violations
            },
            timestamp: new Date()
          }
        }
        
        // 内部错误响应
        presentInternalError(message) {
          return {
            success: false,
            error: {
              type: 'INTERNAL_ERROR',
              message: message
            },
            timestamp: new Date()
          }
        }
        
        formatSuccessData(data) {
          const formatter = presenterConfig.dataFormatter
          if (formatter) {
            return formatter(data)
          }
          return data
        }
      }
      
      this.presenters.set(presenterConfig.name, Presenter)
      console.log(`呈现器定义完成: ${presenterConfig.name}`)
      return Presenter
    }
    
    // 网关定义（输出端口适配器）
    defineGateway(gatewayConfig) {
      class Gateway extends gatewayConfig.outputPortClass {
        constructor(externalService) {
          super()
          this.externalService = externalService
          this.name = gatewayConfig.name
        }
        
        async save(entity) {
          try {
            console.log(`网关保存实体: ${this.name}`)
            
            // 实体到外部格式转换
            const externalData = this.convertEntityToExternal(entity)
            
            // 调用外部服务
            const result = await this.externalService.save(externalData)
            
            // 外部格式到实体转换
            return this.convertExternalToEntity(result)
            
          } catch (error) {
            console.error(`网关保存失败: ${this.name}`, error)
            throw new Error(`数据保存失败: ${error.message}`)
          }
        }
        
        async findById(id) {
          try {
            console.log(`网关查找实体: ${this.name}[${id}]`)
            
            const externalData = await this.externalService.findById(id)
            
            if (!externalData) {
              return null
            }
            
            return this.convertExternalToEntity(externalData)
            
          } catch (error) {
            console.error(`网关查找失败: ${this.name}[${id}]`, error)
            throw new Error(`数据查找失败: ${error.message}`)
          }
        }
        
        async findByCriteria(criteria) {
          try {
            console.log(`网关按条件查找: ${this.name}`)
            
            // 内部条件到外部查询转换
            const externalQuery = this.convertCriteriaToExternal(criteria)
            
            const externalResults = await this.externalService.findByCriteria(externalQuery)
            
            // 转换结果
            const entities = externalResults.map(item => 
              this.convertExternalToEntity(item)
            )
            
            return entities
            
          } catch (error) {
            console.error(`网关条件查找失败: ${this.name}`, error)
            throw new Error(`数据查找失败: ${error.message}`)
          }
        }
        
        convertEntityToExternal(entity) {
          const converter = gatewayConfig.entityToExternalConverter
          if (!converter) {
            return entity.toPlainObject()
          }
          return converter(entity)
        }
        
        convertExternalToEntity(externalData) {
          const converter = gatewayConfig.externalToEntityConverter
          if (!converter) {
            throw new Error('外部数据到实体转换器未定义')
          }
          return converter(externalData)
        }
        
        convertCriteriaToExternal(criteria) {
          const converter = gatewayConfig.criteriaConverter
          if (!converter) {
            return criteria
          }
          return converter(criteria)
        }
      }
      
      this.gateways.set(gatewayConfig.name, Gateway)
      console.log(`网关定义完成: ${gatewayConfig.name}`)
      return Gateway
    }
  }
  
  // 第四层：框架和驱动层（Frameworks & Drivers）
  class FrameworksAndDriversLayer {
    constructor() {
      this.webFramework = null
      this.database = null
      this.externalServices = new Map()
      this.configuration = new Map()
    }
    
    // Web 框架集成
    integrateWebFramework(frameworkConfig) {
      class WebFrameworkAdapter {
        constructor() {
          this.name = frameworkConfig.name
          this.routes = new Map()
        }
        
        setupRoutes(controllers) {
          frameworkConfig.routes.forEach(route => {
            const controller = controllers.get(route.controller)
            if (!controller) {
              throw new Error(`控制器不存在: ${route.controller}`)
            }
            
            this.routes.set(route.path, {
              method: route.method,
              controller: controller,
              middleware: route.middleware || []
            })
          })
        }
        
        async handleRequest(path, method, request) {
          const route = this.routes.get(path)
          if (!route || route.method !== method) {
            return {
              status: 404,
              message: '路由不存在'
            }
          }
          
          // 应用中间件
          for (const middleware of route.middleware) {
            const middlewareResult = await middleware(request)
            if (middlewareResult.stop) {
              return middlewareResult.response
            }
          }
          
          // 调用控制器
          return await route.controller.handleRequest(request)
        }
      }
      
      this.webFramework = new WebFrameworkAdapter()
      console.log(`Web框架集成完成: ${frameworkConfig.name}`)
      return this.webFramework
    }
    
    // 数据库集成
    integrateDatabase(databaseConfig) {
      class DatabaseAdapter {
        constructor() {
          this.name = databaseConfig.name
          this.connection = null
          this.collections = new Map()
        }
        
        async connect() {
          try {
            this.connection = await databaseConfig.connectionFactory()
            console.log(`数据库连接成功: ${this.name}`)
          } catch (error) {
            console.error(`数据库连接失败: ${this.name}`, error)
            throw error
          }
        }
        
        async save(collection, data) {
          if (!this.connection) {
            await this.connect()
          }
          
          try {
            return await this.connection.collection(collection).insertOne(data)
          } catch (error) {
            console.error(`数据保存失败: ${collection}`, error)
            throw error
          }
        }
        
        async findById(collection, id) {
          if (!this.connection) {
            await this.connect()
          }
          
          try {
            return await this.connection.collection(collection).findOne({ id })
          } catch (error) {
            console.error(`数据查找失败: ${collection}[${id}]`, error)
            throw error
          }
        }
        
        async findByCriteria(collection, criteria) {
          if (!this.connection) {
            await this.connect()
          }
          
          try {
            return await this.connection.collection(collection).find(criteria).toArray()
          } catch (error) {
            console.error(`条件查找失败: ${collection}`, error)
            throw error
          }
        }
        
        async disconnect() {
          if (this.connection) {
            await this.connection.close()
            this.connection = null
            console.log(`数据库连接关闭: ${this.name}`)
          }
        }
      }
      
      this.database = new DatabaseAdapter()
      console.log(`数据库集成完成: ${databaseConfig.name}`)
      return this.database
    }
  }
}

// 自定义错误类
class BusinessRuleViolationError extends Error {
  constructor(message, violations) {
    super(message)
    this.name = 'BusinessRuleViolationError'
    this.violations = violations
  }
}

class ValidationError extends Error {
  constructor(message, errors) {
    super(message)
    this.name = 'ValidationError'
    this.errors = errors
  }
}
```

### 2. 实际应用示例

```javascript
// 用户管理系统清洁架构实现
class UserManagementCleanArchitecture {
  constructor() {
    this.architecture = new CleanArchitecture()
    this.setupEntities()
    this.setupUseCases()
    this.setupAdapters()
    this.setupFrameworks()
  }
  
  setupEntities() {
    // 用户实体
    const User = this.architecture.entities.defineEntity({
      name: 'User',
      fields: ['email', 'firstName', 'lastName', 'status', 'roles'],
      businessRules: [
        {
          name: 'validEmail',
          condition: (user) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email),
          message: '邮箱格式无效',
          severity: 'error'
        },
        {
          name: 'activeStatus',
          condition: (user) => ['active', 'inactive', 'suspended'].includes(user.status),
          message: '用户状态无效',
          severity: 'error'
        },
        {
          name: 'activateUser',
          condition: (user) => user.status !== 'active',
          action: (user, params) => {
            user.status = 'active'
            user.activatedAt = new Date()
            user.activatedBy = params.activatedBy
            return { status: user.status, activatedAt: user.activatedAt }
          },
          message: '用户已激活'
        },
        {
          name: 'suspendUser',
          condition: (user) => user.status === 'active',
          action: (user, params) => {
            user.status = 'suspended'
            user.suspendedAt = new Date()
            user.suspensionReason = params.reason
            return { status: user.status, suspendedAt: user.suspendedAt }
          },
          message: '只有活跃用户可以被暂停'
        }
      ]
    })
    
    // 邮箱值对象
    const Email = this.architecture.entities.defineValueObject({
      name: 'Email',
      identityFields: ['address'],
      validationRules: [
        {
          validate: (data) => data.address && data.address.trim().length > 0,
          message: '邮箱地址不能为空'
        },
        {
          validate: (data) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.address),
          message: '邮箱格式无效'
        }
      ]
    })
  }
  
  setupUseCases() {
    // 创建用户用例
    const CreateUserUseCase = this.architecture.useCases.defineUseCase({
      name: 'CreateUserUseCase',
      description: '创建新用户',
      inputValidator: async (inputData, context, dependencies) => {
        const errors = []
        
        if (!inputData.email) {
          errors.push('邮箱不能为空')
        }
        
        if (!inputData.firstName) {
          errors.push('名字不能为空')
        }
        
        if (!inputData.lastName) {
          errors.push('姓氏不能为空')
        }
        
        // 检查邮箱是否已存在
        if (inputData.email) {
          const existingUser = await dependencies.userRepository.findByEmail(inputData.email)
          if (existingUser) {
            errors.push('邮箱已被使用')
          }
        }
        
        return {
          isValid: errors.length === 0,
          errors
        }
      },
      authorizationChecker: async (inputData, context, dependencies) => {
        // 检查用户是否有创建用户的权限
        const hasPermission = await dependencies.permissionService.hasPermission(
          context.userId,
          'CREATE_USER'
        )
        
        return {
          authorized: hasPermission,
          reason: hasPermission ? null : '权限不足'
        }
      },
      businessLogicExecutor: async (inputData, context, dependencies) => {
        // 生成用户ID
        const userId = dependencies.idGenerator.generate()
        
        // 创建用户实体
        const userData = {
          email: inputData.email,
          firstName: inputData.firstName,
          lastName: inputData.lastName,
          status: 'inactive',
          roles: inputData.roles || ['user']
        }
        
        const user = new User(userId, userData)
        
        // 保存用户
        await dependencies.userRepository.save(user)
        
        // 发送激活邮件
        await dependencies.emailService.sendActivationEmail(user.email, userId)
        
        return {
          userId: user.id,
          email: user.email,
          status: user.status,
          createdAt: user.createdAt
        }
      },
      outputValidator: async (output, context, dependencies) => {
        const errors = []
        
        if (!output.userId) {
          errors.push('用户ID生成失败')
        }
        
        if (!output.email) {
          errors.push('邮箱信息丢失')
        }
        
        return {
          isValid: errors.length === 0,
          errors
        }
      }
    })
    
    // 激活用户用例
    const ActivateUserUseCase = this.architecture.useCases.defineUseCase({
      name: 'ActivateUserUseCase',
      description: '激活用户账户',
      inputValidator: async (inputData, context, dependencies) => {
        const errors = []
        
        if (!inputData.userId) {
          errors.push('用户ID不能为空')
        }
        
        if (!inputData.activationToken) {
          errors.push('激活令牌不能为空')
        }
        
        return {
          isValid: errors.length === 0,
          errors
        }
      },
      businessLogicExecutor: async (inputData, context, dependencies) => {
        // 验证激活令牌
        const isValidToken = await dependencies.tokenService.validateActivationToken(
          inputData.userId,
          inputData.activationToken
        )
        
        if (!isValidToken) {
          throw new ValidationError('激活令牌无效或已过期', ['token'])
        }
        
        // 获取用户
        const user = await dependencies.userRepository.findById(inputData.userId)
        if (!user) {
          throw new Error('用户不存在')
        }
        
        // 激活用户
        const result = user.applyBusinessRule('activateUser', {
          activatedBy: 'system'
        })
        
        // 保存更新
        await dependencies.userRepository.save(user)
        
        // 销毁激活令牌
        await dependencies.tokenService.revokeActivationToken(inputData.activationToken)
        
        return {
          userId: user.id,
          status: user.status,
          activatedAt: result.activatedAt
        }
      }
    })
    
    // 输入端口定义
    const UserInputPort = this.architecture.useCases.defineInputPort({
      name: 'UserInputPort',
      description: '用户管理输入端口',
      methods: [
        {
          name: 'createUser',
          useCase: 'CreateUserUseCase'
        },
        {
          name: 'activateUser',
          useCase: 'ActivateUserUseCase'
        }
      ]
    })
    
    // 输出端口定义
    const UserRepositoryPort = this.architecture.useCases.defineOutputPort({
      name: 'UserRepositoryPort',
      description: '用户数据持久化端口',
      methods: [
        { name: 'findByEmail' },
        { name: 'findByStatus' }
      ]
    })
  }
  
  setupAdapters() {
    // 用户控制器
    const UserController = this.architecture.interfaceAdapters.defineController({
      name: 'UserController',
      method: 'createUser',
      presenterClass: UserPresenter,
      inputConverter: async (request) => {
        return {
          email: request.body.email,
          firstName: request.body.firstName,
          lastName: request.body.lastName,
          roles: request.body.roles,
          userId: request.user?.id,
          sessionId: request.sessionID
        }
      },
      errorHandler: (error, response) => {
        console.error('用户控制器错误:', error)
        return {
          status: 500,
          message: '服务器内部错误',
          timestamp: new Date()
        }
      }
    })
    
    // 用户呈现器
    const UserPresenter = this.architecture.interfaceAdapters.definePresenter({
      name: 'UserPresenter',
      dataFormatter: (data) => {
        return {
          user: {
            id: data.userId,
            email: data.email,
            status: data.status,
            createdAt: data.createdAt
          }
        }
      }
    })
    
    // 用户仓储网关
    const UserRepositoryGateway = this.architecture.interfaceAdapters.defineGateway({
      name: 'UserRepositoryGateway',
      outputPortClass: UserRepositoryPort,
      entityToExternalConverter: (user) => {
        return {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          status: user.status,
          roles: user.roles,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          version: user.version
        }
      },
      externalToEntityConverter: (data) => {
        return new User(data.id, {
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          status: data.status,
          roles: data.roles,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          version: data.version
        })
      }
    })
  }
  
  setupFrameworks() {
    // Express.js 集成
    this.architecture.frameworks.integrateWebFramework({
      name: 'Express',
      routes: [
        {
          path: '/api/users',
          method: 'POST',
          controller: 'UserController',
          middleware: ['authMiddleware', 'rateLimitMiddleware']
        },
        {
          path: '/api/users/activate',
          method: 'POST',
          controller: 'UserActivationController'
        }
      ]
    })
    
    // MongoDB 集成
    this.architecture.frameworks.integrateDatabase({
      name: 'MongoDB',
      connectionFactory: async () => {
        const { MongoClient } = require('mongodb')
        const client = new MongoClient(process.env.MONGODB_URL)
        await client.connect()
        return client.db('userManagement')
      }
    })
  }
}

// 依赖注入配置
class DependencyInjector {
  constructor() {
    this.dependencies = new Map()
  }
  
  register(name, factory) {
    this.dependencies.set(name, factory)
  }
  
  resolve(name) {
    const factory = this.dependencies.get(name)
    if (!factory) {
      throw new Error(`依赖未注册: ${name}`)
    }
    return factory()
  }
  
  wire() {
    // 注册所有依赖
    this.register('userRepository', () => new UserRepositoryGateway(this.resolve('database')))
    this.register('emailService', () => new EmailService())
    this.register('tokenService', () => new TokenService())
    this.register('permissionService', () => new PermissionService())
    this.register('idGenerator', () => new IdGenerator())
    
    // 创建用例实例
    const userInputPort = new UserInputPort()
    
    // 注入依赖
    const dependencies = {
      userRepository: this.resolve('userRepository'),
      emailService: this.resolve('emailService'),
      tokenService: this.resolve('tokenService'),
      permissionService: this.resolve('permissionService'),
      idGenerator: this.resolve('idGenerator')
    }
    
    const createUserUseCase = new CreateUserUseCase(dependencies)
    const activateUserUseCase = new ActivateUserUseCase(dependencies)
    
    return {
      userInputPort,
      createUserUseCase,
      activateUserUseCase,
      dependencies
    }
  }
}
```

## 📚 最佳实践总结

1. **依赖规则**：依赖只能从外层指向内层，绝不相反
2. **边界清晰**：每层有明确的职责和边界，不能越界
3. **接口分离**：使用接口隔离层间依赖，便于测试和替换
4. **用例驱动**：以用例为中心组织业务逻辑
5. **实体纯净**：实体层只包含业务规则，不依赖任何框架
6. **测试友好**：通过依赖注入实现高度可测试性
7. **框架独立**：业务逻辑不依赖具体的框架和工具
8. **数据库独立**：业务逻辑不依赖具体的数据库实现

通过掌握清洁架构，您将能够构建高度模块化、可测试、可维护的企业级应用系统。
