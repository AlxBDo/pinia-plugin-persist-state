# Persist Pinia State Plugin

A small Pinia plugin that adds persistence and optional encryption to your Pinia stores. It integrates with browser storage (localStorage or sessionStorage) or IndexedDB and augments stores with convenient methods to persist, restore and control watching behavior.

---

## Features

- Persist store state to LocalStorage, SessionStorage or IndexedDB
- Selective encryption for specific properties using Web Crypto (AES-GCM)
- Per-store options via `storeOptions` when defining a store
- Augmented store API: `persistState`, `remember`, `removePersistedState`, `watch`, `stopWatch`
- Explicit configuration of the persistence backend and IndexedDB storage
- SSR-safe hydration flow: methods are injected immediately on client, persistence restore is executed during hydration lifecycle

---

## Installation

Install the package (example):

```bash
npm install --save pinia-plugin-persist-state
```

Then register the plugin with Pinia in your app entry (see `src/main.ts`):

```ts
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createPlugin } from 'pinia-plugin-subscription'
import { createPersistStatePlugin, PLUGIN_NAME } from 'pinia-plugin-persist-state'

const app = createApp(App)
const pinia = createPinia()

pinia.use(createPlugin([
  createPersistStatePlugin({
    storage: 'indexedDB',
    databaseName: 'my-application',
    objectStoreName: 'persistedStore',
    cryptKey: 'my-secret-key'
  })
]))

app.use(pinia)
```

For Nuxt/SSR projects, prefer `createHydrationPlugin` from `pinia-plugin-subscription` when you need runtime overrides:

```ts
import { createHydrationPlugin } from 'pinia-plugin-subscription'
import { createPersistStatePlugin } from 'pinia-plugin-persist-state'

pinia.use(createHydrationPlugin([
  createPersistStatePlugin({ storage: 'localStorage', cryptKey: 'my-secret-key' })
], {
  runtimeEnvironment: import.meta.client ? 'client' : 'server'
}))
```

---

## Usage

When defining a store you can pass `storeOptions` (type: `PersistedStoreOptions`) as part of the `defineStore` options. Example in `src/stores/test.ts`:

```ts
// -- using defineAStore

export const useTestStore = defineAStore('testStore', () => {
  const myString = ref('Hello World')
  const myStringEncrypted = ref('Sensitive Data')

  return { myString, myStringEncrypted }
}, {
  persistedPropertiesToEncrypt: ['myStringEncrypted'],
  watchMutation: true
})

// -- or using defineStore

const storeOptions = {
  persistedPropertiesToEncrypt: ['myStringEncrypted'],
  watchMutation: true
}

export const useTestStore = defineStore('testStore', () => {
  const myString = ref('Hello World')
  const myStringEncrypted = ref('Sensitive Data')

  return { myString, myStringEncrypted }
}, { storeOptions })
```

If `persist` or `watchMutation` are `true` the plugin will attempt to persist the store state using the configured persister: localStorage, sessionStorage or IndexedDB.

`createPersistStatePlugin(storageOrDatabaseName?, cryptKey?)` remains supported for compatibility. A value of `'localStorage'` or `'sessionStorage'` selects that storage; any other string is interpreted as an IndexedDB database name and uses the default `persistedStore` object store.

---

## PersistedStoreOptions

Fields available when setting `storeOptions`:

- `storage?: 'localStorage' | 'sessionStorage' | 'indexedDB'` — Optional backend override for this store. IndexedDB settings remain configured at plugin level.
- `persistenceKey?: string` — Record key used for this store. Defaults to the Pinia `$id` and is useful for stable, readable or parameterized keys.
- `cache?: CacheOptions` — Opt-in cache metadata and restore policy. Without it, the state is persisted in the historical raw format.
- `excludedKeys?: string[]` — List of state properties that should NOT be persisted.
- `persist?: boolean` — Enable or disable persistence for the store (default: `false`).
- `persistedPropertiesToEncrypt?: string[]` — List of property names to be encrypted when persisted.
- `transformState?: (state) => state` — Optional synchronous transformer applied to the filtered snapshot after selected properties are encrypted and before storage. Use it to convert application-specific values into a persistent representation.
- `watchMutation?: boolean` — When `true`, plugin watches store mutations and automatically persists changes.
- `debounceMs?: number` — Delay in milliseconds before an automatic persistence is written. Defaults to `200`; use `0` to persist each mutation immediately.
- `restoreOnHydrate?: boolean` - Set it to true, and the persisted state will be restored to the store.

`CacheOptions` supports `maxAge?: number`, `version?: number`, `onExpired?: 'ignore' | 'remove' | 'restore'`, and `onVersionMismatch?: 'ignore' | 'remove' | 'restore'`. Cache metadata is written only when `cache` is configured.

`null` and `undefined` state values are intentionally omitted from persisted snapshots. Empty values handled by `pinia-plugin-subscription` are also omitted. `transformState` receives the resulting snapshot and must return the representation to persist; it must not mutate the store state. A transformer only changes the written representation, so use values that can be restored directly by the store or handle reconstruction in the store hydration flow.

---

## Augmented Store API

When the plugin is active stores gain the following methods (see `PersistedStore` interface):

- `persistState(): Promise<void>` — Immediately persist the current store state (ignores empty values and excluded keys).
- `flushPersistedState(): Promise<void>` — Cancels a pending automatic persistence and immediately persists the current store state.
- `remember(): Promise<void>` — Load persisted state and apply it to the store (used on plugin init).
- `removePersistedState(): Promise<void>` — Delete the persisted entry for this store after any running write completes.
- `watch(): void` — Start watching for mutations (sets `watchMutation = true`).
- `stopWatch(): void` — Stop auto-persisting on mutations (sets `watchMutation = false`).

Note: encrypted properties are automatically decrypted when remembered (if a crypto key was provided during plugin creation).

---

## Encryption

Optionally supply a `cryptKey` when creating the plugin, e.g. `createPersistStatePlugin({ storage: 'localStorage', cryptKey: 'my-secret' })`.
The plugin uses the Web Crypto API (PBKDF2 + AES-GCM) to encrypt properties listed in `persistedPropertiesToEncrypt` on each store. Only the specified properties will be encrypted. New encrypted values use a versioned `v1:salt:iv:ciphertext` format with a random salt and IV for every value; records in the previous `iv:ciphertext` format remain readable.

The storage adapter remains responsible for serializing the persisted record: Window Storage uses JSON and IndexedDB stores native values. Encryption encodes only the selected value and restores its JSON type (string, number, boolean, array, or object). Encrypted values must be JSON-serializable; functions, symbols, `undefined`, cyclic objects, and `BigInt` are not supported.

--- 

## Notes

- The plugin augments Pinia store definitions using the `pinia-plugin-subscription` helper. It adds `storeOptions` to Pinia's `DefineStoreOptionsBase` type through declaration merging.
- The $reset method is available for stores augmented by the plugin (also setup store 😁).
- With IndexedDB, `databaseName` identifies the application database, `objectStoreName` identifies the persisted record collection, and `persistenceKey` (or `$id`) identifies each record.

---

## License

MIT
