import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        include: ['src/tests/**/*.test.ts'],
        coverage: {
            provider: 'v8' // or 'istanbul'
        },
    },
})