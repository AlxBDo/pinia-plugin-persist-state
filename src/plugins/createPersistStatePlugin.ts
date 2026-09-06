import { isEmpty } from "pinia-plugin-subscription";
import Crypt from "../services/Crypt";
import Persister from "../services/Persister";
import PersistPiniaState from "./PersistPiniaState";
import { PluginSubscriberInterface } from "pinia-plugin-subscription";
import { PersistedStore } from "../types";
import { PersistedStoreOptions, PersistStatePluginOptions, PersistStorage } from "../types/store";

const WINDOW_STORAGES: PersistStorage[] = ['localStorage', 'sessionStorage']

export function createPersistStatePlugin(options: PersistStatePluginOptions): PluginSubscriberInterface
export function createPersistStatePlugin(storageOrDatabaseName?: string, cryptKey?: string): PluginSubscriberInterface
export function createPersistStatePlugin(
    optionsOrStorage?: PersistStatePluginOptions | string,
    legacyCryptKey?: string
): PluginSubscriberInterface {
    const options = normalizePluginOptions(optionsOrStorage, legacyCryptKey)
    PersistPiniaState.pluginOptions = getPluginOptions(options)

    return PersistPiniaState;
}

function normalizePluginOptions(
    optionsOrStorage?: PersistStatePluginOptions | string,
    cryptKey?: string
): PersistStatePluginOptions | undefined {
    if (typeof optionsOrStorage !== 'string') {
        return optionsOrStorage
    }

    if (WINDOW_STORAGES.includes(optionsOrStorage as PersistStorage)) {
        return { storage: optionsOrStorage as PersistStorage, cryptKey }
    }

    return {
        storage: 'indexedDB',
        databaseName: optionsOrStorage,
        objectStoreName: 'persistedStore',
        cryptKey
    }
}

function getPluginOptions(options?: PersistStatePluginOptions) {
    let persister: Persister | undefined
    let crypt: Crypt | undefined
    const watchedStore: Set<string> = new Set<string>()

    try {
        if (typeof window !== 'undefined') {
            if (options && !isEmpty(options.storage)) {
                persister = new Persister({
                    name: options.databaseName ?? options.storage,
                    storage: options.storage,
                    databaseName: options.databaseName,
                    objectStoreName: options.objectStoreName,
                    keyPath: 'storeName'
                })
            }

            if (options?.cryptKey) {
                crypt = new Crypt(options.cryptKey)
            }

            return { persister, crypt, storageOptions: options, watchedStore }
        }
    } catch (e) { }

    return { persister, crypt, storageOptions: options, watchedStore }
}

declare module 'pinia' {
    export interface PiniaCustomProperties extends PersistedStore {
    }

    export interface DefineStoreOptionsBase<S, Store> {
        storeOptions?: PersistedStoreOptions
    }
}