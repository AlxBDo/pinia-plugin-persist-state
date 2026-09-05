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

    it('writes IndexedDB items atomically', async () => {
        const persister = new Persister({ name: 'indexedDB' })

        const mockSetItem = vi.spyOn((persister as any)._db, 'setItem').mockResolvedValue(undefined)

        await persister.setItem('testStore', { data: 'newVal' })
        await persister.setItem('testStore', { data: 'newerVal' })

        expect(mockSetItem).toHaveBeenNthCalledWith(1, { storeName: 'testStore', data: 'newVal' })
        expect(mockSetItem).toHaveBeenNthCalledWith(2, { storeName: 'testStore', data: 'newerVal' })
    })

    it('propagates IndexedDB write errors', async () => {
        const persister = new Persister({ name: 'indexedDB' })
        const error = new Error('IndexedDB error')
        vi.spyOn((persister as any)._db, 'setItem').mockRejectedValue(error)

        await expect(persister.setItem('testStore', { data: 'newVal' })).rejects.toThrow(error)
    })
})
