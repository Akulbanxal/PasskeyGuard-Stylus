/**
 * Browser-native base64url utilities.
 * Avoids using Buffer.toString('base64url') which is not supported
 * by browser Buffer polyfills.
 */

/** Encode a Uint8Array to a base64url string */
export function toBase64url(bytes: Uint8Array): string {
  const base64 = btoa(String.fromCharCode(...bytes));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Decode a base64url string to a Uint8Array */
export function fromBase64url(b64url: string): Uint8Array {
  const base64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
}

/** Convert a Uint8Array to a hex string prefixed with 0x */
export function toHex(bytes: Uint8Array): string {
  return '0x' + bytes.reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '');
}
