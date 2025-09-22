# Prisma使用

## 什么是Prisma

Prisma是一个现代化的数据库工具链，它提供了一种类型安全的方式来访问数据库。Prisma包含三个主要组件：Prisma Client（自动生成的类型安全数据库客户端）、Prisma Migrate（声明式数据建模和迁移系统）和Prisma Studio（数据库的可视化界面）。

Prisma的主要优势：

- 类型安全：自动生成TypeScript类型定义
- 开发者体验：直观的API和优秀的错误提示
- 数据库无关：支持多种数据库
- 性能优化：查询优化和批处理

## 安装与配置

### 安装Prisma

```bash
# 安装Prisma CLI
npm install prisma --save-dev

# 安装Prisma Client
npm install @prisma/client

# 初始化Prisma
npx prisma init
```

### 配置数据库连接

初始化后会创建`prisma`目录和`.env`文件：

`.env`文件：

```
DATABASE_URL="mysql://root:password@localhost:3306/my_database"
```

`prisma/schema.prisma`文件：

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

// 模型定义将在这里添加
```

### 数据建模

在`prisma/schema.prisma`中定义数据模型：

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

model User {
  id        Int      @id @default(autoincrement())
  name      String   @db.VarChar(50)
  email     String   @unique
  age       Int      @default(0)
  isActive  Boolean  @default(true)
  posts     Post[]
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@map("users")
}

model Post {
  id        Int      @id @default(autoincrement())
  title     String
  content   String?
  author    User     @relation(fields: [authorId], references: [id])
  authorId  Int
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@map("posts")
}
```

### 生成Prisma Client

```bash
# 生成Prisma Client
npx prisma generate

# 创建并应用迁移
npx prisma migrate dev --name init
```

## 基本操作

### 创建记录

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 创建单个记录
async function createUser() {
  try {
    const user = await prisma.user.create({
      data: {
        name: '张三',
        email: 'zhangsan@example.com',
        age: 25
      }
    });
    
    console.log('用户创建成功:', user);
  } catch (error) {
    console.error('创建失败:', error);
  }
}

// 创建记录并包含关联
async function createUserWithPost() {
  try {
    const user = await prisma.user.create({
      data: {
        name: '李四',
        email: 'lisi@example.com',
        posts: {
          create: {
            title: '我的第一篇博客',
            content: '这是文章内容'
          }
        }
      },
      include: {
        posts: true
      }
    });
    
    console.log('用户及文章创建成功:', user);
  } catch (error) {
    console.error('创建失败:', error);
  }
}

// 批量创建记录
async function createUsers() {
  try {
    const users = await prisma.user.createMany({
      data: [
        { name: '王五', email: 'wangwu@example.com', age: 30 },
        { name: '赵六', email: 'zhaoliu@example.com', age: 28 }
      ]
    });
    
    console.log('用户批量创建成功:', users);
  } catch (error) {
    console.error('批量创建失败:', error);
  }
}
```

### 查询记录

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 查找所有记录
async function findAllUsers() {
  try {
    const users = await prisma.user.findMany();
    console.log('所有用户:', users);
  } catch (error) {
    console.error('查询失败:', error);
  }
}

// 条件查询
async function findUsers() {
  try {
    // 简单条件
    const users = await prisma.user.findMany({
      where: {
        age: {
          gt: 18
        }
      },
      orderBy: {
        age: 'asc'
      },
      take: 10
    });

    // 复杂条件
    const complexUsers = await prisma.user.findMany({
      where: {
        OR: [
          { name: '张三' },
          { age: { gt: 25 } }
        ]
      }
    });

    console.log('条件查询结果:', users);
  } catch (error) {
    console.error('条件查询失败:', error);
  }
}

// 查找单个记录
async function findUser() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'zhangsan@example.com' }
    });

    if (user) {
      console.log('找到用户:', user);
    } else {
      console.log('未找到用户');
    }
  } catch (error) {
    console.error('查找失败:', error);
  }
}

// 包含关联查询
async function findUserWithPosts() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'zhangsan@example.com' },
      include: { posts: true }
    });

    if (user) {
      console.log('用户及其文章:', user);
    }
  } catch (error) {
    console.error('关联查询失败:', error);
  }
}
```

