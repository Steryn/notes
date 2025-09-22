# 缓存模式

## 概述

缓存模式是指在应用程序中使用缓存的各种策略和设计模式。不同的缓存模式适用于不同的场景，选择合适的缓存模式可以最大化缓存效果，提升系统性能。

## 基础缓存模式

### 1. Cache-Aside 模式
```javascript
// Cache-Aside（旁路缓存）模式实现
class CacheAsidePattern {
  constructor(cache, database) {
    this.cache = cache;
    this.database = database;
  }
  
  // 读取数据
  async get(key) {
    // 1. 先从缓存读取
    let data = await this.cache.get(key);
    
    if (data !== null) {
      console.log('缓存命中:', key);
      return data;
    }
    
    // 2. 缓存未命中，从数据库读取
    console.log('缓存未命中，从数据库读取:', key);
    data = await this.database.get(key);
    
    if (data !== null) {
      // 3. 将数据写入缓存
      await this.cache.set(key, data, 3600); // 1小时过期
    }
    
    return data;
  }
  
  // 更新数据
  async set(key, data) {
    // 1. 更新数据库
    await this.database.set(key, data);
    
    // 2. 删除缓存（让下次读取时重新加载）
    await this.cache.delete(key);
    
    return data;
  }
  
  // 删除数据
  async delete(key) {
    // 1. 删除数据库记录
    await this.database.delete(key);
    
    // 2. 删除缓存
    await this.cache.delete(key);
  }
}
```

### 2. Read-Through 模式
```javascript
// Read-Through（读穿透）模式实现
class ReadThroughCache {
  constructor(cache, dataLoader) {
    this.cache = cache;
    this.dataLoader = dataLoader;
    this.loadingPromises = new Map(); // 防止缓存击穿
  }
  
  async get(key, options = {}) {
    // 先尝试从缓存获取
    let data = await this.cache.get(key);
    
    if (data !== null) {
      return data;
    }
    
    // 检查是否已有加载请求在进行中
    if (this.loadingPromises.has(key)) {
      return await this.loadingPromises.get(key);
    }
    
    // 创建加载Promise
    const loadPromise = this.loadData(key, options);
    this.loadingPromises.set(key, loadPromise);
    
    try {
      data = await loadPromise;
      return data;
    } finally {
      this.loadingPromises.delete(key);
    }
  }
  
  async loadData(key, options) {
    try {
      const data = await this.dataLoader(key);
      
      if (data !== null) {
        const ttl = options.ttl || 3600;
        await this.cache.set(key, data, ttl);
      }
      
      return data;
    } catch (error) {
      console.error('数据加载失败:', error);
      throw error;
    }
  }
  
  // 预加载数据
  async preload(keys, options = {}) {
    const loadPromises = keys.map(key => this.get(key, options));
    return await Promise.allSettled(loadPromises);
  }
}

// 使用示例
const readThroughCache = new ReadThroughCache(cache, async (key) => {
  // 数据加载逻辑
  return await database.get(key);
});

// 获取数据（自动处理缓存）
const user = await readThroughCache.get('user:123');
```

### 3. Write-Through 模式
```javascript
// Write-Through（写穿透）模式实现
class WriteThroughCache {
  constructor(cache, database) {
    this.cache = cache;
    this.database = database;
  }
  
  async set(key, data, options = {}) {
    try {
      // 同时写入缓存和数据库
      const writePromises = [
        this.database.set(key, data),
        this.cache.set(key, data, options.ttl || 3600)
      ];
      
      await Promise.all(writePromises);
      
      console.log('数据已同步写入缓存和数据库:', key);
      return data;
    } catch (error) {
      console.error('写入失败:', error);
      
      // 写入失败时，清理可能的不一致状态
      try {
        await this.cache.delete(key);
      } catch (cleanupError) {
        console.error('清理缓存失败:', cleanupError);
      }
      
      throw error;
    }
  }
  
  async get(key) {
    // 先从缓存读取
    let data = await this.cache.get(key);
    
    if (data !== null) {
      return data;
    }
    
    // 缓存未命中，从数据库读取
    data = await this.database.get(key);
    
    if (data !== null) {
      // 回填缓存
      await this.cache.set(key, data, 3600);
    }
    
    return data;
  }
  
  async delete(key) {
    try {
      await Promise.all([
        this.database.delete(key),
        this.cache.delete(key)
      ]);
    } catch (error) {
      console.error('删除失败:', error);
      throw error;
    }
  }
}
```

