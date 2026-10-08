'use strict';

/**
 * @file src/core/environment.js
 * Termux environment detection and system info.
 *
 * Exports both standalone functions and a class-based API for flexibility.
 */
const os = require('os');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

/**
 * Check whether we are running inside a Termux environment.
 * @returns {boolean}
 */
function isTermux() {
  return (
    process.env.PREFIX !== undefined ||
    process.env.TERMUX_VERSION !== undefined ||
    fs.existsSync('/data/data/com.termux')
  );
}

/**
 * Detect the device architecture and return a canonical name.
 * @returns {string} One of: aarch64, armv7l, x86_64, i686, or the raw arch string.
 */
function getArchitecture() {
  // Prefer uname -m for the real hardware arch
  try {
    const uname = execSync('uname -m', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }).trim();
    if (uname) return uname;
  } catch (_) { /* fall through */ }

  const arch = process.arch;
  const map = { arm64: 'aarch64', arm: 'armv7l', x64: 'x86_64', ia32: 'i686' };
  return map[arch] || arch;
}

/**
 * @returns {string} The Termux $PREFIX directory.
 */
function getPrefix() {
  return process.env.PREFIX || '/data/data/com.termux/files/usr';
}

/**
 * @returns {string} The user home directory.
 */
function getHome() {
  return process.env.HOME || '/data/data/com.termux/files/home';
}

/**
 * @returns {string} Current shell path.
 */
function getShell() {
  return process.env.SHELL || '/system/bin/sh';
}

/**
 * @returns {string} Package manager command ('pkg' in Termux, 'apt' otherwise).
 */
function getPackageManager() {
  if (isTermux()) return 'pkg';
  return 'apt';
}

/**
 * Get comprehensive system information.
 * @returns {object}
 */
function getSystemInfo() {
  return {
    isTermux: isTermux(),
    architecture: getArchitecture(),
    arch: getArchitecture(),
    os: os.platform(),
    platform: os.platform(),
    prefix: getPrefix(),
    home: getHome(),
    shell: getShell(),
    packageManager: getPackageManager(),
    nodeVersion: process.version,
  };
}

/**
 * Check that $PREFIX/bin is on the PATH.
 * @returns {boolean}
 */
function checkPath() {
  const prefixBin = path.join(getPrefix(), 'bin');
  const pathEnv = process.env.PATH || '';
  return pathEnv.split(path.delimiter).includes(prefixBin);
}

/**
 * Check write permissions to key directories.
 * @returns {Object<string, boolean>}
 */
function checkPermissions() {
  const dirs = [getHome(), getPrefix()];
  const results = {};
  for (const dir of dirs) {
    try {
      fs.accessSync(dir, fs.constants.W_OK);
      results[dir] = true;
    } catch (_) {
      results[dir] = false;
    }
  }
  return results;
}

/**
 * Class-based wrapper around the environment functions.
 * This allows callers to use `new Environment()` style if preferred.
 */
class Environment {
  isTermux() { return isTermux(); }
  getArchitecture() { return getArchitecture(); }
  getPrefix() { return getPrefix(); }
  getHome() { return getHome(); }
  getShell() { return getShell(); }
  getPackageManager() { return getPackageManager(); }
  getSystemInfo() { return getSystemInfo(); }
  checkPath() { return checkPath(); }
  checkPermissions() { return checkPermissions(); }

  /** Alias used by UI/command modules. Returns same shape as getSystemInfo(). */
  async getInfo() { return getSystemInfo(); }
}

module.exports = {
  isTermux,
  getArchitecture,
  getPrefix,
  getHome,
  getShell,
  getPackageManager,
  getSystemInfo,
  checkPath,
  checkPermissions,
  Environment,
};
