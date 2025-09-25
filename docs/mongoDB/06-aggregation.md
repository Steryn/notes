# 06 - MongoDB聚合管道

## 🎯 学习目标

- 理解MongoDB聚合管道的工作原理
- 掌握常用聚合操作符的使用
- 学会构建复杂的聚合查询
- 熟悉聚合性能优化方法

## 📚 聚合管道基础

### 1. 什么是聚合管道？

聚合管道是MongoDB中用于数据转换和分析的强大工具。它将数据通过一系列阶段（stage）进行处理，每个阶段对数据进行特定的操作。

**聚合管道的特点：**

- 🔄 **流水线处理** - 数据依次通过各个阶段
- 🎯 **灵活组合** - 可以任意组合不同的操作符
- 🚀 **高性能** - 在数据库层面处理，减少网络传输
- 📊 **丰富功能** - 支持复杂的数据分析操作

### 2. 聚合管道结构

```javascript
db.collection.aggregate([
  { $stage1: { ... } },
  { $stage2: { ... } },
  { $stage3: { ... } }
])
```

## 🔧 常用聚合操作符

### 1. 数据准备

```javascript
// 创建测试数据
db.orders.insertMany([
  {
    _id: 1,
    customer: "张三",
    product: "手机",
    amount: 1000,
    quantity: 1,
    date: new Date("2024-01-01"),
    status: "completed"
  },
  {
    _id: 2,
    customer: "李四",
    product: "电脑",
    amount: 2000,
    quantity: 1,
    date: new Date("2024-01-02"),
    status: "completed"
  },
  {
    _id: 3,
    customer: "张三",
    product: "平板",
    amount: 800,
    quantity: 2,
    date: new Date("2024-01-03"),
    status: "pending"
  },
  {
    _id: 4,
    customer: "王五",
    product: "手机",
    amount: 1200,
    quantity: 1,
    date: new Date("2024-01-04"),
    status: "completed"
  }
])
```

### 2. $match - 过滤阶段

```javascript
// 过滤已完成的订单
db.orders.aggregate([
  { $match: { status: "completed" } }
])

// 过滤金额大于1000的订单
db.orders.aggregate([
  { $match: { amount: { $gt: 1000 } } }
])

// 复合条件过滤
db.orders.aggregate([
  {
    $match: {
      status: "completed",
      amount: { $gte: 1000 },
      date: { $gte: new Date("2024-01-01") }
    }
  }
])
```

### 3. $group - 分组阶段

```javascript
// 按客户分组统计
db.orders.aggregate([
  {
    $group: {
      _id: "$customer",
      totalAmount: { $sum: "$amount" },
      orderCount: { $sum: 1 },
      avgAmount: { $avg: "$amount" }
    }
  }
])

// 按产品分组统计
db.orders.aggregate([
  {
    $group: {
      _id: "$product",
      totalSales: { $sum: "$amount" },
      totalQuantity: { $sum: "$quantity" },
      avgPrice: { $avg: "$amount" },
      maxPrice: { $max: "$amount" },
      minPrice: { $min: "$amount" }
    }
  }
])

// 多字段分组
db.orders.aggregate([
  {
    $group: {
      _id: {
        customer: "$customer",
        product: "$product"
      },
      totalAmount: { $sum: "$amount" }
    }
  }
])
```

### 4. $project - 投影阶段

```javascript
// 选择特定字段
db.orders.aggregate([
  {
    $project: {
      customer: 1,
      product: 1,
      amount: 1,
      _id: 0
    }
  }
])

// 计算字段
db.orders.aggregate([
  {
    $project: {
      customer: 1,
      product: 1,
      amount: 1,
      totalWithTax: { $multiply: ["$amount", 1.1] },
      _id: 0
    }
  }
])

// 条件投影
db.orders.aggregate([
  {
    $project: {
      customer: 1,
      product: 1,
      amount: 1,
      category: {
        $cond: {
          if: { $gte: ["$amount", 1000] },
          then: "高价",
          else: "低价"
        }
      },
      _id: 0
    }
  }
])
```

### 5. $sort - 排序阶段

```javascript
// 按金额降序排序
db.orders.aggregate([
  { $sort: { amount: -1 } }
])

// 多字段排序
db.orders.aggregate([
  { $sort: { customer: 1, amount: -1 } }
])

// 组合其他阶段
db.orders.aggregate([
  { $match: { status: "completed" } },
  { $sort: { amount: -1 } },
  { $limit: 3 }
])
```

### 6. $limit 和 $skip - 限制和跳过

```javascript
// 限制结果数量
db.orders.aggregate([
  { $sort: { amount: -1 } },
  { $limit: 5 }
])

// 跳过指定数量
db.orders.aggregate([
  { $sort: { amount: -1 } },
  { $skip: 2 },
  { $limit: 3 }
])
```

### 7. $lookup - 关联查询

```javascript
// 创建客户集合
db.customers.insertMany([
  { _id: "张三", name: "张三", city: "北京", vip: true },
  { _id: "李四", name: "李四", city: "上海", vip: false },
  { _id: "王五", name: "王五", city: "广州", vip: true }
])

// 关联查询
db.orders.aggregate([
  {
    $lookup: {
      from: "customers",
      localField: "customer",
      foreignField: "_id",
      as: "customerInfo"
    }
  },
  {
    $unwind: "$customerInfo"
  }
])
```

## 🔄 高级聚合操作

### 1. $unwind - 展开数组

