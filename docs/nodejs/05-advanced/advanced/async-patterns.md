# 异步模式

## 🎯 学习目标

- 深入理解Node.js中的各种异步编程模式
- 掌握Promise、async/await的高级用法
- 学会处理复杂的异步流程控制
- 了解异步编程的最佳实践和性能优化

## 📚 核心概念

### 异步编程模式概览

```javascript
// 异步编程模式概念
const asyncPatterns = {
  evolution: {
    callbacks: '回调函数 - 最基础的异步模式',
    promises: 'Promise - 解决回调地狱问题',
    asyncAwait: 'async/await - 同步风格的异步编程',
    generators: '生成器 - 可暂停的函数执行',
    observables: '观察者模式 - 响应式编程'
  },
  patterns: {
    sequential: '顺序执行 - 一个接一个执行',
    parallel: '并行执行 - 同时执行多个任务',
    concurrent: '并发执行 - 控制并发数量',
    pipeline: '管道执行 - 流水线处理',
    conditional: '条件执行 - 基于条件的异步流程',
    retry: '重试模式 - 失败重试机制',
    timeout: '超时模式 - 设置执行超时',
    circuit: '断路器模式 - 故障隔离'
  },
  challenges: {
    errorHandling: '错误处理 - 异步错误的捕获和处理',
    memoryLeaks: '内存泄漏 - 未清理的异步操作',
    raceConditions: '竞态条件 - 并发访问共享资源',
    backpressure: '背压处理 - 生产消费速度不匹配'
  }
};

console.log('异步编程模式:', asyncPatterns);
```

## 🔄 基础异步模式

### Promise高级用法

