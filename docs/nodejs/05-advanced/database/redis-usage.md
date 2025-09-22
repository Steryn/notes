# Redis使用

## 概述

Redis是一个高性能的内存数据结构存储系统，可以用作数据库、缓存和消息代理。在Node.js应用中，Redis是实现分布式缓存、会话存储、实时数据处理的首选方案。

## Redis基础操作

### 1. 连接和配置
```javascript
const Redis = require('ioredis');

// 基础连接
const redis = new Redis({
  host: 'localhost',
  port: 6379,
  password: 'your_password',
  db: 0,
  
  // 连接池配置
  maxRetriesPerRequest: 3,
  retryDelayOnFailover: 100,
  enableReadyCheck: false,
  maxLoadingTimeout: 1000,
  
  // 重连配置
  lazyConnect: true,
  keepAlive: 30000,
  
  // 性能配置
  enableOfflineQueue: false,
  commandTimeout: 5000
});

// 集群连接
const cluster = new Redis.Cluster([
  {
    host: '127.0.0.1',
    port: 7000
  },
  {
    host: '127.0.0.1',
    port: 7001
  }
], {
  redisOptions: {
    password: 'your_password'
  },
  enableOfflineQueue: false,
  scaleReads: 'slave'
});

// 哨兵模式
const sentinel = new Redis({
  sentinels: [
    { host: '127.0.0.1', port: 26379 },
    { host: '127.0.0.1', port: 26380 }
  ],
  name: 'mymaster',
  role: 'master',
  sentinelRetryOnFailover: true
});
```

### 2. 数据类型操作
```javascript
// Redis数据类型操作封装
class RedisDataTypes {
  constructor(redis) {
    this.redis = redis;
  }
  
  // 字符串操作
  async stringOperations() {
    // 设置和获取
    await this.redis.set('user:1:name', 'John Doe');
    const name = await this.redis.get('user:1:name');
    
    // 带过期时间
    await this.redis.setex('session:abc123', 3600, 'user_data');
    
    // 原子操作
    await this.redis.incr('page_views');
    await this.redis.incrby('score', 10);
    
    // 批量操作
    await this.redis.mset('key1', 'value1', 'key2', 'value2');
    const values = await this.redis.mget('key1', 'key2');
    
    return { name, values };
  }
  
  // 哈希操作
  async hashOperations() {
    const userKey = 'user:1';
    
    // 设置哈希字段
    await this.redis.hset(userKey, 'name', 'John', 'age', 30, 'email', 'john@example.com');
    
    // 获取哈希字段
    const name = await this.redis.hget(userKey, 'name');
    const user = await this.redis.hgetall(userKey);
    
    // 原子操作
    await this.redis.hincrby(userKey, 'login_count', 1);
    
    // 检查字段存在
    const exists = await this.redis.hexists(userKey, 'name');
    
    return { name, user, exists };
  }
  
  // 列表操作
  async listOperations() {
    const listKey = 'recent_posts';
    
    // 添加元素
    await this.redis.lpush(listKey, 'post1', 'post2', 'post3');
    await this.redis.rpush(listKey, 'post4');
    
    // 获取元素
    const firstPost = await this.redis.lpop(listKey);
    const lastPost = await this.redis.rpop(listKey);
    const allPosts = await this.redis.lrange(listKey, 0, -1);
    
    // 列表长度
    const length = await this.redis.llen(listKey);
    
    // 阻塞操作
    const blockedPost = await this.redis.blpop(listKey, 10); // 10秒超时
    
    return { firstPost, lastPost, allPosts, length };
  }
  
  // 集合操作
  async setOperations() {
    const setKey = 'user_tags';
    
    // 添加成员
    await this.redis.sadd(setKey, 'javascript', 'nodejs', 'redis');
    
    // 获取成员
    const members = await this.redis.smembers(setKey);
    const isMember = await this.redis.sismember(setKey, 'javascript');
    
    // 集合运算
    const otherSet = 'skill_tags';
    await this.redis.sadd(otherSet, 'javascript', 'python', 'docker');
    
    const intersection = await this.redis.sinter(setKey, otherSet);
    const union = await this.redis.sunion(setKey, otherSet);
    const difference = await this.redis.sdiff(setKey, otherSet);
    
    return { members, isMember, intersection, union, difference };
  }
  
  // 有序集合操作
  async sortedSetOperations() {
    const zsetKey = 'leaderboard';
    
    // 添加成员和分数
    await this.redis.zadd(zsetKey, 100, 'player1', 200, 'player2', 150, 'player3');
    
    // 获取排名
    const rank = await this.redis.zrank(zsetKey, 'player1');
    const reverseRank = await this.redis.zrevrank(zsetKey, 'player1');
    
    // 获取分数
    const score = await this.redis.zscore(zsetKey, 'player1');
    
    // 范围查询
    const topPlayers = await this.redis.zrevrange(zsetKey, 0, 2, 'WITHSCORES');
    const playersByScore = await this.redis.zrangebyscore(zsetKey, 100, 200);
    
    // 增加分数
    await this.redis.zincrby(zsetKey, 10, 'player1');
    
    return { rank, reverseRank, score, topPlayers, playersByScore };
  }
}
```

