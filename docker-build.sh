#!/bin/bash

set -e

# Verify that all the required environment variables are set
declare -A REQUIRED_VARIABLES
REQUIRED_VARIABLES["KASPAD_VERSION"]="${KASPAD_VERSION}"
REQUIRED_VARIABLES["API_ADDRESS"]="${API_ADDRESS}"
REQUIRED_VARIABLES["API_PORT"]="${API_PORT}"
REQUIRED_VARIABLES["KATNIP_ADDRESS"]="${KATNIP_ADDRESS}"
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

# Build processing
docker build -f processing/Dockerfile -t kaspa-graph-inspector-processing:latest --build-arg KASPAD_VERSION="${KASPAD_VERSION}" --build-arg KASPAD_REPOSITORY="${KASPAD_REPOSITORY}" processing

# Build api
docker build -f api/Dockerfile -t kaspa-graph-inspector-api:latest api

# Build web
REACT_APP_API_ADDRESS="${API_ADDRESS}:${API_PORT}"
REACT_APP_KATNIP_ADDRESS="${KATNIP_ADDRESS}"
REACT_APP_KASPA_LIVE_ADDRESS="${KASPA_LIVE_ADDRESS}"
docker build -f web/Dockerfile --build-arg REACT_APP_API_ADDRESS="${REACT_APP_API_ADDRESS}" --build-arg REACT_APP_KATNIP_ADDRESS="${REACT_APP_KATNIP_ADDRESS}" --build-arg REACT_APP_KASPA_LIVE_ADDRESS="${REACT_APP_KASPA_LIVE_ADDRESS}" --build-arg REACT_APP_EXPLORER_ADDRESS=explorer.kaspa.org -t kaspa-graph-inspector-web:latest web
