#!/bin/bash

set -e

######
# DB #
######

export POSTGRES_USER=${POSTGRES_USER-kgi}
# POSTGRES_PASSWORD is required
export POSTGRES_DB=${POSTGRES_DB-kgi}
export POSTGRES_HOST=${POSTGRES_HOST-"localhost"}
export POSTGRES_PORT=${POSTGRES_PORT-"5433"}

##############
# Processing #
##############

export KASPAD_REPOSITORY=${KASPAD_REPOSITORY-"github.com/kaspanet/kaspad"}
export KASPAD_VERSION=${KASPAD_VERSION-"latest"}
export KGI_RPCSERVER=${KGI_RPCSERVER-"localhost"}
export KGI_NETWORK=${KGI_NETWORK-""} # accepted values ["", "testnet", "simnet", "devnet"]
export KGI_NETWORK_SUFFIX=${KGI_NETWORK_SUFFIX-""} # accepted values: number, only if KGI_NETWORK=="testnet"
export KGI_POSTGRES_MOUNT=${KGI_POSTGRES_MOUNT-"~/.kgi-postgres"}

#######
# API #
#######

export API_ADDRESS=${API_ADDRESS-"localhost"} # provide a public host or ip for a deployment (ie: "kaspa.live")
export API_PORT=${API_PORT-"4575"}

#######
# Web #
#######

export KASPA_LIVE_ADDRESS=${KASPA_LIVE_ADDRESS-"localhost"} # provide a public host or ip for a deployment (ie: "kaspa.live")
export WEB_PORT=${WEB_PORT-"8080"}
# EXPLORER_ADDRESS is optional with default depending on KGI_NETWORK and KGI_NETWORK_SUFFIX


# Verify that all the required environment variables are set
declare -A REQUIRED_VARIABLES
REQUIRED_VARIABLES["POSTGRES_USER"]="${POSTGRES_USER}"
REQUIRED_VARIABLES["POSTGRES_PASSWORD"]="${POSTGRES_PASSWORD}"
REQUIRED_VARIABLES["POSTGRES_DB"]="${POSTGRES_DB}"
REQUIRED_VARIABLES["POSTGRES_HOST"]="${POSTGRES_HOST}"
REQUIRED_VARIABLES["POSTGRES_PORT"]="${POSTGRES_PORT}"
REQUIRED_VARIABLES["KASPAD_VERSION"]="${KASPAD_VERSION}"
REQUIRED_VARIABLES["API_ADDRESS"]="${API_ADDRESS}"
REQUIRED_VARIABLES["API_PORT"]="${API_PORT}"
REQUIRED_VARIABLES["WEB_PORT"]="${WEB_PORT}"
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

# Checks the processing network variables and creates KGI_NETWORK_ARGS based on those
# If unset/empty, defines EXPLORER_ADDRESS according to the network variables
if [ -z "${KGI_NETWORK}" ]; then
  export EXPLORER_ADDRESS=${EXPLORER_ADDRESS-"explorer.kaspa.org"}
elif [ "testnet" == "${KGI_NETWORK}" ]; then
  if [ -z "${KGI_NETWORK_SUFFIX}" ]; then
    echo "On testnet, the network suffix is mandatory. Set KGI_NETWORK_SUFFIX"
    exit 1
  fi
  export KGI_NETWORK_ARGS=${KGI_NETWORK_ARGS-"--testnet --netsuffix=${KGI_NETWORK_SUFFIX}"}
  export EXPLORER_ADDRESS=${EXPLORER_ADDRESS-"explorer-tn${KGI_NETWORK_SUFFIX}.kaspa.org"}
elif [ "simnet"  == "${KGI_NETWORK}" ]; then
  export KGI_NETWORK_ARGS=${KGI_NETWORK_ARGS-"--simnet"}
  export EXPLORER_ADDRESS=${EXPLORER_ADDRESS-"localhost"}
elif [ "devnet"  == "${KGI_NETWORK}" ]; then
  export KGI_NETWORK_ARGS=${KGI_NETWORK_ARGS-"--devnet"}
  export EXPLORER_ADDRESS=${EXPLORER_ADDRESS-"localhost"}
fi

# Build kaspa-graph-inspector
./docker-build.sh

function docker_compose() {
    if ! command -v docker-compose &> /dev/null
    then
      docker compose "$@"
    else
      docker-compose "$@"
    fi
}

# Start postgres
docker_compose up -d persistent-postgres

# Start processing, api, and web
docker_compose up -d processing
docker_compose up -d api
docker_compose up -d web

# Print logs for all services
docker_compose logs -f
