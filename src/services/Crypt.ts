export default class Crypt {
    private _encoder: TextEncoder = new TextEncoder()
    private _key: string
    private _materialKey?: CryptoKey

    private static DECRYPT: 'decrypt' = 'decrypt'
    private static ENCRYPT: 'encrypt' = 'encrypt'
    private static FORMAT_VERSION = 'v1'
    private static LEGACY_SALT = 'salt'

    constructor(key: string) {
        this._key = key
    }

    async getKey(mode: 'decrypt' | 'encrypt', salt: Uint8Array) {
        await this.init()

        return await crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: this.toArrayBuffer(salt),
                iterations: 100000,
                hash: 'SHA-256'
            },
            this._materialKey as CryptoKey,
            { name: 'AES-GCM', length: 256 },
            false,
            [mode]
        )
    }

    async setKeyMaterial(key: string): Promise<void> {
        this._materialKey = await crypto.subtle.importKey(
            'raw',
            this._encoder.encode(key),
            { name: 'PBKDF2' },
            false,
            ['deriveKey']
        )
    }

    async decrypt<T = unknown>(item: string): Promise<T> {
        const parts = item.split(':')
        const isVersioned = parts[0] === Crypt.FORMAT_VERSION
        const [saltString, ivString, encryptedString] = isVersioned
            ? parts.slice(1)
            : [Crypt.LEGACY_SALT, ...parts]
        if (!ivString || !encryptedString) {
            throw new Error('Invalid encrypted value format')
        }
        const decrypted = await crypto.subtle.decrypt(
            {
                name: 'AES-GCM',
                iv: Uint8Array.from(atob(ivString), c => c.charCodeAt(0))
            },
            await this.getKey(
                Crypt.DECRYPT,
                isVersioned ? this.decodeBase64(saltString) : this._encoder.encode(saltString)
            ),
            Uint8Array.from(atob(encryptedString), c => c.charCodeAt(0))
        )
        const plaintext = new TextDecoder().decode(decrypted)

        return (isVersioned ? JSON.parse(plaintext) : plaintext) as T
    }

    async encrypt(value: unknown): Promise<string> {
        const plaintext = JSON.stringify(value)
        if (plaintext === undefined) {
            throw new Error('Encrypted values must be JSON-serializable')
        }

        const salt = crypto.getRandomValues(new Uint8Array(16))
        const iv = crypto.getRandomValues(new Uint8Array(12))
        const encrypted = await crypto.subtle.encrypt(
            {
                name: 'AES-GCM',
                iv: iv
            },
            await this.getKey(Crypt.ENCRYPT, salt),
            this._encoder.encode(plaintext)
        )

        return [
            Crypt.FORMAT_VERSION,
            this.encodeBase64(salt),
            this.encodeBase64(iv),
            this.encodeBase64(new Uint8Array(encrypted))
        ].join(':')
    }

    async init(): Promise<void> {
        if (!this._materialKey) {
            await this.setKeyMaterial(this._key)
        }
    }

    private encodeBase64(value: Uint8Array): string {
        return btoa(String.fromCharCode(...value))
    }

    private decodeBase64(value: string): Uint8Array {
        return Uint8Array.from(atob(value), character => character.charCodeAt(0))
    }

    private toArrayBuffer(value: Uint8Array): ArrayBuffer {
        return value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength) as ArrayBuffer
    }
}