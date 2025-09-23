# C++ Addons

## 🎯 学习目标

- 理解Node.js C++ Addons的原理和用途
- 掌握使用node-gyp构建原生模块
- 学会编写高性能的C++扩展
- 了解V8 API和Node.js API的使用

## 📚 核心概念

### C++ Addons简介

```javascript
// C++ Addons的应用场景
const addonUseCases = {
  performance: {
    description: '性能关键的计算密集型任务',
    examples: [
      '图像/音频处理',
      '数学计算',
      '加密解密',
      '数据压缩'
    ]
  },
  systemAccess: {
    description: '访问系统级API和硬件',
    examples: [
      '操作系统调用',
      '硬件接口',
      '设备驱动',
      '系统监控'
    ]
  },
  legacyIntegration: {
    description: '集成现有的C/C++库',
    examples: [
      '第三方库绑定',
      '遗留代码重用',
      '专业算法库',
      '商业组件'
    ]
  }
};

console.log('C++ Addons应用场景:', addonUseCases);
```

### 开发环境配置

```json
// package.json配置
{
  "name": "my-native-addon",
  "version": "1.0.0",
  "description": "Node.js C++ Addon示例",
  "main": "index.js",
  "scripts": {
    "build": "node-gyp rebuild",
    "clean": "node-gyp clean",
    "configure": "node-gyp configure",
    "test": "node test.js"
  },
  "devDependencies": {
    "node-gyp": "^9.0.0"
  },
  "gypfile": true
}
```

```python
# binding.gyp配置文件
{
  "targets": [
    {
      "target_name": "addon",
      "sources": [
        "src/addon.cpp",
        "src/calculator.cpp",
        "src/async_worker.cpp"
      ],
      "include_dirs": [
        "<!@(node -p \"require('node-addon-api').include\")"
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

## 🛠️ 基础C++ Addon开发

### 简单的数学计算模块

```cpp
// src/calculator.cpp
#include <napi.h>
#include <cmath>

// 简单的加法函数
Napi::Number Add(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    // 参数验证
    if (info.Length() < 2) {
        Napi::TypeError::New(env, "Expected 2 arguments").ThrowAsJavaScriptException();
        return Napi::Number::New(env, 0);
    }
    
    if (!info[0].IsNumber() || !info[1].IsNumber()) {
        Napi::TypeError::New(env, "Arguments must be numbers").ThrowAsJavaScriptException();
        return Napi::Number::New(env, 0);
    }
    
    // 获取参数值
    double arg0 = info[0].As<Napi::Number>().DoubleValue();
    double arg1 = info[1].As<Napi::Number>().DoubleValue();
    
    // 执行计算
    double result = arg0 + arg1;
    
    return Napi::Number::New(env, result);
}

// 复杂数学运算
Napi::Number Fibonacci(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 1 || !info[0].IsNumber()) {
        Napi::TypeError::New(env, "Expected a number").ThrowAsJavaScriptException();
        return Napi::Number::New(env, 0);
    }
    
    int n = info[0].As<Napi::Number>().Int32Value();
    
    // 递归计算斐波那契数列（演示用，实际应用中应该用迭代）
    std::function<long long(int)> fib = [&](int num) -> long long {
        if (num <= 1) return num;
        return fib(num - 1) + fib(num - 2);
    };
    
    long long result = fib(n);
    return Napi::Number::New(env, static_cast<double>(result));
}

// 向量运算
Napi::Array VectorAdd(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 2 || !info[0].IsArray() || !info[1].IsArray()) {
        Napi::TypeError::New(env, "Expected two arrays").ThrowAsJavaScriptException();
        return Napi::Array::New(env);
    }
    
    Napi::Array arr1 = info[0].As<Napi::Array>();
    Napi::Array arr2 = info[1].As<Napi::Array>();
    
    uint32_t length = arr1.Length();
    if (length != arr2.Length()) {
        Napi::TypeError::New(env, "Arrays must have the same length").ThrowAsJavaScriptException();
        return Napi::Array::New(env);
    }
    
    Napi::Array result = Napi::Array::New(env, length);
    
    for (uint32_t i = 0; i < length; i++) {
        double val1 = arr1.Get(i).As<Napi::Number>().DoubleValue();
        double val2 = arr2.Get(i).As<Napi::Number>().DoubleValue();
        result.Set(i, Napi::Number::New(env, val1 + val2));
    }
    
    return result;
}

