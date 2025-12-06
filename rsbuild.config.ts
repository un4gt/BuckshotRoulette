import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import path from 'path';

// Docs: https://rsbuild.rs/config/
export default defineConfig({
  plugins: [pluginReact()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/shared': path.resolve(__dirname, './src/shared'),
      '@/entities': path.resolve(__dirname, './src/entities'),
      '@/features': path.resolve(__dirname, './src/features'),
      '@/agents': path.resolve(__dirname, './src/agents'),
      '@/app': path.resolve(__dirname, './src/app'),
    },
  },
  output: {
    // 支持 GitHub Pages 子路径部署
    // 本地开发时使用 '/'，生产环境通过环境变量 PUBLIC_PATH 设置
    assetPrefix: process.env.PUBLIC_PATH || '/',
  },
});
