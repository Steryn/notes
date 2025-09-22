# 聚合查询

## 聚合框架基础

MongoDB聚合框架是一种强大的数据处理工具，它允许用户通过一系列阶段（stages）对数据进行处理、转换和分析。聚合框架类似于Unix管道，文档通过一系列阶段进行处理，每个阶段都会对输入文档进行转换，并将结果传递给下一个阶段。

## 聚合管道

聚合管道是聚合框架的核心概念，它由多个阶段组成，每个阶段都对文档集合进行特定的操作。

### 基本语法

```javascript
// MongoDB Shell
db.collection.aggregate([
  { $stage1: { ... } },
  { $stage2: { ... } },
  // ...
])

// Node.js
const result = await collection.aggregate([
  { $stage1: { ... } },
  { $stage2: { ... } },
  // ...
]).toArray();
```

## 常用聚合阶段

### $match

用于过滤文档，类似于`find()`查询：

```javascript
// 查找年龄大于25的用户
db.users.aggregate([
  { $match: { age: { $gt: 25 } } }
])
```

### $project

用于选择、重命名或计算字段：

```javascript
// 只返回姓名和年龄字段，重命名age为userAge
db.users.aggregate([
  { $project: { name: 1, userAge: "$age" } }
])

// 添加计算字段
db.users.aggregate([
  { $project: { 
    name: 1, 
    age: 1,
    isAdult: { $gte: ["$age", 18] }
  } }
])
```

### $group

用于按指定字段分组文档，并对每组进行聚合计算：

```javascript
// 按城市分组，计算每组的用户数量和平均年龄
db.users.aggregate([
  {
    $group: {
      _id: "$city",
      count: { $sum: 1 },
      avgAge: { $avg: "$age" }
    }
  }
])

// 按年龄段分组
db.users.aggregate([
  {
    $group: {
      _id: {
        $switch: {
          branches: [
            { case: { $lt: ["$age", 18] }, then: "未成年" },
            { case: { $lt: ["$age", 60] }, then: "成年" }
          ],
          default: "老年"
        }
      },
      count: { $sum: 1 }
    }
  }
])
```

### $sort

用于对文档进行排序：

```javascript
// 按年龄升序排序
db.users.aggregate([
  { $sort: { age: 1 } }
])

// 按多个字段排序
db.users.aggregate([
  { $sort: { city: 1, age: -1 } }
])
```

### $limit 和 $skip

用于限制返回的文档数量和跳过指定数量的文档：

```javascript
// 跳过前10个文档，返回接下来的5个文档
db.users.aggregate([
  { $skip: 10 },
  { $limit: 5 }
])
```

### $unwind

用于展开数组字段，为数组中的每个元素创建一个文档：

```javascript
// 假设用户文档有hobbies数组字段
db.users.aggregate([
  { $unwind: "$hobbies" },
  { $project: { name: 1, hobby: "$hobbies" } }
])
```

## 聚合表达式

聚合表达式是聚合框架中的计算单元，可以在聚合阶段中使用。

### 算术表达式

```javascript
// 计算用户的BMI
db.users.aggregate([
  {
    $project: {
      name: 1,
      bmi: {
        $divide: [
          "$weight",
          { $pow: [{ $divide: ["$height", 100] }, 2] }
        ]
      }
    }
  }
])
```

### 日期表达式

```javascript
// 按年份分组用户
db.users.aggregate([
  {
    $group: {
      _id: { $year: "$createdAt" },
      count: { $sum: 1 }
    }
  }
])

// 添加计算字段：注册天数
db.users.aggregate([
  {
    $project: {
      name: 1,
      daysSinceRegistration: {
        $divide: [
          { $subtract: [new Date(), "$createdAt"] },
          1000 * 60 * 60 * 24
        ]
      }
    }
  }
])
```

### 条件表达式

```javascript
// 使用$cond进行条件判断
db.users.aggregate([
  {
    $project: {
      name: 1,
      status: {
        $cond: {
          if: { $gte: ["$age", 18] },
          then: "成年",
          else: "未成年"
        }
      }
    }
  }
])

// 使用$switch进行多条件判断
db.users.aggregate([
  {
    $project: {
      name: 1,
      category: {
        $switch: {
          branches: [
            { case: { $lt: ["$age", 13] }, then: "儿童" },
            { case: { $lt: ["$age", 20] }, then: "青少年" },
            { case: { $lt: ["$age", 60] }, then: "成年人" }
          ],
          default: "老年人"
        }
      }
    }
  }
])
```

## 实际应用场景

### 数据分析

```javascript
// 分析博客文章的统计数据
db.articles.aggregate([
  {
    $group: {
      _id: null,
      totalArticles: { $sum: 1 },
      avgViews: { $avg: "$views" },
      maxViews: { $max: "$views" },
      minViews: { $min: "$views" }
    }
  }
])
```

### 关联查询

```javascript
// 使用$lookup进行关联查询
db.articles.aggregate([
  {
    $lookup: {
      from: "comments",
      localField: "_id",
      foreignField: "articleId",
      as: "comments"
    }
  },
  {
    $project: {
      title: 1,
      commentCount: { $size: "$comments" }
    }
  }
])
```

### 数据转换

```javascript
// 将嵌套的评论结构扁平化
db.articles.aggregate([
  { $unwind: "$comments" },
  {
    $project: {
      articleTitle: "$title",
      commentAuthor: "$comments.author",
      commentContent: "$comments.content",
      commentDate: "$comments.date"
    }
  }
])
```

## 性能优化

### 索引优化

为聚合查询中的`$match`和`$sort`阶段创建合适的索引：

```javascript
// 为常用的聚合查询创建复合索引
db.users.createIndex({ city: 1, age: 1 });
```

### 阶段顺序

合理安排聚合阶段的顺序可以提高性能：

1. 尽早使用`$match`过滤数据
2. 使用`$project`减少不必要的字段
3. 尽量在管道早期阶段减少文档数量

```javascript
// 优化前
db.users.aggregate([
  { $sort: { age: 1 } },
  { $project: { name: 1, age: 1, city: 1 } },
  { $match: { city: "北京" } }
])

// 优化后
db.users.aggregate([
  { $match: { city: "北京" } },
  { $project: { name: 1, age: 1 } },
  { $sort: { age: 1 } }
])
```

## 实践项目

在博客系统中实现以下聚合查询功能：

1. 统计每篇文章的评论数量
2. 按月份统计文章发布数量
3. 找出评论最多的前10篇文章
4. 分析用户活跃度（按注册时间分组统计用户数量）
