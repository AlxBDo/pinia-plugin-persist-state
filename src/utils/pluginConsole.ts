import { CustomConsole } from "pinia-plugin-subscription"
import { pluginName } from './constantes'


class PluginConsoleClass extends CustomConsole {
    protected _pluginName = pluginName
}

export const PluginConsole = new PluginConsoleClass()