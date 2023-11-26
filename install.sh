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

# Function to update PATH in the shell configuration file
update_path() {
    local shell_config=$1
    if [[ -w $shell_config ]]; then
        echo -e "\n# aitdd tool" >> "$shell_config"
        echo "export PATH=\"$BIN_DIR:\$PATH\"" >> "$shell_config"
        info "Added $BIN_DIR to PATH in $shell_config"
    else
        info "Please add $BIN_DIR to your PATH manually. Edit $shell_config and add:"
        info "export PATH=\"$BIN_DIR:\$PATH\""
    fi
}

# Update PATH in the user's shell configuration file
case $(basename "$SHELL") in
    bash)
        update_path "$HOME/.bashrc"
        ;;
    zsh)
        update_path "$HOME/.zshrc"
        ;;
    fish)
        # Fish shell has a different syntax for PATH update
        if [[ -w $HOME/.config/fish/config.fish ]]; then
            echo -e "\n# aitdd tool" >> "$HOME/.config/fish/config.fish"
            echo "set -gx PATH \"$BIN_DIR\" \$PATH" >> "$HOME/.config/fish/config.fish"
            info "Added $BIN_DIR to PATH in $HOME/.config/fish/config.fish"
        else
            info "Please add $BIN_DIR to your PATH manually. For Fish shell, edit $HOME/.config/fish/config.fish and add:"
            info "set -gx PATH \"$BIN_DIR\" \$PATH"
        fi
        ;;
    *)
        info "Could not detect the shell automatically. Please add $BIN_DIR to your PATH manually."
        ;;
esac

# Direct Execution Check
if [[ ":$PATH:" != *":$BIN_DIR:"* ]]; then
    export PATH="$BIN_DIR:$PATH"
fi

if command -v aitdd >/dev/null; then
    info "aitdd tool installed successfully and is available in your PATH."
else
    info "Installation complete, but the aitdd tool is not in your PATH. Please restart your shell or source your shell configuration file."
fi
