#![cfg_attr(not(any(test, feature = "export-abi")), no_main)]
extern crate alloc;

mod parse;
mod verify;

use stylus_sdk::{alloy_primitives::B256, prelude::*};

sol_storage! {
    #[entrypoint]
    pub struct Secp256r1Verifier {}
}

#[public]
impl Secp256r1Verifier {
    /// Verifies a P-256 (secp256r1) ECDSA signature.
    ///
    /// # Arguments
    /// * `message_hash` - 32-byte digest that was signed.
    /// * `r` - 32-byte signature component r.
    /// * `s` - 32-byte signature component s (must be low-s normalized).
    /// * `x` - 32-byte public key x-coordinate.
    /// * `y` - 32-byte public key y-coordinate.
    ///
    /// # Returns
    /// * `bool` - True only if the signature verifies against (x, y) for message_hash.
    pub fn verify(
        &self,
        message_hash: B256,
        r: B256,
        s: B256,
        x: B256,
        y: B256,
    ) -> bool {
        let message_hash_bytes: &[u8; 32] = message_hash.as_ref();
        let r_bytes: &[u8; 32] = r.as_ref();
        let s_bytes: &[u8; 32] = s.as_ref();
        let x_bytes: &[u8; 32] = x.as_ref();
        let y_bytes: &[u8; 32] = y.as_ref();

        verify::verify_p256(message_hash_bytes, r_bytes, s_bytes, x_bytes, y_bytes)
    }
}
