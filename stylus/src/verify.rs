use p256::ecdsa::signature::hazmat::PrehashVerifier;
use crate::parse::{parse_public_key, parse_signature};

/// Verifies a P-256 ECDSA signature over a pre-hashed SHA-256 digest.
/// Returns false on any failure (parsing, bounds, or cryptographic mismatch).
pub fn verify_p256(
    message_hash: &[u8; 32],
    r: &[u8; 32],
    s: &[u8; 32],
    x: &[u8; 32],
    y: &[u8; 32],
) -> bool {
    let verifying_key = match parse_public_key(x, y) {
        Some(vk) => vk,
        None => return false,
    };

    let signature = match parse_signature(r, s) {
        Some(sig) => sig,
        None => return false,
    };

    // The signature must be verified against the SHA-256 message_hash directly.
    verifying_key.verify_prehash(message_hash, &signature).is_ok()
}
