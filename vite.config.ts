import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { pluginName } from './src/utils/constantes'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [vue()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/lib/main.ts'),
      name: pluginName,
      fileName: pluginName,
      formats: ['es'],
    },
    rollupOptions: {
      external: [
        'pinia',
        /^pinia-plugin-subscription(\/.*)?$/,
        'vue'
      ],
      output: {
        globals: (id) => {
          if (id === 'pinia') return 'Pinia'
          if (id === 'vue') return 'Vue'
          if (id === 'pinia-plugin-subscription') return 'PiniaPluginSubscription'
          if (id === 'pinia-plugin-subscription/helpers') return 'PiniaPluginSubscriptionHelpers'
          if (id === 'pinia-plugin-subscription/types') return 'PiniaPluginSubscriptionTypes'
          return id
        },
      },
    },
  },
})