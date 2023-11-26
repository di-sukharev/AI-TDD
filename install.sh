#!/usr/bin/env bash
set -euo pipefail

# Reset
Color_Off=''

# Regular Colors
Red=''
Green=''
Dim='' # White

# Bold
Bold_White=''
Bold_Green=''

if [[ -t 1 ]]; then
    # Reset
    Color_Off='\033[0m' # Text Reset

    # Regular Colors
    Red='\033[0;31m'   # Red
    Green='\033[0;32m' # Green
    Dim='\033[0;2m'    # White

    # Bold
    Bold_Green='\033[1;32m' # Bold Green
    Bold_White='\033[1m'    # Bold White
fi

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

# [Initialize color codes and helper functions as in bun.sh]

# Check for bun
command -v bun >/dev/null ||
    error 'bun is required to run aitdd. Please install bun first.'

# Define the GitHub repository URL
github_repo="https://github.com/di-sukharev/AI-TDD"

# Construct the download URL for your CLI
# Modify this URL to point to the specific release or directory containing cli.ts
aitdd_uri="$github_repo/releases/latest/download/out.zip"

# Define the installation directory
install_dir=${HOME}/.aitdd
bin_dir=$install_dir/bin
exe=$bin_dir/aitdd

# Create the installation directory if it doesn't exist
mkdir -p "$bin_dir" ||
    error "Failed to create install directory \"$bin_dir\""

# Download and extract your CLI files
curl --fail --location --output "$exe.zip" "$aitdd_uri" ||
    error "Failed to download aitdd from \"$aitdd_uri\""

unzip -oqd "$install_dir" "$exe.zip" ||
    error 'Failed to extract aitdd'

# Create the aitdd wrapper command
cat <<EOF >"$exe"
#!/usr/bin/env bash
set -euo pipefail
bun $install_dir/cli.js "\$@"
EOF

# Make the wrapper executable
chmod +x "$exe" ||
    error 'Failed to set permissions on aitdd executable'

export PATH="$bin_dir:$PATH"

# Success message
success "aitdd was installed successfully"
