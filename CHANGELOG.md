# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.1]

### Fixed
- Prevented `remember is not a function` at component setup by making store method augmentation available immediately on the client.
- Moved persisted-state bootstrap behind hydration lifecycle execution (`hydrate`) instead of running it in the store constructor.
- Hardened browser-runtime detection (`typeof window !== 'undefined'`) for SSR compatibility.

### Changed
- Test setup now uses `createHydrationPlugin(..., { runtimeEnvironment: 'client' })` to validate client-only subscribers in Node test runtime.
