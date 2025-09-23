# 设计模式基础

## 📖 概述

设计模式是经过验证的、解决软件设计中常见问题的可重用解决方案。它们代表了面向对象设计的最佳实践，提供了一套通用的词汇来描述软件设计问题和解决方案。

## 🎯 学习目标

- 理解设计模式的核心概念和分类
- 掌握SOLID设计原则
- 学习模式的识别和应用场景
- 实现可复用的设计模式框架

## 🏗️ 设计模式核心概念

### 1. 设计模式框架

```javascript
// 设计模式基础框架
class DesignPatternFramework {
  constructor() {
    this.patterns = new Map()
    this.patternCatalog = new PatternCatalog()
    this.patternFactory = new PatternFactory()
    this.patternRegistry = new PatternRegistry()
  }
  
  // 模式目录
  class PatternCatalog {
    constructor() {
      this.creationalPatterns = new Map()
      this.structuralPatterns = new Map()
      this.behavioralPatterns = new Map()
      this.patternRelationships = new Map()
    }
    
    // 注册模式
    registerPattern(patternConfig) {
      const pattern = {
        name: patternConfig.name,
        category: patternConfig.category,
        intent: patternConfig.intent,
        motivation: patternConfig.motivation,
        applicability: patternConfig.applicability,
        structure: patternConfig.structure,
        participants: patternConfig.participants,
        collaborations: patternConfig.collaborations,
        consequences: patternConfig.consequences,
        implementation: patternConfig.implementation,
        sampleCode: patternConfig.sampleCode,
        knownUses: patternConfig.knownUses || [],
        relatedPatterns: patternConfig.relatedPatterns || []
      }
      
      // 根据类别存储
      switch (pattern.category) {
        case 'creational':
          this.creationalPatterns.set(pattern.name, pattern)
          break
        case 'structural':
          this.structuralPatterns.set(pattern.name, pattern)
          break
        case 'behavioral':
          this.behavioralPatterns.set(pattern.name, pattern)
          break
        default:
          throw new Error(`未知的模式类别: ${pattern.category}`)
      }
      
      // 建立模式关系
      this.establishPatternRelationships(pattern)
      
      console.log(`设计模式注册完成: ${pattern.name} (${pattern.category})`)
      return pattern
    }
    
    // 建立模式关系
    establishPatternRelationships(pattern) {
      pattern.relatedPatterns.forEach(relatedPatternName => {
        if (!this.patternRelationships.has(pattern.name)) {
          this.patternRelationships.set(pattern.name, new Set())
        }
        
        this.patternRelationships.get(pattern.name).add(relatedPatternName)
        
        // 建立双向关系
        if (!this.patternRelationships.has(relatedPatternName)) {
          this.patternRelationships.set(relatedPatternName, new Set())
        }
        this.patternRelationships.get(relatedPatternName).add(pattern.name)
      })
    }
    
    // 查找模式
    findPattern(name) {
      return this.creationalPatterns.get(name) ||
             this.structuralPatterns.get(name) ||
             this.behavioralPatterns.get(name)
    }
    
    // 按类别获取模式
    getPatternsByCategory(category) {
      switch (category) {
        case 'creational':
          return Array.from(this.creationalPatterns.values())
        case 'structural':
          return Array.from(this.structuralPatterns.values())
        case 'behavioral':
          return Array.from(this.behavioralPatterns.values())
        default:
          return []
      }
    }
    
    // 推荐相关模式
    getRelatedPatterns(patternName) {
      const relationships = this.patternRelationships.get(patternName)
      if (!relationships) {
        return []
      }
      
      return Array.from(relationships).map(name => this.findPattern(name)).filter(Boolean)
    }
    
    // 模式适用性分析
    analyzeApplicability(problemContext) {
      const recommendations = []
      
      const allPatterns = [
        ...this.creationalPatterns.values(),
        ...this.structuralPatterns.values(),
        ...this.behavioralPatterns.values()
      ]
      
      allPatterns.forEach(pattern => {
        const applicabilityScore = this.calculateApplicabilityScore(pattern, problemContext)
        
        if (applicabilityScore > 0.6) {
          recommendations.push({
            pattern: pattern.name,
            score: applicabilityScore,
            reason: this.generateRecommendationReason(pattern, problemContext)
          })
        }
      })
      
      // 按分数排序
      recommendations.sort((a, b) => b.score - a.score)
      
      return recommendations
    }
    
    calculateApplicabilityScore(pattern, context) {
      let score = 0
      
      // 检查适用性关键词匹配
      const applicabilityKeywords = pattern.applicability.toLowerCase().split(' ')
      const contextKeywords = context.description.toLowerCase().split(' ')
      
      const matchCount = applicabilityKeywords.filter(keyword => 
        contextKeywords.some(contextKeyword => contextKeyword.includes(keyword))
      ).length
      
      score += (matchCount / applicabilityKeywords.length) * 0.4
      
      // 检查问题类型匹配
      if (context.problemType && pattern.intent.toLowerCase().includes(context.problemType.toLowerCase())) {
        score += 0.3
      }
      
      // 检查架构复杂度匹配
      if (context.complexity && this.matchesComplexity(pattern, context.complexity)) {
        score += 0.3
      }
      
      return Math.min(score, 1.0)
    }
    
    matchesComplexity(pattern, complexity) {
      const complexityMap = {
        'simple': ['Singleton', 'Factory Method', 'Observer'],
        'medium': ['Builder', 'Adapter', 'Strategy', 'Command'],
        'complex': ['Abstract Factory', 'Composite', 'Visitor', 'Mediator']
      }
      
      return complexityMap[complexity]?.includes(pattern.name) || false
    }
    
    generateRecommendationReason(pattern, context) {
      return `${pattern.name} 模式适用于当前场景，因为它能够 ${pattern.intent.toLowerCase()}`
    }
  }
  
  // 模式工厂
  class PatternFactory {
    constructor() {
      this.patternImplementations = new Map()
    }
    
    // 注册模式实现
    registerImplementation(patternName, implementationFactory) {
      this.patternImplementations.set(patternName, implementationFactory)
      console.log(`模式实现注册完成: ${patternName}`)
    }
    
    // 创建模式实例
    createPattern(patternName, config = {}) {
      const implementation = this.patternImplementations.get(patternName)
      
      if (!implementation) {
        throw new Error(`模式实现不存在: ${patternName}`)
      }
      
      try {
        const instance = implementation(config)
        console.log(`模式实例创建完成: ${patternName}`)
        return instance
      } catch (error) {
        console.error(`模式实例创建失败: ${patternName}`, error)
        throw error
      }
    }
    
    // 获取可用模式列表
    getAvailablePatterns() {
      return Array.from(this.patternImplementations.keys())
    }
  }
  
  // 模式注册表
  class PatternRegistry {
    constructor() {
      this.registeredInstances = new Map()
      this.instanceMetadata = new Map()
    }
    
    // 注册模式实例
    register(instanceId, pattern, metadata = {}) {
      this.registeredInstances.set(instanceId, pattern)
      this.instanceMetadata.set(instanceId, {
        patternName: pattern.constructor.name,
        createdAt: new Date(),
        lastAccessed: new Date(),
        accessCount: 0,
        ...metadata
      })
      
      console.log(`模式实例注册: ${instanceId}`)
    }
    
    // 获取模式实例
    get(instanceId) {
      const instance = this.registeredInstances.get(instanceId)
      
      if (instance) {
        // 更新访问信息
        const metadata = this.instanceMetadata.get(instanceId)
        metadata.lastAccessed = new Date()
        metadata.accessCount++
      }
      
      return instance
    }
    
    // 注销模式实例
    unregister(instanceId) {
      const removed = this.registeredInstances.delete(instanceId)
      this.instanceMetadata.delete(instanceId)
      
      if (removed) {
        console.log(`模式实例注销: ${instanceId}`)
      }
      
      return removed
    }
    
    // 获取实例统计信息
    getInstanceStatistics() {
      const stats = {
        totalInstances: this.registeredInstances.size,
        patternUsage: {},
        accessStatistics: {
          totalAccess: 0,
          averageAccess: 0,
          mostAccessed: null,
          leastAccessed: null
        }
      }
      
      let maxAccess = 0
      let minAccess = Number.MAX_SAFE_INTEGER
      let mostAccessedId = null
      let leastAccessedId = null
      
      this.instanceMetadata.forEach((metadata, instanceId) => {
        // 模式使用统计
        const patternName = metadata.patternName
        stats.patternUsage[patternName] = (stats.patternUsage[patternName] || 0) + 1
        
        // 访问统计
        const accessCount = metadata.accessCount
        stats.accessStatistics.totalAccess += accessCount
        
        if (accessCount > maxAccess) {
          maxAccess = accessCount
          mostAccessedId = instanceId
        }
        
        if (accessCount < minAccess) {
          minAccess = accessCount
          leastAccessedId = instanceId
        }
      })
      
      if (this.registeredInstances.size > 0) {
        stats.accessStatistics.averageAccess = 
          stats.accessStatistics.totalAccess / this.registeredInstances.size
        stats.accessStatistics.mostAccessed = {
          instanceId: mostAccessedId,
          accessCount: maxAccess
        }
        stats.accessStatistics.leastAccessed = {
          instanceId: leastAccessedId,
          accessCount: minAccess
        }
      }
      
      return stats
    }
  }
}
```