```javascript
// advanced-promise-patterns.js

// Promise工具类
class PromiseUtils {
  // 带超时的Promise
  static timeout(promise, ms, timeoutError = new Error('Operation timeout')) {
    return Promise.race([
      promise,
      new Promise((_, reject) => 
        setTimeout(() => reject(timeoutError), ms)
      )
    ]);
  }

  // 重试Promise
  static async retry(fn, options = {}) {
    const {
      retries = 3,
      delay = 1000,
      backoff = 2,
      condition = () => true
    } = options;

    let lastError;
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const result = await fn(attempt);
        return result;
      } catch (error) {
        lastError = error;
        
        if (attempt === retries || !condition(error)) {
          throw error;
        }
        
        const waitTime = delay * Math.pow(backoff, attempt);
        console.log(`重试第 ${attempt + 1} 次，等待 ${waitTime}ms...`);
        
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
    
    throw lastError;
  }

  // 限制并发数的Promise.all
  static async concurrentLimit(tasks, limit = 5) {
    const results = new Array(tasks.length);
    const executing = [];
    
    for (let i = 0; i < tasks.length; i++) {
      const task = Promise.resolve(tasks[i]).then(result => {
        results[i] = result;
      });
      
      executing.push(task);
      
      if (executing.length >= limit) {
        await Promise.race(executing);
        executing.splice(executing.findIndex(t => t === task), 1);
      }
    }
    
    await Promise.all(executing);
    return results;
  }

  // Promise队列 - 顺序执行
  static async sequence(tasks) {
    const results = [];
    
    for (const task of tasks) {
      const result = await Promise.resolve(task);
      results.push(result);
    }
    
    return results;
  }

  // Promise管道
  static pipeline(...functions) {
    return (input) => {
      return functions.reduce(
        (promise, fn) => promise.then(fn),
        Promise.resolve(input)
      );
    };
  }

  // 条件Promise
  static conditional(condition, thenPromise, elsePromise = Promise.resolve()) {
    return Promise.resolve(condition).then(result => {
      return result ? thenPromise : elsePromise;
    });
  }

  // Promise缓存
  static memoize(fn, keyGenerator = (...args) => JSON.stringify(args)) {
    const cache = new Map();
    
    return (...args) => {
      const key = keyGenerator(...args);
      
      if (cache.has(key)) {
        return cache.get(key);
      }
      
      const promise = Promise.resolve(fn(...args));
      cache.set(key, promise);
      
      // 清理失败的Promise
      promise.catch(() => cache.delete(key));
      
      return promise;
    };
  }

  // Promise池
  static createPool(factory, options = {}) {
    const { 
      max = 10, 
      min = 2,
      acquireTimeout = 30000,
      idleTimeout = 300000 
    } = options;
    
    const pool = {
      available: [],
      busy: new Set(),
      pending: [],
      
      async acquire() {
        if (this.available.length > 0) {
          const resource = this.available.pop();
          this.busy.add(resource);
          return resource;
        }
        
        if (this.busy.size < max) {
          const resource = await factory();
          this.busy.add(resource);
          return resource;
        }
        
        // 等待资源释放
        return new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            const index = this.pending.findIndex(p => p.resolve === resolve);
            if (index > -1) {
              this.pending.splice(index, 1);
            }
            reject(new Error('Acquire timeout'));
          }, acquireTimeout);
          
          this.pending.push({ resolve, reject, timeout });
        });
      },
      
      release(resource) {
        this.busy.delete(resource);
        
        if (this.pending.length > 0) {
          const { resolve, timeout } = this.pending.shift();
          clearTimeout(timeout);
          this.busy.add(resource);
          resolve(resource);
        } else {
          this.available.push(resource);
          
          // 设置空闲超时
          setTimeout(() => {
            const index = this.available.indexOf(resource);
            if (index > -1 && this.available.length > min) {
              this.available.splice(index, 1);
              // 销毁资源的逻辑可以在这里添加
            }
          }, idleTimeout);
        }
      },
      
      async destroy() {
        // 清理所有资源
        this.available.length = 0;
        this.busy.clear();
        
        // 拒绝所有等待的请求
        this.pending.forEach(({ reject, timeout }) => {
          clearTimeout(timeout);
          reject(new Error('Pool destroyed'));
        });
        this.pending.length = 0;
      }
    };
    
    return pool;
  }
}

// 异步迭代器模式
class AsyncIteratorPatterns {
  // 异步生成器 - 分页数据
  static async* paginatedData(fetchPage, pageSize = 10) {
    let page = 1;
    let hasMore = true;
    
    while (hasMore) {
      try {
        const data = await fetchPage(page, pageSize);
        
        if (!data || data.length === 0) {
          hasMore = false;
          break;
        }
        
        for (const item of data) {
          yield item;
        }
        
        hasMore = data.length === pageSize;
        page++;
        
      } catch (error) {
        console.error(`获取第 ${page} 页数据失败:`, error);
        throw error;
      }
    }
  }

  // 异步生成器 - 流式处理
  static async* streamProcessor(source, processor) {
    for await (const item of source) {
      try {
        const processed = await processor(item);
        if (processed !== undefined) {
          yield processed;
        }
      } catch (error) {
        console.error('处理项目失败:', error);
        // 可以选择跳过错误项或重新抛出错误
      }
    }
  }

  // 异步生成器 - 批量处理
  static async* batchProcessor(source, batchSize = 10, processor) {
    let batch = [];
    
    for await (const item of source) {
      batch.push(item);
      
      if (batch.length >= batchSize) {
        try {
          const results = await processor(batch);
          for (const result of results) {
            yield result;
          }
        } catch (error) {
          console.error('批量处理失败:', error);
          throw error;
        }
        
        batch = [];
      }
    }
    
    // 处理剩余的批次
    if (batch.length > 0) {
      try {
        const results = await processor(batch);
        for (const result of results) {
          yield result;
        }
      } catch (error) {
        console.error('最后批次处理失败:', error);
        throw error;
      }
    }
  }
}

// 使用示例
async function demonstratePromisePatterns() {
  console.log('🔄 Promise高级模式演示...\n');

  // 1. 超时Promise
  console.log('1. 超时Promise:');
  try {
    const slowOperation = new Promise(resolve => 
      setTimeout(() => resolve('完成'), 2000)
    );
    
    const result = await PromiseUtils.timeout(slowOperation, 1000);
    console.log('  结果:', result);
  } catch (error) {
    console.log('  超时错误:', error.message);
  }

  // 2. 重试Promise
  console.log('\n2. 重试Promise:');
  let attempt = 0;
  const unreliableOperation = () => {
    attempt++;
    if (attempt < 3) {
      throw new Error(`尝试 ${attempt} 失败`);
    }
    return `成功在第 ${attempt} 次尝试`;
  };

  try {
    const result = await PromiseUtils.retry(unreliableOperation, {
      retries: 3,
      delay: 100
    });
    console.log('  重试结果:', result);
  } catch (error) {
    console.log('  重试失败:', error.message);
  }

  // 3. 并发限制
  console.log('\n3. 并发限制:');
  const tasks = Array.from({ length: 10 }, (_, i) => 
    new Promise(resolve => 
      setTimeout(() => resolve(`任务 ${i + 1} 完成`), Math.random() * 1000)
    )
  );

  const startTime = Date.now();
  const results = await PromiseUtils.concurrentLimit(tasks, 3);
  const duration = Date.now() - startTime;
  
  console.log(`  并发执行完成，耗时: ${duration}ms`);
  console.log(`  结果数量: ${results.length}`);

  // 4. Promise管道
  console.log('\n4. Promise管道:');
  const pipeline = PromiseUtils.pipeline(
    x => x * 2,
    async x => {
      await new Promise(resolve => setTimeout(resolve, 100));
      return x + 10;
    },
    x => x.toString()
  );

  const pipelineResult = await pipeline(5);
  console.log('  管道结果:', pipelineResult);

  // 5. 异步迭代器
  console.log('\n5. 异步迭代器:');
  
  // 模拟分页数据获取
  const fetchPage = async (page, pageSize) => {
    await new Promise(resolve => setTimeout(resolve, 100));
    
    if (page > 3) return []; // 模拟没有更多数据
    
    return Array.from({ length: pageSize }, (_, i) => 
      `页面${page}-项目${i + 1}`
    );
  };

  let count = 0;
  for await (const item of AsyncIteratorPatterns.paginatedData(fetchPage, 3)) {
    count++;
    if (count <= 5) {
      console.log(`  分页数据: ${item}`);
    }
  }
  console.log(`  总共处理了 ${count} 项数据`);
}

module.exports = {
  PromiseUtils,
  AsyncIteratorPatterns,
  demonstratePromisePatterns
};
```

