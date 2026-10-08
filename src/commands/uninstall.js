'use strict';

const ToolManager = require('../tools/manager');
const { confirmPrompt } = require('../ui/components');
const logger = require('../core/logger');

async function uninstall(toolId, flags) {
  if (!toolId) {
    logger.error('Please specify a tool ID to uninstall.');
    return;
  }

  const toolManager = new ToolManager();
  const tool = await toolManager.getTool(toolId);
  
  if (!tool) {
    logger.error(`Tool '${toolId}' not found.`);
    return;
  }

  if (!(await toolManager.isToolInstalled(toolId))) {
    logger.info(`Tool '${tool.name}' is not installed.`);
    return;
  }

  if (!flags.yes) {
    const confirm = await confirmPrompt(`Are you sure you want to uninstall ${tool.name}?`);
    if (!confirm) {
      logger.info('Uninstallation cancelled.');
      return;
    }
  }

  logger.info(`Uninstalling ${tool.name}...`);
  try {
    await toolManager.uninstallTool(toolId);
    // logger.success is called by uninstallTool internally, but we can do it here too if needed
  } catch (error) {
    logger.error(`Failed to uninstall ${tool.name}: ${error.message}`);
  }
}

module.exports = uninstall;
