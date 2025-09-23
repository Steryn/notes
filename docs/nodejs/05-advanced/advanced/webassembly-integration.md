# WebAssembly集成

## 🎯 学习目标

- 理解WebAssembly在Node.js中的应用
- 掌握WASM模块的编译和集成
- 学会优化WASM性能和内存使用
- 了解WASM与JavaScript的交互模式

## 📚 核心概念

### WebAssembly简介

```javascript
// WebAssembly的优势和应用场景
const wasmBenefits = {
  performance: {
    description: '接近原生性能',
    features: [
      '编译时优化',
      '高效执行',
      '预测性能',
      '并行计算'
    ]
  },
  portability: {
    description: '跨平台兼容',
    features: [
      '语言无关',
      '平台无关',
      '沙盒安全',
      '标准化'
    ]
  },
  integration: {
    description: 'JavaScript互操作',
    features: [
      '无缝调用',
      '内存共享',
      '类型安全',
      '异步支持'
    ]
  }
};

console.log('WebAssembly优势:', wasmBenefits);
```

## 🛠️ C++到WASM编译

### 数学计算模块

```cpp
// math.cpp - C++源代码
#include <emscripten/bind.h>
#include <vector>
#include <cmath>
#include <algorithm>

// 基础数学函数
double fibonacci(int n) {
    if (n <= 1) return n;
    
    double a = 0, b = 1;
    for (int i = 2; i <= n; i++) {
        double temp = a + b;
        a = b;
        b = temp;
    }
    return b;
}

// 向量运算
std::vector<double> vectorAdd(const std::vector<double>& a, const std::vector<double>& b) {
    std::vector<double> result;
    result.reserve(std::min(a.size(), b.size()));
    
    for (size_t i = 0; i < std::min(a.size(), b.size()); i++) {
        result.push_back(a[i] + b[i]);
    }
    
    return result;
}

// 矩阵乘法
std::vector<std::vector<double>> matrixMultiply(
    const std::vector<std::vector<double>>& a,
    const std::vector<std::vector<double>>& b
) {
    size_t rows_a = a.size();
    size_t cols_a = a[0].size();
    size_t cols_b = b[0].size();
    
    std::vector<std::vector<double>> result(rows_a, std::vector<double>(cols_b, 0));
    
    for (size_t i = 0; i < rows_a; i++) {
        for (size_t j = 0; j < cols_b; j++) {
            for (size_t k = 0; k < cols_a; k++) {
                result[i][j] += a[i][k] * b[k][j];
            }
        }
    }
    
    return result;
}

// 图像处理函数
std::vector<uint8_t> applyGaussianBlur(
    const std::vector<uint8_t>& imageData,
    int width,
    int height,
    double sigma
) {
    // 简化的高斯模糊实现
    std::vector<uint8_t> result = imageData;
    
    // 高斯核大小
    int kernelSize = static_cast<int>(6 * sigma + 1);
    if (kernelSize % 2 == 0) kernelSize++;
    
    int halfKernel = kernelSize / 2;
    
    // 生成高斯核
    std::vector<double> kernel(kernelSize);
    double sum = 0;
    
    for (int i = 0; i < kernelSize; i++) {
        int x = i - halfKernel;
        kernel[i] = std::exp(-(x * x) / (2 * sigma * sigma));
        sum += kernel[i];
    }
    
    // 归一化核
    for (double& k : kernel) {
        k /= sum;
    }
    
    // 水平模糊
    for (int y = 0; y < height; y++) {
        for (int x = 0; x < width; x++) {
            double value = 0;
            
            for (int i = 0; i < kernelSize; i++) {
                int srcX = x + i - halfKernel;
                srcX = std::max(0, std::min(width - 1, srcX));
                
                value += imageData[y * width + srcX] * kernel[i];
            }
            
            result[y * width + x] = static_cast<uint8_t>(value);
        }
    }
    
    return result;
}

// Emscripten绑定
EMSCRIPTEN_BINDINGS(math_module) {
    emscripten::function("fibonacci", &fibonacci);
    emscripten::function("vectorAdd", &vectorAdd);
    emscripten::function("matrixMultiply", &matrixMultiply);
    emscripten::function("applyGaussianBlur", &applyGaussianBlur);
    
    emscripten::register_vector<double>("VectorDouble");
    emscripten::register_vector<std::vector<double>>("MatrixDouble");
    emscripten::register_vector<uint8_t>("VectorUint8");
}
```

