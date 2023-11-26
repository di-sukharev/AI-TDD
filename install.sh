#!/usr/bin/env bash
set -euo pipefail

# Color codes and helper functions
Color_Off='\033[0m' # Text Reset
Red='\033[0;31m'   # Red
Green='\033[0;32m' # Green
Dim='\033[0;2m'    # White (Dimmed)
Bold_White='\033[1m'    # Bold White
Bold_Green='\033[1;32m' # Bold Green

error() {
    echo -e "${Red}error${Color_Off}:" "$@" >&2
    exit 1
}

info() {
    echo -e "${Dim}$@ ${Color_Off}"
}

info_bold() {
    echo -e "${Bold_White}$@ ${Color_Off}"
}

success() {
    echo -e "${Green}$@ ${Color_Off}"
}

# Check for bun
command -v bun >/dev/null || error 'bun is required to run aitdd. Please install bun first.'

# Define the GitHub repository URL and download URL for your CLI
github_repo="https://github.com/di-sukharev/AI-TDD"
aitdd_uri="$github_repo/releases/latest/download/out.zip"

# Define the installation directory and executable
install_dir=${HOME}/.aitdd
bin_dir=$install_dir/bin
exe=$bin_dir/aitdd

# Create the installation directory if it doesn't exist
mkdir -p "$bin_dir" || error "Failed to create install directory \"$bin_dir\""

# Download and extract your CLI files
curl --fail --location --output "$exe.zip" "$aitdd_uri" || error "Failed to download aitdd from \"$aitdd_uri\""
unzip -oqd "$install_dir" "$exe.zip" || error 'Failed to extract aitdd'

# Create the aitdd wrapper command
cat <<EOF >"$exe"
#!/usr/bin/env bash
set -euo pipefail
bun $install_dir/cli.js "\$@"
EOF

# Make the wrapper executable
chmod +x "$exe" || error 'Failed to set permissions on aitdd executable'

# Update shell configuration to include aitdd in PATH
update_path() {
    local config_file=$1
    echo -e "\n# ai-tdd\nexport AI_TDD_INSTALL=\"$install_dir\"\nexport PATH=\"\$AI_TDD_INSTALL/bin:\$PATH\"" >> "$config_file"
    success "Updated $config_file with ai-tdd PATH"
}

# Detect the user's shell and update the corresponding configuration file
case "${SHELL##*/}" in
fish)
    update_path "$HOME/.config/fish/config.fish"
    ;;
zsh)
    update_path "$HOME/.zshrc"
    ;;
bash)
    update_path "$HOME/.bashrc"
    update_path "$HOME/.bash_profile"
    ;;
*)
    echo "Your shell (${SHELL##*/}) is not explicitly supported for automatic PATH update."
    echo "Please add $bin_dir to your PATH manually."
    ;;
esac

# Final success message
success "aitdd was installed successfully. Please restart your terminal or source your shell config for the changes to take effect."
