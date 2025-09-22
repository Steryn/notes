# TypeORM使用

## 什么是TypeORM

TypeORM是一个TypeScript和JavaScript的ORM库，支持多种数据库包括MySQL、PostgreSQL、MariaDB、SQLite、Oracle、Microsoft SQL Server等。它提供了装饰器、Active Record和Data Mapper模式等多种使用方式，特别适合TypeScript项目。

## 安装与配置

### 安装TypeORM

```bash
# 安装TypeORM
npm install typeorm

# 安装反射元数据支持
npm install reflect-metadata

# 安装数据库驱动（以MySQL为例）
npm install mysql2
```

### 配置TypeORM

创建`ormconfig.json`配置文件：

```json
{
  "type": "mysql",
  "host": "localhost",
  "port": 3306,
  "username": "root",
  "password": "password",
  "database": "my_database",
  "synchronize": true,
  "logging": false,
  "entities": [
    "src/entity/**/*.ts"
  ],
  "migrations": [
    "src/migration/**/*.ts"
  ],
  "subscribers": [
    "src/subscriber/**/*.ts"
  ]
}
```

或者使用TypeScript配置：

```typescript
// data-source.ts
import { DataSource } from "typeorm";

export const AppDataSource = new DataSource({
  type: "mysql",
  host: "localhost",
  port: 3306,
  username: "root",
  password: "password",
  database: "my_database",
  synchronize: true,
  logging: false,
  entities: [__dirname + "/entity/**/*.ts"],
  migrations: [__dirname + "/migration/**/*.ts"],
  subscribers: [__dirname + "/subscriber/**/*.ts"]
});
```

### 初始化数据源

```typescript
import { AppDataSource } from "./data-source";

AppDataSource.initialize()
  .then(() => {
    console.log("数据源初始化成功");
  })
  .catch((error) => {
    console.error("数据源初始化失败:", error);
  });
```

## 实体定义

### 基本实体定义

```typescript
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50 })
  name: string;

  @Column({ unique: true })
  email: string;

  @Column({ type: "tinyint", unsigned: true, default: 0 })
  age: number;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}
```

### 关系实体定义

```typescript
import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, ManyToMany, JoinTable } from "typeorm";
import { User } from "./User";

@Entity()
export class Post {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column("text")
  content: string;

  @ManyToOne(() => User, user => user.posts)
  author: User;

  @ManyToMany(() => User)
  @JoinTable()
  likedUsers: User[];
}

// 在User实体中添加关联
@Entity()
export class User {
  // ... 其他字段 ...

  @OneToMany(() => Post, post => post.author)
  posts: Post[];
}
```

## 基本操作

### 创建记录

```typescript
import { AppDataSource } from "../data-source";
import { User } from "../entity/User";

const userRepository = AppDataSource.getRepository(User);

// 创建单个记录
async function createUser() {
  try {
    const user = new User();
    user.name = "张三";
    user.email = "zhangsan@example.com";
    user.age = 25;

    const savedUser = await userRepository.save(user);
    console.log("用户创建成功:", savedUser);
  } catch (error) {
    console.error("创建失败:", error);
  }
}

// 批量创建记录
async function createUsers() {
  try {
    const users = [
      { name: "李四", email: "lisi@example.com", age: 30 },
      { name: "王五", email: "wangwu@example.com", age: 28 }
    ];

    const savedUsers = await userRepository.save(users);
    console.log("用户批量创建成功:", savedUsers);
  } catch (error) {
    console.error("批量创建失败:", error);
  }
}
```

### 查询记录

```typescript
import { AppDataSource } from "../data-source";
import { User } from "../entity/User";
import { Like, MoreThan } from "typeorm";

const userRepository = AppDataSource.getRepository(User);

// 查找所有记录
async function findAllUsers() {
  try {
    const users = await userRepository.find();
    console.log("所有用户:", users);
  } catch (error) {
    console.error("查询失败:", error);
  }
}

// 条件查询
async function findUsers() {
  try {
    // 简单条件
    const users = await userRepository.find({
      where: {
        age: MoreThan(18)
      },
      order: {
        age: "ASC"
      },
      take: 10
    });

    // 复杂条件
    const complexUsers = await userRepository.find({
      where: [
        { name: "张三" },
        { age: MoreThan(25) }
      ]
    });

    console.log("条件查询结果:", users);
  } catch (error) {
    console.error("条件查询失败:", error);
  }
}

// 查找单个记录
async function findUser() {
  try {
    const user = await userRepository.findOne({
      where: { name: "张三" }
    });

    if (user) {
      console.log("找到用户:", user);
    } else {
      console.log("未找到用户");
    }
  } catch (error) {
    console.error("查找失败:", error);
  }
}
```

