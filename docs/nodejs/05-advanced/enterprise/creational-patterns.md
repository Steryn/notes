# 创建型模式

## 📖 概述

创建型模式关注对象的创建机制，旨在以适当的方式创建对象。这些模式提供了对象创建的灵活性，使系统能够独立于如何创建、组合和表示对象。

## 🎯 学习目标

- 掌握五种创建型设计模式的实现
- 理解对象创建的最佳实践
- 学习工厂模式族的应用场景
- 实现可扩展的对象创建框架

## 🏭 Singleton 单例模式

### 1. 基础实现

```javascript
// 线程安全的单例模式实现
class Singleton {
  constructor() {
    if (Singleton.instance) {
      return Singleton.instance
    }
    
    this.data = new Map()
    this.created = new Date()
    this.accessCount = 0
    
    Singleton.instance = this
    Object.freeze(this)
    
    console.log('单例实例创建')
    return this
  }
  
  // 获取实例的静态方法
  static getInstance() {
    if (!Singleton.instance) {
      Singleton.instance = new Singleton()
    }
    
    Singleton.instance.accessCount++
    return Singleton.instance
  }
  
  // 业务方法
  setValue(key, value) {
    this.data.set(key, value)
    console.log(`设置值: ${key} = ${value}`)
  }
  
  getValue(key) {
    this.accessCount++
    return this.data.get(key)
  }
  
  getStats() {
    return {
      created: this.created,
      accessCount: this.accessCount,
      dataSize: this.data.size
    }
  }
  
  // 防止克隆
  clone() {
    throw new Error('单例模式不能被克隆')
  }
}

// 配置管理单例
class ConfigManager extends Singleton {
  constructor() {
    super()
    this.config = new Map()
    this.defaultConfig = new Map([
      ['app.name', 'MyApp'],
      ['app.version', '1.0.0'],
      ['db.host', 'localhost'],
      ['db.port', 5432]
    ])
    
    this.loadConfig()
  }
  
  static getInstance() {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager()
    }
    return ConfigManager.instance
  }
  
  loadConfig() {
    // 从环境变量、文件等加载配置
    this.defaultConfig.forEach((value, key) => {
      const envValue = process.env[key.replace('.', '_').toUpperCase()]
      this.config.set(key, envValue || value)
    })
    
    console.log('配置加载完成')
  }
  
  get(key, defaultValue = null) {
    return this.config.get(key) || defaultValue
  }
  
  set(key, value) {
    this.config.set(key, value)
    console.log(`配置更新: ${key} = ${value}`)
  }
  
  getAll() {
    return Object.fromEntries(this.config)
  }
  
  reload() {
    this.config.clear()
    this.loadConfig()
    console.log('配置重新加载')
  }
}

// 数据库连接池单例
class DatabasePool extends Singleton {
  constructor() {
    super()
    this.connections = []
    this.activeConnections = new Set()
    this.maxConnections = 10
    this.currentConnections = 0
    
    this.initializePool()
  }
  
  static getInstance() {
    if (!DatabasePool.instance) {
      DatabasePool.instance = new DatabasePool()
    }
    return DatabasePool.instance
  }
  
  initializePool() {
    console.log('初始化数据库连接池')
    // 预创建一些连接
    for (let i = 0; i < 3; i++) {
      this.createConnection()
    }
  }
  
  createConnection() {
    if (this.currentConnections >= this.maxConnections) {
      throw new Error('连接池已满')
    }
    
    const connection = {
      id: `conn_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      created: new Date(),
      lastUsed: new Date(),
      isActive: false,
      query: async (sql) => {
        console.log(`执行查询: ${sql}`)
        // 模拟查询
        return { rows: [], affectedRows: 0 }
      }
    }
    
    this.connections.push(connection)
    this.currentConnections++
    
    console.log(`创建数据库连接: ${connection.id}`)
    return connection
  }
  
  async getConnection() {
    // 查找可用连接
    let connection = this.connections.find(conn => !conn.isActive)
    
    if (!connection) {
      if (this.currentConnections < this.maxConnections) {
        connection = this.createConnection()
      } else {
        throw new Error('无可用数据库连接')
      }
    }
    
    connection.isActive = true
    connection.lastUsed = new Date()
    this.activeConnections.add(connection.id)
    
    console.log(`获取数据库连接: ${connection.id}`)
    return connection
  }
  
  releaseConnection(connection) {
    connection.isActive = false
    this.activeConnections.delete(connection.id)
    console.log(`释放数据库连接: ${connection.id}`)
  }
  
  getPoolStats() {
    return {
      totalConnections: this.currentConnections,
      activeConnections: this.activeConnections.size,
      availableConnections: this.currentConnections - this.activeConnections.size,
      maxConnections: this.maxConnections
    }
  }
}
```

## 🏭 Factory Method 工厂方法模式

### 1. 抽象工厂实现

```javascript
// 抽象产品
class Product {
  constructor(name, properties = {}) {
    this.name = name
    this.properties = properties
    this.created = new Date()
  }
  
