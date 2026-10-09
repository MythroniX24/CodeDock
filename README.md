# 🚀 CodeDock

**The Universal AI Coding Tools Manager for Termux, Linux, Windows, & macOS**

[![NPM Version](https://img.shields.io/npm/v/codedock?color=blue)](https://www.npmjs.com/package/codedock)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

CodeDock is an all-in-one CLI application designed to securely install, manage, and launch modern AI coding assistants natively across all major platforms. Whether you are using a full desktop OS or hacking away on Android via Termux, CodeDock handles the heavy lifting of dependencies, architectures, and system compatibility.

---

## ✨ Key Features

- 🌍 **Cross-Platform by Default**: Seamlessly detects and operates on Windows (via `winget`/`choco`), macOS (`brew`), Linux (`apt`/`dnf`/`pacman`), and Termux (`pkg`).
- 🤖 **Native Proot Subsystem for Termux**: For native Linux binaries (like OpenCode & Antigravity) that require GNU `glibc`, CodeDock automatically sets up an isolated `proot-distro` Ubuntu environment in Termux and binds your projects seamlessly! *(Only triggers on Termux; Linux and Windows run at native speed)*.
- 🧠 **Smart Auto-Detect**: Already installed your tools via standard `npm` or `apt`? CodeDock instantly auto-detects externally installed tools and syncs them to your dashboard without reinstalling.
- 🎨 **Beautiful Interactive UI**: A clean, responsive CLI dashboard that fits perfectly on both ultra-wide monitors and narrow mobile portrait screens.
- 📁 **Project Management**: Safely initialize and store recent projects. Open AI tools directly into your selected codebase with one click.
- 🏥 **CodeDock Doctor**: Built-in system diagnostics to verify your dependencies (Node, Git, Python, Curl) and ensure your tools are fully functional.

## 📦 Installation

**Method 1: Direct NPM (Recommended)**
```bash
npm install -g MythroniX24/CodeDock
```

**Method 2: Standalone Shell Installer**
```bash
curl -fsSL https://raw.githubusercontent.com/MythroniX24/CodeDock/main/install.sh | bash
```

## 🛠 Supported AI Tools Out of the Box

| Tool | ID | Description |
| --- | --- | --- |
| **Claude Code** | `claude` | Anthropic's official AI coding agent |
| **OpenAI Codex**| `codex` | OpenAI Codex CLI |
| **Gemini CLI**  | `gemini` | Google Gemini CLI agent |
| **Codebuff**    | `codebuff` | Powerful AI codebase builder |
| **OpenCode**    | `opencode` | OpenCode AI Assistant |
| **Antigravity** | `antigravity`| Google's Antigravity CLI |

*Need more? You can easily add new tools by creating a `manifest.json` in the `/tools` directory!*

## 🕹 Usage Commands

Launch the **Interactive UI Dashboard** anytime by just typing:
```bash
codedock
```

Or use direct commands for quick operations:
```bash
codedock list               # List all available and installed tools
codedock install <tool>     # Install a specific tool (e.g., codedock install claude)
codedock update <tool>      # Update a tool to the latest version
codedock open <tool>        # Open a project folder with a specific tool
codedock doctor             # Check system health & dependencies
codedock uninstall <tool>   # Safely remove a tool
```

## 🏗 Architecture & Design Principles

- **Zero Telemetry & No Registration**: CodeDock respects your privacy. It works 100% offline and requires no account.
- **Additive Updates**: CodeDock will never randomly delete your directories or mess with your `.env` files.
- **Fail-Safe Validation**: Tools are verified automatically upon installation to guarantee the binaries are executable before marking them as "✓ Installed".

## 📜 License

[MIT License](LICENSE) © MythroniX24
