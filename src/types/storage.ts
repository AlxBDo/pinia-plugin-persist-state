export interface ClientStorage {
    clear(): void;
    getItem(key: string | number): Promise<StorageItem | undefined>;
    removeItem(key: string | number): void;
    removeItems(excludedItems?: any[]): void;
    setItem(item: StorageItem, keyOrIndex?: string | string[]): void;
}

export type AllowedKeyPath = 'storeName' | 'id'

type StorageItemAllowedTypes = boolean | number | string

export type StorageItemObject = Record<
    number
    | string
    | symbol,
    StorageItemAllowedTypes
    | StorageItemAllowedTypes[]
    | Record<
        number
        | string
        | symbol,
        StorageItemAllowedTypes | StorageItemAllowedTypes[]
    >
>

export type StorageItem = StorageItemAllowedTypes | StorageItemAllowedTypes[] | StorageItemObject