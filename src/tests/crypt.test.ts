import { beforeAll, describe, expect, it } from 'vitest'

import Crypt from "../services/Crypt";

describe('Crypt', () => {
    const crypt = new Crypt('HrN2t2nCr6pTiV22')
    const str = 'My string test'
    let strCrypted: string

    beforeAll(async () => {
        await crypt.init()
    })

    it('Encrypt', async () => {
        strCrypted = await crypt.encrypt(str)

        expect(strCrypted).toBeDefined()
        expect(strCrypted).not.toEqual(str)
        expect(strCrypted.split(':')).toHaveLength(4)
        expect(strCrypted).toMatch(/^v1:/)
    })

    it('Decrypt', async () => {
        strCrypted = await crypt.decrypt(strCrypted)

        expect(strCrypted).toBeDefined()
        expect(strCrypted).toStrictEqual(str)
    })

    it.each([
        ['number', 42],
        ['boolean', true],
        ['array', ['first', 2]],
        ['object', { id: 1, name: 'test' }]
    ])('preserves %s values', async (_label, value) => {
        const encrypted = await crypt.encrypt(value)

        await expect(crypt.decrypt(encrypted)).resolves.toStrictEqual(value)
    })

    it('decrypts values written in the legacy format', async () => {
        const legacySalt = new TextEncoder().encode('salt')
        const iv = crypto.getRandomValues(new Uint8Array(12))
        const materialKey = await crypto.subtle.importKey(
            'raw',
            new TextEncoder().encode('HrN2t2nCr6pTiV22'),
            { name: 'PBKDF2' },
            false,
            ['deriveKey']
        )
        const key = await crypto.subtle.deriveKey(
            { name: 'PBKDF2', salt: legacySalt, iterations: 100000, hash: 'SHA-256' },
            materialKey,
            { name: 'AES-GCM', length: 256 },
            false,
            ['encrypt', 'decrypt']
        )
        const encrypted = await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv },
            key,
            new TextEncoder().encode(str)
        )
        const toBase64 = (value: Uint8Array) => btoa(String.fromCharCode(...value))
        const legacyValue = `${toBase64(iv)}:${toBase64(new Uint8Array(encrypted))}`

        await expect(crypt.decrypt(legacyValue)).resolves.toBe(str)
    })

    it('rejects values that JSON cannot serialize', async () => {
        await expect(crypt.encrypt(undefined)).rejects.toThrow('JSON-serializable')
    })
})