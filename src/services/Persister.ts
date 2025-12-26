import WindowStorage from './WindowStorage'
import { AllowedKeyPath, ClientStorage, StorageItem } from '../types/storage'
import IndexedDB from './IndexedDB'
import { PluginConsole } from '../utils/pluginConsole'

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

    getItem(itemKey: string): Promise<StorageItem | undefined> {
        return new Promise((resolve, reject) => {
            try {
                return this._db.getItem(itemKey).then(item => resolve(item))
            } catch (e) {
                reject(e)
            }
        })
    }

    removeItem(itemKey: string) {
        this._db.removeItem(itemKey)
    }


    setItem(key: string, item: any) {
        console.log('Persister - setItem', [key, item, this._db])
        if (this._db instanceof IndexedDB) {
            try {
                this._db.getItem(key).then(persistedItem => {
                    if (persistedItem) {
                        const db = this._db as IndexedDB
                        db.updateItem(persistedItem)
                    } else {
                        this._db.setItem({ storeName: key, ...item })
                    }
                })
            } catch (e) {
                PluginConsole.error('Persister - setItem Error', e)
                this._db.setItem({ storename: key, ...item })
            }
        } else {
            this._db.setItem(item, key)
        }
    }
}