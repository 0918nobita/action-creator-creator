import * as webpack from 'webpack';

export class HelloWorldPlugin {
  apply(compiler: webpack.Compiler): void {
    compiler.hooks.done.tap('HelloWorldPlugin', () => {
      console.log('Hello, world!');
    });
  }
}
