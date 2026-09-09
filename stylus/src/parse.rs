use p256::ecdsa::{Signature, VerifyingKey};

/// Parses a raw (x, y) into a VerifyingKey.
/// Rejects off-curve or malformed points, returning None instead of panicking.
pub fn parse_public_key(x: &[u8; 32], y: &[u8; 32]) -> Option<VerifyingKey> {
    let mut sec1 = [0u8; 65];
    sec1[0] = 0x04; // Uncompressed point indicator
    sec1[1..33].copy_from_slice(x);
    sec1[33..65].copy_from_slice(y);

    VerifyingKey::from_sec1_bytes(&sec1).ok()
}

/// Parses a raw (r, s) into a Signature.
/// Rejects out-of-range scalars.
pub fn parse_signature(r: &[u8; 32], s: &[u8; 32]) -> Option<Signature> {
    let mut bytes = [0u8; 64];
    bytes[0..32].copy_from_slice(r);
    bytes[32..64].copy_from_slice(s);

    Signature::from_bytes(&bytes.into()).ok()
}
