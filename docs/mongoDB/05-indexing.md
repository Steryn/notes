# 05 - MongoDB索引与性能优化

## 🎯 学习目标

- 理解MongoDB索引的工作原理
- 掌握各种索引类型的创建和使用
- 学会索引性能分析和优化
- 熟悉索引管理最佳实践

## 📚 索引基础概念

### 1. 什么是索引？

索引是数据库中用于提高查询性能的数据结构。MongoDB使用B-tree索引来快速定位文档，类似于书籍的目录。

**索引的作用：**

- 🚀 **提高查询速度** - 避免全表扫描
- 📊 **支持排序** - 快速排序结果
- 🔍 **支持范围查询** - 高效的范围操作
- 🎯 **唯一性约束** - 确保数据唯一性

### 2. 索引类型

| 索引类型 | 说明 | 示例 |
|---------|------|------|
| 单字段索引 | 单个字段的索引 | `{ name: 1 }` |
| 复合索引 | 多个字段的索引 | `{ name: 1, age: 1 }` |
| 多键索引 | 数组字段的索引 | `{ tags: 1 }` |
| 文本索引 | 全文搜索索引 | `{ title: "text" }` |
| 地理空间索引 | 地理位置索引 | `{ location: "2dsphere" }` |
| 哈希索引 | 哈希值索引 | `{ _id: "hashed" }` |

## 🔧 索引操作

### 1. 创建索引

```javascript
// 创建单字段索引
db.users.createIndex({ name: 1 })

// 创建复合索引
db.users.createIndex({ city: 1, age: 1 })

// 创建降序索引
db.users.createIndex({ created_at: -1 })

// 创建唯一索引
db.users.createIndex({ email: 1 }, { unique: true })

// 创建稀疏索引（跳过null值）
db.users.createIndex({ phone: 1 }, { sparse: true })

// 创建部分索引（只对满足条件的文档建索引）
db.users.createIndex(
  { name: 1 },
  { partialFilterExpression: { age: { $gte: 18 } } }
)
```

### 2. 索引选项

```javascript
// 后台创建索引（不阻塞其他操作）
db.users.createIndex({ name: 1 }, { background: true })

// 设置索引名称
db.users.createIndex({ name: 1 }, { name: "user_name_index" })

// TTL索引（自动删除过期文档）
db.sessions.createIndex(
  { created_at: 1 },
  { expireAfterSeconds: 3600 }  // 1小时后过期
)

// 创建文本索引
db.articles.createIndex({
  title: "text",
  content: "text"
})

// 创建地理空间索引
db.locations.createIndex({ location: "2dsphere" })
```

### 3. 查看索引

```javascript
// 查看集合的所有索引
db.users.getIndexes()

// 查看索引统计信息
db.users.aggregate([{ $indexStats: {} }])

// 查看索引使用情况
db.users.find({ name: "张三" }).explain("executionStats")
```

### 4. 删除索引

```javascript
// 删除指定索引
db.users.dropIndex({ name: 1 })

// 删除指定名称的索引
db.users.dropIndex("user_name_index")

// 删除所有非_id索引
db.users.dropIndexes()
```

## 📊 索引性能分析

### 1. 查询计划分析

```javascript
// 基本查询计划
db.users.find({ name: "张三" }).explain()

// 详细执行统计
db.users.find({ name: "张三" }).explain("executionStats")

// 查询计划分析
db.users.find({ name: "张三" }).explain("queryPlanner")
```

### 2. 执行统计解读

```javascript
// 执行统计结果示例
{
  "executionStats": {
    "executionSuccess": true,
    "nReturned": 1,           // 返回文档数
    "executionTimeMillis": 0, // 执行时间（毫秒）
    "totalKeysExamined": 1,   // 检查的索引键数
    "totalDocsExamined": 1,   // 检查的文档数
    "stage": "IXSCAN",        // 执行阶段
    "indexName": "name_1"     // 使用的索引
  }
}
```

### 3. 性能监控

```javascript
// 启用性能分析
db.setProfilingLevel(2, { slowms: 100 })

// 查看慢查询
db.system.profile.find().sort({ ts: -1 }).limit(5)

// 分析索引使用情况
db.users.aggregate([{ $indexStats: {} }])
```

## 🎯 索引优化策略

### 1. 复合索引优化

```javascript
// 创建测试数据
db.orders.insertMany([
  { customer: "张三", product: "手机", amount: 1000, date: new Date("2024-01-01") },
  { customer: "李四", product: "电脑", amount: 2000, date: new Date("2024-01-02") },
  { customer: "张三", product: "平板", amount: 800, date: new Date("2024-01-03") }
])

// 创建复合索引
db.orders.createIndex({ customer: 1, product: 1, date: 1 })

// 索引前缀规则
// 以下查询可以使用索引：
db.orders.find({ customer: "张三" })
db.orders.find({ customer: "张三", product: "手机" })
db.orders.find({ customer: "张三", product: "手机", date: { $gte: new Date("2024-01-01") } })

// 以下查询不能使用索引：
db.orders.find({ product: "手机" })  // 跳过了customer字段
db.orders.find({ date: { $gte: new Date("2024-01-01") } })  // 跳过了前面的字段
```

