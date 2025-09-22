# 缓存基础

## 概述

缓存是提升数据库应用性能的关键技术，通过将频繁访问的数据存储在更快的存储介质中，减少对数据库的直接访问，从而提高响应速度和系统吞吐量。

## 缓存策略

### 1. 缓存读取模式
```javascript
// Cache-Aside 模式
class CacheAsidePattern {
  constructor(cache, database) {
    this.cache = cache;
    this.database = database;
  }
  
  async get(key) {
    // 先从缓存读取
    let data = await this.cache.get(key);
    
    if (data === null) {
      // 缓存未命中，从数据库读取
      data = await this.database.get(key);
      
      if (data !== null) {
        // 写入缓存
        await this.cache.set(key, data, 3600); // 1小时过期
      }
    }
    
    return data;
  }
  
  async set(key, data) {
    // 更新数据库
    await this.database.set(key, data);
    
    // 删除缓存，让下次读取时重新加载
    await this.cache.delete(key);
  }
}

// Read-Through 模式
class ReadThroughPattern {
  constructor(cache, database) {
    this.cache = cache;
    this.database = database;
  }
  
  async get(key) {
    return await this.cache.getWithLoader(key, async (key) => {
      return await this.database.get(key);
    });
  }
}

// Write-Through 模式
class WriteThroughPattern {
  constructor(cache, database) {
    this.cache = cache;
    this.database = database;
  }
  
  async set(key, data) {
    // 同时写入缓存和数据库
    await Promise.all([
      this.cache.set(key, data),
      this.database.set(key, data)
    ]);
  }
}

// Write-Behind 模式
class WriteBehindPattern {
  constructor(cache, database) {
    this.cache = cache;
    this.database = database;
    this.writeQueue = [];
    this.flushInterval = 5000; // 5秒
    
    this.startBatchWrite();
  }
  
  async set(key, data) {
    // 立即写入缓存
    await this.cache.set(key, data);
    
    // 加入写队列
    this.writeQueue.push({ key, data, timestamp: Date.now() });
  }
  
  startBatchWrite() {
    setInterval(async () => {
      if (this.writeQueue.length > 0) {
        const batch = this.writeQueue.splice(0);
        await this.flushToDatabase(batch);
      }
    }, this.flushInterval);
  }
  
  async flushToDatabase(batch) {
    try {
      for (const item of batch) {
        await this.database.set(item.key, item.data);
      }
      console.log(`批量写入 ${batch.length} 条数据到数据库`);
    } catch (error) {
      console.error('批量写入失败:', error);
      // 重新加入队列重试
      this.writeQueue.unshift(...batch);
    }
  }
}
```

### 2. 缓存失效策略
```javascript
// 缓存失效管理器
class CacheInvalidationManager {
  constructor(cache) {
    this.cache = cache;
    this.taggedKeys = new Map(); // 标签到键的映射
    this.keyTags = new Map(); // 键到标签的映射
  }
  
  // 设置带标签的缓存
  async setWithTags(key, data, ttl, tags = []) {
    await this.cache.set(key, data, ttl);
    
    // 记录标签关系
    this.keyTags.set(key, tags);
    tags.forEach(tag => {
      if (!this.taggedKeys.has(tag)) {
        this.taggedKeys.set(tag, new Set());
      }
      this.taggedKeys.get(tag).add(key);
    });
  }
  
  // 按标签失效缓存
  async invalidateByTag(tag) {
    const keys = this.taggedKeys.get(tag);
    if (!keys) return 0;
    
    let invalidatedCount = 0;
    for (const key of keys) {
      await this.cache.delete(key);
      this.removeKeyFromTags(key);
      invalidatedCount++;
    }
    
    this.taggedKeys.delete(tag);
    return invalidatedCount;
  }
  
  // 按模式失效缓存
  async invalidateByPattern(pattern) {
    const keys = await this.cache.keys(pattern);
    let invalidatedCount = 0;
    
    for (const key of keys) {
      await this.cache.delete(key);
      this.removeKeyFromTags(key);
      invalidatedCount++;
    }
    
    return invalidatedCount;
  }
  
  // 时间基础失效
  async invalidateExpired() {
    const expiredKeys = await this.findExpiredKeys();
    let invalidatedCount = 0;
    
    for (const key of expiredKeys) {
      await this.cache.delete(key);
      this.removeKeyFromTags(key);
      invalidatedCount++;
    }
    
    return invalidatedCount;
  }
  
  removeKeyFromTags(key) {
    const tags = this.keyTags.get(key);
    if (tags) {
      tags.forEach(tag => {
        const taggedKeys = this.taggedKeys.get(tag);
        if (taggedKeys) {
          taggedKeys.delete(key);
          if (taggedKeys.size === 0) {
            this.taggedKeys.delete(tag);
          }
        }
      });
      this.keyTags.delete(key);
    }
  }
  
  async findExpiredKeys() {
    // 实际实现需要根据缓存系统的特性
    return [];
  }
}
```

