# 04 - MongoDB查询操作详解

## 🎯 学习目标

- 掌握MongoDB的高级查询技巧
- 理解各种查询操作符的使用
- 学会处理复杂的数据查询场景
- 熟悉查询性能优化方法

## 🔍 高级查询操作符

### 1. 比较操作符

```javascript
// 数值比较
db.products.find({ price: { $gt: 100 } })      // 大于
db.products.find({ price: { $gte: 100 } })     // 大于等于
db.products.find({ price: { $lt: 500 } })      // 小于
db.products.find({ price: { $lte: 500 } })      // 小于等于
db.products.find({ price: { $ne: 0 } })        // 不等于
db.products.find({ price: { $eq: 299 } })       // 等于

// 范围查询
db.products.find({ price: { $gte: 100, $lte: 500 } })

// 存在性查询
db.products.find({ price: { $exists: true } })   // 字段存在
db.products.find({ price: { $exists: false } })  // 字段不存在
db.products.find({ price: { $exists: true, $ne: null } }) // 存在且不为null
```

### 2. 逻辑操作符

```javascript
// AND 操作
db.users.find({
  age: { $gte: 18 },
  city: "北京",
  status: "active"
})

// OR 操作
db.users.find({
  $or: [
    { age: { $lt: 25 } },
    { city: "上海" },
    { status: "vip" }
  ]
})

// NOT 操作
db.users.find({
  age: { $not: { $gte: 18 } }
})

// NOR 操作（都不满足）
db.users.find({
  $nor: [
    { age: { $lt: 18 } },
    { status: "inactive" }
  ]
})
```

### 3. 数组操作符

```javascript
// 插入测试数据
db.users.insertMany([
  {
    name: "张三",
    hobbies: ["读书", "游泳", "编程"],
    scores: [85, 90, 78, 92]
  },
  {
    name: "李四",
    hobbies: ["音乐", "绘画"],
    scores: [88, 95]
  }
])

// $all - 包含所有指定元素
db.users.find({ hobbies: { $all: ["读书", "游泳"] } })

// $elemMatch - 数组元素匹配条件
db.users.find({ scores: { $elemMatch: { $gte: 90 } } })

// $size - 数组长度
db.users.find({ hobbies: { $size: 3 } })

// 位置查询
db.users.find({ "hobbies.0": "读书" })  // 第一个元素
db.users.find({ "hobbies.1": "游泳" })  // 第二个元素
```

### 4. 字符串操作符

```javascript
// 插入测试数据
db.users.insertMany([
  { name: "张三", email: "zhangsan@example.com" },
  { name: "李四", email: "lisi@gmail.com" },
  { name: "王五", email: "wangwu@company.com" }
])

// $regex - 正则表达式
db.users.find({ name: { $regex: /^张/ } })        // 以"张"开头
db.users.find({ name: { $regex: /三$/ } })        // 以"三"结尾
db.users.find({ name: { $regex: /李|王/ } })      // 包含"李"或"王"

// $text - 文本搜索（需要文本索引）
db.users.createIndex({ name: "text", email: "text" })
db.users.find({ $text: { $search: "张三 example" } })

// 大小写不敏感
db.users.find({ name: { $regex: /zhang/i } })
```

### 5. 日期操作符

```javascript
// 插入测试数据
db.events.insertMany([
  {
    title: "会议A",
    date: new Date("2024-01-15"),
    attendees: 50
  },
  {
    title: "会议B",
    date: new Date("2024-02-20"),
    attendees: 30
  }
])

// 日期范围查询
db.events.find({
  date: {
    $gte: new Date("2024-01-01"),
    $lt: new Date("2024-02-01")
  }
})

// 使用ISODate
db.events.find({
  date: {
    $gte: ISODate("2024-01-01T00:00:00Z"),
    $lt: ISODate("2024-02-01T00:00:00Z")
  }
})
```

## 📊 投影和排序

### 1. 字段投影

```javascript
// 包含字段
db.users.find({}, { name: 1, age: 1 })

// 排除字段
db.users.find({}, { password: 0, _id: 0 })

// 嵌套字段投影
db.users.find({}, { "address.city": 1, "address.district": 1 })

// 数组元素投影
db.users.find({}, { hobbies: { $slice: 2 } })  // 只返回前2个元素
db.users.find({}, { hobbies: { $slice: -1 } }) // 只返回最后一个元素
db.users.find({}, { hobbies: { $slice: [1, 2] } }) // 跳过1个，返回2个
```

### 2. 排序操作

```javascript
// 单字段排序
db.users.find().sort({ age: 1 })   // 升序
db.users.find().sort({ age: -1 })  // 降序

// 多字段排序
db.users.find().sort({ city: 1, age: -1 })

// 自然排序
db.users.find().sort({ $natural: 1 })  // 插入顺序
db.users.find().sort({ $natural: -1 }) // 插入顺序倒序
```

