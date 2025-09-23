# 响应式编程

## 🎯 学习目标

- 深入理解响应式编程的核心概念和原理
- 掌握Observable、Stream等响应式数据流
- 学会使用RxJS进行响应式编程
- 了解响应式架构的设计模式和最佳实践

## 📚 核心概念

### 响应式编程基础

```javascript
// 响应式编程核心概念
const reactiveProgrammingConcepts = {
  paradigm: {
    description: '基于数据流和变化传播的编程范式',
    characteristics: [
      '声明式编程',
      '异步数据流',
      '事件驱动',
      '函数式编程'
    ],
    benefits: [
      '处理复杂异步逻辑',
      '统一的数据流处理',
      '强大的操作符',
      '错误处理机制'
    ]
  },
  coreElements: {
    observable: 'Observable - 可观察对象，数据流的源头',
    observer: 'Observer - 观察者，订阅和处理数据',
    subscription: 'Subscription - 订阅关系，管理生命周期',
    operators: 'Operators - 操作符，转换和处理数据流',
    scheduler: 'Scheduler - 调度器，控制执行时机'
  },
  patterns: {
    hot: 'Hot Observable - 热流，主动发射数据',
    cold: 'Cold Observable - 冷流，被动发射数据',
    subject: 'Subject - 既是Observable又是Observer',
    backpressure: 'Backpressure - 背压处理机制'
  }
};

console.log('响应式编程概念:', reactiveProgrammingConcepts);
```

## 🌊 基础响应式实现

### 简单Observable实现

