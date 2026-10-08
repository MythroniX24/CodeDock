const logger = require('../core/logger');
const chalk = require('chalk');

async function help() {
  console.log(`
${chalk.bold.blue('CodeDock')} - Termux Coding Tools Manager

${chalk.bold('USAGE')}
  $ codedock [command] [options]

${chalk.bold('COMMANDS')}
  ${chalk.green('install')} <tool>   Install a specific tool
  ${chalk.green('uninstall')} <tool> Uninstall a tool
  ${chalk.green('update')} [tool]    Update a specific tool or all tools
  ${chalk.green('list')}             List all available and installed tools
  ${chalk.green('status')}           Show system and environment status
  ${chalk.green('doctor')}           Run comprehensive system diagnostics
  ${chalk.green('open')} <tool>      Open a project with a specific tool
  ${chalk.green('projects')}         Manage recent projects
  ${chalk.green('help')}             Show this help message

${chalk.bold('OPTIONS')}
  -h, --help       Show help
  -v, --version    Show version number
  -y, --yes        Auto-confirm prompts
  --verbose        Enable verbose output

${chalk.bold('EXAMPLES')}
  $ codedock                  # Launch interactive dashboard
  $ codedock install vscode   # Install code-server
  $ codedock doctor           # Check system health
`);
}

module.exports = help;