## 高级功能

### 1. 发布订阅
```javascript
// Redis发布订阅系统
class RedisPubSub {
  constructor(redisConfig) {
    this.publisher = new Redis(redisConfig);
    this.subscriber = new Redis(redisConfig);
    this.subscribers = new Map();
    
    this.setupSubscriber();
  }
  
  setupSubscriber() {
    this.subscriber.on('message', (channel, message) => {
      const handlers = this.subscribers.get(channel);
      if (handlers) {
        const parsedMessage = this.parseMessage(message);
        handlers.forEach(handler => {
          try {
            handler(parsedMessage, channel);
          } catch (error) {
            console.error('消息处理错误:', error);
          }
        });
      }
    });
    
    this.subscriber.on('pmessage', (pattern, channel, message) => {
      const handlers = this.subscribers.get(pattern);
      if (handlers) {
        const parsedMessage = this.parseMessage(message);
        handlers.forEach(handler => {
          try {
            handler(parsedMessage, channel, pattern);
          } catch (error) {
            console.error('模式消息处理错误:', error);
          }
        });
      }
    });
  }
  
  // 发布消息
  async publish(channel, message) {
    const serializedMessage = this.serializeMessage(message);
    const subscriberCount = await this.publisher.publish(channel, serializedMessage);
    return subscriberCount;
  }
  
  // 订阅频道
  async subscribe(channel, handler) {
    if (!this.subscribers.has(channel)) {
      this.subscribers.set(channel, new Set());
      await this.subscriber.subscribe(channel);
    }
    
    this.subscribers.get(channel).add(handler);
  }
  
  // 模式订阅
  async psubscribe(pattern, handler) {
    if (!this.subscribers.has(pattern)) {
      this.subscribers.set(pattern, new Set());
      await this.subscriber.psubscribe(pattern);
    }
    
    this.subscribers.get(pattern).add(handler);
  }
  
  // 取消订阅
  async unsubscribe(channel, handler) {
    const handlers = this.subscribers.get(channel);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.subscribers.delete(channel);
        await this.subscriber.unsubscribe(channel);
      }
    }
  }
  
  serializeMessage(message) {
    return typeof message === 'string' ? message : JSON.stringify(message);
  }
  
  parseMessage(message) {
    try {
      return JSON.parse(message);
    } catch {
      return message;
    }
  }
  
  // 关闭连接
  async close() {
    await this.publisher.quit();
    await this.subscriber.quit();
  }
}

// 使用示例
const pubsub = new RedisPubSub({ host: 'localhost', port: 6379 });

// 订阅用户事件
await pubsub.subscribe('user:events', (message, channel) => {
  console.log('用户事件:', message);
});

// 模式订阅所有通知
await pubsub.psubscribe('notifications:*', (message, channel, pattern) => {
  console.log('通知:', message, '频道:', channel);
});

// 发布消息
await pubsub.publish('user:events', {
  type: 'login',
  userId: 123,
  timestamp: Date.now()
});
```