### 4. Write-Behind 模式
```javascript
// Write-Behind（写回）模式实现
class WriteBehindCache {
  constructor(cache, database, options = {}) {
    this.cache = cache;
    this.database = database;
    
    this.options = {
      batchSize: options.batchSize || 100,
      flushInterval: options.flushInterval || 5000,
      maxRetries: options.maxRetries || 3,
      retryDelay: options.retryDelay || 1000
    };
    
    this.writeQueue = [];
    this.dirtyKeys = new Set();
    this.isWriting = false;
    
    this.startPeriodicFlush();
  }
  
  async set(key, data, options = {}) {
    // 立即写入缓存
    await this.cache.set(key, data, options.ttl || 3600);
    
    // 加入写队列
    this.addToWriteQueue(key, data, 'set');
    
    return data;
  }
  
  async delete(key) {
    // 立即从缓存删除
    await this.cache.delete(key);
    
    // 加入写队列
    this.addToWriteQueue(key, null, 'delete');
  }
  
  addToWriteQueue(key, data, operation) {
    // 避免重复的写操作
    if (this.dirtyKeys.has(key)) {
      // 更新现有的写操作
      const existingIndex = this.writeQueue.findIndex(item => item.key === key);
      if (existingIndex !== -1) {
        this.writeQueue[existingIndex] = {
          key,
          data,
          operation,
          timestamp: Date.now(),
          retries: 0
        };
      }
    } else {
      this.writeQueue.push({
        key,
        data,
        operation,
        timestamp: Date.now(),
        retries: 0
      });
      this.dirtyKeys.add(key);
    }
    
    // 如果队列满了，立即刷新
    if (this.writeQueue.length >= this.options.batchSize) {
      this.flushToDisk();
    }
  }
  
  startPeriodicFlush() {
    setInterval(() => {
      if (this.writeQueue.length > 0) {
        this.flushToDisk();
      }
    }, this.options.flushInterval);
  }
  
  async flushToDisk() {
    if (this.isWriting || this.writeQueue.length === 0) {
      return;
    }
    
    this.isWriting = true;
    
    try {
      const batch = this.writeQueue.splice(0, this.options.batchSize);
      console.log(`刷新${batch.length}条记录到数据库`);
      
      await this.processBatch(batch);
      
      // 清理已处理的键
      batch.forEach(item => this.dirtyKeys.delete(item.key));
      
    } catch (error) {
      console.error('批量写入失败:', error);
    } finally {
      this.isWriting = false;
    }
  }
  
  async processBatch(batch) {
    const failedItems = [];
    
    for (const item of batch) {
      try {
        if (item.operation === 'set') {
          await this.database.set(item.key, item.data);
        } else if (item.operation === 'delete') {
          await this.database.delete(item.key);
        }
      } catch (error) {
        console.error(`写入失败 ${item.key}:`, error);
        
        item.retries++;
        if (item.retries < this.options.maxRetries) {
          failedItems.push(item);
        } else {
          console.error(`写入重试次数超限，丢弃数据: ${item.key}`);
        }
      }
    }
    
    // 重新加入失败的项目
    if (failedItems.length > 0) {
      setTimeout(() => {
        this.writeQueue.unshift(...failedItems);
      }, this.options.retryDelay);
    }
  }
  
  async get(key) {
    return await this.cache.get(key);
  }
  
  // 强制刷新所有待写入数据
  async forceFlush() {
    while (this.writeQueue.length > 0) {
      await this.flushToDisk();
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  // 优雅关闭
  async shutdown() {
    console.log('开始优雅关闭Write-Behind缓存...');
    await this.forceFlush();
    console.log('Write-Behind缓存已关闭');
  }
}
```

## 高级缓存模式