### 更新记录

```typescript
import { AppDataSource } from "../data-source";
import { User } from "../entity/User";

const userRepository = AppDataSource.getRepository(User);

// 更新记录
async function updateUser() {
  try {
    await userRepository.update(
      { name: "张三" },
      { age: 26 }
    );

    console.log("更新成功");
  } catch (error) {
    console.error("更新失败:", error);
  }
}

// 查找并更新
async function findAndUpdateUser() {
  try {
    const user = await userRepository.findOne({
      where: { name: "张三" }
    });

    if (user) {
      user.age = 26;
      await userRepository.save(user);
      console.log("用户更新成功:", user);
    }
  } catch (error) {
    console.error("查找并更新失败:", error);
  }
}
```

### 删除记录

```typescript
import { AppDataSource } from "../data-source";
import { User } from "../entity/User";

const userRepository = AppDataSource.getRepository(User);

// 删除记录
async function deleteUser() {
  try {
    await userRepository.delete({ name: "张三" });
    console.log("删除成功");
  } catch (error) {
    console.error("删除失败:", error);
  }
}

// 查找并删除
async function findAndDeleteUser() {
  try {
    const user = await userRepository.findOne({
      where: { name: "张三" }
    });

    if (user) {
      await userRepository.remove(user);
      console.log("用户删除成功");
    }
  } catch (error) {
    console.error("查找并删除失败:", error);
  }
}
```

## 关联查询

### 使用关联

```typescript
import { AppDataSource } from "../data-source";
import { User } from "../entity/User";
import { Post } from "../entity/Post";

const userRepository = AppDataSource.getRepository(User);
const postRepository = AppDataSource.getRepository(Post);

// 创建用户和文章
async function createUserAndPost() {
  try {
    // 创建用户
    const user = new User();
    user.name = "张三";
    user.email = "zhangsan@example.com";
    const savedUser = await userRepository.save(user);

    // 创建文章
    const post = new Post();
    post.title = "我的第一篇博客";
    post.content = "这是文章内容";
    post.author = savedUser;
    
    const savedPost = await postRepository.save(post);
    console.log("文章创建成功:", savedPost);
  } catch (error) {
    console.error("创建失败:", error);
  }
}

// 查询用户及其文章
async function getUserWithPosts() {
  try {
    const user = await userRepository.findOne({
      where: { name: "张三" },
      relations: ["posts"]
    });

    if (user) {
      console.log("用户及其文章:", user);
    }
  } catch (error) {
    console.error("查询失败:", error);
  }
}
```

## 高级特性

### 查询构建器

```typescript
import { AppDataSource } from "../data-source";
import { User } from "../entity/User";

const userRepository = AppDataSource.getRepository(User);

// 使用查询构建器
async function advancedQuery() {
  try {
    const users = await userRepository
      .createQueryBuilder("user")
      .where("user.age > :age", { age: 18 })
      .andWhere("user.isActive = :active", { active: true })
      .orderBy("user.age", "ASC")
      .limit(10)
      .getMany();

    console.log("查询结果:", users);
  } catch (error) {
    console.error("查询失败:", error);
  }
}
```

### 事务处理

```typescript
import { AppDataSource } from "../data-source";
import { User } from "../entity/User";
import { Post } from "../entity/Post";

// 事务处理
async function transferOperation() {
  const queryRunner = AppDataSource.createQueryRunner();

  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    // 执行多个操作
    const user = new User();
    user.name = "新用户";
    user.email = "newuser@example.com";
    await queryRunner.manager.save(user);

    const post = new Post();
    post.title = "新文章";
    post.content = "文章内容";
    post.author = user;
    await queryRunner.manager.save(post);

    // 提交事务
    await queryRunner.commitTransaction();
    console.log("事务执行成功");
  } catch (error) {
    // 回滚事务
    await queryRunner.rollbackTransaction();
    console.error("事务执行失败:", error);
  } finally {
    // 释放连接
    await queryRunner.release();
  }
}
```

## 实践项目

在博客系统中使用TypeORM实现数据模型：

1. 创建用户实体（User）
2. 创建文章实体（Post）
3. 创建评论实体（Comment）
4. 实现实体间的关联关系
5. 实现基本的CRUD操作
6. 使用查询构建器优化复杂查询
