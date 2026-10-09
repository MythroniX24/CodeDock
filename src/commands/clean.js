'use strict';

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const logger = require('../core/logger');
const { getHome } = require('../core/environment');
const { confirmPrompt } = require('../ui/components');

async function clean(flags) {
  logger.header('🧹 CodeDock Deep Clean Engine');
  
  if (!flags.yes) {
    const confirm = await confirmPrompt('This will clear NPM caches, orphaned temps, and AI tool caches. Proceed?');
    if (!confirm) {
      logger.info('Clean aborted.');
      return;
    }
  }

  const isWin = os.platform() === 'win32';
  let freedSpace = 0;

  // Helper to safely delete and estimate space
  const safeDelete = (targetPath) => {
    try {
      if (!fs.existsSync(targetPath)) return;
      
      const stat = fs.statSync(targetPath);
      let size = stat.size;
      
      if (stat.isDirectory()) {
         // Recursive size estimation is slow in pure node, we just delete
         fs.rmSync(targetPath, { recursive: true, force: true });
         logger.step(`Cleared: ${targetPath}`);
      } else {
         fs.unlinkSync(targetPath);
         logger.step(`Removed: ${targetPath}`);
      }
    } catch (e) {
      logger.warn(`Could not clear ${targetPath}: ${e.message}`);
    }
  };

  logger.info('\nCleaning Package Manager Caches...');
  try {
    execSync('npm cache clean --force', { stdio: 'ignore', shell: true });
    logger.step('NPM cache cleared');
  } catch (e) {
    logger.warn('Failed to clear NPM cache');
  }

  // Clear system specific temp directories
  logger.info('\nCleaning Temporary Directories...');
  const tmpDirs = [
    os.tmpdir(),
    path.join(getHome(), '.npm', '_cacache'),
    path.join(getHome(), '.cache', 'pip'),
    path.join(getHome(), '.cache', 'yarn'),
    path.join(getHome(), '.cache', 'puppeteer'), // common huge folder
  ];
  
  if (process.env.PREFIX) {
    // Termux specific tmp
    tmpDirs.push(path.join(process.env.PREFIX, 'tmp'));
  }

  for (const dir of tmpDirs) {
    if (fs.existsSync(dir)) {
      try {
        const files = fs.readdirSync(dir);
        for (const file of files) {
          safeDelete(path.join(dir, file));
        }
      } catch (e) { /* ignore read errors */ }
    }
  }

  logger.success('\n✨ Deep Clean Complete! Your device is now lighter and faster.\n');
}

module.exports = clean;
