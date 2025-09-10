# 函数多态

函数多态（Polymorphism）是面向对象编程中的一个核心概念，它允许不同的对象对同一消息做出不同的响应。简单来说，多态意味着一个函数可以有多种表现形式。在编程里，多态通常通过继承和方法重写来实现，让同一个方法名在不同的类中具有不同的实现逻辑。

## 代码 demo

### JavaScript 中的函数多态示例

在 JavaScript 中，由于它是动态类型语言且没有严格的类继承机制，我们可以通过不同的方式实现多态。以下是一个简单的示例，模拟动物发出声音的场景：

```js
// 基类
class Animal {
  makeSound() {
    console.log("动物发出声音");
  }
}

// 子类
class Dog extends Animal {
  makeSound() {
    console.log("狗发出汪汪声");
  }
}

// 子类
class Cat extends Animal {
  makeSound() {
    console.log("猫发出喵喵声");
  }
}

// 多态的使用
const animal1 = new Animal();
const animal2 = new Dog();
const animal3 = new Cat();

animal1.makeSound(); // 输出: 动物发出声音
animal2.makeSound(); // 输出: 狗发出汪汪声
animal3.makeSound(); // 输出: 猫发出喵喵声
```

在这个例子中，`Animal` 是基类，`Dog` 和 `Cat` 是子类。每个子类都重写了 `makeSound` 方法，展示了多态的概念。

### 类型 Script 中的函数多态示例

在 TypeScript 中，我们可以使用接口和泛型来实现函数多态。以下是一个简单的示例，模拟动物发出声音的场景：

```ts
// 接口
interface Animal {
  makeSound(): void;
}

// 实现接口的类
class Dog implements Animal {
  makeSound() {
    console.log("狗发出汪汪声");
  }
}

// 实现接口的类
class Cat implements Animal {
  makeSound() {
    console.log("猫发出喵喵声");
  }
}

// 多态的使用
const animal1: Animal = new Animal();
const animal2: Animal = new Dog();
const animal3: Animal = new Cat();

animal1.makeSound(); // 输出: 动物发出声音
animal2.makeSound(); // 输出: 狗发出汪汪声
animal3.makeSound(); // 输出: 猫发出喵喵声
```

在这个例子中，`Animal` 是接口，`Dog` 和 `Cat` 是实现了 `Animal` 接口的类。每个类都实现了 `makeSound` 方法，展示了多态的概念。
