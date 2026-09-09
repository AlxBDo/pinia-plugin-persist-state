# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.2]

### Added
- Added an object-based `createPersistStatePlugin` configuration to explicitly select `storage`, `databaseName`, `objectStoreName`, and `cryptKey`.
- Added `persistenceKey` to persist a store under a stable or application-specific record key instead of its Pinia `$id`.
- Added opt-in cache metadata and restore policies through `cache`, including `maxAge`, schema `version`, and expiration/version-mismatch actions.
- Added `debounceMs` for trailing, per-store automatic persistence; automatic writes use a 200 ms delay by default.
- Added `restoreOnHydrate` to restore state store on client hydration.
- Added `flushPersistedState()` to immediately write the latest store state and cancel a pending debounced write.
- Added `transformState` to convert a filtered snapshot into an application-defined persistent representation before it is stored.
- Added `fake-indexeddb` integration tests for real IndexedDB updates, connection reuse, selective deletion, database isolation, and transaction errors.

### Changed
- Retained the legacy positional `createPersistStatePlugin(storageOrDatabaseName?, cryptKey?)` signature for compatibility. Non-window-storage names are interpreted as IndexedDB database names using the `persistedStore` object store.
- Replaced per-store `dbName` with `storage` to express a storage backend override without conflating the backend, IndexedDB database, and persisted record key.
- IndexedDB now reuses open connections and waits for transaction completion before resolving storage operations.
- The default IndexedDB model uses one application database, a stable object store, and one record per persisted Pinia store.
- `removePersistedState()` is asynchronous and waits for prior writes to complete.
- Window Storage remains responsible for serializing complete records; IndexedDB retains native values.
- `null`, `undefined`, and values considered empty by `pinia-plugin-subscription` are intentionally omitted from persisted snapshots before `transformState` runs.

### Fixed
- Replaced IndexedDB read-then-update writes with atomic `put()` writes to prevent stale records from being rewritten.
- Serialized persistence requests and discard superseded snapshots before writing, preventing older asynchronous writes from overwriting newer state.
- Aligned package ESM metadata with the generated bundle by removing the reference to a nonexistent CommonJS artifact.
- Aligned storage operations on asynchronous `Promise<void>` contracts so write and removal failures can propagate to callers.

### Security
- New encrypted values use AES-GCM with PBKDF2 and an independent random 16-byte salt plus 12-byte IV for every encrypted value.
- Introduced the versioned encrypted payload format `v1:salt:iv:ciphertext`.
- Preserved decryption support for legacy `iv:ciphertext` payloads generated with the historical salt.
- Encrypted properties preserve JSON-compatible types including strings, numbers, booleans, arrays, and objects; unsupported values are rejected.

## [0.1.1]

### Fixed
- Prevented `remember is not a function` at component setup by making store method augmentation available immediately on the client.
- Moved persisted-state bootstrap behind hydration lifecycle execution (`hydrate`) instead of running it in the store constructor.
- Hardened browser-runtime detection (`typeof window !== 'undefined'`) for SSR compatibility.

### Changed
- Test setup now uses `createHydrationPlugin(..., { runtimeEnvironment: 'client' })` to validate client-only subscribers in Node test runtime.
