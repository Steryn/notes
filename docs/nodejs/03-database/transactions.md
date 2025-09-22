# 事务处理

## 事务基础

事务是数据库操作的最小单位，它由一系列操作组成，这些操作要么全部成功执行，要么全部不执行。事务是保证数据一致性的关键机制。

## ACID特性

事务具有四个基本特性，通常称为ACID特性：

### 原子性（Atomicity）

事务是一个不可分割的工作单位，事务中的操作要么全部完成，要么全部不完成。如果事务中的任何操作失败，整个事务将被回滚到事务开始前的状态。

### 一致性（Consistency）

事务必须使数据库从一个一致性状态转换到另一个一致性状态。一致性确保了数据的完整性约束不被破坏。

### 隔离性（Isolation）

多个事务并发执行时，一个事务的执行不应影响其他事务的执行。隔离性确保了并发执行的事务如同串行执行一样。

### 持久性（Durability）

一旦事务提交，它对数据库的修改就是永久性的，即使系统发生故障也不会丢失。

## 事务的实现

### 事务的生命周期

1. **开始事务**：使用`BEGIN`或`START TRANSACTION`语句开始一个事务
2. **执行操作**：执行数据库操作（SELECT、INSERT、UPDATE、DELETE等）
3. **提交事务**：使用`COMMIT`语句提交事务，使所有操作永久生效
4. **回滚事务**：使用`ROLLBACK`语句回滚事务，撤销所有操作

### SQL事务示例

```sql
-- 开始事务
BEGIN;

-- 执行操作
UPDATE accounts SET balance = balance - 100 WHERE id = 1;
UPDATE accounts SET balance = balance + 100 WHERE id = 2;

-- 提交事务
COMMIT;
```

### 回滚示例

```sql
-- 开始事务
BEGIN;

-- 执行操作
UPDATE accounts SET balance = balance - 100 WHERE id = 1;
-- 假设这里发生错误
UPDATE accounts SET balance = balance + 100 WHERE id = 2;

-- 回滚事务
ROLLBACK;
```

## 隔离级别

SQL标准定义了四种隔离级别，用于控制事务之间的可见性和并发性：

### 读未提交（Read Uncommitted）

最低的隔离级别，允许一个事务读取另一个事务未提交的数据，可能导致脏读。

### 读已提交（Read Committed）

一个事务只能读取另一个事务已经提交的数据，可以防止脏读，但可能出现不可重复读。

### 可重复读（Repeatable Read）

在同一个事务中多次读取同一数据时，结果是一致的，可以防止脏读和不可重复读，但可能出现幻读。

### 串行化（Serializable）

最高的隔离级别，完全串行化事务执行，可以防止脏读、不可重复读和幻读，但并发性能最差。

## Node.js中的事务处理

### MySQL事务处理

```javascript
const mysql = require('mysql2/promise');

async function transferMoney(connection, fromId, toId, amount) {
  try {
    // 开始事务
    await connection.beginTransaction();
    
    // 执行操作
    await connection.execute(
      'UPDATE accounts SET balance = balance - ? WHERE id = ?',
      [amount, fromId]
    );
    
    await connection.execute(
      'UPDATE accounts SET balance = balance + ? WHERE id = ?',
      [amount, toId]
    );
    
    // 提交事务
    await connection.commit();
    console.log('转账成功');
  } catch (error) {
    // 回滚事务
    await connection.rollback();
    console.error('转账失败，事务已回滚:', error);
  }
}
```

### MongoDB事务处理

```javascript
const { MongoClient } = require('mongodb');

async function transferMoney(client, fromId, toId, amount) {
  const session = client.startSession();
  
  try {
    await session.withTransaction(async () => {
      const accounts = client.db('bank').collection('accounts');
      
      // 扣款
      await accounts.updateOne(
        { _id: fromId },
        { $inc: { balance: -amount } },
        { session }
      );
      
      // 存款
      await accounts.updateOne(
        { _id: toId },
        { $inc: { balance: amount } },
        { session }
      );
    });
    
    console.log('转账成功');
  } catch (error) {
    console.error('转账失败:', error);
  } finally {
    await session.endSession();
  }
}
```

## 分布式事务

在分布式系统中，事务可能涉及多个数据库或服务，这就需要分布式事务来保证一致性。

### 两阶段提交（2PC）

两阶段提交是实现分布式事务的经典协议：

1. **准备阶段**：协调者询问所有参与者是否可以提交事务
2. **提交阶段**：如果所有参与者都准备好了，协调者发送提交请求

### Saga模式

Saga是一种长事务的解决方案，将长事务拆分为多个短事务，每个短事务都有对应的补偿操作。

## 实践项目

在博客系统中实现评论功能的事务处理：

1. 用户发表评论时，同时更新文章的评论数
2. 确保这两个操作在同一个事务中执行
3. 处理事务失败的情况，确保数据一致性
