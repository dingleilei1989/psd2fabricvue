import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 3000,
    open: false // 在Linux环境下关闭自动打开浏览器
  },
  optimizeDeps: {
    include: ['fabric', 'ag-psd']
  },
  define: {
    global: 'window'
  }
})