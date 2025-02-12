#![cfg_attr(feature = "deny-warnings", deny(warnings))]
#![warn(clippy::pedantic)]

use neqo_crypto::{
    constants::{
        Cipher, TLS_AES_128_GCM_SHA256, TLS_AES_256_GCM_SHA384, TLS_CHACHA20_POLY1305_SHA256,
        TLS_VERSION_1_3,
    },
    hkdf, SymKey,
};
use test_fixture::fixture_init;

const SALT: &[u8] = &[
    0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b, 0x0c, 0x0d, 0x0e, 0x0f,
    0x10, 0x11, 0x12, 0x13, 0x14, 0x15, 0x16, 0x17, 0x18, 0x19, 0x1a, 0x1b, 0x1c, 0x1d, 0x1e, 0x1f,
    0x20, 0x21, 0x22, 0x23, 0x24, 0x25, 0x26, 0x27, 0x28, 0x29, 0x2a, 0x2b, 0x2c, 0x2d, 0x2e, 0x2f,
];

const IKM: &[u8] = &[
    0x01, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b, 0x0c, 0x0d, 0x0e, 0x0f,
    0x10, 0x11, 0x12, 0x13, 0x14, 0x15, 0x16, 0x17, 0x18, 0x19, 0x1a, 0x1b, 0x1c, 0x1d, 0x1e, 0x1f,
    0x20, 0x21, 0x22, 0x23, 0x24, 0x25, 0x26, 0x27, 0x28, 0x29, 0x2a, 0x2b, 0x2c, 0x2d, 0x2e, 0x2f,
];

const SESSION_HASH: &[u8] = &[
    0xf0, 0xf1, 0xf2, 0xf3, 0xf4, 0xf5, 0xf6, 0xf7, 0xf8, 0xf9, 0xfa, 0xfb, 0xfc, 0xfd, 0xfe, 0xff,
    0xe0, 0xe1, 0xe2, 0xe3, 0xe4, 0xe5, 0xe6, 0xe7, 0xe8, 0xe9, 0xea, 0xeb, 0xec, 0xed, 0xee, 0xef,
    0xd0, 0xd1, 0xd2, 0xd3, 0xd4, 0xd5, 0xd6, 0xd7, 0xd8, 0xd9, 0xda, 0xdb, 0xdc, 0xdd, 0xde, 0xdf,
    0xe0, 0xe1, 0xe2, 0xe3, 0xe4, 0xe5, 0xe6, 0xe7, 0xe8, 0xe9, 0xea, 0xeb, 0xec, 0xed, 0xee, 0xef,
];

fn cipher_hash_len(cipher: Cipher) -> usize {
    match cipher {
        TLS_AES_128_GCM_SHA256 | TLS_CHACHA20_POLY1305_SHA256 => 32,
        TLS_AES_256_GCM_SHA384 => 48,
        _ => unreachable!(),
    }
}

fn import_keys(cipher: Cipher) -> (SymKey, SymKey) {
    let l = cipher_hash_len(cipher);
    (
        hkdf::import_key(TLS_VERSION_1_3, &SALT[0..l]).expect("import salt"),
        hkdf::import_key(TLS_VERSION_1_3, &IKM[0..l]).expect("import IKM"),
    )
}

fn extract(cipher: Cipher, expected: &[u8]) {
    fixture_init();
    let (salt, ikm) = import_keys(cipher);
    let prk = hkdf::extract(TLS_VERSION_1_3, cipher, Some(&salt), &ikm)
        .expect("HKDF Extract should work");
    let raw_prk = prk.as_bytes().expect("key should have bytes");
    assert_eq!(raw_prk, expected);
}

#[test]
fn extract_sha256() {
    const EXPECTED: &[u8] = &[
        0xa5, 0x68, 0x02, 0x5a, 0x95, 0xc9, 0x7f, 0x55, 0x38, 0xbc, 0xf7, 0x97, 0xcc, 0x0f, 0xd5,
        0xf6, 0xa8, 0x8d, 0x15, 0xbc, 0x0e, 0x85, 0x74, 0x70, 0x3c, 0xa3, 0x65, 0xbd, 0x76, 0xcf,
        0x9f, 0xd3,
    ];
    extract(TLS_AES_128_GCM_SHA256, EXPECTED);
    extract(TLS_CHACHA20_POLY1305_SHA256, EXPECTED);
}

