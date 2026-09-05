# Persist Pinia State Plugin

A small Pinia plugin that adds persistence and optional encryption to your Pinia stores. It integrates with browser storage (localStorage or sessionStorage) or IndexedDB and augments stores with convenient methods to persist, restore and control watching behavior.

---

## 🔧 Features

- Persist store state to LocalStorage, SessionStorage or IndexedDB
- Selective encryption for specific properties using Web Crypto (AES-GCM)
- Per-store options via `storeOptions` when defining a store
- Augmented store API: `persistState`, `remember`, `removePersistedState`, `watch`, `stopWatch`
- Simple initialization through `createPersistStatePlugin(dbName?, cryptKey?)`
- SSR-safe hydration flow: methods are injected immediately on client, persistence restore is executed during hydration lifecycle

---

## ⚙️ Installation

Install the package (example):

```bash
npm install --save persist-pinia-state
```

Then register the plugin with Pinia in your app entry (see `src/main.ts`):

```ts
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createPlugin } from 'pinia-plugin-subscription'
import { createPersistStatePlugin, PLUGIN_NAME } from 'persist-pinia-state'

const app = createApp(App)
const pinia = createPinia()

// Pass `dbName` (e.g. 'localStorage', 'sessionStorage' or a DB name for IndexedDB)
// and an optional `cryptKey` to enable encryption support
pinia.use(createPlugin([
  createPersistStatePlugin('localStorage', 'my-secret-key')
]))

app.use(pinia)
```

For Nuxt/SSR projects, prefer `createHydrationPlugin` from `pinia-plugin-subscription` when you need runtime overrides:

```ts
import { createHydrationPlugin } from 'pinia-plugin-subscription'
import { createPersistStatePlugin } from 'persist-pinia-state'

pinia.use(createHydrationPlugin([
  createPersistStatePlugin('localStorage', 'my-secret-key')
], {
  runtimeEnvironment: import.meta.client ? 'client' : 'server'
}))
```

---

## 📚 Usage

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

---

## 🔣 PersistedStoreOptions

Fields available when setting `storeOptions`:

- `dbName?: string` — (Optional) Name of the database/storage to use to persist the store state (use only if different from the one defined in the plugin). Use `'localStorage'` or `'sessionStorage'` for window storage, or any other name to use IndexedDB.
- `excludedKeys?: string[]` — List of state properties that should NOT be persisted.
- `persist?: boolean` — Enable or disable persistence for the store (default: `false`).
- `persistedPropertiesToEncrypt?: string[]` — List of property names to be encrypted when persisted.
- `watchMutation?: boolean` — When `true`, plugin watches store mutations and automatically persists changes.
- `debounceMs?: number` — Delay in milliseconds before an automatic persistence is written. Defaults to `200`; use `0` to persist each mutation immediately.

---

## 🧰 Augmented Store API

When the plugin is active stores gain the following methods (see `PersistedStore` interface):

- `persistState(): Promise<void>` — Immediately persist the current store state (ignores empty values and excluded keys).
- `flushPersistedState(): Promise<void>` — Cancels a pending automatic persistence and immediately persists the current store state.
- `remember(): Promise<void>` — Load persisted state and apply it to the store (used on plugin init).
- `removePersistedState(): Promise<void>` — Delete the persisted entry for this store after any running write completes.
- `watch(): void` — Start watching for mutations (sets `watchMutation = true`).
- `stopWatch(): void` — Stop auto-persisting on mutations (sets `watchMutation = false`).

Note: encrypted properties are automatically decrypted when remembered (if a crypto key was provided during plugin creation).

---

## 🔐 Encryption

Optionally supply a `cryptKey` when creating the plugin, e.g. `createPersistStatePlugin(undefined, 'my-secret')`.
The plugin uses the Web Crypto API (PBKDF2 + AES-GCM) to encrypt properties listed in `persistedPropertiesToEncrypt` on each store. Only the specified properties will be encrypted.

--- 

## 💡 Notes

- The plugin augments Pinia store definitions using the `pinia-plugin-subscription` helper. It adds `storeOptions` to Pinia's `DefineStoreOptionsBase` type through declaration merging.
- The $reset method is available for stores augmented by the plugin (also setup store 😁).
- When using IndexedDB, the persister stores objects with a `storeName` key path.

---

## 📜 License

MIT
