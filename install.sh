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
# Remove any existing broken installation
npm uninstall -g codedock > /dev/null 2>&1 || true

# Install from the tarball
npm install -g "./$TARBALL"

# Clean up
rm "$TARBALL"

echo "✨ Installation successful!"
echo "Terminal: Type 'codedock' to launch the application."
