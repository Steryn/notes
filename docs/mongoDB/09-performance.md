# 09 - MongoDB性能调优

## 🎯 学习目标

- 理解MongoDB性能优化的核心概念
- 掌握性能监控和分析方法
- 学会优化查询和索引性能
- 熟悉系统资源优化策略

## 📊 性能监控

### 1. 性能监控工具

**MongoDB内置工具：**

- `db.serverStatus()` - 服务器状态
- `db.stats()` - 数据库统计
- `db.collection.stats()` - 集合统计
- `explain()` - 查询计划分析
- `profiler` - 慢查询分析

**第三方工具：**

- MongoDB Compass - 图形界面监控
- MongoDB Atlas - 云服务监控
- Prometheus + Grafana - 监控仪表板
- New Relic - APM监控

### 2. 服务器状态监控

```javascript
// 查看服务器状态
db.serverStatus()

// 查看数据库统计
db.stats()

// 查看集合统计
db.users.stats()

// 查看索引统计
db.users.aggregate([{ $indexStats: {} }])
```

### 3. 查询性能分析

```javascript
// 分析查询计划
db.users.find({ age: { $gte: 25 } }).explain("executionStats")

// 启用慢查询分析
db.setProfilingLevel(2, { slowms: 100 })

// 查看慢查询
db.system.profile.find().sort({ ts: -1 }).limit(5)

// 分析慢查询
db.system.profile.find({ millis: { $gt: 100 } })
```

## 🔍 查询优化

### 1. 索引优化

```javascript
// 创建合适的索引
db.users.createIndex({ age: 1, city: 1 })

// 分析索引使用情况
db.users.find({ age: { $gte: 25 }, city: "北京" }).explain("executionStats")

// 查看索引统计
db.users.aggregate([{ $indexStats: {} }])

// 删除未使用的索引
db.users.dropIndex({ unusedField: 1 })
```

### 2. 查询优化技巧

```javascript
// 1. 使用投影减少数据传输
db.users.find({ age: { $gte: 25 } }, { name: 1, age: 1 })

// 2. 使用limit限制结果
db.users.find({ age: { $gte: 25 } }).limit(100)

// 3. 避免使用$regex进行前缀匹配
db.users.find({ name: { $regex: /^张/ } })  // 慢
db.users.find({ name: { $gte: "张", $lt: "张\uffff" } })  // 快

// 4. 使用复合索引优化多条件查询
db.users.createIndex({ city: 1, age: 1, status: 1 })
db.users.find({ city: "北京", age: { $gte: 25 }, status: "active" })
```

### 3. 聚合管道优化

```javascript
// 1. 尽早使用$match减少数据量
db.orders.aggregate([
  { $match: { status: "completed" } },  // 先过滤
  { $group: { _id: "$customer", total: { $sum: "$amount" } } }
])

// 2. 使用索引优化$match和$sort
db.orders.createIndex({ status: 1, date: 1 })

// 3. 避免在$group前使用$project
db.orders.aggregate([
  { $match: { status: "completed" } },
  { $group: { _id: "$customer", total: { $sum: "$amount" } } },
  { $project: { _id: 1, total: 1 } }  // 在group后使用project
])
```

## 💾 内存优化

### 1. 内存配置

```yaml
# 配置文件中的内存设置
storage:
  wiredTiger:
    engineConfig:
      cacheSizeGB: 4  # 设置缓存大小
      journalCompressor: snappy
      directoryForIndexes: true
    collectionConfig:
      blockCompressor: snappy
    indexConfig:
      prefixCompression: true
```

### 2. 内存使用监控

```javascript
// 查看内存使用情况
db.serverStatus().mem

// 查看缓存使用情况
db.serverStatus().wiredTiger.cache

// 查看索引内存使用
db.users.stats().indexSizes
```

### 3. 内存优化策略

```javascript
// 1. 合理设置缓存大小
// 缓存大小应该是可用内存的50-60%

// 2. 使用压缩减少内存使用
db.users.createIndex({ name: 1 }, { background: true })

// 3. 监控内存使用情况
db.serverStatus().wiredTiger.cache["bytes currently in the cache"]
```

## 🚀 写入性能优化

### 1. 批量操作

```javascript
// 使用批量插入
db.users.insertMany([
  { name: "用户1", age: 25 },
  { name: "用户2", age: 30 },
  { name: "用户3", age: 35 }
])

// 使用批量更新
db.users.bulkWrite([
  { updateOne: { filter: { name: "用户1" }, update: { $set: { age: 26 } } } },
  { updateOne: { filter: { name: "用户2" }, update: { $set: { age: 31 } } } }
])
```

### 2. 写入关注级别

