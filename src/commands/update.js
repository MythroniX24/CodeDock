'use strict';

const ToolManager = require('../tools/manager');
const { confirmPrompt } = require('../ui/components');
const logger = require('../core/logger');

async function update(toolId, flags) {
  const toolManager = new ToolManager();
  
  if (toolId) {
    const tool = await toolManager.getTool(toolId);
    if (!tool) {
      logger.error(`Tool '${toolId}' not found.`);
      return;
    }
    
    if (!(await toolManager.isToolInstalled(toolId))) {
      logger.error(`Tool '${tool.name}' is not installed.`);
      return;
    }
    
    if (!flags.yes) {
      const confirm = await confirmPrompt(`Update ${tool.name}?`);
      if (!confirm) return;
    }
    
    try {
      await toolManager.updateTool(toolId);
    } catch (error) {
      logger.error(`Failed to update ${tool.name}: ${error.message}`);
    }
  } else {
    // Update all installed tools
    const tools = await toolManager.getAllTools();
    const installedTools = [];
    
    for (const tool of tools) {
      if (await toolManager.isToolInstalled(tool.id)) {
        installedTools.push(tool);
      }
    }
    
    if (installedTools.length === 0) {
      logger.info('No tools installed to update.');
      return;
    }
    
    logger.info(`Found ${installedTools.length} installed tools to update.`);
    if (!flags.yes) {
      const confirm = await confirmPrompt('Update all tools?');
      if (!confirm) return;
    }
    
    for (const tool of installedTools) {
      try {
        logger.info(`Updating ${tool.name}...`);
        await toolManager.updateTool(tool.id);
      } catch (error) {
        logger.error(`Failed to update ${tool.name}: ${error.message}`);
      }
    }
    logger.success('All updates completed.');
  }
}

module.exports = update;