### 2. 分布式锁
```javascript
// Redis分布式锁实现
class RedisDistributedLock {
  constructor(redis) {
    this.redis = redis;
    this.lockScript = `
      if redis.call('get', KEYS[1]) == ARGV[1] then
        return redis.call('del', KEYS[1])
      else
        return 0
      end
    `;
  }
  
  // 获取锁
  async acquireLock(lockKey, lockValue, expireTime = 10000) {
    const result = await this.redis.set(
      lockKey, 
      lockValue, 
      'PX', 
      expireTime, 
      'NX'
    );
    
    return result === 'OK';
  }
  
  // 释放锁
  async releaseLock(lockKey, lockValue) {
    const result = await this.redis.eval(
      this.lockScript,
      1,
      lockKey,
      lockValue
    );
    
    return result === 1;
  }
  
  // 带重试的获取锁
  async acquireLockWithRetry(lockKey, lockValue, expireTime = 10000, retryTimes = 3, retryDelay = 100) {
    for (let i = 0; i < retryTimes; i++) {
      const acquired = await this.acquireLock(lockKey, lockValue, expireTime);
      if (acquired) {
        return true;
      }
      
      if (i < retryTimes - 1) {
        await this.sleep(retryDelay * Math.pow(2, i)); // 指数退避
      }
    }
    
    return false;
  }
  
  // 自动续期锁
  async acquireLockWithAutoRenewal(lockKey, lockValue, expireTime = 10000, renewalInterval = 3000) {
    const acquired = await this.acquireLock(lockKey, lockValue, expireTime);
    if (!acquired) {
      return null;
    }
    
    // 启动自动续期
    const renewalTimer = setInterval(async () => {
      try {
        await this.redis.pexpire(lockKey, expireTime);
      } catch (error) {
        console.error('锁续期失败:', error);
        clearInterval(renewalTimer);
      }
    }, renewalInterval);
    
    return {
      release: async () => {
        clearInterval(renewalTimer);
        return await this.releaseLock(lockKey, lockValue);
      }
    };
  }
  
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 使用示例
const lockManager = new RedisDistributedLock(redis);

// 简单锁使用
async function processOrder(orderId) {
  const lockKey = `order_lock:${orderId}`;
  const lockValue = `${Date.now()}_${Math.random()}`;
  
  const acquired = await lockManager.acquireLock(lockKey, lockValue, 5000);
  if (!acquired) {
    throw new Error('无法获取订单锁');
  }
  
  try {
    // 处理订单逻辑
    console.log('处理订单:', orderId);
    await processOrderLogic(orderId);
  } finally {
    await lockManager.releaseLock(lockKey, lockValue);
  }
}

// 自动续期锁使用
async function longRunningTask(taskId) {
  const lockKey = `task_lock:${taskId}`;
  const lockValue = `${Date.now()}_${Math.random()}`;
  
  const lock = await lockManager.acquireLockWithAutoRenewal(lockKey, lockValue);
  if (!lock) {
    throw new Error('无法获取任务锁');
  }
  
  try {
    // 长时间运行的任务
    await longRunningTaskLogic(taskId);
  } finally {
    await lock.release();
  }
}
```

