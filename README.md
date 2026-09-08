# PasskeyGuard-Stylus

PasskeyGuard is an Arbitrum smart account controlled by a WebAuthn passkey (Face ID / Touch ID / Windows Hello / security key) instead of a private key held by the user.

Authentication (proving control of the passkey) is cryptographically separated from authorization (whether the smart account will actually execute the requested transaction).

The system has three cooperating layers:
1. **Frontend (React/Next.js + WebAuthn)**
2. **Solidity smart account** (Foundry)
3. **Rust/Arbitrum Stylus verifier** (Cargo/Stylus)
