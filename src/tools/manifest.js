'use strict';

/**
 * @file src/tools/manifest.js
 * Manifest loader, validator, and command resolver.
 * Handles cross-platform command resolution.
 */
const fs = require('fs');
const path = require('path');
const os = require('os');

function loadManifest(toolDir) {
  const manifestPath = path.join(toolDir, 'manifest.json');
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Manifest not found at ${manifestPath}`);
  }
  const data = fs.readFileSync(manifestPath, 'utf8');
  return JSON.parse(data);
}

function validateManifest(manifest) {
  const required = ['id', 'name', 'command', 'description', 'installation', 'dependencies', 'architectures', 'compatibility', 'verification', 'launcher'];
  for (const field of required) {
    if (manifest[field] === undefined) {
      return false;
    }
  }
  return true;
}

function getInstallCommand(manifest, env) {
  const inst = manifest.installation || {};
  const isWin = os.platform() === 'win32';
  const isMac = os.platform() === 'darwin';

  if (env && env.isTermux && inst.termux && inst.termux.command) {
    return inst.termux.command;
  }
  
  if (isWin && inst.windows && inst.windows.command) {
    return inst.windows.command;
  }
  
  if (isMac && inst.macos && inst.macos.command) {
    return inst.macos.command;
  }
  
  if (!isWin && !isMac && inst.linux && inst.linux.command) {
    return inst.linux.command;
  }

  if (inst.primary && inst.primary.command) {
    return inst.primary.command;
  }

  if (inst.fallback && inst.fallback.command) {
    return inst.fallback.command;
  }

  if (inst.command) {
    return inst.command;
  }

  return '';
}

function getUninstallCommand(manifest, env) {
  const u = manifest.uninstall || manifest.uninstallation || {};
  return u.command || '';
}

function getUpdateCommand(manifest, env) {
  const u = manifest.update || {};
  return u.command || '';
}

function getVerifyCommand(manifest) {
  const v = manifest.verification || {};
  if (!v.command) return '';
  const args = v.args ? v.args.join(' ') : '';
  return args ? `${v.command} ${args}` : v.command;
}

function getLaunchCommand(manifest) {
  const l = manifest.launcher || {};
  return l.command || manifest.command || '';
}

function getLaunchArgs(manifest) {
  const l = manifest.launcher || {};
  return l.args || [];
}

module.exports = {
  loadManifest,
  validateManifest,
  getInstallCommand,
  getUninstallCommand,
  getUpdateCommand,
  getVerifyCommand,
  getLaunchCommand,
  getLaunchArgs,
};
