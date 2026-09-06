import { Ref } from "vue";
import { AnyObject } from "../..";
import { ClientStorage } from "../../types/storage";

let store: AnyObject = {}

export const localStorageMock: ClientStorage = {
    clear: async () => { store = {} },
    getItem: async (key: string) => {
        return new Promise((resolve) => {
            return resolve(store[key])
        })
    },
    removeItem: async (key: string) => { delete store[key] },
    removeItems: async (excludedItems?: any[]) => {
        excludedItems ? excludedItems.forEach((key) => delete store[key]) : (store = {})
    },
    setItem: async (value: string, key: string) => {
        store[key] = value
    },
}