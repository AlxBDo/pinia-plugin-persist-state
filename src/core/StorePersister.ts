import { toRaw } from "vue"
import Crypt from "../services/Crypt"
import Persister from "../services/Persister"
import { AnyObject, Console, CustomConsole, isEmpty, Store } from "pinia-plugin-subscription"

import type { Store as PiniaStore, StateTree, SubscriptionCallbackMutation } from "pinia"
import type { PluginPersistedStoreOptions } from "../types/store"

const notPersistedProperties: string[] = [
    '@context',
    'activeLink',
    'computed',
    'dep',
    'excludedKeys',
    'fn',
    'isEncrypted',
    'isLoading',
    'subs',
    'version'
]


export default class StorePersister extends Store {
    protected _className: string = 'StorePersister'

    protected _crypt?: Crypt

    private _excludedKeys: Set<string>

    protected _persister?: Persister

    private _propertiesToEncrypt: Set<string>

    private _watchedStore: Set<string>


    constructor(
        store: PiniaStore,
        options: PluginPersistedStoreOptions,
        debug: boolean,
        console?: CustomConsole
    ) {
        super(store, options, debug, console)
        const { crypt, persister, watchedStore } = options

        this._excludedKeys = this.initExcludedKeys()
        this.definePersister(persister)
        this._propertiesToEncrypt = new Set<string>(this.getPropertiesToEncrypt())
        this._watchedStore = watchedStore

        if (crypt) {
            this._crypt = crypt
            if (this.options) { this.options.isEncrypted = false }
        }

        this.augmentStore()
        this.remember()

        this.debugLog('StorePersister constructor', {
            toBeWatched: this.toBeWatched(), watchedStore, persister, store, options
        })

        if (this.toBeWatched()) {
            this._watchedStore.add(this.store.$id)
            this.storeSubscribe = this.storeSubscription.bind(this)
        }
    }


    augmentStore() {
        const { isEncrypted, persistedPropertiesToEncrypt, watchMutation } = this.options
        if (isEncrypted === undefined) { this.options.isEncrypted = false }
        if (persistedPropertiesToEncrypt === undefined) { this.options.persistedPropertiesToEncrypt = [] }
        if (watchMutation === undefined) { this.options.watchMutation = false }

        if (!this.stateHas('isLoading')) { this.addToState('isLoading', false) }

        // Augment Store
        this.store.persistState = async () => await this.persist()
        this.store.remember = async () => await this.remember()
        this.store.removePersistedState = this.removePersistedState.bind(this)
        this.store.watch = this.watch
        this.store.stopWatch = this.stopWatch
    }

    private async cryptProperty(crypt: Crypt, value: string, decrypt: boolean = false): Promise<string> {
        if (decrypt) {
            return await crypt.decrypt(value)
        } else {
            return await crypt.encrypt(value)
        }
    }

    async cryptState(state: StateTree, decrypt: boolean = false): Promise<StateTree> {
        return await new Promise(async (resolve) => {
            const Crypt = this._crypt as Crypt
            const persistedPropertiesToEncrypt = this.getPropertiesToEncrypt()
            const isEncrypted = this.isEncrypted()

            this.debugLog(`cryptState - ${this.store.$id} ${decrypt ? 'decrypt' : 'crypt'}`, {
                can: this._propertiesToEncrypt.size > 0 && isEncrypted === decrypt && !!Crypt,
                Crypt,
                state
            })

            if (this._propertiesToEncrypt.size > 0 && Crypt) {
                const encryptedState = {} as StateTree

                for (const property of persistedPropertiesToEncrypt) {
                    const value = this.getValue(state[property])

                    if (value) {
                        encryptedState[property] = await this.cryptProperty(Crypt, value, decrypt)
                    }
                }

                this.debugLog(`cryptState - ${this.store.$id}`, { encryptedState })

                if (!isEmpty(encryptedState)) {
                    state = { ...state, ...encryptedState }

                    if (this.options) {
                        this.options.isEncrypted = !decrypt
                    }
                }
            }

            resolve(state)
        })
    }

    static override customizeStore<Instance extends Store>(store: PiniaStore, options: AnyObject, debug: boolean, console?: Console): Instance | undefined {
        if (!options.storeOptions?.persist && options.storeOptions?.watchMutation) {
            options.storeOptions.persist = true
        }

        return super.customizeStore<Instance>(store, options, debug, console)
    }