### 1. 多级缓存模式
```javascript
// 多级缓存模式实现
class MultiLevelCache {
  constructor(levels) {
    this.levels = levels; // 按优先级排序的缓存层级
  }
  
  async get(key) {
    // 从最快的缓存层级开始查找
    for (let i = 0; i < this.levels.length; i++) {
      const level = this.levels[i];
      const data = await level.cache.get(key);
      
      if (data !== null) {
        console.log(`缓存命中 L${i + 1}:`, key);
        
        // 回填到更快的缓存层级
        await this.backfillUpperLevels(key, data, i);
        
        return data;
      }
    }
    
    // 所有缓存层级都未命中
    console.log('缓存完全未命中:', key);
    return null;
  }
  
  async set(key, data, ttl) {
    // 写入所有缓存层级
    const writePromises = this.levels.map(level => 
      level.cache.set(key, data, ttl || level.defaultTTL)
    );
    
    await Promise.allSettled(writePromises);
  }
  
  async delete(key) {
    // 从所有缓存层级删除
    const deletePromises = this.levels.map(level => 
      level.cache.delete(key)
    );
    
    await Promise.allSettled(deletePromises);
  }
  
  // 回填上级缓存
  async backfillUpperLevels(key, data, currentLevel) {
    const backfillPromises = [];
    
    for (let i = 0; i < currentLevel; i++) {
      const level = this.levels[i];
      backfillPromises.push(
        level.cache.set(key, data, level.defaultTTL)
      );
    }
    
    if (backfillPromises.length > 0) {
      await Promise.allSettled(backfillPromises);
    }
  }
  
  // 获取缓存统计
  async getStats() {
    const stats = {};
    
    for (let i = 0; i < this.levels.length; i++) {
      const level = this.levels[i];
      if (level.cache.getStats) {
        stats[`L${i + 1}`] = await level.cache.getStats();
      }
    }
    
    return stats;
  }
}

// 使用示例
const multiCache = new MultiLevelCache([
  {
    name: 'L1-Memory',
    cache: new MemoryCache({ maxSize: 1000 }),
    defaultTTL: 300000 // 5分钟
  },
  {
    name: 'L2-Redis',
    cache: new RedisCache({ host: 'localhost' }),
    defaultTTL: 1800000 // 30分钟
  },
  {
    name: 'L3-Database',
    cache: new DatabaseCache(database),
    defaultTTL: 3600000 // 1小时
  }
]);
```

### 2. 缓存分片模式
```javascript
// 缓存分片模式实现
class ShardedCache {
  constructor(shards, hashFunction) {
    this.shards = shards;
    this.hashFunction = hashFunction || this.defaultHash;
    this.shardCount = shards.length;
  }
  
  // 获取分片索引
  getShardIndex(key) {
    const hash = this.hashFunction(key);
    return hash % this.shardCount;
  }
  
  // 获取对应的分片
  getShard(key) {
    const index = this.getShardIndex(key);
    return this.shards[index];
  }
  
  async get(key) {
    const shard = this.getShard(key);
    return await shard.get(key);
  }
  
  async set(key, data, ttl) {
    const shard = this.getShard(key);
    return await shard.set(key, data, ttl);
  }
  
  async delete(key) {
    const shard = this.getShard(key);
    return await shard.delete(key);
  }
  
  // 批量操作
  async mget(keys) {
    // 按分片分组键
    const shardGroups = new Map();
    
    keys.forEach(key => {
      const shardIndex = this.getShardIndex(key);
      if (!shardGroups.has(shardIndex)) {
        shardGroups.set(shardIndex, []);
      }
      shardGroups.get(shardIndex).push(key);
    });
    
    // 并行从各分片获取数据
    const promises = [];
    const keyIndexMap = new Map();
    
    keys.forEach((key, index) => {
      keyIndexMap.set(key, index);
    });
    
    for (const [shardIndex, shardKeys] of shardGroups) {
      const shard = this.shards[shardIndex];
      promises.push(
        shard.mget ? shard.mget(shardKeys) : Promise.all(shardKeys.map(k => shard.get(k)))
      );
    }
    
    const results = await Promise.all(promises);
    
    // 重新组装结果
    const finalResults = new Array(keys.length);
    let resultIndex = 0;
    
    for (const [shardIndex, shardKeys] of shardGroups) {
      const shardResults = results[Array.from(shardGroups.keys()).indexOf(shardIndex)];
      
      shardKeys.forEach((key, i) => {
        const originalIndex = keyIndexMap.get(key);
        finalResults[originalIndex] = shardResults[i];
      });
    }
    
    return finalResults;
  }
  
  // 默认哈希函数
  defaultHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }
    return Math.abs(hash);
  }
  
  // 获取所有分片的统计信息
  async getAllStats() {
    const statsPromises = this.shards.map((shard, index) => 
      shard.getStats ? shard.getStats().then(stats => ({ shard: index, stats })) : null
    );
    
    const results = await Promise.allSettled(statsPromises);
    return results
      .filter(result => result.status === 'fulfilled' && result.value)
      .map(result => result.value);
  }
}
```

