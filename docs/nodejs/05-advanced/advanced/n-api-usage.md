# N-API使用

## 🎯 学习目标

- 理解N-API的优势和应用场景
- 掌握N-API的基本使用方法
- 学会使用node-addon-api简化开发
- 了解N-API的最佳实践和性能优化

## 📚 核心概念

### N-API简介

```javascript
// N-API的主要特性
const napiFeatures = {
  abiStability: {
    description: 'ABI稳定性',
    benefits: [
      '跨Node.js版本兼容',
      '无需重新编译',
      '减少维护成本',
      '提高发布效率'
    ]
  },
  cInterface: {
    description: 'C语言接口',
    benefits: [
      '语言无关性',
      '更好的稳定性',
      '减少V8依赖',
      '长期支持保证'
    ]
  },
  performance: {
    description: '性能优化',
    benefits: [
      '减少类型转换开销',
      '优化内存使用',
      '更好的错误处理',
      '异步操作支持'
    ]
  }
};

console.log('N-API特性:', napiFeatures);
```

### 环境配置

```json
// package.json - N-API项目配置
{
  "name": "napi-example",
  "version": "1.0.0",
  "description": "N-API使用示例",
  "main": "index.js",
  "scripts": {
    "build": "node-gyp rebuild",
    "clean": "node-gyp clean",
    "test": "node test.js",
    "install": "node-gyp rebuild"
  },
  "dependencies": {
    "node-addon-api": "^5.0.0"
  },
  "devDependencies": {
    "node-gyp": "^9.0.0"
  },
  "binary": {
    "napi_versions": [3, 4, 5, 6, 7, 8]
  }
}
```

```python
# binding.gyp - N-API构建配置
{
  "targets": [
    {
      "target_name": "napi_addon",
      "sources": [
        "src/main.cpp",
        "src/basic_types.cpp",
        "src/async_operations.cpp",
        "src/object_wrap.cpp",
        "src/error_handling.cpp"
      ],
      "include_dirs": [
        "<!@(node -p \"require('node-addon-api').include\")"
      ],
      "defines": [
        "NAPI_DISABLE_CPP_EXCEPTIONS"
      ],
      "dependencies": [
        "<!(node -p \"require('node-addon-api').gyp\")"
      ],
      "cflags!": [ "-fno-exceptions" ],
      "cflags_cc!": [ "-fno-exceptions" ],
      "xcode_settings": {
        "GCC_ENABLE_CPP_EXCEPTIONS": "YES",
        "CLANG_CXX_LIBRARY": "libc++",
        "MACOSX_DEPLOYMENT_TARGET": "10.7"
      },
      "msvs_settings": {
        "VCCLCompilerTool": { "ExceptionHandling": 1 }
      }
    }
  ]
}
```

## 🛠️ 基础类型处理

### 数值类型操作

