import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createPlugin } from 'pinia-plugin-subscription'
import { createPersistStatePlugin } from './plugins/createPersistStatePlugin'

import './style.css'
import App from './App.vue'

const app = createApp(App)
const pinia = createPinia()

pinia.use(createPlugin([
    createPersistStatePlugin('localStorage', 'hsuHuy_HJzoaizls@uz%jsuy-cdqgRDSH')
], true))

app.use(pinia)

app.use(pinia).mount('#app')