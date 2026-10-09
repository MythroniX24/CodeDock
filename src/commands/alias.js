'use strict';

const fs = require('fs');
const path = require('path');
const logger = require('../core/logger');
const { getHome } = require('../core/environment');
const { inputPrompt, selectPrompt } = require('../ui/components');
const ToolManager = require('../tools/manager');

async function alias(toolId, flags) {
  logger.header('⚡ Global Shortcut (Alias) Manager');

  let targetId = toolId;
  const toolManager = new ToolManager();
  
  if (!targetId) {
    const tools = await toolManager.listTools();
    const installed = tools.filter(t => t.installed);
    if (installed.length === 0) {
      logger.error('No tools installed to alias.');
      return;
    }
    const choices = installed.map(t => ({ name: t.name, value: t.id }));
    targetId = await selectPrompt('Select a tool to create an alias for:', choices);
  }

  const tool = await toolManager.getTool(targetId);
  if (!tool) {
    logger.error(`Tool ${targetId} not found.`);
    return;
  }

  const shortcut = await inputPrompt(`Enter shortcut alias for ${tool.name} (e.g. 'c', 'ai'):`);
  if (!shortcut) return;

  const home = getHome();
  const rcFiles = ['.bashrc', '.zshrc', '.profile'];
  let added = 0;

  const aliasLine = `\nalias ${shortcut}="codedock open ${targetId}"\n`;

  for (const file of rcFiles) {
    const rcPath = path.join(home, file);
    if (fs.existsSync(rcPath)) {
      try {
        let content = fs.readFileSync(rcPath, 'utf8');
        // Avoid duplicate aliases
        if (!content.includes(`alias ${shortcut}=`)) {
          fs.appendFileSync(rcPath, aliasLine);
          added++;
          logger.step(`Added shortcut to ${file}`);
        } else {
          logger.warn(`Shortcut '${shortcut}' already exists in ${file}`);
        }
      } catch (e) {
        logger.error(`Could not write to ${rcPath}: ${e.message}`);
      }
    }
  }

  if (added > 0) {
    logger.success(`\n✅ Shortcut created! You can now type '${shortcut}' anywhere to open ${tool.name}.`);
    logger.info('Note: Restart your terminal or run `source ~/.bashrc` to apply it immediately.');
  } else {
    logger.warn('No active shell profile found or alias already existed.');
  }
}

module.exports = alias;
