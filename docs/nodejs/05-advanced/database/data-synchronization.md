# 数据同步

## 概述

数据同步是确保多个数据库实例之间数据一致性的过程。在分布式系统、主从复制、跨地域部署等场景中，数据同步是保证系统可靠性和一致性的关键技术。

## 同步模式

### 1. 实时同步
```javascript
// 实时数据同步管理器
class RealTimeSynchronizer {
  constructor(sourceDB, targetDBs, options = {}) {
    this.sourceDB = sourceDB;
    this.targetDBs = Array.isArray(targetDBs) ? targetDBs : [targetDBs];
    this.options = {
      batchSize: options.batchSize || 100,
      maxRetries: options.maxRetries || 3,
      retryDelay: options.retryDelay || 1000,
      enableConflictResolution: options.enableConflictResolution || false
    };
    
    this.changeLog = [];
    this.isRunning = false;
    this.syncQueue = [];
    this.conflictResolver = new ConflictResolver();
  }
  
  // 开始实时同步
  async startRealTimeSync() {
    if (this.isRunning) {
      console.log('实时同步已在运行');
      return;
    }
    
    this.isRunning = true;
    console.log('开始实时数据同步');
    
    // 监听源数据库变更
    await this.setupChangeCapture();
    
    // 启动同步处理器
    this.startSyncProcessor();
  }
  
  // 停止实时同步
  async stopRealTimeSync() {
    this.isRunning = false;
    console.log('停止实时数据同步');
  }
  
  // 设置变更捕获
  async setupChangeCapture() {
    // 使用数据库的变更数据捕获功能（CDC）
    // 这里使用一个简化的实现
    
    // MySQL binlog 监听示例
    if (this.sourceDB.type === 'mysql') {
      await this.setupMySQLBinlogCapture();
    }
    // PostgreSQL logical replication 示例
    else if (this.sourceDB.type === 'postgresql') {
      await this.setupPostgreSQLLogicalReplication();
    }
    // 通用轮询方式
    else {
      await this.setupPollingCapture();
    }
  }
  
  async setupMySQLBinlogCapture() {
    const MySQLEvents = require('@rodrigogs/mysql-events');
    
    const instance = new MySQLEvents({
      host: this.sourceDB.config.host,
      user: this.sourceDB.config.user,
      password: this.sourceDB.config.password
    }, {
      startAtEnd: true,
      excludedSchemas: {
        mysql: true,
        information_schema: true,
        performance_schema: true,
        sys: true
      }
    });
    
    instance.addTrigger({
      name: 'realtime_sync',
      expression: '*',
      statement: MySQLEvents.STATEMENTS.ALL,
      onEvent: (event) => {
        this.handleChangeEvent(event);
      }
    });
    
    await instance.start();
    console.log('MySQL Binlog 监听已启动');
  }
  
  async setupPostgreSQLLogicalReplication() {
    // PostgreSQL logical replication 实现
    const { Client } = require('pg');
    const client = new Client(this.sourceDB.config);
    
    await client.connect();
    
    // 创建复制槽
    await client.query(`
      SELECT * FROM pg_create_logical_replication_slot('sync_slot', 'pgoutput')
    `);
    
    // 监听变更
    const replicationClient = new Client({
      ...this.sourceDB.config,
      replication: 'database'
    });
    
    await replicationClient.connect();
    
    replicationClient.on('replicationMessage', (message) => {
      this.handlePostgreSQLChange(message);
    });
    
    console.log('PostgreSQL 逻辑复制已启动');
  }
  
  async setupPollingCapture() {
    // 通用轮询方式
    setInterval(async () => {
      if (!this.isRunning) return;
      
      try {
        const changes = await this.pollForChanges();
        changes.forEach(change => this.handleChangeEvent(change));
      } catch (error) {
        console.error('轮询变更失败:', error);
      }
    }, 1000); // 每秒轮询一次
  }
  
  async pollForChanges() {
    // 检查变更日志表
    const lastSyncTime = this.getLastSyncTime();
    
    const changes = await this.sourceDB.query(`
      SELECT * FROM change_log 
      WHERE created_at > ? 
      ORDER BY created_at ASC
      LIMIT ?
    `, [lastSyncTime, this.options.batchSize]);
    
    return changes;
  }
  
  // 处理变更事件
  handleChangeEvent(event) {
    const changeRecord = {
      id: this.generateChangeId(),
      timestamp: new Date(),
      operation: event.type || event.operation,
      table: event.table,
      data: event.after || event.data,
      oldData: event.before,
      binlogPosition: event.binlogPosition,
      retries: 0
    };
    
    this.syncQueue.push(changeRecord);
    this.changeLog.push(changeRecord);
    
    // 保持变更日志大小
    if (this.changeLog.length > 10000) {
      this.changeLog.shift();
    }
  }
  
  handlePostgreSQLChange(message) {
    // 解析PostgreSQL复制消息
    const changeRecord = this.parsePostgreSQLMessage(message);
    this.handleChangeEvent(changeRecord);
  }
  
  // 启动同步处理器
  startSyncProcessor() {
    const processSync = async () => {
      while (this.isRunning) {
        if (this.syncQueue.length > 0) {
          const batch = this.syncQueue.splice(0, this.options.batchSize);
          await this.processSyncBatch(batch);
        }
        
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    };
    
    processSync().catch(error => {
      console.error('同步处理器错误:', error);
    });
  }
  
  // 处理同步批次
  async processSyncBatch(batch) {
    const results = [];
    
    for (const change of batch) {
      try {
        const result = await this.syncChangeToTargets(change);
        results.push({ change, result, success: true });
      } catch (error) {
        console.error(`同步失败 ${change.id}:`, error);
        
        change.retries++;
        if (change.retries < this.options.maxRetries) {
          // 重新加入队列
          setTimeout(() => {
            this.syncQueue.push(change);
          }, this.options.retryDelay * change.retries);
        } else {
          console.error(`同步放弃 ${change.id}: 超过最大重试次数`);
        }
        
        results.push({ change, error: error.message, success: false });
      }
    }
    
    return results;
  }
  
  // 同步变更到目标数据库
  async syncChangeToTargets(change) {
    const promises = this.targetDBs.map(targetDB => 
      this.syncChangeToTarget(change, targetDB)
    );
    
    const results = await Promise.allSettled(promises);
    
    // 检查是否有失败
    const failures = results.filter(result => result.status === 'rejected');
    if (failures.length > 0) {
      throw new Error(`${failures.length}个目标数据库同步失败`);
    }
    
    return results;
  }
  
  // 同步变更到单个目标数据库
  async syncChangeToTarget(change, targetDB) {
    switch (change.operation.toLowerCase()) {
      case 'insert':
        return await this.handleInsert(change, targetDB);
      case 'update':
        return await this.handleUpdate(change, targetDB);
      case 'delete':
        return await this.handleDelete(change, targetDB);
      default:
        throw new Error(`不支持的操作类型: ${change.operation}`);
    }
  }
  
  async handleInsert(change, targetDB) {
    const columns = Object.keys(change.data);
    const values = Object.values(change.data);
    const placeholders = columns.map(() => '?').join(', ');
    
    const sql = `INSERT INTO ${change.table} (${columns.join(', ')}) VALUES (${placeholders})`;
    
    try {
      await targetDB.execute(sql, values);
    } catch (error) {
      // 处理重复键冲突
      if (error.code === 'ER_DUP_ENTRY' || error.code === '23505') {
        if (this.options.enableConflictResolution) {
          return await this.resolveInsertConflict(change, targetDB, error);
        }
      }
      throw error;
    }
  }
  
  async handleUpdate(change, targetDB) {
    const setClauses = Object.keys(change.data)
      .map(key => `${key} = ?`)
      .join(', ');
    
    const whereClause = this.buildWhereClause(change.oldData || change.data);
    const sql = `UPDATE ${change.table} SET ${setClauses} WHERE ${whereClause.clause}`;
    
    const values = [...Object.values(change.data), ...whereClause.values];
    
    const result = await targetDB.execute(sql, values);
    
    if (result.affectedRows === 0) {
      // 没有影响任何行，可能是数据不存在
      if (this.options.enableConflictResolution) {
        return await this.resolveUpdateConflict(change, targetDB);
      }
    }
    
    return result;
  }
  
  async handleDelete(change, targetDB) {
    const whereClause = this.buildWhereClause(change.oldData || change.data);
    const sql = `DELETE FROM ${change.table} WHERE ${whereClause.clause}`;
    
    return await targetDB.execute(sql, whereClause.values);
  }
  
  buildWhereClause(data) {
    const conditions = [];
    const values = [];
    
    Object.entries(data).forEach(([key, value]) => {
      if (value !== null) {
        conditions.push(`${key} = ?`);
        values.push(value);
      } else {
        conditions.push(`${key} IS NULL`);
      }
    });
    
    return {
      clause: conditions.join(' AND '),
      values: values
    };
  }
  
  // 冲突解决
  async resolveInsertConflict(change, targetDB, error) {
    return await this.conflictResolver.resolveInsertConflict(change, targetDB, error);
  }
  
  async resolveUpdateConflict(change, targetDB) {
    return await this.conflictResolver.resolveUpdateConflict(change, targetDB);
  }
  
  // 工具方法
  generateChangeId() {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  getLastSyncTime() {
    // 从持久化存储获取最后同步时间
    return new Date(Date.now() - 60000); // 默认1分钟前
  }
  
  parsePostgreSQLMessage(message) {
    // 解析PostgreSQL复制消息的实现
    return {
      operation: message.tag,
      table: message.relation,
      data: message.new,
      oldData: message.old
    };
  }
  
  // 获取同步统计
  getSyncStats() {
    const now = Date.now();
    const oneHourAgo = now - 3600000;
    
    const recentChanges = this.changeLog.filter(change => 
      change.timestamp.getTime() > oneHourAgo
    );
    
    return {
      totalChanges: this.changeLog.length,
      recentChanges: recentChanges.length,
      queueLength: this.syncQueue.length,
      isRunning: this.isRunning,
      lastChangeTime: this.changeLog.length > 0 ? 
        this.changeLog[this.changeLog.length - 1].timestamp : null
    };
  }
}
```

