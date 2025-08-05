import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.ico',
        'logo192.png',
        'logo512.png',
        'class_names.json',
        'modelA/model.json',
        'modelA/group1-shard1of3.bin',
        'modelA/group1-shard2of3.bin',
        'modelA/group1-shard3of3.bin',
        'modelB/model.json',
        'modelB/group1-shard1of23.bin',
        'modelB/group1-shard2of23.bin',
        'modelB/group1-shard3of23.bin',
        'modelB/group1-shard4of23.bin',
        'modelB/group1-shard5of23.bin',
        'modelB/group1-shard6of23.bin',
        'modelB/group1-shard7of23.bin',
        'modelB/group1-shard8of23.bin',
        'modelB/group1-shard9of23.bin',
        'modelB/group1-shard10of23.bin',
        'modelB/group1-shard11of23.bin',
        'modelB/group1-shard12of23.bin',
        'modelB/group1-shard13of23.bin',
        'modelB/group1-shard14of23.bin',
        'modelB/group1-shard15of23.bin',
        'modelB/group1-shard16of23.bin',
        'modelB/group1-shard17of23.bin',
        'modelB/group1-shard18of23.bin',
        'modelB/group1-shard19of23.bin',
        'modelB/group1-shard20of23.bin',
        'modelB/group1-shard21of23.bin',
        'modelB/group1-shard22of23.bin',
        'modelB/group1-shard23of23.bin'
      ],      
      manifest: {
        name: 'Cattle Identifier',
        short_name: 'CattleID',
        start_url: '.',
        display: 'standalone',
        background_color: '#f0fdf4',
        theme_color: '#16a34a',
        icons: [
          {
            src: 'logo192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'logo512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        // Allow precaching files up to 5MB (default is 2MB)
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024
      }
    })
  ]
})