```cpp
// src/basic_types.cpp
#include <napi.h>
#include <cmath>

// 数值运算函数
Napi::Value AddNumbers(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    // 参数验证
    if (info.Length() < 2) {
        Napi::TypeError::New(env, "Expected at least 2 arguments").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    if (!info[0].IsNumber() || !info[1].IsNumber()) {
        Napi::TypeError::New(env, "Expected numbers").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    // 获取数值
    double num1 = info[0].As<Napi::Number>().DoubleValue();
    double num2 = info[1].As<Napi::Number>().DoubleValue();
    
    // 执行运算
    double result = num1 + num2;
    
    return Napi::Number::New(env, result);
}

// 数学运算集合
Napi::Object MathOperations(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 2 || !info[0].IsNumber() || !info[1].IsNumber()) {
        Napi::TypeError::New(env, "Expected two numbers").ThrowAsJavaScriptException();
        return Napi::Object::New(env);
    }
    
    double a = info[0].As<Napi::Number>().DoubleValue();
    double b = info[1].As<Napi::Number>().DoubleValue();
    
    // 创建结果对象
    Napi::Object result = Napi::Object::New(env);
    
    result.Set("add", Napi::Number::New(env, a + b));
    result.Set("subtract", Napi::Number::New(env, a - b));
    result.Set("multiply", Napi::Number::New(env, a * b));
    
    if (b != 0) {
        result.Set("divide", Napi::Number::New(env, a / b));
    } else {
        result.Set("divide", env.Null());
    }
    
    result.Set("power", Napi::Number::New(env, std::pow(a, b)));
    result.Set("max", Napi::Number::New(env, std::max(a, b)));
    result.Set("min", Napi::Number::New(env, std::min(a, b)));
    
    return result;
}

// 数组处理
Napi::Value ProcessArray(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 1 || !info[0].IsArray()) {
        Napi::TypeError::New(env, "Expected an array").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    Napi::Array inputArray = info[0].As<Napi::Array>();
    uint32_t length = inputArray.Length();
    
    // 创建结果数组
    Napi::Array resultArray = Napi::Array::New(env, length);
    
    double sum = 0.0;
    double max = -INFINITY;
    double min = INFINITY;
    
    for (uint32_t i = 0; i < length; i++) {
        Napi::Value element = inputArray.Get(i);
        
        if (element.IsNumber()) {
            double value = element.As<Napi::Number>().DoubleValue();
            
            // 计算平方
            double squared = value * value;
            resultArray.Set(i, Napi::Number::New(env, squared));
            
            // 统计信息
            sum += value;
            max = std::max(max, value);
            min = std::min(min, value);
        } else {
            resultArray.Set(i, env.Null());
        }
    }
    
    // 创建包含统计信息的结果对象
    Napi::Object result = Napi::Object::New(env);
    result.Set("squared", resultArray);
    result.Set("sum", Napi::Number::New(env, sum));
    result.Set("average", Napi::Number::New(env, sum / length));
    result.Set("max", Napi::Number::New(env, max));
    result.Set("min", Napi::Number::New(env, min));
    
    return result;
}
```

### 字符串处理

```cpp
// 字符串操作函数
Napi::Value StringOperations(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 1 || !info[0].IsString()) {
        Napi::TypeError::New(env, "Expected a string").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    std::string input = info[0].As<Napi::String>().Utf8Value();
    
    // 创建结果对象
    Napi::Object result = Napi::Object::New(env);
    
    // 长度
    result.Set("length", Napi::Number::New(env, input.length()));
    
    // 大写转换
    std::string uppercase = input;
    std::transform(uppercase.begin(), uppercase.end(), uppercase.begin(), ::toupper);
    result.Set("uppercase", Napi::String::New(env, uppercase));
    
    // 小写转换
    std::string lowercase = input;
    std::transform(lowercase.begin(), lowercase.end(), lowercase.begin(), ::tolower);
    result.Set("lowercase", Napi::String::New(env, lowercase));
    
    // 反转
    std::string reversed = input;
    std::reverse(reversed.begin(), reversed.end());
    result.Set("reversed", Napi::String::New(env, reversed));
    
    // 字符统计
    std::map<char, int> charCount;
    for (char c : input) {
        charCount[c]++;
    }
    
    Napi::Object charStats = Napi::Object::New(env);
    for (const auto& pair : charCount) {
        std::string key(1, pair.first);
        charStats.Set(key, Napi::Number::New(env, pair.second));
    }
    result.Set("charCount", charStats);
    
    return result;
}

// UTF-8字符串处理
Napi::Value Utf8StringInfo(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 1 || !info[0].IsString()) {
        Napi::TypeError::New(env, "Expected a string").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    Napi::String jsString = info[0].As<Napi::String>();
    
    // 获取不同编码的长度
    size_t utf8Length = jsString.Utf8Value().length();
    size_t utf16Length = jsString.Utf16Value().length();
    
    Napi::Object result = Napi::Object::New(env);
    result.Set("utf8Length", Napi::Number::New(env, utf8Length));
    result.Set("utf16Length", Napi::Number::New(env, utf16Length));
    result.Set("jsLength", Napi::Number::New(env, jsString.As<Napi::String>().Utf8Value().length()));
    
    // 字节数组
    std::string utf8Str = jsString.Utf8Value();
    Napi::Array byteArray = Napi::Array::New(env, utf8Str.length());
    
    for (size_t i = 0; i < utf8Str.length(); i++) {
        byteArray.Set(i, Napi::Number::New(env, static_cast<unsigned char>(utf8Str[i])));
    }
    
    result.Set("bytes", byteArray);
    
    return result;
}
```

