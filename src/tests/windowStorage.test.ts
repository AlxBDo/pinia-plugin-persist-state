import { beforeEach, describe, expect, it } from 'vitest'
import WindowStorage from '../services/WindowStorage'

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

describe('WindowStorage service', () => {
    beforeEach(() => {
        if (typeof window === 'undefined') {
            (globalThis as any).window = globalThis
        }
        (globalThis as any).localStorage = new MockStorage();
        (globalThis as any).sessionStorage = new MockStorage();
    })

    it('handles localStorage operations correctly', async () => {
        const storage = new WindowStorage('localStorage')

        const data = { user: 'Alice', age: 30 }
        storage.setItem(data, 'userData')

        const retrieved = await storage.getItem('userData')
        expect(retrieved).toEqual(data)

        const nonExistent = await storage.getItem('unknown')
        expect(nonExistent).toBeUndefined()

        storage.removeItem('userData')
        expect(await storage.getItem('userData')).toBeUndefined()
    })

    it('handles sessionStorage operations correctly', async () => {
        const storage = new WindowStorage('sessionStorage')

        storage.setItem('testValue', 'sessionKey')
        expect(await storage.getItem('sessionKey')).toEqual('testValue')

        storage.clear()
        expect(await storage.getItem('sessionKey')).toBeUndefined()
    })

    it('handles removeItems with and without excluded items', async () => {
        const storage = new WindowStorage('localStorage')

        storage.setItem('value1', 'item1')
        storage.setItem('value2', 'item2')
        storage.setItem('value3', 'item3')

        // Remove item1 and item2, excluding item2
        storage.removeItems(['item2'])

        expect(await storage.getItem('item1')).toBeUndefined()
        expect(await storage.getItem('item2')).toEqual('value2')
        expect(await storage.getItem('item3')).toBeUndefined()

        // Remove all remaining
        storage.removeItems()
        expect(await storage.getItem('item2')).toBeUndefined()
    })
})