#[test]
fn extract_sha384() {
    extract(
        TLS_AES_256_GCM_SHA384,
        &[
            0x01, 0x93, 0xc0, 0x07, 0x3f, 0x6a, 0x83, 0x0e, 0x2e, 0x4f, 0xb2, 0x58, 0xe4, 0x00,
            0x08, 0x5c, 0x68, 0x9c, 0x37, 0x32, 0x00, 0x37, 0xff, 0xc3, 0x1c, 0x5b, 0x98, 0x0b,
            0x02, 0x92, 0x3f, 0xfd, 0x73, 0x5a, 0x6f, 0x2a, 0x95, 0xa3, 0xee, 0xf6, 0xd6, 0x8e,
            0x6f, 0x86, 0xea, 0x63, 0xf8, 0x33,
        ],
    );
}

fn derive_secret(cipher: Cipher, expected: &[u8]) {
    fixture_init();

    // Here we only use the salt as the PRK.
    let (prk, _) = import_keys(cipher);
    let secret = hkdf::expand_label(TLS_VERSION_1_3, cipher, &prk, &[], "master secret")
        .expect("HKDF-Expand-Label should work");
    let raw_secret = secret.as_bytes().expect("key should have bytes");
    assert_eq!(raw_secret, expected);
}

#[test]
fn derive_secret_sha256() {
    const EXPECTED: &[u8] = &[
        0xb7, 0x08, 0x00, 0xe3, 0x8e, 0x48, 0x68, 0x91, 0xb1, 0x0f, 0x5e, 0x6f, 0x22, 0x53, 0x6b,
        0x84, 0x69, 0x75, 0xaa, 0xa3, 0x2a, 0xe7, 0xde, 0xaa, 0xc3, 0xd1, 0xb4, 0x05, 0x22, 0x5c,
        0x68, 0xf5,
    ];
    derive_secret(TLS_AES_128_GCM_SHA256, EXPECTED);
    derive_secret(TLS_CHACHA20_POLY1305_SHA256, EXPECTED);
}

#[test]
fn derive_secret_sha384() {
    derive_secret(
        TLS_AES_256_GCM_SHA384,
        &[
            0x13, 0xd3, 0x36, 0x9f, 0x3c, 0x78, 0xa0, 0x32, 0x40, 0xee, 0x16, 0xe9, 0x11, 0x12,
            0x66, 0xc7, 0x51, 0xad, 0xd8, 0x3c, 0xa1, 0xa3, 0x97, 0x74, 0xd7, 0x45, 0xff, 0xa7,
            0x88, 0x9e, 0x52, 0x17, 0x2e, 0xaa, 0x3a, 0xd2, 0x35, 0xd8, 0xd5, 0x35, 0xfd, 0x65,
            0x70, 0x9f, 0xa9, 0xf9, 0xfa, 0x23,
        ],
    );
}

fn expand_label(cipher: Cipher, expected: &[u8]) {
    fixture_init();

    let l = cipher_hash_len(cipher);
    let (prk, _) = import_keys(cipher);
    let secret = hkdf::expand_label(
        TLS_VERSION_1_3,
        cipher,
        &prk,
        &SESSION_HASH[0..l],
        "master secret",
    )
    .expect("HKDF-Expand-Label should work");
    let raw_secret = secret.as_bytes().expect("key should have bytes");
    assert_eq!(raw_secret, expected);
}

#[test]
fn expand_label_sha256() {
    const EXPECTED: &[u8] = &[
        0x3e, 0x4e, 0x6e, 0xd0, 0xbc, 0xc4, 0xf4, 0xff, 0xf0, 0xf5, 0x69, 0xd0, 0x6c, 0x1e, 0x0e,
        0x10, 0x32, 0xaa, 0xd7, 0xa3, 0xef, 0xf6, 0xa8, 0x65, 0x8e, 0xbe, 0xee, 0xc7, 0x1f, 0x01,
        0x6d, 0x3c,
    ];
    expand_label(TLS_AES_128_GCM_SHA256, EXPECTED);
    expand_label(TLS_CHACHA20_POLY1305_SHA256, EXPECTED);
}

#[test]
fn expand_label_sha384() {
    expand_label(
        TLS_AES_256_GCM_SHA384,
        &[
            0x41, 0xea, 0x77, 0x09, 0x8c, 0x90, 0x04, 0x10, 0xec, 0xbc, 0x37, 0xd8, 0x5b, 0x54,
            0xcd, 0x7b, 0x08, 0x15, 0x13, 0x20, 0xed, 0x1e, 0x3f, 0x54, 0x74, 0xf7, 0x8b, 0x06,
            0x38, 0x28, 0x06, 0x37, 0x75, 0x23, 0xa2, 0xb7, 0x34, 0xb1, 0x72, 0x2e, 0x59, 0x6d,
            0x5a, 0x31, 0xf5, 0x53, 0xab, 0x99,
        ],
    );
}