### 2. 批量同步
```javascript
// 批量数据同步管理器
class BatchSynchronizer {
  constructor(sourceDB, targetDB, options = {}) {
    this.sourceDB = sourceDB;
    this.targetDB = targetDB;
    this.options = {
      batchSize: options.batchSize || 1000,
      parallel: options.parallel || 4,
      compareMethod: options.compareMethod || 'checksum',
      syncDirection: options.syncDirection || 'source_to_target',
      conflictResolution: options.conflictResolution || 'source_wins'
    };
  }
  
  // 执行批量同步
  async executeBatchSync() {
    console.log('开始批量数据同步');
    const startTime = Date.now();
    
    try {
      // 1. 获取表列表
      const tables = await this.getTableList();
      
      // 2. 同步每个表
      const results = {
        totalTables: tables.length,
        syncedTables: 0,
        totalRows: 0,
        syncedRows: 0,
        conflicts: 0,
        errors: []
      };
      
      for (const table of tables) {
        try {
          const tableResult = await this.syncTable(table);
          results.syncedTables++;
          results.totalRows += tableResult.totalRows;
          results.syncedRows += tableResult.syncedRows;
          results.conflicts += tableResult.conflicts;
          
          console.log(`表${table}同步完成: ${tableResult.syncedRows}/${tableResult.totalRows}行`);
        } catch (error) {
          console.error(`表${table}同步失败:`, error);
          results.errors.push({
            table: table,
            error: error.message
          });
        }
      }
      
      const duration = Date.now() - startTime;
      results.duration = duration;
      
      console.log(`批量同步完成，耗时${duration}ms`);
      return results;
      
    } catch (error) {
      console.error('批量同步失败:', error);
      throw error;
    }
  }
  
  // 同步单个表
  async syncTable(tableName) {
    console.log(`开始同步表: ${tableName}`);
    
    const result = {
      totalRows: 0,
      syncedRows: 0,
      conflicts: 0
    };
    
    // 获取表结构
    const tableSchema = await this.getTableSchema(tableName);
    const primaryKeys = tableSchema.primaryKeys;
    
    if (primaryKeys.length === 0) {
      throw new Error(`表${tableName}没有主键，无法同步`);
    }
    
    // 分批处理数据
    let offset = 0;
    
    while (true) {
      const sourceBatch = await this.getTableBatch(this.sourceDB, tableName, offset, this.options.batchSize);
      
      if (sourceBatch.length === 0) break;
      
      const batchResult = await this.syncBatch(tableName, sourceBatch, primaryKeys);
      
      result.totalRows += sourceBatch.length;
      result.syncedRows += batchResult.syncedRows;
      result.conflicts += batchResult.conflicts;
      
      offset += this.options.batchSize;
    }
    
    return result;
  }
  
  // 同步批次数据
  async syncBatch(tableName, sourceBatch, primaryKeys) {
    const result = {
      syncedRows: 0,
      conflicts: 0
    };
    
    // 获取目标数据库中对应的数据
    const targetBatch = await this.getTargetBatch(tableName, sourceBatch, primaryKeys);
    
    // 比较和同步
    for (const sourceRow of sourceBatch) {
      const primaryKeyValues = primaryKeys.map(key => sourceRow[key]);
      const targetRow = targetBatch.find(row => 
        primaryKeys.every(key => row[key] === sourceRow[key])
      );
      
      if (!targetRow) {
        // 目标不存在，插入
        await this.insertRow(tableName, sourceRow);
        result.syncedRows++;
      } else {
        // 比较数据
        const isDifferent = await this.compareRows(sourceRow, targetRow);
        
        if (isDifferent) {
          // 处理冲突
          const conflictResult = await this.resolveConflict(tableName, sourceRow, targetRow, primaryKeys);
          
          if (conflictResult.resolved) {
            result.syncedRows++;
          }
          
          result.conflicts++;
        }
      }
    }
    
    return result;
  }
  
  // 获取表批次数据
  async getTableBatch(database, tableName, offset, limit) {
    const sql = `SELECT * FROM ${tableName} LIMIT ${limit} OFFSET ${offset}`;
    return await database.query(sql);
  }
  
  // 获取目标数据
  async getTargetBatch(tableName, sourceBatch, primaryKeys) {
    if (sourceBatch.length === 0) return [];
    
    // 构建 IN 查询
    const conditions = sourceBatch.map(row => {
      const keyConditions = primaryKeys.map(key => `${key} = ?`).join(' AND ');
      return `(${keyConditions})`;
    }).join(' OR ');
    
    const values = sourceBatch.flatMap(row => 
      primaryKeys.map(key => row[key])
    );
    
    const sql = `SELECT * FROM ${tableName} WHERE ${conditions}`;
    return await this.targetDB.query(sql, values);
  }
  
  // 比较两行数据
  async compareRows(sourceRow, targetRow) {
    switch (this.options.compareMethod) {
      case 'checksum':
        return this.compareByChecksum(sourceRow, targetRow);
      case 'field_by_field':
        return this.compareFieldByField(sourceRow, targetRow);
      case 'timestamp':
        return this.compareByTimestamp(sourceRow, targetRow);
      default:
        return this.compareFieldByField(sourceRow, targetRow);
    }
  }
  
  compareByChecksum(sourceRow, targetRow) {
    const sourceChecksum = this.calculateChecksum(sourceRow);
    const targetChecksum = this.calculateChecksum(targetRow);
    return sourceChecksum !== targetChecksum;
  }
  
  compareFieldByField(sourceRow, targetRow) {
    const sourceKeys = Object.keys(sourceRow);
    const targetKeys = Object.keys(targetRow);
    
    if (sourceKeys.length !== targetKeys.length) return true;
    
    return sourceKeys.some(key => sourceRow[key] !== targetRow[key]);
  }
  
  compareByTimestamp(sourceRow, targetRow) {
    const sourceTimestamp = sourceRow.updated_at || sourceRow.modified_at;
    const targetTimestamp = targetRow.updated_at || targetRow.modified_at;
    
    if (!sourceTimestamp || !targetTimestamp) {
      return this.compareFieldByField(sourceRow, targetRow);
    }
    
    return new Date(sourceTimestamp) > new Date(targetTimestamp);
  }
  
  calculateChecksum(row) {
    const crypto = require('crypto');
    const data = JSON.stringify(row, Object.keys(row).sort());
    return crypto.createHash('md5').update(data).digest('hex');
  }
  
  // 插入新行
  async insertRow(tableName, row) {
    const columns = Object.keys(row);
    const values = Object.values(row);
    const placeholders = columns.map(() => '?').join(', ');
    
    const sql = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`;
    
    try {
      await this.targetDB.execute(sql, values);
    } catch (error) {
      // 处理插入失败
      console.error(`插入失败 ${tableName}:`, error);
      throw error;
    }
  }
  
  // 解决冲突
  async resolveConflict(tableName, sourceRow, targetRow, primaryKeys) {
    switch (this.options.conflictResolution) {
      case 'source_wins':
        return await this.updateTargetRow(tableName, sourceRow, primaryKeys);
      case 'target_wins':
        return { resolved: false, reason: 'target_wins_policy' };
      case 'timestamp':
        return await this.resolveByTimestamp(tableName, sourceRow, targetRow, primaryKeys);
      case 'manual':
        return await this.flagForManualResolution(tableName, sourceRow, targetRow);
      default:
        return await this.updateTargetRow(tableName, sourceRow, primaryKeys);
    }
  }
  
  async updateTargetRow(tableName, row, primaryKeys) {
    const nonKeyColumns = Object.keys(row).filter(key => !primaryKeys.includes(key));
    
    const setClauses = nonKeyColumns.map(key => `${key} = ?`).join(', ');
    const whereClause = primaryKeys.map(key => `${key} = ?`).join(' AND ');
    
    const sql = `UPDATE ${tableName} SET ${setClauses} WHERE ${whereClause}`;
    const values = [
      ...nonKeyColumns.map(key => row[key]),
      ...primaryKeys.map(key => row[key])
    ];
    
    try {
      await this.targetDB.execute(sql, values);
      return { resolved: true };
    } catch (error) {
      console.error(`更新失败 ${tableName}:`, error);
      return { resolved: false, error: error.message };
    }
  }
  
  async resolveByTimestamp(tableName, sourceRow, targetRow, primaryKeys) {
    const sourceTime = sourceRow.updated_at || sourceRow.modified_at;
    const targetTime = targetRow.updated_at || targetRow.modified_at;
    
    if (sourceTime && targetTime) {
      if (new Date(sourceTime) > new Date(targetTime)) {
        return await this.updateTargetRow(tableName, sourceRow, primaryKeys);
      } else {
        return { resolved: false, reason: 'target_is_newer' };
      }
    }
    
    // 没有时间戳，默认使用源数据
    return await this.updateTargetRow(tableName, sourceRow, primaryKeys);
  }
  
  async flagForManualResolution(tableName, sourceRow, targetRow) {
    // 将冲突记录到冲突表中
    const conflictRecord = {
      table_name: tableName,
      source_data: JSON.stringify(sourceRow),
      target_data: JSON.stringify(targetRow),
      created_at: new Date(),
      status: 'pending'
    };
    
    await this.targetDB.execute(`
      INSERT INTO sync_conflicts (table_name, source_data, target_data, created_at, status)
      VALUES (?, ?, ?, ?, ?)
    `, Object.values(conflictRecord));
    
    return { resolved: false, reason: 'flagged_for_manual_resolution' };
  }
  
  // 获取表列表
  async getTableList() {
    const tables = await this.sourceDB.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = DATABASE() AND table_type = 'BASE TABLE'
    `);
    
    return tables.map(t => t.table_name);
  }
  
  // 获取表结构
  async getTableSchema(tableName) {
    const columns = await this.sourceDB.query(`
      SELECT column_name, column_key 
      FROM information_schema.columns 
      WHERE table_name = ? AND table_schema = DATABASE()
    `, [tableName]);
    
    const primaryKeys = columns
      .filter(col => col.column_key === 'PRI')
      .map(col => col.column_name);
    
    return {
      tableName: tableName,
      columns: columns.map(col => col.column_name),
      primaryKeys: primaryKeys
    };
  }
}
```

### 3. 双向同步
```javascript
// 双向数据同步管理器
class BidirectionalSynchronizer {
  constructor(database1, database2, options = {}) {
    this.db1 = database1;
    this.db2 = database2;
    this.options = {
      conflictResolution: options.conflictResolution || 'timestamp',
      syncInterval: options.syncInterval || 60000, // 1分钟
      enableRealTime: options.enableRealTime || false
    };
    
    this.syncHistory = [];
    this.conflicts = [];
    this.isRunning = false;
  }
  
  // 开始双向同步
  async startBidirectionalSync() {
    if (this.isRunning) {
      console.log('双向同步已在运行');
      return;
    }
    
    this.isRunning = true;
    console.log('开始双向数据同步');
    
    // 初始化同步表
    await this.initializeSyncTables();
    
    if (this.options.enableRealTime) {
      // 实时同步
      await this.setupRealTimeBidirectionalSync();
    } else {
      // 定时同步
      this.startPeriodicSync();
    }
  }
  
  // 停止双向同步
  async stopBidirectionalSync() {
    this.isRunning = false;
    console.log('停止双向数据同步');
  }
  
  // 初始化同步表
  async initializeSyncTables() {
    const syncTableSQL = `
      CREATE TABLE IF NOT EXISTS sync_metadata (
        id VARCHAR(255) PRIMARY KEY,
        table_name VARCHAR(255) NOT NULL,
        record_id VARCHAR(255) NOT NULL,
        last_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        source_db ENUM('db1', 'db2') NOT NULL,
        checksum VARCHAR(32),
        INDEX idx_table_record (table_name, record_id)
      )
    `;
    
    await Promise.all([
      this.db1.execute(syncTableSQL),
      this.db2.execute(syncTableSQL)
    ]);
  }
  
  // 设置实时双向同步
  async setupRealTimeBidirectionalSync() {
    // 为两个数据库设置变更监听
    const sync1to2 = new RealTimeSynchronizer(this.db1, [this.db2], {
      enableConflictResolution: true
    });
    
    const sync2to1 = new RealTimeSynchronizer(this.db2, [this.db1], {
      enableConflictResolution: true
    });
    
    // 设置冲突检测
    sync1to2.onConflict = (change) => this.handleBidirectionalConflict(change, 'db1_to_db2');
    sync2to1.onConflict = (change) => this.handleBidirectionalConflict(change, 'db2_to_db1');
    
    await Promise.all([
      sync1to2.startRealTimeSync(),
      sync2to1.startRealTimeSync()
    ]);
  }
  
  // 开始定时同步
  startPeriodicSync() {
    const syncProcess = async () => {
      while (this.isRunning) {
        try {
          await this.performBidirectionalSync();
        } catch (error) {
          console.error('双向同步错误:', error);
        }
        
        await new Promise(resolve => setTimeout(resolve, this.options.syncInterval));
      }
    };
    
    syncProcess().catch(error => {
      console.error('同步进程错误:', error);
    });
  }
  
  // 执行双向同步
  async performBidirectionalSync() {
    console.log('执行双向同步...');
    
    const tables = await this.getCommonTables();
    const syncResults = {
      tablesProcessed: 0,
      conflictsResolved: 0,
      errors: []
    };
    
    for (const table of tables) {
      try {
        const result = await this.syncTableBidirectionally(table);
        syncResults.tablesProcessed++;
        syncResults.conflictsResolved += result.conflictsResolved;
      } catch (error) {
        console.error(`表${table}双向同步失败:`, error);
        syncResults.errors.push({
          table: table,
          error: error.message
        });
      }
    }
    
    this.syncHistory.push({
      timestamp: new Date(),
      results: syncResults
    });
    
    return syncResults;
  }
  
  // 双向同步单个表
  async syncTableBidirectionally(tableName) {
    const result = {
      conflictsResolved: 0
    };
    
    // 获取两个数据库的数据
    const [data1, data2] = await Promise.all([
      this.getTableData(this.db1, tableName),
      this.getTableData(this.db2, tableName)
    ]);
    
    // 获取同步元数据
    const [metadata1, metadata2] = await Promise.all([
      this.getSyncMetadata(this.db1, tableName),
      this.getSyncMetadata(this.db2, tableName)
    ]);
    
    // 比较和同步
    const conflicts = await this.compareAndSync(tableName, data1, data2, metadata1, metadata2);
    
    result.conflictsResolved = conflicts.length;
    this.conflicts.push(...conflicts);
    
    return result;
  }
  
  // 比较和同步数据
  async compareAndSync(tableName, data1, data2, metadata1, metadata2) {
    const conflicts = [];
    const allRecords = new Map();
    
    // 收集所有记录
    data1.forEach(record => {
      const key = this.getRecordKey(record);
      allRecords.set(key, { db1: record, db2: null });
    });
    
    data2.forEach(record => {
      const key = this.getRecordKey(record);
      if (allRecords.has(key)) {
        allRecords.get(key).db2 = record;
      } else {
        allRecords.set(key, { db1: null, db2: record });
      }
    });
    
    // 处理每个记录
    for (const [key, records] of allRecords) {
      const conflict = await this.resolveRecordConflict(
        tableName, key, records, metadata1, metadata2
      );
      
      if (conflict) {
        conflicts.push(conflict);
      }
    }
    
    return conflicts;
  }
  
  // 解决记录冲突
  async resolveRecordConflict(tableName, recordKey, records, metadata1, metadata2) {
    const { db1: record1, db2: record2 } = records;
    
    if (!record1 && !record2) return null;
    
    // 只在一个数据库中存在
    if (!record1) {
      await this.copyRecord(record2, this.db2, this.db1, tableName);
      return null;
    }
    
    if (!record2) {
      await this.copyRecord(record1, this.db1, this.db2, tableName);
      return null;
    }
    
    // 两个数据库都存在，检查是否一致
    if (this.recordsEqual(record1, record2)) {
      return null; // 数据一致，无需同步
    }
    
    // 数据不一致，需要解决冲突
    const resolution = await this.resolveBidirectionalConflict(
      tableName, recordKey, record1, record2, metadata1, metadata2
    );
    
    return {
      table: tableName,
      recordKey: recordKey,
      resolution: resolution,
      timestamp: new Date()
    };
  }
  
  // 解决双向冲突
  async resolveBidirectionalConflict(tableName, recordKey, record1, record2, metadata1, metadata2) {
    const meta1 = metadata1.get(recordKey);
    const meta2 = metadata2.get(recordKey);
    
    switch (this.options.conflictResolution) {
      case 'timestamp':
        return await this.resolveByTimestamp(tableName, record1, record2, meta1, meta2);
      case 'source_priority':
        return await this.resolveBySourcePriority(tableName, record1, record2, meta1, meta2);
      case 'manual':
        return await this.flagForManualResolution(tableName, recordKey, record1, record2);
      default:
        return await this.resolveByTimestamp(tableName, record1, record2, meta1, meta2);
    }
  }
  
  async resolveByTimestamp(tableName, record1, record2, meta1, meta2) {
    const time1 = meta1?.last_modified || record1.updated_at || record1.created_at;
    const time2 = meta2?.last_modified || record2.updated_at || record2.created_at;
    
    if (!time1 && !time2) {
      // 没有时间信息，默认使用db1的数据
      await this.copyRecord(record1, this.db1, this.db2, tableName);
      return 'db1_wins_no_timestamp';
    }
    
    if (new Date(time1) > new Date(time2)) {
      await this.copyRecord(record1, this.db1, this.db2, tableName);
      return 'db1_wins_newer';
    } else {
      await this.copyRecord(record2, this.db2, this.db1, tableName);
      return 'db2_wins_newer';
    }
  }
  
  // 复制记录
  async copyRecord(record, sourceDB, targetDB, tableName) {
    const columns = Object.keys(record);
    const values = Object.values(record);
    const placeholders = columns.map(() => '?').join(', ');
    
    // 先尝试更新
    const updateClauses = columns.map(col => `${col} = ?`).join(', ');
    const primaryKey = this.getPrimaryKeyColumn(tableName);
    const updateSQL = `UPDATE ${tableName} SET ${updateClauses} WHERE ${primaryKey} = ?`;
    
    try {
      const result = await targetDB.execute(updateSQL, [...values, record[primaryKey]]);
      
      if (result.affectedRows === 0) {
        // 记录不存在，插入
        const insertSQL = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`;
        await targetDB.execute(insertSQL, values);
      }
    } catch (error) {
      console.error(`复制记录失败 ${tableName}:`, error);
      throw error;
    }
  }
  
  // 工具方法
  async getTableData(database, tableName) {
    return await database.query(`SELECT * FROM ${tableName}`);
  }
  
  async getSyncMetadata(database, tableName) {
    const metadata = await database.query(
      `SELECT record_id, last_modified, checksum FROM sync_metadata WHERE table_name = ?`,
      [tableName]
    );
    
    const metadataMap = new Map();
    metadata.forEach(meta => {
      metadataMap.set(meta.record_id, meta);
    });
    
    return metadataMap;
  }
  
  async getCommonTables() {
    const [tables1, tables2] = await Promise.all([
      this.db1.query(`SHOW TABLES`),
      this.db2.query(`SHOW TABLES`)
    ]);
    
    const tableNames1 = new Set(tables1.map(t => Object.values(t)[0]));
    const tableNames2 = new Set(tables2.map(t => Object.values(t)[0]));
    
    return [...tableNames1].filter(table => tableNames2.has(table));
  }
  
  getRecordKey(record) {
    // 简化实现，假设使用id作为主键
    return record.id?.toString() || JSON.stringify(record);
  }
  
  recordsEqual(record1, record2) {
    return JSON.stringify(record1) === JSON.stringify(record2);
  }
  
  getPrimaryKeyColumn(tableName) {
    // 简化实现，假设使用id作为主键
    return 'id';
  }
  
  handleBidirectionalConflict(change, direction) {
    console.log(`双向同步冲突: ${direction}`, change);
    // 处理实时同步中的冲突
  }
}
```

## 冲突解决

### 1. 冲突解决器
```javascript
// 数据同步冲突解决器
class ConflictResolver {
  constructor(options = {}) {
    this.options = {
      defaultStrategy: options.defaultStrategy || 'timestamp',
      customResolvers: options.customResolvers || {},
      logConflicts: options.logConflicts !== false
    };
    
    this.conflictLog = [];
  }
  
