import { nextTick } from "vue";
import StorePersister from "../core/StorePersister";
import { PluginSubscriber } from "pinia-plugin-subscription";
import type { PluginSubscriberInterface } from "pinia-plugin-subscription";
import { PluginConsole } from "../utils/pluginConsole";
import { pluginName } from "../utils/constantes";
import { PersistedStore } from "../types/store";
import type { Store } from "pinia";


class PeristPiniaState extends PluginSubscriber<StorePersister> {
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

        this.execution = {
            environment: 'client',
            hydration: 'immediate',
        }

        this.hydrationScheduler = (run) => {
            nextTick(() => run())
        }
    }

    override hydrate() {
        if (typeof window === 'undefined') {
            return
        }

        this.hydrationScheduler?.(() => {
            const hydration = this.storeInstance?.hydrate?.()
            if (hydration && typeof (hydration as Promise<void>).catch === 'function') {
                ; (hydration as Promise<void>).catch((e: unknown) => PluginConsole.error('PersistPiniaState hydration error', e))
            }
        })
    }
}

export default new PeristPiniaState();