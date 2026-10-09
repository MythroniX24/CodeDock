'use strict';

/**
 * @file src/ui/dashboard.js
 * Interactive main dashboard — shown when `codedock` is run with no args.
 */
const inquirer = require('inquirer');
const { banner, selectPrompt, systemInfoBlock } = require('./components');
const { showSettings } = require('./settings');
const { Environment } = require('../core/environment');
const config = require('../core/config');
const ToolManager = require('../tools/manager');
const { getTheme } = require('./theme');

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
    const t = getTheme();
    console.clear();
    banner();
    await systemInfoBlock(envInfo);

    // Show installed tools summary
    const toolManager = new ToolManager();
    const tools = await toolManager.getAllTools();
    
    const installedTools = [];
    for (const tool of tools) {
      if (await toolManager.isToolInstalled(tool.id)) {
        installedTools.push(tool);
      }
    }

    const headerText = ` Installed Tools (${installedTools.length}) `;
    const dashCount = Math.max(0, 42 - headerText.length);
    console.log(t.border('  ╭─') + t.secondary.bold(headerText) + t.border('─'.repeat(dashCount) + '╮'));
    
    if (installedTools.length === 0) {
      console.log(t.border('  │ ') + t.muted('No tools installed yet. Go to Manage Tools'.padEnd(40)) + t.border('│'));
    } else {
      for (const tool of installedTools) {
        console.log(t.border('  │ ') + t.success('✓ ') + t.text(tool.name.padEnd(38)) + t.border('│'));
      }
    }
    console.log(t.border('  ╰──────────────────────────────────────────╯'));
    console.log();

    const choices = [
      { name: t.text('📦 Manage Tools'), value: 'tools' },
      { name: t.text('📁 Projects'), value: 'projects' },
      { name: t.text('🔧 Dependencies'), value: 'deps' },
      { name: t.text('🔄 Check Updates'), value: 'updates' },
      { name: t.text('🏥 Run Doctor'), value: 'doctor' },
      { name: t.text('⚙️  Settings'), value: 'settings' },
      new inquirer.Separator(),
      { name: t.error('❌ Exit'), value: 'exit' },
    ];

    const action = await selectPrompt(t.text('Main Menu'), choices);

    if (action === 'exit') {
      console.log(t.muted('\nGoodbye!\n'));
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
      console.error(t.error(`\nError: ${error.message}\n`));
    }

    // Pause before returning to dashboard
    await inquirer.prompt([{
      type: 'input',
      name: 'continue',
      message: t.muted('Press Enter to return to dashboard...'),
    }]);
  }
}

/**
 * Tool management submenu with search and categorization.
 */
async function manageToolsMenu() {
  const { autocompletePrompt } = require('./components');
  const t = getTheme();
  const toolManager = new ToolManager();
  const allToolsRaw = await toolManager.getAllTools();
  
  // Sort alphabetically
  allToolsRaw.sort((a, b) => a.name.localeCompare(b.name));
  
  // Determine tool status
  const tools = [];
  for (const tool of allToolsRaw) {
    const installed = await toolManager.isToolInstalled(tool.id);
    tools.push({ ...tool, installed });
  }
  
  const installedTools = tools.filter(tool => tool.installed);
  const popularTools = tools.filter(tool => !tool.installed && tool.popular);
  const otherTools = tools.filter(tool => !tool.installed && !tool.popular);

  const searchTools = (answers, input = '') => {
    return new Promise((resolve) => {
      const q = input.toLowerCase();
      const results = [];
      
      // Filter function
      const filterFn = tool => tool.name.toLowerCase().includes(q) || tool.id.toLowerCase().includes(q) || (tool.description || '').toLowerCase().includes(q);
      
      const filteredInstalled = installedTools.filter(filterFn);
      if (filteredInstalled.length > 0) {
        results.push(new inquirer.Separator(t.primary.bold('--- INSTALLED TOOLS ---')));
        filteredInstalled.forEach(tool => results.push({ name: `${t.success('✓')} ${t.text(tool.name)}`, value: tool.id }));
      }
      
      const filteredPopular = popularTools.filter(filterFn);
      if (filteredPopular.length > 0) {
        results.push(new inquirer.Separator(t.secondary.bold('--- POPULAR TOOLS ---')));
        filteredPopular.forEach(tool => results.push({ name: `${t.muted('○')} ${t.text(tool.name)}`, value: tool.id }));
      }
      
      const filteredOther = otherTools.filter(filterFn);
      if (filteredOther.length > 0) {
        results.push(new inquirer.Separator(t.text.bold('--- ALL TOOLS (A-Z) ---')));
        filteredOther.forEach(tool => results.push({ name: `${t.muted('○')} ${t.text(tool.name)}`, value: tool.id }));
      }
      
      if (results.length === 0) {
        results.push(new inquirer.Separator(t.error('No tools found matching your search.')));
      }
      
      results.push(new inquirer.Separator(' '));
      results.push({ name: t.muted('← Back'), value: 'back' });
      
      resolve(results);
    });
  };

  const selectedToolId = await autocompletePrompt(t.text('Search or select a tool to manage:'), searchTools);
  if (selectedToolId === 'back') return;

  const installed = await toolManager.isToolInstalled(selectedToolId);
  const tool = await toolManager.getTool(selectedToolId);
  const actions = [];

  if (installed) {
    actions.push({ name: t.success(`🚀 Open ${tool.name}`), value: 'open' });
    actions.push({ name: t.text('🔄 Update'), value: 'update' });
    actions.push({ name: t.error('🗑️  Uninstall'), value: 'uninstall' });
  } else {
    actions.push({ name: t.success(`📥 Install ${tool.name}`), value: 'install' });
  }
  actions.push(new inquirer.Separator());
  actions.push({ name: t.muted('← Back'), value: 'back' });

  const toolAction = await selectPrompt(t.text(`Action for ${tool.name}:`), actions);

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
  const t = getTheme();

  console.clear();
  console.log();
  console.log(t.border('  ╭─') + t.secondary.bold(' Dependencies Status ') + t.border('────────────────────╮'));

  const allDeps = depManager.getAll();
  for (const [name, info] of Object.entries(allDeps)) {
    const mark = info.installed ? t.success('✓ ') : t.error('✗ ');
    const ver = info.version ? `v${info.version}` : '';
    const line = mark + t.text(name.padEnd(21)) + t.muted(ver.padEnd(18));
    console.log(t.border('  │ ') + line + t.border('│'));
  }
  console.log(t.border('  ╰──────────────────────────────────────────╯'));
  console.log();
}

module.exports = { showDashboard };