```javascript
// 创建包含数组的测试数据
db.products.insertMany([
  {
    name: "手机",
    tags: ["电子", "通讯", "智能"],
    prices: [1000, 1200, 1500]
  },
  {
    name: "电脑",
    tags: ["电子", "办公", "游戏"],
    prices: [2000, 2500, 3000]
  }
])

// 展开标签数组
db.products.aggregate([
  { $unwind: "$tags" },
  { $group: { _id: "$tags", count: { $sum: 1 } } }
])

// 展开价格数组
db.products.aggregate([
  { $unwind: "$prices" },
  { $group: { _id: null, avgPrice: { $avg: "$prices" } } }
])
```

### 2. $addFields - 添加字段

```javascript
// 添加计算字段
db.orders.aggregate([
  {
    $addFields: {
      totalWithTax: { $multiply: ["$amount", 1.1] },
      year: { $year: "$date" },
      month: { $month: "$date" },
      dayOfWeek: { $dayOfWeek: "$date" }
    }
  }
])
```

### 3. $facet - 多路聚合

```javascript
// 同时进行多种聚合
db.orders.aggregate([
  {
    $facet: {
      "byCustomer": [
        { $group: { _id: "$customer", totalAmount: { $sum: "$amount" } } }
      ],
      "byProduct": [
        { $group: { _id: "$product", totalSales: { $sum: "$amount" } } }
      ],
      "byStatus": [
        { $group: { _id: "$status", count: { $sum: 1 } } }
      ]
    }
  }
])
```

### 4. $bucket - 分桶聚合

```javascript
// 按金额分桶
db.orders.aggregate([
  {
    $bucket: {
      groupBy: "$amount",
      boundaries: [0, 500, 1000, 2000, 3000],
      default: "其他",
      output: {
        count: { $sum: 1 },
        totalAmount: { $sum: "$amount" },
        avgAmount: { $avg: "$amount" }
      }
    }
  }
])
```

### 5. $graphLookup - 图遍历

```javascript
// 创建层级数据
db.employees.insertMany([
  { _id: 1, name: "CEO", manager: null },
  { _id: 2, name: "CTO", manager: 1 },
  { _id: 3, name: "开发经理", manager: 2 },
  { _id: 4, name: "开发工程师", manager: 3 },
  { _id: 5, name: "产品经理", manager: 2 }
])

// 查找所有下属
db.employees.aggregate([
  {
    $graphLookup: {
      from: "employees",
      startWith: "$_id",
      connectFromField: "_id",
      connectToField: "manager",
      as: "subordinates"
    }
  }
])
```

## 📊 聚合管道优化

### 1. 性能优化原则

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

### 2. 内存优化

```javascript
// 使用$limit限制中间结果
db.orders.aggregate([
  { $match: { status: "completed" } },
  { $sort: { amount: -1 } },
  { $limit: 1000 },  // 限制中间结果
  { $group: { _id: "$customer", total: { $sum: "$amount" } } }
])

// 使用allowDiskUse选项
db.orders.aggregate([
  { $group: { _id: "$customer", total: { $sum: "$amount" } } }
], { allowDiskUse: true })
```

### 3. 聚合管道分析

```javascript
// 分析聚合管道性能
db.orders.aggregate([
  { $match: { status: "completed" } },
  { $group: { _id: "$customer", total: { $sum: "$amount" } } }
]).explain("executionStats")
```

## 🛠️ 实践练习

### 练习1：基础聚合操作

1. 创建销售数据集合
2. 按产品统计销售总额
3. 按客户统计订单数量
4. 计算平均订单金额
5. 找出销售额最高的产品

### 练习2：复杂聚合查询

1. 创建包含多表关联的数据
2. 实现客户订单关联查询
3. 按时间维度统计销售数据
4. 实现分桶聚合分析
5. 生成综合销售报表

### 练习3：聚合管道优化

1. 创建大量测试数据
2. 构建复杂聚合管道
3. 分析性能瓶颈
4. 优化聚合管道
5. 测试优化效果

## ❓ 常见问题

### Q: 聚合管道和MapReduce有什么区别？

A: 聚合管道更简单易用，性能更好，功能更丰富。MapReduce主要用于复杂的数据处理，但性能较差。

### Q: 如何优化聚合管道性能？

A: 1. 尽早使用$match 2. 合理使用索引 3. 避免不必要的$project 4. 使用allowDiskUse处理大数据

### Q: 聚合管道有内存限制吗？

A: 是的，默认100MB。可以使用allowDiskUse选项将数据写入临时文件。

### Q: 如何调试聚合管道？

A: 使用explain()方法分析执行计划，逐步测试每个阶段的结果。

### Q: 聚合管道支持事务吗？

A: 聚合管道本身不支持事务，但可以在事务中执行聚合操作。

## ⚠️ 注意事项

1. **性能考虑** - 聚合管道可能消耗大量CPU和内存
2. **索引使用** - 确保$match和$sort阶段能使用索引
3. **数据量** - 大数据量时考虑使用allowDiskUse
4. **阶段顺序** - 合理的阶段顺序能显著提高性能
5. **内存监控** - 监控聚合操作的内存使用情况

## 🎯 学习检查

完成本课后，你应该能够：

- [ ] 构建基本的聚合管道
- [ ] 使用各种聚合操作符
- [ ] 实现复杂的数据分析
- [ ] 优化聚合管道性能
- [ ] 解决聚合查询问题

---

**下一步：** 学习 [07-schema](./07-schema.md) 数据模型设计