## ⚡ 异步操作处理

### 异步Worker实现

```cpp
// src/async_operations.cpp
#include <napi.h>
#include <thread>
#include <chrono>
#include <future>

// 基础异步Worker
class BasicAsyncWorker : public Napi::AsyncWorker {
public:
    BasicAsyncWorker(Napi::Function& callback, int workload)
        : Napi::AsyncWorker(callback), workload_(workload), result_(0) {}
    
    ~BasicAsyncWorker() {}
    
    // 在工作线程中执行
    void Execute() override {
        try {
            // 模拟CPU密集型任务
            double sum = 0.0;
            for (int i = 0; i < workload_; i++) {
                sum += std::sin(i) * std::cos(i);
                
                // 检查取消状态
                if (this->IsCancelled()) {
                    SetError("Operation was cancelled");
                    return;
                }
                
                // 定期让出CPU
                if (i % 10000 == 0) {
                    std::this_thread::sleep_for(std::chrono::microseconds(1));
                }
            }
            result_ = sum;
        } catch (const std::exception& e) {
            SetError(e.what());
        }
    }
    
    // 在主线程中处理结果
    void OnOK() override {
        Napi::HandleScope scope(Env());
        
        // 创建结果对象
        Napi::Object result = Napi::Object::New(Env());
        result.Set("value", Napi::Number::New(Env(), result_));
        result.Set("workload", Napi::Number::New(Env(), workload_));
        
        Callback().Call({Env().Null(), result});
    }
    
    void OnError(const Napi::Error& e) override {
        Napi::HandleScope scope(Env());
        Callback().Call({e.Value(), Env().Undefined()});
    }

private:
    int workload_;
    double result_;
};

// 异步计算函数
Napi::Value ComputeAsync(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 2) {
        Napi::TypeError::New(env, "Expected workload and callback").ThrowAsJavaScriptException();
        return env.Undefined();
    }
    
    if (!info[0].IsNumber() || !info[1].IsFunction()) {
        Napi::TypeError::New(env, "Invalid arguments").ThrowAsJavaScriptException();
        return env.Undefined();
    }
    
    int workload = info[0].As<Napi::Number>().Int32Value();
    Napi::Function callback = info[1].As<Napi::Function>();
    
    BasicAsyncWorker* worker = new BasicAsyncWorker(callback, workload);
    worker->Queue();
    
    return env.Undefined();
}

// Promise-based异步操作
class PromiseAsyncWorker : public Napi::AsyncWorker {
public:
    PromiseAsyncWorker(Napi::Env env, int delay)
        : Napi::AsyncWorker(env), delay_(delay), deferred_(Napi::Promise::Deferred::New(env)) {}
    
    ~PromiseAsyncWorker() {}
    
    void Execute() override {
        // 模拟异步I/O操作
        std::this_thread::sleep_for(std::chrono::milliseconds(delay_));
        
        // 模拟一些计算
        result_ = delay_ * 1.5 + std::rand() % 100;
    }
    
    void OnOK() override {
        Napi::Object result = Napi::Object::New(Env());
        result.Set("value", Napi::Number::New(Env(), result_));
        result.Set("delay", Napi::Number::New(Env(), delay_));
        result.Set("timestamp", Napi::Number::New(Env(), std::time(nullptr)));
        
        deferred_.Resolve(result);
    }
    
    void OnError(const Napi::Error& e) override {
        deferred_.Reject(e.Value());
    }
    
    Napi::Promise GetPromise() {
        return deferred_.Promise();
    }

private:
    int delay_;
    double result_;
    Napi::Promise::Deferred deferred_;
};

// Promise异步函数
Napi::Promise AsyncWithPromise(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 1 || !info[0].IsNumber()) {
        auto deferred = Napi::Promise::Deferred::New(env);
        deferred.Reject(Napi::TypeError::New(env, "Expected a number").Value());
        return deferred.Promise();
    }
    
    int delay = info[0].As<Napi::Number>().Int32Value();
    
    PromiseAsyncWorker* worker = new PromiseAsyncWorker(env, delay);
    Napi::Promise promise = worker->GetPromise();
    worker->Queue();
    
    return promise;
}

// 批量异步操作
class BatchAsyncWorker : public Napi::AsyncWorker {
public:
    BatchAsyncWorker(Napi::Function& callback, std::vector<int> tasks)
        : Napi::AsyncWorker(callback), tasks_(std::move(tasks)) {}
    
    ~BatchAsyncWorker() {}
    
    void Execute() override {
        results_.reserve(tasks_.size());
        
        // 并行处理任务
        std::vector<std::future<double>> futures;
        futures.reserve(tasks_.size());
        
        for (int task : tasks_) {
            futures.emplace_back(std::async(std::launch::async, [task]() {
                // 模拟任务处理
                std::this_thread::sleep_for(std::chrono::milliseconds(task % 100));
                return static_cast<double>(task * task);
            }));
        }
        
        // 收集结果
        for (auto& future : futures) {
            if (this->IsCancelled()) {
                SetError("Batch operation was cancelled");
                return;
            }
            
            try {
                results_.push_back(future.get());
            } catch (const std::exception& e) {
                SetError(e.what());
                return;
            }
        }
    }
    
    void OnOK() override {
        Napi::HandleScope scope(Env());
        
        Napi::Array resultArray = Napi::Array::New(Env(), results_.size());
        for (size_t i = 0; i < results_.size(); i++) {
            resultArray.Set(i, Napi::Number::New(Env(), results_[i]));
        }
        
        Napi::Object result = Napi::Object::New(Env());
        result.Set("results", resultArray);
        result.Set("count", Napi::Number::New(Env(), results_.size()));
        
        Callback().Call({Env().Null(), result});
    }
    
    void OnError(const Napi::Error& e) override {
        Napi::HandleScope scope(Env());
        Callback().Call({e.Value(), Env().Undefined()});
    }

private:
    std::vector<int> tasks_;
    std::vector<double> results_;
};

// 批量异步处理函数
Napi::Value ProcessBatchAsync(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 2) {
        Napi::TypeError::New(env, "Expected array and callback").ThrowAsJavaScriptException();
        return env.Undefined();
    }
    
    if (!info[0].IsArray() || !info[1].IsFunction()) {
        Napi::TypeError::New(env, "Invalid arguments").ThrowAsJavaScriptException();
        return env.Undefined();
    }
    
    Napi::Array tasksArray = info[0].As<Napi::Array>();
    Napi::Function callback = info[1].As<Napi::Function>();
    
    // 转换任务数组
    std::vector<int> tasks;
    uint32_t length = tasksArray.Length();
    tasks.reserve(length);
    
    for (uint32_t i = 0; i < length; i++) {
        Napi::Value element = tasksArray.Get(i);
        if (element.IsNumber()) {
            tasks.push_back(element.As<Napi::Number>().Int32Value());
        }
    }
    
    BatchAsyncWorker* worker = new BatchAsyncWorker(callback, std::move(tasks));
    worker->Queue();
    
    return env.Undefined();
}
```

