'use strict';

const ToolManager = require('../tools/manager');
const { confirmPrompt } = require('../ui/components');
const logger = require('../core/logger');
const chalk = require('chalk');

async function install(toolId, flags) {
  if (!toolId) {
    logger.error('Please specify a tool ID to install.');
    return;
  }

  const toolManager = new ToolManager();
  const tool = await toolManager.getTool(toolId);
  
  if (!tool) {
    logger.error(`Tool '${toolId}' not found.`);
    return;
  }

  if (await toolManager.isToolInstalled(toolId)) {
    logger.info(`Tool '${tool.name}' is already installed.`);
    return;
  }

  console.log(`\n${chalk.bold.blue('Tool Details:')}`);
  console.log(`Name: ${tool.name}`);
  console.log(`Description: ${tool.description}`);
  console.log(`Size estimate: ~${tool.size || 'Unknown'}\n`);

  if (!flags.yes) {
    const confirm = await confirmPrompt(`Do you want to install ${tool.name}?`);
    if (!confirm) {
      logger.info('Installation cancelled.');
      return;
    }
  }

  logger.info(`Installing ${tool.name}...`);
  try {
    await toolManager.installTool(toolId);
    logger.success(`${tool.name} installed successfully!`);
  } catch (error) {
    logger.error(`Failed to install ${tool.name}: ${error.message}`);
  }
}

module.exports = install;
