#!/usr/bin/env node

import chalk from 'chalk';

const args = process.argv.splice(2);

if (args.length === 0) {
  console.log(`${chalk.green.bold('redux-acc')} - Redux Action Creator Creator`);
  console.log('version 0.1.0');
}

console.log(args);
