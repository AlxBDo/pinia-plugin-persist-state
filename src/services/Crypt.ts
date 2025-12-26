export default class Crypt {
    private _encoder: TextEncoder = new TextEncoder()
    private _key: string;
    private _materialKey: any;

    private static DECRYPT: 'decrypt' = 'decrypt'
    private static ENCRYPT: 'encrypt' = 'encrypt'

    constructor(key: string) {
        this._key = key
    }

    async getKey(mode: 'decrypt' | 'encrypt') {
        return await crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: this._encoder.encode('salt'),
                iterations: 100000,
                hash: 'SHA-256'
            },
            this._materialKey,
            { name: 'AES-GCM', length: 256 },
            false,
            [mode]
        )
    }

    async setKeyMaterial(key: string) {
        this._materialKey = await crypto.subtle.importKey(
            'raw',
            this._encoder.encode(key),
            { name: 'PBKDF2' },
            false,
            ['deriveKey']
        )
    }

    /**
     * Decrypt string passed in parameter
     * @param {string} item - encrypted string
     * @returns {string} decrypted item
     */
    async decrypt(item: string): Promise<string> {
        const [ivString, encryptedString] = item.split(':')
        const decrypted = await crypto.subtle.decrypt(
            {
                name: 'AES-GCM',
                iv: Uint8Array.from(atob(ivString), c => c.charCodeAt(0))
            },
            await this.getKey(Crypt.DECRYPT),
            Uint8Array.from(atob(encryptedString), c => c.charCodeAt(0))
        );
        return new TextDecoder().decode(decrypted)
    }

    /**
     * Encrypt string passed in parameter
     * @param {string} item
     * @returns {Promise<string>} encrypted item
     */
    async encrypt(item: string): Promise<string> {
        const iv = crypto.getRandomValues(new Uint8Array(12))
        const encrypted = await crypto.subtle.encrypt(
            {
                name: 'AES-GCM',
                iv: iv
            },
            await this.getKey(Crypt.ENCRYPT),
            this._encoder.encode(item)
        )

        return btoa(String.fromCharCode(...new Uint8Array(iv)))
            + ':'
            + btoa(String.fromCharCode(...new Uint8Array(encrypted)));
    }

    async init(): Promise<void> {
        if (!this._materialKey) {
            await this.setKeyMaterial(this._key)
        }
    }
}