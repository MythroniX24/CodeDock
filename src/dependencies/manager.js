'use strict';

/**
 * @file src/dependencies/manager.js
 * DependencyManager — detects, installs, and verifies system dependencies.
 *
 * Understands Termux's package ecosystem (pkg) and external package
 * managers (npm, pip, cargo) when required by tool manifests.
 */
const { execSync, spawn } = require('child_process');
const semver = require('semver');
const logger = require('../core/logger');

/**
 * Map of known dependency names to their detection and installation info.
 * Each entry specifies:
 *   detect  — shell command to detect presence + version
 *   install — Termux pkg install command (empty = comes with another package)
 *   regex   — pattern to extract version from detect output
 */
const DEP_COMMANDS = {
  nodejs:             { detect: 'node --version',      install: 'pkg install -y nodejs-lts',    regex: /v?(\d+\.\d+\.\d+)/ },
  node:               { detect: 'node --version',      install: 'pkg install -y nodejs-lts',    regex: /v?(\d+\.\d+\.\d+)/ },
  npm:                { detect: 'npm --version',       install: '',                             regex: /(\d+\.\d+\.\d+)/ },
  python:             { detect: 'python3 --version',   install: 'pkg install -y python',        regex: /Python (\d+\.\d+\.\d+)/ },
  pip:                { detect: 'pip3 --version',      install: '',                             regex: /pip (\d+\.\d+[\.\d]*)/ },
  git:                { detect: 'git --version',       install: 'pkg install -y git',           regex: /git version (\d+\.\d+[\.\d]*)/ },
  curl:               { detect: 'curl --version',      install: 'pkg install -y curl',          regex: /curl (\d+\.\d+[\.\d]*)/ },
  wget:               { detect: 'wget --version',      install: 'pkg install -y wget',          regex: /GNU Wget (\d+\.\d+[\.\d]*)/ },
  rust:               { detect: 'rustc --version',     install: 'pkg install -y rust',          regex: /rustc (\d+\.\d+\.\d+)/ },
  cargo:              { detect: 'cargo --version',     install: '',                             regex: /cargo (\d+\.\d+\.\d+)/ },
  'build-essential':  { detect: 'make --version',      install: 'pkg install -y build-essential', regex: /GNU Make (\d+[\.\d]*)/ },
  golang:             { detect: 'go version',          install: 'pkg install -y golang',        regex: /go version go(\d+\.\d+[\.\d]*)/ },
};

class DependencyManager {
  /**
   * Detect whether a dependency is installed and its version.
   * @param {string} depName
   * @returns {{ installed: boolean, version: string|null, path: string|null }}
   */
  detect(depName) {
    const conf = DEP_COMMANDS[depName];
    if (!conf) {
      return { installed: false, version: null, path: null };
    }
    try {
      const output = execSync(conf.detect, {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'ignore'],
        timeout: 10000,
      }).trim();

      const match = output.match(conf.regex);
      const version = match ? match[1] : 'unknown';

      let depPath = '';
      try {
        const cmdBin = conf.detect.split(' ')[0];
        depPath = execSync(`command -v ${cmdBin}`, {
          encoding: 'utf8',
          stdio: ['pipe', 'pipe', 'ignore'],
        }).trim();
      } catch (_) { /* ignore */ }

      return { installed: true, version, path: depPath };
    } catch (_) {
      return { installed: false, version: null, path: null };
    }
  }

  /**
   * Convenience alias for detect().installed.
   * Used by UI and command modules.
   * @param {string} depName
   * @returns {boolean}
   */
  isInstalled(depName) {
    return this.detect(depName).installed;
  }

  /**
   * Check whether the installed version satisfies a minimum.
   * @param {string} depName
   * @param {string} minVersion
   * @returns {{ compatible: boolean, current: string|null, required: string }}
   */
  checkVersion(depName, minVersion) {
    const info = this.detect(depName);
    if (!info.installed) {
      return { compatible: false, current: null, required: minVersion };
    }
    if (!minVersion || info.version === 'unknown') {
      return { compatible: true, current: info.version, required: minVersion };
    }

    const currentSemver = semver.coerce(info.version);
    const minSemver = semver.coerce(minVersion);

    if (currentSemver && minSemver) {
      return {
        compatible: semver.gte(currentSemver, minSemver),
        current: info.version,
        required: minVersion,
      };
    }

    return { compatible: true, current: info.version, required: minVersion };
  }

  /**
   * Install a dependency via Termux pkg or relevant package manager.
   * Returns a promise that resolves when installation is done.
   * @param {string} depName
   * @returns {Promise<void>}
   */
  install(depName) {
    return new Promise((resolve, reject) => {
      const conf = DEP_COMMANDS[depName];
      if (!conf) return reject(new Error(`Unknown dependency: ${depName}`));
      if (!conf.install) {
        // Comes bundled with another package
        return resolve();
      }

      logger.info(`Installing dependency: ${depName}...`);

      const parts = conf.install.split(' ');
      const cmd = parts[0];
      const args = parts.slice(1);

      const child = spawn(cmd, args, { stdio: 'inherit' });

      child.on('error', (err) => {
        reject(new Error(`Failed to install ${depName}: ${err.message}`));
      });

      child.on('close', (code) => {
        if (code === 0) {
          logger.success(`${depName} installed successfully.`);
          resolve();
        } else {
          reject(new Error(`Failed to install ${depName} (exit code ${code})`));
        }
      });
    });
  }

  /**
   * Verify that a dependency is functional.
   * @param {string} depName
   * @returns {boolean}
   */
  verify(depName) {
    return this.detect(depName).installed;
  }

  /**
   * Update a dependency (re-install).
   * @param {string} depName
   * @returns {Promise<void>}
   */
  update(depName) {
    return this.install(depName);
  }

  /**
   * Get status of all known dependencies.
   * @returns {Object<string, { installed: boolean, version: string|null, path: string|null }>}
   */
  getAll() {
    const status = {};
    // Deduplicate: 'node' and 'nodejs' are the same
    const seen = new Set();
    for (const dep of Object.keys(DEP_COMMANDS)) {
      const canonical = dep === 'nodejs' ? 'node' : dep;
      if (seen.has(canonical)) continue;
      seen.add(canonical);
      status[canonical] = this.detect(dep);
    }
    return status;
  }

  /**
   * Resolve dependencies from a tool manifest.
   *
   * Manifest dependencies format:
   *   [ { name: "nodejs", minVersion: "18.0.0", required: true }, ... ]
   *
   * @param {object} manifest
   * @returns {{ satisfied: Array, missing: Array, incompatible: Array }}
   */
  resolveDependencies(manifest) {
    const deps = manifest.dependencies || [];
    const result = { satisfied: [], missing: [], incompatible: [] };

    for (const dep of deps) {
      const depName = dep.name || dep;
      const minVersion = dep.minVersion || null;

      const info = this.detect(depName);

      if (!info.installed) {
        result.missing.push(depName);
      } else if (minVersion) {
        const check = this.checkVersion(depName, minVersion);
        if (!check.compatible) {
          result.incompatible.push({
            dep: depName,
            current: check.current,
            required: check.required,
          });
        } else {
          result.satisfied.push({ dep: depName, version: check.current });
        }
      } else {
        result.satisfied.push({ dep: depName, version: info.version });
      }
    }

    return result;
  }
}

module.exports = DependencyManager;