  // 解决插入冲突
  async resolveInsertConflict(change, targetDB, error) {
    const conflict = {
      type: 'insert_conflict',
      table: change.table,
      data: change.data,
      error: error.message,
      timestamp: new Date()
    };
    
    this.logConflict(conflict);
    
    // 尝试转为更新操作
    try {
      const primaryKey = this.extractPrimaryKey(change.data);
      if (primaryKey) {
        return await this.convertInsertToUpdate(change, targetDB, primaryKey);
      }
    } catch (updateError) {
      console.error('转为更新操作失败:', updateError);
    }
    
    // 如果转为更新也失败，记录冲突
    return await this.logUnresolvedConflict(conflict);
  }
  
  // 解决更新冲突
  async resolveUpdateConflict(change, targetDB) {
    const conflict = {
      type: 'update_conflict',
      table: change.table,
      data: change.data,
      oldData: change.oldData,
      timestamp: new Date()
    };
    
    this.logConflict(conflict);
    
    // 检查目标记录是否存在
    const targetRecord = await this.findTargetRecord(change, targetDB);
    
    if (!targetRecord) {
      // 记录不存在，转为插入操作
      return await this.convertUpdateToInsert(change, targetDB);
    }
    
    // 记录存在，根据策略解决冲突
    return await this.resolveDataConflict(change, targetRecord, targetDB);
  }
  