  getInfo() {
    return {
      name: this.name,
      type: this.constructor.name,
      properties: this.properties,
      created: this.created
    }
  }
  
  // 抽象方法
  process() {
    throw new Error('process方法必须被子类实现')
  }
}

// 具体产品实现
class WebService extends Product {
  constructor(name, config) {
    super(name, config)
    this.endpoints = new Map()
    this.middleware = []
  }
  
  process() {
    console.log(`处理Web服务: ${this.name}`)
    return `Web服务 ${this.name} 处理完成`
  }
  
  addEndpoint(path, handler) {
    this.endpoints.set(path, handler)
    console.log(`添加端点: ${path}`)
  }
  
  addMiddleware(middleware) {
    this.middleware.push(middleware)
    console.log(`添加中间件: ${middleware.name}`)
  }
}

class DatabaseService extends Product {
  constructor(name, config) {
    super(name, config)
    this.schema = new Map()
    this.connection = null
  }
  
  process() {
    console.log(`处理数据库服务: ${this.name}`)
    return `数据库服务 ${this.name} 处理完成`
  }
  
  defineSchema(tableName, schema) {
    this.schema.set(tableName, schema)
    console.log(`定义表结构: ${tableName}`)
  }
  
  async connect() {
    this.connection = {
      id: `db_${Date.now()}`,
      connected: true,
      lastActivity: new Date()
    }
    console.log(`数据库连接建立: ${this.connection.id}`)
  }
}

class MessageService extends Product {
  constructor(name, config) {
    super(name, config)
    this.queues = new Map()
    this.subscribers = new Map()
  }
  
  process() {
    console.log(`处理消息服务: ${this.name}`)
    return `消息服务 ${this.name} 处理完成`
  }
  
  createQueue(queueName, options = {}) {
    this.queues.set(queueName, {
      name: queueName,
      messages: [],
      options,
      created: new Date()
    })
    console.log(`创建消息队列: ${queueName}`)
  }
  
  subscribe(queueName, handler) {
    if (!this.subscribers.has(queueName)) {
      this.subscribers.set(queueName, [])
    }
    this.subscribers.get(queueName).push(handler)
    console.log(`订阅队列: ${queueName}`)
  }
}

// 抽象工厂
class ServiceFactory {
  // 工厂方法 - 子类必须实现
  createService(name, config) {
    throw new Error('createService方法必须被子类实现')
  }
  
  // 模板方法
  buildService(serviceConfig) {
    console.log(`开始构建服务: ${serviceConfig.name}`)
    
    // 1. 创建服务
    const service = this.createService(serviceConfig.name, serviceConfig.config)
    
    // 2. 配置服务
    this.configureService(service, serviceConfig)
    
    // 3. 初始化服务
    this.initializeService(service)
    
    // 4. 验证服务
    this.validateService(service)
    
    console.log(`服务构建完成: ${serviceConfig.name}`)
    return service
  }
  
  configureService(service, config) {
    if (config.properties) {
      Object.assign(service.properties, config.properties)
    }
    console.log(`配置服务: ${service.name}`)
  }
  
