import Crypt from "../services/Crypt";
import Persister from "../services/Persister";
import type { StateTree } from "pinia";


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

export type PersistStorage = 'indexedDB' | 'localStorage' | 'sessionStorage'

export interface PersistStatePluginOptions {
    storage: PersistStorage
    databaseName?: string
    objectStoreName?: string
    cryptKey?: string
}

export interface PersistedCacheOptions {
    maxAge?: number
    onExpired?: 'ignore' | 'remove' | 'restore'
    onVersionMismatch?: 'ignore' | 'remove' | 'restore'
    version?: number
}

export type PersistedStateTransformer = (state: StateTree) => StateTree

export interface PersistedStoreOptions {
    cache?: PersistedCacheOptions
    debounceMs?: number
    excludedKeys?: string[]
    isEncrypted?: boolean
    persist?: boolean
    persistenceKey?: string
    persistedPropertiesToEncrypt?: string[]
    restoreOnHydrate?: boolean
    storage?: PersistStorage
    transformState?: PersistedStateTransformer
    watchMutation?: boolean
}


export type PluginPersistedStoreOptions = {
    crypt?: Crypt,
    persister: Persister
    storageOptions?: PersistStatePluginOptions
    storeOptions: PersistedStoreOptions,
    watchedStore: Set<string>
}