#!/bin/bash

set -e

# Verify that all the required environment variables are set
declare -A REQUIRED_VARIABLES
REQUIRED_VARIABLES["POSTGRES_USER"]="${POSTGRES_USER}"
REQUIRED_VARIABLES["POSTGRES_PASSWORD"]="${POSTGRES_PASSWORD}"
REQUIRED_VARIABLES["POSTGRES_DB"]="${POSTGRES_DB}"
REQUIRED_VARIABLES["API_ADDRESS"]="${API_ADDRESS}"
REQUIRED_VARIABLES["KATNIP_ADDRESS"]="${KATNIP_ADDRESS}"
REQUIRED_VARIABLES["API_PORT"]="${API_PORT}"
REQUIRED_VARIABLES["WEB_PORT"]="${WEB_PORT}"
REQUIRED_VARIABLES["KASPAD_VERSION"]="${KASPAD_VERSION}"
REQUIRED_VARIABLES["KASPA_LIVE_ADDRESS"]="${KASPA_LIVE_ADDRESS}"

REQUIRED_VARIABLE_NOT_SET=false
for REQUIRED_VARIABLE_NAME in "${!REQUIRED_VARIABLES[@]}"; do
  if [ -z "${REQUIRED_VARIABLES[$REQUIRED_VARIABLE_NAME]}" ]; then
    echo "${REQUIRED_VARIABLE_NAME} is not set";
    REQUIRED_VARIABLE_NOT_SET=true
    fi
done

if [ true = "${REQUIRED_VARIABLE_NOT_SET}" ]; then
  echo
  echo "The following environment variables are required:"
  for REQUIRED_VARIABLE_NAME in "${!REQUIRED_VARIABLES[@]}"; do
    echo "${REQUIRED_VARIABLE_NAME}"
  done
  exit 1
fi

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
