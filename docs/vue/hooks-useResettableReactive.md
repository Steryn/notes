# 重置可响应对象

## 定义 {#Definition}

```ts
import { reactive } from "vue";

type Resettable<T> = [T, () => void] & { state: T; reset: () => void };

function clone(value: any) {
  if (value === null || typeof value !== "object") return value;
  return JSON.parse(JSON.stringify(value));
}

function useResettableReactive<T extends object>(value: T) {
  const state = reactive(clone(value)) as T;

  const reset = () => {
    Object.keys(state).forEach((key) => delete state[key]);
    Object.assign(state, clone(value));
  };

  return Object.assign([state, reset], {
    state,
    reset,
  }) as unknown as Resettable<T>;
}
```

## 使用 {#Usage}

```ts
const { state, reset } = useResettableReactive({ name: "zhang" });

reset();

// or
const { state, reset } = useResettableReactive({ name: "zhang" });

reset();
```
