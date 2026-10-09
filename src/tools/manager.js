'use strict';

/**
 * @file src/tools/manager.js
 * ToolManager — orchestrates tool discovery, installation, updating,
 * removal, verification, and launching.
 */
const { spawnSync, execSync } = require('child_process');
const registry = require('./registry');
const {
  getInstallCommand,
  getUninstallCommand,
  getUpdateCommand,
  getVerifyCommand,
  getLaunchCommand,
  getLaunchArgs,
} = require('./manifest');
const logger = require('../core/logger');
const config = require('../core/config');
const { getSystemInfo } = require('../core/environment');
const DependencyManager = require('../dependencies/manager');
const proot = require('../core/proot');

class ToolManager {
  constructor(depManager, configInstance, environment) {
    this.depManager = depManager || new DependencyManager();
    this.config = configInstance || config;
    this.env = environment || { getSystemInfo };

    registry.discoverTools();
  }

  async discoverTools() {
    return registry.discoverTools();
  }

  async getAllTools() {
    return registry.discoverTools();
  }

  async getTool(id) {
    let tool = registry.getToolById(id);
    if (!tool) tool = registry.getToolByAlias(id);
    return tool || null;
  }

  async isToolInstalled(id) {
    const state = this.config.getToolState(id);
    const verified = await this.verifyTool(id);
    
    // Auto-detect externally installed tools
    if (verified && !state.installed) {
      this.config.setToolState(id, {
        installed: true,
        installedAt: new Date().toISOString(),
        proot: false
      });
      return true;
    }
    
    // Auto-fix state if tool was uninstalled externally
    if (!verified && state.installed) {
      this.config.setToolState(id, { installed: false, installedAt: null });
      return false;
    }
    
    return verified;
  }

  async getStatus(id) {
    const isInstalled = await this.isToolInstalled(id);
    const state = this.config.getToolState(id);
    return {
      installed: isInstalled,
      installedAt: state.installedAt || null,
      verified: isInstalled,
    };
  }

  _needsProot(tool, sysInfo) {
    return sysInfo.isTermux && tool.compatibility && tool.compatibility.termux === 'proot';
  }

  async installTool(id, options = {}) {
    const tool = await this.getTool(id);
    if (!tool) throw new Error(`Tool not found: ${id}`);

    const sysInfo = getSystemInfo();
    const needsProot = this._needsProot(tool, sysInfo);

    if (needsProot) {
      logger.info(`Tool ${tool.name} requires a Linux subsystem (glibc). Preparing proot-distro...`);
      await proot.ensureSubsystem();
    }

    if (tool.architectures && tool.architectures.length > 0) {
      if (!tool.architectures.includes(sysInfo.architecture)) {
        throw new Error(
          `Architecture '${sysInfo.architecture}' is not supported by ${tool.name}. ` +
          `Supported: ${tool.architectures.join(', ')}`
        );
      }
      logger.step(`Architecture ${sysInfo.architecture} supported`);
    }

    // Dependencies
    if (!needsProot) {
      const deps = this.depManager.resolveDependencies(tool);
      for (const s of deps.satisfied) logger.step(`${s.dep} ${s.version || ''} detected`);
      for (const depName of deps.missing) {
        logger.step(`${depName} missing — installing...`, false);
        try {
          await this.depManager.install(depName);
          logger.step(`${depName} installed`);
        } catch (err) {
          throw new Error(`Failed to install required dependency '${depName}': ${err.message}`);
        }
      }
      for (const inc of deps.incompatible) {
        logger.warn(`${inc.dep} is v${inc.current}, but ${tool.name} requires v${inc.required}+. Proceeding anyway.`);
      }
    } else {
      logger.step(`Dependencies will be managed inside the Ubuntu subsystem.`);
    }

    // Install command
    let installCmd = getInstallCommand(tool, sysInfo);
    if (!installCmd) throw new Error(`No install command defined for ${tool.name}`);

    if (needsProot) {
      installCmd = proot.wrapCommand(installCmd);
    }

    const healer = require('./healer');
    
    logger.info(`Running: ${installCmd}`);
    try {
      // Execute using the advanced Auto-Healing system
      healer.executeWithHealing(installCmd, 2);
    } catch (err) {
      throw new Error(`Installation failed for ${tool.name}: ${err.message}`);
    }

    const verified = await this.verifyTool(id);
    if (verified) {
      logger.step(`${tool.command} command verified`);
    } else {
      logger.warn(`Could not verify '${tool.command}' command — installation may have partially succeeded`);
    }

    this.config.setToolState(id, {
      installed: true,
      installedAt: new Date().toISOString(),
      proot: needsProot
    });

    return true;
  }

