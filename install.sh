#!/bin/bash

# Function to install bun
install_bun() {
    echo "Installing bun..."
    curl -fsSL https://bun.sh/install | bash
}

# Check if bun is installed and install it if it isn't
if ! command -v bun &> /dev/null; then
    install_bun
else
    echo "bun is installed. continue."
fi

# Assuming the_file.ts is in the same directory as this script
SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &> /dev/null && pwd)
CLI_FILE="$SCRIPT_DIR/the_file.ts"

# Create a symbolic link to run the TypeScript file using bun
ln -sf "$CLI_FILE" /usr/local/bin/aitdd