### 编译脚本

```bash
#!/bin/bash
# build-wasm.sh

# 检查Emscripten环境
if ! command -v emcc &> /dev/null; then
    echo "❌ Emscripten未安装，请先安装Emscripten SDK"
    exit 1
fi

echo "🔨 编译WebAssembly模块..."

# 编译选项
EMCC_FLAGS=(
    -O3                           # 最高优化级别
    -s WASM=1                     # 输出WASM格式
    -s EXPORTED_RUNTIME_METHODS='["cwrap", "ccall"]'
    -s ALLOW_MEMORY_GROWTH=1      # 允许内存增长
    -s MODULARIZE=1               # 模块化输出
    -s EXPORT_NAME="createMathModule"
    --bind                        # 启用Embind
    -s ENVIRONMENT=node           # Node.js环境
    --pre-js pre.js              # 预处理JavaScript
    --post-js post.js            # 后处理JavaScript
)

# 编译
emcc math.cpp -o math.js "${EMCC_FLAGS[@]}"

if [ $? -eq 0 ]; then
    echo "✅ 编译成功！"
    echo "📦 生成文件: math.js, math.wasm"
else
    echo "❌ 编译失败"
    exit 1
fi
```

## 🚀 Node.js集成

### WASM模块加载器

```javascript
// wasm-loader.js - WebAssembly模块加载器
const fs = require('fs');
const path = require('path');

class WasmLoader {
    constructor() {
        this.modules = new Map();
        this.loadingPromises = new Map();
    }

    // 加载WASM模块
    async loadModule(name, wasmPath, options = {}) {
        // 检查是否已加载
        if (this.modules.has(name)) {
            return this.modules.get(name);
        }

        // 检查是否正在加载
        if (this.loadingPromises.has(name)) {
            return this.loadingPromises.get(name);
        }

        // 开始加载
        const loadingPromise = this._loadWasmModule(wasmPath, options);
        this.loadingPromises.set(name, loadingPromise);

        try {
            const module = await loadingPromise;
            this.modules.set(name, module);
            this.loadingPromises.delete(name);
            
            console.log(`✅ WASM模块 ${name} 加载成功`);
            return module;
        } catch (error) {
            this.loadingPromises.delete(name);
            console.error(`❌ WASM模块 ${name} 加载失败:`, error);
            throw error;
        }
    }

    // 实际加载WASM文件
    async _loadWasmModule(wasmPath, options) {
        try {
            // 读取WASM文件
            const wasmBuffer = fs.readFileSync(wasmPath);
            
            // WebAssembly实例化选项
            const importObject = {
                env: {
                    // 内存导入
                    memory: new WebAssembly.Memory({ 
                        initial: options.initialMemory || 256,
                        maximum: options.maxMemory || 65536
                    }),
                    
                    // 表导入
                    table: new WebAssembly.Table({ 
                        initial: options.initialTable || 0,
                        element: 'anyfunc' 
                    }),
                    
                    // 环境函数
                    abort: () => {
                        throw new Error('WASM执行中止');
                    },
                    
                    // 调试函数
                    console_log: (ptr) => {
                        const memory = new Uint8Array(importObject.env.memory.buffer);
                        let str = '';
                        let i = ptr;
                        while (memory[i] !== 0) {
                            str += String.fromCharCode(memory[i++]);
                        }
                        console.log('[WASM]', str);
                    }
                }
            };

            // 实例化WASM模块
            const wasmModule = await WebAssembly.instantiate(wasmBuffer, importObject);
            
            return {
                instance: wasmModule.instance,
                module: wasmModule.module,
                exports: wasmModule.instance.exports,
                memory: importObject.env.memory
            };

        } catch (error) {
            throw new Error(`WASM模块加载失败: ${error.message}`);
        }
    }

    // 获取已加载的模块
    getModule(name) {
        return this.modules.get(name);
    }

    // 卸载模块
    unloadModule(name) {
        const module = this.modules.get(name);
        if (module) {
            // 清理资源
            this.modules.delete(name);
            console.log(`🗑️ WASM模块 ${name} 已卸载`);
            return true;
        }
        return false;
    }

    // 获取模块信息
    getModuleInfo(name) {
        const module = this.modules.get(name);
        if (!module) {
            return null;
        }

        const exports = Object.keys(module.exports);
        const memoryPages = module.memory ? module.memory.buffer.byteLength / 65536 : 0;

        return {
            name,
            exports,
            memoryPages,
            memoryBytes: module.memory ? module.memory.buffer.byteLength : 0,
            loaded: true
        };
    }

    // 列出所有已加载的模块
    listModules() {
        return Array.from(this.modules.keys()).map(name => this.getModuleInfo(name));
    }
}

module.exports = WasmLoader;
```

