# autoUnloadWatch

## 自动卸载watch，组件卸载自动取消{#Introduce}

参数同`watch`

```ts
export const autoUnloadWatch = <T>(
  source: WatchSource<T>,
  callback: WatchCallback<T>,
  options?: WatchOptions
) => {
  const watchHandler = watch(source, callback, options);

  onUnmounted(() => {
    watchHandler?.();
  });
};
```

## 使用{#Usage}

```ts
autoUnloadWatch(
    () => id,
    (val: string) => {
      console.log("start");
      //do something
    },
    { immediate: true }
  );
```
