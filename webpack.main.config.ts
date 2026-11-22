import type { WebpackConfiguration } from '@electron-forge/plugin-webpack';

const rules = require('./webpack.rules');
const plugins = require('./webpack.plugins');

export const mainConfig: WebpackConfiguration = {
  entry: './src/main/index.ts',
  module: { rules },
  plugins,
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.css', '.json'],
  },
};
