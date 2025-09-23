# Cloudflare Workers

## 📖 概述

Cloudflare Workers 是一个无服务器计算平台，运行在 Cloudflare 的全球边缘网络上。它使用 V8 JavaScript 引擎，支持现代 Web 标准，能够在全球 200+ 个数据中心中以极低延迟执行代码。

## 🎯 学习目标

- 掌握 Cloudflare Workers 的核心概念和架构
- 学习 Workers 的开发、部署和调试
- 了解边缘存储和 KV 数据库使用
- 掌握性能优化和安全最佳实践

## 🚀 快速开始

### 1. 第一个 Worker

```javascript
// index.js - 基础 HTTP 处理
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)
  
  // 基础路由
  switch (url.pathname) {
    case '/':
      return new Response('Hello from Cloudflare Workers!', {
        headers: { 'Content-Type': 'text/plain' }
      })
    
    case '/api/health':
      return handleHealthCheck()
    
    case '/api/user':
      return handleUserAPI(request)
    
    default:
      return new Response('Not Found', { status: 404 })
  }
}

// 健康检查
function handleHealthCheck() {
  return new Response(JSON.stringify({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    region: globalThis.colo || 'unknown'
  }), {
    headers: { 'Content-Type': 'application/json' }
  })
}

// 用户 API 处理
async function handleUserAPI(request) {
  const method = request.method
  
  switch (method) {
    case 'GET':
      return getUserInfo(request)
    case 'POST':
      return createUser(request)
    case 'PUT':
      return updateUser(request)
    default:
      return new Response('Method Not Allowed', { status: 405 })
  }
}

async function getUserInfo(request) {
  const url = new URL(request.url)
  const userId = url.searchParams.get('id')
  
  if (!userId) {
    return new Response(JSON.stringify({
      error: 'User ID is required'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }
  
  // 从 KV 存储获取用户信息
  const userInfo = await USERS_KV.get(`user:${userId}`, 'json')
  
  if (!userInfo) {
    return new Response(JSON.stringify({
      error: 'User not found'
    }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    })
  }
  
  return new Response(JSON.stringify(userInfo), {
    headers: { 'Content-Type': 'application/json' }
  })
}
```

### 2. wrangler.toml 配置

```toml
# wrangler.toml
name = "my-worker"
main = "src/index.js"
compatibility_date = "2023-10-30"
compatibility_flags = ["nodejs_compat"]

[env.production]
name = "my-worker-prod"
route = "api.example.com/*"
zone_id = "your-zone-id"

[env.staging]
name = "my-worker-staging"
route = "staging-api.example.com/*"

# KV 命名空间
[[kv_namespaces]]
binding = "USERS_KV"
id = "your-kv-namespace-id"
preview_id = "your-preview-kv-namespace-id"

# Durable Objects
[[durable_objects.bindings]]
name = "CHAT_ROOMS"
class_name = "ChatRoom"

# R2 存储
[[r2_buckets]]
binding = "ASSETS_BUCKET"
bucket_name = "my-assets"

# 环境变量
[vars]
API_BASE_URL = "https://api.backend.com"
DEBUG_MODE = "false"

# 密钥
[env.production.vars]
API_SECRET = "production-secret"

[env.staging.vars]
API_SECRET = "staging-secret"
```

## 🗄️ KV 存储使用

### 1. 基础 KV 操作

