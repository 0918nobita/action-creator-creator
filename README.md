# Action Creator Creator

(WIP) Automatically generate `.ts` files which implement Redux Action Creators

## Example

Input: (`actions.ts`)

```typescript
// @actions

interface FooAction {
  type: 'foo';
  payload: {
    num: number;
  };
}

interface BarAction {
  type: 'bar';
  payload: {
    str: string;
  };
}
```

Output: (`out.ts`)

```typescript
import { FooAction, BarAction } from './actions.ts';
export function foo(payload: FooAction['payload']): FooAction {
    return { type: 'foo', payload };
}
export function bar(payload: BarAction['payload']): BarAction {
    return { type: 'bar', payload };
}
```
