# 数据验证

## 概述

数据验证是保证系统数据正确性、一致性与安全性的关键环节。有效的验证应分层实施：从客户端、API 入参、应用服务、ORM 到数据库约束，并结合事务保证一致性。

## 验证分层与职责

- 客户端验证：提升体验，减少无效请求；不可作为安全边界。
- API 入参验证：拦截格式与基本规则错误（必填、类型、长度、枚举、正则）。
- 应用/领域校验：跨字段、跨资源、复杂业务规则（如“开始时间 < 结束时间”）。
- ORM 层验证：模型级规则、钩子、序列化/反序列化、默认值。
- 数据库约束：最终一致性与强约束（NOT NULL、CHECK、UNIQUE、FK、触发器）。

建议：所有层都要做，但以数据库约束作为最后的“地板”，防止绕过。

## 关系型数据库层验证（MySQL/PostgreSQL）

### 字段与表级约束

```sql
-- PostgreSQL 示例：用户表的强约束
CREATE TABLE users (
  id           BIGSERIAL PRIMARY KEY,
  email        VARCHAR(255) NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  password_hash TEXT NOT NULL,
  status       VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- 唯一性
  CONSTRAINT uq_users_email UNIQUE (email),
  -- 值域校验
  CONSTRAINT ck_users_status CHECK (status IN ('active','inactive','blocked'))
);

-- 复合唯一约束（同一商店下 SKU 唯一）
CREATE TABLE products (
  id        BIGSERIAL PRIMARY KEY,
  store_id  BIGINT NOT NULL,
  sku       VARCHAR(64) NOT NULL,
  name      VARCHAR(255) NOT NULL,
  price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
  
  CONSTRAINT uq_store_sku UNIQUE (store_id, sku),
  CONSTRAINT fk_products_store FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
);

-- 可延迟约束（事务提交时统一检查，仅 PostgreSQL）
ALTER TABLE products
  ADD CONSTRAINT ck_price_non_negative CHECK (price_cents >= 0) 
  DEFERRABLE INITIALLY DEFERRED;
```

要点：

- NOT NULL/DEFAULT：基础完整性；
- CHECK：数值范围、字符串模式、跨列简单表达式；
- UNIQUE/PK：强制唯一；
- FK：参照完整性与级联行为（CASCADE/RESTRICT/SET NULL）。

### 触发器与生成列（谨慎）

```sql
-- 生成列：标准化邮箱的小写影子列，配合唯一索引
ALTER TABLE users
ADD COLUMN email_norm TEXT GENERATED ALWAYS AS (lower(email)) STORED;
CREATE UNIQUE INDEX uq_users_email_norm ON users(email_norm);

-- 触发器：更新时间戳
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
```

注意：触发器可强化一致性，但复杂触发器可能影响可维护性与性能。

## MongoDB/NoSQL 层验证

### 集合级 JSON Schema 校验

```javascript
// Mongo Shell / Driver：创建集合并启用 JSON Schema 验证
db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['email', 'passwordHash', 'status'],
      properties: {
        email: { bsonType: 'string', pattern: "^.+@.+\\..+$" },
        passwordHash: { bsonType: 'string', minLength: 20 },
        status: { enum: ['active','inactive','blocked'] },
        createdAt: { bsonType: 'date' }
      }
    }
  },
  validationLevel: 'strict',    // off | moderate | strict
  validationAction: 'error'     // warn | error
});
```

配合唯一索引确保唯一性：

```javascript
db.users.createIndex({ email: 1 }, { unique: true });
```

### Mongoose 模型验证（应用侧 + 索引）

```javascript
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    match: /.+@.+\..+/
  },
  passwordHash: { type: String, required: true, minlength: 20 },
  status: { type: String, enum: ['active','inactive','blocked'], default: 'active' }
}, { timestamps: true });

userSchema.index({ email: 1 }, { unique: true });

// 自定义/异步校验
userSchema.path('email').validate(async function(value) {
  const count = await this.constructor.countDocuments({ email: value, _id: { $ne: this._id } });
  return count === 0;
}, 'Email 已存在');

module.exports = mongoose.model('User', userSchema);
```

## ORM 层验证

### Prisma + Zod（推荐组合）

```ts
// schema.prisma（唯一约束 + 枚举）
model User {
  id           BigInt   @id @default(autoincrement())
  email        String   @unique
  displayName  String
  passwordHash String
  status       Status   @default(active)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

enum Status { active inactive blocked }
```

```ts
// zod 校验入参
import { z } from 'zod';

export const createUserDto = z.object({
  email: z.string().email().max(255),
  displayName: z.string().min(1).max(100),
  password: z.string().min(8),
});
```

### Sequelize 内置验证

