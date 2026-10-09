'use strict';

const ToolManager = require('../tools/manager');
const chalk = require('chalk');

async function list(flags) {
  const toolManager = new ToolManager();
  const tools = await toolManager.getAllTools();
  // Sort alphabetically
  tools.sort((a, b) => a.name.localeCompare(b.name));

  const installed = [];
  const available = [];
  
  for (const t of tools) {
    if (await toolManager.isToolInstalled(t.id)) installed.push(t);
    else available.push(t);
  }
  
  if (installed.length > 0) {
    console.log(chalk.cyan.bold('\n--- INSTALLED TOOLS ---'));
    installed.forEach(t => console.log(`${chalk.green('✓')} ${chalk.bold(t.name)} (${t.id})\n  ${chalk.dim(t.description)}`));
  }
  
  if (available.length > 0) {
    console.log(chalk.gray.bold('\n--- AVAILABLE TOOLS ---'));
    available.forEach(t => {
      const star = t.popular ? chalk.yellow('★ ') : '';
      console.log(`${chalk.gray('○')} ${star}${chalk.bold(t.name)} (${t.id})\n  ${chalk.dim(t.description)}`);
    });
  }
  console.log();
}

module.exports = list;
