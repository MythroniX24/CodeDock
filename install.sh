#!/bin/bash
set -e

echo "Starting CodeDock bootstrap installation..."

# Detect Termux
if [ -n "$TERMUX_VERSION" ] || command -v pkg &> /dev/null; then
    echo "Termux detected. Checking dependencies..."
    pkg update -y
    pkg install -y nodejs git curl
else
    echo "Warning: This installer is primarily designed for Termux."
fi

# Clone the repository
REPO_URL="https://github.com/MythroniX24/CodeDock.git"
CLONE_DIR="$HOME/CodeDock"

if [ -d "$CLONE_DIR" ]; then
    echo "Directory $CLONE_DIR already exists. Updating..."
    cd "$CLONE_DIR"
    git pull
else
    echo "Cloning CodeDock repository..."
    git clone "$REPO_URL" "$CLONE_DIR"
    cd "$CLONE_DIR"
fi

# Install dependencies globally
echo "Installing CodeDock via npm..."
npm install -g .

# Verify installation
if command -v codedock &> /dev/null; then
    echo ""
    echo "✅ CodeDock installed successfully!"
    echo "Run 'codedock' in your terminal to start the manager."
else
    echo "⚠️ Installation finished, but 'codedock' command not found in PATH."
    echo "Ensure your global npm bin directory is in your PATH."
fi
