import { DefineAugmentedStore } from "pinia-plugin-subscription";
import Crypt from "../services/Crypt";
import Persister from "../services/Persister";


export interface PersistedState {
    isLoading: boolean
}

export interface PersistedStore {
    persistState: () => Promise<void>
    remember: () => Promise<void>
    removePersistedState: () => void
    stateIsEmpty?: () => boolean
    stopWatch: () => void
    watch: () => void
}

export interface PersistedStoreOptions {
    dbName?: string
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