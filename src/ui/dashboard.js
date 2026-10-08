'use strict';

/**
 * @file src/ui/dashboard.js
 * Interactive main dashboard — shown when `codedock` is run with no args.
 */
const chalk = require('chalk');
const inquirer = require('inquirer');
const { banner, selectPrompt, systemInfoBlock } = require('./components');
const { showSettings } = require('./settings');
const { Environment } = require('../core/environment');
const config = require('../core/config');
const ToolManager = require('../tools/manager');

// Commands
const install = require('../commands/install');
const uninstall = require('../commands/uninstall');
const update = require('../commands/update');
const doctor = require('../commands/doctor');
const open = require('../commands/open');
const projects = require('../commands/projects');

/**
 * Show the main CodeDock dashboard with interactive navigation.
 */
async function showDashboard() {
  const env = new Environment();
  const envInfo = await env.getInfo();

  while (true) {
    console.clear();
    banner();
    await systemInfoBlock(envInfo);

    // Show installed tools summary
    const toolManager = new ToolManager();
    const tools = await toolManager.getAllTools();

    console.log(chalk.bold('  Coding Tools'));
    for (const tool of tools) {
      const installed = await toolManager.isToolInstalled(tool.id);
      const mark = installed ? chalk.green('✓') : chalk.gray('○');
      const status = installed ? chalk.green('Installed') : chalk.gray('Available');
      console.log(`  ${mark} ${tool.name.padEnd(18)} ${status}`);
    }
    console.log();

    const choices = [
      { name: '📦 Manage Tools', value: 'tools' },
      { name: '📁 Projects', value: 'projects' },
      { name: '🔧 Dependencies', value: 'deps' },
      { name: '🔄 Check Updates', value: 'updates' },
      { name: '🏥 Run Doctor', value: 'doctor' },
      { name: '⚙️  Settings', value: 'settings' },
      new inquirer.Separator(),
      { name: '❌ Exit', value: 'exit' },
    ];

    const action = await selectPrompt('Main Menu', choices);

    if (action === 'exit') {
      console.log(chalk.gray('\nGoodbye!\n'));
      process.exit(0);
    }

    try {
      switch (action) {
        case 'tools':
          await manageToolsMenu();
          break;
        case 'projects':
          await projects({});
          break;
        case 'deps':
          await showDependencies();
          break;
        case 'updates':
          await update(null, {});
          break;
        case 'doctor':
          await doctor({});
          break;
        case 'settings':
          await showSettings(config);
          break;
      }
    } catch (error) {
      console.error(chalk.red(`\nError: ${error.message}\n`));
    }

    // Pause before returning to dashboard
    await inquirer.prompt([{
      type: 'input',
      name: 'continue',
      message: chalk.gray('Press Enter to return to dashboard...'),
    }]);
  }
}

/**
 * Tool management submenu.
 */
async function manageToolsMenu() {
  const toolManager = new ToolManager();
  const tools = await toolManager.getAllTools();

  const choices = [];
  for (const tool of tools) {
    const installed = await toolManager.isToolInstalled(tool.id);
    const mark = installed ? chalk.green('✓') : chalk.gray('○');
    choices.push({
      name: `${mark} ${tool.name}`,
      value: tool.id,
    });
  }
  choices.push(new inquirer.Separator());
  choices.push({ name: '← Back', value: 'back' });

  const selectedToolId = await selectPrompt('Select a tool:', choices);
  if (selectedToolId === 'back') return;

  const installed = await toolManager.isToolInstalled(selectedToolId);
  const tool = await toolManager.getTool(selectedToolId);
  const actions = [];

  if (installed) {
    actions.push({ name: `🚀 Open ${tool.name}`, value: 'open' });
    actions.push({ name: '🔄 Update', value: 'update' });
    actions.push({ name: '🗑️  Uninstall', value: 'uninstall' });
  } else {
    actions.push({ name: `📥 Install ${tool.name}`, value: 'install' });
  }
  actions.push(new inquirer.Separator());
  actions.push({ name: '← Back', value: 'back' });

  const toolAction = await selectPrompt(`Action for ${tool.name}:`, actions);

  switch (toolAction) {
    case 'install':
      await install(selectedToolId, { yes: true });
      break;
    case 'open':
      await open(selectedToolId, {});
      break;
    case 'update':
      await update(selectedToolId, { yes: true });
      break;
    case 'uninstall':
      await uninstall(selectedToolId, {});
      break;
  }
}

/**
 * Show dependencies status.
 */
async function showDependencies() {
  const DependencyManager = require('../dependencies/manager');
  const depManager = new DependencyManager();

  console.log(chalk.bold.blue('\n  Dependencies Status\n'));

  const allDeps = depManager.getAll();
  for (const [name, info] of Object.entries(allDeps)) {
    const mark = info.installed ? chalk.green('✓') : chalk.red('✗');
    const ver = info.version ? chalk.gray(`v${info.version}`) : '';
    console.log(`  ${mark} ${name.padEnd(18)} ${ver}`);
  }
  console.log();
}

module.exports = { showDashboard };