  initializeService(service) {
    // 通用初始化逻辑
    service.initialized = true
    service.initTime = new Date()
    console.log(`初始化服务: ${service.name}`)
  }
  
  validateService(service) {
    if (!service.name) {
      throw new Error('服务名称不能为空')
    }
    
    if (typeof service.process !== 'function') {
      throw new Error('服务必须实现process方法')
    }
    
    console.log(`验证服务: ${service.name}`)
  }
}

// 具体工厂实现
class WebServiceFactory extends ServiceFactory {
  createService(name, config) {
    return new WebService(name, config)
  }
  
  configureService(service, config) {
    super.configureService(service, config)
    
    // Web服务特定配置
    if (config.endpoints) {
      config.endpoints.forEach(endpoint => {
        service.addEndpoint(endpoint.path, endpoint.handler)
      })
    }
    
    if (config.middleware) {
      config.middleware.forEach(middleware => {
        service.addMiddleware(middleware)
      })
    }
  }
}

class DatabaseServiceFactory extends ServiceFactory {
  createService(name, config) {
    return new DatabaseService(name, config)
  }
  
  configureService(service, config) {
    super.configureService(service, config)
    
    // 数据库服务特定配置
    if (config.schemas) {
      config.schemas.forEach(schema => {
        service.defineSchema(schema.table, schema.definition)
      })
    }
  }
  
  async initializeService(service) {
    super.initializeService(service)
    
    // 数据库服务特定初始化
    if (service.properties.autoConnect) {
      await service.connect()
    }
  }
}

class MessageServiceFactory extends ServiceFactory {
  createService(name, config) {
    return new MessageService(name, config)
  }
  
  configureService(service, config) {
    super.configureService(service, config)
    
    // 消息服务特定配置
    if (config.queues) {
      config.queues.forEach(queue => {
        service.createQueue(queue.name, queue.options)
      })
    }
  }
}

// 工厂注册表
class ServiceFactoryRegistry {
  constructor() {
    this.factories = new Map()
    this.defaultFactories()
  }
  
  defaultFactories() {
    this.register('web', new WebServiceFactory())
    this.register('database', new DatabaseServiceFactory())
    this.register('message', new MessageServiceFactory())
  }
  
  register(type, factory) {
    this.factories.set(type, factory)
    console.log(`注册工厂: ${type}`)
  }
  
  createService(type, serviceConfig) {
    const factory = this.factories.get(type)
    
    if (!factory) {
      throw new Error(`未找到工厂类型: ${type}`)
    }
    
    return factory.buildService(serviceConfig)
  }
  
  getAvailableTypes() {
    return Array.from(this.factories.keys())
  }
}
```

## 🏗️ Builder 建造者模式

### 1. 复杂对象构建

```javascript
// 复杂产品类
class Application {
  constructor() {
    this.name = ''
    this.version = '1.0.0'
    this.environment = 'development'
    this.server = null
    this.database = null
    this.cache = null
    this.logging = null
    this.security = null
    this.middleware = []
    this.routes = []
    this.plugins = []
    this.config = new Map()
  }
  
  start() {
    console.log(`启动应用: ${this.name} v${this.version}`)
    console.log(`环境: ${this.environment}`)
    
    // 启动各个组件
    if (this.server) {
      this.server.start()
    }
    
    if (this.database) {
      this.database.connect()
    }
    
    console.log('应用启动完成')
  }
  
  getInfo() {
    return {
      name: this.name,
      version: this.version,
      environment: this.environment,
      components: {
        server: !!this.server,
        database: !!this.database,
        cache: !!this.cache,
        logging: !!this.logging,
        security: !!this.security
      },
      middleware: this.middleware.length,
      routes: this.routes.length,
      plugins: this.plugins.length
    }
  }
}

// 抽象建造者
class ApplicationBuilder {
  constructor() {
    this.reset()
  }
  
  reset() {
    this.application = new Application()
    return this
  }
  
  // 基础配置
  setName(name) {
    this.application.name = name
    return this
  }
  