## 缓存实现

### 1. 内存缓存
```javascript
// 内存缓存实现
class MemoryCache {
  constructor(options = {}) {
    this.cache = new Map();
    this.maxSize = options.maxSize || 1000;
    this.defaultTTL = options.defaultTTL || 3600000; // 1小时
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      evictions: 0
    };
    
    // 启动过期清理
    this.startExpirationCleanup();
  }
  
  async get(key) {
    const item = this.cache.get(key);
    
    if (!item) {
      this.stats.misses++;
      return null;
    }
    
    if (this.isExpired(item)) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }
    
    // 更新访问时间（用于LRU）
    item.lastAccessed = Date.now();
    this.stats.hits++;
    
    return item.value;
  }
  
  async set(key, value, ttl = this.defaultTTL) {
    // 检查缓存大小限制
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictLRU();
    }
    
    const item = {
      value: value,
      expiresAt: Date.now() + ttl,
      lastAccessed: Date.now(),
      createdAt: Date.now()
    };
    
    this.cache.set(key, item);
    this.stats.sets++;
  }
  
  async delete(key) {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.stats.deletes++;
    }
    return deleted;
  }
  
  async clear() {
    this.cache.clear();
  }
  
  async keys(pattern) {
    const keys = Array.from(this.cache.keys());
    if (!pattern) return keys;
    
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    return keys.filter(key => regex.test(key));
  }
  
  isExpired(item) {
    return Date.now() > item.expiresAt;
  }
  
  evictLRU() {
    let oldestKey = null;
    let oldestTime = Date.now();
    
    for (const [key, item] of this.cache) {
      if (item.lastAccessed < oldestTime) {
        oldestTime = item.lastAccessed;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.stats.evictions++;
    }
  }
  
  startExpirationCleanup() {
    setInterval(() => {
      for (const [key, item] of this.cache) {
        if (this.isExpired(item)) {
          this.cache.delete(key);
        }
      }
    }, 60000); // 每分钟清理一次
  }
  
  getStats() {
    const total = this.stats.hits + this.stats.misses;
    return {
      ...this.stats,
      hitRate: total > 0 ? (this.stats.hits / total) * 100 : 0,
      size: this.cache.size,
      maxSize: this.maxSize
    };
  }
}
```

### 2. 分布式缓存
```javascript
// 分布式缓存管理器
class DistributedCacheManager {
  constructor(nodes) {
    this.nodes = nodes;
    this.hashRing = this.createHashRing(nodes);
  }
  
  // 创建一致性哈希环
  createHashRing(nodes) {
    const ring = new Map();
    const virtualNodes = 150; // 每个物理节点对应150个虚拟节点
    
    nodes.forEach(node => {
      for (let i = 0; i < virtualNodes; i++) {
        const hash = this.hash(`${node.id}:${i}`);
        ring.set(hash, node);
      }
    });
    
    return new Map([...ring.entries()].sort((a, b) => a[0] - b[0]));
  }
  
  // 获取负责的节点
  getNode(key) {
    const keyHash = this.hash(key);
    
    for (const [hash, node] of this.hashRing) {
      if (keyHash <= hash) {
        return node;
      }
    }
    
    // 如果没找到，返回第一个节点
    return this.hashRing.values().next().value;
  }
  
  // 哈希函数
  hash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }
    return Math.abs(hash);
  }
  
  async get(key) {
    const node = this.getNode(key);
    try {
      return await node.cache.get(key);
    } catch (error) {
      console.error(`节点 ${node.id} 读取失败:`, error);
      return null;
    }
  }
  
  async set(key, value, ttl) {
    const node = this.getNode(key);
    try {
      await node.cache.set(key, value, ttl);
      
      // 可选：复制到备份节点
      const backupNode = this.getBackupNode(key);
      if (backupNode && backupNode !== node) {
        await backupNode.cache.set(key, value, ttl);
      }
    } catch (error) {
      console.error(`节点 ${node.id} 写入失败:`, error);
      throw error;
    }
  }
  
  async delete(key) {
    const node = this.getNode(key);
    try {
      await node.cache.delete(key);
      
      // 删除备份
      const backupNode = this.getBackupNode(key);
      if (backupNode && backupNode !== node) {
        await backupNode.cache.delete(key);
      }
    } catch (error) {
      console.error(`节点 ${node.id} 删除失败:`, error);
    }
  }
  
  getBackupNode(key) {
    const primaryNode = this.getNode(key);
    const nodes = Array.from(this.hashRing.values());
    const primaryIndex = nodes.indexOf(primaryNode);
    return nodes[(primaryIndex + 1) % nodes.length];
  }
}
```