// 矩阵乘法
Napi::Array MatrixMultiply(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 2 || !info[0].IsArray() || !info[1].IsArray()) {
        Napi::TypeError::New(env, "Expected two matrices (2D arrays)").ThrowAsJavaScriptException();
        return Napi::Array::New(env);
    }
    
    Napi::Array matrix1 = info[0].As<Napi::Array>();
    Napi::Array matrix2 = info[1].As<Napi::Array>();
    
    uint32_t rows1 = matrix1.Length();
    uint32_t cols1 = matrix1.Get(uint32_t(0)).As<Napi::Array>().Length();
    uint32_t rows2 = matrix2.Length();
    uint32_t cols2 = matrix2.Get(uint32_t(0)).As<Napi::Array>().Length();
    
    if (cols1 != rows2) {
        Napi::TypeError::New(env, "Matrix dimensions incompatible for multiplication").ThrowAsJavaScriptException();
        return Napi::Array::New(env);
    }
    
    // 创建结果矩阵
    Napi::Array result = Napi::Array::New(env, rows1);
    
    for (uint32_t i = 0; i < rows1; i++) {
        Napi::Array row = Napi::Array::New(env, cols2);
        
        for (uint32_t j = 0; j < cols2; j++) {
            double sum = 0.0;
            
            for (uint32_t k = 0; k < cols1; k++) {
                double val1 = matrix1.Get(i).As<Napi::Array>().Get(k).As<Napi::Number>().DoubleValue();
                double val2 = matrix2.Get(k).As<Napi::Array>().Get(j).As<Napi::Number>().DoubleValue();
                sum += val1 * val2;
            }
            
            row.Set(j, Napi::Number::New(env, sum));
        }
        
        result.Set(i, row);
    }
    
    return result;
}
```

### 字符串处理模块

```cpp
// src/string_processor.cpp
#include <napi.h>
#include <string>
#include <algorithm>
#include <cctype>
#include <regex>

// 字符串反转
Napi::String ReverseString(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 1 || !info[0].IsString()) {
        Napi::TypeError::New(env, "Expected a string").ThrowAsJavaScriptException();
        return Napi::String::New(env, "");
    }
    
    std::string input = info[0].As<Napi::String>().Utf8Value();
    std::reverse(input.begin(), input.end());
    
    return Napi::String::New(env, input);
}

// 字符串压缩（简单的RLE算法）
Napi::String CompressString(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 1 || !info[0].IsString()) {
        Napi::TypeError::New(env, "Expected a string").ThrowAsJavaScriptException();
        return Napi::String::New(env, "");
    }
    
    std::string input = info[0].As<Napi::String>().Utf8Value();
    std::string result;
    
    if (input.empty()) {
        return Napi::String::New(env, result);
    }
    
    char currentChar = input[0];
    int count = 1;
    
    for (size_t i = 1; i < input.length(); i++) {
        if (input[i] == currentChar) {
            count++;
        } else {
            result += currentChar;
            if (count > 1) {
                result += std::to_string(count);
            }
            currentChar = input[i];
            count = 1;
        }
    }
    
    // 处理最后一个字符
    result += currentChar;
    if (count > 1) {
        result += std::to_string(count);
    }
    
    return Napi::String::New(env, result);
}

// 字符串哈希计算
Napi::Number HashString(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 1 || !info[0].IsString()) {
        Napi::TypeError::New(env, "Expected a string").ThrowAsJavaScriptException();
        return Napi::Number::New(env, 0);
    }
    
    std::string input = info[0].As<Napi::String>().Utf8Value();
    
    // 简单的哈希算法（djb2）
    unsigned long hash = 5381;
    for (char c : input) {
        hash = ((hash << 5) + hash) + static_cast<unsigned char>(c);
    }
    
    return Napi::Number::New(env, static_cast<double>(hash));
}

// 正则表达式匹配
Napi::Array RegexMatch(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 2 || !info[0].IsString() || !info[1].IsString()) {
        Napi::TypeError::New(env, "Expected two strings (text and pattern)").ThrowAsJavaScriptException();
        return Napi::Array::New(env);
    }
    
    std::string text = info[0].As<Napi::String>().Utf8Value();
    std::string pattern = info[1].As<Napi::String>().Utf8Value();
    
    try {
        std::regex regex_pattern(pattern);
        std::sregex_iterator iter(text.begin(), text.end(), regex_pattern);
        std::sregex_iterator end;
        
        Napi::Array matches = Napi::Array::New(env);
        uint32_t index = 0;
        
        for (; iter != end; ++iter) {
            const std::smatch& match = *iter;
            matches.Set(index++, Napi::String::New(env, match.str()));
        }
        
        return matches;
    } catch (const std::regex_error& e) {
        Napi::TypeError::New(env, "Invalid regex pattern").ThrowAsJavaScriptException();
        return Napi::Array::New(env);
    }
}
```

## ⚡ 异步操作处理

### 异步Worker实现

```cpp
// src/async_worker.cpp
#include <napi.h>
#include <thread>
#include <chrono>

