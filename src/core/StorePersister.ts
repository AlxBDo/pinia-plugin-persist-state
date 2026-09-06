import { toRaw } from "vue"
import Crypt from "../services/Crypt"
import Persister from "../services/Persister"
import { AnyObject, Console, CustomConsole, isEmpty, Store } from "pinia-plugin-subscription"

import type { Store as PiniaStore, StateTree, SubscriptionCallbackMutation } from "pinia"
import type { PersistedCacheOptions, PersistedStoreOptions, PluginPersistedStoreOptions } from "../types/store"

type CachedState = {
    metadata: {
        cachedAt: number
        version?: number
    }
    state: StateTree
}

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

const DEFAULT_DEBOUNCE_MS = 200

export default class StorePersister extends Store {
    protected _className: string = 'StorePersister'

    protected _crypt?: Crypt

    private _excludedKeys: Set<string>

    protected _persister?: Persister

    private _propertiesToEncrypt: Set<string>

    private _persistenceVersion = 0

    private _persistTimer?: ReturnType<typeof setTimeout>

    private _writeQueue: Promise<void> = Promise.resolve()

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

        this.debugLog('StorePersister constructor', {
            toBeWatched: this.toBeWatched(), watchedStore, persister, store, options
        })

        if (this.toBeWatched()) {
            this._watchedStore.add(this.store.$id)
            this.storeSubscribe = this.storeSubscription.bind(this)
        }
    }

    override hydrate(): Promise<void> {
        if (typeof window === 'undefined') {
            return Promise.resolve()
        }

        return this.remember()
    }


    augmentStore() {
        const { isEncrypted, persistedPropertiesToEncrypt, watchMutation } = this.options
        if (isEncrypted === undefined) { this.options.isEncrypted = false }
        if (persistedPropertiesToEncrypt === undefined) { this.options.persistedPropertiesToEncrypt = [] }
        if (watchMutation === undefined) { this.options.watchMutation = false }

        if (!this.stateHas('isLoading')) { this.addToState('isLoading', false) }

        // Augment Store
        this.store.persistState = async () => await this.persist()
        this.store.flushPersistedState = async () => await this.flushPersistedState()
        this.store.remember = async () => await this.remember()
        this.store.removePersistedState = this.removePersistedState.bind(this)
        this.store.watch = this.watch.bind(this)
        this.store.stopWatch = this.stopWatch.bind(this)
        this.store.hydrate = this.hydrate.bind(this)
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
        const options = this.getPersistedStoreOptions()
        if (!options.storage || options.storage === options.storageOptions?.storage) {
            this._persister = pluginPersister
            return
        }

        const storageOptions = options.storageOptions
        this._persister = new Persister({
            name: storageOptions?.databaseName ?? options.storage,
            storage: options.storage,
            databaseName: storageOptions?.databaseName,
            objectStoreName: storageOptions?.objectStoreName,
            keyPath: 'storeName'
        })
    }

    private isEncrypted() {
        return this.options.isEncrypted
    }

    private getPropertiesToEncrypt(): string[] {
        return (this.options?.persistedPropertiesToEncrypt ?? []) as string[]
    }

    private getPersistenceKey(): string {
        return this.getPersistedStoreOptions().persistenceKey ?? this.store.$id
    }

    private getCacheOptions(): PersistedCacheOptions | undefined {
        return this.getPersistedStoreOptions().cache
    }

    private getPersistedStoreOptions(): PersistedStoreOptions & Pick<PluginPersistedStoreOptions, 'storageOptions'> {
        return this.options as unknown as PersistedStoreOptions & Pick<PluginPersistedStoreOptions, 'storageOptions'>
    }

    async getPersistedState(decrypt: boolean = true): Promise<StateTree | undefined> {
        const persistenceKey = this.getPersistenceKey()

        try {
            let persistedState = await (this._persister as Persister).getItem(persistenceKey) as StateTree | CachedState
            const cachedState = this.getCachedState(persistedState)

            if (cachedState) {
                if (await this.shouldIgnoreCachedState(cachedState, persistenceKey)) {
                    return undefined
                }
                persistedState = cachedState.state
            }

            if (decrypt && this.toBeCrypted() && persistedState) {
                await this._crypt?.init()
                persistedState = await this.cryptState(persistedState as StateTree, true)
            }

            this.debugLog(`getPersistedState ${persistenceKey}`, { persistedState, state: this.state })

            return persistedState as StateTree | undefined
        } catch (e) {
            this.logError('getPersistedState()', { persistenceKey, e })
        }
    }

    private getCachedState(state: StateTree | CachedState | undefined): CachedState | undefined {
        return this.getCacheOptions() && state && 'state' in state && 'metadata' in state
            ? state as CachedState
            : undefined
    }

    private async shouldIgnoreCachedState(cachedState: CachedState, persistenceKey: string): Promise<boolean> {
        const cache = this.getCacheOptions() as PersistedCacheOptions
        const expired = cache.maxAge !== undefined && cachedState.metadata.cachedAt + cache.maxAge < Date.now()
        const versionMismatch = cache.version !== undefined && cache.version !== cachedState.metadata.version
        const action = expired ? cache.onExpired : versionMismatch ? cache.onVersionMismatch : undefined

        if (!action || action === 'restore') {
            return false
        }
        if (action === 'remove') {
            await (this._persister as Persister).removeItem(persistenceKey)
        }
        return true
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

    private getDebounceMs(): number {
        return Math.max(0, (this.options.debounceMs ?? DEFAULT_DEBOUNCE_MS) as number)
    }

    protected static override hasRequiredKeys(options: AnyObject): boolean {
        return !!options?.persist || !!options?.watchMutation
    }

    private initExcludedKeys(): Set<string> {
        return new Set<string>([
            ...notPersistedProperties,
            ...(this.options.excludedKeys as string[] ?? [])
        ])
    }

    async persist(): Promise<void> {
        const persistenceVersion = ++this._persistenceVersion
        const state = await this.getStateToPersist()

        this.debugLog(`persist() ${this.store.$id} - stateToPersist:`, { state })

        if (!isEmpty(state)) {
            const cache = this.getCacheOptions()
            const stateToPersist: StateTree | CachedState = cache
                ? { state, metadata: { cachedAt: Date.now(), version: cache.version } }
                : state
            const write = this._writeQueue.then(async () => {
                if (persistenceVersion !== this._persistenceVersion) {
                    return
                }

                await (this._persister as Persister).setItem(this.getPersistenceKey(), stateToPersist)
            })

            this._writeQueue = write.catch(() => undefined)
            await write
        }
    }

    propertyShouldBePersisted(property: string): boolean {
        return !this._excludedKeys.has(property)
    }

    private async remember(): Promise<void> {
        this.state.isLoading = true
        return new Promise(async (resolve) => {
            let persistedState = await this.getPersistedState()

            if (persistedState && !isEmpty(persistedState)) {
                this.store.$patch(persistedState)
            }

            this.state.isLoading = false

            return resolve()
        })
    }

    private async removePersistedState(): Promise<void> {
        this.cancelScheduledPersist()
        ++this._persistenceVersion

        const removal = this._writeQueue.then(async () => {
            await (this._persister as Persister).removeItem(this.getPersistenceKey())
        })

        this._writeQueue = removal.catch(() => undefined)
        await removal
    }

    private stopWatch() {
        if (this.options?.watchMutation) {
            // if the base Store has writable options, update it, otherwise update local options
            if (this.options) {
                this.options.watchMutation = false
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
            this.schedulePersist(mutation)
        }
    }

    private cancelScheduledPersist(): void {
        if (this._persistTimer) {
            clearTimeout(this._persistTimer)
            this._persistTimer = undefined
        }
    }

    private schedulePersist(mutation: SubscriptionCallbackMutation<StateTree>): void {
        this.cancelScheduledPersist()

        this._persistTimer = setTimeout(() => {
            this._persistTimer = undefined
            this.persist()
                .then(() => this.store.mutationCallback?.(this.state, mutation))
                .catch((error: unknown) => this.logError('persist()', { error, storeName: this.store.$id }))
        }, this.getDebounceMs())
    }

    private async flushPersistedState(): Promise<void> {
        this.cancelScheduledPersist()
        await this.persist()
    }

    toBeCrypted(): boolean {
        return !!(this._crypt && this.getPropertiesToEncrypt())
    }

    toBeWatched(): boolean {
        return !this._watchedStore.has(this.store.$id)
    }

    private watch(): void {
        if (this.toBeWatched()) {
            if (this.options) {
                this.options.watchMutation = true
            }
            this.storeSubscribe = this.storeSubscription.bind(this)
        }
    }
}