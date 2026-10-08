const { box, divider, selectPrompt } = require('./components');
const chalk = require('chalk');

async function showToolCard(tool, toolManager) {
  const isInstalled = await toolManager.isToolInstalled(tool.id);
  
  console.clear();
  const title = isInstalled ? chalk.green.bold(tool.name) : chalk.bold(tool.name);
  
  let content = `${title}\n`;
  content += `${chalk.gray(tool.id)}\n\n`;
  content += `${tool.description}\n\n`;
  content += `Status: ${isInstalled ? chalk.green('Installed') : chalk.gray('Available')}\n`;
  if (tool.size) content += `Size: ~${tool.size}\n`;
  
  box(content, 50);
  
  // Future: return a selection for what to do next
}

module.exports = { showToolCard };
