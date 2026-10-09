#!/bin/bash

# CodeDock Universal Installer
# This script ensures CodeDock installs correctly even on Android FAT32/exFAT storage
# where 'chmod +x' is blocked, bypassing the "Permission Denied" issue.

set -e

echo "🚀 Starting CodeDock Installation..."

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ Error: npm is not installed. Please install nodejs first."
    exit 1
fi

echo "📦 Packing CodeDock..."
# We use npm pack to create a tarball. 
# Installing from a tarball forces NPM to COPY the files instead of creating a symlink
# to the local directory (which breaks on Android storage due to permissions).
TARBALL=$(npm pack --quiet)

echo "⚙️  Installing globally..."
# Universally prevent "ENOTEMPTY", "EPERM", or "ENOTDIR" npm staging bugs
# by forcefully purging the old directory before installing the new one.
if [ -n "$PREFIX" ]; then
    if [ -d "$PREFIX/lib/node_modules/codedock" ] || [ -L "$PREFIX/lib/node_modules/codedock" ]; then
        rm -rf "$PREFIX/lib/node_modules/codedock"
    fi
elif [ -d "/usr/local/lib/node_modules/codedock" ] || [ -L "/usr/local/lib/node_modules/codedock" ]; then
    rm -rf "/usr/local/lib/node_modules/codedock"
fi

npm uninstall -g codedock > /dev/null 2>&1 || true

# Install from the tarball
npm install -g "./$TARBALL"

# Clean up
rm "$TARBALL"

# Fix shebangs on Termux (prevents "bad interpreter" errors)
if command -v termux-fix-shebang &> /dev/null; then
    echo "🔧 Fixing Termux shebangs..."
    termux-fix-shebang $(command -v codedock) || true
fi

echo "✨ Installation successful!"
echo "Terminal: Type 'codedock' to launch the application."