### 3. 限流器
```javascript
// Redis限流器实现
class RedisRateLimiter {
  constructor(redis) {
    this.redis = redis;
    
    // 滑动窗口限流脚本
    this.slidingWindowScript = `
      local key = KEYS[1]
      local window = tonumber(ARGV[1])
      local limit = tonumber(ARGV[2])
      local now = tonumber(ARGV[3])
      
      -- 清理过期的请求
      redis.call('zremrangebyscore', key, 0, now - window * 1000)
      
      -- 获取当前窗口内的请求数
      local current = redis.call('zcard', key)
      
      if current < limit then
        -- 添加当前请求
        redis.call('zadd', key, now, now)
        redis.call('expire', key, window + 1)
        return {1, limit - current - 1}
      else
        return {0, 0}
      end
    `;
    
    // 令牌桶限流脚本
    this.tokenBucketScript = `
      local key = KEYS[1]
      local capacity = tonumber(ARGV[1])
      local tokens = tonumber(ARGV[2])
      local interval = tonumber(ARGV[3])
      local now = tonumber(ARGV[4])
      
      local bucket = redis.call('hmget', key, 'tokens', 'last_refill')
      local current_tokens = tonumber(bucket[1]) or capacity
      local last_refill = tonumber(bucket[2]) or now
      
      -- 计算需要添加的令牌数
      local elapsed = now - last_refill
      local tokens_to_add = math.floor(elapsed / interval * tokens)
      current_tokens = math.min(capacity, current_tokens + tokens_to_add)
      
      if current_tokens >= 1 then
        current_tokens = current_tokens - 1
        redis.call('hmset', key, 'tokens', current_tokens, 'last_refill', now)
        redis.call('expire', key, 3600)
        return {1, current_tokens}
      else
        redis.call('hmset', key, 'tokens', current_tokens, 'last_refill', now)
        redis.call('expire', key, 3600)
        return {0, 0}
      end
    `;
  }
  
  // 固定窗口限流
  async fixedWindowLimit(key, limit, windowSeconds) {
    const windowKey = `${key}:${Math.floor(Date.now() / (windowSeconds * 1000))}`;
    
    const current = await this.redis.incr(windowKey);
    await this.redis.expire(windowKey, windowSeconds);
    
    return {
      allowed: current <= limit,
      remaining: Math.max(0, limit - current),
      resetTime: (Math.floor(Date.now() / (windowSeconds * 1000)) + 1) * windowSeconds * 1000
    };
  }
  
  // 滑动窗口限流
  async slidingWindowLimit(key, limit, windowSeconds) {
    const result = await this.redis.eval(
      this.slidingWindowScript,
      1,
      key,
      windowSeconds,
      limit,
      Date.now()
    );
    
    return {
      allowed: result[0] === 1,
      remaining: result[1]
    };
  }
  
  // 令牌桶限流
  async tokenBucketLimit(key, capacity, refillRate, refillInterval = 1000) {
    const result = await this.redis.eval(
      this.tokenBucketScript,
      1,
      key,
      capacity,
      refillRate,
      refillInterval,
      Date.now()
    );
    
    return {
      allowed: result[0] === 1,
      tokens: result[1]
    };
  }
  
  // 漏桶限流
  async leakyBucketLimit(key, capacity, leakRate, leakInterval = 1000) {
    const now = Date.now();
    const bucket = await this.redis.hmget(key, 'volume', 'last_leak');
    
    let currentVolume = parseInt(bucket[0]) || 0;
    const lastLeak = parseInt(bucket[1]) || now;
    
    // 计算泄漏的水量
    const elapsed = now - lastLeak;
    const leakAmount = Math.floor(elapsed / leakInterval * leakRate);
    currentVolume = Math.max(0, currentVolume - leakAmount);
    
    if (currentVolume < capacity) {
      currentVolume += 1;
      await this.redis.hmset(key, 'volume', currentVolume, 'last_leak', now);
      await this.redis.expire(key, 3600);
      
      return {
        allowed: true,
        volume: currentVolume
      };
    } else {
      await this.redis.hmset(key, 'volume', currentVolume, 'last_leak', now);
      await this.redis.expire(key, 3600);
      
      return {
        allowed: false,
        volume: currentVolume
      };
    }
  }
}

// 使用示例
const rateLimiter = new RedisRateLimiter(redis);

// API限流中间件
function createRateLimitMiddleware(limiterType, ...args) {
  return async (req, res, next) => {
    const key = `rate_limit:${req.ip}:${req.route.path}`;
    
    let result;
    switch (limiterType) {
      case 'fixed':
        result = await rateLimiter.fixedWindowLimit(key, ...args);
        break;
      case 'sliding':
        result = await rateLimiter.slidingWindowLimit(key, ...args);
        break;
      case 'token':
        result = await rateLimiter.tokenBucketLimit(key, ...args);
        break;
      case 'leaky':
        result = await rateLimiter.leakyBucketLimit(key, ...args);
        break;
      default:
        return next();
    }
    
    if (!result.allowed) {
      return res.status(429).json({
        error: '请求过于频繁',
        retryAfter: result.resetTime ? Math.ceil((result.resetTime - Date.now()) / 1000) : 60
      });
    }
    
    // 设置响应头
    if (result.remaining !== undefined) {
      res.set('X-RateLimit-Remaining', result.remaining);
    }
    if (result.resetTime) {
      res.set('X-RateLimit-Reset', Math.ceil(result.resetTime / 1000));
    }
    
    next();
  };
}

// 应用限流
app.use('/api', createRateLimitMiddleware('sliding', 100, 60)); // 每分钟100次请求
```

