'use strict';

/**
 * @file src/core/config.js
 * Local configuration manager with atomic writes.
 *
 * Stores configuration, recent projects, and tool state under ~/.codedock/.
 */
const fs = require('fs');
const path = require('path');
const { getHome } = require('./environment');

const CONFIG_DIR = path.join(getHome(), '.codedock');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');
const PROJECTS_FILE = path.join(CONFIG_DIR, 'projects.json');
const TOOLS_STATE_FILE = path.join(CONFIG_DIR, 'tools-state.json');

class ConfigManager {
  constructor() {
    this._ensureDir();
    this.config = this._readJson(CONFIG_FILE, {});
    this.projects = this._readJson(PROJECTS_FILE, []);
    this.toolsState = this._readJson(TOOLS_STATE_FILE, {});
  }

  _ensureDir() {
    if (!fs.existsSync(CONFIG_DIR)) {
      fs.mkdirSync(CONFIG_DIR, { recursive: true });
    }
  }

  /**
   * Read a JSON file, returning defaultValue on any error.
   */
  _readJson(filePath, defaultValue) {
    if (!fs.existsSync(filePath)) return defaultValue;
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(content);
    } catch (_) {
      return defaultValue;
    }
  }

  /**
   * Write JSON atomically (write tmp → rename).
   */
  _writeJson(filePath, data) {
    const tmpFile = `${filePath}.tmp.${Date.now()}`;
    try {
      fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2), 'utf8');
      fs.renameSync(tmpFile, filePath);
    } catch (err) {
      try { if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile); } catch (_) { /* ignore */ }
      throw err;
    }
  }

  load() {
    this.config = this._readJson(CONFIG_FILE, {});
    this.projects = this._readJson(PROJECTS_FILE, []);
    this.toolsState = this._readJson(TOOLS_STATE_FILE, {});
  }

  save() {
    this._writeJson(CONFIG_FILE, this.config);
    this._writeJson(PROJECTS_FILE, this.projects);
    this._writeJson(TOOLS_STATE_FILE, this.toolsState);
  }

  get(key, defaultValue) {
    return this.config[key] !== undefined ? this.config[key] : defaultValue;
  }

  set(key, value) {
    this.config[key] = value;
    this._writeJson(CONFIG_FILE, this.config);
  }

  /**
   * Return all config key/values.
   */
  getAll() {
    return { ...this.config };
  }

  // ── Projects ────────────────────────────────────────────────────────

  /**
   * Get recent projects as an array of path strings.
   * @returns {string[]}
   */
  getProjects() {
    return this.projects;
  }

  /**
   * Add a project path to the top of the recent list.
   * @param {string} projectPath
   */
  addProject(projectPath) {
    // Remove if already present so it moves to top
    this.projects = this.projects.filter(p => p !== projectPath);
    this.projects.unshift(projectPath);
    if (this.projects.length > 20) this.projects.pop();
    this._writeJson(PROJECTS_FILE, this.projects);
  }

  /**
   * Remove a project path from the recent list (does NOT delete files).
   * @param {string} projectPath
   */
  removeProject(projectPath) {
    this.projects = this.projects.filter(p => p !== projectPath);
    this._writeJson(PROJECTS_FILE, this.projects);
  }

  // ── Tool State ──────────────────────────────────────────────────────

  getToolState(toolId) {
    return this.toolsState[toolId] || {};
  }

  setToolState(toolId, state) {
    this.toolsState[toolId] = { ...this.toolsState[toolId], ...state };
    this._writeJson(TOOLS_STATE_FILE, this.toolsState);
  }

  // ── API Key Vault ───────────────────────────────────────────────────
  
  getApiKeys() {
    return this.get('apiKeys', {});
  }
  
  getApiKey(name) {
    const keys = this.getApiKeys();
    return keys[name] || '';
  }
  
  setApiKey(name, value) {
    const keys = this.getApiKeys();
    if (value) {
      keys[name] = value;
    } else {
      delete keys[name];
    }
    this.set('apiKeys', keys);
  }

  // ── Default project dir ─────────────────────────────────────────────

  getDefaultProjectDir() {
    return this.get('defaultProjectDir', path.join(getHome(), 'Projects'));
  }

  setDefaultProjectDir(projectPath) {
    this.set('defaultProjectDir', projectPath);
  }
}

module.exports = new ConfigManager();
