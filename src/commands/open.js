'use strict';

const ToolManager = require('../tools/manager');
const ProjectManager = require('../projects/manager');
const { selectProject } = require('../ui/projectSelector');
const logger = require('../core/logger');

async function open(toolId, flags) {
  if (!toolId) {
    logger.error('Please specify a tool ID to open.');
    return;
  }

  const toolManager = new ToolManager();
  const tool = await toolManager.getTool(toolId);
  
  if (!tool) {
    logger.error(`Tool '${toolId}' not found.`);
    return;
  }

  if (!(await toolManager.isToolInstalled(toolId))) {
    logger.error(`Tool '${tool.name}' is not installed. Run 'codedock install ${toolId}' first.`);
    return;
  }

  const projectManager = new ProjectManager();
  const projectPath = await selectProject(projectManager, tool.name);
  
  if (!projectPath) {
    logger.info('Cancelled.');
    return;
  }

  logger.info(`Launching ${tool.name} in ${projectPath}...`);
  try {
    await toolManager.launchTool(toolId, projectPath);
  } catch (error) {
    logger.error(`Failed to launch tool: ${error.message}`);
  }
}

module.exports = open;