  setVersion(version) {
    this.application.version = version
    return this
  }
  
  setEnvironment(environment) {
    this.application.environment = environment
    return this
  }
  
  // 组件配置方法 - 子类实现
  configureServer(config) {
    throw new Error('configureServer方法必须被子类实现')
  }
  
  configureDatabase(config) {
    throw new Error('configureDatabase方法必须被子类实现')
  }
  
  configureCache(config) {
    throw new Error('configureCache方法必须被子类实现')
  }
  
  configureSecurity(config) {
    throw new Error('configureSecurity方法必须被子类实现')
  }
  
  // 获取结果
  getResult() {
    const result = this.application
    this.reset() // 重置建造者状态
    return result
  }
}

// 具体建造者 - Web应用
class WebApplicationBuilder extends ApplicationBuilder {
  configureServer(config = {}) {
    this.application.server = {
      type: 'express',
      port: config.port || 3000,
      host: config.host || 'localhost',
      ssl: config.ssl || false,
      start: function() {
        console.log(`Web服务器启动在 ${this.host}:${this.port}`)
      }
    }
    return this
  }
  
  configureDatabase(config = {}) {
    this.application.database = {
      type: config.type || 'mongodb',
      host: config.host || 'localhost',
      port: config.port || 27017,
      name: config.name || 'webapp',
      connect: function() {
        console.log(`连接到数据库: ${this.type}://${this.host}:${this.port}/${this.name}`)
      }
    }
    return this
  }
  
  configureCache(config = {}) {
    this.application.cache = {
      type: config.type || 'redis',
      host: config.host || 'localhost',
      port: config.port || 6379,
      ttl: config.ttl || 3600
    }
    return this
  }
  
  configureSecurity(config = {}) {
    this.application.security = {
      cors: config.cors || true,
      helmet: config.helmet || true,
      rateLimit: config.rateLimit || {
        windowMs: 15 * 60 * 1000, // 15分钟
        max: 100 // 限制每个IP 100个请求
      },
      authentication: config.authentication || 'jwt'
    }
    return this
  }
  
  addMiddleware(middleware) {
    this.application.middleware.push(middleware)
    return this
  }
  
  addRoute(route) {
    this.application.routes.push(route)
    return this
  }
  
  addPlugin(plugin) {
    this.application.plugins.push(plugin)
    return this
  }
}

// 具体建造者 - 微服务应用
class MicroserviceBuilder extends ApplicationBuilder {
  configureServer(config = {}) {
    this.application.server = {
      type: 'fastify',
      port: config.port || 8080,
      host: config.host || '0.0.0.0',
      cluster: config.cluster || true,
      workers: config.workers || require('os').cpus().length,
      start: function() {
        console.log(`微服务启动在 ${this.host}:${this.port} (${this.workers} workers)`)
      }
    }
    return this
  }
  
  configureDatabase(config = {}) {
    this.application.database = {
      type: config.type || 'postgresql',
      host: config.host || 'postgres-service',
      port: config.port || 5432,
      name: config.name || 'microservice',
      pool: {
        min: 2,
        max: 10
      },
      connect: function() {
        console.log(`连接到数据库池: ${this.type}://${this.host}:${this.port}/${this.name}`)
      }
    }
    return this
  }
  
  configureServiceDiscovery(config = {}) {
    this.application.serviceDiscovery = {
      type: config.type || 'consul',
      host: config.host || 'consul-service',
      port: config.port || 8500,
      healthCheck: config.healthCheck || '/health'
    }
    return this
  }
  
  configureMessageBus(config = {}) {
    this.application.messageBus = {
      type: config.type || 'rabbitmq',
      host: config.host || 'rabbitmq-service',
      port: config.port || 5672,
      exchanges: config.exchanges || [],
      queues: config.queues || []
    }
    return this
  }
}

// 建造者指导者
class ApplicationDirector {
  constructor(builder) {
    this.builder = builder
  }
  
  setBuilder(builder) {
    this.builder = builder
  }
  