### 高级WASM包装器

```javascript
// math-wasm.js - 数学计算WASM包装器
const WasmLoader = require('./wasm-loader');
const path = require('path');

class MathWasm {
    constructor() {
        this.loader = new WasmLoader();
        this.module = null;
        this.isInitialized = false;
    }

    // 初始化模块
    async initialize() {
        if (this.isInitialized) {
            return;
        }

        try {
            console.log('🚀 初始化数学WASM模块...');
            
            const wasmPath = path.join(__dirname, 'math.wasm');
            this.module = await this.loader.loadModule('math', wasmPath, {
                initialMemory: 512,
                maxMemory: 2048
            });

            this.isInitialized = true;
            console.log('✅ 数学WASM模块初始化完成');

        } catch (error) {
            console.error('❌ WASM模块初始化失败:', error);
            throw error;
        }
    }

    // 确保模块已初始化
    _ensureInitialized() {
        if (!this.isInitialized) {
            throw new Error('WASM模块未初始化，请先调用initialize()');
        }
    }

    // 斐波那契数列计算
    fibonacci(n) {
        this._ensureInitialized();
        
        if (typeof n !== 'number' || n < 0 || !Number.isInteger(n)) {
            throw new TypeError('参数必须是非负整数');
        }

        try {
            const result = this.module.exports.fibonacci(n);
            return result;
        } catch (error) {
            throw new Error(`斐波那契计算失败: ${error.message}`);
        }
    }

    // 向量加法
    vectorAdd(vec1, vec2) {
        this._ensureInitialized();
        
        if (!Array.isArray(vec1) || !Array.isArray(vec2)) {
            throw new TypeError('参数必须是数组');
        }

        if (vec1.length !== vec2.length) {
            throw new Error('向量长度必须相等');
        }

        try {
            // 将JavaScript数组传递给WASM
            const result = this._callVectorFunction('vectorAdd', vec1, vec2);
            return result;
        } catch (error) {
            throw new Error(`向量加法计算失败: ${error.message}`);
        }
    }

    // 矩阵乘法
    matrixMultiply(matrix1, matrix2) {
        this._ensureInitialized();
        
        if (!Array.isArray(matrix1) || !Array.isArray(matrix2)) {
            throw new TypeError('参数必须是二维数组');
        }

        // 验证矩阵维度
        const rows1 = matrix1.length;
        const cols1 = matrix1[0]?.length || 0;
        const rows2 = matrix2.length;
        const cols2 = matrix2[0]?.length || 0;

        if (cols1 !== rows2) {
            throw new Error('矩阵维度不匹配');
        }

        try {
            const result = this._callMatrixFunction('matrixMultiply', matrix1, matrix2);
            return result;
        } catch (error) {
            throw new Error(`矩阵乘法计算失败: ${error.message}`);
        }
    }

    // 图像高斯模糊
    gaussianBlur(imageData, width, height, sigma = 1.0) {
        this._ensureInitialized();
        
        if (!Array.isArray(imageData) && !(imageData instanceof Uint8Array)) {
            throw new TypeError('imageData必须是数组或Uint8Array');
        }

        if (imageData.length !== width * height) {
            throw new Error('图像数据长度与尺寸不匹配');
        }

        try {
            // 将图像数据传递给WASM
            const result = this._callImageFunction('applyGaussianBlur', imageData, width, height, sigma);
            return result;
        } catch (error) {
            throw new Error(`高斯模糊处理失败: ${error.message}`);
        }
    }

    // 辅助方法：调用向量函数
    _callVectorFunction(funcName, ...args) {
        // 这里需要根据实际的WASM绑定实现
        // 简化示例
        const func = this.module.exports[funcName];
        if (!func) {
            throw new Error(`函数 ${funcName} 不存在`);
        }

        return func(...args);
    }

    // 辅助方法：调用矩阵函数
    _callMatrixFunction(funcName, ...args) {
        const func = this.module.exports[funcName];
        if (!func) {
            throw new Error(`函数 ${funcName} 不存在`);
        }

        return func(...args);
    }

    // 辅助方法：调用图像处理函数
    _callImageFunction(funcName, imageData, width, height, sigma) {
        const func = this.module.exports[funcName];
        if (!func) {
            throw new Error(`函数 ${funcName} 不存在`);
        }

        // 转换为Uint8Array
        const uint8Data = imageData instanceof Uint8Array ? imageData : new Uint8Array(imageData);
        
        return func(uint8Data, width, height, sigma);
    }

    // 性能基准测试
    async benchmark() {
        this._ensureInitialized();
        
        console.log('🏃 开始WASM性能基准测试...\n');

        const benchmarks = [
            {
                name: '斐波那契数列(n=40)',
                test: () => this.fibonacci(40)
            },
            {
                name: '向量加法(1000元素)',
                test: () => {
                    const vec1 = Array.from({ length: 1000 }, (_, i) => i);
                    const vec2 = Array.from({ length: 1000 }, (_, i) => i * 2);
                    return this.vectorAdd(vec1, vec2);
                }
            },
            {
                name: '矩阵乘法(100x100)',
                test: () => {
                    const matrix1 = Array.from({ length: 100 }, () => 
                        Array.from({ length: 100 }, () => Math.random())
                    );
                    const matrix2 = Array.from({ length: 100 }, () => 
                        Array.from({ length: 100 }, () => Math.random())
                    );
                    return this.matrixMultiply(matrix1, matrix2);
                }
            }
        ];

        const results = [];

        for (const benchmark of benchmarks) {
            console.log(`测试: ${benchmark.name}`);
            
            // 预热
            for (let i = 0; i < 3; i++) {
                benchmark.test();
            }

            // 实际测试
            const startTime = process.hrtime.bigint();
            const result = benchmark.test();
            const endTime = process.hrtime.bigint();
            
            const duration = Number(endTime - startTime) / 1000000; // 毫秒
            
            results.push({
                name: benchmark.name,
                duration: duration.toFixed(2),
                result: Array.isArray(result) ? `数组长度: ${result.length}` : result
            });
            
            console.log(`  耗时: ${duration.toFixed(2)}ms`);
            console.log(`  结果: ${Array.isArray(result) ? `数组长度: ${result.length}` : result}\n`);
        }

        return results;
    }

    // 内存使用信息
    getMemoryInfo() {
        if (!this.isInitialized) {
            return null;
        }

        const memory = this.module.memory;
        if (!memory) {
            return null;
        }

        const buffer = memory.buffer;
        const pages = buffer.byteLength / 65536;

        return {
            totalBytes: buffer.byteLength,
            totalPages: Math.floor(pages),
            bytesPerPage: 65536,
            utilization: `${(buffer.byteLength / 1024 / 1024).toFixed(2)}MB`
        };
    }

    // 清理资源
    cleanup() {
        if (this.isInitialized) {
            this.loader.unloadModule('math');
            this.module = null;
            this.isInitialized = false;
            console.log('🧹 WASM模块资源已清理');
        }
    }
}

module.exports = MathWasm;
```

