# Persist Pinia State Plugin

A small Pinia plugin that adds persistence and optional encryption to your Pinia stores. It integrates with browser storage (localStorage or sessionStorage) or IndexedDB and augments stores with convenient methods to persist, restore and control watching behavior.

---

## 🔧 Features

- Persist store state to LocalStorage, SessionStorage or IndexedDB
- Selective encryption for specific properties using Web Crypto (AES-GCM)
- Per-store options via `storeOptions` when defining a store
- Augmented store API: `persistState`, `remember`, `removePersistedState`, `watch`, `stopWatch`
- Simple initialization through `createPersistStatePlugin(dbName?, cryptKey?)`

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
import { createPersistStatePlugin } from 'persist-pinia-state'

const app = createApp(App)
const pinia = createPinia()

// Pass `dbName` (e.g. 'localStorage' or a DB name for IndexedDB)
// and an optional `cryptKey` to enable encryption support
pinia.use(createPlugin([
  createPersistStatePlugin('localStorage', 'my-secret-key')
], true))

app.use(pinia)
```

---

## 📚 Usage

When defining a store you can pass `storeOptions` (type: `PersistedStoreOptions`) as part of the `defineStore` options. Example in `src/stores/test.ts`:

```ts
const storeOptions = {
  persist: true,
  persistedPropertiesToEncrypt: ['myStringEncrypted'],
  watchMutation: true
}

export const useTestStore = defineStore('testStore', () => {
  const myString = ref('Hello World')
  const myStringEncrypted = ref('Sensitive Data')

  return { myString, myStringEncrypted }
}, { storeOptions })
```

If `persist` is `true` the plugin will attempt to persist the store state using the configured persister (localStorage/sessionStorage/IndexedDB).

---

## 🔣 PersistedStoreOptions

Fields available when setting `storeOptions`:

- `dbName?: string` — (Optional) Name of the database/storage to use. Use `'localStorage'` or `'sessionStorage'` for window storage, or any other name to use IndexedDB.
- `excludedKeys?: string[]` — Keys that should NOT be persisted.
- `isEncrypted?: boolean` — Internal flag used to reflect whether the persisted state is currently encrypted.
- `persist?: boolean` — Enable or disable persistence for the store (default: `false`).
- `persistedPropertiesToEncrypt?: string[]` — List of property names to be encrypted when persisted.
- `watchMutation?: boolean` — When `true`, plugin watches store mutations and automatically persists changes.

---

## 🧰 Augmented Store API

When the plugin is active stores gain the following methods (see `PersistedStore` interface):

- `persistState(): Promise<void>` — Immediately persist the current store state (ignores empty values and excluded keys).
- `remember(): Promise<void>` — Load persisted state and apply it to the store (used on plugin init).
- `removePersistedState(): void` — Delete the persisted entry for this store.
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
- When using IndexedDB, the persister stores objects with a `storeName` key path.

---

## 📜 License

MIT
