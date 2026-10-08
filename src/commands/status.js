'use strict';

const { Environment } = require('../core/environment');
const DependencyManager = require('../dependencies/manager');
const ToolManager = require('../tools/manager');
const chalk = require('chalk');

async function status(flags) {
  const env = new Environment();
  const envInfo = await env.getInfo();
  
  console.log(chalk.bold.blue('\nSystem Status'));
  console.log('='.repeat(40));
  
  console.log(chalk.bold('\nEnvironment:'));
  console.log(`  OS: ${envInfo.os}`);
  console.log(`  Arch: ${envInfo.arch}`);
  console.log(`  Termux: ${envInfo.isTermux ? chalk.green('Yes') : chalk.red('No')}`);
  
  console.log(chalk.bold('\nDependencies:'));
  const depManager = new DependencyManager();
  const deps = ['node', 'npm', 'python', 'git'];
  for (const dep of deps) {
    const isInstalled = depManager.isInstalled(dep);
    console.log(`  ${dep}: ${isInstalled ? chalk.green('Installed') : chalk.red('Missing')}`);
  }
  
  console.log(chalk.bold('\nInstalled Tools:'));
  const toolManager = new ToolManager();
  const tools = await toolManager.getAllTools();
  let hasTools = false;
  
  for (const tool of tools) {
    if (await toolManager.isToolInstalled(tool.id)) {
      console.log(`  ${chalk.green('✓')} ${tool.name}`);
      hasTools = true;
    }
  }
  
  if (!hasTools) {
    console.log(`  ${chalk.gray('No tools installed.')}`);
  }
  console.log();
}

module.exports = status;
