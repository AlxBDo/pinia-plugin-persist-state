import { beforeEach } from "vitest"
import { createPinia, setActivePinia } from "pinia"
import { createPluginMock } from "../../testing/mocks/persistStatePlugin"
import { createApp } from "vue"
import { createHydrationPlugin } from "pinia-plugin-subscription"


export function beforeEachPiniaPlugin() {
    beforeEach(createAppAndPinia)
}

export function createAppAndPinia() {
    const app = createApp({})

    const pinia = createPinia().use(
        createHydrationPlugin([
            createPluginMock('localStorage', 'HrN2t2nCr6pTkEy20221l2B3dOcPr4j2')
        ], {
            runtimeEnvironment: 'client'
        })
    )

    app.use(pinia)
    setActivePinia(pinia)
}