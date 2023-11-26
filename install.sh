#!/usr/bin/env bash
set -euo pipefail

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

# [Optional: Provide instructions for adding $bin_dir to PATH]

# Success message
success "aitdd was installed successfully"
