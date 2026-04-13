import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// 开发环境使用 './'，生产环境 GitHub Pages 使用 '/Hwinfo_Logvisualizer/'
const base = process.env.NODE_ENV === 'production' ? '/Hwinfo_Logvisualizer/' : './'

export default defineConfig({
  resolve: {
    alias: {
      buffer: 'buffer',
    }
  },
  define: {
    global: 'globalThis',
  },
  base,
  plugins: [
    react(),
    VitePWA({
      // 使用 injectManifest 模式，禁用自动注册，我们手动注册
      strategies: 'injectManifest',
      srcDir: 'public',
      filename: 'sw.js',
      registerType: 'autoUpdate',
      // 禁用自动注册，我们已经手动写了注册代码
      injectRegister: false,
      includeAssets: ['favicon.ico', 'logo.svg', 'test.CSV'],
      manifest: {
        name: 'HWiNFO Log Visualizer',
        short_name: 'Log Visualizer',
        description: 'Generate insightful charts from your HWiNFO64 logs to easily visualize and analyze system performance',
        theme_color: '#171717',
        background_color: '#171717',
        display: 'standalone',
        scope: '/Hwinfo_Logvisualizer/',
        start_url: '/Hwinfo_Logvisualizer/',
        icons: [
          {
            src: base + 'favicon.ico',
            sizes: '16x16 32x32',
            type: 'image/x-icon',
          },
          {
            src: base + 'logo.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any'
          },
          {
            src: base + 'logo.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any'
          },
        ],
        screenshots: [
          {
            src: base + 'logo.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            form_factor: 'wide'
          },
          {
            src: base + 'logo.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            form_factor: 'narrow'
          }
        ]
      },
      workbox: {
        globPatterns: [
          '**/*.{js,css,html,ico,png,svg}'
        ],
        navigateFallback: base + 'index.html',
        cacheId: 'hwinfo-log-viz',
        runtimeCaching: [{
          urlPattern: ({ request }) => request.destination === 'image',
          handler: 'CacheFirst',
          options: {
            cacheName: 'images',
          },
        }],
      },
    }),
  ],
  server: {
    port: 3000,
    open: true
  }
})
