import { generateKeyPairSync, sign, createHash } from 'crypto';

function generateVector() {
  // Generate a P-256 (prime256v1) key pair
  const { publicKey, privateKey } = generateKeyPairSync('ec', {
    namedCurve: 'prime256v1',
  });

  // Extract raw uncompressed public key point
  const pubKeyObj = publicKey.export({ type: 'spki', format: 'jwk' });
  const x = Buffer.from(pubKeyObj.x as string, 'base64url');
  const y = Buffer.from(pubKeyObj.y as string, 'base64url');

  // The message is the pre-hashed SHA-256 digest in WebAuthn
  const rawMessage = Buffer.from('this is a test message for webauthn digest reconstruction');
  const messageHash = createHash('sha256').update(rawMessage).digest();

  // Sign the digest
  // Note: WebAuthn signs the messageHash, but crypto.sign expects the raw message
  // if you provide a digest algorithm, or you can sign the digest directly.
  // We'll just sign the raw message, which hashes it via SHA-256, so the
  // signature matches `messageHash`.
  const signatureDer = sign('sha256', rawMessage, privateKey);

  // Parse DER signature to get r and s
  // DER sequence: 0x30 || length || 0x02 || r_length || r || 0x02 || s_length || s
  let offset = 2; // Skip 0x30 and length
  if (signatureDer[1] > 0x7f) {
    offset += (signatureDer[1] & 0x7f); // skip extended length bytes
  }

  // Parse R
  offset++; // Skip 0x02
  const rLen = signatureDer[offset++];
  let r = signatureDer.subarray(offset, offset + rLen);
  offset += rLen;

  // Parse S
  offset++; // Skip 0x02
  const sLen = signatureDer[offset++];
  let s = signatureDer.subarray(offset, offset + sLen);

  // Pad to 32 bytes (removing leading zero if present for positive integer)
  r = padOrTrim(r);
  s = padOrTrim(s);

  return {
    messageHash: messageHash.toString('hex'),
    x: x.toString('hex'),
    y: y.toString('hex'),
    r: r.toString('hex'),
    s: s.toString('hex')
  };
}

function padOrTrim(buf: Buffer): Buffer {
  if (buf.length > 32) {
    return buf.subarray(buf.length - 32);
  } else if (buf.length < 32) {
    const res = Buffer.alloc(32);
    buf.copy(res, 32 - buf.length);
    return res;
  }
  return buf;
}

const vector = generateVector();

console.log(`
// Paste this into known_vectors.rs
pub fn get_test_vector() -> ([u8; 32], [u8; 32], [u8; 32], [u8; 32], [u8; 32]) {
    let message_hash = hex_literal::hex!("${vector.messageHash}");
    let x = hex_literal::hex!("${vector.x}");
    let y = hex_literal::hex!("${vector.y}");
    let r = hex_literal::hex!("${vector.r}");
    let s = hex_literal::hex!("${vector.s}");
    (message_hash, r, s, x, y)
}
`);