  // 解决数据冲突
  async resolveDataConflict(change, targetRecord, targetDB) {
    const strategy = this.getResolutionStrategy(change.table);
    
    switch (strategy) {
      case 'source_wins':
        return await this.applySourceWins(change, targetDB);
      case 'target_wins':
        return { resolved: false, reason: 'target_wins_policy' };
      case 'timestamp':
        return await this.resolveByTimestamp(change, targetRecord, targetDB);
      case 'merge':
        return await this.mergeRecords(change, targetRecord, targetDB);
      case 'custom':
        return await this.applyCustomResolution(change, targetRecord, targetDB);
      default:
        return await this.resolveByTimestamp(change, targetRecord, targetDB);
    }
  }
  
  async applySourceWins(change, targetDB) {
    const columns = Object.keys(change.data);
    const values = Object.values(change.data);
    
    const setClauses = columns.map(col => `${col} = ?`).join(', ');
    const whereClause = this.buildWhereClause(change.oldData || change.data);
    
    const sql = `UPDATE ${change.table} SET ${setClauses} WHERE ${whereClause.clause}`;
    const allValues = [...values, ...whereClause.values];
    
    try {
      await targetDB.execute(sql, allValues);
      return { resolved: true, strategy: 'source_wins' };
    } catch (error) {
      return { resolved: false, error: error.message };
    }
  }
  
