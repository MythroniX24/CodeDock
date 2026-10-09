const chalk = require('chalk');
const inquirer = require('inquirer');
const Config = require('../core/config');
const { getTheme } = require('./theme');

// Components
function banner() {
  const pkg = require('../../package.json');
  const v = pkg.version || '1.0.0';
  const t = getTheme();
  
  console.log('');
  console.log(t.border('  ╭──────────────────────────────────────╮'));
  console.log(t.border('  │') + '  ' + t.secondary.bold('C O D E D O C K') + ' '.repeat(17 - v.length) + t.muted('v' + v) + '   ' + t.border('│'));
  console.log(t.border('  │') + '  ' + t.text('Termux Coding Tools Manager') + ' '.repeat(6) + t.border('│'));
  console.log(t.border('  ╰──────────────────────────────────────╯'));
  console.log('');
}

function toolStatusLine(tool, isInstalled) {
  const t = getTheme();
  const status = isInstalled ? t.success('[Installed]') : t.muted('[Available]');
  return `${status.padEnd(20)} ${t.text(tool.name)}`;
}

async function systemInfoBlock(envInfo) {
  const t = getTheme();
  
  console.log(t.border('╭─') + t.secondary(' System Info ') + t.border('────────────────────────╮'));
  console.log(t.border('│ ') + t.text('OS:     ') + t.primary(envInfo.os.padEnd(10)) + t.text(' Arch: ') + t.primary(envInfo.arch.padEnd(8)) + t.border('│'));
  console.log(t.border('│ ') + t.text('Termux: ') + (envInfo.isTermux ? t.success('Yes'.padEnd(10)) : t.error('No '.padEnd(10))) + t.text(' Pkg:  ') + t.primary((envInfo.packageManager || 'npm').padEnd(8)) + t.border('│'));
  console.log(t.border('╰──────────────────────────────────────╯\n'));
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

// Ensure autocomplete is registered
try {
  inquirer.registerPrompt('autocomplete', require('inquirer-autocomplete-prompt'));
} catch (e) {
  // Graceful degradation if plugin fails
}

async function autocompletePrompt(message, source) {
  const { selection } = await inquirer.prompt([{
    type: 'autocomplete',
    name: 'selection',
    message,
    source,
    pageSize: 15
  }]);
  return selection;
}

function progressBar(current, total, width = 20) {
  const t = getTheme();
  const percent = Math.min(1, current / total);
  const filled = Math.round(width * percent);
  const empty = width - filled;
  return t.primary('█'.repeat(filled)) + t.muted('░'.repeat(empty));
}

function box(content, width = 40) {
  const t = getTheme();
  const lines = content.split('\n');
  const top = t.border('┌' + '─'.repeat(width) + '┐');
  const bottom = t.border('└' + '─'.repeat(width) + '┘');
  
  console.log(top);
  lines.forEach(line => {
    const padLength = width - line.replace(/\u001b\[\d+m/g, '').length;
    console.log(t.border('│') + line + ' '.repeat(Math.max(0, padLength)) + t.border('│'));
  });
  console.log(bottom);
}

function divider(char = '─', width = 40) {
  const t = getTheme();
  console.log(t.border(char.repeat(width)));
}

module.exports = {
  banner,
  toolStatusLine,
  systemInfoBlock,
  confirmPrompt,
  selectPrompt,
  inputPrompt,
  autocompletePrompt,
  progressBar,
  box,
  divider
};
