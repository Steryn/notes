# MongoDB基础

## 什么是MongoDB

MongoDB是一个开源的、面向文档的NoSQL数据库系统。它使用BSON（Binary JSON）格式存储数据，支持动态模式，具有高性能、高可用性和自动扩展性等特点。

## MongoDB的特点

### 面向文档

MongoDB以文档的形式存储数据，文档类似于JSON对象，但使用更丰富的数据类型。每个文档都有一个唯一的`_id`字段作为主键。

### 动态模式

MongoDB集合中的文档可以有不同的字段和结构，这使得数据模型更加灵活。

### 高性能

MongoDB支持内存计算，可以将工作集存储在内存中，提供高性能的数据访问。

### 高可用性

MongoDB通过副本集（Replica Set）提供高可用性，确保数据的冗余和故障恢复。

### 水平扩展

MongoDB通过分片（Sharding）支持水平扩展，可以将数据分布到多个服务器上。

## MongoDB核心概念

### 数据库（Database）

数据库是集合的容器，一个MongoDB实例可以包含多个数据库。

### 集合（Collection）

集合类似于关系型数据库中的表，是文档的容器。集合是动态模式的，不要求文档结构一致。

### 文档（Document）

文档是MongoDB中数据的基本单位，类似于关系型数据库中的行。文档使用BSON格式存储。

### 字段（Field）

字段是文档中的键值对，类似于关系型数据库中的列。

### _id字段

每个文档都有一个`_id`字段作为唯一标识符。如果没有指定，MongoDB会自动生成一个ObjectId。

## MongoDB安装与配置

### 安装MongoDB

在不同操作系统上安装MongoDB：

#### macOS

使用Homebrew安装：

```bash
brew tap mongodb/brew
brew install mongodb-community
```

#### Ubuntu

```bash
# 导入MongoDB公钥
wget -qO - https://www.mongodb.org/static/pgp/server-4.4.asc | sudo apt-key add -

# 添加MongoDB源
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/4.4 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-4.4.list

# 更新包列表并安装
sudo apt-get update
sudo apt-get install -y mongodb-org
```

### 启动MongoDB

```bash
# 启动MongoDB服务
sudo systemctl start mongod

# 验证服务状态
sudo systemctl status mongod
```

### 连接到MongoDB

使用MongoDB Shell连接：

```bash
mongo
```

## MongoDB基本操作

### 数据库操作

```javascript
// 查看所有数据库
show dbs

// 切换到指定数据库（如果不存在则创建）
db = db.getSiblingDB('myDatabase')

// 查看当前数据库
db

// 删除数据库
db.dropDatabase()
```

### 集合操作

```javascript
// 查看所有集合
show collections

// 创建集合
db.createCollection('users')

// 删除集合
db.users.drop()
```

### 文档操作

```javascript
// 插入文档
db.users.insertOne({
  name: "张三",
  age: 25,
  email: "zhangsan@example.com"
})

db.users.insertMany([
  { name: "李四", age: 30, email: "lisi@example.com" },
  { name: "王五", age: 28, email: "wangwu@example.com" }
])

// 查询文档
db.users.find()
db.users.find({ age: { $gt: 25 } })

// 更新文档
db.users.updateOne(
  { name: "张三" },
  { $set: { age: 26 } }
)

// 删除文档
db.users.deleteOne({ name: "张三" })
```

## MongoDB与Node.js集成

### 安装驱动

```bash
npm install mongodb
```

### 连接MongoDB

```javascript
const { MongoClient } = require('mongodb');

async function connectToMongo() {
  const uri = "mongodb://localhost:27017";
  const client = new MongoClient(uri);
  
  try {
    // 连接到MongoDB
    await client.connect();
    console.log("成功连接到MongoDB");
    
    // 使用数据库
    const database = client.db('myDatabase');
    const users = database.collection('users');
    
    // 执行操作
    // ...
    
  } catch (error) {
    console.error("连接失败:", error);
  } finally {
    // 关闭连接
    await client.close();
  }
}

connectToMongo();
```

## 实践项目

搭建MongoDB开发环境，并创建一个简单的用户管理系统，实现用户信息的增删改查功能。
