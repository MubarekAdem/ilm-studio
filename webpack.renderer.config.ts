import type { WebpackConfiguration } from '@electron-forge/plugin-webpack';

const rules = require('./webpack.rules');
const plugins = require('./webpack.plugins');

export const rendererConfig: WebpackConfiguration = {
  module: { rules },
  plugins,
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.css'],
  },
};
