'use strict';

const fs = require('fs');
const https = require('https');
const { execSync } = require('child_process');
const path = require('path');
const logger = require('./logger');
const config = require('./config');

const GITHUB_PACKAGE_URL = 'https://raw.githubusercontent.com/MythroniX24/CodeDock/main/package.json';
const UPDATE_INTERVAL_MS = 12 * 60 * 60 * 1000; // 12 hours

function isNewerVersion(remote, local) {
  const rParts = remote.split('.').map(s => parseInt(s, 10));
  const lParts = local.split('.').map(s => parseInt(s, 10));
  
  for (let i = 0; i < Math.max(rParts.length, lParts.length); i++) {
    const r = isNaN(rParts[i]) ? 0 : rParts[i];
    const l = isNaN(lParts[i]) ? 0 : lParts[i];
    if (r > l) return true;
    if (r < l) return false;
  }
  return false;
}

function fetchLatestVersion(force) {
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
    req.setTimeout(force ? 5000 : 1200, () => {
      req.destroy();
      resolve(null);
    });
  });
}

async function checkAndAutoUpdate(force = false) {
  // Respect the user's auto-update setting (defaults to true)
  const isAutoUpdateEnabled = config.get('autoUpdate') !== false;
  
  if (!isAutoUpdateEnabled && !force) {
    return false;
  }

  const lastCheck = config.get('lastUpdateCheck', 0);
  const now = Date.now();
  
  // Only check every 12 hours to keep startup instant, unless forced
  if (!force && now - lastCheck < UPDATE_INTERVAL_MS) {
    return false; // No check needed
  }
  
  // Read package.json dynamically to avoid module cache when upgrading twice in one session
  const pkgPath = path.join(__dirname, '..', '..', 'package.json');
  const localPkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  const localVersion = localPkg.version;
  
  // We'll quickly check in the background/inline
  const remoteVersion = await fetchLatestVersion(force);
  
  // Save check time regardless of success to avoid spamming network on offline devices
  config.set('lastUpdateCheck', now);

  if (remoteVersion && isNewerVersion(remoteVersion, localVersion)) {
    logger.blank();
    logger.header(`🚀 New CodeDock Version Available: v${remoteVersion} (Current: v${localVersion})`);
    logger.info('Auto-updating CodeDock from GitHub...');
    
    try {
      const os = require('os');
      const { spawn } = require('child_process');
      const { getPrefix } = require('./environment');
      
      const tmpDir = os.tmpdir();
      const scriptPath = path.join(tmpDir, 'codedock_updater.sh');
      const prefix = getPrefix() || '/usr/local';
      
      const scriptContent = `#!/bin/bash
echo "Waiting for CodeDock to close..."
sleep 2

echo "🧹 Cleaning up old installation..."
rm -rf "${prefix}/lib/node_modules/codedock"

echo "🚀 Installing latest CodeDock from GitHub..."
npm install -g MythroniX24/CodeDock

echo "✨ Update complete! Launching CodeDock..."
codedock
`;
      
      fs.writeFileSync(scriptPath, scriptContent, { mode: 0o755 });
      
      logger.info('Restarting CodeDock to apply updates in a detached process...\n');
      
      // Spawn the script completely detached
      const child = spawn('bash', [scriptPath], {
        detached: true,
        stdio: 'inherit'
      });
      
      child.unref();
      
      // We must exit the current process so the file locks are released!
      process.exit(0);
      
    } catch (err) {
      logger.error(`\n❌ Auto-update failed to start: ${err.message}`);
      logger.info('You can manually update by running: npm install -g MythroniX24/CodeDock');
      logger.blank();
      return false;
    }
  }
  
  return false;
}

module.exports = {
  checkAndAutoUpdate
};
