export interface ClientStorage {
    clear(): Promise<void>;
    getItem(key: string | number): Promise<StorageItem | undefined>;
    removeItem(key: string | number): Promise<void>;
    removeItems(excludedItems?: any[]): Promise<void>;
    setItem(item: StorageItem, keyOrIndex?: string | string[]): Promise<void>;
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