  async resolveByTimestamp(change, targetRecord, targetDB) {
    const sourceTime = this.extractTimestamp(change.data);
    const targetTime = this.extractTimestamp(targetRecord);
    
    if (!sourceTime || !targetTime) {
      // 没有时间戳，默认使用源数据
      return await this.applySourceWins(change, targetDB);
    }
    
    if (new Date(sourceTime) > new Date(targetTime)) {
      return await this.applySourceWins(change, targetDB);
    } else {
      return { resolved: false, reason: 'target_is_newer' };
    }
  }
  
  async mergeRecords(change, targetRecord, targetDB) {
    const mergedData = { ...targetRecord, ...change.data };
    
    // 更新时间戳
    mergedData.updated_at = new Date();
    
    const columns = Object.keys(mergedData);
    const values = Object.values(mergedData);
    const setClauses = columns.map(col => `${col} = ?`).join(', ');
    const whereClause = this.buildWhereClause(change.oldData || change.data);
    
    const sql = `UPDATE ${change.table} SET ${setClauses} WHERE ${whereClause.clause}`;
    const allValues = [...values, ...whereClause.values];
    
    try {
      await targetDB.execute(sql, allValues);
      return { resolved: true, strategy: 'merge', mergedData };
    } catch (error) {
      return { resolved: false, error: error.message };
    }
  }
  
