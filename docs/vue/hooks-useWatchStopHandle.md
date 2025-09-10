# useWatchStopHandle

## 定义 {#Definition} <badge type="warning" text="Test" />

注册收集 watch 句柄，卸载自动取消

```ts
import { WatchStopHandle } from "vue";

export function useWatchStopHandle(
  config: { isAutoUnload: boolean; startOnMounted: boolean } = {
    isAutoUnload: true,
    startOnMounted: true,
  }
) {
  let watchHandler: WatchStopHandle | null = null;

  // TODO:这里考虑收集多个watch句柄，目前只收集一个，会被覆盖
  const watchRegister = (handler: () => WatchStopHandle) => {
    const handlerFn = () => {
      watchHandler = handler();
    };
    config.startOnMounted ? onMounted(handlerFn) : handlerFn();
  };

  onUnmounted(() => {
    if (!config.isAutoUnload) return;
    watchHandler && watchHandler();
  });

  return {
    watchRegister,
    watchHandler,
  };
}
```

## 使用 {#Usage}

```ts
const { watchRegister } = useWatchStopHandle();
watchRegister(
  // 基础的watch写法
  watch(
    () => xxx,
    (val) => {
      // do something
    }
  )
);
```
