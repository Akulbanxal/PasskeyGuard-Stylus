import { AsnParser } from '@peculiar/asn1-schema';
import { ECDSASigValue } from '@peculiar/asn1-ecc';

export function parseDERSignature(derBase64URL: string): { r: string; s: string } {
  // Convert base64url to Uint8Array
  const base64 = derBase64URL.replace(/-/g, '+').replace(/_/g, '/');
  const padLen = (4 - (base64.length % 4)) % 4;
  const b64 = base64 + '='.repeat(padLen);
  const rawBytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));

  // Parse DER
  const parsed = AsnParser.parse(rawBytes, ECDSASigValue);
  
  // Format to 32 bytes hex
  const rHex = new Uint8Array(parsed.r).reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '');
  const sHex = new Uint8Array(parsed.s).reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '');
  
  // Pad left to 64 chars (32 bytes)
  const rHex32 = rHex.padStart(64, '0').slice(-64);
  const sHex32 = sHex.padStart(64, '0').slice(-64);
  
  return {
    r: `0x${rHex32}`,
    s: `0x${sHex32}`,
  };
}

export function parseCOSEPublicKey(coseBase64URL: string): { x: string; y: string } {
    // A full CBOR parser is heavy for just one extraction. We'll find the last 64 bytes if it's a simple uncompressed key (P-256 usually ends with 32 bytes X and 32 bytes Y).
    // Better yet, for MVP, we just use a regex or string search over the hex representation since COSE keys for ES256 (-7) have specific CBOR tags.
    const base64 = coseBase64URL.replace(/-/g, '+').replace(/_/g, '/');
    const padLen = (4 - (base64.length % 4)) % 4;
    const b64 = base64 + '='.repeat(padLen);
    const rawBytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    
    // In CBOR COSE key, the x coordinate is keyed by -2, and y coordinate by -3.
    // -2 is 0x21 (negative integer 2) or 0x22 (negative 3). Actually CBOR map keys for COSE:
    // 1 (kty) : 2 (EC2)
    // 3 (alg) : -7 (ES256)
    // -1 (crv) : 1 (P-256)
    // -2 (x) : <32 bytes>
    // -3 (y) : <32 bytes>
    // A quick and dirty way is to extract the last 64 bytes. For a standard 77-byte COSE key, bytes 13 to 45 are X, and 45 to 77 are Y.
    // Let's just grab the last 64 bytes if it looks like an uncompressed point or standard COSE:
    const hex = rawBytes.reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '');
    
    // A standard P-256 COSE key has X and Y as the last elements.
    // We can just slice the last 128 hex chars (64 bytes).
    const xHex = hex.slice(-128, -64);
    const yHex = hex.slice(-64);

    return {
        x: `0x${xHex}`,
        y: `0x${yHex}`
    };
}
