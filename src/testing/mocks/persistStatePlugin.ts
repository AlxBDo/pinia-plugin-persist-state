import PersistPiniaState from "../../plugins/PersistPiniaState";
import Crypt from "../../services/Crypt";
import PersisterMock from "./persister";

export function createPluginMock(dbName: string, cryptKey?: string) {
    let crypt: Crypt | undefined

    if (cryptKey) {
        crypt = new Crypt(cryptKey)
    }

    // Set pluginOptions on the plugin instance so it will use our mocks
    PersistPiniaState.pluginOptions = {
        persister: new PersisterMock({ name: dbName }),
        crypt,
        watchedStore: new Set<string>()
    }

    // Return the plugin object itself like createPersistStatePlugin does
    return PersistPiniaState
}