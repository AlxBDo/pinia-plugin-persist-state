import type { ClientStorage, StorageItem } from "../types/storage"

const DEFAULT_OBJECT_STORE_NAME = 'persistedState'

type IndexedDBOptions = {
    keyPath?: string
    objectStoreName?: string
}

type ObjectItemKey = string | number

export default class IndexedDB implements ClientStorage {
    private _database?: IDBDatabase
    private _databasePromise?: Promise<IDBDatabase>
    private _keyPath?: string
    private _objectStoreName: string

    constructor(
        private _databaseName: string,
        options: IndexedDBOptions = {}
    ) {
        this._keyPath = options.keyPath
        this._objectStoreName = options.objectStoreName ?? DEFAULT_OBJECT_STORE_NAME
    }

    public async clear(): Promise<void> {
        await this.runTransaction('readwrite', (store) => store.clear())
    }

    public async getItem(key: ObjectItemKey): Promise<StorageItem | undefined> {
        return this.runTransaction('readonly', (store) => store.get(key)) as Promise<StorageItem | undefined>
    }

    public async getObjectStoreItem(indexName: string, indexValue: ObjectItemKey): Promise<object | undefined> {
        return this.runTransaction('readonly', (store) => store.index(indexName).get(indexValue)) as Promise<object | undefined>
    }

    public async removeItem(key: ObjectItemKey): Promise<void> {
        await this.runTransaction('readwrite', (store) => store.delete(key))
    }

    public async removeItems(excludedItems?: ObjectItemKey[]): Promise<void> {
        const keys = await this.runTransaction('readonly', (store) => store.getAllKeys())
        await Promise.all(
            keys
                .filter((key) => !excludedItems?.includes(key as ObjectItemKey))
                .map((key) => this.removeItem(key as ObjectItemKey))
        )
    }

    public async setItem(item: StorageItem, key?: string): Promise<void> {
        await this.runTransaction('readwrite', (store) =>
            this._keyPath ? store.put(item) : store.put(item, key)
        )
    }

    private async getDatabase(): Promise<IDBDatabase> {
        if (!this._databasePromise) {
            this._databasePromise = this.openDatabase()
        }

        return this._databasePromise
    }

    private openDatabase(version?: number): Promise<IDBDatabase> {
        return new Promise((resolve, reject) => {
            const request = version === undefined
                ? globalThis.indexedDB.open(this._databaseName)
                : globalThis.indexedDB.open(this._databaseName, version)

            request.onerror = () => reject(request.error)
            request.onupgradeneeded = () => {
                if (!request.result.objectStoreNames.contains(this._objectStoreName)) {
                    request.result.createObjectStore(this._objectStoreName, { keyPath: this._keyPath })
                }
            }
            request.onsuccess = () => {
                const database = request.result
                database.onversionchange = () => {
                    database.close()
                    if (this._database === database) {
                        this._database = undefined
                        this._databasePromise = undefined
                    }
                }

                if (database.objectStoreNames.contains(this._objectStoreName)) {
                    this._database = database
                    resolve(database)
                    return
                }

                database.close()
                this.openDatabase(database.version + 1).then(resolve, reject)
            }
        })
    }

    private async runTransaction<T>(
        mode: IDBTransactionMode,
        operation: (store: IDBObjectStore) => IDBRequest<T>
    ): Promise<T> {
        const database = await this.getDatabase()

        return new Promise<T>((resolve, reject) => {
            const transaction = database.transaction(this._objectStoreName, mode)
            const request = operation(transaction.objectStore(this._objectStoreName))
            let result: T

            request.onerror = () => reject(request.error)
            request.onsuccess = () => {
                result = request.result
            }
            transaction.onabort = () => reject(transaction.error)
            transaction.onerror = () => reject(transaction.error)
            transaction.oncomplete = () => resolve(result!)
        })
    }
}