```javascript
// simple-observable.js

// 基础Observable实现
class SimpleObservable {
  constructor(subscribe) {
    this.subscribe = subscribe;
  }

  // 静态创建方法
  static create(subscribe) {
    return new SimpleObservable(subscribe);
  }

  static of(...values) {
    return new SimpleObservable(observer => {
      try {
        for (const value of values) {
          observer.next(value);
        }
        observer.complete();
      } catch (error) {
        observer.error(error);
      }
    });
  }

  static from(iterable) {
    return new SimpleObservable(observer => {
      try {
        for (const value of iterable) {
          observer.next(value);
        }
        observer.complete();
      } catch (error) {
        observer.error(error);
      }
    });
  }

  static fromEvent(target, eventName) {
    return new SimpleObservable(observer => {
      const handler = (event) => observer.next(event);
      target.addEventListener(eventName, handler);
      
      return () => {
        target.removeEventListener(eventName, handler);
      };
    });
  }

  static interval(period) {
    return new SimpleObservable(observer => {
      let count = 0;
      const intervalId = setInterval(() => {
        observer.next(count++);
      }, period);
      
      return () => clearInterval(intervalId);
    });
  }

  static timer(delay, period) {
    return new SimpleObservable(observer => {
      const timeoutId = setTimeout(() => {
        observer.next(0);
        
        if (period) {
          let count = 1;
          const intervalId = setInterval(() => {
            observer.next(count++);
          }, period);
          
          return () => clearInterval(intervalId);
        } else {
          observer.complete();
        }
      }, delay);
      
      return () => clearTimeout(timeoutId);
    });
  }

  // 基础操作符
  map(transform) {
    return new SimpleObservable(observer => {
      return this.subscribe({
        next: value => {
          try {
            observer.next(transform(value));
          } catch (error) {
            observer.error(error);
          }
        },
        error: error => observer.error(error),
        complete: () => observer.complete()
      });
    });
  }

  filter(predicate) {
    return new SimpleObservable(observer => {
      return this.subscribe({
        next: value => {
          try {
            if (predicate(value)) {
              observer.next(value);
            }
          } catch (error) {
            observer.error(error);
          }
        },
        error: error => observer.error(error),
        complete: () => observer.complete()
      });
    });
  }

  take(count) {
    return new SimpleObservable(observer => {
      let taken = 0;
      const subscription = this.subscribe({
        next: value => {
          if (taken < count) {
            observer.next(value);
            taken++;
            if (taken === count) {
              observer.complete();
              if (subscription) subscription();
            }
          }
        },
        error: error => observer.error(error),
        complete: () => observer.complete()
      });
      
      return subscription;
    });
  }

  skip(count) {
    return new SimpleObservable(observer => {
      let skipped = 0;
      return this.subscribe({
        next: value => {
          if (skipped < count) {
            skipped++;
          } else {
            observer.next(value);
          }
        },
        error: error => observer.error(error),
        complete: () => observer.complete()
      });
    });
  }

  debounceTime(delay) {
    return new SimpleObservable(observer => {
      let timeoutId;
      
      return this.subscribe({
        next: value => {
          if (timeoutId) {
            clearTimeout(timeoutId);
          }
          
          timeoutId = setTimeout(() => {
            observer.next(value);
          }, delay);
        },
        error: error => observer.error(error),
        complete: () => {
          if (timeoutId) {
            clearTimeout(timeoutId);
          }
          observer.complete();
        }
      });
    });
  }

  throttleTime(delay) {
    return new SimpleObservable(observer => {
      let lastEmitTime = 0;
      
      return this.subscribe({
        next: value => {
          const now = Date.now();
          if (now - lastEmitTime >= delay) {
            observer.next(value);
            lastEmitTime = now;
          }
        },
        error: error => observer.error(error),
        complete: () => observer.complete()
      });
    });
  }

  distinctUntilChanged() {
    return new SimpleObservable(observer => {
      let hasValue = false;
      let lastValue;
      
      return this.subscribe({
        next: value => {
          if (!hasValue || value !== lastValue) {
            hasValue = true;
            lastValue = value;
            observer.next(value);
          }
        },
        error: error => observer.error(error),
        complete: () => observer.complete()
      });
    });
  }

  // 组合操作符
  merge(other) {
    return new SimpleObservable(observer => {
      let completed = 0;
      const subscription1 = this.subscribe({
        next: value => observer.next(value),
        error: error => observer.error(error),
        complete: () => {
          completed++;
          if (completed === 2) observer.complete();
        }
      });
      
      const subscription2 = other.subscribe({
        next: value => observer.next(value),
        error: error => observer.error(error),
        complete: () => {
          completed++;
          if (completed === 2) observer.complete();
        }
      });
      
      return () => {
        if (subscription1) subscription1();
        if (subscription2) subscription2();
      };
    });
  }

  concat(other) {
    return new SimpleObservable(observer => {
      const subscription1 = this.subscribe({
        next: value => observer.next(value),
        error: error => observer.error(error),
        complete: () => {
          const subscription2 = other.subscribe({
            next: value => observer.next(value),
            error: error => observer.error(error),
            complete: () => observer.complete()
          });
        }
      });
      
      return subscription1;
    });
  }

  // 错误处理
  catchError(handler) {
    return new SimpleObservable(observer => {
      return this.subscribe({
        next: value => observer.next(value),
        error: error => {
          try {
            const fallback = handler(error);
            if (fallback instanceof SimpleObservable) {
              fallback.subscribe(observer);
            } else {
              observer.next(fallback);
              observer.complete();
            }
          } catch (handlerError) {
            observer.error(handlerError);
          }
        },
        complete: () => observer.complete()
      });
    });
  }

  retry(count = 1) {
    return new SimpleObservable(observer => {
      let attempts = 0;
      
      const attempt = () => {
        this.subscribe({
          next: value => observer.next(value),
          error: error => {
            attempts++;
            if (attempts <= count) {
              console.log(`重试第 ${attempts} 次...`);
              attempt();
            } else {
              observer.error(error);
            }
          },
          complete: () => observer.complete()
        });
      };
      
      attempt();
    });
  }

  // 副作用操作符
  tap(sideEffect) {
    return new SimpleObservable(observer => {
      return this.subscribe({
        next: value => {
          try {
            sideEffect(value);
            observer.next(value);
          } catch (error) {
            observer.error(error);
          }
        },
        error: error => observer.error(error),
        complete: () => observer.complete()
      });
    });
  }

  // 终端操作符
  forEach(callback) {
    return new Promise((resolve, reject) => {
      this.subscribe({
        next: value => {
          try {
            callback(value);
          } catch (error) {
            reject(error);
          }
        },
        error: error => reject(error),
        complete: () => resolve()
      });
    });
  }

  toArray() {
    return new Promise((resolve, reject) => {
      const values = [];
      this.subscribe({
        next: value => values.push(value),
        error: error => reject(error),
        complete: () => resolve(values)
      });
    });
  }

  reduce(accumulator, seed) {
    return new Promise((resolve, reject) => {
      let acc = seed;
      let hasValue = seed !== undefined;
      
      this.subscribe({
        next: value => {
          try {
            if (hasValue) {
              acc = accumulator(acc, value);
            } else {
              acc = value;
              hasValue = true;
            }
          } catch (error) {
            reject(error);
          }
        },
        error: error => reject(error),
        complete: () => resolve(acc)
      });
    });
  }
}

// Subject实现
class SimpleSubject extends SimpleObservable {
  constructor() {
    super(observer => {
      this.observers.push(observer);
      
      return () => {
        const index = this.observers.indexOf(observer);
        if (index > -1) {
          this.observers.splice(index, 1);
        }
      };
    });
    
    this.observers = [];
    this.isStopped = false;
    this.hasError = false;
    this.thrownError = null;
  }

  next(value) {
    if (this.isStopped) return;
    
    for (const observer of this.observers.slice()) {
      try {
        observer.next(value);
      } catch (error) {
        console.error('Observer处理错误:', error);
      }
    }
  }

  error(error) {
    if (this.isStopped) return;
    
    this.isStopped = true;
    this.hasError = true;
    this.thrownError = error;
    
    for (const observer of this.observers.slice()) {
      try {
        observer.error(error);
      } catch (e) {
        console.error('Observer错误处理失败:', e);
      }
    }
    
    this.observers = [];
  }

  complete() {
    if (this.isStopped) return;
    
    this.isStopped = true;
    
    for (const observer of this.observers.slice()) {
      try {
        observer.complete();
      } catch (error) {
        console.error('Observer完成处理错误:', error);
      }
    }
    
    this.observers = [];
  }

  asObservable() {
    return new SimpleObservable(observer => this.subscribe(observer));
  }
}

// BehaviorSubject实现
class SimpleBehaviorSubject extends SimpleSubject {
  constructor(initialValue) {
    super();
    this.value = initialValue;
    this.hasCurrentValue = true;
  }

  subscribe(observer) {
    const subscription = super.subscribe(observer);
    
    if (this.hasCurrentValue && !this.isStopped) {
      observer.next(this.value);
    }
    
    if (this.hasError) {
      observer.error(this.thrownError);
    } else if (this.isStopped) {
      observer.complete();
    }
    
    return subscription;
  }

  next(value) {
    this.value = value;
    super.next(value);
  }

  getValue() {
    if (this.hasError) {
      throw this.thrownError;
    } else if (this.isStopped) {
      throw new Error('BehaviorSubject已完成');
    }
    
    return this.value;
  }
}

module.exports = {
  SimpleObservable,
  SimpleSubject,
  SimpleBehaviorSubject
};
```

