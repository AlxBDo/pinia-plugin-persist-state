import WindowStorage from './WindowStorage'
import { AllowedKeyPath, ClientStorage, StorageItem } from '../types/storage'
import IndexedDB from './IndexedDB'

export type DbOptions = {
    keyPath?: AllowedKeyPath
    name: string
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
        const { keyPath, name } = this._db_options

        if (name === 'localStorage' || name === 'sessionStorage') {
            return new WindowStorage(name)
        }

        return new IndexedDB(name, { keyPath })
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