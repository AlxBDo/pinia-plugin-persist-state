import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        include: ['src/tests/**/*.test.ts'],
        coverage: {
            enabled: true,
            provider: 'v8',
            include: ['src/**/*.ts'],
            exclude: [
                'src/App.vue',
                'src/main.ts',
                'src/stores/**',
                'src/testing/**',
                'src/tests/**',
                'src/types/**',
                'src/services/IndexedDB.ts',
            ],
            thresholds: {
                lines: 80,
                functions: 80,
                branches: 80,
                statements: 80,
            },
            reporter: ['text', 'html']
        },
    },
})