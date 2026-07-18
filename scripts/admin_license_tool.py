#!/usr/bin/env python3
"""
Admin License Tool (Offline, Secure Edition)
Generates signed license.dat (JSON) using Ed25519 private key.

Usage:
  python scripts/admin_license_tool.py \
    --privkey ./admin_ed25519_private_key.pem \
    --hardware-id sha256:... \
    --customer "ACME Co." \
    --product "CNCcostifyAI" \
    --not-before 2025-10-10T00:00:00Z \
    --expires-at 2026-10-10T00:00:00Z \
    --grace-days 7 \
    --time-tolerance-sec 300 \
    --out ./license.dat

Notes:
  - Private key must be Ed25519 in PEM format.
  - The client app must embed the matching public key and pubkey_id.
"""

import argparse
import base64
import json
import sys
from datetime import datetime

from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey


def canonicalize(obj):
    if obj is None or isinstance(obj, (str, int, float, bool)):
        return json.dumps(obj, separators=(",", ":"))
    if isinstance(obj, list):
        return "[" + ",".join(canonicalize(v) for v in obj) + "]"
    # dict
    keys = sorted(obj.keys())
    parts = [f'"{k}":' + canonicalize(obj[k]) for k in keys]
    return "{" + ",".join(parts) + "}"


def load_private_key(pem_path: str) -> Ed25519PrivateKey:
    with open(pem_path, "rb") as f:
        data = f.read()
    try:
        return serialization.load_pem_private_key(data, password=None)
    except Exception as e:
        raise RuntimeError(f"Failed to load private key: {e}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--privkey", required=True, help="Ed25519 private key PEM path")
    ap.add_argument("--hardware-id", required=True, help="Hardware ID (sha256:...) from client")
    ap.add_argument("--customer", required=True, help="Customer name")
    ap.add_argument("--product", default="CNCcostifyAI", help="Product name")
    ap.add_argument("--license-id", default=None, help="Optional license id")
    ap.add_argument("--not-before", required=True, help="ISO UTC, e.g. 2025-10-10T00:00:00Z")
    ap.add_argument("--expires-at", required=True, help="ISO UTC")
    ap.add_argument("--grace-days", type=int, default=7)
    ap.add_argument("--time-tolerance-sec", type=int, default=300)
    ap.add_argument("--max-version", default="1.2.x")
    ap.add_argument("--build-channel", default="stable")
    ap.add_argument("--pubkey-id", default="admin-key-2025")
    ap.add_argument("--out", required=True, help="Output license.dat path")
    args = ap.parse_args()

    # Basic validation
    for field in ("not_before", "expires_at"):
        try:
            datetime.strptime(getattr(args, field), "%Y-%m-%dT%H:%M:%SZ")
        except Exception:
            print(f"Invalid datetime for {field}. Use ISO UTC e.g. 2025-10-10T00:00:00Z", file=sys.stderr)
            sys.exit(2)

    payload = {
        "license_id": args.license_id or f"LIC-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}",
        "product": args.product,
        "customer_name": args.customer,
        "hardware_id": args.hardware_id,
        "issued_at": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
        "not_before": args.not_before,
        "expires_at": args.expires_at,
        "grace_period_days": int(args.grace_days),
        "time_tolerance_sec": int(args.time_tolerance_sec),
        "features": {"pro": True},
        "max_version": args.max_version,
        "build_channel": args.build_channel,
        "revoked": False,
    }

    priv = load_private_key(args.privkey)
    data = canonicalize(payload).encode("utf-8")
    sig = priv.sign(data)
    signature_b64 = "base64:" + base64.b64encode(sig).decode("ascii")

    license_doc = {
        "version": 1,
        "payload": payload,
        "signature": signature_b64,
        "sig_alg": "Ed25519",
        "pubkey_id": args.pubkey_id,
        "enc": {
            "enabled": False,
            "enc_alg": "AES-256-GCM",
            "salt": None,
            "ciphertext": None,
        },
    }

    with open(args.out, "w", encoding="utf-8") as f:
        json.dump(license_doc, f, ensure_ascii=False, indent=2)
    print(f"Wrote license file: {args.out}")


if __name__ == "__main__":
    main()