  async applyCustomResolution(change, targetRecord, targetDB) {
    const customResolver = this.options.customResolvers[change.table];
    
    if (!customResolver) {
      return await this.resolveByTimestamp(change, targetRecord, targetDB);
    }
    
    try {
      return await customResolver(change, targetRecord, targetDB);
    } catch (error) {
      console.error('自定义解决器失败:', error);
      return { resolved: false, error: error.message };
    }
  }
  
  // 工具方法
  async convertInsertToUpdate(change, targetDB, primaryKey) {
    const columns = Object.keys(change.data).filter(col => col !== primaryKey);
    const values = columns.map(col => change.data[col]);
    const setClauses = columns.map(col => `${col} = ?`).join(', ');
    
    const sql = `UPDATE ${change.table} SET ${setClauses} WHERE ${primaryKey} = ?`;
    const allValues = [...values, change.data[primaryKey]];
    
    await targetDB.execute(sql, allValues);
    return { resolved: true, strategy: 'convert_to_update' };
  }
  
  async convertUpdateToInsert(change, targetDB) {
    const columns = Object.keys(change.data);
    const values = Object.values(change.data);
    const placeholders = columns.map(() => '?').join(', ');
    
    const sql = `INSERT INTO ${change.table} (${columns.join(', ')}) VALUES (${placeholders})`;
    
    await targetDB.execute(sql, values);
    return { resolved: true, strategy: 'convert_to_insert' };
  }
  
