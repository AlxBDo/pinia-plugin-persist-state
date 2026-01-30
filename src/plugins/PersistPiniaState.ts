import StorePersister from "../core/StorePersister";
import { PluginSubscriber } from "pinia-plugin-subscription";
import type { PluginSubscriberInterface, Store } from "pinia-plugin-subscription";
import { PluginConsole } from "../utils/pluginConsole";
import { pluginName } from "../utils/constantes";
import { PersistedStore } from "../types/store";


class PeristPiniaState extends PluginSubscriber<StorePersister> implements PluginSubscriberInterface {
    protected override _resetStoreCallback = (store?: Store) => {
        const { removePersistedState } = store as PersistedStore & Store;
        if (typeof removePersistedState === 'function') {
            removePersistedState()
        }
    }

    constructor() {
        super(
            pluginName,
            StorePersister.customizeStore.bind(StorePersister),
            PluginConsole
        )
    }
}

export default new PeristPiniaState();