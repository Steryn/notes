# ts 函数返回值

## 同时导出对象和数组

```ts
type ReturnData = [T,()=>void] &{state:T,reset:()=>void }

export function useAnyFn():ReturnData{
    const state = reactive({name:'zhang'})
    const reset = ()=>{
        Object.keys(state).forEach(key=>delete state[key])
        Object.assign(state,value)
    }
    
    return Object.assign([state,reset],{state,reset}) as unknown as ReturnData
}
```

## 使用 {#Usage}

```ts
const [ state, reset ] = useAnyFn();

reset();

// or
const { state, reset } = useAnyFn();

reset();
```
