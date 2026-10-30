import { ParentStore } from "pinia-plugin-extending-store"
import {
    useContactInformationStore,
    useErrorsStore,
    useIdentityStore,
    useResourceIdStore
} from "pinia-plugin-extending-store/stores"
import { defineAStoreCtx, getEnhancedStore } from "pinia-plugin-subscription";
import { computed, ref } from "vue";

import type {
    ContactInformationState,
    ContactInformationStore,
    ErrorsState,
    ErrorsStore,
    IdentityState,
    IdentityStore,
    ResourceIdStore,
    ResourceId
} from "pinia-plugin-extending-store"


export interface ContactStore extends ContactInformationStore, ErrorsStore, Omit<IdentityStore, 'setData'>, Omit<ResourceIdStore, 'setData'> {
    setData(data: Partial<ContactState>, strictValidation?: boolean): void
}

export interface ContactState extends ContactInformationState, ErrorsState, IdentityState, ResourceId {
}


export const useContactStore = (id?: string) => defineAStoreCtx<ContactStore, ContactState>(
    id ?? 'contact',
    (ctx) => {
        const contact = computed(() => {
            const store = getStore()

            return {
                '@id': store['@id'],
                id: store.id,
                email: store.email,
                firstname: store.firstname,
                lastname: store.lastname
            }
        })

        function getStore() {
            return getEnhancedStore<ContactStore & ContactState>(ctx)
        }

        function setData(data: ContactState, strictValidation: boolean = true) {
            if (data.email) {
                getStore().email = data.email;
            } else if (strictValidation) {
                getStore().addError({ id: id + '-email', message: 'Email is required' })
            }
        }

        return {
            contact,
            setData
        }
    },
    {
        actionsToExtends: ['setData'],
        parentsStores: [
            new ParentStore(id + '-contact-information', useContactInformationStore),
            new ParentStore(id + '-errors', useErrorsStore),
            new ParentStore(id + '-identity', useIdentityStore),
            new ParentStore(id + '-resource-id', useResourceIdStore)
        ],
        persistedPropertiesToEncrypt: ['contactInformations'],
        watchMutation: true
    }
)()