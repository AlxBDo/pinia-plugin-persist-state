import { ClientStorage, StorageItem } from "../../types/storage";

export class IndexedDB implements ClientStorage {
    private _store: Map<string, any> = new Map();

    public async clear(): Promise<void> {
        this._store.clear();
    }

    private keyToString(key: string | number): string {
        if (typeof key === 'number') {
            return key.toString()
        }

        return key
    }

    public async getItem(key: string | number): Promise<StorageItem | undefined> {
        return this._store.get(this.keyToString(key));
    }

    public async removeItem(key: string | number): Promise<void> {
        this._store.delete(this.keyToString(key));
    }

    public async removeItems(excludedItems?: any[]): Promise<void> {
        if (excludedItems) {
            for (const key of this._store.keys()) {
                if (!excludedItems.includes(key)) {
                    this._store.delete(key);
                }
            }
        } else {
            this._store.clear();
        }
    }

    public async setItem(item: any, index: string): Promise<void> {
        this._store.set(index, item);
    }
}