// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

library Base64Url {
    string internal constant ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

    function encode(bytes memory data) internal pure returns (string memory) {
        if (data.length == 0) return "";
        
        uint256 encodedLen = 4 * ((data.length + 2) / 3);
        // Base64Url does not use padding `=` according to WebAuthn standard often, 
        // but browsers usually don't pad the challenge. Let's handle no padding.
        
        string memory result = new string(encodedLen);
        bytes memory alphabet = bytes(ALPHABET);
        
        bytes memory resBytes = bytes(result);
        
        uint256 i;
        uint256 j;
        for (i = 0; i + 3 <= data.length; i += 3) {
            uint256 n = (uint256(uint8(data[i])) << 16) | (uint256(uint8(data[i+1])) << 8) | uint256(uint8(data[i+2]));
            resBytes[j++] = alphabet[(n >> 18) & 0x3F];
            resBytes[j++] = alphabet[(n >> 12) & 0x3F];
            resBytes[j++] = alphabet[(n >> 6) & 0x3F];
            resBytes[j++] = alphabet[n & 0x3F];
        }

        if (i < data.length) {
            uint256 n = uint256(uint8(data[i])) << 16;
            if (i + 1 < data.length) n |= uint256(uint8(data[i+1])) << 8;
            
            resBytes[j++] = alphabet[(n >> 18) & 0x3F];
            resBytes[j++] = alphabet[(n >> 12) & 0x3F];
            if (i + 1 < data.length) resBytes[j++] = alphabet[(n >> 6) & 0x3F];
        }

        // We resize string to actual length to remove padding placeholders
        assembly {
            mstore(result, j)
        }

        return result;
    }
}