### 异步流程控制

```javascript
// async-flow-control.js

// 异步流程控制器
class AsyncFlowController {
  constructor() {
    this.tasks = new Map();
    this.results = new Map();
    this.dependencies = new Map();
  }

  // 添加任务
  addTask(name, fn, dependencies = []) {
    this.tasks.set(name, fn);
    this.dependencies.set(name, dependencies);
    return this;
  }

  // 执行所有任务（拓扑排序）
  async executeAll() {
    const completed = new Set();
    const executing = new Map();
    const results = new Map();
    
    const canExecute = (taskName) => {
      const deps = this.dependencies.get(taskName) || [];
      return deps.every(dep => completed.has(dep));
    };
    
    const executeTask = async (taskName) => {
      if (completed.has(taskName) || executing.has(taskName)) {
        return;
      }
      
      // 等待依赖完成
      const deps = this.dependencies.get(taskName) || [];
      for (const dep of deps) {
        if (!completed.has(dep)) {
          if (executing.has(dep)) {
            await executing.get(dep);
          } else {
            await executeTask(dep);
          }
        }
      }
      
      // 执行任务
      const taskFn = this.tasks.get(taskName);
      const dependencyResults = {};
      
      for (const dep of deps) {
        dependencyResults[dep] = results.get(dep);
      }
      
      console.log(`🚀 开始执行任务: ${taskName}`);
      const startTime = Date.now();
      
      const promise = Promise.resolve(taskFn(dependencyResults));
      executing.set(taskName, promise);
      
      try {
        const result = await promise;
        const duration = Date.now() - startTime;
        
        results.set(taskName, result);
        completed.add(taskName);
        executing.delete(taskName);
        
        console.log(`✅ 任务完成: ${taskName} (${duration}ms)`);
        return result;
        
      } catch (error) {
        executing.delete(taskName);
        console.error(`❌ 任务失败: ${taskName}`, error);
        throw error;
      }
    };
    
    // 启动所有可执行的任务
    const promises = [];
    for (const taskName of this.tasks.keys()) {
      promises.push(executeTask(taskName));
    }
    
    await Promise.all(promises);
    return Object.fromEntries(results);
  }

  // 执行特定任务及其依赖
  async execute(taskName) {
    if (!this.tasks.has(taskName)) {
      throw new Error(`任务不存在: ${taskName}`);
    }
    
    const completed = new Set();
    const results = new Map();
    
    const executeRecursive = async (name) => {
      if (completed.has(name)) {
        return results.get(name);
      }
      
      const deps = this.dependencies.get(name) || [];
      const dependencyResults = {};
      
      // 先执行依赖
      for (const dep of deps) {
        dependencyResults[dep] = await executeRecursive(dep);
      }
      
      // 执行当前任务
      const taskFn = this.tasks.get(name);
      console.log(`🚀 执行任务: ${name}`);
      
      const result = await taskFn(dependencyResults);
      
      results.set(name, result);
      completed.add(name);
      
      console.log(`✅ 任务完成: ${name}`);
      return result;
    };
    
    return await executeRecursive(taskName);
  }
}

// 异步状态机
class AsyncStateMachine {
  constructor(initialState, transitions) {
    this.currentState = initialState;
    this.transitions = transitions;
    this.history = [initialState];
    this.listeners = new Map();
  }

  // 添加状态监听器
  on(state, listener) {
    if (!this.listeners.has(state)) {
      this.listeners.set(state, []);
    }
    this.listeners.get(state).push(listener);
  }

  // 触发状态转换
  async trigger(event, data = null) {
    const currentTransitions = this.transitions[this.currentState];
    
    if (!currentTransitions || !currentTransitions[event]) {
      throw new Error(`无效的状态转换: ${this.currentState} -> ${event}`);
    }
    
    const transition = currentTransitions[event];
    const { target, action } = transition;
    
    console.log(`🔄 状态转换: ${this.currentState} --[${event}]--> ${target}`);
    
    try {
      // 执行转换动作
      if (action) {
        await action(this.currentState, target, data);
      }
      
      const previousState = this.currentState;
      this.currentState = target;
      this.history.push(target);
      
      // 触发状态监听器
      const listeners = this.listeners.get(target) || [];
      for (const listener of listeners) {
        try {
          await listener(previousState, target, data);
        } catch (error) {
          console.error('状态监听器执行失败:', error);
        }
      }
      
      console.log(`✅ 状态转换完成: ${target}`);
      return target;
      
    } catch (error) {
      console.error(`❌ 状态转换失败: ${this.currentState} -> ${target}`, error);
      throw error;
    }
  }

  // 获取当前状态
  getState() {
    return this.currentState;
  }

  // 获取状态历史
  getHistory() {
    return [...this.history];
  }

  // 检查是否可以执行某个事件
  canTrigger(event) {
    const currentTransitions = this.transitions[this.currentState];
    return currentTransitions && currentTransitions[event];
  }
}

// 异步工作流引擎
class AsyncWorkflowEngine {
  constructor() {
    this.workflows = new Map();
    this.executions = new Map();
  }

  // 定义工作流
  defineWorkflow(name, definition) {
    this.workflows.set(name, definition);
    console.log(`📋 工作流已定义: ${name}`);
  }

  // 执行工作流
  async executeWorkflow(workflowName, input = {}) {
    const definition = this.workflows.get(workflowName);
    if (!definition) {
      throw new Error(`工作流不存在: ${workflowName}`);
    }

    const executionId = `${workflowName}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const execution = {
      id: executionId,
      workflowName: workflowName,
      status: 'running',
      startTime: Date.now(),
      input: input,
      context: { ...input },
      steps: [],
      currentStep: 0
    };

    this.executions.set(executionId, execution);
    
    console.log(`🚀 开始执行工作流: ${workflowName} (${executionId})`);

    try {
      const result = await this.executeSteps(definition.steps, execution);
      
      execution.status = 'completed';
      execution.endTime = Date.now();
      execution.result = result;
      
      console.log(`✅ 工作流执行完成: ${workflowName} (${Date.now() - execution.startTime}ms)`);
      return result;
      
    } catch (error) {
      execution.status = 'failed';
      execution.endTime = Date.now();
      execution.error = error.message;
      
      console.error(`❌ 工作流执行失败: ${workflowName}`, error);
      throw error;
    }
  }

  // 执行工作流步骤
  async executeSteps(steps, execution) {
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      execution.currentStep = i;
      
      console.log(`📍 执行步骤 ${i + 1}/${steps.length}: ${step.name}`);
      
      const stepExecution = {
        name: step.name,
        type: step.type,
        startTime: Date.now(),
        input: execution.context
      };
      
      try {
        let result;
        
        switch (step.type) {
          case 'task':
            result = await this.executeTask(step, execution.context);
            break;
          case 'parallel':
            result = await this.executeParallel(step, execution.context);
            break;
          case 'condition':
            result = await this.executeCondition(step, execution.context);
            break;
          case 'loop':
            result = await this.executeLoop(step, execution.context);
            break;
          default:
            throw new Error(`未知步骤类型: ${step.type}`);
        }
        
        stepExecution.status = 'completed';
        stepExecution.endTime = Date.now();
        stepExecution.result = result;
        
        // 更新上下文
        if (step.output && result !== undefined) {
          execution.context[step.output] = result;
        }
        
      } catch (error) {
        stepExecution.status = 'failed';
        stepExecution.endTime = Date.now();
        stepExecution.error = error.message;
        
        execution.steps.push(stepExecution);
        throw error;
      }
      
      execution.steps.push(stepExecution);
    }
    
    return execution.context;
  }

  // 执行任务步骤
  async executeTask(step, context) {
    if (typeof step.action === 'function') {
      return await step.action(context);
    } else {
      throw new Error('任务步骤必须包含action函数');
    }
  }

  // 执行并行步骤
  async executeParallel(step, context) {
    const promises = step.tasks.map(task => this.executeTask(task, context));
    return await Promise.all(promises);
  }

  // 执行条件步骤
  async executeCondition(step, context) {
    const condition = typeof step.condition === 'function' 
      ? await step.condition(context)
      : step.condition;
    
    if (condition && step.then) {
      return await this.executeSteps([step.then], { context });
    } else if (!condition && step.else) {
      return await this.executeSteps([step.else], { context });
    }
    
    return null;
  }

  // 执行循环步骤
  async executeLoop(step, context) {
    const results = [];
    let iteration = 0;
    
    while (true) {
      const shouldContinue = typeof step.condition === 'function'
        ? await step.condition(context, iteration)
        : iteration < (step.iterations || 1);
      
      if (!shouldContinue) {
        break;
      }
      
      const iterationContext = { ...context, iteration };
      const result = await this.executeSteps(step.steps, { context: iterationContext });
      
      results.push(result);
      iteration++;
      
      if (step.maxIterations && iteration >= step.maxIterations) {
        break;
      }
    }
    
    return results;
  }

  // 获取执行状态
  getExecution(executionId) {
    return this.executions.get(executionId);
  }

  // 获取所有执行
  getAllExecutions() {
    return Array.from(this.executions.values());
  }
}

