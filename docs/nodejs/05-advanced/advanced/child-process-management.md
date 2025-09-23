# 子进程管理

## 🎯 学习目标

- 深入理解Node.js子进程的创建和管理机制
- 掌握不同子进程API的使用场景和最佳实践
- 学会进程间通信和数据传输技术
- 了解子进程的监控、调度和资源管理

## 📚 核心概念

### 子进程基础

```javascript
// 子进程核心概念
const childProcessConcepts = {
  types: {
    spawn: {
      description: '启动新进程执行命令',
      characteristics: ['流式I/O', '实时输出', '长时间运行'],
      use_cases: ['执行系统命令', '启动服务', '实时数据处理']
    },
    exec: {
      description: '在shell中执行命令',
      characteristics: ['缓冲输出', '简单接口', 'shell特性'],
      use_cases: ['简单命令执行', 'shell脚本', '管道操作']
    },
    execFile: {
      description: '直接执行文件',
      characteristics: ['不通过shell', '更安全', '更快'],
      use_cases: ['执行可执行文件', '安全执行', '性能敏感场景']
    },
    fork: {
      description: '创建Node.js子进程',
      characteristics: ['IPC通道', 'Node.js环境', '模块加载'],
      use_cases: ['CPU密集任务', '并行处理', '微服务架构']
    }
  },
  communication: {
    stdio: 'stdin/stdout/stderr流通信',
    ipc: '进程间通信通道',
    signals: '信号通信',
    files: '文件系统通信',
    network: '网络通信'
  },
  lifecycle: {
    creation: '进程创建',
    execution: '进程执行',
    communication: '进程通信',
    monitoring: '进程监控',
    termination: '进程终止'
  }
};

console.log('子进程概念:', childProcessConcepts);
```

## 🚀 基础子进程操作

### 子进程创建和管理