### 响应式数据流处理

```javascript
// reactive-data-streams.js
const { SimpleObservable, SimpleSubject, SimpleBehaviorSubject } = require('./simple-observable');

// 响应式数据存储
class ReactiveStore {
  constructor(initialState = {}) {
    this.state = new SimpleBehaviorSubject(initialState);
    this.actions = new SimpleSubject();
    this.effects = [];
    
    this.setupActionProcessing();
  }

  // 设置动作处理
  setupActionProcessing() {
    this.actions
      .tap(action => console.log(`🎯 执行动作: ${action.type}`))
      .subscribe({
        next: action => this.processAction(action),
        error: error => console.error('动作处理错误:', error)
      });
  }

  // 处理动作
  processAction(action) {
    try {
      const currentState = this.state.getValue();
      const newState = this.reducer(currentState, action);
      
      if (newState !== currentState) {
        this.state.next(newState);
      }
      
      // 触发副作用
      this.triggerEffects(action, newState);
      
    } catch (error) {
      console.error('状态更新失败:', error);
      this.state.error(error);
    }
  }

  // 状态归约器
  reducer(state, action) {
    switch (action.type) {
      case 'SET':
        return { ...state, [action.key]: action.value };
      
      case 'UPDATE':
        return { ...state, ...action.payload };
      
      case 'DELETE':
        const newState = { ...state };
        delete newState[action.key];
        return newState;
      
      case 'RESET':
        return action.payload || {};
      
      default:
        return state;
    }
  }

  // 触发副作用
  triggerEffects(action, state) {
    for (const effect of this.effects) {
      try {
        effect(action, state);
      } catch (error) {
        console.error('副作用执行失败:', error);
      }
    }
  }

  // 派发动作
  dispatch(action) {
    this.actions.next(action);
  }

  // 获取状态流
  getState$() {
    return this.state.asObservable();
  }

  // 选择状态片段
  select(selector) {
    return this.state
      .asObservable()
      .map(state => selector(state))
      .distinctUntilChanged();
  }

  // 添加副作用
  addEffect(effect) {
    this.effects.push(effect);
    
    return () => {
      const index = this.effects.indexOf(effect);
      if (index > -1) {
        this.effects.splice(index, 1);
      }
    };
  }

  // 获取当前状态
  getCurrentState() {
    return this.state.getValue();
  }
}

// 响应式HTTP客户端
class ReactiveHTTPClient {
  constructor() {
    this.requestSubject = new SimpleSubject();
    this.responseSubject = new SimpleSubject();
    this.errorSubject = new SimpleSubject();
    
    this.setupRequestProcessing();
  }

  setupRequestProcessing() {
    this.requestSubject
      .tap(request => console.log(`🌐 HTTP请求: ${request.method} ${request.url}`))
      .subscribe({
        next: request => this.processRequest(request),
        error: error => console.error('请求处理错误:', error)
      });
  }

  async processRequest(request) {
    const startTime = Date.now();
    
    try {
      // 模拟HTTP请求
      const response = await this.simulateHTTPRequest(request);
      const duration = Date.now() - startTime;
      
      const responseData = {
        ...response,
        request: request,
        duration: duration,
        timestamp: Date.now()
      };
      
      this.responseSubject.next(responseData);
      
    } catch (error) {
      const errorData = {
        error: error,
        request: request,
        timestamp: Date.now()
      };
      
      this.errorSubject.next(errorData);
    }
  }

  async simulateHTTPRequest(request) {
    // 模拟网络延迟
    const delay = Math.random() * 1000 + 200;
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // 模拟错误
    if (Math.random() < 0.1) {
      throw new Error('网络错误');
    }
    
    return {
      status: 200,
      statusText: 'OK',
      data: { 
        message: 'Success',
        timestamp: Date.now(),
        url: request.url
      }
    };
  }

  // 发送GET请求
  get(url, options = {}) {
    const request = { method: 'GET', url, ...options };
    this.requestSubject.next(request);
    
    return this.responseSubject
      .filter(response => 
        response.request.method === request.method && 
        response.request.url === request.url
      )
      .take(1);
  }

  // 发送POST请求
  post(url, data, options = {}) {
    const request = { method: 'POST', url, data, ...options };
    this.requestSubject.next(request);
    
    return this.responseSubject
      .filter(response => 
        response.request.method === request.method && 
        response.request.url === request.url
      )
      .take(1);
  }

  // 获取响应流
  getResponses$() {
    return this.responseSubject.asObservable();
  }

  // 获取错误流
  getErrors$() {
    return this.errorSubject.asObservable();
  }
}

// 响应式表单验证
class ReactiveFormValidator {
  constructor() {
    this.fields = new Map();
    this.validationResults = new SimpleSubject();
  }

  // 添加字段
  addField(name, initialValue = '', validators = []) {
    const field = {
      name: name,
      value: new SimpleBehaviorSubject(initialValue),
      validators: validators,
      errors: new SimpleBehaviorSubject([]),
      isValid: new SimpleBehaviorSubject(true)
    };

    // 设置验证
    field.value
      .debounceTime(300)
      .subscribe({
        next: value => this.validateField(name, value)
      });

    this.fields.set(name, field);
    return field;
  }

  // 验证字段
  async validateField(name, value) {
    const field = this.fields.get(name);
    if (!field) return;

    const errors = [];
    
    for (const validator of field.validators) {
      try {
        const result = await validator(value);
        if (result !== true) {
          errors.push(result);
        }
      } catch (error) {
        errors.push(error.message);
      }
    }

    field.errors.next(errors);
    field.isValid.next(errors.length === 0);

    // 发出整体验证结果
    this.emitValidationResult();
  }

  // 发出验证结果
  emitValidationResult() {
    const result = {};
    let isFormValid = true;

    for (const [name, field] of this.fields) {
      const fieldResult = {
        value: field.value.getValue(),
        errors: field.errors.getValue(),
        isValid: field.isValid.getValue()
      };
      
      result[name] = fieldResult;
      
      if (!fieldResult.isValid) {
        isFormValid = false;
      }
    }

    this.validationResults.next({
      fields: result,
      isValid: isFormValid,
      timestamp: Date.now()
    });
  }

  // 设置字段值
  setValue(name, value) {
    const field = this.fields.get(name);
    if (field) {
      field.value.next(value);
    }
  }

  // 获取字段值流
  getFieldValue$(name) {
    const field = this.fields.get(name);
    return field ? field.value.asObservable() : null;
  }

  // 获取字段错误流
  getFieldErrors$(name) {
    const field = this.fields.get(name);
    return field ? field.errors.asObservable() : null;
  }

  // 获取验证结果流
  getValidationResults$() {
    return this.validationResults.asObservable();
  }

  // 重置表单
  reset() {
    for (const field of this.fields.values()) {
      field.value.next('');
      field.errors.next([]);
      field.isValid.next(true);
    }
  }
}

// 常用验证器
const validators = {
  required: (message = '此字段是必需的') => {
    return (value) => {
      return value && value.trim() !== '' ? true : message;
    };
  },

  minLength: (min, message) => {
    return (value) => {
      const msg = message || `最少需要 ${min} 个字符`;
      return value && value.length >= min ? true : msg;
    };
  },

  maxLength: (max, message) => {
    return (value) => {
      const msg = message || `最多允许 ${max} 个字符`;
      return !value || value.length <= max ? true : msg;
    };
  },

  email: (message = '请输入有效的邮箱地址') => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return (value) => {
      return !value || emailRegex.test(value) ? true : message;
    };
  },

  pattern: (regex, message = '格式不正确') => {
    return (value) => {
      return !value || regex.test(value) ? true : message;
    };
  },

  async: (asyncValidator, message = '验证失败') => {
    return async (value) => {
      try {
        const result = await asyncValidator(value);
        return result ? true : message;
      } catch (error) {
        return error.message || message;
      }
    };
  }
};

module.exports = {
  ReactiveStore,
  ReactiveHTTPClient,
  ReactiveFormValidator,
  validators
};
```

