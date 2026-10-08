'use strict';

/**
 * @file src/tools/manifest.js
 * Manifest loader, validator, and command resolver.
 *
 * Resolves install/uninstall/update/verify/launch commands from the
 * manifest JSON structure used in tools/<id>/manifest.json.
 */
const fs = require('fs');
const path = require('path');

/**
 * Load manifest.json from a tool directory.
 * @param {string} toolDir - absolute path to tool directory
 * @returns {object} parsed manifest
 */
function loadManifest(toolDir) {
  const manifestPath = path.join(toolDir, 'manifest.json');
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Manifest not found at ${manifestPath}`);
  }
  const data = fs.readFileSync(manifestPath, 'utf8');
  return JSON.parse(data);
}

/**
 * Validate that a manifest contains all required fields.
 * @param {object} manifest
 * @returns {boolean}
 */
function validateManifest(manifest) {
  const required = ['id', 'name', 'command', 'description', 'installation', 'dependencies', 'architectures', 'compatibility', 'verification', 'launcher'];
  for (const field of required) {
    if (manifest[field] === undefined) {
      return false;
    }
  }
  return true;
}

/**
 * Resolve the install command for the current environment.
 *
 * Manifest structure:
 *   installation.termux.command (preferred in Termux)
 *   installation.primary.command (default)
 *   installation.fallback.command (last resort)
 *
 * @param {object} manifest
 * @param {object} env - system info from environment.getSystemInfo()
 * @returns {string} shell command to run
 */
function getInstallCommand(manifest, env) {
  const inst = manifest.installation || {};

  // Prefer Termux-specific install if running in Termux
  if (env && env.isTermux && inst.termux && inst.termux.command) {
    return inst.termux.command;
  }

  // Primary method
  if (inst.primary && inst.primary.command) {
    return inst.primary.command;
  }

  // Fallback
  if (inst.fallback && inst.fallback.command) {
    return inst.fallback.command;
  }

  // Legacy flat format: installation.command
  if (inst.command) {
    return inst.command;
  }

  return '';
}

/**
 * Resolve the uninstall command.
 * @param {object} manifest
 * @param {object} env
 * @returns {string}
 */
function getUninstallCommand(manifest, env) {
  const u = manifest.uninstall || manifest.uninstallation || {};
  return u.command || '';
}

/**
 * Resolve the update command.
 * @param {object} manifest
 * @param {object} env
 * @returns {string}
 */
function getUpdateCommand(manifest, env) {
  const u = manifest.update || {};
  return u.command || '';
}

/**
 * Get the verification command (used to check if tool is installed).
 * Constructs "command args" from verification object.
 * @param {object} manifest
 * @returns {string}
 */
function getVerifyCommand(manifest) {
  const v = manifest.verification || {};
  if (!v.command) return '';
  const args = v.args ? v.args.join(' ') : '';
  return args ? `${v.command} ${args}` : v.command;
}

/**
 * Get the launch command for the tool.
 * @param {object} manifest
 * @returns {string}
 */
function getLaunchCommand(manifest) {
  const l = manifest.launcher || {};
  return l.command || manifest.command || '';
}

/**
 * Get launch args for the tool.
 * @param {object} manifest
 * @returns {string[]}
 */
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