## 性能优化

### 1. 连接池管理
```javascript
// Redis连接池管理
class RedisConnectionPool {
  constructor(config) {
    this.config = config;
    this.pools = {
      read: this.createPool({ ...config, lazyConnect: true }),
      write: this.createPool({ ...config, lazyConnect: true })
    };
    
    this.setupHealthCheck();
  }
  
  createPool(config) {
    return new Redis({
      ...config,
      maxRetriesPerRequest: 3,
      retryDelayOnFailover: 100,
      enableReadyCheck: false,
      maxLoadingTimeout: 1000,
      commandTimeout: 5000
    });
  }
  
  // 读操作
  async read(command, ...args) {
    try {
      return await this.pools.read[command](...args);
    } catch (error) {
      console.error('Redis读操作失败:', error);
      throw error;
    }
  }
  
  // 写操作
  async write(command, ...args) {
    try {
      return await this.pools.write[command](...args);
    } catch (error) {
      console.error('Redis写操作失败:', error);
      throw error;
    }
  }
  
  // 事务操作
  async transaction(commands) {
    const pipeline = this.pools.write.pipeline();
    
    commands.forEach(([command, ...args]) => {
      pipeline[command](...args);
    });
    
    const results = await pipeline.exec();
    return results.map(([error, result]) => {
      if (error) throw error;
      return result;
    });
  }
  
  // 健康检查
  setupHealthCheck() {
    setInterval(async () => {
      try {
        await Promise.all([
          this.pools.read.ping(),
          this.pools.write.ping()
        ]);
      } catch (error) {
        console.error('Redis健康检查失败:', error);
      }
    }, 30000); // 30秒检查一次
  }
  
  // 关闭连接池
  async close() {
    await Promise.all([
      this.pools.read.quit(),
      this.pools.write.quit()
    ]);
  }
}
```

### 2. 批量操作优化
```javascript
// Redis批量操作优化
class RedisBatchProcessor {
  constructor(redis, options = {}) {
    this.redis = redis;
    this.batchSize = options.batchSize || 100;
    this.flushInterval = options.flushInterval || 1000;
    
    this.writeQueue = [];
    this.readQueue = [];
    
    this.startBatchProcessing();
  }
  
  // 批量写入
  async batchWrite(key, value, operation = 'set') {
    return new Promise((resolve, reject) => {
      this.writeQueue.push({
        key,
        value,
        operation,
        resolve,
        reject
      });
      
      if (this.writeQueue.length >= this.batchSize) {
        this.flushWriteQueue();
      }
    });
  }
  
  // 批量读取
  async batchRead(keys) {
    if (keys.length === 0) return [];
    
    // 使用MGET批量获取
    const values = await this.redis.mget(...keys);
    return values;
  }
  
  // 启动批量处理
  startBatchProcessing() {
    setInterval(() => {
      this.flushWriteQueue();
    }, this.flushInterval);
  }
  
  // 刷新写队列
  async flushWriteQueue() {
    if (this.writeQueue.length === 0) return;
    
    const batch = this.writeQueue.splice(0);
    const pipeline = this.redis.pipeline();
    
    batch.forEach(item => {
      switch (item.operation) {
        case 'set':
          pipeline.set(item.key, item.value);
          break;
        case 'hset':
          pipeline.hset(item.key, item.value);
          break;
        case 'lpush':
          pipeline.lpush(item.key, item.value);
          break;
        case 'sadd':
          pipeline.sadd(item.key, item.value);
          break;
        case 'zadd':
          pipeline.zadd(item.key, item.value.score, item.value.member);
          break;
      }
    });
    
    try {
      const results = await pipeline.exec();
      
      batch.forEach((item, index) => {
        const [error, result] = results[index];
        if (error) {
          item.reject(error);
        } else {
          item.resolve(result);
        }
      });
    } catch (error) {
      batch.forEach(item => item.reject(error));
    }
  }
  
  // 批量删除
  async batchDelete(keys, batchSize = 1000) {
    if (keys.length === 0) return 0;
    
    let deletedCount = 0;
    
    for (let i = 0; i < keys.length; i += batchSize) {
      const batch = keys.slice(i, i + batchSize);
      const count = await this.redis.del(...batch);
      deletedCount += count;
    }
    
    return deletedCount;
  }
}
```

