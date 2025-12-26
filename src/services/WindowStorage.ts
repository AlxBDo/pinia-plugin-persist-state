import { ClientStorage, StorageItem } from "../types/storage";


export default class WindowStorage implements ClientStorage {
    private _storage: Storage;

    constructor(storageType: "localStorage" | "sessionStorage") {
        this._storage = storageType === "localStorage" ? localStorage : sessionStorage;
    }

    public clear(): void {
        this._storage.clear();
    }

    public async getItem(key: string | number): Promise<StorageItem> {
        return new Promise((resolve, reject) => {
            const item = this._storage.getItem(key.toString())

            resolve(item ? JSON.parse(item) : undefined)
        })
    }

    public removeItem(key: string | number): void {
        this._storage.removeItem(key.toString());
    }

    public removeItems(excludedItems?: any[]): void {
        for (let i = 0; i < this._storage.length; i++) {
            const key = this._storage.key(i);
            if (key && (!excludedItems || !excludedItems.includes(key))) {
                this._storage.removeItem(key);
            }
        }
    }

    public setItem(item: StorageItem, key: string): void {
        this._storage.setItem(key, JSON.stringify(item));
    }
}