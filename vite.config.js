import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  // GitHub Pages 经常部署到仓库子路径，使用环境变量控制 base 可以兼顾本地开发和线上部署。
  base: process.env.VITE_BASE_PATH || '/',
  plugins: [vue()],
});
