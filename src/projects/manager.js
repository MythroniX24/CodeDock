'use strict';

/**
 * @file src/projects/manager.js
 * ProjectManager — manages recent project directories, path validation,
 * and new project creation.
 *
 * Can be instantiated with no args (uses global config) or with a config.
 */
const fs = require('fs');
const path = require('path');
const config = require('../core/config');

class ProjectManager {
  /**
   * @param {object} [configInstance] - optional, defaults to global config
   */
  constructor(configInstance) {
    this.config = configInstance || config;
  }

  /**
   * Get recent projects as an array of path strings.
   * @returns {string[]}
   */
  getRecentProjects() {
    return this.config.getProjects();
  }

  /**
   * Add a project path to the recent list.
   * Accepts either a path string or {name, path} object.
   * @param {string|object} project
   * @returns {boolean}
   */
  addProject(project) {
    const projectPath = typeof project === 'string' ? project : project.path;
    const resolved = this.resolveHome(projectPath);

    if (!this.validatePath(resolved)) return false;

    this.config.addProject(resolved);
    return true;
  }

  /**
   * Remove a project from the recent list.
   * Does NOT delete the actual directory.
   * @param {string} projectPath
   */
  removeProject(projectPath) {
    const resolved = this.resolveHome(projectPath);
    this.config.removeProject(resolved);
  }

  /**
   * Create a new project directory.
   * @param {string} parentDir
   * @param {string} name
   * @returns {string} the absolute path of the created project
   */
  createProject(parentDir, name) {
    if (!name || !name.trim()) {
      throw new Error('Project name cannot be empty');
    }

    const resolvedParent = this.resolveHome(parentDir);
    if (!this.validatePath(resolvedParent)) {
      throw new Error(`Invalid parent directory: ${parentDir}`);
    }

    const projectPath = path.join(resolvedParent, name.trim());

    if (fs.existsSync(projectPath)) {
      throw new Error(`Directory already exists: ${projectPath}`);
    }

    fs.mkdirSync(projectPath, { recursive: true });
    this.config.addProject(projectPath);
    return projectPath;
  }

  /**
   * Validate that a path is safe.
   * @param {string} dirPath
   * @returns {boolean}
   */
  validatePath(dirPath) {
    if (!dirPath) return false;
    const normalized = path.normalize(dirPath);
    // Block null bytes
    if (normalized.includes('\0')) return false;
    // Must be absolute
    return path.isAbsolute(normalized);
  }

  /**
   * Resolve ~ to $HOME.
   * @param {string} dirPath
   * @returns {string}
   */
  resolveHome(dirPath) {
    if (!dirPath) return '';
    const home = process.env.HOME || '/data/data/com.termux/files/home';
    if (dirPath === '~') return home;
    if (dirPath.startsWith('~/')) return path.join(home, dirPath.slice(2));
    return path.resolve(dirPath);
  }

  /**
   * Check if a directory exists.
   * @param {string} dirPath
   * @returns {boolean}
   */
  projectExists(dirPath) {
    try {
      return fs.statSync(dirPath).isDirectory();
    } catch (_) {
      return false;
    }
  }

  getDefaultDir() {
    return this.config.getDefaultProjectDir();
  }

  setDefaultDir(dirPath) {
    const resolved = this.resolveHome(dirPath);
    if (this.validatePath(resolved)) {
      this.config.setDefaultProjectDir(resolved);
    }
  }
}

module.exports = ProjectManager;
