import { defineStore } from "pinia";
import { ref } from "vue";

const storeOptions = {
    persist: true,
    persistedPropertiesToEncrypt: ['myStringEncrypted'],
    watchMutation: true
}

export const useTestStore = defineStore('testStore', () => {
    const myString = ref<string>('Hello World')
    const myStringEncrypted = ref<string>('Sensitive Data')

    return {
        myString,
        myStringEncrypted
    }
}, {
    storeOptions
})