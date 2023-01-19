#!/bin/bash

# Usage: ./scripts/deploy.sh "<12-word seed of your polkadot account>"

set -euo pipefail


NODE_URL=wss://ws-smartnet.test.azero.dev
AUTHORITY_SEED="$1"

CONTRACTS_PATH=$(pwd)/contracts

function terminate_contract {
    # Parameters: (name, address)
    cd "$CONTRACTS_PATH"/"$1"
    cargo contract call \
        --quiet \
        --url "$NODE_URL" \
        --suri "$AUTHORITY_SEED" \
        --contract "$2" \
	    -m suicide
}


TOKEN_ADDRESS=$(cat "$CONTRACTS_PATH"/addresses.json | jq -r .token_address)
DATABASE_ADDRESS=$(cat "$CONTRACTS_PATH"/addresses.json | jq -r .database_address)
GOVERNOR_ADDRESS=$(cat "$CONTRACTS_PATH"/addresses.json | jq -r .governor_address)

terminate_contract "token" "$TOKEN_ADDRESS" && echo "Token contract terminated"
terminate_contract "database" "$DATABASE_ADDRESS" && echo "Database contract terminated"
terminate_contract "governor" "$GOVERNOR_ADDRESS" && echo "Governor contract terminated"
