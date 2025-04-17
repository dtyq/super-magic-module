import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    // 允许的主机列表
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      'test.com',
      // 添加其他需要允许的主机
    ]
  }
}) 