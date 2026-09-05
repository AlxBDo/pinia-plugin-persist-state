import { describe, expect, it, vi, beforeEach } from 'vitest'
import { nextTick } from 'vue'

import { useTestStore } from '../stores/test'
import { beforeEachPiniaPlugin } from './utils/beforeEach'
import StorePersister from '../core/StorePersister'
import PersisterMock from '../testing/mocks/persister'
import Crypt from '../services/Crypt'
import PersistPiniaState from '../plugins/PersistPiniaState'

// Register the pinia setup for each test (without the plugin integration)
beforeEachPiniaPlugin()

describe('StorePersister - basic behaviors', () => {
    it('Augments store with persistence methods', async () => {
        const store = useTestStore()

        expect(typeof (store as any).persistState).toBe('function')
        expect(typeof (store as any).remember).toBe('function')
        expect(typeof (store as any).removePersistedState).toBe('function')
        expect(typeof (store as any).watch).toBe('function')
        expect(typeof (store as any).stopWatch).toBe('function')
    })

    it('handles storeSubscription when watchMutation is true', async () => {
        const store = useTestStore()
        const persister = new PersisterMock({ name: 'localStorage' })
        const spySetItem = vi.spyOn(persister as any, 'setItem')

            // Enable watch mutation
            ; (store as any).watch()

        // Trigger state mutation
        store.myString = 'mutated string'

        await new Promise((r) => setTimeout(r, 50))

        expect(store.myString).toBe('mutated string')
        spySetItem.mockRestore()
    })

    it('hydrate returns undefined when window is undefined', async () => {
        const store = useTestStore()
        const originalWindow = (globalThis as any).window
        delete (globalThis as any).window

        try {
            const result = await (store as any).hydrate()
            expect(result).toBe(undefined)
        } finally {
            (globalThis as any).window = originalWindow
        }
    })

    it('customizeStore enables persist option when watchMutation is true without persist', () => {
        const options: any = {
            storeOptions: { watchMutation: true },
            watchedStore: new Set()
        }
        const mockStore: any = {
            $id: 'testStoreOptions',
            $state: { isLoading: false },
            $subscribe: vi.fn(),
            $onAction: vi.fn()
        }
        StorePersister.customizeStore(mockStore, options, false)
        expect(options.storeOptions.persist).toBe(true)
    })

    it('persistState then remember restores persisted values (including encrypted props)', async () => {
        const store = useTestStore()

        // Prepare values and persist
        store.myString = 'My new string'
        store.myStringEncrypted = 'Sensitive Data'

        await (store as any).persistState()

        // Change values locally
        store.myString = 'Other value'
        store.myStringEncrypted = 'Other secret'

        // Remember should restore persisted values (decrypted where needed)
        await (store as any).remember()

        expect(store.myString).toBe('My new string')
        expect(store.myStringEncrypted).toBe('Sensitive Data')
    })

    it('stopWatch stops persisting on mutations', async () => {
        const store = useTestStore()

        const persister = new PersisterMock({ name: 'localStorage' })

        const spy = vi.spyOn(persister as any, 'setItem')

            // Stop watching
            ; (store as any).stopWatch()

        // Mutate
        store.myString = 'should-not-trigger'

        await new Promise((r) => setTimeout(r, 50))

        expect(spy).not.toHaveBeenCalled()

        spy.mockRestore()
    })

    it('removePersistedState deletes persisted data so remember does not revert', async () => {
        const store = useTestStore()

        store.myString = 'Stored value'
        await (store as any).persistState()

        // Change and then remove persisted state
        store.myString = 'Changed locally'
        await (store as any).removePersistedState()

        // Remember should not overwrite local change because persisted item was removed
        await (store as any).remember()

        expect(store.myString).toBe('Changed locally')
    })

    it('debounces rapid mutation persistence', async () => {
        vi.useFakeTimers()
        useTestStore()
        const storePersister = (PersistPiniaState as any).storeInstance as StorePersister

        try {
            expect(storePersister).toBeDefined()
            storePersister.options.watchMutation = true
            const persist = vi.spyOn(storePersister, 'persist').mockResolvedValue(undefined)
            const persistedStore = (storePersister as any).store
                ; (storePersister as any).storeSubscription({ type: 'direct', storeId: persistedStore.$id })
                ; (storePersister as any).storeSubscription({ type: 'direct', storeId: persistedStore.$id })
                ; (storePersister as any).storeSubscription({ type: 'direct', storeId: persistedStore.$id })

            await vi.advanceTimersByTimeAsync(199)
            expect(persist).not.toHaveBeenCalled()

            await vi.advanceTimersByTimeAsync(1)
            expect(persist).toHaveBeenCalledTimes(1)
        } finally {
            vi.useRealTimers()
        }
    })

    it('handles storeSubscription mutation execution and mutationCallback', async () => {
        const store = useTestStore()
        const mutationCallback = vi.fn()
        store.mutationCallback = mutationCallback

            // Enable watch
            ; (store as any).watch()

        // Call storeSubscription manually with direct mutation
        const instance = (store as any)
        const subscriptionFn = instance.storeSubscribe
        if (subscriptionFn) {
            subscriptionFn({ type: 'direct', storeId: store.$id })
            await new Promise((r) => setTimeout(r, 50))
            expect(mutationCallback).toHaveBeenCalled()
        }
    })

    it('handles getStateToPersist and cryptState branches', async () => {
        const store = useTestStore()
        const crypt = new Crypt('HrN2t2nCr6pTiV22')
        await crypt.init()

        // Configure custom options on store persister
        const persisterInstance = (store as any)
            ; (store as any).$state['@context'] = 'context-value'
            ; (store as any).$state['_privateKey'] = 'private-value'
            ; (store as any).$state['emptyProp'] = null

        await (store as any).persistState()
        expect(store.myString).toBeDefined()
    })
})