### 3. 缓存预热模式
```javascript
// 缓存预热模式实现
class CacheWarmupManager {
  constructor(cache, dataSource) {
    this.cache = cache;
    this.dataSource = dataSource;
    this.warmupStrategies = new Map();
  }
  
  // 注册预热策略
  registerStrategy(name, strategy) {
    this.warmupStrategies.set(name, strategy);
  }
  
  // 执行预热
  async warmup(strategyNames = null) {
    const strategies = strategyNames ? 
      strategyNames.map(name => this.warmupStrategies.get(name)).filter(Boolean) :
      Array.from(this.warmupStrategies.values());
    
    console.log(`开始执行${strategies.length}个预热策略`);
    
    for (const strategy of strategies) {
      try {
        await this.executeStrategy(strategy);
      } catch (error) {
        console.error(`预热策略执行失败: ${strategy.name}`, error);
      }
    }
    
    console.log('缓存预热完成');
  }
  
  async executeStrategy(strategy) {
    console.log(`执行预热策略: ${strategy.name}`);
    const startTime = Date.now();
    
    switch (strategy.type) {
      case 'popular':
        await this.warmupPopularData(strategy);
        break;
      case 'recent':
        await this.warmupRecentData(strategy);
        break;
      case 'scheduled':
        await this.warmupScheduledData(strategy);
        break;
      case 'predictive':
        await this.warmupPredictiveData(strategy);
        break;
      default:
        console.warn(`未知的预热策略类型: ${strategy.type}`);
    }
    
    const duration = Date.now() - startTime;
    console.log(`策略 ${strategy.name} 执行完成，耗时 ${duration}ms`);
  }
  
  // 预热热门数据
  async warmupPopularData(strategy) {
    const popularKeys = await this.dataSource.getPopularKeys(strategy.limit);
    const batchSize = strategy.batchSize || 50;
    
    for (let i = 0; i < popularKeys.length; i += batchSize) {
      const batch = popularKeys.slice(i, i + batchSize);
      const promises = batch.map(async key => {
        try {
          const data = await this.dataSource.get(key);
          if (data) {
            await this.cache.set(key, data, strategy.ttl);
          }
        } catch (error) {
          console.error(`预热数据失败: ${key}`, error);
        }
      });
      
      await Promise.allSettled(promises);
    }
    
    console.log(`预热了${popularKeys.length}条热门数据`);
  }
  
  // 预热最近数据
  async warmupRecentData(strategy) {
    const recentKeys = await this.dataSource.getRecentKeys(strategy.timeRange);
    
    for (const key of recentKeys) {
      try {
        const data = await this.dataSource.get(key);
        if (data) {
          await this.cache.set(key, data, strategy.ttl);
        }
      } catch (error) {
        console.error(`预热最近数据失败: ${key}`, error);
      }
    }
    
    console.log(`预热了${recentKeys.length}条最近数据`);
  }
  
  // 预热计划数据
  async warmupScheduledData(strategy) {
    const scheduledData = await this.dataSource.getScheduledData(strategy.schedule);
    
    for (const item of scheduledData) {
      try {
        await this.cache.set(item.key, item.data, strategy.ttl);
      } catch (error) {
        console.error(`预热计划数据失败: ${item.key}`, error);
      }
    }
    
    console.log(`预热了${scheduledData.length}条计划数据`);
  }
  
  // 预测性预热
  async warmupPredictiveData(strategy) {
    const predictedKeys = await this.predictFutureAccess(strategy.model);
    
    for (const prediction of predictedKeys) {
      try {
        const data = await this.dataSource.get(prediction.key);
        if (data) {
          // 根据预测概率调整TTL
          const adjustedTTL = strategy.ttl * prediction.probability;
          await this.cache.set(prediction.key, data, adjustedTTL);
        }
      } catch (error) {
        console.error(`预热预测数据失败: ${prediction.key}`, error);
      }
    }
    
    console.log(`预热了${predictedKeys.length}条预测数据`);
  }
  
  // 预测未来访问（简化实现）
  async predictFutureAccess(model) {
    // 这里应该实现机器学习模型预测
    // 简化为基于历史访问模式的预测
    const accessHistory = await this.dataSource.getAccessHistory();
    
    return accessHistory
      .filter(item => item.accessCount > 10)
      .map(item => ({
        key: item.key,
        probability: Math.min(item.accessCount / 100, 1)
      }))
      .sort((a, b) => b.probability - a.probability)
      .slice(0, model.maxPredictions || 100);
  }
}

// 预热策略配置示例
const warmupManager = new CacheWarmupManager(cache, dataSource);

// 注册预热策略
warmupManager.registerStrategy('popular_products', {
  name: '热门商品预热',
  type: 'popular',
  limit: 100,
  ttl: 3600000,
  batchSize: 20
});

warmupManager.registerStrategy('recent_articles', {
  name: '最新文章预热',
  type: 'recent',
  timeRange: 24 * 60 * 60 * 1000, // 24小时
  ttl: 1800000
});

warmupManager.registerStrategy('predicted_access', {
  name: '预测访问预热',
  type: 'predictive',
  model: { maxPredictions: 50 },
  ttl: 7200000
});

// 执行预热
await warmupManager.warmup(['popular_products', 'recent_articles']);
```

