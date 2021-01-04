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

export interface BazAction {
  type: 'baz';
}