// 异步Worker基类
class AsyncWorker : public Napi::AsyncWorker {
public:
    AsyncWorker(Napi::Function& callback) 
        : Napi::AsyncWorker(callback), result(0) {}
    
    ~AsyncWorker() {}
    
protected:
    double result;
};

// 计算密集型异步任务
class ComputeIntensiveWorker : public AsyncWorker {
public:
    ComputeIntensiveWorker(Napi::Function& callback, int iterations)
        : AsyncWorker(callback), iterations_(iterations) {}
    
    ~ComputeIntensiveWorker() {}
    
    void Execute() override {
        // 模拟计算密集型任务
        double sum = 0.0;
        for (int i = 0; i < iterations_; i++) {
            sum += std::sin(i) * std::cos(i);
            
            // 检查是否被取消
            if (this->IsCancelled()) {
                SetError("Operation was cancelled");
                return;
            }
        }
        result = sum;
    }
    
    void OnOK() override {
        Napi::HandleScope scope(Env());
        Callback().Call({Env().Null(), Napi::Number::New(Env(), result)});
    }
    
    void OnError(const Napi::Error& e) override {
        Napi::HandleScope scope(Env());
        Callback().Call({e.Value(), Env().Undefined()});
    }

private:
    int iterations_;
};

// 异步计算函数
Napi::Value ComputeAsync(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 2) {
        Napi::TypeError::New(env, "Expected iterations and callback").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    if (!info[0].IsNumber() || !info[1].IsFunction()) {
        Napi::TypeError::New(env, "Invalid arguments").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    int iterations = info[0].As<Napi::Number>().Int32Value();
    Napi::Function callback = info[1].As<Napi::Function>();
    
    ComputeIntensiveWorker* worker = new ComputeIntensiveWorker(callback, iterations);
    worker->Queue();
    
    return env.Undefined();
}

// Promise-based异步操作
class PromiseWorker : public Napi::AsyncWorker {
public:
    PromiseWorker(Napi::Env env, int delay) 
        : Napi::AsyncWorker(env), delay_(delay), deferred_(Napi::Promise::Deferred::New(env)) {}
    
    ~PromiseWorker() {}
    
    void Execute() override {
        // 模拟异步操作
        std::this_thread::sleep_for(std::chrono::milliseconds(delay_));
        result = delay_ * 2; // 简单的计算
    }
    
    void OnOK() override {
        deferred_.Resolve(Napi::Number::New(Env(), result));
    }
    
    void OnError(const Napi::Error& e) override {
        deferred_.Reject(e.Value());
    }
    
    Napi::Promise GetPromise() {
        return deferred_.Promise();
    }

private:
    int delay_;
    double result;
    Napi::Promise::Deferred deferred_;
};

// 返回Promise的异步函数
Napi::Promise DelayedCompute(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 1 || !info[0].IsNumber()) {
        auto deferred = Napi::Promise::Deferred::New(env);
        deferred.Reject(Napi::TypeError::New(env, "Expected a number").Value());
        return deferred.Promise();
    }
    
    int delay = info[0].As<Napi::Number>().Int32Value();
    
    PromiseWorker* worker = new PromiseWorker(env, delay);
    Napi::Promise promise = worker->GetPromise();
    worker->Queue();
    
    return promise;
}
```

### 对象和类的绑定

```cpp
// src/native_class.cpp
#include <napi.h>
#include <vector>
#include <memory>

// 原生C++类
class Calculator {
public:
    Calculator() : value_(0.0) {}
    
    void SetValue(double value) { value_ = value; }
    double GetValue() const { return value_; }
    
    double Add(double operand) {
        value_ += operand;
        return value_;
    }
    
    double Multiply(double operand) {
        value_ *= operand;
        return value_;
    }
    
    void Reset() { value_ = 0.0; }

private:
    double value_;
};