## 缓存一致性模式

### 1. 最终一致性模式
```javascript
// 最终一致性缓存模式
class EventualConsistencyCache {
  constructor(cache, database, eventBus) {
    this.cache = cache;
    this.database = database;
    this.eventBus = eventBus;
    
    this.setupEventHandlers();
  }
  
  setupEventHandlers() {
    // 监听数据变更事件
    this.eventBus.on('data.updated', async (event) => {
      await this.handleDataUpdate(event);
    });
    
    this.eventBus.on('data.deleted', async (event) => {
      await this.handleDataDeletion(event);
    });
  }
  
  async get(key) {
    // 先从缓存获取
    let data = await this.cache.get(key);
    
    if (data === null) {
      // 从数据库加载
      data = await this.database.get(key);
      if (data) {
        await this.cache.set(key, data, 3600);
      }
    }
    
    return data;
  }
  
  async set(key, data) {
    // 更新数据库
    await this.database.set(key, data);
    
    // 发布更新事件
    this.eventBus.emit('data.updated', { key, data });
    
    return data;
  }
  
  async handleDataUpdate(event) {
    try {
      // 延迟一小段时间后更新缓存，确保数据库写入完成
      setTimeout(async () => {
        await this.cache.set(event.key, event.data, 3600);
        console.log(`缓存已更新: ${event.key}`);
      }, 100);
    } catch (error) {
      console.error('缓存更新失败:', error);
    }
  }
  
  async handleDataDeletion(event) {
    try {
      await this.cache.delete(event.key);
      console.log(`缓存已删除: ${event.key}`);
    } catch (error) {
      console.error('缓存删除失败:', error);
    }
  }
}
```

### 2. 版本控制模式
```javascript
// 版本控制缓存模式
class VersionedCache {
  constructor(cache, database) {
    this.cache = cache;
    this.database = database;
  }
  
  async get(key) {
    // 获取缓存数据和版本
    const cached = await this.cache.get(`${key}:data`);
    const cachedVersion = await this.cache.get(`${key}:version`);
    
    if (cached && cachedVersion) {
      // 检查版本是否最新
      const currentVersion = await this.database.getVersion(key);
      
      if (cachedVersion === currentVersion) {
        return cached;
      }
    }
    
    // 版本不匹配或缓存不存在，重新加载
    const data = await this.database.get(key);
    const version = await this.database.getVersion(key);
    
    if (data) {
      await Promise.all([
        this.cache.set(`${key}:data`, data, 3600),
        this.cache.set(`${key}:version`, version, 3600)
      ]);
    }
    
    return data;
  }
  
  async set(key, data) {
    // 生成新版本号
    const newVersion = Date.now().toString();
    
    // 更新数据库
    await this.database.setWithVersion(key, data, newVersion);
    
    // 更新缓存
    await Promise.all([
      this.cache.set(`${key}:data`, data, 3600),
      this.cache.set(`${key}:version`, newVersion, 3600)
    ]);
    
    return data;
  }
}
```

## 总结

缓存模式的选择要点：

1. **Cache-Aside**：应用程序完全控制缓存逻辑，适用于读多写少的场景
2. **Read/Write-Through**：缓存系统自动处理数据加载，简化应用逻辑
3. **Write-Behind**：提高写入性能，但可能存在数据丢失风险
4. **多级缓存**：平衡性能和成本，适用于大规模系统
5. **分片缓存**：提高缓存容量和并发能力
6. **预热机制**：减少冷启动时的缓存未命中
7. **一致性控制**：在性能和一致性之间找到平衡

选择合适的缓存模式需要考虑数据特性、访问模式、一致性要求和系统架构。
