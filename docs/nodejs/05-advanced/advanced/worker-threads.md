# Worker Threads

## 🎯 学习目标

- 理解Worker Threads的应用场景和优势
- 掌握Worker线程的创建和管理
- 学会线程间通信和数据共享
- 了解线程池和任务调度策略

## 📚 核心概念

### Worker Threads简介

```javascript
// Worker Threads的优势
const workerBenefits = {
  cpuIntensive: {
    description: 'CPU密集型任务处理',
    benefits: ['并行计算', '避免阻塞主线程', '充分利用多核CPU']
  },
  isolation: {
    description: '代码隔离',
    benefits: ['独立内存空间', '错误隔离', '安全执行']
  },
  communication: {
    description: '高效通信',
    benefits: ['消息传递', '共享内存', '传输对象']
  }
};

console.log('Worker Threads优势:', workerBenefits);
```

## 🛠️ 基础Worker实现

### 简单Worker示例

```javascript
// worker.js - Worker线程代码
const { parentPort, workerData } = require('worker_threads');

// 计算密集型任务
function calculatePrimes(max) {
    const primes = [];
    const sieve = new Array(max + 1).fill(true);
    
    sieve[0] = sieve[1] = false;
    
    for (let i = 2; i * i <= max; i++) {
        if (sieve[i]) {
            for (let j = i * i; j <= max; j += i) {
                sieve[j] = false;
            }
        }
    }
    
    for (let i = 2; i <= max; i++) {
        if (sieve[i]) {
            primes.push(i);
        }
    }
    
    return primes;
}

// 监听主线程消息
parentPort.on('message', (data) => {
    const { type, payload } = data;
    
    switch (type) {
        case 'CALCULATE_PRIMES':
            const startTime = Date.now();
            const primes = calculatePrimes(payload.max);
            const endTime = Date.now();
            
            parentPort.postMessage({
                type: 'PRIMES_RESULT',
                payload: {
                    primes: primes.slice(0, 10), // 只返回前10个
                    count: primes.length,
                    duration: endTime - startTime,
                    max: payload.max
                }
            });
            break;
            
        case 'FIBONACCI':
            const fib = (n) => n <= 1 ? n : fib(n - 1) + fib(n - 2);
            const result = fib(payload.n);
            
            parentPort.postMessage({
                type: 'FIBONACCI_RESULT',
                payload: { n: payload.n, result }
            });
            break;
            
        default:
            parentPort.postMessage({
                type: 'ERROR',
                payload: { message: `Unknown message type: ${type}` }
            });
    }
});

// 发送就绪信号
parentPort.postMessage({
    type: 'WORKER_READY',
    payload: { workerId: workerData?.id || 'unknown' }
});
```

### Worker管理器

