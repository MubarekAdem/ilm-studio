import type { ForgeConfig } from '@electron-forge/shared-types';
import { WebpackPlugin } from '@electron-forge/plugin-webpack';
import { AutoUnpackNativesPlugin } from '@electron-forge/plugin-auto-unpack-natives';
import { MakerDeb } from '@electron-forge/maker-deb';
import { MakerRpm } from '@electron-forge/maker-rpm';
import { MakerZIP } from '@electron-forge/maker-zip';

import { mainConfig } from './webpack.main.config';
import { rendererConfig } from './webpack.renderer.config';

const config: ForgeConfig = {
  packagerConfig: {
    asar: true,
    name: 'ilm-studio',
    executableName: 'ilm-studio',
  },
  makers: [
    new MakerZIP({}, ['linux']),
    new MakerDeb({
      options: {
        maintainer: 'Mubarek',
        homepage: 'https://github.com/mubarek/ilm-studio',
        icon: './assets/icon.png',
        categories: ['Education'],
      },
    }),
    new MakerRpm({
      options: {
        homepage: 'https://github.com/mubarek/ilm-studio',
        icon: './assets/icon.png',
        categories: ['Education'],
      },
    }),
  ],
  plugins: [
    new AutoUnpackNativesPlugin({}),
    new WebpackPlugin({
      mainConfig,
      renderer: {
        config: rendererConfig,
        entryPoints: [
          {
            html: './src/renderer/index.html',
            js: './src/renderer/index.tsx',
            name: 'main_window',
            preload: {
              js: './src/main/preload.ts',
            },
          },
        ],
      },
    }),
  ],
};

export default config;
