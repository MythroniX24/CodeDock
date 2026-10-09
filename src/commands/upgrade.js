'use strict';

const logger = require('../core/logger');
const { checkAndAutoUpdate } = require('../core/updater');

async function upgrade() {
  logger.info('Checking for CodeDock updates...');
  
  // Force the update check to bypass the 12-hour limit
  // If an update is found, this function will spawn a detached process and exit automatically.
  await checkAndAutoUpdate(true);
  
  // If we reach here, no update was found
  logger.step('CodeDock is already up to date!');
  return false;
}

module.exports = upgrade;
