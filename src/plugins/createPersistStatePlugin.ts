import { isEmpty } from "pinia-plugin-subscription";
import Crypt from "../services/Crypt";
import Persister from "../services/Persister";
import PersistPiniaState from "./PersistPiniaState";
import { PluginSubscriberInterface } from "pinia-plugin-subscription";
import { PersistedStore } from "../types";
import { PersistedStoreOptions } from "../types/store";


export function createPersistStatePlugin(dbName?: string, cryptKey?: string): PluginSubscriberInterface {
    PersistPiniaState.pluginOptions = getPluginOptions(dbName, cryptKey)

    return PersistPiniaState;
}

function getPluginOptions(dbName?: string, cryptKey?: string) {
    let persister: Persister | undefined
    let crypt: Crypt | undefined
    const watchedStore: Set<string> = new Set<string>()

    try {
        if (window) {
            if (!isEmpty(dbName) && dbName) {
                persister = new Persister({ name: dbName, keyPath: 'storeName' })
            }

            if (cryptKey) {
                crypt = new Crypt(cryptKey)
            }

            return { persister, crypt, watchedStore }
        }
    } catch (e) { }

    return { persister, crypt, watchedStore }
}

declare module 'pinia' {
    export interface PiniaCustomProperties extends PersistedStore {
    }

    export interface DefineStoreOptionsBase<S, Store> {
        storeOptions?: PersistedStoreOptions
    }
}