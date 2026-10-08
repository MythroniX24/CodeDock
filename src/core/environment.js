'use strict';

/**
 * @file src/core/environment.js
 * Cross-platform environment detection and system info.
 */
const os = require('os');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

function isTermux() {
  return (
    process.env.PREFIX !== undefined ||
    process.env.TERMUX_VERSION !== undefined ||
    fs.existsSync('/data/data/com.termux')
  );
}

function getArchitecture() {
  try {
    const uname = execSync('uname -m', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }).trim();
    if (uname) return uname;
  } catch (_) { /* fall through */ }

  const arch = process.arch;
  const map = { arm64: 'aarch64', arm: 'armv7l', x64: 'x86_64', ia32: 'i686' };
  return map[arch] || arch;
}

function getPrefix() {
  if (isTermux()) return process.env.PREFIX || '/data/data/com.termux/files/usr';
  return process.env.PREFIX || '/usr/local';
}

function getHome() {
  if (isTermux()) return process.env.HOME || '/data/data/com.termux/files/home';
  return os.homedir();
}

function getShell() {
  if (os.platform() === 'win32') return process.env.COMSPEC || 'cmd.exe';
  return process.env.SHELL || '/bin/bash';
}

function getPackageManager() {
  if (isTermux()) return 'pkg';
  
  if (os.platform() === 'win32') {
    try { execSync('winget --version', { stdio: 'ignore' }); return 'winget'; } catch(_) {}
    try { execSync('choco --version', { stdio: 'ignore' }); return 'choco'; } catch(_) {}
    return 'npm'; // fallback
  }
  
  if (os.platform() === 'darwin') {
    try { execSync('brew --version', { stdio: 'ignore' }); return 'brew'; } catch(_) {}
    return 'npm';
  }
  
  // Linux
  try { execSync('command -v apt', { stdio: 'ignore' }); return 'apt'; } catch(_) {}
  try { execSync('command -v dnf', { stdio: 'ignore' }); return 'dnf'; } catch(_) {}
  try { execSync('command -v pacman', { stdio: 'ignore' }); return 'pacman'; } catch(_) {}
  
  return 'npm'; // Universal fallback
}

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

function checkPath() {
  const prefixBin = path.join(getPrefix(), 'bin');
  const pathEnv = process.env.PATH || '';
  return pathEnv.split(path.delimiter).includes(prefixBin);
}

function checkPermissions() {
  const dirs = [getHome()];
  if (os.platform() !== 'win32') dirs.push(getPrefix());
  
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