    private definePersister(pluginPersister: Persister) {
        this._persister = this.options.dbName
            ? new Persister({ name: this.options.dbName as string, keyPath: 'storeName' })
            : pluginPersister
    }

    private isEncrypted() {
        return this.options.isEncrypted
    }

    private getPropertiesToEncrypt(): string[] {
        return (this.options?.persistedPropertiesToEncrypt ?? []) as string[]
    }

    async getPersistedState(decrypt: boolean = true): Promise<StateTree | undefined> {
        const storeName = this.store.$id

        try {
            let persistedState = await (this._persister as Persister).getItem(storeName) as StateTree

            if (decrypt && this.toBeCrypted() && persistedState) {
                await this._crypt?.init()
                persistedState = await this.cryptState(persistedState, true)
            }

            this.debugLog(`getPersistedState ${storeName}`, { persistedState, state: this.state })

            return persistedState
        } catch (e) {
            this.logError('getPersistedState()', { storeName, e })
        }
    }

    private async getStateToPersist() {
        const excludedKeys = this._excludedKeys
        const state = this.state
        const hasPropertiesToEncrypt = this._propertiesToEncrypt.size > 0
        const crypt = this._crypt as Crypt

        if (hasPropertiesToEncrypt) {
            await crypt.init()
        }

        const newState = {} as StateTree

        for (const key of Object.keys(state)) {
            if (!this.hasDeniedFirstChar(key[0]) && !excludedKeys.has(key)) {

                const stateValue = state[key]

                if (!isEmpty(stateValue)) {
                    if (hasPropertiesToEncrypt && this._propertiesToEncrypt.has(key)) {
                        newState[key] = await this.cryptProperty(crypt, stateValue, false)
                    } else {
                        newState[key] = toRaw(stateValue)
                    }
                }
            }

        }

        return newState
    }

    private getWatchMutation() {
        return this.options.watchMutation
    }

    private initExcludedKeys(): Set<string> {
        return new Set<string>([
            ...notPersistedProperties,
            ...(this.options.excludedKeys as string[] ?? [])
        ])
    }

    async persist() {
        const state = await this.getStateToPersist()

        this.debugLog(`persist() ${this.store.$id} - stateToPersist:`, { state })

        if (!isEmpty(state)) {
            (this._persister as Persister).setItem(this.store.$id, state)
        }
    }

    propertyShouldBePersisted(property: string): boolean {
        return !this._excludedKeys.has(property)
    }

    private async remember() {
        this.state.isLoading = true
        return new Promise(async (resolve) => {
            let persistedState = await this.getPersistedState()

            if (persistedState && !isEmpty(persistedState)) {
                this.store.$patch(persistedState)
            }

            this.state.isLoading = false

            return resolve(true)
        })
    }

    private removePersistedState() {
        (this._persister as Persister).removeItem(this.store.$id)
    }

    private stopWatch() {
        if (this.options?.watchMutation) {
            // if the base Store has writable options, update it, otherwise update local options
            if ((this as any).options) {
                (this as any).options.watchMutation = false
            }
            this._watchedStore.delete(this.store.$id)
        }
    }

    private storeSubscription(mutation: SubscriptionCallbackMutation<StateTree>): void {
        this.debugLog(`store.storeSubscription() ${this.store.$id}`, [
            'mutation type !== patch object: ', mutation.type !== 'patch object',
            'watchMutation: ', this.getWatchMutation(),
            'mutation:', mutation,
            'state:', this.state,
            'store:', this.store
        ])

        if (mutation.type !== 'patch object' && this.getWatchMutation()) {
            this.persist().then(() => {
                if (this.store.mutationCallback) {
                    this.store.mutationCallback(this.state, mutation)
                }
            })
        }
    }

    toBeCrypted(): boolean {
        return !!(this._crypt && this.getPropertiesToEncrypt())
    }

    toBeWatched(): boolean {
        return !this._watchedStore.has(this.store.$id)
    }

    private watch(): void {
        if (this.toBeWatched()) {
            if ((this as any).options) {
                (this as any).options.watchMutation = true
            }
            this.storeSubscribe = this.storeSubscription.bind(this)
        }
    }
}