```javascript
// basic-child-process.js
const { spawn, exec, execFile, fork } = require('child_process');
const path = require('path');
const fs = require('fs');

class ChildProcessManager {
  constructor() {
    this.processes = new Map();
    this.processId = 0;
  }

  // 使用spawn创建子进程
  createSpawnProcess(command, args = [], options = {}) {
    const processId = ++this.processId;
    console.log(`🚀 创建spawn进程 ${processId}: ${command} ${args.join(' ')}`);

    const child = spawn(command, args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      ...options
    });

    const processInfo = {
      id: processId,
      type: 'spawn',
      command: command,
      args: args,
      child: child,
      startTime: Date.now(),
      status: 'running',
      output: [],
      errors: []
    };

    // 监听输出
    child.stdout.on('data', (data) => {
      const output = data.toString();
      processInfo.output.push(output);
      console.log(`📤 进程 ${processId} 输出: ${output.trim()}`);
    });

    child.stderr.on('data', (data) => {
      const error = data.toString();
      processInfo.errors.push(error);
      console.error(`❌ 进程 ${processId} 错误: ${error.trim()}`);
    });

    // 监听进程事件
    child.on('close', (code, signal) => {
      processInfo.status = 'closed';
      processInfo.exitCode = code;
      processInfo.signal = signal;
      processInfo.endTime = Date.now();
      
      console.log(`🏁 进程 ${processId} 关闭: 代码=${code}, 信号=${signal}`);
    });

    child.on('error', (error) => {
      processInfo.status = 'error';
      processInfo.error = error.message;
      console.error(`💥 进程 ${processId} 启动失败:`, error.message);
    });

    this.processes.set(processId, processInfo);
    return { processId, child, processInfo };
  }

  // 使用exec执行命令
  async executeCommand(command, options = {}) {
    const processId = ++this.processId;
    console.log(`⚡ 执行命令 ${processId}: ${command}`);

    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      const child = exec(command, {
        timeout: 30000,
        maxBuffer: 1024 * 1024, // 1MB
        ...options
      }, (error, stdout, stderr) => {
        const endTime = Date.now();
        const duration = endTime - startTime;

        const result = {
          processId: processId,
          command: command,
          duration: duration,
          stdout: stdout,
          stderr: stderr,
          error: error
        };

        if (error) {
          console.error(`❌ 命令 ${processId} 执行失败 (${duration}ms):`, error.message);
          reject(result);
        } else {
          console.log(`✅ 命令 ${processId} 执行成功 (${duration}ms)`);
          resolve(result);
        }
      });

      const processInfo = {
        id: processId,
        type: 'exec',
        command: command,
        child: child,
        startTime: startTime,
        status: 'running'
      };

      this.processes.set(processId, processInfo);
    });
  }

  // 使用execFile执行文件
  async executeFile(file, args = [], options = {}) {
    const processId = ++this.processId;
    console.log(`📁 执行文件 ${processId}: ${file} ${args.join(' ')}`);

    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      const child = execFile(file, args, {
        timeout: 30000,
        maxBuffer: 1024 * 1024,
        ...options
      }, (error, stdout, stderr) => {
        const endTime = Date.now();
        const duration = endTime - startTime;

        const result = {
          processId: processId,
          file: file,
          args: args,
          duration: duration,
          stdout: stdout,
          stderr: stderr,
          error: error
        };

        if (error) {
          console.error(`❌ 文件 ${processId} 执行失败 (${duration}ms):`, error.message);
          reject(result);
        } else {
          console.log(`✅ 文件 ${processId} 执行成功 (${duration}ms)`);
          resolve(result);
        }
      });

      const processInfo = {
        id: processId,
        type: 'execFile',
        file: file,
        args: args,
        child: child,
        startTime: startTime,
        status: 'running'
      };

      this.processes.set(processId, processInfo);
    });
  }

  // 使用fork创建Node.js子进程
  createNodeProcess(modulePath, args = [], options = {}) {
    const processId = ++this.processId;
    console.log(`🍴 创建Node进程 ${processId}: ${modulePath}`);

    const child = fork(modulePath, args, {
      silent: false,
      ...options
    });

    const processInfo = {
      id: processId,
      type: 'fork',
      modulePath: modulePath,
      args: args,
      child: child,
      startTime: Date.now(),
      status: 'running',
      messages: []
    };

    // 监听消息
    child.on('message', (message) => {
      processInfo.messages.push({
        timestamp: Date.now(),
        message: message
      });
      console.log(`💬 进程 ${processId} 消息:`, message);
    });

    // 监听进程事件
    child.on('close', (code, signal) => {
      processInfo.status = 'closed';
      processInfo.exitCode = code;
      processInfo.signal = signal;
      processInfo.endTime = Date.now();
      
      console.log(`🏁 Node进程 ${processId} 关闭: 代码=${code}, 信号=${signal}`);
    });

    child.on('error', (error) => {
      processInfo.status = 'error';
      processInfo.error = error.message;
      console.error(`💥 Node进程 ${processId} 启动失败:`, error.message);
    });

    this.processes.set(processId, processInfo);
    return { processId, child, processInfo };
  }

  // 发送消息给Node子进程
  sendMessage(processId, message) {
    const processInfo = this.processes.get(processId);
    
    if (!processInfo) {
      throw new Error(`进程 ${processId} 不存在`);
    }

    if (processInfo.type !== 'fork') {
      throw new Error(`进程 ${processId} 不是Node子进程，无法发送消息`);
    }

    if (processInfo.status !== 'running') {
      throw new Error(`进程 ${processId} 未运行`);
    }

    processInfo.child.send(message);
    console.log(`📨 向进程 ${processId} 发送消息:`, message);
  }

  // 终止进程
  terminateProcess(processId, signal = 'SIGTERM') {
    const processInfo = this.processes.get(processId);
    
    if (!processInfo) {
      throw new Error(`进程 ${processId} 不存在`);
    }

    if (processInfo.status !== 'running') {
      console.warn(`进程 ${processId} 已经停止`);
      return;
    }

    console.log(`🛑 终止进程 ${processId} (信号: ${signal})`);
    processInfo.child.kill(signal);
    
    // 设置超时强制杀死
    setTimeout(() => {
      if (processInfo.status === 'running') {
        console.log(`💀 强制杀死进程 ${processId}`);
        processInfo.child.kill('SIGKILL');
      }
    }, 5000);
  }

  // 获取进程信息
  getProcessInfo(processId) {
    return this.processes.get(processId);
  }

  // 获取所有进程信息
  getAllProcesses() {
    return Array.from(this.processes.values());
  }

  // 获取运行中的进程
  getRunningProcesses() {
    return Array.from(this.processes.values()).filter(p => p.status === 'running');
  }

  // 清理已结束的进程
  cleanup() {
    const toRemove = [];
    
    for (const [id, processInfo] of this.processes) {
      if (processInfo.status === 'closed' || processInfo.status === 'error') {
        toRemove.push(id);
      }
    }
    
    for (const id of toRemove) {
      this.processes.delete(id);
    }
    
    console.log(`🧹 清理了 ${toRemove.length} 个已结束的进程`);
  }

  // 终止所有进程
  terminateAll() {
    const runningProcesses = this.getRunningProcesses();
    
    console.log(`🛑 终止所有进程 (${runningProcesses.length} 个)`);
    
    for (const processInfo of runningProcesses) {
      this.terminateProcess(processInfo.id);
    }
  }
}

// 使用示例
async function demonstrateBasicChildProcess() {
  console.log('🚀 基础子进程操作演示...\n');

  const manager = new ChildProcessManager();

  try {
    // 1. 使用spawn执行长时间运行的命令
    console.log('1. Spawn进程 - 执行ping命令:');
    const { processId: pingId } = manager.createSpawnProcess('ping', ['-c', '3', 'localhost']);
    
    // 等待ping完成
    await new Promise(resolve => {
      const checkPing = () => {
        const info = manager.getProcessInfo(pingId);
        if (info.status !== 'running') {
          resolve();
        } else {
          setTimeout(checkPing, 100);
        }
      };
      checkPing();
    });

    // 2. 使用exec执行简单命令
    console.log('\n2. Exec命令 - 获取系统信息:');
    try {
      const result = await manager.executeCommand('node --version');
      console.log('  Node.js版本:', result.stdout.trim());
    } catch (error) {
      console.error('  执行失败:', error.stderr);
    }

    // 3. 使用execFile执行文件
    console.log('\n3. ExecFile - 执行Node脚本:');
    try {
      const result = await manager.executeFile('node', ['-e', 'console.log("Hello from execFile!")']);
      console.log('  输出:', result.stdout.trim());
    } catch (error) {
      console.error('  执行失败:', error.stderr);
    }

    // 4. 创建简单的worker脚本并fork
    console.log('\n4. Fork进程 - 创建Node子进程:');
    
    // 创建临时worker文件
    const workerScript = `
      console.log('Worker进程启动, PID:', process.pid);
      
      process.on('message', (message) => {
        console.log('Worker收到消息:', message);
        
        if (message.type === 'calculate') {
          const result = message.a + message.b;
          process.send({ type: 'result', result: result });
        } else if (message.type === 'exit') {
          process.exit(0);
        }
      });
      
      // 发送就绪消息
      process.send({ type: 'ready', pid: process.pid });
    `;
    
    const workerPath = path.join(__dirname, 'temp-worker.js');
    fs.writeFileSync(workerPath, workerScript);

    const { processId: workerId, child: workerChild } = manager.createNodeProcess(workerPath);
    
    // 等待worker就绪
    await new Promise(resolve => {
      const messageHandler = (message) => {
        if (message.type === 'ready') {
          workerChild.removeListener('message', messageHandler);
          resolve();
        }
      };
      workerChild.on('message', messageHandler);
    });

    // 发送计算任务
    manager.sendMessage(workerId, { type: 'calculate', a: 10, b: 20 });
    
    // 等待结果
    await new Promise(resolve => {
      const messageHandler = (message) => {
        if (message.type === 'result') {
          console.log('  计算结果:', message.result);
          workerChild.removeListener('message', messageHandler);
          resolve();
        }
      };
      workerChild.on('message', messageHandler);
    });

    // 终止worker
    manager.sendMessage(workerId, { type: 'exit' });
    
    // 清理临时文件
    fs.unlinkSync(workerPath);

    // 5. 显示进程统计
    console.log('\n5. 进程统计:');
    const allProcesses = manager.getAllProcesses();
    console.log(`  总进程数: ${allProcesses.length}`);
    
    allProcesses.forEach(proc => {
      const duration = proc.endTime ? proc.endTime - proc.startTime : Date.now() - proc.startTime;
      console.log(`  进程 ${proc.id} (${proc.type}): ${proc.status}, 运行时间: ${duration}ms`);
    });

  } catch (error) {
    console.error('演示过程中发生错误:', error);
  } finally {
    // 清理所有进程
    manager.terminateAll();
    
    // 等待清理完成
    setTimeout(() => {
      manager.cleanup();
    }, 1000);
  }
}

module.exports = {
  ChildProcessManager,
  demonstrateBasicChildProcess
};
```

