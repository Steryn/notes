# 高质量代码常见问题及解决方案

## 1. 单文件过长

::: warning 问题

- 单个文件动辄几千行代码
- 包含大量DOM结构、JS逻辑和样式
- 需要花费大量时间才能理解代码结构

:::

::: tip 解决方案

- 将代码拆分到多个文件中
- 使用组件化开发
- 每个模块负责独立的功能。

:::

``` js
<template>
  <div>
    <Header/>
    <main>
      <Banner/>
      <AboutUs/>
      <Services/> 
      <ContactUs/>
    </main>
    <Footer/>
  </div>
</template>
```

## 2. 模块耦合严重

::: warning 问题

- 模块之间相互依赖
- 修改一处可能影响多处
- 难以进行单元测试

:::

::: tip 解决方案

- 单一职责原则
- 将功能拆分到多个函数或组件中

:::

``` js
// ❌错误
<script>
export default {
  methods: {
    getUserDetail() {
      // 错误示范：多处耦合
      let userId = this.$store.state.userInfo.id 
        || window.currentUserId
        || this.$route.params.userId;
      
      getUser(userId).then(res => {
        // 直接操作子组件内部数据
        this.$refs.userBaseInfo.data = res.baseInfo;
        this.$refs.userArticles.data = res.articles;
      })
    }
  }
}

// ✅ 正确
<template>
  <div>
    <userBaseInfo :base-info="baseInfo"/>
    <userArticles :articles="articles"/>
  </div>
</template>

<script>
export default {
  props: ['userId'],
  data() {
    return {
      baseInfo: {},
      articles: []
    }
  },
  methods: {
    getUserDetail() {
      getUser(this.userId).then(res => {
        this.baseInfo = res.baseInfo；
        this.articles = res.articles；
      })
    }
  }
}
</script>
```

## 3. 职责不单一

::: warning 问题

- 一个函数或组件承担了多种职责
- 修改一处代码需要修改多个文件
- 代码逻辑混杂在一起,难以维护和扩展

:::

::: tip 解决方案

- 单一职责原则
- 将功能拆分到多个函数或组件中

:::

``` js
// ❌错误
<script>
export default {
  methods: {
    getUserData() {
      userService.getUserList().then(res => {
        this.userData = res.data；
        // 一个方法中做了太多事情
        let vipCount = 0；
        let activeVipsCount = 0；
        let activeUsersCount = 0；
        
        this.userData.forEach(user => {
          if(user.type === 'vip') {
            vipCount++
          }
          if(dayjs(user.loginTime).isAfter(dayjs().subtract(30, 'day'))) {
            if(user.type === 'vip') {
              activeVipsCount++
            }
            activeUsersCount++
          }
        })
        
        this.vipCount = vipCount；
        this.activeVipsCount = activeVipsCount；
        this.activeUsersCount = activeUsersCount；
      })
    }
  }
}
</script>

// ✅ 正确
<script>
export default {
  computed: {
    // 将不同统计逻辑拆分为独立的计算属性
    activeUsers() {
      return this.userData.filter(user => 
        dayjs(user.loginTime).isAfter(dayjs().subtract(30, 'day'))
      )
    },
    vipCount() {
      return this.userData.filter(user => user.type === 'vip').length
    },
    activeVipsCount() {
      return this.activeUsers.filter(user => user.type === 'vip').length
    },
    activeUsersCount() {
      return this.activeUsers.length
    }
  },
  methods: {
    getUserData() {
      // 方法只负责获取数据
      userService.getUserList().then(res => {
        this.userData = res.data；
      })
    }
  }
}
</script>

```

## 4. 代码复制代替复用

::: warning 问题

- 复制粘贴代码代替复用
- 修改一处代码需要修改多处
- 难以维护和扩展,容易遗漏修改点，造成bug

:::

::: tip 解决方案

- 提前抽取公共代码,使用函数或组件进行代码复用
- 将重复代码封装成函数或组件
- 通过参数来处理细微差异

:::

## 5. 强行复用/假装复用

::: warning 问题

- 强行复用代码
- 代码中充斥着大量无用的复用逻辑
- 很多交叉逻辑,难以维护

:::

::: tip 解决方案

- 不同业务逻辑使用独立组件
- 只抽取真正可复用的部分（如表单验证规则、公共UI组件等）
- 保持每个组件职责单一

:::

## 参考引用

[为什么同事的前端代码我改不动了？](https://juejin.cn/post/7438647460219961395#heading-8)