```javascript
// 使用不同的写入关注级别
db.users.insertOne({ name: "用户1" }, { writeConcern: { w: 1 } })  // 快速写入
db.users.insertOne({ name: "用户2" }, { writeConcern: { w: "majority" } })  // 安全写入
db.users.insertOne({ name: "用户3" }, { writeConcern: { w: 1, j: false } })  // 异步写入
```

### 3. 索引优化

```javascript
// 1. 减少索引数量
// 只创建必要的索引

// 2. 使用后台创建索引
db.users.createIndex({ name: 1 }, { background: true })

// 3. 监控索引性能
db.users.aggregate([{ $indexStats: {} }])
```

## 🔄 读取性能优化

### 1. 连接池优化

```javascript
// 配置连接池
const client = new MongoClient(uri, {
  maxPoolSize: 10,        // 最大连接数
  minPoolSize: 5,         // 最小连接数
  maxIdleTimeMS: 30000,   // 最大空闲时间
  serverSelectionTimeoutMS: 5000,  // 服务器选择超时
  socketTimeoutMS: 45000, // Socket超时
  connectTimeoutMS: 10000  // 连接超时
});
```

### 2. 查询优化

```javascript
// 1. 使用合适的查询条件
db.users.find({ age: { $gte: 25 } })  // 使用索引

// 2. 避免全表扫描
db.users.find({ name: { $regex: /张/ } })  // 避免使用正则表达式

// 3. 使用投影减少数据传输
db.users.find({ age: { $gte: 25 } }, { name: 1, age: 1 })
```

### 3. 分页优化

```javascript
// 使用游标分页
const lastId = ObjectId("507f1f77bcf86cd799439011")
db.users.find({ _id: { $gt: lastId } })
  .sort({ _id: 1 })
  .limit(10)

// 避免使用skip进行大偏移分页
db.users.find().skip(10000).limit(10)  // 不推荐
```

## 📈 系统资源优化

### 1. CPU优化

```javascript
// 监控CPU使用情况
db.serverStatus().opcounters

// 优化CPU密集型操作
db.users.aggregate([
  { $match: { age: { $gte: 25 } } },  // 先过滤
  { $group: { _id: "$city", count: { $sum: 1 } } }
])
```

### 2. 磁盘优化

```javascript
// 监控磁盘使用情况
db.serverStatus().storageEngine

// 使用SSD提高性能
// 配置RAID提高可靠性

// 优化磁盘I/O
db.users.createIndex({ name: 1 }, { background: true })
```

### 3. 网络优化

```javascript
// 配置网络参数
net:
  maxIncomingConnections: 100
  wireObjectCheck: true
  ipv6: false

// 使用压缩减少网络传输
db.users.find({ age: { $gte: 25 } }, { name: 1, age: 1 })
```

## 🛠️ 实践练习

### 练习1：性能监控

1. 配置MongoDB性能监控
2. 分析服务器状态和统计信息
3. 监控查询性能
4. 设置慢查询分析
5. 使用监控工具

### 练习2：查询优化

1. 创建测试数据和索引
2. 分析查询计划
3. 优化慢查询
4. 测试优化效果
5. 应用查询优化技巧

### 练习3：系统优化

1. 配置内存和缓存
2. 优化写入性能
3. 优化读取性能
4. 监控系统资源
5. 应用性能优化策略

## ❓ 常见问题

### Q: 如何识别性能瓶颈？

A: 使用监控工具分析CPU、内存、磁盘、网络使用情况，查看慢查询日志。

### Q: 如何优化大量数据的查询？

A: 1. 创建合适的索引 2. 使用分页 3. 优化查询条件 4. 使用投影减少数据传输

### Q: 如何优化写入性能？

A: 1. 使用批量操作 2. 减少索引数量 3. 调整写入关注级别 4. 使用SSD存储

### Q: 如何优化内存使用？

A: 1. 合理设置缓存大小 2. 使用压缩 3. 监控内存使用 4. 优化索引

### Q: 如何监控MongoDB性能？

A: 使用内置工具、第三方监控工具、设置告警、定期分析性能数据。

## ⚠️ 注意事项

1. **性能测试** - 在生产环境前进行充分的性能测试
2. **监控告警** - 设置性能监控和告警机制
3. **渐进优化** - 逐步优化，避免一次性大幅调整
4. **备份恢复** - 优化前备份数据，确保可以恢复
5. **文档记录** - 记录优化过程和结果

## 🎯 学习检查

完成本课后，你应该能够：

- [ ] 监控MongoDB性能指标
- [ ] 分析和优化查询性能
- [ ] 优化系统资源使用
- [ ] 应用性能优化策略
- [ ] 解决性能问题

---

**下一步：** 学习 [10-deployment](./10-deployment.md) 部署与运维