// Node.js包装类
class CalculatorWrapper : public Napi::ObjectWrap<CalculatorWrapper> {
public:
    static Napi::Object Init(Napi::Env env, Napi::Object exports) {
        Napi::HandleScope scope(env);
        
        Napi::Function func = DefineClass(env, "Calculator", {
            InstanceMethod("setValue", &CalculatorWrapper::SetValue),
            InstanceMethod("getValue", &CalculatorWrapper::GetValue),
            InstanceMethod("add", &CalculatorWrapper::Add),
            InstanceMethod("multiply", &CalculatorWrapper::Multiply),
            InstanceMethod("reset", &CalculatorWrapper::Reset)
        });
        
        constructor = Napi::Persistent(func);
        constructor.SuppressDestruct();
        
        exports.Set("Calculator", func);
        return exports;
    }
    
    CalculatorWrapper(const Napi::CallbackInfo& info) : Napi::ObjectWrap<CalculatorWrapper>(info) {
        Napi::Env env = info.Env();
        Napi::HandleScope scope(env);
        
        calculator_ = std::make_unique<Calculator>();
    }

private:
    static Napi::FunctionReference constructor;
    std::unique_ptr<Calculator> calculator_;
    
    Napi::Value SetValue(const Napi::CallbackInfo& info) {
        Napi::Env env = info.Env();
        
        if (info.Length() < 1 || !info[0].IsNumber()) {
            Napi::TypeError::New(env, "Expected a number").ThrowAsJavaScriptException();
            return env.Undefined();
        }
        
        double value = info[0].As<Napi::Number>().DoubleValue();
        calculator_->SetValue(value);
        
        return env.Undefined();
    }
    
    Napi::Value GetValue(const Napi::CallbackInfo& info) {
        Napi::Env env = info.Env();
        return Napi::Number::New(env, calculator_->GetValue());
    }
    
    Napi::Value Add(const Napi::CallbackInfo& info) {
        Napi::Env env = info.Env();
        
        if (info.Length() < 1 || !info[0].IsNumber()) {
            Napi::TypeError::New(env, "Expected a number").ThrowAsJavaScriptException();
            return Napi::Number::New(env, 0);
        }
        
        double operand = info[0].As<Napi::Number>().DoubleValue();
        double result = calculator_->Add(operand);
        
        return Napi::Number::New(env, result);
    }
    
    Napi::Value Multiply(const Napi::CallbackInfo& info) {
        Napi::Env env = info.Env();
        
        if (info.Length() < 1 || !info[0].IsNumber()) {
            Napi::TypeError::New(env, "Expected a number").ThrowAsJavaScriptException();
            return Napi::Number::New(env, 0);
        }
        
        double operand = info[0].As<Napi::Number>().DoubleValue();
        double result = calculator_->Multiply(operand);
        
        return Napi::Number::New(env, result);
    }
    
    Napi::Value Reset(const Napi::CallbackInfo& info) {
        Napi::Env env = info.Env();
        calculator_->Reset();
        return env.Undefined();
    }
};

Napi::FunctionReference CalculatorWrapper::constructor;
```

### 主模块文件

```cpp
// src/addon.cpp
#include <napi.h>

// 声明外部函数
Napi::Number Add(const Napi::CallbackInfo& info);
Napi::Number Fibonacci(const Napi::CallbackInfo& info);
Napi::Array VectorAdd(const Napi::CallbackInfo& info);
Napi::Array MatrixMultiply(const Napi::CallbackInfo& info);

Napi::String ReverseString(const Napi::CallbackInfo& info);
Napi::String CompressString(const Napi::CallbackInfo& info);
Napi::Number HashString(const Napi::CallbackInfo& info);
Napi::Array RegexMatch(const Napi::CallbackInfo& info);

Napi::Value ComputeAsync(const Napi::CallbackInfo& info);
Napi::Promise DelayedCompute(const Napi::CallbackInfo& info);

// 声明类包装器
class CalculatorWrapper;

// 模块初始化
Napi::Object Init(Napi::Env env, Napi::Object exports) {
    // 数学函数
    exports.Set(Napi::String::New(env, "add"), Napi::Function::New(env, Add));
    exports.Set(Napi::String::New(env, "fibonacci"), Napi::Function::New(env, Fibonacci));
    exports.Set(Napi::String::New(env, "vectorAdd"), Napi::Function::New(env, VectorAdd));
    exports.Set(Napi::String::New(env, "matrixMultiply"), Napi::Function::New(env, MatrixMultiply));
    
    // 字符串函数
    exports.Set(Napi::String::New(env, "reverseString"), Napi::Function::New(env, ReverseString));
    exports.Set(Napi::String::New(env, "compressString"), Napi::Function::New(env, CompressString));
    exports.Set(Napi::String::New(env, "hashString"), Napi::Function::New(env, HashString));
    exports.Set(Napi::String::New(env, "regexMatch"), Napi::Function::New(env, RegexMatch));
    
    // 异步函数
    exports.Set(Napi::String::New(env, "computeAsync"), Napi::Function::New(env, ComputeAsync));
    exports.Set(Napi::String::New(env, "delayedCompute"), Napi::Function::New(env, DelayedCompute));
    
    // 类绑定
    CalculatorWrapper::Init(env, exports);
    
    return exports;
}