  async findTargetRecord(change, targetDB) {
    const whereClause = this.buildWhereClause(change.oldData || change.data);
    const sql = `SELECT * FROM ${change.table} WHERE ${whereClause.clause} LIMIT 1`;
    
    const result = await targetDB.query(sql, whereClause.values);
    return result.length > 0 ? result[0] : null;
  }
  
  extractPrimaryKey(data) {
    // 简化实现，假设使用id作为主键
    return data.id ? 'id' : null;
  }
  
  extractTimestamp(data) {
    return data.updated_at || data.modified_at || data.created_at;
  }
  
  buildWhereClause(data) {
    const conditions = [];
    const values = [];
    
    Object.entries(data).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        conditions.push(`${key} = ?`);
        values.push(value);
      } else {
        conditions.push(`${key} IS NULL`);
      }
    });
    
    return {
      clause: conditions.join(' AND '),
      values: values
    };
  }
  
  getResolutionStrategy(tableName) {
    return this.options.customResolvers[tableName]?.strategy || this.options.defaultStrategy;
  }
  
  logConflict(conflict) {
    if (this.options.logConflicts) {
      this.conflictLog.push(conflict);
      console.log('数据同步冲突:', conflict);
      
      // 保持冲突日志大小
      if (this.conflictLog.length > 1000) {
        this.conflictLog.shift();
      }
    }
  }
  
  async logUnresolvedConflict(conflict) {
    // 将未解决的冲突记录到数据库中
    console.error('未解决的数据同步冲突:', conflict);
    return { resolved: false, logged: true };
  }
  
  // 获取冲突统计
  getConflictStats() {
    const stats = {
      total: this.conflictLog.length,
      byType: {},
      byTable: {},
      recent: this.conflictLog.slice(-10)
    };
    
    this.conflictLog.forEach(conflict => {
      stats.byType[conflict.type] = (stats.byType[conflict.type] || 0) + 1;
      stats.byTable[conflict.table] = (stats.byTable[conflict.table] || 0) + 1;
    });
    
    return stats;
  }
}
```

## 总结

数据同步的关键要点：

1. **同步模式选择**：实时、批量、双向同步适用不同场景
2. **变更捕获**：CDC、binlog、逻辑复制等技术
3. **冲突解决**：时间戳、优先级、合并等策略
4. **数据一致性**：校验和验证数据完整性
5. **性能优化**：批量处理、并行同步、网络优化
6. **监控告警**：实时监控同步状态和冲突情况

选择合适的数据同步策略需要考虑数据一致性要求、网络延迟、系统负载等因素。

