import { describe, expect, it, vi, beforeEach } from 'vitest'
import { nextTick } from 'vue'

import { useTestStore } from '../stores/test'
import { beforeEachPiniaPlugin } from './utils/beforeEach'
import StorePersister from '../core/StorePersister'
import PersisterMock from '../testing/mocks/persister'
import Crypt from '../services/Crypt'

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
            ; (store as any).removePersistedState()

        // Remember should not overwrite local change because persisted item was removed
        await (store as any).remember()

        expect(store.myString).toBe('Changed locally')
    })
})
