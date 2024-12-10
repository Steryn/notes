# ts 函数重载签名

## 定义 {#Definition}

```ts
export function reload(val: string): string;
export function reload(val: number): number;
export function reload(val: boolean): boolean;
export function reload(val: string | number | boolean): string | number | boolean {
  return val;
}
```

## 使用 {#Usage}

```ts
reload("123");
reload(123);
reload(true);
```