## 缓存优化

### 1. 缓存预热
```javascript
// 缓存预热管理器
class CacheWarmupManager {
  constructor(cache, database) {
    this.cache = cache;
    this.database = database;
    this.warmupStrategies = [];
  }
  
  // 添加预热策略
  addWarmupStrategy(strategy) {
    this.warmupStrategies.push(strategy);
  }
  
  // 执行预热
  async warmup() {
    console.log('开始缓存预热...');
    const startTime = Date.now();
    
    for (const strategy of this.warmupStrategies) {
      try {
        await this.executeStrategy(strategy);
      } catch (error) {
        console.error(`预热策略 ${strategy.name} 执行失败:`, error);
      }
    }
    
    const duration = Date.now() - startTime;
    console.log(`缓存预热完成，耗时 ${duration}ms`);
  }
  
  async executeStrategy(strategy) {
    console.log(`执行预热策略: ${strategy.name}`);
    
    switch (strategy.type) {
      case 'popular_data':
        await this.warmupPopularData(strategy);
        break;
      case 'recent_data':
        await this.warmupRecentData(strategy);
        break;
      case 'user_specific':
        await this.warmupUserSpecificData(strategy);
        break;
      case 'static_data':
        await this.warmupStaticData(strategy);
        break;
      default:
        console.warn(`未知的预热策略类型: ${strategy.type}`);
    }
  }
  
  // 预热热门数据
  async warmupPopularData(strategy) {
    const popularItems = await this.database.query(strategy.query);
    
    for (const item of popularItems) {
      const cacheKey = strategy.keyGenerator(item);
      await this.cache.set(cacheKey, item, strategy.ttl);
    }
    
    console.log(`预热了 ${popularItems.length} 条热门数据`);
  }
  
  // 预热最近数据
  async warmupRecentData(strategy) {
    const recentItems = await this.database.query(strategy.query);
    
    for (const item of recentItems) {
      const cacheKey = strategy.keyGenerator(item);
      await this.cache.set(cacheKey, item, strategy.ttl);
    }
    
    console.log(`预热了 ${recentItems.length} 条最近数据`);
  }
  
  // 预热用户特定数据
  async warmupUserSpecificData(strategy) {
    const users = await this.database.query(strategy.userQuery);
    let totalItems = 0;
    
    for (const user of users) {
      const userItems = await this.database.query(strategy.dataQuery, [user.id]);
      
      for (const item of userItems) {
        const cacheKey = strategy.keyGenerator(user, item);
        await this.cache.set(cacheKey, item, strategy.ttl);
        totalItems++;
      }
    }
    
    console.log(`为 ${users.length} 个用户预热了 ${totalItems} 条数据`);
  }
  
  // 预热静态数据
  async warmupStaticData(strategy) {
    const staticData = await this.database.query(strategy.query);
    
    for (const item of staticData) {
      const cacheKey = strategy.keyGenerator(item);
      await this.cache.set(cacheKey, item, strategy.ttl || 86400000); // 24小时
    }
    
    console.log(`预热了 ${staticData.length} 条静态数据`);
  }
}

// 预热策略示例
const warmupStrategies = [
  {
    name: '热门商品',
    type: 'popular_data',
    query: 'SELECT * FROM products ORDER BY view_count DESC LIMIT 100',
    keyGenerator: (item) => `product:${item.id}`,
    ttl: 3600000 // 1小时
  },
  {
    name: '最新文章',
    type: 'recent_data',
    query: 'SELECT * FROM articles WHERE created_at > NOW() - INTERVAL 1 DAY',
    keyGenerator: (item) => `article:${item.id}`,
    ttl: 1800000 // 30分钟
  },
  {
    name: '用户配置',
    type: 'user_specific',
    userQuery: 'SELECT id FROM users WHERE active = 1 LIMIT 1000',
    dataQuery: 'SELECT * FROM user_settings WHERE user_id = ?',
    keyGenerator: (user, item) => `user_settings:${user.id}`,
    ttl: 7200000 // 2小时
  }
];
```

