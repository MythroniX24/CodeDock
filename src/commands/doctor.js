'use strict';

const { Environment } = require('../core/environment');
const DependencyManager = require('../dependencies/manager');
const ToolManager = require('../tools/manager');
const logger = require('../core/logger');
const chalk = require('chalk');

async function doctor(flags) {
  console.log(chalk.bold.blue('\nCodeDock Doctor - System Diagnostics\n'));
  
  const env = new Environment();
  const envInfo = await env.getInfo();
  
  logger.info(chalk.bold('Environment Checks:'));
  if (envInfo.isTermux) {
    logger.step('Termux environment detected', true);
  } else {
    logger.step('Not running in Termux (may cause issues)', false);
  }
  logger.step(`Architecture: ${envInfo.arch}`, true);
  logger.step(`Platform: ${envInfo.os}`, true);
  
  console.log();
  logger.info(chalk.bold('Dependency Checks:'));
  
  const depManager = new DependencyManager();
  const deps = ['node', 'npm', 'python', 'git', 'curl'];
  let allDepsOk = true;
  
  for (const dep of deps) {
    const isInstalled = depManager.isInstalled(dep);
    if (isInstalled) {
      logger.step(`${dep} is installed`, true);
    } else {
      logger.step(`${dep} is missing`, false);
      allDepsOk = false;
    }
  }
  
  console.log();
  logger.info(chalk.bold('Tool Checks:'));
  const toolManager = new ToolManager();
  const tools = await toolManager.getAllTools();
  
  for (const tool of tools) {
    if (await toolManager.isToolInstalled(tool.id)) {
      try {
        const verified = await toolManager.verifyTool(tool.id);
        if (verified) {
          logger.step(`Tool ${tool.name} is installed and verified`, true);
        } else {
          logger.step(`Tool ${tool.name} is installed but verification failed`, false);
        }
      } catch (e) {
        logger.step(`Tool ${tool.name} is installed but has issues`, false);
      }
    }
  }
  
  console.log();
  if (allDepsOk) {
    logger.success('System is healthy and ready for CodeDock!');
  } else {
    logger.warn('Some dependencies are missing. Run apt/pkg install to fix them.');
  }
}

module.exports = doctor;
