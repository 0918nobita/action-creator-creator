// @actions

export interface FooAction {
  type: 'foo';
  payload: {
    num: number;
  };
}

export interface BarAction {
  type: 'bar';
  payload: {
    str: string;
  };
}