## 🏷️ 对象包装和类绑定

### 复杂对象包装

```cpp
// src/object_wrap.cpp
#include <napi.h>
#include <memory>
#include <vector>
#include <map>
#include <string>

// 原生C++数据结构
class DataProcessor {
public:
    DataProcessor(const std::string& name) : name_(name), processed_count_(0) {}
    
    void AddData(const std::string& key, double value) {
        data_[key] = value;
    }
    
    double GetData(const std::string& key) const {
        auto it = data_.find(key);
        return it != data_.end() ? it->second : 0.0;
    }
    
    std::vector<std::string> GetKeys() const {
        std::vector<std::string> keys;
        for (const auto& pair : data_) {
            keys.push_back(pair.first);
        }
        return keys;
    }
    
    double ProcessData(const std::string& operation) {
        processed_count_++;
        
        if (operation == "sum") {
            double sum = 0.0;
            for (const auto& pair : data_) {
                sum += pair.second;
            }
            return sum;
        } else if (operation == "average") {
            if (data_.empty()) return 0.0;
            double sum = ProcessData("sum");
            return sum / data_.size();
        } else if (operation == "max") {
            if (data_.empty()) return 0.0;
            double max_val = data_.begin()->second;
            for (const auto& pair : data_) {
                max_val = std::max(max_val, pair.second);
            }
            return max_val;
        }
        
        return 0.0;
    }
    
    void Clear() {
        data_.clear();
    }
    
    size_t Size() const {
        return data_.size();
    }
    
    const std::string& GetName() const {
        return name_;
    }
    
    int GetProcessedCount() const {
        return processed_count_;
    }

private:
    std::string name_;
    std::map<std::string, double> data_;
    int processed_count_;
};

// Node.js包装类
class DataProcessorWrapper : public Napi::ObjectWrap<DataProcessorWrapper> {
public:
    static Napi::Object Init(Napi::Env env, Napi::Object exports) {
        Napi::HandleScope scope(env);
        
        Napi::Function func = DefineClass(env, "DataProcessor", {
            InstanceMethod("addData", &DataProcessorWrapper::AddData),
            InstanceMethod("getData", &DataProcessorWrapper::GetData),
            InstanceMethod("getKeys", &DataProcessorWrapper::GetKeys),
            InstanceMethod("processData", &DataProcessorWrapper::ProcessData),
            InstanceMethod("clear", &DataProcessorWrapper::Clear),
            InstanceMethod("size", &DataProcessorWrapper::Size),
            InstanceAccessor("name", &DataProcessorWrapper::GetName, nullptr),
            InstanceAccessor("processedCount", &DataProcessorWrapper::GetProcessedCount, nullptr)
        });
        
        constructor = Napi::Persistent(func);
        constructor.SuppressDestruct();
        
        exports.Set("DataProcessor", func);
        return exports;
    }
    
    DataProcessorWrapper(const Napi::CallbackInfo& info) 
        : Napi::ObjectWrap<DataProcessorWrapper>(info) {
        Napi::Env env = info.Env();
        Napi::HandleScope scope(env);
        
        if (info.Length() < 1 || !info[0].IsString()) {
            Napi::TypeError::New(env, "Expected a string name").ThrowAsJavaScriptException();
            return;
        }
        
        std::string name = info[0].As<Napi::String>().Utf8Value();
        processor_ = std::make_unique<DataProcessor>(name);
    }

private:
    static Napi::FunctionReference constructor;
    std::unique_ptr<DataProcessor> processor_;
    
    Napi::Value AddData(const Napi::CallbackInfo& info) {
        Napi::Env env = info.Env();
        
        if (info.Length() < 2 || !info[0].IsString() || !info[1].IsNumber()) {
            Napi::TypeError::New(env, "Expected string key and number value").ThrowAsJavaScriptException();
            return env.Undefined();
        }
        
        std::string key = info[0].As<Napi::String>().Utf8Value();
        double value = info[1].As<Napi::Number>().DoubleValue();
        
        processor_->AddData(key, value);
        
        return env.Undefined();
    }
    
    Napi::Value GetData(const Napi::CallbackInfo& info) {
        Napi::Env env = info.Env();
        
        if (info.Length() < 1 || !info[0].IsString()) {
            Napi::TypeError::New(env, "Expected a string key").ThrowAsJavaScriptException();
            return env.Null();
        }
        
        std::string key = info[0].As<Napi::String>().Utf8Value();
        double value = processor_->GetData(key);
        
        return Napi::Number::New(env, value);
    }
    
    Napi::Value GetKeys(const Napi::CallbackInfo& info) {
        Napi::Env env = info.Env();
        
        std::vector<std::string> keys = processor_->GetKeys();
        Napi::Array result = Napi::Array::New(env, keys.size());
        
        for (size_t i = 0; i < keys.size(); i++) {
            result.Set(i, Napi::String::New(env, keys[i]));
        }
        
        return result;
    }
    
    Napi::Value ProcessData(const Napi::CallbackInfo& info) {
        Napi::Env env = info.Env();
        
        if (info.Length() < 1 || !info[0].IsString()) {
            Napi::TypeError::New(env, "Expected operation name").ThrowAsJavaScriptException();
            return env.Null();
        }
        
        std::string operation = info[0].As<Napi::String>().Utf8Value();
        double result = processor_->ProcessData(operation);
        
        return Napi::Number::New(env, result);
    }
    
    Napi::Value Clear(const Napi::CallbackInfo& info) {
        Napi::Env env = info.Env();
        processor_->Clear();
        return env.Undefined();
    }
    
    Napi::Value Size(const Napi::CallbackInfo& info) {
        Napi::Env env = info.Env();
        return Napi::Number::New(env, processor_->Size());
    }
    
    Napi::Value GetName(const Napi::CallbackInfo& info) {
        Napi::Env env = info.Env();
        return Napi::String::New(env, processor_->GetName());
    }
    
    Napi::Value GetProcessedCount(const Napi::CallbackInfo& info) {
        Napi::Env env = info.Env();
        return Napi::Number::New(env, processor_->GetProcessedCount());
    }
};

Napi::FunctionReference DataProcessorWrapper::constructor;
```

