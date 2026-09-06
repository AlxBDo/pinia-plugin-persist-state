import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPersistStatePlugin } from '../plugins/createPersistStatePlugin'
import PersistPiniaState from '../plugins/PersistPiniaState'

class MockStorage implements Storage {
    private store = new Map<string, string>()

    get length(): number {
        return this.store.size
    }

    clear(): void {
        this.store.clear()
    }

    getItem(key: string): string | null {
        return this.store.has(key) ? this.store.get(key)! : null
    }

    key(index: number): string | null {
        const keys = Array.from(this.store.keys())
        return keys[index] ?? null
    }

    removeItem(key: string): void {
        this.store.delete(key)
    }

    setItem(key: string, value: string): void {
        this.store.set(key, value)
    }
}

describe('Plugins unit tests', () => {
    beforeEach(() => {
        if (typeof window === 'undefined') {
            (globalThis as any).window = globalThis
        }
        (globalThis as any).localStorage = new MockStorage();
        (globalThis as any).sessionStorage = new MockStorage();
    })

    describe('createPersistStatePlugin', () => {
        it('creates plugin subscriber with no options', () => {
            const plugin = createPersistStatePlugin()
            expect(plugin).toBe(PersistPiniaState)
            expect(PersistPiniaState.pluginOptions.persister).toBeUndefined()
            expect(PersistPiniaState.pluginOptions.crypt).toBeUndefined()
        })

        it('creates plugin subscriber with dbName and cryptKey', () => {
            createPersistStatePlugin('localStorage', 'mySecretKey123')
            expect(PersistPiniaState.pluginOptions.persister).toBeDefined()
            expect(PersistPiniaState.pluginOptions.crypt).toBeDefined()
            expect(PersistPiniaState.pluginOptions.watchedStore).toBeInstanceOf(Set)
        })

        it('creates an IndexedDB persister from explicit options', () => {
            createPersistStatePlugin({
                storage: 'indexedDB',
                databaseName: 'testIndexedDB',
                objectStoreName: 'persistedStore'
            })

            expect(PersistPiniaState.pluginOptions.persister?.dbName).toBe('testIndexedDB')
        })

        it('returns empty options when window is undefined', () => {
            const originalWindow = (globalThis as any).window
            delete (globalThis as any).window

            try {
                createPersistStatePlugin('localStorage', 'mySecretKey123')
                expect(PersistPiniaState.pluginOptions.persister).toBeUndefined()
                expect(PersistPiniaState.pluginOptions.crypt).toBeUndefined()
            } finally {
                (globalThis as any).window = originalWindow
            }
        })
    })

    describe('PersistPiniaState', () => {
        it('_resetStoreCallback calls removePersistedState when available', () => {
            const removePersistedState = vi.fn()
            const mockStore = { removePersistedState }

            const callback = (PersistPiniaState as any)._resetStoreCallback
            callback(mockStore)

            expect(removePersistedState).toHaveBeenCalledOnce()
        })

        it('_resetStoreCallback does nothing if store has no removePersistedState', () => {
            const callback = (PersistPiniaState as any)._resetStoreCallback
            expect(() => callback({})).not.toThrow()
        })

        it('hydrate returns early when window is undefined', () => {
            const originalWindow = (globalThis as any).window
            delete (globalThis as any).window

            try {
                expect(() => PersistPiniaState.hydrate()).not.toThrow()
            } finally {
                (globalThis as any).window = originalWindow
            }
        })

        it('hydrate schedules storeInstance hydration and handles rejection', async () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { })

            const rejectingHydrate = vi.fn().mockRejectedValue(new Error('Hydration failed'))
            Object.defineProperty(PersistPiniaState, 'storeInstance', {
                get: () => ({ hydrate: rejectingHydrate }),
                configurable: true
            })

            PersistPiniaState.hydrate()

            await new Promise((resolve) => setTimeout(resolve, 50))

            expect(rejectingHydrate).toHaveBeenCalled()

            consoleSpy.mockRestore()
        })

        it('hydrate handles resolved storeInstance hydration without error', async () => {
            const resolvingHydrate = vi.fn().mockResolvedValue(true)
            Object.defineProperty(PersistPiniaState, 'storeInstance', {
                get: () => ({ hydrate: resolvingHydrate }),
                configurable: true
            })

            expect(() => PersistPiniaState.hydrate()).not.toThrow()

            await new Promise((resolve) => setTimeout(resolve, 50))

            expect(resolvingHydrate).toHaveBeenCalled()
        })
    })
})
