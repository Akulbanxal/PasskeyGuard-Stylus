const { generateKeyPairSync, sign, createHash } = require('crypto');

function generateVector() {
  const { publicKey, privateKey } = generateKeyPairSync('ec', {
    namedCurve: 'prime256v1',
  });

  const pubKeyObj = publicKey.export({ type: 'spki', format: 'jwk' });
  const x = Buffer.from(pubKeyObj.x, 'base64url');
  const y = Buffer.from(pubKeyObj.y, 'base64url');

  const rawMessage = Buffer.from('this is a test message for webauthn digest reconstruction');
  const messageHash = createHash('sha256').update(rawMessage).digest();

  const signatureDer = sign('sha256', rawMessage, privateKey);

  let offset = 2;
  if (signatureDer[1] > 0x7f) {
    offset += (signatureDer[1] & 0x7f);
  }

  offset++;
  const rLen = signatureDer[offset++];
  let r = signatureDer.subarray(offset, offset + rLen);
  offset += rLen;

  offset++;
  const sLen = signatureDer[offset++];
  let s = signatureDer.subarray(offset, offset + sLen);

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

function padOrTrim(buf) {
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
pub fn get_test_vector() -> ([u8; 32], [u8; 32], [u8; 32], [u8; 32], [u8; 32]) {
    let message_hash = hex_literal::hex!("${vector.messageHash}");
    let x = hex_literal::hex!("${vector.x}");
    let y = hex_literal::hex!("${vector.y}");
    let r = hex_literal::hex!("${vector.r}");
    let s = hex_literal::hex!("${vector.s}");
    (message_hash, r, s, x, y)
}
`);
