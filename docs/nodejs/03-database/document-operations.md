# 文档操作

## 插入文档

在MongoDB中，可以使用`insertOne()`和`insertMany()`方法向集合中插入文档。

### insertOne()

插入单个文档：

```javascript
// MongoDB Shell
db.users.insertOne({
  name: "张三",
  age: 25,
  email: "zhangsan@example.com",
  createdAt: new Date()
})

// Node.js
const result = await users.insertOne({
  name: "张三",
  age: 25,
  email: "zhangsan@example.com",
  createdAt: new Date()
});
console.log(`插入的文档ID: ${result.insertedId}`);
```

### insertMany()

插入多个文档：

```javascript
// MongoDB Shell
db.users.insertMany([
  {
    name: "李四",
    age: 30,
    email: "lisi@example.com",
    createdAt: new Date()
  },
  {
    name: "王五",
    age: 28,
    email: "wangwu@example.com",
    createdAt: new Date()
  }
])

// Node.js
const result = await users.insertMany([
  {
    name: "李四",
    age: 30,
    email: "lisi@example.com",
    createdAt: new Date()
  },
  {
    name: "王五",
    age: 28,
    email: "wangwu@example.com",
    createdAt: new Date()
  }
]);
console.log(`插入的文档数量: ${result.insertedCount}`);
console.log(`插入的文档ID: ${result.insertedIds}`);
```

## 查询文档

MongoDB提供了丰富的查询操作符来满足不同的查询需求。

### 基本查询

```javascript
// 查询所有文档
// MongoDB Shell
db.users.find()

// Node.js
const allUsers = await users.find({}).toArray();

// 查询特定文档
// MongoDB Shell
db.users.find({ name: "张三" })

// Node.js
const user = await users.findOne({ name: "张三" });
```

### 查询操作符

#### 比较操作符

```javascript
// 大于
// MongoDB Shell
db.users.find({ age: { $gt: 25 } })

// Node.js
const users = await users.find({ age: { $gt: 25 } }).toArray();

// 大于等于
// MongoDB Shell
db.users.find({ age: { $gte: 25 } })

// 小于
// MongoDB Shell
db.users.find({ age: { $lt: 30 } })

// 小于等于
// MongoDB Shell
db.users.find({ age: { $lte: 30 } })

// 不等于
// MongoDB Shell
db.users.find({ age: { $ne: 25 } })

// 在指定范围内
// MongoDB Shell
db.users.find({ age: { $in: [25, 30, 35] } })

// 不在指定范围内
// MongoDB Shell
db.users.find({ age: { $nin: [25, 30, 35] } })
```

#### 逻辑操作符

```javascript
// AND
// MongoDB Shell
db.users.find({ age: { $gt: 25 }, name: "张三" })

// OR
// MongoDB Shell
db.users.find({ $or: [{ age: { $gt: 25 } }, { name: "张三" }] })

// NOT
// MongoDB Shell
db.users.find({ age: { $not: { $gt: 25 } } })
```

### 字段操作符

```javascript
// 存在指定字段
// MongoDB Shell
db.users.find({ email: { $exists: true } })

// 字段值为null
// MongoDB Shell
db.users.find({ email: { $type: 10 } })  // 10表示null类型

// 正则表达式匹配
// MongoDB Shell
db.users.find({ name: { $regex: /^张/ } })
```

### 投影查询

只返回指定字段：

```javascript
// MongoDB Shell
db.users.find({}, { name: 1, age: 1, _id: 0 })

// Node.js
const users = await users.find({}, { projection: { name: 1, age: 1, _id: 0 } }).toArray();
```

### 排序和限制

```javascript
// 排序
// MongoDB Shell
db.users.find().sort({ age: 1 })  // 1表示升序，-1表示降序

// Node.js
const users = await users.find({}).sort({ age: 1 }).toArray();

// 限制返回数量
// MongoDB Shell
db.users.find().limit(5)

// Node.js
const users = await users.find({}).limit(5).toArray();

// 跳过指定数量
// MongoDB Shell
db.users.find().skip(10).limit(5)

// Node.js
const users = await users.find({}).skip(10).limit(5).toArray();
```

## 更新文档

MongoDB提供了多种更新操作符来修改文档。

### updateOne()

更新匹配的第一个文档：

```javascript
// MongoDB Shell
db.users.updateOne(
  { name: "张三" },
  { $set: { age: 26, updatedAt: new Date() } }
)

// Node.js
const result = await users.updateOne(
  { name: "张三" },
  { $set: { age: 26, updatedAt: new Date() } }
);
console.log(`匹配的文档数: ${result.matchedCount}`);
console.log(`修改的文档数: ${result.modifiedCount}`);
```

### updateMany()

更新匹配的所有文档：

```javascript
// MongoDB Shell
db.users.updateMany(
  { age: { $lt: 30 } },
  { $set: { category: "青年", updatedAt: new Date() } }
)

// Node.js
const result = await users.updateMany(
  { age: { $lt: 30 } },
  { $set: { category: "青年", updatedAt: new Date() } }
);
console.log(`匹配的文档数: ${result.matchedCount}`);
console.log(`修改的文档数: ${result.modifiedCount}`);
```

### 更新操作符

#### $set

设置字段值：

```javascript
// MongoDB Shell
db.users.updateOne(
  { name: "张三" },
  { $set: { age: 26, city: "北京" } }
)
```

#### $unset

删除字段：

```javascript
// MongoDB Shell
db.users.updateOne(
  { name: "张三" },
  { $unset: { city: "" } }
)
```

#### $inc

增加字段值：

```javascript
// MongoDB Shell
db.users.updateOne(
  { name: "张三" },
  { $inc: { age: 1 } }
)
```

#### $push

向数组字段添加元素：

```javascript
// MongoDB Shell
db.users.updateOne(
  { name: "张三" },
  { $push: { hobbies: "游泳" } }
)
```

#### $pull

从数组字段移除元素：

```javascript
// MongoDB Shell
db.users.updateOne(
  { name: "张三" },
  { $pull: { hobbies: "游泳" } }
)
```

## 删除文档

### deleteOne()

删除匹配的第一个文档：

```javascript
// MongoDB Shell
db.users.deleteOne({ name: "张三" })

// Node.js
const result = await users.deleteOne({ name: "张三" });
console.log(`删除的文档数: ${result.deletedCount}`);
```

### deleteMany()

删除匹配的所有文档：

```javascript
// MongoDB Shell
db.users.deleteMany({ age: { $lt: 18 } })

// Node.js
const result = await users.deleteMany({ age: { $lt: 18 } });
console.log(`删除的文档数: ${result.deletedCount}`);
```

## 批量操作

MongoDB支持批量操作来提高性能：

```javascript
// Node.js
const bulk = users.initializeUnorderedBulkOp();

bulk.insert({ name: "赵六", age: 22 });
bulk.insert({ name: "孙七", age: 24 });

bulk.find({ name: "张三" }).updateOne({ $set: { age: 27 } });
bulk.find({ name: "李四" }).removeOne();

const result = await bulk.execute();
```

## 实践项目

在博客系统中实现文章管理功能：

1. 创建文章集合，包含标题、内容、作者、标签等字段
2. 实现文章的增删改查功能
3. 支持按标签、作者等条件查询文章
4. 实现文章的分页查询功能