```javascript
// KV 存储管理类
class WorkerKVManager {
  constructor(namespace) {
    this.kv = namespace
  }
  
  // 存储数据
  async set(key, value, options = {}) {
    try {
      const serializedValue = typeof value === 'string' 
        ? value 
        : JSON.stringify(value)
      
      const kvOptions = {
        expirationTtl: options.ttl,
        metadata: options.metadata
      }
      
      await this.kv.put(key, serializedValue, kvOptions)
      
      console.log(`KV 存储成功: ${key}`)
      return true
    } catch (error) {
      console.error(`KV 存储失败: ${key}`, error)
      throw error
    }
  }
  
  // 获取数据
  async get(key, type = 'text') {
    try {
      const value = await this.kv.get(key, type)
      
      if (value === null) {
        return null
      }
      
      // 自动解析 JSON
      if (type === 'text' && this.isJsonString(value)) {
        return JSON.parse(value)
      }
      
      return value
    } catch (error) {
      console.error(`KV 获取失败: ${key}`, error)
      return null
    }
  }
  
  // 删除数据
  async delete(key) {
    try {
      await this.kv.delete(key)
      console.log(`KV 删除成功: ${key}`)
      return true
    } catch (error) {
      console.error(`KV 删除失败: ${key}`, error)
      return false
    }
  }
  
  // 列出键
  async list(options = {}) {
    try {
      const result = await this.kv.list({
        prefix: options.prefix,
        limit: options.limit || 1000,
        cursor: options.cursor
      })
      
      return {
        keys: result.keys,
        cursor: result.cursor,
        list_complete: result.list_complete
      }
    } catch (error) {
      console.error('KV 列表获取失败', error)
      return { keys: [], cursor: null, list_complete: true }
    }
  }
  
  // 批量操作
  async getBatch(keys) {
    const promises = keys.map(key => this.get(key))
    const results = await Promise.allSettled(promises)
    
    return results.map((result, index) => ({
      key: keys[index],
      success: result.status === 'fulfilled',
      value: result.status === 'fulfilled' ? result.value : null,
      error: result.status === 'rejected' ? result.reason : null
    }))
  }
  
  async setBatch(items) {
    const promises = items.map(item => 
      this.set(item.key, item.value, item.options)
    )
    
    const results = await Promise.allSettled(promises)
    
    return results.map((result, index) => ({
      key: items[index].key,
      success: result.status === 'fulfilled',
      error: result.status === 'rejected' ? result.reason : null
    }))
  }
  
  // 原子操作
  async increment(key, delta = 1) {
    const current = await this.get(key) || 0
    const newValue = parseInt(current) + delta
    await this.set(key, newValue.toString())
    return newValue
  }
  
  // 条件更新
  async updateIf(key, condition, newValue) {
    const current = await this.get(key)
    
    if (condition(current)) {
      await this.set(key, newValue)
      return { updated: true, oldValue: current, newValue }
    }
    
    return { updated: false, currentValue: current }
  }
  
  // 工具方法
  isJsonString(str) {
    try {
      JSON.parse(str)
      return true
    } catch {
      return false
    }
  }
}

// 使用示例
const kvManager = new WorkerKVManager(USERS_KV)

// 用户管理
async function handleUserManagement(request) {
  const url = new URL(request.url)
  const userId = url.searchParams.get('userId')
  
  switch (request.method) {
    case 'GET':
      const user = await kvManager.get(`user:${userId}`)
      return new Response(JSON.stringify(user), {
        headers: { 'Content-Type': 'application/json' }
      })
    
    case 'POST':
      const userData = await request.json()
      await kvManager.set(`user:${userId}`, userData, {
        ttl: 86400, // 24小时过期
        metadata: { createdAt: Date.now() }
      })
      
      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' }
      })
    
    case 'DELETE':
      await kvManager.delete(`user:${userId}`)
      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' }
      })
  }
}
```

### 2. 缓存策略实现

