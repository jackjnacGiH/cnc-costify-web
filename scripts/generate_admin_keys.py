#!/usr/bin/env python3
"""
Generate Ed25519 admin key pair in PEM format.

Usage:
  python scripts/generate_admin_keys.py --out-prefix admin_ed25519

Outputs:
  - <prefix>_private_key.pem
  - <prefix>_public_key.pem
"""

import argparse
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
from cryptography.hazmat.primitives import serialization


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out-prefix", default="admin_ed25519", help="Output file prefix")
    args = ap.parse_args()

    priv = Ed25519PrivateKey.generate()
    pub = priv.public_key()

    priv_pem = priv.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption(),
    )
    pub_pem = pub.public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo,
    )

    priv_path = f"{args.out_prefix}_private_key.pem"
    pub_path = f"{args.out_prefix}_public_key.pem"
    with open(priv_path, "wb") as f:
        f.write(priv_pem)
    with open(pub_path, "wb") as f:
        f.write(pub_pem)
    print(f"Wrote: {priv_path}\nWrote: {pub_path}")


if __name__ == "__main__":
    main()