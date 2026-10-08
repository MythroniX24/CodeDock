const ora = require('ora');
const chalk = require('chalk');
const logger = require('../core/logger');

async function showInstallProgress(toolManager, toolId) {
  const spinner = ora(`Preparing to install ${toolId}...`).start();
  
  try {
    // This is a simplified wrapper for toolManager.installTool that hooks into progress events
    // Assuming toolManager.installTool emits events or we just let it handle logs
    
    spinner.text = `Installing ${toolId}...`;
    // If the manager has a way to stream logs, we would hook it up here.
    // For now, we await the installation
    await toolManager.installTool(toolId);
    
    spinner.succeed(chalk.green(`Successfully installed ${toolId}!`));
  } catch (error) {
    spinner.fail(chalk.red(`Installation failed: ${error.message}`));
    logger.error(error.stack);
  }
}

module.exports = { showInstallProgress };
