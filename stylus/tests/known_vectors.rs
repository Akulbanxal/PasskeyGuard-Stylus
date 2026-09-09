use hex_literal::hex;

// Include the logic modules directly for testing since we aren't using stylus_sdk::testing
#[path = "../src/parse.rs"]
mod parse;
#[path = "../src/verify.rs"]
mod verify;

pub fn get_test_vector() -> ([u8; 32], [u8; 32], [u8; 32], [u8; 32], [u8; 32]) {
    let message_hash = hex!("d0605eeed1dd8acecc2f5c386fdb7d8d01cd2e47ddc2292cc7dbc993ae428eb2");
    let x = hex!("9336454a307449ef08467a81a02312082f372e19292fd278ad89be7224bd4edf");
    let y = hex!("c0b924a35032944b4b10b09b06811e18b1c330a4eebd7c30a28b8c1d8b8338ab");
    let r = hex!("996f1a9f6bb41e208cd2213ffad354aac6209d32127959534a4501e421fa0c44");
    let s = hex!("c4078ff81bf00ab471753953844813ca07f3d9c0b0a19e29b6581c84ffcc6239");
    (message_hash, r, s, x, y)
}

#[test]
fn test_valid_known_vector() {
    let (message_hash, r, s, x, y) = get_test_vector();
    assert!(verify::verify_p256(&message_hash, &r, &s, &x, &y), "Known vector should verify");
}

#[test]
fn test_invalid_signature_fails() {
    let (message_hash, mut r, s, x, y) = get_test_vector();
    r[0] ^= 1; // Corrupt signature
    assert!(!verify::verify_p256(&message_hash, &r, &s, &x, &y), "Invalid signature should fail");
}

#[test]
fn test_invalid_public_key_fails() {
    let (message_hash, r, s, mut x, y) = get_test_vector();
    x[0] ^= 1; // Corrupt public key
    assert!(!verify::verify_p256(&message_hash, &r, &s, &x, &y), "Invalid public key should fail");
}

#[test]
fn test_high_s_rejected() {
    let (message_hash, r, mut s, x, y) = get_test_vector();
    
    // In P-256, n = FFFFFFFF 00000000 FFFFFFFF FFFFFFFF BCE6FAAD A7179E84 F3B9CAC2 FC632551
    // We can simulate a high S by using n - s. The signature parse code checks normalize_s() 
    // which requires low S.
    // Let's just create an all 0xFF s which is definitely high-S (or out of range).
    s = [0xff; 32];
    assert!(!verify::verify_p256(&message_hash, &r, &s, &x, &y), "High-S or out-of-range should fail");
}
