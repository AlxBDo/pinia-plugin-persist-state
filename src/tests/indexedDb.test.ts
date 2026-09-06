import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import IndexedDB from '../services/IndexedDB'

let databaseNumber = 0

function createIndexedDB(): IndexedDB {
    databaseNumber++
    const databaseName = `persist-test-${databaseNumber}`
    return new IndexedDB(databaseName, databaseName, { keyPath: 'storeName' })
}

describe('IndexedDB', () => {
    beforeEach(() => {
        vi.restoreAllMocks()
    })

    it('updates and reads an item in its named database', async () => {
        const indexedDb = createIndexedDB()

        await indexedDb.setItem({ storeName: 'testStore', value: 'first' })
        await indexedDb.setItem({ storeName: 'testStore', value: 'latest' })

        await expect(indexedDb.getItem('testStore')).resolves.toEqual({ storeName: 'testStore', value: 'latest' })
    })

    it('reuses one database connection for successive operations', async () => {
        const open = vi.spyOn(globalThis.indexedDB, 'open')
        const indexedDb = createIndexedDB()

        await indexedDb.setItem({ storeName: 'testStore', value: 'stored' })
        await indexedDb.getItem('testStore')
        await indexedDb.removeItem('testStore')

        expect(open).toHaveBeenCalledTimes(1)
    })

    it('removes all items except excluded keys', async () => {
        const indexedDb = createIndexedDB()
        await indexedDb.setItem({ storeName: 'keep', value: 'kept' })
        await indexedDb.setItem({ storeName: 'remove', value: 'removed' })

        await indexedDb.removeItems(['keep'])

        await expect(indexedDb.getItem('keep')).resolves.toEqual({ storeName: 'keep', value: 'kept' })
        await expect(indexedDb.getItem('remove')).resolves.toBeUndefined()
    })

    it('keeps data isolated between named databases', async () => {
        const first = createIndexedDB()
        const second = createIndexedDB()
        await first.setItem({ storeName: 'testStore', value: 'first' })

        await expect(second.getItem('testStore')).resolves.toBeUndefined()
    })

    it('rejects invalid writes instead of hiding transaction errors', async () => {
        const indexedDb = createIndexedDB()

        await expect(indexedDb.setItem('missing-key-path')).rejects.toThrow()
    })

    it('supports autoIncrement object stores', async () => {
        databaseNumber++
        const databaseName = `persist-auto-increment-${databaseNumber}`
        const indexedDb = new IndexedDB(databaseName, databaseName, { autoIncrement: true })

        await indexedDb.setItem('generated-key-value')
        await expect(indexedDb.getItem(1)).resolves.toBe('generated-key-value')
    })
})