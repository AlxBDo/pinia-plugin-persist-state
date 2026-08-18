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
    },
    rollupOptions: {
      external: [
        'pinia',
        'pinia-plugin-subscription'
      ],
      output: {
        globals: {
          pinia: 'Pinia',
          'pinia-plugin-subscription': 'PiniaPluginSubscription'
        },
      },
    },
  },
})