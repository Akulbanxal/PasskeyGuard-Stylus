import { startAuthentication } from '@simplewebauthn/browser';
import { parseDERSignature } from './parse';
import { toBase64url, fromBase64url, toHex } from './base64url';

export async function authenticatePasskey(credentialId: string, challenge: Uint8Array) {
    const options = {
        challenge: toBase64url(challenge),
        rpId: window.location.hostname,
        allowCredentials: [{
            id: credentialId,
            type: 'public-key' as const
        }],
        userVerification: 'required' as const
    };

    const response = await startAuthentication({ optionsJSON: options as any });
    
    const { r, s } = parseDERSignature(response.response.signature);

    return {
        authenticatorData: toHex(fromBase64url(response.response.authenticatorData)),
        clientDataJSON: toHex(fromBase64url(response.response.clientDataJSON)),
        r,
        s
    };
}
