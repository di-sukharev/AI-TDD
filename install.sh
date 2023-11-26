#!/bin/bash

# Function to print error messages in red
error() {
    echo -e "\033[0;31merror:\033[0m $1" >&2
    exit 1
}

# Function to print information in dim color
info() {
    echo -e "\033[0;2m$1\033[0m"
}

# Function to install bun
install_bun() {
    info "Installing bun..."
    curl -fsSL https://bun.sh/install | bash
}

# Check for bun and install if not present
if ! command -v bun &> /dev/null; then
    install_bun
else
    info "bun is already installed. Good. Continue."
fi

# Define installation directory
BIN_DIR="$HOME/.local/bin"
mkdir -p "$BIN_DIR"

# Create a symbolic link to the CLI tool
SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &> /dev/null && pwd)
CLI_FILE="$SCRIPT_DIR/cli.ts"
ln -sf "$CLI_FILE" "$BIN_DIR/aitdd"

# Detect the shell and update the corresponding configuration file
SHELL_NAME=$(basename "$SHELL")
case "$SHELL_NAME" in
    bash)
        SHELL_CONFIG="$HOME/.bashrc"
        ;;
    zsh)
        SHELL_CONFIG="$HOME/.zshrc"
        ;;
    fish)
        SHELL_CONFIG="$HOME/.config/fish/config.fish"
        ;;
    *)
        SHELL_CONFIG=""
        ;;
esac

# Update PATH in the user's shell configuration file
if [[ -n $SHELL_CONFIG && -w $SHELL_CONFIG ]]; then
    if ! grep -q "$BIN_DIR" "$SHELL_CONFIG"; then
        if [[ "$SHELL_NAME" == "fish" ]]; then
            echo "set -gx PATH \"$BIN_DIR\" \$PATH" >> "$SHELL_CONFIG"
        else
            echo "export PATH=\"$BIN_DIR:\$PATH\"" >> "$SHELL_CONFIG"
        fi
        info "Added $BIN_DIR to PATH in $SHELL_CONFIG"
    fi
else
    info "Could not update PATH automatically. Please add $BIN_DIR to your PATH manually."
fi

# Refresh environment (this won't affect the parent shell)
export PATH="$BIN_DIR:$PATH"

# Check if the tool is available in the PATH
if command -v aitdd &> /dev/null; then
    info "aitdd tool installed successfully and is available in your PATH."
else
    info "Installation complete, but the aitdd tool is not in your PATH. Please restart your shell or source your shell configuration file."
fi