```javascript
// 智能缓存管理
class WorkerCache {
  constructor(kvNamespace) {
    this.kv = new WorkerKVManager(kvNamespace)
    this.memoryCache = new Map()
    this.cacheStats = {
      hits: 0,
      misses: 0,
      sets: 0,
      evictions: 0
    }
  }
  
  // 多层缓存获取
  async get(key, options = {}) {
    const cacheKey = this.buildCacheKey(key, options)
    
    // 1. 检查内存缓存
    if (this.memoryCache.has(cacheKey)) {
      const cached = this.memoryCache.get(cacheKey)
      
      if (!this.isExpired(cached)) {
        this.cacheStats.hits++
        return cached.value
      } else {
        this.memoryCache.delete(cacheKey)
      }
    }
    
    // 2. 检查 KV 缓存
    const kvCached = await this.kv.get(cacheKey)
    if (kvCached) {
      // 回填内存缓存
      this.setMemoryCache(cacheKey, kvCached, options.memoryTtl || 60)
      this.cacheStats.hits++
      return kvCached
    }
    
    this.cacheStats.misses++
    return null
  }
  
  // 多层缓存设置
  async set(key, value, options = {}) {
    const cacheKey = this.buildCacheKey(key, options)
    
    // 设置内存缓存
    if (options.memoryTtl) {
      this.setMemoryCache(cacheKey, value, options.memoryTtl)
    }
    
    // 设置 KV 缓存
    if (options.kvTtl) {
      await this.kv.set(cacheKey, value, { ttl: options.kvTtl })
    }
    
    this.cacheStats.sets++
  }
  
  // 缓存穿透保护
  async getWithFallback(key, fallbackFn, options = {}) {
    let value = await this.get(key, options)
    
    if (value === null) {
      // 防止缓存穿透
      const lockKey = `lock:${key}`
      const hasLock = await this.acquireLock(lockKey, 30) // 30秒锁
      
      if (hasLock) {
        try {
          // 再次检查缓存（可能其他请求已填充）
          value = await this.get(key, options)
          
          if (value === null) {
            value = await fallbackFn()
            
            if (value !== null) {
              await this.set(key, value, options)
            } else {
              // 缓存空值，防止频繁回源
              await this.set(key, '__NULL__', {
                kvTtl: 60, // 短时间缓存空值
                memoryTtl: 10
              })
            }
          }
        } finally {
          await this.releaseLock(lockKey)
        }
      } else {
        // 等待锁释放后重试
        await this.sleep(100)
        return this.getWithFallback(key, fallbackFn, options)
      }
    }
    
    return value === '__NULL__' ? null : value
  }
  
  // 内存缓存管理
  setMemoryCache(key, value, ttlSeconds) {
    // 检查内存使用限制
    if (this.memoryCache.size >= 1000) {
      this.evictOldest()
    }
    
    this.memoryCache.set(key, {
      value,
      expiresAt: Date.now() + (ttlSeconds * 1000),
      accessCount: 0,
      lastAccess: Date.now()
    })
  }
  
  evictOldest() {
    const entries = Array.from(this.memoryCache.entries())
    
    // 按最后访问时间排序
    entries.sort((a, b) => a[1].lastAccess - b[1].lastAccess)
    
    // 移除最老的 10%
    const toEvict = Math.ceil(entries.length * 0.1)
    
    for (let i = 0; i < toEvict; i++) {
      this.memoryCache.delete(entries[i][0])
      this.cacheStats.evictions++
    }
  }
  
  // 分布式锁
  async acquireLock(lockKey, ttlSeconds) {
    const lockValue = `${Date.now()}_${Math.random()}`
    const lockData = {
      value: lockValue,
      expiresAt: Date.now() + (ttlSeconds * 1000)
    }
    
    const existing = await this.kv.get(lockKey)
    if (existing && existing.expiresAt > Date.now()) {
      return false // 锁已被占用
    }
    
    await this.kv.set(lockKey, lockData, { ttl: ttlSeconds })
    
    // 验证锁获取成功
    const verification = await this.kv.get(lockKey)
    return verification && verification.value === lockValue
  }
  
  async releaseLock(lockKey) {
    await this.kv.delete(lockKey)
  }
  
  // 工具方法
  buildCacheKey(key, options) {
    const parts = [key]
    
    if (options.version) {
      parts.push(`v:${options.version}`)
    }
    
    if (options.userId) {
      parts.push(`u:${options.userId}`)
    }
    
    return parts.join(':')
  }
  
  isExpired(cached) {
    return cached.expiresAt && cached.expiresAt < Date.now()
  }
  
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
  
  // 获取缓存统计
  getStats() {
    const total = this.cacheStats.hits + this.cacheStats.misses
    
    return {
      ...this.cacheStats,
      hitRate: total > 0 ? (this.cacheStats.hits / total) : 0,
      memorySize: this.memoryCache.size
    }
  }
}
```

## 🔄 Durable Objects

### 1. 基础 Durable Object