### 高级子进程管理

```javascript
// advanced-child-process.js
const { spawn, fork } = require('child_process');
const EventEmitter = require('events');
const path = require('path');
const fs = require('fs');

// 进程池管理器
class ProcessPool extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      min: options.min || 2,
      max: options.max || 10,
      idleTimeout: options.idleTimeout || 300000, // 5分钟
      maxTasks: options.maxTasks || 1000,
      workerScript: options.workerScript,
      ...options
    };
    
    this.workers = [];
    this.availableWorkers = [];
    this.busyWorkers = new Set();
    this.taskQueue = [];
    this.totalTasks = 0;
    this.completedTasks = 0;
    this.failedTasks = 0;
    
    this.initialize();
  }

  // 初始化进程池
  async initialize() {
    console.log(`🏊 初始化进程池 (${this.options.min}-${this.options.max} 个进程)`);
    
    // 创建最小数量的worker
    for (let i = 0; i < this.options.min; i++) {
      await this.createWorker();
    }
    
    // 启动任务处理
    this.startTaskProcessing();
    
    console.log(`✅ 进程池初始化完成，${this.workers.length} 个进程就绪`);
  }

  // 创建worker进程
  async createWorker() {
    return new Promise((resolve, reject) => {
      const worker = fork(this.options.workerScript, [], {
        silent: true
      });

      const workerInfo = {
        id: worker.pid,
        process: worker,
        busy: false,
        tasks: 0,
        errors: 0,
        startTime: Date.now(),
        lastUsed: Date.now(),
        idleTimer: null
      };

      // 监听worker消息
      worker.on('message', (message) => {
        this.handleWorkerMessage(workerInfo, message);
      });

      // 监听worker错误
      worker.on('error', (error) => {
        console.error(`❌ Worker ${workerInfo.id} 错误:`, error);
        workerInfo.errors++;
        this.handleWorkerError(workerInfo, error);
      });

      // 监听worker退出
      worker.on('exit', (code, signal) => {
        console.log(`🚪 Worker ${workerInfo.id} 退出: 代码=${code}, 信号=${signal}`);
        this.handleWorkerExit(workerInfo);
      });

      // 等待worker就绪
      const readyHandler = (message) => {
        if (message.type === 'ready') {
          worker.removeListener('message', readyHandler);
          
          this.workers.push(workerInfo);
          this.availableWorkers.push(workerInfo);
          this.setupWorkerIdleTimeout(workerInfo);
          
          console.log(`🔧 Worker ${workerInfo.id} 创建成功`);
          resolve(workerInfo);
        }
      };

      worker.on('message', readyHandler);
      
      // 设置创建超时
      setTimeout(() => {
        worker.removeListener('message', readyHandler);
        reject(new Error('Worker创建超时'));
      }, 10000);
    });
  }

  // 处理worker消息
  handleWorkerMessage(workerInfo, message) {
    switch (message.type) {
      case 'ready':
        // Worker就绪消息在createWorker中处理
        break;
        
      case 'taskComplete':
        this.handleTaskComplete(workerInfo, message);
        break;
        
      case 'taskError':
        this.handleTaskError(workerInfo, message);
        break;
        
      case 'status':
        this.handleWorkerStatus(workerInfo, message);
        break;
        
      default:
        console.log(`📨 Worker ${workerInfo.id} 消息:`, message);
    }
  }

  // 处理任务完成
  handleTaskComplete(workerInfo, message) {
    const { taskId, result, duration } = message;
    
    workerInfo.tasks++;
    this.completedTasks++;
    
    // 找到对应的任务
    const taskIndex = this.taskQueue.findIndex(task => task.id === taskId);
    if (taskIndex > -1) {
      const task = this.taskQueue.splice(taskIndex, 1)[0];
      task.resolve(result);
    }
    
    // 释放worker
    this.releaseWorker(workerInfo);
    
    console.log(`✅ 任务 ${taskId} 完成，耗时 ${duration}ms`);
  }

  // 处理任务错误
  handleTaskError(workerInfo, message) {
    const { taskId, error } = message;
    
    workerInfo.errors++;
    this.failedTasks++;
    
    // 找到对应的任务
    const taskIndex = this.taskQueue.findIndex(task => task.id === taskId);
    if (taskIndex > -1) {
      const task = this.taskQueue.splice(taskIndex, 1)[0];
      task.reject(new Error(error));
    }
    
    // 释放worker
    this.releaseWorker(workerInfo);
    
    console.error(`❌ 任务 ${taskId} 失败:`, error);
  }

  // 处理worker状态
  handleWorkerStatus(workerInfo, message) {
    console.log(`📊 Worker ${workerInfo.id} 状态:`, message.status);
  }

  // 处理worker错误
  handleWorkerError(workerInfo, error) {
    // 如果错误过多，重启worker
    if (workerInfo.errors > 5) {
      console.log(`🔄 重启错误频繁的Worker ${workerInfo.id}`);
      this.restartWorker(workerInfo);
    }
  }

  // 处理worker退出
  handleWorkerExit(workerInfo) {
    // 从各个集合中移除worker
    const workerIndex = this.workers.indexOf(workerInfo);
    if (workerIndex > -1) {
      this.workers.splice(workerIndex, 1);
    }
    
    const availableIndex = this.availableWorkers.indexOf(workerInfo);
    if (availableIndex > -1) {
      this.availableWorkers.splice(availableIndex, 1);
    }
    
    this.busyWorkers.delete(workerInfo);
    
    // 如果进程数低于最小值，创建新的worker
    if (this.workers.length < this.options.min) {
      console.log('🔄 创建新worker以维持最小数量');
      this.createWorker().catch(error => {
        console.error('创建替换worker失败:', error);
      });
    }
  }

  // 重启worker
  async restartWorker(workerInfo) {
    // 终止旧worker
    workerInfo.process.kill();
    
    // 创建新worker
    try {
      await this.createWorker();
    } catch (error) {
      console.error('重启worker失败:', error);
    }
  }

  // 设置worker空闲超时
  setupWorkerIdleTimeout(workerInfo) {
    const resetIdleTimeout = () => {
      if (workerInfo.idleTimer) {
        clearTimeout(workerInfo.idleTimer);
      }
      
      workerInfo.idleTimer = setTimeout(() => {
        if (!workerInfo.busy && this.workers.length > this.options.min) {
          console.log(`⏰ 终止空闲Worker ${workerInfo.id}`);
          workerInfo.process.kill();
        }
      }, this.options.idleTimeout);
    };
    
    resetIdleTimeout();
    
    // 每次使用后重置超时
    workerInfo.resetIdleTimeout = resetIdleTimeout;
  }

  // 获取可用worker
  getAvailableWorker() {
    if (this.availableWorkers.length > 0) {
      return this.availableWorkers.pop();
    }
    
    // 如果没有可用worker且未达到最大数量，创建新worker
    if (this.workers.length < this.options.max) {
      return this.createWorker();
    }
    
    return null;
  }

  // 释放worker
  releaseWorker(workerInfo) {
    workerInfo.busy = false;
    workerInfo.lastUsed = Date.now();
    
    this.busyWorkers.delete(workerInfo);
    this.availableWorkers.push(workerInfo);
    
    if (workerInfo.resetIdleTimeout) {
      workerInfo.resetIdleTimeout();
    }
    
    // 处理等待的任务
    this.processTaskQueue();
  }

  // 启动任务处理
  startTaskProcessing() {
    setInterval(() => {
      this.processTaskQueue();
    }, 100);
  }

  // 处理任务队列
  async processTaskQueue() {
    while (this.taskQueue.length > 0) {
      const worker = this.getAvailableWorker();
      
      if (!worker) {
        break; // 没有可用worker
      }
      
      // 如果worker是Promise（新创建的），等待创建完成
      const workerInfo = await Promise.resolve(worker);
      
      const task = this.taskQueue.find(t => !t.assigned);
      if (!task) {
        // 没有未分配的任务，将worker放回
        this.availableWorkers.push(workerInfo);
        break;
      }
      
      // 分配任务
      task.assigned = true;
      workerInfo.busy = true;
      this.busyWorkers.add(workerInfo);
      
      // 从可用列表中移除
      const index = this.availableWorkers.indexOf(workerInfo);
      if (index > -1) {
        this.availableWorkers.splice(index, 1);
      }
      
      // 发送任务给worker
      workerInfo.process.send({
        type: 'task',
        taskId: task.id,
        data: task.data
      });
      
      console.log(`📋 任务 ${task.id} 分配给Worker ${workerInfo.id}`);
    }
  }

  // 提交任务
  submitTask(data) {
    return new Promise((resolve, reject) => {
      const taskId = `task_${++this.totalTasks}`;
      
      const task = {
        id: taskId,
        data: data,
        resolve: resolve,
        reject: reject,
        assigned: false,
        createdAt: Date.now()
      };
      
      this.taskQueue.push(task);
      
      console.log(`📝 提交任务 ${taskId}`);
      
      // 立即尝试处理
      setImmediate(() => this.processTaskQueue());
    });
  }

  // 获取进程池状态
  getStatus() {
    return {
      workers: {
        total: this.workers.length,
        available: this.availableWorkers.length,
        busy: this.busyWorkers.size
      },
      tasks: {
        total: this.totalTasks,
        completed: this.completedTasks,
        failed: this.failedTasks,
        queued: this.taskQueue.length,
        pending: this.taskQueue.filter(t => !t.assigned).length
      },
      performance: {
        successRate: this.totalTasks > 0 
          ? (this.completedTasks / this.totalTasks * 100).toFixed(2) + '%'
          : '0%'
      }
    };
  }

  // 关闭进程池
  async shutdown() {
    console.log('🔄 关闭进程池...');
    
    // 停止接受新任务
    this.taskQueue = [];
    
    // 等待正在执行的任务完成
    while (this.busyWorkers.size > 0) {
      console.log(`⏳ 等待 ${this.busyWorkers.size} 个任务完成...`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // 终止所有worker
    for (const workerInfo of this.workers) {
      if (workerInfo.idleTimer) {
        clearTimeout(workerInfo.idleTimer);
      }
      workerInfo.process.kill();
    }
    
    console.log('✅ 进程池已关闭');
  }
}

// 任务调度器
class TaskScheduler extends EventEmitter {
  constructor(processPool) {
    super();
    this.processPool = processPool;
    this.scheduledTasks = new Map();
    this.cronJobs = new Map();
    this.taskId = 0;
  }

  // 调度一次性任务
  schedule(delay, taskData) {
    const taskId = `scheduled_${++this.taskId}`;
    
    const timeout = setTimeout(async () => {
      try {
        console.log(`⏰ 执行调度任务 ${taskId}`);
        const result = await this.processPool.submitTask(taskData);
        this.emit('taskComplete', { taskId, result });
      } catch (error) {
        this.emit('taskError', { taskId, error });
      } finally {
        this.scheduledTasks.delete(taskId);
      }
    }, delay);
    
    this.scheduledTasks.set(taskId, {
      id: taskId,
      timeout: timeout,
      taskData: taskData,
      scheduledAt: Date.now(),
      executeAt: Date.now() + delay
    });
    
    console.log(`📅 调度任务 ${taskId}，${delay}ms后执行`);
    return taskId;
  }

  // 调度周期性任务
  scheduleCron(interval, taskData, options = {}) {
    const jobId = `cron_${++this.taskId}`;
    const { maxExecutions = Infinity, startDelay = 0 } = options;
    
    let executions = 0;
    
    const executeJob = async () => {
      if (executions >= maxExecutions) {
        this.cancelCron(jobId);
        return;
      }
      
      try {
        console.log(`🔄 执行周期任务 ${jobId} (第${executions + 1}次)`);
        const result = await this.processPool.submitTask({
          ...taskData,
          execution: executions + 1
        });
        
        executions++;
        this.emit('cronTaskComplete', { jobId, execution: executions, result });
        
      } catch (error) {
        this.emit('cronTaskError', { jobId, execution: executions + 1, error });
      }
    };
    
    // 设置初始延迟
    const startTimeout = setTimeout(() => {
      executeJob();
      
      // 设置周期执行
      const intervalId = setInterval(executeJob, interval);
      
      this.cronJobs.set(jobId, {
        id: jobId,
        intervalId: intervalId,
        interval: interval,
        taskData: taskData,
        executions: executions,
        maxExecutions: maxExecutions,
        startedAt: Date.now()
      });
      
    }, startDelay);
    
    this.cronJobs.set(jobId, {
      id: jobId,
      startTimeout: startTimeout,
      interval: interval,
      taskData: taskData,
      executions: executions,
      maxExecutions: maxExecutions,
      scheduledAt: Date.now()
    });
    
    console.log(`⏰ 调度周期任务 ${jobId}，间隔 ${interval}ms`);
    return jobId;
  }

  // 取消调度任务
  cancel(taskId) {
    const task = this.scheduledTasks.get(taskId);
    if (task) {
      clearTimeout(task.timeout);
      this.scheduledTasks.delete(taskId);
      console.log(`❌ 取消调度任务 ${taskId}`);
      return true;
    }
    return false;
  }

  // 取消周期任务
  cancelCron(jobId) {
    const job = this.cronJobs.get(jobId);
    if (job) {
      if (job.intervalId) {
        clearInterval(job.intervalId);
      }
      if (job.startTimeout) {
        clearTimeout(job.startTimeout);
      }
      
      this.cronJobs.delete(jobId);
      console.log(`❌ 取消周期任务 ${jobId}`);
      return true;
    }
    return false;
  }

  // 获取调度状态
  getScheduleStatus() {
    return {
      scheduledTasks: this.scheduledTasks.size,
      cronJobs: this.cronJobs.size,
      tasks: Array.from(this.scheduledTasks.values()).map(task => ({
        id: task.id,
        executeAt: new Date(task.executeAt).toISOString(),
        remainingTime: task.executeAt - Date.now()
      })),
      jobs: Array.from(this.cronJobs.values()).map(job => ({
        id: job.id,
        interval: job.interval,
        executions: job.executions,
        maxExecutions: job.maxExecutions
      }))
    };
  }

  // 清理所有调度
  cleanup() {
    // 取消所有调度任务
    for (const taskId of this.scheduledTasks.keys()) {
      this.cancel(taskId);
    }
    
    // 取消所有周期任务
    for (const jobId of this.cronJobs.keys()) {
      this.cancelCron(jobId);
    }
    
    console.log('🧹 调度器已清理');
  }
}

module.exports = {
  ProcessPool,
  TaskScheduler
};
```

子进程管理是Node.js构建高性能、可扩展应用的重要技术，通过合理的进程管理策略可以充分利用系统资源！