## 🔧 错误处理和调试

### 完善的错误处理

```cpp
// src/error_handling.cpp
#include <napi.h>
#include <stdexcept>

// 自定义错误类型
class CustomError : public std::runtime_error {
public:
    CustomError(const std::string& message, int code) 
        : std::runtime_error(message), code_(code) {}
    
    int GetCode() const { return code_; }

private:
    int code_;
};

// 安全的除法运算
Napi::Value SafeDivide(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    try {
        // 参数验证
        if (info.Length() < 2) {
            throw std::invalid_argument("Expected 2 arguments");
        }
        
        if (!info[0].IsNumber() || !info[1].IsNumber()) {
            throw std::invalid_argument("Arguments must be numbers");
        }
        
        double dividend = info[0].As<Napi::Number>().DoubleValue();
        double divisor = info[1].As<Napi::Number>().DoubleValue();
        
        // 除零检查
        if (divisor == 0.0) {
            throw CustomError("Division by zero", 1001);
        }
        
        // 溢出检查
        if (std::abs(dividend) > 1e308 || std::abs(divisor) < 1e-308) {
            throw CustomError("Potential overflow", 1002);
        }
        
        double result = dividend / divisor;
        
        // 结果验证
        if (!std::isfinite(result)) {
            throw CustomError("Result is not finite", 1003);
        }
        
        return Napi::Number::New(env, result);
        
    } catch (const CustomError& e) {
        // 创建自定义错误对象
        Napi::Object error = Napi::Object::New(env);
        error.Set("name", Napi::String::New(env, "CustomError"));
        error.Set("message", Napi::String::New(env, e.what()));
        error.Set("code", Napi::Number::New(env, e.GetCode()));
        
        Napi::Error::New(env, error.As<Napi::String>()).ThrowAsJavaScriptException();
        return env.Null();
        
    } catch (const std::invalid_argument& e) {
        Napi::TypeError::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Null();
        
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Null();
        
    } catch (...) {
        Napi::Error::New(env, "Unknown error occurred").ThrowAsJavaScriptException();
        return env.Null();
    }
}

// 资源管理示例
class ResourceManager {
public:
    ResourceManager() : resource_(nullptr) {}
    
    ~ResourceManager() {
        Cleanup();
    }
    
    bool Initialize() {
        try {
            resource_ = new int[1000000]; // 分配大量内存
            return true;
        } catch (const std::bad_alloc&) {
            return false;
        }
    }
    
    void Cleanup() {
        delete[] resource_;
        resource_ = nullptr;
    }
    
    bool IsValid() const {
        return resource_ != nullptr;
    }

private:
    int* resource_;
};

// RAII资源管理函数
Napi::Value ManageResource(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    try {
        ResourceManager manager;
        
        if (!manager.Initialize()) {
            throw std::runtime_error("Failed to initialize resource");
        }
        
        // 模拟一些操作
        if (info.Length() > 0 && info[0].IsBoolean() && info[0].As<Napi::Boolean>().Value()) {
            throw std::runtime_error("Simulated operation failure");
        }
        
        // 资源会在manager析构时自动清理
        return Napi::Boolean::New(env, true);
        
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return Napi::Boolean::New(env, false);
    }
}

// 调试信息收集
Napi::Object GetDebugInfo(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    Napi::Object debugInfo = Napi::Object::New(env);
    
    // 编译信息
    debugInfo.Set("compiler", Napi::String::New(env, 
#ifdef __GNUC__
        "GCC " __VERSION__
#elif defined(_MSC_VER)
        "MSVC"
#elif defined(__clang__)
        "Clang " __clang_version__
#else
        "Unknown"
#endif
    ));
    
    // 平台信息
    debugInfo.Set("platform", Napi::String::New(env,
#ifdef _WIN32
        "Windows"
#elif defined(__linux__)
        "Linux"
#elif defined(__APPLE__)
        "macOS"
#else
        "Unknown"
#endif
    ));
    
    // 架构信息
    debugInfo.Set("architecture", Napi::String::New(env,
#ifdef _WIN64
        "x64"
#elif defined(_WIN32)
        "x86"
#elif defined(__x86_64__)
        "x64"
#elif defined(__i386__)
        "x86"
#elif defined(__aarch64__)
        "arm64"
#else
        "Unknown"
#endif
    ));
    
    // N-API版本
    uint32_t napi_version;
    napi_status status = napi_get_version(env, &napi_version);
    if (status == napi_ok) {
        debugInfo.Set("napiVersion", Napi::Number::New(env, napi_version));
    }
    
    return debugInfo;
}
```