## 🚀 实际应用示例

### 实时数据监控系统

```javascript
// real-time-monitoring.js
const { 
  SimpleObservable, 
  SimpleSubject, 
  SimpleBehaviorSubject 
} = require('./simple-observable');

// 实时监控系统
class RealTimeMonitoringSystem {
  constructor() {
    this.metrics = new Map();
    this.alerts = new SimpleSubject();
    this.systemStatus = new SimpleBehaviorSubject('healthy');
    this.thresholds = new Map();
    
    this.setupMonitoring();
  }

  // 设置监控
  setupMonitoring() {
    // 监控所有指标变化
    this.getAllMetrics$()
      .subscribe({
        next: metrics => this.analyzeMetrics(metrics),
        error: error => console.error('指标分析错误:', error)
      });

    // 监控告警
    this.alerts
      .tap(alert => console.log(`🚨 告警: ${alert.type} - ${alert.message}`))
      .subscribe();
  }

  // 添加指标
  addMetric(name, initialValue = 0) {
    const metric = {
      name: name,
      value: new SimpleBehaviorSubject(initialValue),
      history: [],
      lastUpdated: Date.now()
    };

    // 记录历史数据
    metric.value.subscribe({
      next: value => {
        metric.history.push({
          value: value,
          timestamp: Date.now()
        });
        
        // 限制历史记录长度
        if (metric.history.length > 100) {
          metric.history.shift();
        }
        
        metric.lastUpdated = Date.now();
      }
    });

    this.metrics.set(name, metric);
    return metric;
  }

  // 更新指标值
  updateMetric(name, value) {
    const metric = this.metrics.get(name);
    if (metric) {
      metric.value.next(value);
    }
  }

  // 设置阈值
  setThreshold(metricName, config) {
    this.thresholds.set(metricName, config);
  }

  // 获取指标流
  getMetric$(name) {
    const metric = this.metrics.get(name);
    return metric ? metric.value.asObservable() : null;
  }

  // 获取所有指标流
  getAllMetrics$() {
    return SimpleObservable.interval(1000)
      .map(() => {
        const metrics = {};
        for (const [name, metric] of this.metrics) {
          metrics[name] = {
            name: name,
            value: metric.value.getValue(),
            lastUpdated: metric.lastUpdated,
            history: metric.history.slice(-10) // 最近10个值
          };
        }
        return metrics;
      });
  }

  // 分析指标
  analyzeMetrics(metrics) {
    for (const [name, metric] of Object.entries(metrics)) {
      const threshold = this.thresholds.get(name);
      if (!threshold) continue;

      this.checkThresholds(name, metric, threshold);
    }

    // 更新系统状态
    this.updateSystemStatus(metrics);
  }

  // 检查阈值
  checkThresholds(name, metric, threshold) {
    const value = metric.value;

    if (threshold.critical && value >= threshold.critical) {
      this.alerts.next({
        type: 'critical',
        metric: name,
        value: value,
        threshold: threshold.critical,
        message: `${name} 达到临界值: ${value}`,
        timestamp: Date.now()
      });
    } else if (threshold.warning && value >= threshold.warning) {
      this.alerts.next({
        type: 'warning',
        metric: name,
        value: value,
        threshold: threshold.warning,
        message: `${name} 达到警告值: ${value}`,
        timestamp: Date.now()
      });
    }
  }

  // 更新系统状态
  updateSystemStatus(metrics) {
    let status = 'healthy';
    
    for (const [name, metric] of Object.entries(metrics)) {
      const threshold = this.thresholds.get(name);
      if (!threshold) continue;

      if (threshold.critical && metric.value >= threshold.critical) {
        status = 'critical';
        break;
      } else if (threshold.warning && metric.value >= threshold.warning) {
        status = 'warning';
      }
    }

    if (status !== this.systemStatus.getValue()) {
      this.systemStatus.next(status);
      console.log(`📊 系统状态更新: ${status}`);
    }
  }

  // 获取告警流
  getAlerts$() {
    return this.alerts.asObservable();
  }

  // 获取系统状态流
  getSystemStatus$() {
    return this.systemStatus.asObservable();
  }

  // 获取统计信息
  getStatistics() {
    const stats = {};
    
    for (const [name, metric] of this.metrics) {
      const history = metric.history;
      if (history.length === 0) continue;

      const values = history.map(h => h.value);
      stats[name] = {
        current: metric.value.getValue(),
        min: Math.min(...values),
        max: Math.max(...values),
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        trend: this.calculateTrend(values)
      };
    }

    return stats;
  }

  // 计算趋势
  calculateTrend(values) {
    if (values.length < 2) return 'stable';
    
    const recent = values.slice(-5);
    const older = values.slice(-10, -5);
    
    if (recent.length === 0 || older.length === 0) return 'stable';
    
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
    
    const change = (recentAvg - olderAvg) / olderAvg;
    
    if (change > 0.1) return 'increasing';
    if (change < -0.1) return 'decreasing';
    return 'stable';
  }
}

// 使用示例
async function demonstrateReactiveProgramming() {
  console.log('🌊 响应式编程演示...\n');

  // 1. 基础Observable操作
  console.log('1. 基础Observable操作:');
  
  const numbers$ = SimpleObservable.of(1, 2, 3, 4, 5, 6, 7, 8, 9, 10);
  
  const result = await numbers$
    .filter(x => x % 2 === 0)
    .map(x => x * x)
    .take(3)
    .toArray();
  
  console.log('  过滤偶数并平方，取前3个:', result);

  // 2. 实时监控系统
  console.log('\n2. 实时监控系统:');
  
  const monitoring = new RealTimeMonitoringSystem();
  
  // 添加指标
  monitoring.addMetric('cpu_usage', 0);
  monitoring.addMetric('memory_usage', 0);
  monitoring.addMetric('response_time', 0);
  
  // 设置阈值
  monitoring.setThreshold('cpu_usage', { warning: 70, critical: 90 });
  monitoring.setThreshold('memory_usage', { warning: 80, critical: 95 });
  monitoring.setThreshold('response_time', { warning: 500, critical: 1000 });

  // 订阅告警
  monitoring.getAlerts$()
    .take(3)
    .subscribe({
      next: alert => console.log(`  🚨 ${alert.type}: ${alert.message}`)
    });

  // 订阅系统状态
  monitoring.getSystemStatus$()
    .distinctUntilChanged()
    .take(3)
    .subscribe({
      next: status => console.log(`  📊 系统状态: ${status}`)
    });

  // 模拟指标更新
  setTimeout(() => monitoring.updateMetric('cpu_usage', 75), 100);
  setTimeout(() => monitoring.updateMetric('memory_usage', 85), 200);
  setTimeout(() => monitoring.updateMetric('response_time', 1200), 300);

  // 等待一段时间观察结果
  await new Promise(resolve => setTimeout(resolve, 1000));

  console.log('\n  📈 统计信息:');
  const stats = monitoring.getStatistics();
  for (const [name, stat] of Object.entries(stats)) {
    console.log(`    ${name}: 当前=${stat.current}, 平均=${stat.avg.toFixed(2)}, 趋势=${stat.trend}`);
  }

  // 3. 数据流合并
  console.log('\n3. 数据流合并:');
  
  const stream1$ = SimpleObservable.interval(300).map(x => `A${x}`).take(3);
  const stream2$ = SimpleObservable.interval(500).map(x => `B${x}`).take(3);
  
  const merged = await stream1$
    .merge(stream2$)
    .toArray();
  
  console.log('  合并流结果:', merged);

  // 4. 错误处理和重试
  console.log('\n4. 错误处理和重试:');
  
  let attempts = 0;
  const unreliable$ = SimpleObservable.create(observer => {
    attempts++;
    if (attempts < 3) {
      observer.error(new Error(`尝试 ${attempts} 失败`));
    } else {
      observer.next(`成功在第 ${attempts} 次尝试`);
      observer.complete();
    }
  });

  try {
    const retryResult = await unreliable$
      .retry(3)
      .toArray();
    
    console.log('  重试结果:', retryResult);
  } catch (error) {
    console.log('  最终失败:', error.message);
  }
}

// 如果直接运行此文件
if (require.main === module) {
  demonstrateReactiveProgramming().catch(console.error);
}

module.exports = {
  RealTimeMonitoringSystem,
  demonstrateReactiveProgramming
};
```

响应式编程为处理复杂的异步数据流提供了强大而优雅的解决方案，是现代JavaScript应用开发的重要技术！
