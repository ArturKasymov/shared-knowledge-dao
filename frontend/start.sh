#!/bin/bash

if [[ $(pwd) != *frontend ]]
then
    echo "Please launch the script from frontend/ dir"
    exit 1
fi

REACT_APP_PROVIDER_URL="wss://ws-smartnet.test.azero.dev" npm start &