  // 构建基础Web应用
  buildBasicWebApp(appConfig) {
    return this.builder
      .setName(appConfig.name)
      .setVersion(appConfig.version)
      .setEnvironment(appConfig.environment)
      .configureServer(appConfig.server)
      .configureDatabase(appConfig.database)
      .configureSecurity(appConfig.security)
      .getResult()
  }
  
  // 构建完整Web应用
  buildFullWebApp(appConfig) {
    const builder = this.builder
      .setName(appConfig.name)
      .setVersion(appConfig.version)
      .setEnvironment(appConfig.environment)
      .configureServer(appConfig.server)
      .configureDatabase(appConfig.database)
      .configureCache(appConfig.cache)
      .configureSecurity(appConfig.security)
    
    // 添加中间件
    if (appConfig.middleware) {
      appConfig.middleware.forEach(middleware => {
        builder.addMiddleware(middleware)
      })
    }
    
    // 添加路由
    if (appConfig.routes) {
      appConfig.routes.forEach(route => {
        builder.addRoute(route)
      })
    }
    
    // 添加插件
    if (appConfig.plugins) {
      appConfig.plugins.forEach(plugin => {
        builder.addPlugin(plugin)
      })
    }
    
    return builder.getResult()
  }
  
  // 构建微服务
  buildMicroservice(serviceConfig) {
    const builder = this.builder
      .setName(serviceConfig.name)
      .setVersion(serviceConfig.version)
      .setEnvironment(serviceConfig.environment)
      .configureServer(serviceConfig.server)
      .configureDatabase(serviceConfig.database)
    
    // 微服务特定配置
    if (this.builder.configureServiceDiscovery) {
      builder.configureServiceDiscovery(serviceConfig.serviceDiscovery)
    }
    
    if (this.builder.configureMessageBus) {
      builder.configureMessageBus(serviceConfig.messageBus)
    }
    
    return builder.getResult()
  }
}

// 流式建造者
class FluentApplicationBuilder {
  constructor() {
    this.application = new Application()
  }
  
  // 链式调用方法
  name(name) {
    this.application.name = name
    return this
  }
  
  version(version) {
    this.application.version = version
    return this
  }
  
  environment(env) {
    this.application.environment = env
    return this
  }
  
  server(config) {
    this.application.server = config
    return this
  }
  
  database(config) {
    this.application.database = config
    return this
  }
  
  cache(config) {
    this.application.cache = config
    return this
  }
  
  security(config) {
    this.application.security = config
    return this
  }
  
  middleware(middleware) {
    this.application.middleware.push(middleware)
    return this
  }
  
  route(route) {
    this.application.routes.push(route)
    return this
  }
  
  plugin(plugin) {
    this.application.plugins.push(plugin)
    return this
  }
  
  config(key, value) {
    this.application.config.set(key, value)
    return this
  }
  
  build() {
    const result = this.application
    this.application = new Application()
    return result
  }
}
```

## 🎭 Prototype 原型模式

### 1. 对象克隆实现

```javascript
// 可克隆接口
class Cloneable {
  clone() {
    throw new Error('clone方法必须被实现')
  }
  
  deepClone() {
    throw new Error('deepClone方法必须被实现')
  }
}

// 原型基类
class BasePrototype extends Cloneable {
  constructor(data = {}) {
    super()
    this.id = data.id || this.generateId()
    this.createdAt = data.createdAt || new Date()
    this.metadata = data.metadata || {}
  }
  
