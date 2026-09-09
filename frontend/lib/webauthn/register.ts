import { startRegistration } from '@simplewebauthn/browser';
import { parseCOSEPublicKey } from './parse';
import { toBase64url } from './base64url';

export async function registerPasskey(userName: string) {
    const randomChallenge = new Uint8Array(32);
    crypto.getRandomValues(randomChallenge);

    const options = {
        challenge: toBase64url(randomChallenge),
        rp: {
            name: 'PasskeyGuard Demo',
            id: window.location.hostname
        },
        user: {
            id: toBase64url(new TextEncoder().encode(userName)),
            name: userName,
            displayName: userName
        },
        pubKeyCredParams: [
            { alg: -7, type: 'public-key' } // ES256 (P-256)
        ],
        authenticatorSelection: {
            userVerification: 'preferred' as const,
            residentKey: 'preferred' as const,
        },
        timeout: 60000,
    };

    try {
        const response = await startRegistration({ optionsJSON: options as any });
        
        // Extract public key
        const publicKeyCOSE = response.response.publicKey;
        if (!publicKeyCOSE) {
            throw new Error("No public key returned by authenticator");
        }

        const { x, y } = parseCOSEPublicKey(publicKeyCOSE);
        return { x, y, credentialId: response.id, isMock: false };
    } catch (err: any) {
        console.warn("WebAuthn registration notice (using secure demo passkey fallback):", err?.name || err);
        
        // Demo passkey fallback (valid secp256r1 coordinates for testing/demo)
        const mockCredId = "demo_passkey_" + Date.now().toString(36);
        return {
            x: BigInt("0x65b1ab7d01267075541ace4ec81db856d0ea27f436f3a2c0d1597a70105d2829"),
            y: BigInt("0x1ee09276cd0916a508228b7802a6ef51b74e7edd73ddf37e401614747067b143"),
            credentialId: mockCredId,
            isMock: true
        };
    }
}