// 使用示例
async function demonstrateAsyncFlowControl() {
  console.log('🔄 异步流程控制演示...\n');

  // 1. 任务依赖执行
  console.log('1. 任务依赖执行:');
  const controller = new AsyncFlowController();
  
  controller
    .addTask('fetchUser', async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
      return { id: 1, name: 'Alice' };
    })
    .addTask('fetchProfile', async (deps) => {
      await new Promise(resolve => setTimeout(resolve, 150));
      return { userId: deps.fetchUser.id, bio: 'Software Developer' };
    }, ['fetchUser'])
    .addTask('fetchPosts', async (deps) => {
      await new Promise(resolve => setTimeout(resolve, 200));
      return [
        { id: 1, title: 'Post 1', authorId: deps.fetchUser.id },
        { id: 2, title: 'Post 2', authorId: deps.fetchUser.id }
      ];
    }, ['fetchUser'])
    .addTask('buildUserData', async (deps) => {
      return {
        user: deps.fetchUser,
        profile: deps.fetchProfile,
        posts: deps.fetchPosts
      };
    }, ['fetchUser', 'fetchProfile', 'fetchPosts']);

  const results = await controller.executeAll();
  console.log('  执行结果:', JSON.stringify(results.buildUserData, null, 2));

  // 2. 异步状态机
  console.log('\n2. 异步状态机:');
  const orderStateMachine = new AsyncStateMachine('pending', {
    pending: {
      pay: {
        target: 'paid',
        action: async (from, to, data) => {
          console.log(`  处理支付: ${JSON.stringify(data)}`);
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      },
      cancel: { target: 'cancelled' }
    },
    paid: {
      ship: {
        target: 'shipped',
        action: async () => {
          console.log('  准备发货...');
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      },
      refund: { target: 'refunded' }
    },
    shipped: {
      deliver: { target: 'delivered' }
    },
    cancelled: {},
    refunded: {},
    delivered: {}
  });

  await orderStateMachine.trigger('pay', { amount: 100, method: 'credit_card' });
  await orderStateMachine.trigger('ship');
  await orderStateMachine.trigger('deliver');
  
  console.log('  最终状态:', orderStateMachine.getState());
  console.log('  状态历史:', orderStateMachine.getHistory());

  // 3. 工作流引擎
  console.log('\n3. 工作流引擎:');
  const workflowEngine = new AsyncWorkflowEngine();
  
  workflowEngine.defineWorkflow('userRegistration', {
    steps: [
      {
        name: 'validateInput',
        type: 'task',
        action: async (context) => {
          console.log('  验证输入数据...');
          if (!context.email || !context.password) {
            throw new Error('邮箱和密码是必需的');
          }
          return { valid: true };
        },
        output: 'validation'
      },
      {
        name: 'createUser',
        type: 'task',
        action: async (context) => {
          console.log('  创建用户账户...');
          await new Promise(resolve => setTimeout(resolve, 100));
          return { 
            id: Math.floor(Math.random() * 1000),
            email: context.email,
            createdAt: new Date().toISOString()
          };
        },
        output: 'user'
      },
      {
        name: 'sendWelcomeEmail',
        type: 'task',
        action: async (context) => {
          console.log('  发送欢迎邮件...');
          await new Promise(resolve => setTimeout(resolve, 150));
          return { sent: true, to: context.user.email };
        },
        output: 'emailResult'
      }
    ]
  });

  const workflowResult = await workflowEngine.executeWorkflow('userRegistration', {
    email: 'user@example.com',
    password: 'securePassword'
  });

  console.log('  工作流结果:', JSON.stringify(workflowResult.user, null, 2));
}

module.exports = {
  AsyncFlowController,
  AsyncStateMachine,
  AsyncWorkflowEngine,
  demonstrateAsyncFlowControl
};
```

异步模式是Node.js编程的核心技能，掌握各种异步模式和流程控制技术对构建复杂的异步应用至关重要！