### 2. SOLID原则实现

```javascript
// SOLID原则演示和验证
class SOLIDPrinciples {
  constructor() {
    this.principleValidators = new Map()
    this.setupValidators()
  }
  
  setupValidators() {
    // 单一职责原则 (SRP)
    this.principleValidators.set('SRP', {
      name: 'Single Responsibility Principle',
      description: '一个类应该只有一个改变的理由',
      validate: (classDefinition) => {
        const responsibilities = this.analyzeResponsibilities(classDefinition)
        return {
          isValid: responsibilities.length <= 1,
          responsibilities,
          recommendation: responsibilities.length > 1 ? 
            '考虑将职责分离到不同的类中' : '职责单一，符合SRP原则'
        }
      }
    })
    
    // 开闭原则 (OCP)
    this.principleValidators.set('OCP', {
      name: 'Open-Closed Principle',
      description: '对扩展开放，对修改关闭',
      validate: (classDefinition) => {
        const extensionPoints = this.analyzeExtensionPoints(classDefinition)
        const modificationRisks = this.analyzeModificationRisks(classDefinition)
        
        return {
          isValid: extensionPoints.length > 0 && modificationRisks.length === 0,
          extensionPoints,
          modificationRisks,
          recommendation: modificationRisks.length > 0 ? 
            '考虑使用抽象和多态来减少修改风险' : '设计支持扩展，符合OCP原则'
        }
      }
    })
    
    // 里氏替换原则 (LSP)
    this.principleValidators.set('LSP', {
      name: 'Liskov Substitution Principle',
      description: '子类应该能够替换其基类',
      validate: (inheritanceHierarchy) => {
        const violations = this.analyzeLSPViolations(inheritanceHierarchy)
        
        return {
          isValid: violations.length === 0,
          violations,
          recommendation: violations.length > 0 ? 
            '检查子类是否违反了基类的契约' : '继承关系符合LSP原则'
        }
      }
    })
    
    // 接口隔离原则 (ISP)
    this.principleValidators.set('ISP', {
      name: 'Interface Segregation Principle',
      description: '客户端不应该依赖它不需要的接口',
      validate: (interfaceDefinition) => {
        const cohesion = this.analyzeInterfaceCohesion(interfaceDefinition)
        const clientDependencies = this.analyzeClientDependencies(interfaceDefinition)
        
        return {
          isValid: cohesion.score > 0.7 && clientDependencies.unnecessaryDependencies.length === 0,
          cohesion,
          clientDependencies,
          recommendation: cohesion.score <= 0.7 ? 
            '考虑将接口拆分为更小的、专门的接口' : '接口设计符合ISP原则'
        }
      }
    })
    
    // 依赖反转原则 (DIP)
    this.principleValidators.set('DIP', {
      name: 'Dependency Inversion Principle',
      description: '高层模块不应该依赖低层模块，两者都应该依赖抽象',
      validate: (moduleDefinition) => {
        const dependencies = this.analyzeDependencies(moduleDefinition)
        const abstractions = this.analyzeAbstractions(moduleDefinition)
        
        const concreteDependencies = dependencies.filter(dep => !dep.isAbstract)
        
        return {
          isValid: concreteDependencies.length === 0,
          dependencies,
          abstractions,
          concreteDependencies,
          recommendation: concreteDependencies.length > 0 ? 
            '考虑引入抽象层来解耦具体依赖' : '依赖关系符合DIP原则'
        }
      }
    })
  }
  
  // 分析类的职责
  analyzeResponsibilities(classDefinition) {
    const responsibilities = []
    
    // 分析方法的职责类型
    classDefinition.methods.forEach(method => {
      const responsibility = this.identifyMethodResponsibility(method)
      if (responsibility && !responsibilities.includes(responsibility)) {
        responsibilities.push(responsibility)
      }
    })
    
    return responsibilities
  }
  
  identifyMethodResponsibility(method) {
    const name = method.name.toLowerCase()
    
    if (name.includes('save') || name.includes('persist') || name.includes('store')) {
      return 'persistence'
    } else if (name.includes('validate') || name.includes('check')) {
      return 'validation'
    } else if (name.includes('calculate') || name.includes('compute')) {
      return 'calculation'
    } else if (name.includes('format') || name.includes('transform')) {
      return 'formatting'
    } else if (name.includes('log') || name.includes('audit')) {
      return 'logging'
    } else if (name.includes('send') || name.includes('notify')) {
      return 'communication'
    }
    
    return 'business_logic'
  }
  
  // 分析扩展点
  analyzeExtensionPoints(classDefinition) {
    const extensionPoints = []
    
    // 检查虚方法或抽象方法
    classDefinition.methods.forEach(method => {
      if (method.isAbstract || method.isVirtual) {
        extensionPoints.push({
          type: 'method',
          name: method.name,
          description: '可通过重写扩展功能'
        })
      }
    })
    
    // 检查策略模式或委托
    if (classDefinition.strategies && classDefinition.strategies.length > 0) {
      extensionPoints.push({
        type: 'strategy',
        name: 'strategy_pattern',
        description: '可通过策略模式扩展算法'
      })
    }
    
    // 检查事件或钩子
    if (classDefinition.events && classDefinition.events.length > 0) {
      extensionPoints.push({
        type: 'event',
        name: 'event_system',
        description: '可通过事件系统扩展功能'
      })
    }
    
    return extensionPoints
  }
  
  // 分析修改风险
  analyzeModificationRisks(classDefinition) {
    const risks = []
    
    // 检查硬编码值
    classDefinition.methods.forEach(method => {
      if (method.hasHardcodedValues) {
        risks.push({
          type: 'hardcoded_values',
          method: method.name,
          description: '包含硬编码值，修改时需要改动代码'
        })
      }
    })
    
    // 检查紧耦合依赖
    if (classDefinition.tightlyCoupledDependencies) {
      risks.push({
        type: 'tight_coupling',
        description: '存在紧耦合依赖，修改时影响范围大'
      })
    }
    
    // 检查大型方法
    const largeMethods = classDefinition.methods.filter(method => method.lineCount > 50)
    if (largeMethods.length > 0) {
      risks.push({
        type: 'large_methods',
        methods: largeMethods.map(m => m.name),
        description: '包含大型方法，修改时容易引入错误'
      })
    }
    
    return risks
  }
  
  // LSP违规分析
  analyzeLSPViolations(inheritanceHierarchy) {
    const violations = []
    
    inheritanceHierarchy.subclasses.forEach(subclass => {
      // 检查前置条件强化
      const strengthenedPreconditions = this.checkStrengthenedPreconditions(
        inheritanceHierarchy.baseclass,
        subclass
      )
      
      if (strengthenedPreconditions.length > 0) {
        violations.push({
          type: 'strengthened_preconditions',
          subclass: subclass.name,
          methods: strengthenedPreconditions,
          description: '子类强化了前置条件'
        })
      }
      
      // 检查后置条件弱化
      const weakenedPostconditions = this.checkWeakenedPostconditions(
        inheritanceHierarchy.baseclass,
        subclass
      )
      
      if (weakenedPostconditions.length > 0) {
        violations.push({
          type: 'weakened_postconditions',
          subclass: subclass.name,
          methods: weakenedPostconditions,
          description: '子类弱化了后置条件'
        })
      }
      
      // 检查异常抛出
      const newExceptions = this.checkNewExceptions(
        inheritanceHierarchy.baseclass,
        subclass
      )
      
      if (newExceptions.length > 0) {
        violations.push({
          type: 'new_exceptions',
          subclass: subclass.name,
          methods: newExceptions,
          description: '子类抛出了基类未声明的异常'
        })
      }
    })
    
    return violations
  }
  
  // 接口内聚性分析
  analyzeInterfaceCohesion(interfaceDefinition) {
    const methods = interfaceDefinition.methods
    let totalRelations = 0
    let strongRelations = 0
    
    // 分析方法间的关系强度
    for (let i = 0; i < methods.length; i++) {
      for (let j = i + 1; j < methods.length; j++) {
        totalRelations++
        
        const relationStrength = this.calculateMethodRelationStrength(
          methods[i],
          methods[j]
        )
        
        if (relationStrength > 0.7) {
          strongRelations++
        }
      }
    }
    
    const cohesionScore = totalRelations > 0 ? strongRelations / totalRelations : 1
    
    return {
      score: cohesionScore,
      totalRelations,
      strongRelations,
      analysis: cohesionScore > 0.7 ? 'high_cohesion' : 
                cohesionScore > 0.4 ? 'medium_cohesion' : 'low_cohesion'
    }
  }
  
  calculateMethodRelationStrength(method1, method2) {
    let strength = 0
    
    // 检查共同参数类型
    const commonParams = this.findCommonParameterTypes(method1.parameters, method2.parameters)
    strength += commonParams.length * 0.2
    
    // 检查返回类型相关性
    if (this.areTypesRelated(method1.returnType, method2.returnType)) {
      strength += 0.3
    }
    
    // 检查命名相似性
    const namingSimilarity = this.calculateNamingSimilarity(method1.name, method2.name)
    strength += namingSimilarity * 0.5
    
    return Math.min(strength, 1.0)
  }
  
  // 验证所有SOLID原则
  validateSOLIDPrinciples(codeStructure) {
    const validationResults = {
      overall: {
        score: 0,
        passingPrinciples: 0,
        totalPrinciples: this.principleValidators.size
      },
      principles: {}
    }
    
    this.principleValidators.forEach((validator, principle) => {
      try {
        const result = validator.validate(codeStructure[principle.toLowerCase()])
        
        validationResults.principles[principle] = {
          name: validator.name,
          description: validator.description,
          isValid: result.isValid,
          details: result,
          score: result.isValid ? 1 : 0
        }
        
        if (result.isValid) {
          validationResults.overall.passingPrinciples++
        }
        
      } catch (error) {
        validationResults.principles[principle] = {
          name: validator.name,
          description: validator.description,
          isValid: false,
          error: error.message,
          score: 0
        }
      }
    })
    
    validationResults.overall.score = 
      validationResults.overall.passingPrinciples / validationResults.overall.totalPrinciples
    
    return validationResults
  }
}
```

