'use strict';

const https = require('https');
const { execSync } = require('child_process');
const path = require('path');
const logger = require('./logger');
const config = require('./config');

const GITHUB_PACKAGE_URL = 'https://raw.githubusercontent.com/MythroniX24/CodeDock/main/package.json';
const UPDATE_INTERVAL_MS = 12 * 60 * 60 * 1000; // 12 hours

function isNewerVersion(remote, local) {
  const rParts = remote.split('.').map(Number);
  const lParts = local.split('.').map(Number);
  
  for (let i = 0; i < Math.max(rParts.length, lParts.length); i++) {
    const r = rParts[i] || 0;
    const l = lParts[i] || 0;
    if (r > l) return true;
    if (r < l) return false;
  }
  return false;
}

function fetchLatestVersion() {
  return new Promise((resolve) => {
    const req = https.get(GITHUB_PACKAGE_URL, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const pkg = JSON.parse(data);
            resolve(pkg.version);
          } catch (e) {
            resolve(null);
          }
        } else {
          resolve(null);
        }
      });
    });
    
    req.on('error', () => resolve(null));
    req.setTimeout(5000, () => {
      req.abort();
      resolve(null);
    });
  });
}

async function checkAndAutoUpdate() {
  const lastCheck = config.get('lastUpdateCheck', 0);
  const now = Date.now();
  
  // Only check every 12 hours to keep startup instant
  if (now - lastCheck < UPDATE_INTERVAL_MS) {
    return false; // No check needed
  }
  
  const localPkg = require('../../package.json');
  const localVersion = localPkg.version;
  
  // We'll quickly check in the background/inline
  const remoteVersion = await fetchLatestVersion();
  
  // Save check time regardless of success to avoid spamming network on offline devices
  config.set('lastUpdateCheck', now);

  if (remoteVersion && isNewerVersion(remoteVersion, localVersion)) {
    logger.blank();
    logger.header(`🚀 New CodeDock Version Available: v${remoteVersion} (Current: v${localVersion})`);
    logger.info('Auto-updating CodeDock from GitHub...');
    
    try {
      // Run the update
      execSync('npm install -g MythroniX24/CodeDock', { stdio: 'inherit', shell: true });
      
      logger.success('\n✅ CodeDock automatically updated to the latest version!');
      logger.info('Restarting CodeDock to apply updates...\n');
      
      // Bump the local config version if we track it, though it's read from package.json
      
      return true; // Indicates update occurred
    } catch (err) {
      logger.error(`\n❌ Auto-update failed: ${err.message}`);
      logger.info('You can manually update by running: npm install -g MythroniX24/CodeDock');
      logger.blank();
      // Continue anyway
      return false;
    }
  }
  
  return false;
}

module.exports = {
  checkAndAutoUpdate
};
