#!/bin/bash
# Deploy Jimmy's SUI Shop contract to testnet
# Prerequisites:
#   1. SUI CLI installed: brew install sui
#   2. Active address has testnet SUI: visit https://faucet.sui.io
#   3. Run from sui-contracts/ directory

set -e

echo "=== Jimmy's SUI Shop - Contract Deployment ==="
echo ""

# Check balance
echo "Checking balance..."
sui client gas 2>&1

echo ""
echo "Publishing contract..."
PUBLISH_OUTPUT=$(sui client publish --gas-budget 100000000 --json 2>&1)
echo "$PUBLISH_OUTPUT" | head -5

# Extract package ID
PACKAGE_ID=$(echo "$PUBLISH_OUTPUT" | python3 -c "
import sys, json
data = json.load(sys.stdin)
for change in data.get('objectChanges', []):
    if change.get('type') == 'published':
        print(change['packageId'])
        break
" 2>/dev/null)

echo ""
echo "Package ID: $PACKAGE_ID"

# Now create the shop
MERCHANT_ADDRESS=$(sui client active-address)
echo "Merchant Address: $MERCHANT_ADDRESS"
echo ""
echo "Creating shop..."

CREATE_OUTPUT=$(sui client call \
    --package "$PACKAGE_ID" \
    --module shop \
    --function create_shop \
    --args "Jimmy's SUI Shop" "$MERCHANT_ADDRESS" \
    --gas-budget 10000000 \
    --json 2>&1)

# Extract Shop ID and AdminCap ID
SHOP_ID=$(echo "$CREATE_OUTPUT" | python3 -c "
import sys, json
data = json.load(sys.stdin)
for change in data.get('objectChanges', []):
    if change.get('type') == 'created' and 'Shop' in change.get('objectType', ''):
        print(change['objectId'])
        break
" 2>/dev/null)

ADMIN_CAP_ID=$(echo "$CREATE_OUTPUT" | python3 -c "
import sys, json
data = json.load(sys.stdin)
for change in data.get('objectChanges', []):
    if change.get('type') == 'created' and 'AdminCap' in change.get('objectType', ''):
        print(change['objectId'])
        break
" 2>/dev/null)

echo "Shop Object ID: $SHOP_ID"
echo "AdminCap ID: $ADMIN_CAP_ID"

# Add all 15 products
echo ""
echo "Adding products..."

add_product() {
    local name="$1"
    local desc="$2"
    local price="$3"
    local img="$4"

    sui client call \
        --package "$PACKAGE_ID" \
        --module shop \
        --function add_product \
        --args "$SHOP_ID" "$ADMIN_CAP_ID" "$name" "$desc" "$price" "$img" \
        --gas-budget 10000000 \
        --json > /dev/null 2>&1

    echo "  Added: $name ($(echo "scale=2; $price / 1000000" | bc) USDC)"
}

add_product "Steam Gift Card \$10" "Digital Steam wallet code worth \$10" "10000000" "steam-10"
add_product "Steam Gift Card \$25" "Digital Steam wallet code worth \$25" "25000000" "steam-25"
add_product "PlayStation Store \$20" "PlayStation Store credit \$20" "20000000" "psn-20"
add_product "Xbox Game Pass 1 Month" "1 month of Xbox Game Pass Ultimate" "15000000" "xbox-gp"
add_product "Nintendo eShop \$15" "Nintendo eShop digital credit \$15" "15000000" "nintendo-15"
add_product "Spotify Premium 1 Month" "1 month of Spotify Premium subscription" "10000000" "spotify"
add_product "Netflix Gift Card \$15" "Netflix streaming credit \$15" "15000000" "netflix-15"
add_product "Apple App Store \$10" "App Store & iTunes gift card \$10" "10000000" "apple-10"
add_product "Google Play \$10" "Google Play Store credit \$10" "10000000" "google-10"
add_product "Roblox 800 Robux" "800 Robux for Roblox" "10000000" "roblox-800"
add_product "Fortnite 1000 V-Bucks" "1000 V-Bucks for Fortnite" "8000000" "fortnite-1000"
add_product "Minecraft Java Edition" "Minecraft Java Edition game key" "27000000" "minecraft"
add_product "Discord Nitro 1 Month" "1 month of Discord Nitro" "10000000" "discord-nitro"
add_product "Amazon Gift Card \$10" "Amazon.com gift card \$10" "10000000" "amazon-10"
add_product "Uber Eats \$15" "Uber Eats delivery credit \$15" "15000000" "uber-15"

echo ""
echo "=== Deployment Complete ==="
echo ""
echo "Save these values in your config files:"
echo "  PACKAGE_ID=$PACKAGE_ID"
echo "  SHOP_OBJECT_ID=$SHOP_ID"
echo "  ADMIN_CAP_ID=$ADMIN_CAP_ID"
echo "  MERCHANT_ADDRESS=$MERCHANT_ADDRESS"
echo ""
echo "Update:"
echo "  sui-shop/src/config/constants.ts"
echo "  sui-shop-agent/src/config.ts"
