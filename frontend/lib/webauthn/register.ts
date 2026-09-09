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
            userVerification: 'required' as const,
            residentKey: 'required' as const,
        }
    };

    const response = await startRegistration({ optionsJSON: options as any });
    
    // Extract public key
    const publicKeyCOSE = response.response.publicKey;
    if (!publicKeyCOSE) {
        throw new Error("No public key returned by authenticator");
    }

    const { x, y } = parseCOSEPublicKey(publicKeyCOSE);
    return { x, y, credentialId: response.id };
}
