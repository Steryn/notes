# useWatchStopHandle

## 注册收集watch句柄，卸载自动取消{#Introduce}

```ts
import { WatchStopHandle } from "vue";

function useWatchStopHandle(isAutoUnload = true) {
  const watchHandler = ref<WatchStopHandle | null>(null);

  const watchRegister = (handler: WatchStopHandle) => {
    watchHandler.value = handler;
  };

  onUnmounted(() => {
    if (!isAutoUnload) return;
    watchHandler.value && watchHandler.value();
  });

  return {
    watchRegister,
    watchHandler,
  };
}
```

## 使用{#Usage}

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
