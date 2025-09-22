# 索引优化

## 索引基础

索引是提高数据库查询性能的关键技术。在MongoDB中，索引是一种特殊的数据结构，它存储了集合中特定字段的值，并按一定顺序排列，使得查询操作能够快速定位到所需的文档。

## 索引类型

### 单字段索引

单字段索引是最基本的索引类型，它只包含一个字段。

```javascript
// 创建单字段索引
db.users.createIndex({ name: 1 })

// 创建降序索引
db.users.createIndex({ age: -1 })
```

### 复合索引

复合索引包含多个字段，字段顺序很重要。

```javascript
// 创建复合索引
db.users.createIndex({ city: 1, age: -1 })
```

### 多键索引

多键索引用于包含数组字段的文档。

```javascript
// 假设用户文档有hobbies数组字段
db.users.createIndex({ hobbies: 1 })
```

### 文本索引

文本索引支持文本搜索操作。

```javascript
// 创建文本索引
db.articles.createIndex({ title: "text", content: "text" })

// 使用文本索引进行搜索
db.articles.find({ $text: { $search: "MongoDB性能优化" } })
```

### 地理空间索引

地理空间索引支持地理空间查询。

```javascript
// 创建2dsphere索引
db.places.createIndex({ location: "2dsphere" })

// 查询附近的地点
db.places.find({
  location: {
    $near: {
      $geometry: {
        type: "Point",
        coordinates: [116.4074, 39.9042]  // 北京坐标
      },
      $maxDistance: 1000  // 1000米范围内
    }
  }
})
```

### 哈希索引

哈希索引将字段值的哈希值作为索引，支持基于哈希的分片。

```javascript
// 创建哈希索引
db.users.createIndex({ username: "hashed" })
```

## 索引管理

### 查看索引

```javascript
// 查看集合的所有索引
db.users.getIndexes()

// 查看索引统计信息
db.users.stats({ indexDetails: true })
```

### 删除索引

```javascript
// 删除指定索引
db.users.dropIndex({ name: 1 })

// 删除所有索引
db.users.dropIndexes()
```

### 索引重建

```javascript
// 重建所有索引
db.users.reIndex()
```

## 索引优化策略

### 索引选择原则

1. **选择性**：选择性高的字段更适合创建索引，即字段值重复较少的字段
2. **查询频率**：经常用于查询条件的字段应该创建索引
3. **排序需求**：经常用于排序的字段应该创建索引
4. **覆盖查询**：如果索引包含了查询所需的所有字段，可以避免回表查询

### 复合索引顺序

复合索引中字段的顺序很重要，应该将选择性最高的字段放在前面：

```javascript
// 假设city字段选择性较低，age字段选择性较高
// 应该这样创建索引
db.users.createIndex({ age: 1, city: 1 })

// 而不是
db.users.createIndex({ city: 1, age: 1 })
```

### 索引大小监控

索引会占用存储空间，需要监控索引大小：

```javascript
// 查看集合统计信息，包括索引大小
db.users.stats()

// 查看数据库统计信息
db.stats()
```

## 索引性能分析

### explain()方法

使用`explain()`方法分析查询执行计划：

```javascript
// 分析查询执行计划
db.users.find({ age: { $gt: 25 } }).explain("executionStats")

// 分析聚合查询执行计划
db.users.aggregate([
  { $match: { age: { $gt: 25 } } }
]).explain("executionStats")
```

### 查询计划解读

在`explain()`的输出中，重点关注以下信息：

1. `stage`：使用的查询阶段
2. `indexUsed`：使用的索引
3. `docsExamined`：检查的文档数量
4. `executionTimeMillis`：执行时间

## 索引与分片

在分片集群中，索引对分片键的选择和查询路由有重要影响：

### 分片键索引

分片键会自动创建索引：

```javascript
// 启用分片并指定分片键
db.adminCommand({ enableSharding: "myDatabase" })
db.adminCommand({ shardCollection: "myDatabase.users", key: { city: 1 } })
```

### 分片查询优化

在分片环境中，查询应该尽可能包含分片键以提高性能：

```javascript
// 高效的分片查询
db.users.find({ city: "北京" })

// 低效的分片查询（需要查询所有分片）
db.users.find({ age: { $gt: 25 } })
```

## 实践项目

在博客系统中实现索引优化：

1. 为文章集合创建合适的索引以提高查询性能
2. 为评论集合创建复合索引以支持按文章ID和时间排序的查询
3. 使用`explain()`分析查询性能并优化索引
4. 监控索引大小和查询性能变化