```javascript
// worker-manager.js
const { Worker, isMainThread, parentPort } = require('worker_threads');
const path = require('path');
const EventEmitter = require('events');

class WorkerManager extends EventEmitter {
    constructor(options = {}) {
        super();
        this.maxWorkers = options.maxWorkers || require('os').cpus().length;
        this.workerScript = options.workerScript || path.join(__dirname, 'worker.js');
        this.workers = new Map();
        this.taskQueue = [];
        this.nextWorkerId = 1;
        this.stats = {
            tasksCompleted: 0,
            tasksQueued: 0,
            workersCreated: 0,
            workersDestroyed: 0
        };
    }

    // 创建Worker
    async createWorker() {
        const workerId = this.nextWorkerId++;
        
        try {
            const worker = new Worker(this.workerScript, {
                workerData: { id: workerId }
            });
            
            const workerInfo = {
                id: workerId,
                worker,
                busy: false,
                tasksCompleted: 0,
                createdAt: Date.now(),
                lastTaskAt: null
            };
            
            // 设置消息处理
            worker.on('message', (message) => {
                this._handleWorkerMessage(workerId, message);
            });
            
            worker.on('error', (error) => {
                console.error(`Worker ${workerId} 错误:`, error);
                this.emit('workerError', { workerId, error });
                this._destroyWorker(workerId);
            });
            
            worker.on('exit', (code) => {
                if (code !== 0) {
                    console.error(`Worker ${workerId} 异常退出，代码: ${code}`);
                }
                this.workers.delete(workerId);
                this.stats.workersDestroyed++;
            });
            
            this.workers.set(workerId, workerInfo);
            this.stats.workersCreated++;
            
            console.log(`✅ Worker ${workerId} 已创建`);
            return workerId;
            
        } catch (error) {
            console.error('创建Worker失败:', error);
            throw error;
        }
    }

    // 处理Worker消息
    _handleWorkerMessage(workerId, message) {
        const workerInfo = this.workers.get(workerId);
        if (!workerInfo) return;

        const { type, payload } = message;
        
        switch (type) {
            case 'WORKER_READY':
                console.log(`🚀 Worker ${workerId} 就绪`);
                this.emit('workerReady', { workerId });
                this._processQueue();
                break;
                
            case 'PRIMES_RESULT':
            case 'FIBONACCI_RESULT':
                workerInfo.busy = false;
                workerInfo.tasksCompleted++;
                workerInfo.lastTaskAt = Date.now();
                this.stats.tasksCompleted++;
                
                console.log(`✅ Worker ${workerId} 完成任务: ${type}`);
                this.emit('taskCompleted', { workerId, type, payload });
                
                // 处理下一个任务
                this._processQueue();
                break;
                
            case 'ERROR':
                workerInfo.busy = false;
                console.error(`❌ Worker ${workerId} 任务错误:`, payload.message);
                this.emit('taskError', { workerId, error: payload.message });
                this._processQueue();
                break;
        }
    }

    // 提交任务
    async submitTask(type, payload) {
        return new Promise((resolve, reject) => {
            const task = {
                id: Date.now() + Math.random(),
                type,
                payload,
                resolve,
                reject,
                submittedAt: Date.now()
            };
            
            this.taskQueue.push(task);
            this.stats.tasksQueued++;
            
            console.log(`📝 任务已排队: ${type}, 队列长度: ${this.taskQueue.length}`);
            
            // 尝试立即处理
            this._processQueue();
        });
    }

    // 处理任务队列
    async _processQueue() {
        if (this.taskQueue.length === 0) return;
        
        // 寻找空闲Worker
        let availableWorker = null;
        for (const [workerId, workerInfo] of this.workers) {
            if (!workerInfo.busy) {
                availableWorker = { workerId, workerInfo };
                break;
            }
        }
        
        // 如果没有空闲Worker且未达到最大数量，创建新Worker
        if (!availableWorker && this.workers.size < this.maxWorkers) {
            try {
                const workerId = await this.createWorker();
                const workerInfo = this.workers.get(workerId);
                
                // 等待Worker就绪
                await new Promise(resolve => {
                    const handler = ({ workerId: readyWorkerId }) => {
                        if (readyWorkerId === workerId) {
                            this.off('workerReady', handler);
                            resolve();
                        }
                    };
                    this.on('workerReady', handler);
                });
                
                availableWorker = { workerId, workerInfo };
            } catch (error) {
                console.error('创建Worker失败，任务将继续等待');
                return;
            }
        }
        
        // 分配任务给空闲Worker
        if (availableWorker && this.taskQueue.length > 0) {
            const task = this.taskQueue.shift();
            const { workerId, workerInfo } = availableWorker;
            
            workerInfo.busy = true;
            
            // 设置任务完成监听器
            const taskHandler = ({ workerId: completedWorkerId, type, payload }) => {
                if (completedWorkerId === workerId && type === `${task.type}_RESULT`) {
                    this.off('taskCompleted', taskHandler);
                    this.off('taskError', errorHandler);
                    task.resolve(payload);
                }
            };
            
            const errorHandler = ({ workerId: errorWorkerId, error }) => {
                if (errorWorkerId === workerId) {
                    this.off('taskCompleted', taskHandler);
                    this.off('taskError', errorHandler);
                    task.reject(new Error(error));
                }
            };
            
            this.on('taskCompleted', taskHandler);
            this.on('taskError', errorHandler);
            
            // 发送任务到Worker
            workerInfo.worker.postMessage({
                type: task.type,
                payload: task.payload
            });
            
            console.log(`🔄 任务已分配给 Worker ${workerId}: ${task.type}`);
        }
    }

    // 销毁Worker
    async _destroyWorker(workerId) {
        const workerInfo = this.workers.get(workerId);
        if (!workerInfo) return;
        
        try {
            await workerInfo.worker.terminate();
            this.workers.delete(workerId);
            console.log(`🗑️ Worker ${workerId} 已销毁`);
        } catch (error) {
            console.error(`销毁Worker ${workerId} 失败:`, error);
        }
    }

    // 获取统计信息
    getStats() {
        const workerStats = Array.from(this.workers.values()).map(info => ({
            id: info.id,
            busy: info.busy,
            tasksCompleted: info.tasksCompleted,
            uptime: Date.now() - info.createdAt,
            lastTaskAt: info.lastTaskAt
        }));
        
        return {
            workers: {
                total: this.workers.size,
                busy: workerStats.filter(w => w.busy).length,
                idle: workerStats.filter(w => !w.busy).length,
                details: workerStats
            },
            tasks: {
                queued: this.taskQueue.length,
                completed: this.stats.tasksCompleted,
                totalQueued: this.stats.tasksQueued
            },
            system: {
                maxWorkers: this.maxWorkers,
                workersCreated: this.stats.workersCreated,
                workersDestroyed: this.stats.workersDestroyed
            }
        };
    }

    // 关闭所有Worker
    async shutdown() {
        console.log('🔄 正在关闭所有Worker...');
        
        const promises = Array.from(this.workers.keys()).map(workerId => 
            this._destroyWorker(workerId)
        );
        
        await Promise.all(promises);
        
        console.log('✅ 所有Worker已关闭');
    }
}

module.exports = WorkerManager;
```

