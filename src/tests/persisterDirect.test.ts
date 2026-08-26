import { beforeEach, describe, expect, it, vi } from 'vitest'
import Persister from '../services/Persister'

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

describe('Persister service direct unit tests', () => {
    beforeEach(() => {
        if (typeof window === 'undefined') {
            (globalThis as any).window = globalThis
        }
        (globalThis as any).localStorage = new MockStorage();
        (globalThis as any).sessionStorage = new MockStorage();
    })

    it('throws error when dbOptions is omitted', () => {
        // @ts-ignore
        expect(() => new Persister()).toThrowError('DbOptions is required')
    })

    it('works with localStorage', async () => {
        const persister = new Persister({ name: 'localStorage' })
        expect(persister.dbName).toBe('localStorage')

        persister.setItem('myKey', { test: 123 })
        const val = await persister.getItem('myKey')
        expect(val).toEqual({ test: 123 })

        persister.removeItem('myKey')
        expect(await persister.getItem('myKey')).toBeUndefined()
    })

    it('works with sessionStorage', async () => {
        const persister = new Persister({ name: 'sessionStorage' })
        expect(persister.dbName).toBe('sessionStorage')

        persister.setItem('sessKey', 'hello')
        expect(await persister.getItem('sessKey')).toEqual('hello')
    })

    it('instantiates IndexedDB for non-window storage names', () => {
        const persister = new Persister({ name: 'indexedDB', keyPath: 'id' })
        expect(persister.dbName).toBe('indexedDB')
    })

    it('handles IndexedDB setItem branches', async () => {
        const persister = new Persister({ name: 'indexedDB' })

        // Mock IndexedDB getItem and setItem / updateItem on _db
        const mockGetItem = vi.spyOn((persister as any)._db, 'getItem')
        const mockSetItem = vi.spyOn((persister as any)._db, 'setItem').mockImplementation(() => { })
        const mockUpdateItem = vi.spyOn((persister as any)._db, 'updateItem').mockImplementation(() => { })

        // Case 1: Item already exists in IndexedDB -> calls updateItem
        mockGetItem.mockResolvedValueOnce({ storeName: 'testStore', data: 'existing' })
        persister.setItem('testStore', { data: 'newVal' })

        await new Promise((resolve) => setTimeout(resolve, 20))
        expect(mockUpdateItem).toHaveBeenCalledWith({ storeName: 'testStore', data: 'existing' })

        // Case 2: Item does NOT exist in IndexedDB -> calls setItem with { storeName, ...item }
        mockGetItem.mockResolvedValueOnce(undefined)
        persister.setItem('testStore2', { data: 'freshVal' })

        await new Promise((resolve) => setTimeout(resolve, 20))
        expect(mockSetItem).toHaveBeenCalledWith({ storeName: 'testStore2', data: 'freshVal' })

        // Case 3: getItem throws error -> catch block calls setItem with { storename, ...item }
        mockGetItem.mockImplementationOnce(() => { throw new Error('IndexedDB error') })
        persister.setItem('testStore3', { data: 'errVal' })

        await new Promise((resolve) => setTimeout(resolve, 20))
        expect(mockSetItem).toHaveBeenCalledWith({ storename: 'testStore3', data: 'errVal' })
    })
})
