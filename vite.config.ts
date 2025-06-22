import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import webExtension from 'vite-plugin-web-extension';
import path from 'path';

const targetBrowser = process.env.TARGET_BROWSER || 'chrome';

function getManifestPath(): string {
  if (targetBrowser === 'firefox') {
    return 'manifest.v2.json';
  }
  return 'manifest.v3.json';
}

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      // 设置 @ 别名指向 src 目录
      '@': path.resolve(__dirname, 'src'),
    },
  },
  plugins: [
    vue(),
    webExtension({
      manifest: getManifestPath(),
      browser: targetBrowser,
    }),
  ],
  build: {
    outDir: `dist/${targetBrowser}`,
    emptyOutDir: true,
  },
});