NODE_API_MODULE(addon, Init)
```

## 📋 JavaScript使用示例

### 基础功能测试

```javascript
// test.js - 测试原生模块
const addon = require('./build/Release/addon');

async function testBasicFunctions() {
    console.log('🧮 测试基础数学函数...');
    
    // 测试加法
    console.log('加法测试:', addon.add(5, 3)); // 8
    
    // 测试斐波那契
    console.log('斐波那契数列 F(10):', addon.fibonacci(10)); // 55
    
    // 测试向量加法
    const vector1 = [1, 2, 3, 4];
    const vector2 = [5, 6, 7, 8];
    console.log('向量加法:', addon.vectorAdd(vector1, vector2)); // [6, 8, 10, 12]
    
    // 测试矩阵乘法
    const matrix1 = [[1, 2], [3, 4]];
    const matrix2 = [[5, 6], [7, 8]];
    console.log('矩阵乘法:', addon.matrixMultiply(matrix1, matrix2)); // [[19, 22], [43, 50]]
}

async function testStringFunctions() {
    console.log('\n🔤 测试字符串处理函数...');
    
    // 测试字符串反转
    console.log('字符串反转:', addon.reverseString('Hello World')); // dlroW olleH
    
    // 测试字符串压缩
    console.log('字符串压缩:', addon.compressString('aaabbbcccdddd')); // a3b3c3d4
    
    // 测试字符串哈希
    console.log('字符串哈希:', addon.hashString('test string'));
    
    // 测试正则匹配
    console.log('正则匹配:', addon.regexMatch('hello123world456', '\\d+'));
}

async function testAsyncFunctions() {
    console.log('\n⚡ 测试异步函数...');
    
    // 测试回调式异步函数
    console.log('开始异步计算...');
    addon.computeAsync(1000000, (error, result) => {
        if (error) {
            console.error('异步计算错误:', error);
        } else {
            console.log('异步计算结果:', result);
        }
    });
    
    // 测试Promise式异步函数
    try {
        const result = await addon.delayedCompute(1000);
        console.log('延迟计算结果:', result);
    } catch (error) {
        console.error('延迟计算错误:', error);
    }
}

async function testCalculatorClass() {
    console.log('\n🏷️ 测试Calculator类...');
    
    const calc = new addon.Calculator();
    
    calc.setValue(10);
    console.log('初始值:', calc.getValue()); // 10
    
    console.log('加5:', calc.add(5)); // 15
    console.log('乘以2:', calc.multiply(2)); // 30
    console.log('当前值:', calc.getValue()); // 30
    
    calc.reset();
    console.log('重置后:', calc.getValue()); // 0
}

async function performanceBenchmark() {
    console.log('\n🚀 性能基准测试...');
    
    // JavaScript实现的斐波那契
    function fibJS(n) {
        if (n <= 1) return n;
        return fibJS(n - 1) + fibJS(n - 2);
    }
    
    const n = 35;
    
    // 测试JavaScript版本
    console.time('JavaScript斐波那契');
    const jsResult = fibJS(n);
    console.timeEnd('JavaScript斐波那契');
    console.log('JS结果:', jsResult);
    
    // 测试C++版本
    console.time('C++斐波那契');
    const cppResult = addon.fibonacci(n);
    console.timeEnd('C++斐波那契');
    console.log('C++结果:', cppResult);
    
    // 测试向量运算
    const largeVector1 = Array.from({ length: 100000 }, (_, i) => i);
    const largeVector2 = Array.from({ length: 100000 }, (_, i) => i * 2);
    
    console.time('C++向量加法');
    const vectorResult = addon.vectorAdd(largeVector1, largeVector2);
    console.timeEnd('C++向量加法');
    console.log('向量结果长度:', vectorResult.length);
    
    // 测试字符串处理
    const longString = 'a'.repeat(100000);
    
    console.time('C++字符串反转');
    const reversedString = addon.reverseString(longString);
    console.timeEnd('C++字符串反转');
    console.log('反转字符串长度:', reversedString.length);
}

