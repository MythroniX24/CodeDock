const chalk = require('chalk');
const inquirer = require('inquirer');
const Config = require('../core/config');

// Components
function banner() {
  const pkg = require('../../package.json');
  console.log(chalk.blue.bold(`
  ██████╗ ██████╗ ██████╗ ███████╗██████╗  ██████╗  ██████╗███╗   ██╗
 ██╔════╝██╔═══██╗██╔══██╗██╔════╝██╔══██╗██╔═══██╗██╔════╝████╗  ██║
 ██║     ██║   ██║██║  ██║█████╗  ██║  ██║██║   ██║██║     ██╔██╗ ██║
 ██║     ██║   ██║██║  ██║██╔══╝  ██║  ██║██║   ██║██║     ██║╚██╗██║
 ╚██████╗╚██████╔╝██████╔╝███████╗██████╔╝╚██████╔╝╚██████╗██║ ╚████║
  ╚═════╝ ╚═════╝ ╚═════╝ ╚══════╝╚═════╝  ╚═════╝  ╚═════╝╚═╝  ╚═══╝
  `));
  console.log(chalk.gray(`  Termux Coding Tools Manager v${pkg.version || '1.0.0'}\n`));
}

function toolStatusLine(tool, isInstalled) {
  const status = isInstalled ? chalk.green('[Installed]') : chalk.gray('[Available]');
  return `${status.padEnd(20)} ${tool.name}`;
}

async function systemInfoBlock(envInfo) {
  console.log(chalk.bold('System Info:'));
  console.log(`  OS: ${envInfo.os} | Arch: ${envInfo.arch}`);
  console.log(`  Termux: ${envInfo.isTermux ? chalk.green('Yes') : chalk.red('No')}\n`);
}

async function confirmPrompt(message) {
  const { confirm } = await inquirer.prompt([{
    type: 'confirm',
    name: 'confirm',
    message,
    default: true
  }]);
  return confirm;
}

async function selectPrompt(message, choices) {
  const { selection } = await inquirer.prompt([{
    type: 'list',
    name: 'selection',
    message,
    choices,
    pageSize: 10
  }]);
  return selection;
}

async function inputPrompt(message, defaultVal = '') {
  const { input } = await inquirer.prompt([{
    type: 'input',
    name: 'input',
    message,
    default: defaultVal
  }]);
  return input;
}

function progressBar(current, total, width = 20) {
  const percent = Math.min(1, current / total);
  const filled = Math.round(width * percent);
  const empty = width - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}

function box(content, width = 40) {
  const lines = content.split('\n');
  const top = '┌' + '─'.repeat(width) + '┐';
  const bottom = '└' + '─'.repeat(width) + '┘';
  
  console.log(top);
  lines.forEach(line => {
    const padLength = width - line.replace(/\u001b\[\d+m/g, '').length;
    console.log(`│${line}${ ' '.repeat(Math.max(0, padLength))}│`);
  });
  console.log(bottom);
}

function divider(char = '─', width = 40) {
  console.log(chalk.gray(char.repeat(width)));
}

module.exports = {
  banner,
  toolStatusLine,
  systemInfoBlock,
  confirmPrompt,
  selectPrompt,
  inputPrompt,
  progressBar,
  box,
  divider
};