```javascript
// 聊天室 Durable Object
export class ChatRoom {
  constructor(state, env) {
    this.state = state
    this.env = env
    this.sessions = new Map()
    this.messages = []
    this.roomInfo = {
      createdAt: null,
      lastActivity: Date.now(),
      userCount: 0
    }
    
    // 从持久存储恢复状态
    this.initializeFromStorage()
  }
  
  async initializeFromStorage() {
    const stored = await this.state.storage.get('roomInfo')
    if (stored) {
      this.roomInfo = stored
    }
    
    const storedMessages = await this.state.storage.get('messages')
    if (storedMessages) {
      this.messages = storedMessages
    }
  }
  
  // 处理 WebSocket 连接
  async fetch(request) {
    const url = new URL(request.url)
    
    switch (url.pathname) {
      case '/websocket':
        return this.handleWebSocket(request)
      case '/messages':
        return this.handleMessagesAPI(request)
      case '/info':
        return this.handleRoomInfo(request)
      default:
        return new Response('Not Found', { status: 404 })
    }
  }
  
  async handleWebSocket(request) {
    const upgradeHeader = request.headers.get('Upgrade')
    if (upgradeHeader !== 'websocket') {
      return new Response('Expected websocket', { status: 400 })
    }
    
    const [client, server] = Object.values(new WebSocketPair())
    
    await this.handleSession(server, request)
    
    return new Response(null, {
      status: 101,
      webSocket: client
    })
  }
  
  async handleSession(webSocket, request) {
    const url = new URL(request.url)
    const userId = url.searchParams.get('userId')
    const username = url.searchParams.get('username')
    
    if (!userId || !username) {
      webSocket.close(1008, 'Missing userId or username')
      return
    }
    
    // 创建会话
    const session = {
      id: userId,
      username,
      webSocket,
      joinedAt: new Date(),
      lastSeen: new Date()
    }
    
    this.sessions.set(userId, session)
    this.roomInfo.userCount = this.sessions.size
    this.roomInfo.lastActivity = Date.now()
    
    // 发送欢迎消息和历史消息
    this.sendToSession(session, {
      type: 'welcome',
      data: {
        roomInfo: this.roomInfo,
        recentMessages: this.messages.slice(-50) // 最近50条消息
      }
    })
    
    // 通知其他用户
    this.broadcast({
      type: 'user_joined',
      data: {
        userId,
        username,
        timestamp: new Date().toISOString()
      }
    }, userId)
    
    // 处理消息
    webSocket.addEventListener('message', async (event) => {
      try {
        const message = JSON.parse(event.data)
        await this.handleMessage(session, message)
      } catch (error) {
        console.error('处理消息失败:', error)
        this.sendToSession(session, {
          type: 'error',
          data: { message: '消息格式错误' }
        })
      }
    })
    
    // 处理断开连接
    webSocket.addEventListener('close', async (event) => {
      await this.handleDisconnect(session, event)
    })
    
    // 接受连接
    webSocket.accept()
  }
  
  async handleMessage(session, message) {
    switch (message.type) {
      case 'chat':
        await this.handleChatMessage(session, message.data)
        break
      case 'typing':
        this.handleTypingIndicator(session, message.data)
        break
      case 'ping':
        this.sendToSession(session, { type: 'pong' })
        break
      default:
        console.warn('未知消息类型:', message.type)
    }
    
    // 更新最后活动时间
    session.lastSeen = new Date()
    this.roomInfo.lastActivity = Date.now()
  }
  
  async handleChatMessage(session, data) {
    const chatMessage = {
      id: this.generateMessageId(),
      userId: session.id,
      username: session.username,
      content: data.content,
      timestamp: new Date().toISOString(),
      type: data.type || 'text'
    }
    
    // 内容过滤
    chatMessage.content = this.filterContent(chatMessage.content)
    
    // 存储消息
    this.messages.push(chatMessage)
    
    // 限制消息历史长度
    if (this.messages.length > 1000) {
      this.messages = this.messages.slice(-1000)
    }
    
    // 持久化存储
    await this.state.storage.put('messages', this.messages)
    
    // 广播消息
    this.broadcast({
      type: 'message',
      data: chatMessage
    })
  }
  
  handleTypingIndicator(session, data) {
    // 转发打字指示器给其他用户
    this.broadcast({
      type: 'typing',
      data: {
        userId: session.id,
        username: session.username,
        isTyping: data.isTyping
      }
    }, session.id)
  }
  
  async handleDisconnect(session, event) {
    this.sessions.delete(session.id)
    this.roomInfo.userCount = this.sessions.size
    
    // 通知其他用户
    this.broadcast({
      type: 'user_left',
      data: {
        userId: session.id,
        username: session.username,
        timestamp: new Date().toISOString()
      }
    })
    
    // 更新房间信息
    await this.state.storage.put('roomInfo', this.roomInfo)
    
    console.log(`用户离开: ${session.username}`)
  }
  
  // 广播消息
  broadcast(message, excludeUserId = null) {
    const messageStr = JSON.stringify(message)
    
    this.sessions.forEach((session, userId) => {
      if (userId !== excludeUserId) {
        try {
          session.webSocket.send(messageStr)
        } catch (error) {
          console.error(`发送消息失败 [${userId}]:`, error)
          // 清理无效连接
          this.sessions.delete(userId)
        }
      }
    })
  }
  
  sendToSession(session, message) {
    try {
      session.webSocket.send(JSON.stringify(message))
    } catch (error) {
      console.error(`发送消息失败 [${session.id}]:`, error)
    }
  }
  
  // REST API 处理
  async handleMessagesAPI(request) {
    switch (request.method) {
      case 'GET':
        const limit = parseInt(new URL(request.url).searchParams.get('limit')) || 50
        const recentMessages = this.messages.slice(-limit)
        
        return new Response(JSON.stringify(recentMessages), {
          headers: { 'Content-Type': 'application/json' }
        })
      
      default:
        return new Response('Method Not Allowed', { status: 405 })
    }
  }
  
  async handleRoomInfo(request) {
    const info = {
      ...this.roomInfo,
      activeUsers: Array.from(this.sessions.values()).map(s => ({
        id: s.id,
        username: s.username,
        joinedAt: s.joinedAt
      })),
      messageCount: this.messages.length
    }
    
    return new Response(JSON.stringify(info), {
      headers: { 'Content-Type': 'application/json' }
    })
  }
  
  // 工具方法
  generateMessageId() {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
  
  filterContent(content) {
    // 简单的内容过滤
    const bannedWords = ['spam', 'abuse']
    let filtered = content
    
    bannedWords.forEach(word => {
      const regex = new RegExp(word, 'gi')
      filtered = filtered.replace(regex, '***')
    })
    
    return filtered
  }
}
```

