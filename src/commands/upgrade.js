'use strict';

const logger = require('../core/logger');
const { checkAndAutoUpdate } = require('../core/updater');

async function upgrade() {
  logger.info('Checking for CodeDock updates...');
  
  // Force the update check to bypass the 12-hour limit
  const wasUpdated = await checkAndAutoUpdate(true);
  
  if (wasUpdated) {
    // The updater already printed success messages
    // The main process usually catches this and restarts, but since we ran it explicitly:
    logger.success('Please run `codedock` again to use the new version.');
  } else {
    logger.step('CodeDock is already up to date!');
  }
  
  return wasUpdated;
}

module.exports = upgrade;
