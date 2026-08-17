import type { PluginSubscriberInterface } from "pinia-plugin-subscription";

export type {
    PersistedStore,
    PersistedStoreOptions,
    PluginPersistedStoreOptions,
} from "./store";

export declare const PLUGIN_NAME: string

export declare const PeristPiniaState: PluginSubscriberInterface

export declare function createPersistStatePlugin(dbName?: string, cryptKey?: string): PluginSubscriberInterface

export declare function createPluginMock(dbName: string, cryptKey?: string): PluginSubscriberInterface