```js
const { DataTypes, Model } = require('sequelize');

class User extends Model {}

User.init({
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: { isEmail: true, len: [1, 255] }
  },
  displayName: { type: DataTypes.STRING(100), allowNull: false },
  passwordHash: { type: DataTypes.TEXT, allowNull: false, validate: { len: [20, 9999] } },
  status: { type: DataTypes.ENUM('active','inactive','blocked'), defaultValue: 'active' }
}, { sequelize, modelName: 'User', timestamps: true });
```

### TypeORM + class-validator

```ts
import { Entity, PrimaryGeneratedColumn, Column, Unique } from 'typeorm';
import { IsEmail, Length, IsIn } from 'class-validator';

@Entity('users')
@Unique(['email'])
export class User {
  @PrimaryGeneratedColumn('increment') id: number;

  @Column({ length: 255 })
  @IsEmail()
  email: string;

  @Column({ length: 100 })
  @Length(1, 100)
  displayName: string;

  @Column('text')
  @Length(20)
  passwordHash: string;

  @Column({ type: 'varchar', length: 20, default: 'active' })
  @IsIn(['active','inactive','blocked'])
  status: string;
}
```

## 应用层入参验证（Joi 示例）

```js
const Joi = require('joi');

const createUserSchema = Joi.object({
  email: Joi.string().email().max(255).required(),
  displayName: Joi.string().min(1).max(100).required(),
  password: Joi.string().min(8).required()
});

function validate(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
      return res.status(400).json({
        error: 'VALIDATION_FAILED',
        details: error.details.map(d => ({ field: d.path.join('.'), message: d.message }))
      });
    }
    req.validated = value;
    next();
  };
}
```

## 业务规则、交叉字段与唯一性

- 交叉字段：开始时间 < 结束时间；折扣价 < 原价；库存 >= 0。
- 存在性：引用的资源必须存在；删除时检查被引用计数。
- 唯一性：不要仅依赖“先查再插”，要以数据库唯一索引兜底，结合事务/幂等键。

```ts
// 以唯一约束落实最终一致性（伪代码）
try {
  await prisma.user.create({ data: { email, displayName, passwordHash } });
} catch (e) {
  if (e.code === 'P2002' /* Prisma Unique constraint failed */) {
    throw httpError(409, 'Email 已存在');
  }
  throw e;
}
```

## 数据清洗与规范化

- 字符串：trim、去重空格、归一化大小写（email 小写）。
- 电话/地址：E.164 规范化，统一区域码。
- 时间：统一使用 UTC 存储，界面按时区渲染。
- 金额：以最小货币单位整型存储（如分）。
- 文本安全：对富文本做白名单清洗，避免存储 XSS 载荷。

## 事务与并发一致性

- 将“验证 + 写入”置于同一事务中；
- 利用数据库唯一约束作为并发竞争的最终裁决；
- 乐观锁：版本号字段 version，每次更新 WHERE version = oldVersion；
- 可延迟约束（PostgreSQL）：跨步骤写入后在提交时统一检查。

## 性能考量

- 约束与索引会带来写入开销：为高基数、高频写列建立必要而非过度的索引；
- 批量导入：可分批、关闭/延迟二级索引构建，导入后再建索引；
- 校验成本前移：能在应用层提前失败的尽早失败，减少数据库往返；
- 大表新增非空列：先加可空列 -> 回填数据 -> 加默认 -> 改为 NOT NULL。

## 迁移与兼容策略

1) 向前兼容：先在代码支持新旧字段，再变更数据库；
2) 分步迁移：
   - 添加可空列/新枚举值；
   - 回填与双写；
   - 上线强约束/切换读路径；
   - 移除旧字段；
3) 验证：灰度与回滚预案，监控唯一冲突与约束错误率。

## 测试策略

- 单元测试：DTO/Schema 校验边界与错误消息；
- 集成测试：真实数据库的唯一约束、外键与事务回滚；
- 性能测试：批量写入时的约束开销与锁竞争；
- 模糊/属性测试：随机数据覆盖极端输入。

## 常见错误映射

- 400 Bad Request：入参格式/业务校验失败；
- 409 Conflict：唯一约束冲突（重复键）；
- 422 Unprocessable Entity：语义正确但业务不可达（如状态流转非法）；
- 500 Internal Server Error：未知数据库错误（记录详细日志，隐藏内部细节）。

## 最佳实践清单

- API 层永远做入参校验，数据库永远加最终约束；
- 所有“唯一性”由唯一索引落实；
- 使用事务包裹多步写入，失败要么全部回滚；
- 数据写入前做规范化（大小写、空白、单位、时区）；
- 对外返回稳定的错误码与可读信息，内部记录详细上下文；
- 迁移采用小步快跑 + 回滚预案；
- 在 CI 中加入 Schema 变更与迁移脚本的自动检查与回归测试。
