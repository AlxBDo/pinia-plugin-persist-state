import type { PluginSubscriberInterface } from "pinia-plugin-subscription";
import type { PersistStatePluginOptions } from "./store";

export type {
    PersistedCacheOptions,
    PersistedStore,
    PersistedStoreOptions,
    PersistedStateTransformer,
    PersistStatePluginOptions,
    PersistStorage,
    PluginPersistedStoreOptions,
} from "./store";

export declare const PLUGIN_NAME: string

export declare const PeristPiniaState: PluginSubscriberInterface

export declare function createPersistStatePlugin(options: PersistStatePluginOptions): PluginSubscriberInterface
export declare function createPersistStatePlugin(storageOrDatabaseName?: string, cryptKey?: string): PluginSubscriberInterface

export declare function createPluginMock(dbName: string, cryptKey?: string): PluginSubscriberInterface