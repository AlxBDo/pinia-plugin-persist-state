import { ClientStorage, StorageItem } from "../../types/storage";

export class IndexedDB implements ClientStorage {
    private _store: Map<string, any> = new Map();

    public clear(): void {
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

    public removeItem(key: string | number): void {
        this._store.delete(this.keyToString(key));
    }

    public removeItems(excludedItems?: any[]): void {
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

    public setItem(item: any, index: string): void {
        this._store.set(index, item);
    }
}