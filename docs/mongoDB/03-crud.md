# 03 - MongoDB基本CRUD操作

## 🎯 学习目标

- 掌握MongoDB的基本CRUD操作
- 理解文档的创建、读取、更新和删除
- 学会使用MongoDB Shell进行数据操作
- 熟悉常用的查询和更新方法

## 📝 CRUD操作概述

CRUD代表四种基本数据库操作：

- **C**reate - 创建文档
- **R**ead - 读取文档
- **U**pdate - 更新文档
- **D**elete - 删除文档

## 🆕 Create - 创建操作

### 1. 插入单个文档

```javascript
// 使用 insertOne() 插入单个文档
db.users.insertOne({
  name: "张三",
  age: 25,
  email: "zhangsan@example.com",
  city: "北京"
})

// 返回结果
{
  acknowledged: true,
  insertedId: ObjectId("507f1f77bcf86cd799439011")
}
```

### 2. 插入多个文档

```javascript
// 使用 insertMany() 插入多个文档
db.users.insertMany([
  {
    name: "李四",
    age: 30,
    email: "lisi@example.com",
    city: "上海"
  },
  {
    name: "王五",
    age: 28,
    email: "wangwu@example.com",
    city: "广州"
  }
])

// 返回结果
{
  acknowledged: true,
  insertedIds: [
    ObjectId("507f1f77bcf86cd799439012"),
    ObjectId("507f1f77bcf86cd799439013")
  ]
}
```

### 3. 插入选项

```javascript
// 使用 ordered: false 允许部分插入失败
db.users.insertMany([
  { name: "用户1" },
  { name: "用户2" },
  { _id: "duplicate_id" },  // 重复ID
  { name: "用户3" }
], { ordered: false })

// 使用 writeConcern 控制写入确认级别
db.users.insertOne(
  { name: "用户4" },
  { writeConcern: { w: "majority", j: true } }
)
```

## 📖 Read - 读取操作

### 1. 查询所有文档

```javascript
// 查询集合中所有文档
db.users.find()

// 格式化输出
db.users.find().pretty()
```

### 2. 条件查询

```javascript
// 等值查询
db.users.find({ age: 25 })

// 比较查询
db.users.find({ age: { $gt: 25 } })        // 大于25
db.users.find({ age: { $gte: 25 } })       // 大于等于25
db.users.find({ age: { $lt: 30 } })        // 小于30
db.users.find({ age: { $lte: 30 } })       // 小于等于30
db.users.find({ age: { $ne: 25 } })        // 不等于25
db.users.find({ age: { $in: [25, 30] } })  // 在数组中
db.users.find({ age: { $nin: [25, 30] } }) // 不在数组中
```

### 3. 逻辑查询

```javascript
// AND 查询
db.users.find({ age: { $gt: 20 }, city: "北京" })

// OR 查询
db.users.find({ $or: [
  { age: { $lt: 25 } },
  { city: "上海" }
]})

// NOT 查询
db.users.find({ age: { $not: { $gt: 25 } } })

// NOR 查询
db.users.find({ $nor: [
  { age: { $lt: 25 } },
  { city: "上海" }
]})
```

### 4. 数组查询

```javascript
// 插入包含数组的文档
db.users.insertOne({
  name: "赵六",
  hobbies: ["读书", "游泳", "编程"],
  scores: [85, 90, 78]
})

// 查询包含特定元素的数组
db.users.find({ hobbies: "编程" })

// 查询数组长度
db.users.find({ hobbies: { $size: 3 } })

// 查询数组中的特定位置
db.users.find({ "hobbies.0": "读书" })

// 查询满足条件的数组元素
db.users.find({ scores: { $elemMatch: { $gt: 80 } } })
```

### 5. 嵌套文档查询

```javascript
// 插入嵌套文档
db.users.insertOne({
  name: "钱七",
  address: {
    city: "深圳",
    district: "南山区",
    street: "科技园"
  }
})

// 查询嵌套字段
db.users.find({ "address.city": "深圳" })

// 查询嵌套对象
db.users.find({ address: { city: "深圳", district: "南山区" } })
```

### 6. 投影和限制

```javascript
// 投影 - 只返回指定字段
db.users.find({}, { name: 1, age: 1 })  // 只返回name和age
db.users.find({}, { name: 1, _id: 0 })  // 返回name，排除_id

// 限制结果数量
db.users.find().limit(5)

// 跳过文档
db.users.find().skip(10)

// 排序
db.users.find().sort({ age: 1 })   // 升序
db.users.find().sort({ age: -1 })  // 降序

// 组合使用
db.users.find()
  .sort({ age: -1 })
  .limit(5)
  .skip(10)
```

### 7. 查询单个文档

```javascript
// 查询第一个匹配的文档
db.users.findOne({ age: { $gt: 25 } })

// 查询并计数
db.users.countDocuments({ age: { $gt: 25 } })
```

## 🔄 Update - 更新操作

### 1. 更新单个文档

```javascript
// 使用 updateOne() 更新单个文档
db.users.updateOne(
  { name: "张三" },                    // 查询条件
  { $set: { age: 26, city: "上海" } }  // 更新操作
)

// 返回结果
{
  acknowledged: true,
  matchedCount: 1,
  modifiedCount: 1
}
```