  generateId() {
    return `${this.constructor.name.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
  }
  
  // 浅克隆
  clone() {
    const cloned = Object.create(Object.getPrototypeOf(this))
    Object.assign(cloned, this)
    cloned.id = this.generateId() // 生成新ID
    cloned.createdAt = new Date()
    return cloned
  }
  
  // 深克隆
  deepClone() {
    const cloned = this.clone()
    
    // 深度复制对象属性
    for (const [key, value] of Object.entries(this)) {
      if (value && typeof value === 'object') {
        if (value instanceof Date) {
          cloned[key] = new Date(value)
        } else if (value instanceof Array) {
          cloned[key] = value.map(item => 
            item && typeof item === 'object' && item.deepClone ? 
            item.deepClone() : 
            JSON.parse(JSON.stringify(item))
          )
        } else if (value instanceof Map) {
          cloned[key] = new Map(value)
        } else if (value instanceof Set) {
          cloned[key] = new Set(value)
        } else if (value.deepClone) {
          cloned[key] = value.deepClone()
        } else {
          cloned[key] = JSON.parse(JSON.stringify(value))
        }
      }
    }
    
    return cloned
  }
}

// 具体原型 - 用户配置
class UserProfile extends BasePrototype {
  constructor(data = {}) {
    super(data)
    this.username = data.username || ''
    this.email = data.email || ''
    this.preferences = data.preferences || new Map()
    this.permissions = data.permissions || new Set()
    this.settings = data.settings || {}
    this.avatar = data.avatar || null
  }
  
  setPreference(key, value) {
    this.preferences.set(key, value)
  }
  
  addPermission(permission) {
    this.permissions.add(permission)
  }
  
  updateSettings(newSettings) {
    Object.assign(this.settings, newSettings)
  }
  
  // 自定义克隆逻辑
  clone() {
    const cloned = super.clone()
    cloned.preferences = new Map(this.preferences)
    cloned.permissions = new Set(this.permissions)
    cloned.settings = { ...this.settings }
    return cloned
  }
}

// 具体原型 - 文档模板
class DocumentTemplate extends BasePrototype {
  constructor(data = {}) {
    super(data)
    this.title = data.title || ''
    this.content = data.content || ''
    this.sections = data.sections || []
    this.variables = data.variables || new Map()
    this.styles = data.styles || {}
    this.attachments = data.attachments || []
  }
  
  addSection(section) {
    this.sections.push(section)
  }
  
  setVariable(name, value) {
    this.variables.set(name, value)
  }
  
  render() {
    let renderedContent = this.content
    
    // 替换变量
    this.variables.forEach((value, key) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g')
      renderedContent = renderedContent.replace(regex, value)
    })
    
    return {
      title: this.title,
      content: renderedContent,
      sections: this.sections,
      styles: this.styles
    }
  }
  
  clone() {
    const cloned = super.clone()
    cloned.sections = [...this.sections]
    cloned.variables = new Map(this.variables)
    cloned.styles = { ...this.styles }
    cloned.attachments = [...this.attachments]
    return cloned
  }
}

// 原型管理器
class PrototypeManager {
  constructor() {
    this.prototypes = new Map()
    this.categories = new Map()
  }
  
  // 注册原型
  register(name, prototype, category = 'default') {
    if (!(prototype instanceof Cloneable)) {
      throw new Error('原型必须实现Cloneable接口')
    }
    
    this.prototypes.set(name, prototype)
    
    if (!this.categories.has(category)) {
      this.categories.set(category, new Set())
    }
    this.categories.get(category).add(name)
    
    console.log(`注册原型: ${name} (${category})`)
  }
  
  // 创建实例（克隆）
  create(name, deep = false) {
    const prototype = this.prototypes.get(name)
    
    if (!prototype) {
      throw new Error(`原型不存在: ${name}`)
    }
    
    const cloned = deep ? prototype.deepClone() : prototype.clone()
    console.log(`从原型创建实例: ${name} -> ${cloned.id}`)
    
    return cloned
  }
  
  // 获取可用原型列表
  getAvailablePrototypes() {
    return Array.from(this.prototypes.keys())
  }
  
  // 按类别获取原型
  getPrototypesByCategory(category) {
    const categorySet = this.categories.get(category)
    if (!categorySet) {
      return []
    }
    
    return Array.from(categorySet).map(name => ({
      name,
      prototype: this.prototypes.get(name)
    }))
  }
  
  // 移除原型
  unregister(name) {
    const removed = this.prototypes.delete(name)
    
    // 从类别中移除
    this.categories.forEach((categorySet, category) => {
      categorySet.delete(name)
      if (categorySet.size === 0) {
        this.categories.delete(category)
      }
    })
    
    if (removed) {
      console.log(`移除原型: ${name}`)
    }
    
    return removed
  }
  
  // 批量创建
  createBatch(name, count, deep = false) {
    const instances = []
    
    for (let i = 0; i < count; i++) {
      instances.push(this.create(name, deep))
    }
    
    console.log(`批量创建 ${count} 个实例: ${name}`)
    return instances
  }
}

// 使用示例
class CreationalPatternsDemo {
  static demo() {
    console.log('=== 创建型模式演示 ===')
    
    // 1. 单例模式演示
    console.log('\n--- 单例模式 ---')
    const config1 = ConfigManager.getInstance()
    const config2 = ConfigManager.getInstance()
    console.log('配置管理器实例相同:', config1 === config2)
    
    config1.set('app.debug', 'true')
    console.log('从另一个引用获取配置:', config2.get('app.debug'))
    
    // 2. 工厂方法模式演示
    console.log('\n--- 工厂方法模式 ---')
    const serviceRegistry = new ServiceFactoryRegistry()
    
    const webService = serviceRegistry.createService('web', {
      name: 'UserAPI',
      config: {
        port: 3000,
        endpoints: [
          { path: '/users', handler: () => 'Users endpoint' }
        ]
      }
    })
    
    console.log('Web服务信息:', webService.getInfo())
    
    // 3. 建造者模式演示
    console.log('\n--- 建造者模式 ---')
    const builder = new WebApplicationBuilder()
    const director = new ApplicationDirector(builder)
    
    const app = director.buildBasicWebApp({
      name: 'MyWebApp',
      version: '2.0.0',
      environment: 'production',
      server: { port: 8080 },
      database: { type: 'postgresql', name: 'myapp' },
      security: { cors: true, helmet: true }
    })
    
    console.log('应用信息:', app.getInfo())
    
    // 流式建造者演示
    const fluentApp = new FluentApplicationBuilder()
      .name('FluentApp')
      .version('1.0.0')
      .environment('development')
      .server({ port: 3000 })
      .database({ type: 'mongodb' })
      .middleware({ name: 'cors', enabled: true })
      .config('debug', true)
      .build()
    
    console.log('流式建造的应用:', fluentApp.getInfo())
    
    // 4. 原型模式演示
    console.log('\n--- 原型模式 ---')
    const prototypeManager = new PrototypeManager()
    
    // 注册原型
    const userTemplate = new UserProfile({
      username: 'template_user',
      email: 'template@example.com',
      preferences: new Map([['theme', 'dark'], ['language', 'en']]),
      permissions: new Set(['read', 'write'])
    })
    
    prototypeManager.register('defaultUser', userTemplate, 'user')
    
    // 创建用户实例
    const user1 = prototypeManager.create('defaultUser')
    const user2 = prototypeManager.create('defaultUser', true) // 深克隆
    
    user1.username = 'john_doe'
    user2.username = 'jane_doe'
    user2.addPermission('admin')
    
    console.log('用户1:', { id: user1.id, username: user1.username })
    console.log('用户2:', { id: user2.id, username: user2.username, permissions: Array.from(user2.permissions) })
    console.log('原模板未受影响:', { username: userTemplate.username, permissions: Array.from(userTemplate.permissions) })
  }
}
```

## 📚 最佳实践总结

1. **单例模式**：确保线程安全，考虑懒加载和饿汉式选择
2. **工厂模式**：根据复杂度选择简单工厂、工厂方法或抽象工厂
3. **建造者模式**：适用于复杂对象的逐步构建，支持流式API
4. **原型模式**：注意深克隆和浅克隆的区别，避免引用共享问题
5. **对象池**：结合单例模式实现对象池，提高性能
6. **注册表模式**：使用注册表管理工厂和原型，提供统一访问
7. **配置驱动**：通过配置文件驱动对象创建，提高灵活性
8. **生命周期管理**：考虑对象的创建、初始化、使用和销毁全过程

通过掌握创建型模式，您将能够设计出灵活、可扩展的对象创建机制。
