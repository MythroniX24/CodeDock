# CodeDock
All-in-one manager for coding/AI CLI tools on Termux.

## Features
- Manage and install popular AI CLI tools directly from Termux.
- Verified installation methods for Termux architectures.
- Easy to use CLI interface.

## Quick Start
```bash
# Using npm
npm install -g codedock
codedock

# Using Installer
curl -fsSL https://raw.githubusercontent.com/MythroniX24/CodeDock/main/install.sh | bash
```

## Supported Tools
- Claude Code (@anthropic-ai/claude-code)
- OpenAI Codex CLI (@openai/codex)
- Google Gemini CLI (@google/gemini-cli)
- Antigravity CLI (agy)
- OpenCode (opencode-ai)
- Codebuff (codebuff)

## Usage
Run `codedock` to launch the interactive prompt.

## Adding New Tools
Create a new folder in `tools/` with a `manifest.json` using the unified schema.

## License
MIT License. See LICENSE for details.