### 2. 分布式计数器

```javascript
// 分布式计数器 Durable Object
export class DistributedCounter {
  constructor(state, env) {
    this.state = state
    this.env = env
    this.counters = new Map()
    this.initialized = false
  }
  
  async ensureInitialized() {
    if (!this.initialized) {
      const stored = await this.state.storage.get('counters')
      if (stored) {
        this.counters = new Map(stored)
      }
      this.initialized = true
    }
  }
  
  async fetch(request) {
    await this.ensureInitialized()
    
    const url = new URL(request.url)
    const counterName = url.searchParams.get('name')
    
    if (!counterName) {
      return new Response('Counter name is required', { status: 400 })
    }
    
    switch (request.method) {
      case 'GET':
        return this.getCounter(counterName)
      case 'POST':
        return this.incrementCounter(request, counterName)
      case 'PUT':
        return this.setCounter(request, counterName)
      case 'DELETE':
        return this.deleteCounter(counterName)
      default:
        return new Response('Method Not Allowed', { status: 405 })
    }
  }
  
  async getCounter(name) {
    const counter = this.counters.get(name) || {
      name,
      value: 0,
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString()
    }
    
    return new Response(JSON.stringify(counter), {
      headers: { 'Content-Type': 'application/json' }
    })
  }
  
  async incrementCounter(request, name) {
    const body = await request.json().catch(() => ({}))
    const delta = body.delta || 1
    
    const counter = this.counters.get(name) || {
      name,
      value: 0,
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString()
    }
    
    counter.value += delta
    counter.lastModified = new Date().toISOString()
    
    this.counters.set(name, counter)
    
    // 持久化
    await this.persistCounters()
    
    return new Response(JSON.stringify(counter), {
      headers: { 'Content-Type': 'application/json' }
    })
  }
  
  async setCounter(request, name) {
    const body = await request.json()
    const value = body.value
    
    if (typeof value !== 'number') {
      return new Response('Value must be a number', { status: 400 })
    }
    
    const counter = {
      name,
      value,
      createdAt: this.counters.get(name)?.createdAt || new Date().toISOString(),
      lastModified: new Date().toISOString()
    }
    
    this.counters.set(name, counter)
    await this.persistCounters()
    
    return new Response(JSON.stringify(counter), {
      headers: { 'Content-Type': 'application/json' }
    })
  }
  
  async deleteCounter(name) {
    const existed = this.counters.delete(name)
    
    if (existed) {
      await this.persistCounters()
    }
    
    return new Response(JSON.stringify({ 
      deleted: existed,
      name 
    }), {
      headers: { 'Content-Type': 'application/json' }
    })
  }
  
  async persistCounters() {
    await this.state.storage.put('counters', Array.from(this.counters.entries()))
  }
}
```

