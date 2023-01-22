#!/bin/bash

# Usage: ./scripts/deploy.sh "<12-word seed of your polkadot account>"

set -euo pipefail

TOKEN_CODE_HASH=""
TOKEN_ADDRESS=""

DATABASE_CODE_HASH=""
DATABASE_ADDRESS=""

GOVERNOR_CODE_HASH=""
GOVERNOR_ADDRESS=""

function get_timestamp {
    echo "$(date +'%Y-%m-%d %H:%M:%S')"
}

function error {
    echo -e "[$(get_timestamp)] [ERROR] $*"
    exit 1
}

function log_progress {
    bold=$(tput bold)
    normal=$(tput sgr0)
    echo "[$(get_timestamp)] [INFO] ${bold}${1}${normal}"
}


NODE_URL=wss://ws-smartnet.test.azero.dev
AUTHORITY_SEED="$1"

CONTRACTS_PATH=$(pwd)/contracts
FRONTEND_PATH=$(pwd)/frontend

function build_contract {
    cd "$CONTRACTS_PATH"/"$1" 
    cargo +nightly contract build --release --quiet 1> /dev/null #2> /dev/null
}

function deploy_contract {
    cd "$CONTRACTS_PATH"/"$1"
    cargo contract upload --quiet --url "$NODE_URL" --suri "$AUTHORITY_SEED" target/ink/"$1".wasm 1> /dev/null #2> /dev/null
    local code_hash=$(cat target/ink/metadata.json | jq -rc .source.hash)
    echo "$code_hash"
}

function deploy_token_contract {
    TOKEN_CODE_HASH=$(deploy_contract "token")
    echo "Token code hash: ${TOKEN_CODE_HASH}"
}

function deploy_database_contract {
    DATABASE_CODE_HASH=$(deploy_contract "database")
    echo "Database code hash: ${DATABASE_CODE_HASH}"
}

function deploy_governor_contract {
    GOVERNOR_CODE_HASH=$(deploy_contract "governor")
    echo "Governor code hash: ${GOVERNOR_CODE_HASH}"
}

function instantiate_governor_contract {
    cd "$CONTRACTS_PATH"/governor
    result=$(cargo contract instantiate \
        --url "$NODE_URL" \
        --suri "$AUTHORITY_SEED" \
        --code-hash "$GOVERNOR_CODE_HASH" \
        --constructor new \
	      --args 0 "[5G6Mx3WvwaxMCDv6fGEEtGDuFy6P6NozQcXGesde8dc1W6D1, 5H3L1ivDSCnFbYgvoBbugqMJMU9AKVovn1njLapYumugnAq4]" \
          25 100 "$TOKEN_CODE_HASH" "$DATABASE_CODE_HASH")
    
    if [ -n "$result" ]; then
        echo "$result" > governor.out
    fi

    GOVERNOR_ADDRESS=$(echo "$result" | grep -A2 "Event Contracts ➜ Instantiated" | grep contract | tail -1 | cut -d ' ' -f12)
    echo "Governor address: ${GOVERNOR_ADDRESS}"

    result=$(cargo contract call \
        --url "$NODE_URL" \
        --suri "$AUTHORITY_SEED" \
        --contract "$GOVERNOR_ADDRESS" \
	--dry-run \
	-m get_database)
    
    if [ -n "$result" ]; then
        echo "$result" > "$CONTRACTS_PATH"/database/database.out
    fi
    
    DATABASE_ADDRESS=$(echo "$result" | grep Data | grep -Poe "Some\(\K[a-zA-Z0-9]+")
    echo "Database address: ${DATABASE_ADDRESS}"
    
    result=$(cargo contract call \
        --url "$NODE_URL" \
        --suri "$AUTHORITY_SEED" \
        --contract "$GOVERNOR_ADDRESS" \
	--dry-run \
	-m get_token)
    
    if [ -n "$result" ]; then
        echo "$result" > "$CONTRACTS_PATH"/database/database.out
    fi
    
    TOKEN_ADDRESS=$(echo "$result" | grep Data | grep -Poe "Some\(\K[a-zA-Z0-9]+")
    echo "Token address: ${TOKEN_ADDRESS}"
}

log_progress "Building Token contract"
build_contract "token" || error "Failed to build the contract"

log_progress "Building Database contract"
build_contract "database" || error "Failed to build the contract"

log_progress "Building Governor contract"
build_contract "governor" || error "Failed to build the contract"

log_progress "Deploying Token contract"
deploy_token_contract || error "Failed to deploy contract"

log_progress "Deploying Database contract"
deploy_database_contract || error "Failed to deploy contract"

log_progress "Deploying Governor contract"
deploy_governor_contract || error "Failed to deploy contract"

log_progress "Instantiating Governor contract"
instantiate_governor_contract || error "Failed to instantiate contract"

cd "$CONTRACTS_PATH"
jq -n \
    --arg token_code_hash "${TOKEN_CODE_HASH}" \
    --arg token_address "${TOKEN_ADDRESS}" \
    --arg database_code_hash "${DATABASE_CODE_HASH}" \
    --arg database_address "${DATABASE_ADDRESS}" \
    --arg governor_code_hash "${GOVERNOR_CODE_HASH}" \
    --arg governor_address "${GOVERNOR_ADDRESS}" \
    '{
        "token_code_hash" : $token_code_hash,
        "token_address" : $token_address,
        "database_code_hash" : $database_code_hash,
        "database_address" : $database_address,
        "governor_code_hash" : $governor_code_hash,
        "governor_address" : $governor_address
    }' > addresses.json

log_progress "Finished initialization. See addresses in $(pwd)/addresses.json"

log_progress "Copying metadata to frontend/..."

mkdir -p "$FRONTEND_PATH"/src/metadata
cp "$CONTRACTS_PATH"/addresses.json "$FRONTEND_PATH"/src/metadata || error "Please deploy the contracts first (addresses.json not found)"
cp "$CONTRACTS_PATH"/token/target/ink/metadata.json "$FRONTEND_PATH"/src/metadata/token_metadata.json || error "Please build Token contract first (metadata.json not found)"
cp "$CONTRACTS_PATH"/database/target/ink/metadata.json "$FRONTEND_PATH"/src/metadata/database_metadata.json || error "Please build Database contract first (metadata.json not found)"
cp "$CONTRACTS_PATH"/governor/target/ink/metadata.json "$FRONTEND_PATH"/src/metadata/governor_metadata.json || error "Please build Governor contract first (metadata.json not found)"