### 主模块集成

```cpp
// src/main.cpp
#include <napi.h>

// 声明所有函数
Napi::Value AddNumbers(const Napi::CallbackInfo& info);
Napi::Object MathOperations(const Napi::CallbackInfo& info);
Napi::Value ProcessArray(const Napi::CallbackInfo& info);
Napi::Value StringOperations(const Napi::CallbackInfo& info);
Napi::Value Utf8StringInfo(const Napi::CallbackInfo& info);

Napi::Value ComputeAsync(const Napi::CallbackInfo& info);
Napi::Promise AsyncWithPromise(const Napi::CallbackInfo& info);
Napi::Value ProcessBatchAsync(const Napi::CallbackInfo& info);

Napi::Value SafeDivide(const Napi::CallbackInfo& info);
Napi::Value ManageResource(const Napi::CallbackInfo& info);
Napi::Object GetDebugInfo(const Napi::CallbackInfo& info);

// 声明类包装器
class DataProcessorWrapper;

// 模块初始化
Napi::Object Init(Napi::Env env, Napi::Object exports) {
    // 基础类型操作
    exports.Set("addNumbers", Napi::Function::New(env, AddNumbers));
    exports.Set("mathOperations", Napi::Function::New(env, MathOperations));
    exports.Set("processArray", Napi::Function::New(env, ProcessArray));
    exports.Set("stringOperations", Napi::Function::New(env, StringOperations));
    exports.Set("utf8StringInfo", Napi::Function::New(env, Utf8StringInfo));
    
    // 异步操作
    exports.Set("computeAsync", Napi::Function::New(env, ComputeAsync));
    exports.Set("asyncWithPromise", Napi::Function::New(env, AsyncWithPromise));
    exports.Set("processBatchAsync", Napi::Function::New(env, ProcessBatchAsync));
    
    // 错误处理
    exports.Set("safeDivide", Napi::Function::New(env, SafeDivide));
    exports.Set("manageResource", Napi::Function::New(env, ManageResource));
    exports.Set("getDebugInfo", Napi::Function::New(env, GetDebugInfo));
    
    // 类绑定
    DataProcessorWrapper::Init(env, exports);
    
    return exports;
}

NODE_API_MODULE(napi_addon, Init)
```

N-API为Node.js原生模块开发提供了稳定、高效的接口，是构建高性能扩展的理想选择！