### 使用示例

```javascript
// main.js - 主线程代码
const WorkerManager = require('./worker-manager');

async function demonstrateWorkerThreads() {
    console.log('🚀 Worker Threads 演示开始...\n');
    
    const workerManager = new WorkerManager({
        maxWorkers: 4,
        workerScript: require('path').join(__dirname, 'worker.js')
    });
    
    try {
        // 1. 质数计算任务
        console.log('1. 质数计算任务:');
        
        const primesTasks = [
            { max: 10000 },
            { max: 50000 },
            { max: 100000 }
        ];
        
        const primesPromises = primesTasks.map(task => 
            workerManager.submitTask('CALCULATE_PRIMES', task)
        );
        
        const primesResults = await Promise.all(primesPromises);
        
        primesResults.forEach((result, index) => {
            console.log(`  任务 ${index + 1}: 找到 ${result.count} 个质数 (最大值: ${result.max}), 耗时: ${result.duration}ms`);
            console.log(`    前10个质数: ${result.primes.join(', ')}`);
        });
        
        // 2. 斐波那契计算
        console.log('\n2. 斐波那契计算:');
        
        const fibTasks = [35, 40, 42];
        const fibPromises = fibTasks.map(n => 
            workerManager.submitTask('FIBONACCI', { n })
        );
        
        const fibResults = await Promise.all(fibPromises);
        
        fibResults.forEach((result, index) => {
            console.log(`  F(${result.n}) = ${result.result}`);
        });
        
        // 3. 显示统计信息
        console.log('\n3. 系统统计:');
        const stats = workerManager.getStats();
        console.log('  Worker统计:', {
            总数: stats.workers.total,
            忙碌: stats.workers.busy,
            空闲: stats.workers.idle
        });
        console.log('  任务统计:', {
            队列中: stats.tasks.queued,
            已完成: stats.tasks.completed,
            总提交: stats.tasks.totalQueued
        });
        
        // 4. 性能测试
        console.log('\n4. 性能压力测试:');
        
        const startTime = Date.now();
        const stressTasks = Array.from({ length: 20 }, (_, i) => 
            workerManager.submitTask('CALCULATE_PRIMES', { max: 5000 + i * 1000 })
        );
        
        await Promise.all(stressTasks);
        const endTime = Date.now();
        
        console.log(`  完成20个质数计算任务，总耗时: ${endTime - startTime}ms`);
        
        const finalStats = workerManager.getStats();
        console.log('  最终统计:', finalStats.tasks);
        
    } catch (error) {
        console.error('❌ 演示过程中出现错误:', error);
    } finally {
        await workerManager.shutdown();
    }
    
    console.log('\n✅ Worker Threads 演示完成！');
}

// 性能对比测试
async function performanceComparison() {
    console.log('\n🔍 性能对比测试 (单线程 vs 多线程)...\n');
    
    // 单线程计算
    function calculatePrimesSync(max) {
        const primes = [];
        const sieve = new Array(max + 1).fill(true);
        
        sieve[0] = sieve[1] = false;
        
        for (let i = 2; i * i <= max; i++) {
            if (sieve[i]) {
                for (let j = i * i; j <= max; j += i) {
                    sieve[j] = false;
                }
            }
        }
        
        for (let i = 2; i <= max; i++) {
            if (sieve[i]) {
                primes.push(i);
            }
        }
        
        return primes;
    }
    
    const tasks = [10000, 20000, 30000, 40000, 50000];
    
    // 单线程测试
    console.log('单线程计算:');
    console.time('单线程总时间');
    
    for (const max of tasks) {
        console.time(`单线程-${max}`);
        const primes = calculatePrimesSync(max);
        console.timeEnd(`单线程-${max}`);
        console.log(`  找到 ${primes.length} 个质数 (max: ${max})`);
    }
    
    console.timeEnd('单线程总时间');
    
    // 多线程测试
    console.log('\n多线程计算:');
    const workerManager = new WorkerManager({ maxWorkers: 4 });
    
    console.time('多线程总时间');
    
    const promises = tasks.map(max => 
        workerManager.submitTask('CALCULATE_PRIMES', { max })
    );
    
    const results = await Promise.all(promises);
    
    console.timeEnd('多线程总时间');
    
    results.forEach((result, index) => {
        console.log(`  找到 ${result.count} 个质数 (max: ${tasks[index]}), 耗时: ${result.duration}ms`);
    });
    
    await workerManager.shutdown();
}

// 运行演示
if (require.main === module) {
    (async () => {
        await demonstrateWorkerThreads();
        await performanceComparison();
    })().catch(console.error);
}

module.exports = { WorkerManager, demonstrateWorkerThreads };
```

Worker Threads为Node.js带来了真正的多线程能力，是处理CPU密集型任务的最佳选择！
