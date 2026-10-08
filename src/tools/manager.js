'use strict';

/**
 * @file src/tools/manager.js
 * ToolManager — orchestrates tool discovery, installation, updating,
 * removal, verification, and launching.
 *
 * All command and UI modules instantiate this as `new ToolManager()`.
 * It internally creates its own DependencyManager, Config, and Environment
 * so that callers do not need to wire dependencies manually.
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

class ToolManager {
  /**
   * Create a ToolManager.
   * Can be called with no arguments — it wires its own dependencies.
   *
   * @param {DependencyManager} [depManager]
   * @param {object} [configInstance]
   * @param {object} [environment]
   */
  constructor(depManager, configInstance, environment) {
    this.depManager = depManager || new DependencyManager();
    this.config = configInstance || config;
    this.env = environment || { getSystemInfo };

    // Auto-discover tools on construction
    registry.discoverTools();
  }

  // ── Discovery ─────────────────────────────────────────────────────

  /**
   * Discover and return all tool manifests.
   * @returns {object[]}
   */
  async discoverTools() {
    return registry.discoverTools();
  }

  /**
   * Get all tool manifests (alias used by UI/commands).
   * @returns {object[]}
   */
  async getAllTools() {
    return registry.discoverTools();
  }

  /**
   * Get a single tool manifest by id or alias.
   * @param {string} id
   * @returns {object|null}
   */
  async getTool(id) {
    let tool = registry.getToolById(id);
    if (!tool) tool = registry.getToolByAlias(id);
    return tool || null;
  }

  // ── Status ────────────────────────────────────────────────────────

  /**
   * Check if a tool is installed and verified.
   * @param {string} id
   * @returns {Promise<boolean>}
   */
  async isToolInstalled(id) {
    const state = this.config.getToolState(id);
    if (!state.installed) return false;
    // Also verify the binary is actually available
    return await this.verifyTool(id);
  }

  /**
   * Get detailed status for a tool.
   * @param {string} id
   * @returns {Promise<object>}
   */
  async getStatus(id) {
    const state = this.config.getToolState(id);
    const verified = await this.verifyTool(id);
    return {
      installed: !!state.installed && verified,
      installedAt: state.installedAt || null,
      verified,
    };
  }

  // ── Install ───────────────────────────────────────────────────────

  /**
   * Full install workflow:
   * 1. Load manifest
   * 2. Check architecture compatibility
   * 3. Resolve dependencies
   * 4. Install missing dependencies
   * 5. Execute install command
   * 6. Verify installation
   * 7. Save tool state
   *
   * @param {string} id
   * @param {object} [options]
   * @returns {Promise<boolean>}
   */
  async installTool(id, options = {}) {
    const tool = await this.getTool(id);
    if (!tool) throw new Error(`Tool not found: ${id}`);

    const sysInfo = getSystemInfo();

    // 1. Architecture check
    if (tool.architectures && tool.architectures.length > 0) {
      if (!tool.architectures.includes(sysInfo.architecture)) {
        throw new Error(
          `Architecture '${sysInfo.architecture}' is not supported by ${tool.name}. ` +
          `Supported: ${tool.architectures.join(', ')}`
        );
      }
      logger.step(`Architecture ${sysInfo.architecture} supported`);
    }

    // 2. Resolve dependencies
    const deps = this.depManager.resolveDependencies(tool);

    for (const s of deps.satisfied) {
      logger.step(`${s.dep} ${s.version || ''} detected`);
    }

    // 3. Install missing
    for (const depName of deps.missing) {
      logger.step(`${depName} missing — installing...`, false);
      try {
        await this.depManager.install(depName);
        logger.step(`${depName} installed`);
      } catch (err) {
        throw new Error(`Failed to install required dependency '${depName}': ${err.message}`);
      }
    }

    // 4. Warn about incompatible versions
    for (const inc of deps.incompatible) {
      logger.warn(
        `${inc.dep} is v${inc.current}, but ${tool.name} requires v${inc.required}+. ` +
        `Proceeding anyway — update may be needed.`
      );
    }

    // 5. Execute install command
    const installCmd = getInstallCommand(tool, sysInfo);
    if (!installCmd) {
      throw new Error(`No install command defined for ${tool.name}`);
    }

    logger.info(`Running: ${installCmd}`);
    try {
      // Use shell for the install command since it may contain pipes or &&
      execSync(installCmd, { stdio: 'inherit', shell: true, timeout: 600000 });
    } catch (err) {
      throw new Error(`Install command failed for ${tool.name}`);
    }

    // 6. Verify
    const verified = await this.verifyTool(id);
    if (verified) {
      logger.step(`${tool.command} command verified`);
    } else {
      logger.warn(`Could not verify '${tool.command}' command — installation may have partially succeeded`);
    }

    // 7. Save state
    this.config.setToolState(id, {
      installed: true,
      installedAt: new Date().toISOString(),
    });

    return true;
  }

  // ── Uninstall ─────────────────────────────────────────────────────

  /**
   * Uninstall a tool.
   * @param {string} id
   * @returns {Promise<void>}
   */
  async uninstallTool(id) {
    const tool = await this.getTool(id);
    if (!tool) throw new Error(`Tool not found: ${id}`);

    const sysInfo = getSystemInfo();
    const cmd = getUninstallCommand(tool, sysInfo);

    if (cmd) {
      logger.info(`Running: ${cmd}`);
      execSync(cmd, { stdio: 'inherit', shell: true, timeout: 120000 });
    }

    this.config.setToolState(id, { installed: false, installedAt: null });
    logger.success(`${tool.name} uninstalled.`);
  }

  // ── Update ────────────────────────────────────────────────────────

  /**
   * Update a tool.
   * @param {string} id
   * @returns {Promise<void>}
   */
  async updateTool(id) {
    const tool = await this.getTool(id);
    if (!tool) throw new Error(`Tool not found: ${id}`);

    const sysInfo = getSystemInfo();
    const cmd = getUpdateCommand(tool, sysInfo) || getInstallCommand(tool, sysInfo);

    if (cmd) {
      logger.info(`Running: ${cmd}`);
      execSync(cmd, { stdio: 'inherit', shell: true, timeout: 600000 });
      logger.success(`${tool.name} updated.`);
    } else {
      logger.warn(`No update command defined for ${tool.name}`);
    }
  }

  // ── Verify ────────────────────────────────────────────────────────

  /**
   * Verify that a tool's CLI binary is accessible.
   * @param {string} id
   * @returns {Promise<boolean>}
   */
  async verifyTool(id) {
    const tool = await this.getTool(id);
    if (!tool) return false;

    const verifyCmd = getVerifyCommand(tool);
    if (!verifyCmd) return true; // no verification defined = trust

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

  // ── Launch ────────────────────────────────────────────────────────

  /**
   * Launch a tool in a project directory.
   * Uses spawnSync with stdio:'inherit' for full interactive terminal access.
   *
   * @param {string} id
   * @param {string} [projectDir]
   */
  async launchTool(id, projectDir) {
    const tool = await this.getTool(id);
    if (!tool) throw new Error(`Tool not found: ${id}`);

    const command = getLaunchCommand(tool);
    const args = getLaunchArgs(tool);
    if (!command) throw new Error(`No launch command for tool: ${id}`);

    const cwd = projectDir || process.cwd();

    logger.info(`Launching ${tool.name} in ${cwd}...`);
    logger.blank();

    // Full terminal passthrough — user gets interactive control
    const result = spawnSync(command, args, {
      cwd,
      stdio: 'inherit',
      env: process.env,
    });

    if (result.error) {
      throw new Error(`Failed to launch ${tool.name}: ${result.error.message}`);
    }
  }

  // ── List ──────────────────────────────────────────────────────────

  /**
   * List all tools with installation status.
   * @returns {Promise<Array<{ id: string, name: string, installed: boolean }>>}
   */
  async listTools() {
    const tools = await this.getAllTools();
    const results = [];
    for (const t of tools) {
      const installed = await this.isToolInstalled(t.id);
      results.push({ id: t.id, name: t.name, installed });
    }
    return results;
  }

  /**
   * Check all installed tools for available updates.
   * @returns {Promise<Array>}
   */
  async checkUpdates() {
    // TODO: Implement npm outdated / version comparison logic
    return [];
  }
}

module.exports = ToolManager;
