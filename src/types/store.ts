import Crypt from "../services/Crypt";
import Persister from "../services/Persister";


export interface PersistedState {
    isLoading: boolean
}

export interface PersistedStore {
    persistState: () => Promise<void>
    flushPersistedState: () => Promise<void>
    remember: () => Promise<void>
    removePersistedState: () => Promise<void>
    stateIsEmpty?: () => boolean
    stopWatch: () => void
    watch: () => void
}

export interface PersistedStoreOptions {
    dbName?: string
    debounceMs?: number
    excludedKeys?: string[]
    isEncrypted?: boolean
    persist?: boolean
    persistedPropertiesToEncrypt?: string[]
    watchMutation?: boolean
}


export type PluginPersistedStoreOptions = {
    crypt?: Crypt,
    persister: Persister
    storeOptions: PersistedStoreOptions,
    watchedStore: Set<string>
}