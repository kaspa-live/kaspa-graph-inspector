#!/bin/bash

set -e

# Build kaspa-graph-inspector
./docker-build.sh

# Start postgres
docker-compose up -d postgres

# Wait for postgres to finish initializing
sleep 10s

# Start processing, api, and web
docker-compose up -d processing
docker-compose up -d api
docker-compose up -d web

# Print logs for all services
docker-compose logs -f