### 更新记录

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 更新记录
async function updateUser() {
  try {
    const user = await prisma.user.update({
      where: { email: 'zhangsan@example.com' },
      data: { age: 26 }
    });

    console.log('更新成功:', user);
  } catch (error) {
    console.error('更新失败:', error);
  }
}

// 条件更新
async function updateUsers() {
  try {
    const updatedUsers = await prisma.user.updateMany({
      where: { age: { lt: 18 } },
      data: { isActive: false }
    });

    console.log('批量更新成功:', updatedUsers);
  } catch (error) {
    console.error('批量更新失败:', error);
  }
}

// 更新或创建
async function upsertUser() {
  try {
    const user = await prisma.user.upsert({
      where: { email: 'newuser@example.com' },
      update: { age: 30 },
      create: {
        name: '新用户',
        email: 'newuser@example.com',
        age: 25
      }
    });

    console.log('更新或创建成功:', user);
  } catch (error) {
    console.error('更新或创建失败:', error);
  }
}
```

### 删除记录

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 删除记录
async function deleteUser() {
  try {
    const user = await prisma.user.delete({
      where: { email: 'zhangsan@example.com' }
    });

    console.log('删除成功:', user);
  } catch (error) {
    console.error('删除失败:', error);
  }
}

// 条件删除
async function deleteUsers() {
  try {
    const deletedUsers = await prisma.user.deleteMany({
      where: { isActive: false }
    });

    console.log('批量删除成功:', deletedUsers);
  } catch (error) {
    console.error('批量删除失败:', error);
  }
}
```

## 高级查询

### 聚合查询

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 聚合查询
async function aggregateUsers() {
  try {
    // 计数
    const count = await prisma.user.count({
      where: { isActive: true }
    });

    // 平均值
    const avgAge = await prisma.user.aggregate({
      _avg: {
        age: true
      }
    });

    // 分组聚合
    const groupByAge = await prisma.user.groupBy({
      by: ['age'],
      _count: {
        _all: true
      },
      orderBy: {
        age: 'asc'
      }
    });

    console.log('用户统计:', { count, avgAge, groupByAge });
  } catch (error) {
    console.error('聚合查询失败:', error);
  }
}
```

### 原始查询

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 原始查询
async function rawQuery() {
  try {
    // 查询
    const users = await prisma.$queryRaw`SELECT * FROM users WHERE age > 18`;

    // 执行
    await prisma.$executeRaw`UPDATE users SET is_active = 1 WHERE age > 18`;

    console.log('原始查询结果:', users);
  } catch (error) {
    console.error('原始查询失败:', error);
  }
}
```

## 事务处理

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 事务处理
async function transactionExample() {
  try {
    const [user, post] = await prisma.$transaction([
      prisma.user.create({
        data: {
          name: '事务用户',
          email: 'txuser@example.com'
        }
      }),
      prisma.post.create({
        data: {
          title: '事务文章',
          content: '文章内容',
          author: {
            connect: {
              email: 'txuser@example.com'
            }
          }
        }
      })
    ]);

    console.log('事务执行成功:', { user, post });
  } catch (error) {
    console.error('事务执行失败:', error);
  }
}

// 交互式事务
async function interactiveTransaction() {
  try {
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: '交互式事务用户',
          email: 'interactive@example.com'
        }
      });

      const post = await tx.post.create({
        data: {
          title: '交互式事务文章',
          content: '文章内容',
          authorId: user.id
        }
      });

      return { user, post };
    });

    console.log('交互式事务执行成功:', result);
  } catch (error) {
    console.error('交互式事务执行失败:', error);
  }
}
```

## 实践项目

在博客系统中使用Prisma实现数据模型：

1. 定义用户、文章、评论的数据模型
2. 使用Prisma Migrate创建数据库表
3. 实现基本的CRUD操作
4. 实现用户与文章、文章与评论的关联关系
5. 使用聚合查询统计文章数量、评论数量等
6. 使用事务处理文章发布和相关操作
