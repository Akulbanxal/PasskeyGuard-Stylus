#[path = "../src/parse.rs"]
mod parse;
#[path = "../src/verify.rs"]
mod verify;

#[test]
fn test_all_zeros() {
    let zeros = [0u8; 32];
    assert!(!verify::verify_p256(&zeros, &zeros, &zeros, &zeros, &zeros), "All zeros should fail gracefully");
}

#[test]
fn test_all_ones() {
    let ones = [0xff; 32];
    assert!(!verify::verify_p256(&ones, &ones, &ones, &ones, &ones), "All ones should fail gracefully");
}

#[test]
fn test_point_at_infinity() {
    // x = 0, y = 0 is not on the curve, but might be interpreted as infinity by some parsers
    let zeros = [0u8; 32];
    let ones = [0xff; 32];
    assert!(!verify::verify_p256(&zeros, &ones, &ones, &zeros, &zeros), "Point at infinity/zero point should fail");
}
