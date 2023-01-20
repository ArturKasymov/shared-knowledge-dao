#!/bin/bash

docker run -t --rm shared_knowledge_dao_contracts:latest bash -c "
(cd token && cargo +nightly test)
(cd database && cargo +nightly test)
(cd governor && cargo +nightly test)
"