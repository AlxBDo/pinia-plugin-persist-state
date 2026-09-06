import { defineStore } from "pinia";
import { ref } from "vue";

const storeOptions = {
    storage: 'sessionStorage',
    persist: true,
    persistedPropertiesToEncrypt: ['myStringEncrypted'],
    watchMutation: true
}

export const useSessionStorageStore = defineStore('sessionStorageStore', () => {
    const myString = ref<string>()
    const myStringEncrypted = ref<string>()

    return {
        myString,
        myStringEncrypted
    }
}, {
    storeOptions
})