import WindowStorage from './WindowStorage'
import { AllowedKeyPath, ClientStorage, StorageItem } from '../types/storage'
import type { PersistStorage } from '../types/store'
import IndexedDB from './IndexedDB'

export type DbOptions = {
    databaseName?: string
    keyPath?: AllowedKeyPath
    name: string
    objectStoreName?: string
    storage?: PersistStorage
}

export default class Persister {
    private _db: ClientStorage
    private _db_options: DbOptions

    get dbName(): string {
        return this._db_options.name
    }

    constructor(dbOptions: DbOptions) {
        if (!dbOptions) {
            throw new Error('DbOptions is required')
        }

        this._db_options = dbOptions
        this._db = this.defineDb()
    }

    defineDb(): ClientStorage {
        const { databaseName, keyPath, name, objectStoreName, storage } = this._db_options
        const storageName = storage ?? (name === 'localStorage' || name === 'sessionStorage' ? name : 'indexedDB')

        if (storageName === 'localStorage' || storageName === 'sessionStorage') {
            return new WindowStorage(storageName)
        }

        return new IndexedDB(databaseName ?? name, objectStoreName ?? 'persistedStore', { keyPath })
    }

    async getItem(itemKey: string): Promise<StorageItem | undefined> {
        return this._db.getItem(itemKey)
    }

    async removeItem(itemKey: string): Promise<void> {
        await this._db.removeItem(itemKey)
    }

    async setItem(key: string, item: StorageItem): Promise<void> {
        if (this._db instanceof IndexedDB) {
            await this._db.setItem({ storeName: key, ...(item as object) })
        } else {
            await this._db.setItem(item, key)
        }
    }
}