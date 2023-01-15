#!/bin/bash

if [[ $(pwd) != *frontend ]]
then
    echo "Please launch the script from frontend/ dir"
    exit 1
fi

function error {
    echo -e "[ERROR] $*"
    exit 1
}

mkdir -p ./src/metadata
cp ../contracts/addresses.json ./src/metadata || error "Please deploy the contracts first (addresses.json not found)"
cp ../contracts/token/target/ink/metadata.json ./src/metadata/token_metadata.json || error "Please build Token contract first (metadata.json not found)"
cp ../contracts/database/target/ink/metadata.json ./src/metadata/database_metadata.json || error "Please build Database contract first (metadata.json not found)"
cp ../contracts/governor/target/ink/metadata.json ./src/metadata/governor_metadata.json || error "Please build Governor contract first (metadata.json not found)"


REACT_APP_PROVIDER_URL="wss://ws.test.azero.dev" npm start &
