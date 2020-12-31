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