## 🌐 HTTP 客户端和 API 集成

### 1. 外部 API 调用

```javascript
// API 客户端管理
class WorkerAPIClient {
  constructor(baseURL, options = {}) {
    this.baseURL = baseURL
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'User-Agent': 'Cloudflare-Worker/1.0',
      ...options.headers
    }
    this.timeout = options.timeout || 10000
    this.retryAttempts = options.retryAttempts || 3
    this.retryDelay = options.retryDelay || 1000
  }
  
  // 通用请求方法
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`
    const requestOptions = {
      method: options.method || 'GET',
      headers: {
        ...this.defaultHeaders,
        ...options.headers
      },
      body: options.body ? JSON.stringify(options.body) : undefined
    }
    
    // 添加超时控制
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)
    requestOptions.signal = controller.signal
    
    let lastError
    
    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        const response = await fetch(url, requestOptions)
        clearTimeout(timeoutId)
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        
        const contentType = response.headers.get('content-type')
        
        if (contentType && contentType.includes('application/json')) {
          return await response.json()
        } else {
          return await response.text()
        }
        
      } catch (error) {
        lastError = error
        console.error(`API 请求失败 (尝试 ${attempt}/${this.retryAttempts}):`, error)
        
        // 如果不是最后一次尝试，等待后重试
        if (attempt < this.retryAttempts) {
          await this.sleep(this.retryDelay * attempt)
        }
      }
    }
    
    clearTimeout(timeoutId)
    throw lastError
  }
  
  // HTTP 方法快捷方式
  async get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString()
    const url = queryString ? `${endpoint}?${queryString}` : endpoint
    
    return this.request(url, { method: 'GET' })
  }
  
  async post(endpoint, body, headers = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body,
      headers
    })
  }
  
  async put(endpoint, body, headers = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body,
      headers
    })
  }
  
  async delete(endpoint, headers = {}) {
    return this.request(endpoint, {
      method: 'DELETE',
      headers
    })
  }
  
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// 使用示例：微服务聚合
async function handleUserProfile(request) {
  const url = new URL(request.url)
  const userId = url.searchParams.get('userId')
  
  if (!userId) {
    return new Response('User ID required', { status: 400 })
  }
  
  const userAPI = new WorkerAPIClient('https://user-service.example.com')
  const orderAPI = new WorkerAPIClient('https://order-service.example.com')
  const analyticsAPI = new WorkerAPIClient('https://analytics-service.example.com')
  
  try {
    // 并行调用多个服务
    const [userInfo, recentOrders, userAnalytics] = await Promise.all([
      userAPI.get(`/users/${userId}`),
      orderAPI.get(`/orders`, { userId, limit: 5 }),
      analyticsAPI.get(`/user-stats/${userId}`)
    ])
    
    // 聚合响应
    const profile = {
      user: userInfo,
      recentOrders: recentOrders.orders || [],
      analytics: userAnalytics,
      aggregatedAt: new Date().toISOString()
    }
    
    return new Response(JSON.stringify(profile), {
      headers: { 'Content-Type': 'application/json' }
    })
    
  } catch (error) {
    console.error('用户档案聚合失败:', error)
    
    return new Response(JSON.stringify({
      error: 'Failed to load user profile',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
```

### 2. 请求转换和中间件

```javascript
// 请求转换中间件
class RequestTransformer {
  constructor() {
    this.middlewares = []
  }
  
  use(middleware) {
    this.middlewares.push(middleware)
    return this
  }
  
  async transform(request, context = {}) {
    let transformedRequest = request
    let transformedContext = context
    
    for (const middleware of this.middlewares) {
      const result = await middleware(transformedRequest, transformedContext)
      
      if (result.request) {
        transformedRequest = result.request
      }
      
      if (result.context) {
        transformedContext = { ...transformedContext, ...result.context }
      }
      
      // 如果中间件返回响应，直接返回
      if (result.response) {
        return { response: result.response }
      }
    }
    
    return {
      request: transformedRequest,
      context: transformedContext
    }
  }
}

// 认证中间件
const authMiddleware = async (request, context) => {
  const authHeader = request.headers.get('Authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      response: new Response('Unauthorized', { status: 401 })
    }
  }
  
  const token = authHeader.substring(7)
  
  try {
    // 验证 JWT token
    const payload = await verifyJWT(token)
    
    return {
      context: {
        user: payload,
        authenticated: true
      }
    }
  } catch (error) {
    return {
      response: new Response('Invalid token', { status: 401 })
    }
  }
}

// 速率限制中间件
const rateLimitMiddleware = async (request, context) => {
  const clientIP = request.headers.get('CF-Connecting-IP')
  const rateLimitKey = `rate_limit:${clientIP}`
  
  // 获取当前请求计数
  const currentCount = await RATE_LIMIT_KV.get(rateLimitKey) || 0
  const limit = 100 // 每分钟100个请求
  
  if (parseInt(currentCount) >= limit) {
    return {
      response: new Response('Rate limit exceeded', {
        status: 429,
        headers: {
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': '0',
          'Retry-After': '60'
        }
      })
    }
  }
  
  // 增加计数
  await RATE_LIMIT_KV.put(rateLimitKey, (parseInt(currentCount) + 1).toString(), {
    expirationTtl: 60
  })
  
  return {
    context: {
      rateLimitRemaining: limit - parseInt(currentCount) - 1
    }
  }
}

// CORS 中间件
const corsMiddleware = async (request, context) => {
  const origin = request.headers.get('Origin')
  const allowedOrigins = ['https://app.example.com', 'https://admin.example.com']
  
  if (request.method === 'OPTIONS') {
    return {
      response: new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': allowedOrigins.includes(origin) ? origin : 'null',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400'
        }
      })
    }
  }
  
  return {
    context: {
      corsOrigin: allowedOrigins.includes(origin) ? origin : null
    }
  }
}

// 使用中间件
const transformer = new RequestTransformer()
  .use(corsMiddleware)
  .use(rateLimitMiddleware)
  .use(authMiddleware)

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  try {
    const result = await transformer.transform(request)
    
    // 如果中间件返回了响应，直接返回
    if (result.response) {
      return result.response
    }
    
    // 处理业务逻辑
    const response = await handleBusinessLogic(result.request, result.context)
    
    // 添加 CORS 头
    if (result.context.corsOrigin) {
      response.headers.set('Access-Control-Allow-Origin', result.context.corsOrigin)
    }
    
    return response
  } catch (error) {
    console.error('请求处理失败:', error)
    
    return new Response('Internal Server Error', { status: 500 })
  }
}
```

## 🔒 安全和最佳实践

### 1. 输入验证和清理

```javascript
// 输入验证器
class InputValidator {
  static validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }
  
  static validateURL(url) {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }
  
  static sanitizeHTML(input) {
    // 移除潜在危险的 HTML 标签和属性
    return input
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+=/gi, '')
  }
  
  static validateJSON(input) {
    try {
      JSON.parse(input)
      return true
    } catch {
      return false
    }
  }
  
  static sanitizeSQL(input) {
    // 基础 SQL 注入防护
    const dangerousPatterns = [
      /('|(\\')|(;)|(\\)|(\\)|(--)|(\s)|(\||(\*)|(%)))/i,
      /((\%3D)|(=))[^\n]*((\%27)|(')|((\%3B)|(;)))/i,
      /\w*((\%27)|(\'))((\%6F)|o|(\%4F))((\%72)|r|(\%52))/i
    ]
    
    return !dangerousPatterns.some(pattern => pattern.test(input))
  }
}

// 安全处理函数
async function secureHandler(request) {
  try {
    // 验证 Content-Type
    const contentType = request.headers.get('Content-Type')
    if (request.method === 'POST' && !contentType?.includes('application/json')) {
      return new Response('Invalid Content-Type', { status: 400 })
    }
    
    // 验证请求大小
    const contentLength = request.headers.get('Content-Length')
    if (contentLength && parseInt(contentLength) > 1024 * 1024) { // 1MB 限制
      return new Response('Request too large', { status: 413 })
    }
    
    // 解析和验证请求体
    let body = {}
    if (request.method !== 'GET') {
      const rawBody = await request.text()
      
      if (!InputValidator.validateJSON(rawBody)) {
        return new Response('Invalid JSON', { status: 400 })
      }
      
      body = JSON.parse(rawBody)
    }
    
    // 验证必需字段
    const requiredFields = ['email', 'name']
    for (const field of requiredFields) {
      if (!body[field]) {
        return new Response(`Missing required field: ${field}`, { status: 400 })
      }
    }
    
    // 验证邮箱格式
    if (!InputValidator.validateEmail(body.email)) {
      return new Response('Invalid email format', { status: 400 })
    }
    
    // 清理输入
    body.name = InputValidator.sanitizeHTML(body.name)
    
    // 处理业务逻辑
    const result = await processSecureRequest(body)
    
    return new Response(JSON.stringify(result), {
      headers: {
        'Content-Type': 'application/json',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block'
      }
    })
    
  } catch (error) {
    console.error('安全处理失败:', error)
    
    // 不要泄露内部错误信息
    return new Response('Processing failed', { status: 500 })
  }
}
```

### 2. JWT 验证

```javascript
// JWT 工具类
class JWTHelper {
  static async verifyJWT(token, secret) {
    const parts = token.split('.')
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format')
    }
    
    const [headerB64, payloadB64, signatureB64] = parts
    
    // 验证签名
    const data = `${headerB64}.${payloadB64}`
    const signature = await this.sign(data, secret)
    
    if (signature !== signatureB64) {
      throw new Error('Invalid JWT signature')
    }
    
    // 解析载荷
    const payload = JSON.parse(atob(payloadB64))
    
    // 验证过期时间
    if (payload.exp && payload.exp < Date.now() / 1000) {
      throw new Error('JWT expired')
    }
    
    return payload
  }
  
  static async createJWT(payload, secret, expiresIn = 3600) {
    const header = {
      alg: 'HS256',
      typ: 'JWT'
    }
    
    const now = Math.floor(Date.now() / 1000)
    const fullPayload = {
      ...payload,
      iat: now,
      exp: now + expiresIn
    }
    
    const headerB64 = btoa(JSON.stringify(header))
    const payloadB64 = btoa(JSON.stringify(fullPayload))
    const data = `${headerB64}.${payloadB64}`
    
    const signature = await this.sign(data, secret)
    
    return `${data}.${signature}`
  }
  
  static async sign(data, secret) {
    const encoder = new TextEncoder()
    const keyData = encoder.encode(secret)
    const dataBuffer = encoder.encode(data)
    
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )
    
    const signature = await crypto.subtle.sign('HMAC', key, dataBuffer)
    
    // 转换为 base64url
    return btoa(String.fromCharCode(...new Uint8Array(signature)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '')
  }
}
```

## 📚 最佳实践总结

1. **性能优化**：利用边缘缓存和 KV 存储减少延迟
2. **资源管理**：合理使用 CPU 时间和内存限制
3. **错误处理**：实现完整的错误处理和重试机制
4. **安全防护**：输入验证、认证授权、防止注入攻击
5. **监控日志**：使用 console.log 和分析工具监控性能
6. **版本管理**：使用环境变量管理不同部署环境
7. **测试调试**：本地测试和 Cloudflare 调试工具
8. **成本控制**：优化请求数量和计算复杂度

通过掌握这些 Cloudflare Workers 技术，您将能够构建高性能、全球分布的边缘应用程序。