### 2. 更新多个文档

```javascript
// 使用 updateMany() 更新多个文档
db.users.updateMany(
  { age: { $lt: 30 } },              // 查询条件
  { $set: { status: "young" } }       // 更新操作
)
```

### 3. 替换文档

```javascript
// 使用 replaceOne() 替换整个文档
db.users.replaceOne(
  { name: "张三" },
  {
    name: "张三",
    age: 26,
    email: "zhangsan@example.com",
    city: "上海",
    status: "active"
  }
)
```

### 4. 更新操作符

```javascript
// $set - 设置字段值
db.users.updateOne(
  { name: "张三" },
  { $set: { age: 26, city: "上海" } }
)

// $unset - 删除字段
db.users.updateOne(
  { name: "张三" },
  { $unset: { status: "" } }
)

// $inc - 增加数值
db.users.updateOne(
  { name: "张三" },
  { $inc: { age: 1 } }
)

// $mul - 乘以数值
db.users.updateOne(
  { name: "张三" },
  { $mul: { age: 1.1 } }
)

// $push - 向数组添加元素
db.users.updateOne(
  { name: "张三" },
  { $push: { hobbies: "跑步" } }
)

// $pull - 从数组删除元素
db.users.updateOne(
  { name: "张三" },
  { $pull: { hobbies: "跑步" } }
)

// $addToSet - 向数组添加唯一元素
db.users.updateOne(
  { name: "张三" },
  { $addToSet: { hobbies: "游泳" } }
)

// $pop - 删除数组首尾元素
db.users.updateOne(
  { name: "张三" },
  { $pop: { hobbies: 1 } }  // 1删除最后一个，-1删除第一个
)
```

### 5. 数组更新操作

```javascript
// 更新数组中的特定元素
db.users.updateOne(
  { name: "张三" },
  { $set: { "hobbies.0": "新爱好" } }
)

// 使用位置操作符 $ 更新匹配的数组元素
db.users.updateOne(
  { "hobbies": "游泳" },
  { $set: { "hobbies.$": "新游泳" } }
)

// 使用 $[] 更新所有数组元素
db.users.updateOne(
  { name: "张三" },
  { $set: { "hobbies.$[]": "更新后的爱好" } }
)
```

### 6. 更新选项

```javascript
// upsert - 如果不存在则插入
db.users.updateOne(
  { name: "新用户" },
  { $set: { age: 25, city: "北京" } },
  { upsert: true }
)

// arrayFilters - 条件更新数组元素
db.users.updateOne(
  { name: "张三" },
  { $set: { "scores.$[elem]": 100 } },
  { arrayFilters: [{ "elem": { $gte: 80 } }] }
)
```

## 🗑️ Delete - 删除操作

### 1. 删除单个文档

```javascript
// 使用 deleteOne() 删除单个文档
db.users.deleteOne({ name: "张三" })

// 返回结果
{
  acknowledged: true,
  deletedCount: 1
}
```

### 2. 删除多个文档

```javascript
// 使用 deleteMany() 删除多个文档
db.users.deleteMany({ age: { $lt: 25 } })

// 删除所有文档
db.users.deleteMany({})
```

### 3. 删除集合

```javascript
// 删除整个集合
db.users.drop()

// 删除数据库
db.dropDatabase()
```

## 🛠️ 实践练习

### 练习1：基础CRUD操作

1. 创建一个用户集合
2. 插入5个用户文档
3. 查询年龄大于25的用户
4. 更新所有用户的status字段
5. 删除年龄小于20的用户

### 练习2：复杂查询

1. 创建包含嵌套文档和数组的用户数据
2. 查询特定城市的用户
3. 查询有特定爱好的用户
4. 使用投影只返回需要的字段
5. 对结果进行排序和分页

### 练习3：数组操作

1. 创建包含成绩数组的学生文档
2. 向数组添加新成绩
3. 更新特定位置的成绩
4. 删除特定成绩
5. 查询成绩大于80的学生

## ❓ 常见问题

### Q: 如何批量插入大量数据？

A: 使用`insertMany()`方法，建议每批插入1000-5000个文档。

### Q: 更新操作会影响性能吗？

A: 是的，频繁更新会影响性能。建议合理设计文档结构，减少更新操作。

### Q: 如何避免重复插入？

A: 使用`upsert: true`选项，或者先查询再插入。

### Q: 删除操作可以撤销吗？

A: 不能直接撤销，建议先备份重要数据。

### Q: 如何优化查询性能？

A: 为常用查询字段创建索引，使用投影减少数据传输。

## ⚠️ 注意事项

1. **数据一致性** - 注意并发操作可能导致的数据不一致
2. **性能考虑** - 大量数据操作时考虑分批处理
3. **索引影响** - 更新操作会影响索引性能
4. **事务支持** - 复杂操作考虑使用事务
5. **备份策略** - 重要操作前先备份数据

## 🎯 学习检查

完成本课后，你应该能够：

- [ ] 执行基本的CRUD操作
- [ ] 使用各种查询条件
- [ ] 掌握更新操作符
- [ ] 处理数组和嵌套文档
- [ ] 优化查询性能

---

**下一步：** 学习 [04-query](./04-query.md) 查询操作详解
