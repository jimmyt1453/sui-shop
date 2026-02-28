#!/bin/bash
# Upgrade Jimmy's SUI Shop contract on testnet
# Run this from the sui-contracts/ directory after modifying shop.move
#
# Usage: ./upgrade.sh

set -e

UPGRADE_CAP="0xccbf6a0cb7ff8de9acd51c1162471c88fe7025906eb6f4feb6716dd927363b7b"

echo "=== Jimmy's SUI Shop - Contract Upgrade ==="
echo "Upgrade Cap: $UPGRADE_CAP"
echo ""

echo "Building and upgrading package..."
UPGRADE_OUTPUT=$(sui client upgrade \
    --upgrade-capability "$UPGRADE_CAP" \
    --gas-budget 100000000 \
    --json 2>&1)

NEW_PACKAGE_ID=$(echo "$UPGRADE_OUTPUT" | python3 -c "
import sys, json
data = json.load(sys.stdin)
for change in data.get('objectChanges', []):
    if change.get('type') == 'published':
        print(change['packageId'])
        break
" 2>/dev/null)

echo ""
echo "=== Upgrade Complete ==="
echo ""
echo "New PACKAGE_ID: $NEW_PACKAGE_ID"
echo ""
echo "Update these files with the new PACKAGE_ID:"
echo "  sui-shop/src/config/constants.ts        → PACKAGE_ID"
echo "  sui-shop-agent/src/config.ts             → PACKAGE_ID"
echo ""
echo "SHOP_OBJECT_ID stays the same (shared object, not upgraded):"
echo "  0x6d3362f2eb0d1c5ea6efcbec5d659443f82e47d88a82a8bfa1ffd5b42a3912cc"