  async uninstallTool(id) {
    const tool = await this.getTool(id);
    if (!tool) throw new Error(`Tool not found: ${id}`);

    const sysInfo = getSystemInfo();
    let cmd = getUninstallCommand(tool, sysInfo);

    if (cmd) {
      if (this._needsProot(tool, sysInfo)) {
        cmd = proot.wrapCommand(cmd);
      }
      logger.info(`Running: ${cmd}`);
      execSync(cmd, { stdio: 'inherit', shell: true, timeout: 120000 });
    }

    this.config.setToolState(id, { installed: false, installedAt: null, proot: false });
    logger.success(`${tool.name} uninstalled.`);
  }

  async updateTool(id) {
    const tool = await this.getTool(id);
    if (!tool) throw new Error(`Tool not found: ${id}`);

    const sysInfo = getSystemInfo();
    let cmd = getUpdateCommand(tool, sysInfo) || getInstallCommand(tool, sysInfo);

    if (cmd) {
      if (this._needsProot(tool, sysInfo)) {
        cmd = proot.wrapCommand(cmd);
      }
      logger.info(`Running: ${cmd}`);
      execSync(cmd, { stdio: 'inherit', shell: true, timeout: 600000 });
      logger.success(`${tool.name} updated.`);
    } else {
      logger.warn(`No update command defined for ${tool.name}`);
    }
  }

  async verifyTool(id) {
    const tool = await this.getTool(id);
    if (!tool) return false;

    let verifyCmd = getVerifyCommand(tool);
    if (!verifyCmd) return true;

    const sysInfo = getSystemInfo();
    if (this._needsProot(tool, sysInfo)) {
      verifyCmd = proot.wrapCommand(verifyCmd);
    }

    try {
      execSync(verifyCmd, {
        stdio: 'ignore',
        shell: true,
        timeout: 15000,
      });
      return true;
    } catch (_) {
      return false;
    }
  }

  async launchTool(id, projectDir) {
    const tool = await this.getTool(id);
    if (!tool) throw new Error(`Tool not found: ${id}`);

    let command = getLaunchCommand(tool);
    let args = getLaunchArgs(tool);
    if (!command) throw new Error(`No launch command for tool: ${id}`);

    const cwd = projectDir || process.cwd();
    logger.info(`Launching ${tool.name} in ${cwd}...`);
    logger.blank();

    const sysInfo = getSystemInfo();
    const isWin = sysInfo.os === 'win32';

    if (this._needsProot(tool, sysInfo)) {
      // Build the full command line
      const fullArgs = args.map(a => `"${a}"`).join(' ');
      const fullCmd = `${command} ${fullArgs}`.trim();
      
      const wrapped = proot.wrapCommand(`cd "$PWD" && ${fullCmd}`);
      
      const result = spawnSync(wrapped, [], {
        cwd,
        stdio: 'inherit',
        env: process.env,
        shell: true
      });

      if (result.error) {
        throw new Error(`Failed to launch ${tool.name}: ${result.error.message}`);
      }
    } else {
      const result = spawnSync(command, args, {
        cwd,
        stdio: 'inherit',
        env: process.env,
        shell: isWin
      });

      if (result.error) {
        throw new Error(`Failed to launch ${tool.name}: ${result.error.message}`);
      }
    }
  }

  async listTools() {
    const tools = await this.getAllTools();
    const results = [];
    for (const t of tools) {
      const installed = await this.isToolInstalled(t.id);
      results.push({ id: t.id, name: t.name, installed });
    }
    return results;
  }

  async checkUpdates() {
    return [];
  }
}

module.exports = ToolManager;
