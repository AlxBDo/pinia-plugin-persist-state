import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createPlugin } from 'pinia-plugin-subscription'
import { createTracerRegistry } from 'pinia-plugin-subscription/helpers'
import { ExtendsPiniaStore } from 'pinia-plugin-extending-store'
import { createPersistStatePlugin } from './plugins/createPersistStatePlugin'

import './style.css'
import App from './App.vue'

const app = createApp(App)
const pinia = createPinia()
const tracerRegistry = createTracerRegistry()

pinia.use(createPlugin([
    ExtendsPiniaStore,
    createPersistStatePlugin('localStorage', 'hsuHuy_HJzoaizls@uz%jsuy-cdqgRDSH')
], { tracerHandler: tracerRegistry.tracerHandler }))

tracerRegistry.addScopesListener(['my-contact-store', 'sessionStorageStore', 'testStore'])

app.use(pinia)

app.use(pinia).mount('#app')