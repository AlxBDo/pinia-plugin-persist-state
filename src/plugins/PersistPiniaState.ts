import StorePersister from "../core/StorePersister";
import { PluginSubscriber } from "pinia-plugin-subscription";
import type { PluginSubscriberInterface } from "pinia-plugin-subscription";
import { PluginConsole } from "../utils/pluginConsole";
import { pluginName } from "../utils/constantes";


class PeristPiniaState extends PluginSubscriber<StorePersister> implements PluginSubscriberInterface {
    constructor() {
        super(
            pluginName,
            StorePersister.customizeStore.bind(StorePersister),
            PluginConsole
        )
    }
}

export default new PeristPiniaState();