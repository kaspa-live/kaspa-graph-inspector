#!/bin/bash

set -e

# Verify that all the required environment variables are set
declare -A REQUIRED_VARIABLES
REQUIRED_VARIABLES["POSTGRES_USER"]="${POSTGRES_USER}"
REQUIRED_VARIABLES["POSTGRES_PASSWORD"]="${POSTGRES_PASSWORD}"
REQUIRED_VARIABLES["POSTGRES_DB"]="${POSTGRES_DB}"
REQUIRED_VARIABLES["KASPAD_ADDRESS"]="${KASPAD_ADDRESS}"

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

# Build the node image
docker build -f node/Dockerfile -t kaspa-dag-visualizer-node:latest .

# Start postgres
docker-compose up -d postgres

# Wait for postgres to finish initializing
sleep 10s

# Start the node
docker-compose up -d kaspa-dag-visualizer-node

# Print logs for all services
docker-compose logs -f
