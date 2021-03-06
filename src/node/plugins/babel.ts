import type Babel from '@babel/core';
import chalk from 'chalk';

import path from 'path';

import { ReboostPlugin } from '../index';

export const BabelPlugin = (options: Babel.TransformOptions = {}): ReboostPlugin => {
  let babel: typeof Babel;
  const compatibleTypes = ['js', 'jsx', 'ts', 'tsx', 'es', 'es6', 'mjs'];

  return {
    name: 'core-babel-plugin',
    async setup({ resolveModule }) {
      const babelPath = resolveModule('', '@babel/core', { mainFields: ['main'] });
      if (babelPath) {
        babel = require(babelPath);

        options = Object.assign({}, options, {
          ast: false,
          sourceMaps: true,
          sourceType: 'module',
        } as Babel.TransformOptions);

        // Warm up babel
        babel.transformAsync('', options);
      } else {
        console.log(chalk.red('You need to install "@babel/core" package in order to use BabelPlugin.'));
        console.log(chalk.red('Please run "npm i @babel/core" to install Babel.'));
      }
    },
    async transformContent(data, filePath) {
      if (!babel) return;

      if (compatibleTypes.includes(data.type)) {
        try {
          const { code, map } = await babel.transformAsync(data.code, options);

          map.sources = [filePath];

          return {
            code,
            map
          }
        } catch (e) {
          let message = `BabelPlugin: Error while transforming "${path.relative(this.config.rootDir, filePath)}"\n`;
          message += e.message.replace(/^unknown: /, '');

          return new Error(message);
        }
      }

      return null;
    }
  }
}
