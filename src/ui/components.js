const chalk = require('chalk');
const inquirer = require('inquirer');
const { getTheme } = require('./theme');

// Components
function banner() {
  const pkg = require('../../package.json');
  const v = pkg.version || '1.0.0';
  const t = getTheme();
  const safeV = v.substring(0, 10);
  
  console.log('');
  console.log(t.border('  ╭──────────────────────────────────────────╮'));
  console.log(t.border('  │') + '  ' + t.secondary.bold('C O D E D O C K') + ' '.repeat(Math.max(0, 21 - safeV.length)) + t.muted('v' + safeV) + '  ' + t.border('│'));
  console.log(t.border('  │') + '  ' + t.text('Termux Coding Tools Manager') + ' '.repeat(12) + t.border('│'));
  console.log(t.border('  ╰──────────────────────────────────────────╯'));
}

function toolStatusLine(tool, isInstalled) {
  const t = getTheme();
  const label = isInstalled ? '[Installed]' : '[Available]';
  const paddedLabel = label.padEnd(20);
  const status = isInstalled ? t.success(paddedLabel) : t.muted(paddedLabel);
  return `${status} ${t.text(tool.name)}`;
}

async function systemInfoBlock(envInfo) {
  const t = getTheme();
  
  const osStr = String(envInfo.os || 'Unknown').substring(0, 11).padEnd(11);
  const archStr = String(envInfo.arch || 'Unknown').substring(0, 15).padEnd(15);
  const termuxStr = (envInfo.isTermux ? 'Yes' : 'No').padEnd(11);
  const pkgStr = String(envInfo.packageManager || 'npm').substring(0, 15).padEnd(15);
  
  console.log(t.border('  ╭─') + t.secondary(' System Info ') + t.border('────────────────────────────╮'));
  console.log(t.border('  │ ') + t.text('OS:     ') + t.primary(osStr) + t.text(' Arch: ') + t.primary(archStr) + t.border('│'));
  console.log(t.border('  │ ') + t.text('Termux: ') + (envInfo.isTermux ? t.success(termuxStr) : t.error(termuxStr)) + t.text(' Pkg:  ') + t.primary(pkgStr) + t.border('│'));
  console.log(t.border('  ╰──────────────────────────────────────────╯\n'));
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

let autocompleteRegistered = false;
try {
  inquirer.registerPrompt('autocomplete', require('inquirer-autocomplete-prompt'));
  autocompleteRegistered = true;
} catch (e) {
  // Graceful degradation if plugin fails
}

async function autocompletePrompt(message, source, rawChoices = []) {
  if (!autocompleteRegistered) {
    return selectPrompt(message, rawChoices.length ? rawChoices : await source(null, ''));
  }
  
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
  const w = Math.max(0, width);
  const percent = Math.max(0, Math.min(1, current / total));
  const filled = Math.round(w * percent);
  const empty = w - filled;
  return t.primary('█'.repeat(filled)) + t.muted('░'.repeat(empty));
}

function box(content, width = 40) {
  const t = getTheme();
  const w = Math.max(0, width);
  const lines = content.split('\n');
  const top = t.border('┌' + '─'.repeat(w) + '┐');
  const bottom = t.border('└' + '─'.repeat(w) + '┘');
  
  console.log(top);
  lines.forEach(line => {
    const padLength = w - line.replace(/\x1B\[[0-9;]*[mG]/g, '').length;
    console.log(t.border('│') + line + ' '.repeat(Math.max(0, padLength)) + t.border('│'));
  });
  console.log(bottom);
}

function divider(char = '─', width = 40) {
  const t = getTheme();
  console.log(t.border(char.repeat(Math.max(0, width))));
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
