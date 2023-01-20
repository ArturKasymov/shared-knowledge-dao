#!/bin/bash

docker run -it --rm -v $(cd ../contracts; pwd):/workspace shared_knowledge_dao_contracts:latest bash