## 监控和诊断

### 1. Redis监控
```javascript
// Redis性能监控
class RedisMonitor {
  constructor(redis) {
    this.redis = redis;
    this.metrics = {
      commands: new Map(),
      slowQueries: [],
      memoryUsage: [],
      connections: []
    };
  }
  
  // 开始监控
  startMonitoring() {
    setInterval(async () => {
      await this.collectMetrics();
    }, 60000); // 每分钟收集一次
  }
  
  // 收集指标
  async collectMetrics() {
    try {
      const info = await this.redis.info();
      const stats = this.parseInfo(info);
      
      // 记录内存使用
      this.metrics.memoryUsage.push({
        timestamp: Date.now(),
        used: stats.used_memory,
        peak: stats.used_memory_peak,
        fragmentation: stats.mem_fragmentation_ratio
      });
      
      // 记录连接数
      this.metrics.connections.push({
        timestamp: Date.now(),
        connected: stats.connected_clients,
        blocked: stats.blocked_clients
      });
      
      // 获取慢查询
      const slowLog = await this.redis.slowlog('get', 10);
      this.metrics.slowQueries.push(...slowLog.map(entry => ({
        timestamp: entry[1] * 1000,
        duration: entry[2],
        command: entry[3].join(' ')
      })));
      
      // 保持最近100条记录
      this.keepRecentRecords();
      
    } catch (error) {
      console.error('Redis监控数据收集失败:', error);
    }
  }
  
  parseInfo(infoString) {
    const stats = {};
    const lines = infoString.split('\r\n');
    
    lines.forEach(line => {
      if (line.includes(':')) {
        const [key, value] = line.split(':');
        stats[key] = isNaN(value) ? value : Number(value);
      }
    });
    
    return stats;
  }
  
  keepRecentRecords() {
    if (this.metrics.memoryUsage.length > 100) {
      this.metrics.memoryUsage = this.metrics.memoryUsage.slice(-100);
    }
    if (this.metrics.connections.length > 100) {
      this.metrics.connections = this.metrics.connections.slice(-100);
    }
    if (this.metrics.slowQueries.length > 100) {
      this.metrics.slowQueries = this.metrics.slowQueries.slice(-100);
    }
  }
  
  // 生成监控报告
  generateReport() {
    const latestMemory = this.metrics.memoryUsage[this.metrics.memoryUsage.length - 1];
    const latestConnection = this.metrics.connections[this.metrics.connections.length - 1];
    
    return {
      timestamp: new Date(),
      memory: {
        current: latestMemory?.used || 0,
        peak: latestMemory?.peak || 0,
        fragmentation: latestMemory?.fragmentation || 0
      },
      connections: {
        connected: latestConnection?.connected || 0,
        blocked: latestConnection?.blocked || 0
      },
      slowQueries: this.metrics.slowQueries.slice(-10),
      recommendations: this.generateRecommendations()
    };
  }
  
  generateRecommendations() {
    const recommendations = [];
    const latestMemory = this.metrics.memoryUsage[this.metrics.memoryUsage.length - 1];
    
    if (latestMemory?.fragmentation > 1.5) {
      recommendations.push('内存碎片率过高，考虑重启Redis或使用MEMORY PURGE命令');
    }
    
    if (this.metrics.slowQueries.length > 5) {
      recommendations.push('存在较多慢查询，检查命令复杂度和数据结构设计');
    }
    
    return recommendations;
  }
}
```

## 总结

Redis在Node.js应用中的使用要点：

1. **连接管理**：合理配置连接池和重连策略
2. **数据结构**：选择合适的Redis数据类型
3. **高级功能**：发布订阅、分布式锁、限流器
4. **性能优化**：批量操作、管道、连接复用
5. **监控诊断**：实时监控性能指标和慢查询
6. **最佳实践**：遵循Redis使用的最佳实践

通过合理使用Redis，可以显著提升Node.js应用的性能和可扩展性。
