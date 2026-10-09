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
  
  // Custom URL installation support
  if (toolId.startsWith('http')) {
    logger.info(`Fetching custom tool manifest from ${toolId}...`);
    try {
      const https = require('https');
      const fs = require('fs');
      const path = require('path');
      
      const manifestStr = await new Promise((resolve, reject) => {
        https.get(toolId, res => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => resolve(data));
        }).on('error', reject);
      });
      
      const customManifest = JSON.parse(manifestStr);
      if (!customManifest.id || !customManifest.name) throw new Error("Invalid manifest: Missing 'id' or 'name'");
      
      const customDir = path.join(__dirname, '../../tools', customManifest.id);
      if (!fs.existsSync(customDir)) fs.mkdirSync(customDir, { recursive: true });
      fs.writeFileSync(path.join(customDir, 'manifest.json'), JSON.stringify(customManifest, null, 2));
      
      toolId = customManifest.id;
      logger.success(`Custom manifest saved as '${toolId}'`);
      
      // Reload registry to discover the newly saved tool
      await toolManager.discoverTools();
    } catch (e) {
      logger.error(`Failed to load custom tool from URL: ${e.message}`);
      return;
    }
  }

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