### 使用示例和测试

```javascript
// test-wasm.js - WASM模块测试
const MathWasm = require('./math-wasm');

async function testWasmModule() {
    const mathWasm = new MathWasm();
    
    try {
        // 初始化模块
        await mathWasm.initialize();
        
        console.log('🧮 测试基础数学函数...');
        
        // 测试斐波那契数列
        console.log('斐波那契数列测试:');
        for (let i = 1; i <= 10; i++) {
            const result = mathWasm.fibonacci(i);
            console.log(`  F(${i}) = ${result}`);
        }
        
        // 测试向量加法
        console.log('\n向量加法测试:');
        const vec1 = [1, 2, 3, 4, 5];
        const vec2 = [6, 7, 8, 9, 10];
        const vectorResult = mathWasm.vectorAdd(vec1, vec2);
        console.log(`  [${vec1}] + [${vec2}] = [${vectorResult}]`);
        
        // 测试矩阵乘法
        console.log('\n矩阵乘法测试:');
        const matrix1 = [[1, 2], [3, 4]];
        const matrix2 = [[5, 6], [7, 8]];
        const matrixResult = mathWasm.matrixMultiply(matrix1, matrix2);
        console.log('  矩阵1:', matrix1);
        console.log('  矩阵2:', matrix2);
        console.log('  结果:', matrixResult);
        
        // 内存信息
        console.log('\n内存使用信息:');
        const memoryInfo = mathWasm.getMemoryInfo();
        console.log('  ', memoryInfo);
        
        // 性能基准测试
        console.log('\n🚀 性能基准测试:');
        const benchmarkResults = await mathWasm.benchmark();
        
        console.log('\n📊 基准测试结果汇总:');
        benchmarkResults.forEach((result, index) => {
            console.log(`${index + 1}. ${result.name}: ${result.duration}ms`);
        });
        
    } catch (error) {
        console.error('❌ 测试失败:', error);
    } finally {
        // 清理资源
        mathWasm.cleanup();
    }
}

// JavaScript版本对比测试
function compareWithJavaScript() {
    console.log('\n🔍 JavaScript vs WASM 性能对比...');
    
    // JavaScript斐波那契实现
    function fibJS(n) {
        if (n <= 1) return n;
        let a = 0, b = 1;
        for (let i = 2; i <= n; i++) {
            [a, b] = [b, a + b];
        }
        return b;
    }
    
    // JavaScript矩阵乘法实现
    function matrixMultiplyJS(a, b) {
        const result = Array(a.length).fill().map(() => Array(b[0].length).fill(0));
        
        for (let i = 0; i < a.length; i++) {
            for (let j = 0; j < b[0].length; j++) {
                for (let k = 0; k < b.length; k++) {
                    result[i][j] += a[i][k] * b[k][j];
                }
            }
        }
        
        return result;
    }
    
    const n = 35;
    
    // JavaScript测试
    console.time('JavaScript斐波那契');
    const jsResult = fibJS(n);
    console.timeEnd('JavaScript斐波那契');
    console.log(`JS结果: F(${n}) = ${jsResult}`);
    
    // 注意：这里需要WASM模块已初始化才能进行对比
    console.log('\n💡 提示: 运行完整测试以查看WASM性能对比');
}

// 运行测试
async function runAllTests() {
    await testWasmModule();
    compareWithJavaScript();
    
    console.log('\n✅ 所有测试完成！');
}

// 如果直接运行此文件
if (require.main === module) {
    runAllTests().catch(console.error);
}

module.exports = { testWasmModule, compareWithJavaScript };
```

WebAssembly为Node.js带来了接近原生的性能，是处理计算密集型任务的理想选择！