### 2. 缓存监控
```javascript
// 缓存监控器
class CacheMonitor {
  constructor(cache) {
    this.cache = cache;
    this.metrics = {
      hitRate: [],
      responseTime: [],
      memoryUsage: [],
      keyCount: []
    };
    
    this.alerts = [];
    this.thresholds = {
      hitRateMin: 80, // 最低命中率80%
      responseTimeMax: 100, // 最大响应时间100ms
      memoryUsageMax: 85 // 最大内存使用率85%
    };
  }
  
  // 开始监控
  startMonitoring(interval = 60000) { // 1分钟
    setInterval(() => {
      this.collectMetrics();
      this.checkAlerts();
    }, interval);
  }
  
  // 收集指标
  async collectMetrics() {
    const stats = this.cache.getStats();
    const timestamp = Date.now();
    
    // 记录命中率
    this.metrics.hitRate.push({
      timestamp,
      value: stats.hitRate
    });
    
    // 记录键数量
    this.metrics.keyCount.push({
      timestamp,
      value: stats.size
    });
    
    // 测量响应时间
    const responseTime = await this.measureResponseTime();
    this.metrics.responseTime.push({
      timestamp,
      value: responseTime
    });
    
    // 保持最近100条记录
    Object.keys(this.metrics).forEach(key => {
      if (this.metrics[key].length > 100) {
        this.metrics[key].shift();
      }
    });
  }
  
  // 测量响应时间
  async measureResponseTime() {
    const testKey = 'monitor_test_key';
    const testValue = 'test_value';
    
    const startTime = process.hrtime.bigint();
    
    await this.cache.set(testKey, testValue, 1000);
    await this.cache.get(testKey);
    await this.cache.delete(testKey);
    
    const endTime = process.hrtime.bigint();
    return Number(endTime - startTime) / 1000000; // 转换为毫秒
  }
  
  // 检查告警
  checkAlerts() {
    const currentStats = this.getCurrentStats();
    
    // 检查命中率告警
    if (currentStats.hitRate < this.thresholds.hitRateMin) {
      this.triggerAlert('LOW_HIT_RATE', {
        current: currentStats.hitRate,
        threshold: this.thresholds.hitRateMin
      });
    }
    
    // 检查响应时间告警
    if (currentStats.responseTime > this.thresholds.responseTimeMax) {
      this.triggerAlert('HIGH_RESPONSE_TIME', {
        current: currentStats.responseTime,
        threshold: this.thresholds.responseTimeMax
      });
    }
  }
  
  // 触发告警
  triggerAlert(type, data) {
    const alert = {
      type,
      data,
      timestamp: new Date(),
      severity: this.getAlertSeverity(type, data)
    };
    
    this.alerts.push(alert);
    console.warn('缓存告警:', alert);
    
    // 保持最近50条告警
    if (this.alerts.length > 50) {
      this.alerts.shift();
    }
  }
  
  getAlertSeverity(type, data) {
    switch (type) {
      case 'LOW_HIT_RATE':
        return data.current < 50 ? 'critical' : 'warning';
      case 'HIGH_RESPONSE_TIME':
        return data.current > 500 ? 'critical' : 'warning';
      default:
        return 'info';
    }
  }
  
  // 获取当前统计
  getCurrentStats() {
    const hitRate = this.metrics.hitRate.length > 0 ? 
      this.metrics.hitRate[this.metrics.hitRate.length - 1].value : 0;
    
    const responseTime = this.metrics.responseTime.length > 0 ? 
      this.metrics.responseTime[this.metrics.responseTime.length - 1].value : 0;
    
    return { hitRate, responseTime };
  }
  
  // 生成监控报告
  generateReport() {
    const report = {
      timestamp: new Date(),
      summary: this.getCurrentStats(),
      trends: this.calculateTrends(),
      alerts: this.alerts.slice(-10), // 最近10条告警
      recommendations: this.generateRecommendations()
    };
    
    return report;
  }
  
  calculateTrends() {
    return {
      hitRate: this.calculateTrend(this.metrics.hitRate),
      responseTime: this.calculateTrend(this.metrics.responseTime),
      keyCount: this.calculateTrend(this.metrics.keyCount)
    };
  }
  
  calculateTrend(data) {
    if (data.length < 10) return 'stable';
    
    const recent = data.slice(-10);
    const first = recent[0].value;
    const last = recent[recent.length - 1].value;
    
    const change = ((last - first) / first) * 100;
    
    if (change > 10) return 'increasing';
    if (change < -10) return 'decreasing';
    return 'stable';
  }
  
  generateRecommendations() {
    const recommendations = [];
    const stats = this.getCurrentStats();
    
    if (stats.hitRate < 70) {
      recommendations.push('命中率较低，检查缓存策略和TTL设置');
    }
    
    if (stats.responseTime > 50) {
      recommendations.push('响应时间较长，考虑优化缓存实现或增加缓存节点');
    }
    
    return recommendations;
  }
}
```

## 总结

缓存是提升数据库应用性能的重要手段：

1. **缓存策略**：选择合适的缓存模式和失效策略
2. **实现方案**：内存缓存、分布式缓存的设计和实现
3. **缓存预热**：提前加载热点数据提升命中率
4. **监控告警**：实时监控缓存性能和健康状态
5. **优化调整**：基于监控数据持续优化缓存配置
6. **最佳实践**：遵循缓存设计和使用的最佳实践

通过合理的缓存设计和管理，可以显著减少数据库负载，提升应用响应速度。