### 2. 索引选择性优化

```javascript
// 高选择性字段放在前面
db.users.createIndex({ email: 1, name: 1 })  // email选择性更高

// 等值查询字段放在范围查询字段前面
db.orders.createIndex({ status: 1, date: 1 })  // status是等值查询

// 排序字段考虑
db.users.createIndex({ city: 1, age: 1, name: 1 })  // 支持按name排序
```

### 3. 部分索引优化

```javascript
// 只为活跃用户创建索引
db.users.createIndex(
  { name: 1 },
  { partialFilterExpression: { status: "active" } }
)

// 只为有邮箱的用户创建索引
db.users.createIndex(
  { email: 1 },
  { partialFilterExpression: { email: { $exists: true } } }
)
```

## 🔍 特殊索引类型

### 1. 文本索引

```javascript
// 创建文本索引
db.articles.createIndex({
  title: "text",
  content: "text",
  tags: "text"
})

// 文本搜索
db.articles.find({ $text: { $search: "MongoDB 教程" } })

// 文本搜索选项
db.articles.find({
  $text: {
    $search: "MongoDB 教程",
    $caseSensitive: false,
    $diacriticSensitive: false
  }
})

// 文本搜索评分
db.articles.find(
  { $text: { $search: "MongoDB" } },
  { score: { $meta: "textScore" } }
).sort({ score: { $meta: "textScore" } })
```

### 2. 地理空间索引

```javascript
// 创建2dsphere索引
db.locations.createIndex({ location: "2dsphere" })

// 地理空间查询
db.locations.find({
  location: {
    $near: {
      $geometry: {
        type: "Point",
        coordinates: [116.3974, 39.9093]  // 北京坐标
      },
      $maxDistance: 1000  // 1公里内
    }
  }
})

// 地理空间范围查询
db.locations.find({
  location: {
    $geoWithin: {
      $geometry: {
        type: "Polygon",
        coordinates: [[[116.3, 39.8], [116.5, 39.8], [116.5, 40.0], [116.3, 40.0], [116.3, 39.8]]]
      }
    }
  }
})
```

### 3. TTL索引

```javascript
// 创建TTL索引
db.sessions.createIndex(
  { created_at: 1 },
  { expireAfterSeconds: 3600 }  // 1小时后过期
)

// 插入测试数据
db.sessions.insertOne({
  user_id: "123",
  session_data: "some data",
  created_at: new Date()
})

// 文档会在1小时后自动删除
```

## 🛠️ 实践练习

### 练习1：索引创建和优化

1. 创建用户集合并插入测试数据
2. 为常用查询字段创建索引
3. 创建复合索引优化多条件查询
4. 分析查询性能并优化索引
5. 测试索引对写入性能的影响

### 练习2：文本搜索

1. 创建文章集合并插入测试数据
2. 创建文本索引
3. 实现全文搜索功能
4. 优化搜索结果的排序
5. 处理中文搜索的特殊情况

### 练习3：地理空间查询

1. 创建位置数据集合
2. 创建地理空间索引
3. 实现附近位置查询
4. 实现地理范围查询
5. 计算地理位置距离

## ❓ 常见问题

### Q: 如何选择索引字段的顺序？

A: 1. 等值查询字段在前 2. 高选择性字段在前 3. 排序字段考虑在内 4. 范围查询字段在后

### Q: 索引会影响写入性能吗？

A: 是的，每个索引都会影响写入性能。需要平衡读写性能，删除不必要的索引。

### Q: 如何判断索引是否被使用？

A: 使用explain()方法分析查询计划，查看是否使用了IXSCAN阶段。

### Q: 复合索引的前缀规则是什么？

A: 复合索引只能使用从左到右的连续字段，不能跳过中间的字段。

### Q: 如何优化索引大小？

A: 使用部分索引、稀疏索引，删除不必要的索引，定期分析索引使用情况。

## ⚠️ 注意事项

1. **索引维护成本** - 每个索引都会占用存储空间和影响写入性能
2. **索引选择** - 不要为所有字段创建索引，只创建必要的索引
3. **复合索引顺序** - 字段顺序很重要，影响查询效率
4. **索引监控** - 定期监控索引使用情况，删除未使用的索引
5. **内存使用** - 索引会占用内存，注意内存使用情况

## 🎯 学习检查

完成本课后，你应该能够：

- [ ] 创建和管理各种类型的索引
- [ ] 分析查询性能并优化索引
- [ ] 使用文本索引进行全文搜索
- [ ] 使用地理空间索引进行位置查询
- [ ] 应用索引优化最佳实践

---

**下一步：** 学习 [06-aggregation](./06-aggregation.md) 聚合管道