### 3. 分页查询

```javascript
// 基本分页
db.users.find()
  .sort({ _id: 1 })
  .limit(10)
  .skip(20)  // 跳过前20条

// 基于游标的分页
const lastId = ObjectId("507f1f77bcf86cd799439011")
db.users.find({ _id: { $gt: lastId } })
  .sort({ _id: 1 })
  .limit(10)
```

## 🔄 聚合查询

### 1. 基本聚合操作

```javascript
// 插入测试数据
db.sales.insertMany([
  { product: "手机", amount: 1000, date: new Date("2024-01-01") },
  { product: "电脑", amount: 2000, date: new Date("2024-01-02") },
  { product: "手机", amount: 1200, date: new Date("2024-01-03") },
  { product: "平板", amount: 800, date: new Date("2024-01-04") }
])

// 分组统计
db.sales.aggregate([
  {
    $group: {
      _id: "$product",
      totalAmount: { $sum: "$amount" },
      count: { $sum: 1 },
      avgAmount: { $avg: "$amount" }
    }
  }
])

// 排序和限制
db.sales.aggregate([
  { $group: { _id: "$product", totalAmount: { $sum: "$amount" } } },
  { $sort: { totalAmount: -1 } },
  { $limit: 2 }
])
```

### 2. 条件聚合

```javascript
// 条件分组
db.sales.aggregate([
  {
    $group: {
      _id: {
        product: "$product",
        month: { $month: "$date" }
      },
      totalAmount: { $sum: "$amount" }
    }
  }
])

// 条件统计
db.sales.aggregate([
  {
    $group: {
      _id: null,
      highValueSales: {
        $sum: {
          $cond: [{ $gte: ["$amount", 1000] }, 1, 0]
        }
      },
      lowValueSales: {
        $sum: {
          $cond: [{ $lt: ["$amount", 1000] }, 1, 0]
        }
      }
    }
  }
])
```

## 🎯 查询优化

### 1. 索引使用

```javascript
// 创建单字段索引
db.users.createIndex({ age: 1 })

// 创建复合索引
db.users.createIndex({ city: 1, age: 1 })

// 创建文本索引
db.users.createIndex({ name: "text", email: "text" })

// 查看查询计划
db.users.find({ age: { $gte: 25 } }).explain("executionStats")
```

### 2. 查询性能分析

```javascript
// 启用性能分析
db.setProfilingLevel(2, { slowms: 100 })

// 查看慢查询
db.system.profile.find().sort({ ts: -1 }).limit(5)

// 分析查询统计
db.users.find({ age: { $gte: 25 } }).explain("executionStats")
```

### 3. 查询优化技巧

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

## 🛠️ 实践练习

### 练习1：复杂条件查询

1. 创建包含用户、订单、产品的测试数据
2. 查询最近30天的订单
3. 查询金额大于1000的订单
4. 查询特定城市用户的订单
5. 使用复合条件查询

### 练习2：数组和嵌套查询

1. 创建包含标签和分类的产品数据
2. 查询包含特定标签的产品
3. 查询特定分类下的产品
4. 查询价格在指定范围内的产品
5. 使用正则表达式查询产品名称

### 练习3：聚合分析

1. 按月份统计销售额
2. 计算每个产品的平均价格
3. 找出销售额最高的产品
4. 分析用户购买行为
5. 生成销售报表

## ❓ 常见问题

### Q: 如何优化慢查询？

A: 1. 创建合适的索引 2. 使用投影减少数据传输 3. 避免全表扫描 4. 使用explain分析查询计划

### Q: 正则表达式查询性能如何？

A: 正则表达式查询通常较慢，建议使用文本索引或避免前缀匹配。

### Q: 如何处理大量数据的查询？

A: 使用分页、游标、索引优化，考虑数据分片。

### Q: 复合索引的顺序重要吗？

A: 是的，应该将选择性高的字段放在前面。

### Q: 如何监控查询性能？

A: 使用profiler、explain命令和性能监控工具。

## ⚠️ 注意事项

1. **索引维护** - 索引会影响写入性能，需要平衡读写性能
2. **查询复杂度** - 避免过于复杂的查询条件
3. **数据一致性** - 注意并发查询的数据一致性
4. **内存使用** - 大量数据查询时注意内存使用
5. **网络传输** - 使用投影减少不必要的数据传输

## 🎯 学习检查

完成本课后，你应该能够：

- [ ] 使用各种查询操作符
- [ ] 处理复杂的查询条件
- [ ] 优化查询性能
- [ ] 使用聚合进行数据分析
- [ ] 分析查询执行计划

---

**下一步：** 学习 [05-indexing](./05-indexing.md) 索引与性能优化
