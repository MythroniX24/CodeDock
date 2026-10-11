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

  resolveHome(dirPath) {
    if (!dirPath) return '';
    const { getHome } = require('../core/environment');
    const home = getHome();
    if (dirPath === '~') return home;
    
    // Support both ~/ (unix) and ~\ (windows)
    if (dirPath.startsWith('~/') || dirPath.startsWith('~\\')) {
      return path.join(home, dirPath.slice(2));
    }
    return path.resolve(dirPath);
  }

  /**
   * Resolve an input string into a valid project directory path.
   * Handles ~, relative paths, default projects directory fallback, and converts files to directory.
   * @param {string} input
   * @returns {string|null}
   */
  resolveProjectPath(input) {
    if (!input || !input.trim()) return null;
    const trimmed = input.trim();
    let resolved = this.resolveHome(trimmed);

    // If path doesn't exist directly and isn't absolute or starting with ~, check default projects directory
    if (!fs.existsSync(resolved) && !path.isAbsolute(trimmed) && !trimmed.startsWith('~')) {
      const defaultDir = this.resolveHome(this.getDefaultDir());
      const inDefault = path.join(defaultDir, trimmed);
      if (fs.existsSync(inDefault)) {
        resolved = inDefault;
      }
    }

    // If it points to an existing file, get its directory
    if (fs.existsSync(resolved)) {
      try {
        const stat = fs.statSync(resolved);
        if (!stat.isDirectory()) {
          resolved = path.dirname(resolved);
        }
      } catch (_) {}
    }

    return resolved;
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