// 运行所有测试
async function runAllTests() {
    try {
        await testBasicFunctions();
        await testStringFunctions();
        await testAsyncFunctions();
        await testCalculatorClass();
        
        // 等待异步操作完成
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        await performanceBenchmark();
        
        console.log('\n✅ 所有测试完成！');
    } catch (error) {
        console.error('❌ 测试失败:', error);
    }
}

runAllTests();
```

### 构建脚本

```javascript
// scripts/build.js - 自动化构建脚本
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class AddonBuilder {
    constructor() {
        this.buildDir = path.join(__dirname, '..', 'build');
        this.srcDir = path.join(__dirname, '..', 'src');
    }
    
    checkDependencies() {
        console.log('🔍 检查构建依赖...');
        
        try {
            execSync('node-gyp --version', { stdio: 'ignore' });
            console.log('✅ node-gyp 已安装');
        } catch (error) {
            console.error('❌ node-gyp 未安装，请运行: npm install -g node-gyp');
            process.exit(1);
        }
        
        // 检查Python
        try {
            execSync('python --version', { stdio: 'ignore' });
            console.log('✅ Python 已安装');
        } catch (error) {
            console.warn('⚠️ Python 可能未安装或不在PATH中');
        }
        
        // 检查编译器
        const platform = process.platform;
        if (platform === 'win32') {
            console.log('📝 Windows平台：确保已安装Visual Studio Build Tools');
        } else if (platform === 'darwin') {
            try {
                execSync('xcode-select --version', { stdio: 'ignore' });
                console.log('✅ Xcode命令行工具已安装');
            } catch (error) {
                console.error('❌ 请安装Xcode命令行工具: xcode-select --install');
            }
        } else {
            console.log('🐧 Linux平台：确保已安装build-essential');
        }
    }
    
    clean() {
        console.log('🧹 清理构建目录...');
        
        if (fs.existsSync(this.buildDir)) {
            try {
                execSync('node-gyp clean', { stdio: 'inherit' });
                console.log('✅ 清理完成');
            } catch (error) {
                console.warn('⚠️ 清理时出现警告:', error.message);
            }
        }
    }
    
    configure() {
        console.log('⚙️ 配置构建环境...');
        
        try {
            execSync('node-gyp configure', { stdio: 'inherit' });
            console.log('✅ 配置完成');
        } catch (error) {
            console.error('❌ 配置失败:', error.message);
            process.exit(1);
        }
    }
    
    build() {
        console.log('🔨 开始编译...');
        
        try {
            execSync('node-gyp build', { stdio: 'inherit' });
            console.log('✅ 编译完成');
        } catch (error) {
            console.error('❌ 编译失败:', error.message);
            process.exit(1);
        }
    }
    
    rebuild() {
        console.log('🔄 重新构建...');
        
        try {
            execSync('node-gyp rebuild', { stdio: 'inherit' });
            console.log('✅ 重新构建完成');
        } catch (error) {
            console.error('❌ 重新构建失败:', error.message);
            process.exit(1);
        }
    }
    
    test() {
        console.log('🧪 运行测试...');
        
        const addonPath = path.join(this.buildDir, 'Release', 'addon.node');
        
        if (!fs.existsSync(addonPath)) {
            console.error('❌ 找不到编译后的addon文件');
            process.exit(1);
        }
        
        try {
            execSync('node test.js', { stdio: 'inherit' });
            console.log('✅ 测试完成');
        } catch (error) {
            console.error('❌ 测试失败:', error.message);
            process.exit(1);
        }
    }
    
    async fullBuild() {
        console.log('🚀 开始完整构建流程...\n');
        
        this.checkDependencies();
        this.clean();
        this.configure();
        this.build();
        this.test();
        
        console.log('\n🎉 构建流程完成！');
    }
}

// 命令行参数处理
const args = process.argv.slice(2);
const command = args[0] || 'full';

const builder = new AddonBuilder();

switch (command) {
    case 'clean':
        builder.clean();
        break;
    case 'configure':
        builder.configure();
        break;
    case 'build':
        builder.build();
        break;
    case 'rebuild':
        builder.rebuild();
        break;
    case 'test':
        builder.test();
        break;
    case 'full':
    default:
        builder.fullBuild();
        break;
}
```

C++ Addons为Node.js提供了强大的扩展能力，让我们能够在需要时获得原生代码的性能优势！