### 3. 模式应用分析器

```javascript
// 设计模式应用分析器
class PatternApplicationAnalyzer {
  constructor() {
    this.analysisRules = new Map()
    this.setupAnalysisRules()
  }
  
  setupAnalysisRules() {
    // 创建型模式分析规则
    this.analysisRules.set('object_creation', {
      patterns: ['Singleton', 'Factory Method', 'Abstract Factory', 'Builder', 'Prototype'],
      indicators: [
        { keyword: 'new', weight: 0.3 },
        { keyword: 'create', weight: 0.4 },
        { keyword: 'instance', weight: 0.3 },
        { keyword: 'singleton', weight: 0.8 },
        { keyword: 'factory', weight: 0.7 }
      ],
      analyzer: (codeContext) => this.analyzeObjectCreation(codeContext)
    })
    
    // 结构型模式分析规则
    this.analysisRules.set('object_composition', {
      patterns: ['Adapter', 'Bridge', 'Composite', 'Decorator', 'Facade', 'Flyweight', 'Proxy'],
      indicators: [
        { keyword: 'adapter', weight: 0.8 },
        { keyword: 'wrapper', weight: 0.6 },
        { keyword: 'composite', weight: 0.7 },
        { keyword: 'decorator', weight: 0.8 },
        { keyword: 'facade', weight: 0.8 },
        { keyword: 'proxy', weight: 0.8 }
      ],
      analyzer: (codeContext) => this.analyzeObjectComposition(codeContext)
    })
    
    // 行为型模式分析规则
    this.analysisRules.set('object_interaction', {
      patterns: ['Observer', 'Strategy', 'Command', 'State', 'Template Method', 'Visitor', 'Mediator'],
      indicators: [
        { keyword: 'observer', weight: 0.8 },
        { keyword: 'strategy', weight: 0.8 },
        { keyword: 'command', weight: 0.8 },
        { keyword: 'state', weight: 0.6 },
        { keyword: 'template', weight: 0.7 },
        { keyword: 'visitor', weight: 0.8 },
        { keyword: 'mediator', weight: 0.8 }
      ],
      analyzer: (codeContext) => this.analyzeObjectInteraction(codeContext)
    })
  }
  
  // 分析代码中的模式使用
  analyzePatternUsage(codebase) {
    const analysis = {
      detectedPatterns: [],
      patternOpportunities: [],
      antiPatterns: [],
      recommendations: []
    }
    
    // 检测已使用的模式
    analysis.detectedPatterns = this.detectExistingPatterns(codebase)
    
    // 分析模式应用机会
    analysis.patternOpportunities = this.identifyPatternOpportunities(codebase)
    
    // 检测反模式
    analysis.antiPatterns = this.detectAntiPatterns(codebase)
    
    // 生成改进建议
    analysis.recommendations = this.generateRecommendations(analysis)
    
    return analysis
  }
  
  // 检测现有模式
  detectExistingPatterns(codebase) {
    const detectedPatterns = []
    
    this.analysisRules.forEach((rule, category) => {
      const patterns = rule.analyzer(codebase)
      
      patterns.forEach(pattern => {
        detectedPatterns.push({
          pattern: pattern.name,
          category: category,
          confidence: pattern.confidence,
          location: pattern.location,
          evidence: pattern.evidence
        })
      })
    })
    
    return detectedPatterns.sort((a, b) => b.confidence - a.confidence)
  }
  
  // 分析对象创建模式
  analyzeObjectCreation(codebase) {
    const patterns = []
    
    // 检测单例模式
    const singletonPattern = this.detectSingletonPattern(codebase)
    if (singletonPattern) {
      patterns.push(singletonPattern)
    }
    
    // 检测工厂模式
    const factoryPatterns = this.detectFactoryPatterns(codebase)
    patterns.push(...factoryPatterns)
    
    // 检测建造者模式
    const builderPattern = this.detectBuilderPattern(codebase)
    if (builderPattern) {
      patterns.push(builderPattern)
    }
    
    return patterns
  }
  
  detectSingletonPattern(codebase) {
    const singletonIndicators = [
      'getInstance',
      'instance',
      'private constructor',
      'static instance'
    ]
    
    let confidence = 0
    const evidence = []
    let location = null
    
    codebase.classes.forEach(cls => {
      // 检查静态实例变量
      const hasStaticInstance = cls.properties.some(prop => 
        prop.isStatic && prop.name.toLowerCase().includes('instance')
      )
      
      if (hasStaticInstance) {
        confidence += 0.4
        evidence.push('发现静态实例变量')
        location = cls.location
      }
      
      // 检查getInstance方法
      const hasGetInstance = cls.methods.some(method => 
        method.name === 'getInstance' && method.isStatic
      )
      
      if (hasGetInstance) {
        confidence += 0.4
        evidence.push('发现getInstance静态方法')
      }
      
      // 检查私有构造函数
      const hasPrivateConstructor = cls.constructor && cls.constructor.isPrivate
      
      if (hasPrivateConstructor) {
        confidence += 0.2
        evidence.push('发现私有构造函数')
      }
    })
    
    if (confidence >= 0.6) {
      return {
        name: 'Singleton',
        confidence,
        location,
        evidence
      }
    }
    
    return null
  }
  
  detectFactoryPatterns(codebase) {
    const patterns = []
    
    codebase.classes.forEach(cls => {
      // 检测工厂方法模式
      const factoryMethods = cls.methods.filter(method => 
        method.name.toLowerCase().includes('create') ||
        method.name.toLowerCase().includes('make') ||
        method.name.toLowerCase().includes('build')
      )
      
      if (factoryMethods.length > 0) {
        patterns.push({
          name: 'Factory Method',
          confidence: 0.7,
          location: cls.location,
          evidence: [`发现工厂方法: ${factoryMethods.map(m => m.name).join(', ')}`]
        })
      }
      
      // 检测抽象工厂模式
      if (cls.isAbstract && factoryMethods.length > 1) {
        patterns.push({
          name: 'Abstract Factory',
          confidence: 0.8,
          location: cls.location,
          evidence: ['发现抽象工厂类', `多个工厂方法: ${factoryMethods.length}`]
        })
      }
    })
    
    return patterns
  }
  
  // 识别模式应用机会
  identifyPatternOpportunities(codebase) {
    const opportunities = []
    
    // 分析代码味道
    const codeSmells = this.identifyCodeSmells(codebase)
    
    codeSmells.forEach(smell => {
      const recommendations = this.getPatternRecommendations(smell)
      opportunities.push(...recommendations)
    })
    
    return opportunities
  }
  
  identifyCodeSmells(codebase) {
    const smells = []
    
    // 检测长参数列表
    codebase.classes.forEach(cls => {
      cls.methods.forEach(method => {
        if (method.parameters.length > 5) {
          smells.push({
            type: 'long_parameter_list',
            location: method.location,
            severity: 'medium',
            description: `方法 ${method.name} 有 ${method.parameters.length} 个参数`
          })
        }
      })
    })
    
    // 检测重复代码
    const duplicatedCode = this.findDuplicatedCode(codebase)
    smells.push(...duplicatedCode)
    
    // 检测大类
    codebase.classes.forEach(cls => {
      if (cls.methods.length > 20) {
        smells.push({
          type: 'large_class',
          location: cls.location,
          severity: 'high',
          description: `类 ${cls.name} 有 ${cls.methods.length} 个方法`
        })
      }
    })
    
    // 检测switch语句
    const switchStatements = this.findSwitchStatements(codebase)
    smells.push(...switchStatements)
    
    return smells
  }
  
  getPatternRecommendations(codeSmell) {
    const recommendations = []
    
    switch (codeSmell.type) {
      case 'long_parameter_list':
        recommendations.push({
          pattern: 'Builder',
          reason: '使用建造者模式简化对象构造',
          confidence: 0.8,
          location: codeSmell.location
        })
        recommendations.push({
          pattern: 'Parameter Object',
          reason: '将参数封装成对象',
          confidence: 0.7,
          location: codeSmell.location
        })
        break
        
      case 'duplicated_code':
        recommendations.push({
          pattern: 'Template Method',
          reason: '使用模板方法消除重复代码',
          confidence: 0.7,
          location: codeSmell.location
        })
        recommendations.push({
          pattern: 'Strategy',
          reason: '将变化的算法封装成策略',
          confidence: 0.6,
          location: codeSmell.location
        })
        break
        
      case 'large_class':
        recommendations.push({
          pattern: 'Facade',
          reason: '使用外观模式简化接口',
          confidence: 0.6,
          location: codeSmell.location
        })
        recommendations.push({
          pattern: 'Extract Class',
          reason: '提取职责到独立的类',
          confidence: 0.8,
          location: codeSmell.location
        })
        break
        
      case 'switch_statement':
        recommendations.push({
          pattern: 'Strategy',
          reason: '使用策略模式替换switch语句',
          confidence: 0.9,
          location: codeSmell.location
        })
        recommendations.push({
          pattern: 'State',
          reason: '如果switch基于状态，考虑状态模式',
          confidence: 0.7,
          location: codeSmell.location
        })
        break
    }
    
    return recommendations
  }
  
  // 生成改进建议
  generateRecommendations(analysis) {
    const recommendations = []
    
    // 基于检测到的反模式生成建议
    analysis.antiPatterns.forEach(antiPattern => {
      recommendations.push({
        type: 'refactoring',
        priority: 'high',
        description: `消除反模式: ${antiPattern.name}`,
        suggestedPatterns: this.getSuggestedPatternsForAntiPattern(antiPattern),
        estimatedEffort: this.estimateRefactoringEffort(antiPattern)
      })
    })
    
    // 基于模式机会生成建议
    analysis.patternOpportunities.forEach(opportunity => {
      if (opportunity.confidence > 0.7) {
        recommendations.push({
          type: 'pattern_application',
          priority: 'medium',
          description: `应用 ${opportunity.pattern} 模式`,
          reason: opportunity.reason,
          location: opportunity.location,
          estimatedBenefit: this.estimatePatternBenefit(opportunity.pattern)
        })
      }
    })
    
    // 生成架构改进建议
    const architecturalRecommendations = this.generateArchitecturalRecommendations(analysis)
    recommendations.push(...architecturalRecommendations)
    
    return recommendations.sort((a, b) => {
      const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 }
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    })
  }
}
```

## 📚 最佳实践总结

1. **模式选择**：根据具体问题选择合适的设计模式
2. **SOLID原则**：遵循SOLID原则确保代码质量
3. **过度设计**：避免为了使用模式而使用模式
4. **简单性**：优先选择最简单的解决方案
5. **可读性**：确保模式的使用提高而非降低代码可读性
6. **测试性**：设计模式应该提高代码的可测试性
7. **演进性**：设计应该支持后续的演进和扩展
8. **文档化**：清楚地记录模式的使用意图和实现细节

通过掌握设计模式基础，您将能够编写更加灵活、可维护和可扩展的企业级代码。
