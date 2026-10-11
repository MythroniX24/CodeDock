'use strict';

const { execSync, spawnSync } = require('child_process');
const logger = require('./logger');

/**
 * Handles Proot-Distro subsystem setup for tools that require glibc (standard Linux).
 */
class ProotManager {
  constructor() {
    this.distro = 'ubuntu';
  }

  isProotDistroInstalled() {
    try {
      execSync('command -v proot-distro', { stdio: 'ignore' });
      return true;
    } catch (_) {
      return false;
    }
  }

  isUbuntuInstalled() {
    if (!this.isProotDistroInstalled()) return false;
    try {
      const output = execSync('proot-distro list', { encoding: 'utf8' });
      if (output.includes(`* ${this.distro}`) || output.includes(`${this.distro} (installed)`)) {
        return true;
      }
    } catch (_) {}
    try {
      execSync(`proot-distro login ${this.distro} -- echo "ok"`, { stdio: 'ignore' });
      return true;
    } catch (_) {
      return false;
    }
  }

  async ensureSubsystem() {
    if (!this.isProotDistroInstalled()) {
      logger.step('Installing proot-distro layer...', false);
      try {
        execSync('pkg install -y proot-distro', { stdio: 'inherit' });
        logger.step('proot-distro installed');
      } catch (e) {
        throw new Error('Failed to install proot-distro. Please run: pkg install proot-distro');
      }
    }

    if (!this.isUbuntuInstalled()) {
      logger.info(`Installing ${this.distro} subsystem (this will take a few minutes)...`);
      try {
        // We use spawnSync to show live output as it downloads rootfs
        spawnSync('proot-distro', ['install', this.distro], { stdio: 'inherit' });
        logger.success(`${this.distro} subsystem initialized!`);
        
        // Install base dependencies inside the subsystem
        logger.info('Installing base packages inside subsystem...');
        this.runInSubsystem('apt update && apt install -y curl wget git build-essential nodejs npm python3 pip', { stdio: 'inherit' });
      } catch (e) {
        throw new Error(`Failed to install ${this.distro} subsystem.`);
      }
    }
  }

  /**
   * Wrap a command to run inside the proot subsystem.
   * @param {string} command 
   * @param {string} [cwd] Target working directory inside the subsystem
   * @returns {string} The wrapped command
   */
  wrapCommand(command, cwd = null) {
    // Escape single quotes for bash -c
    const escapedCmd = command.replace(/'/g, "'\\''");
    const safeWorkDir = cwd ? `'${cwd.replace(/'/g, "'\\''")}'` : null;
    const workDirArgs = safeWorkDir ? `--work-dir ${safeWorkDir} --bind ${safeWorkDir}` : '--bind "$PWD"';
    return `proot-distro login ${this.distro} ${workDirArgs} -- bash -c '${escapedCmd}'`;
  }

  runInSubsystem(command, options = {}) {
    const cwd = options.cwd || process.cwd();
    const wrapped = this.wrapCommand(command, cwd);
    return execSync(wrapped, options);
  }
}

module.exports = new ProotManager();
