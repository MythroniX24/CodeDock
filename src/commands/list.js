'use strict';

const ToolManager = require('../tools/manager');
const chalk = require('chalk');

async function list(flags) {
  const toolManager = new ToolManager();
  const tools = await toolManager.getAllTools();
  
  console.log(chalk.bold.blue('\nCodeDock Tools:'));
  console.log('='.repeat(40));

  for (const tool of tools) {
    const isInstalled = await toolManager.isToolInstalled(tool.id);
    const statusColor = isInstalled ? chalk.green : chalk.gray;
    const statusMark = isInstalled ? '✓' : '○';
    
    console.log(`${statusColor(statusMark)} ${chalk.bold(tool.name)} (${tool.id})`);
    console.log(`  ${chalk.dim(tool.description)}`);
    if (isInstalled) {
      console.log(`  ${chalk.green('Status: Installed')}`);
    } else {
      console.log(`  ${chalk.yellow('Status: Available')}`);
    }
    console.log();
  }
}

module.exports = list;
