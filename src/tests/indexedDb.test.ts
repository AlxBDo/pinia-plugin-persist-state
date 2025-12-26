import { describe, expect, it } from 'vitest'

import { IndexedDB } from '../testing/mocks/indexedDb'

describe('Persister using localStorage : persist all types of data', () => {
    const indexedDb = new IndexedDB()

    it('Persist item using number key', async () => {
        const item = 'My string test'
        indexedDb.setItem(item, '2')

        const persistedStr = await indexedDb.getItem(2)

        expect(persistedStr).toStrictEqual(item)
    })

    it('Remove persisted data', async () => {
        const objItem = { key: "my item" }
        indexedDb.setItem(objItem, 'objItem')
        const arrayItem = ['my array']
        indexedDb.setItem(arrayItem, 'arrayItem')

        indexedDb.removeItems(['objItem', 'arrayItem'])

        expect(await indexedDb.getItem(2)).toBeUndefined()
        expect(await indexedDb.getItem('objItem')).toStrictEqual(objItem)
        expect(await indexedDb.getItem('arrayItem')).toStrictEqual(arrayItem)

        indexedDb.removeItems()

        expect(await indexedDb.getItem('objItem')).toBeUndefined()
        expect(await indexedDb.getItem('arrayItem')).toBeUndefined()
    })

    it('Clear database', async () => {
        const objItem = { key: "object item" }
        indexedDb.setItem(objItem, 'objItem')
        const arrayItem = ['array item']
        indexedDb.setItem(arrayItem, 'arrayItem')
        const strItem = 'My string test'
        indexedDb.setItem(strItem, 'strItem')

        indexedDb.clear()

        expect(await indexedDb.getItem('strItem')).toBeUndefined()
        expect(await indexedDb.getItem('objItem')).toBeUndefined()
        expect(await indexedDb.getItem('arrayItem')).toBeUndefined()
    })
})