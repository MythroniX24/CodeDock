'use strict';

/**
 * @file src/dependencies/manager.js
 * DependencyManager — detects, installs, and verifies system dependencies
 * across Termux, Windows, macOS, and standard Linux.
 */
const { execSync, spawn } = require('child_process');
const os = require('os');
const semver = require('semver');
const logger = require('../core/logger');
const { getPackageManager } = require('../core/environment');

const DEP_DETECTION = {
  nodejs: { detect: 'node --version', regex: /v?(\d+\.\d+\.\d+)/ },
  node: { detect: 'node --version', regex: /v?(\d+\.\d+\.\d+)/ },
  npm: { detect: 'npm --version', regex: /(\d+\.\d+\.\d+)/ },
  python: { detect: 'python3 --version', regex: /Python (\d+\.\d+\.\d+)/ },
  pip: { detect: 'pip3 --version', regex: /pip (\d+\.\d+[\.\d]*)/ },
  git: { detect: 'git --version', regex: /git version (\d+\.\d+[\.\d]*)/ },
  curl: { detect: 'curl --version', regex: /curl (\d+\.\d+[\.\d]*)/ },
  wget: { detect: 'wget --version', regex: /GNU Wget (\d+\.\d+[\.\d]*)/ },
  rust: { detect: 'rustc --version', regex: /rustc (\d+\.\d+\.\d+)/ },
  cargo: { detect: 'cargo --version', regex: /cargo (\d+\.\d+\.\d+)/ },
  golang: { detect: 'go version', regex: /go version go(\d+\.\d+[\.\d]*)/ },
};

class DependencyManager {
  constructor() {
    this.pkgManager = getPackageManager();
  }

  getInstallCommand(depName) {
    const isWin = os.platform() === 'win32';
    const sudo = (isWin || this.pkgManager === 'pkg' || this.pkgManager === 'brew') ? '' : 'sudo ';

    const commands = {
      node: {
        pkg: 'pkg install -y nodejs-lts',
        apt: `${sudo}apt-get install -y nodejs npm`,
        brew: 'brew install node',
        winget: 'winget install OpenJS.NodeJS',
        choco: 'choco install nodejs'
      },
      python: {
        pkg: 'pkg install -y python',
        apt: `${sudo}apt-get install -y python3 python3-pip`,
        brew: 'brew install python',
        winget: 'winget install Python.Python.3',
        choco: 'choco install python'
      },
      git: {
        pkg: 'pkg install -y git',
        apt: `${sudo}apt-get install -y git`,
        brew: 'brew install git',
        winget: 'winget install Git.Git',
        choco: 'choco install git'
      },
      curl: {
        pkg: 'pkg install -y curl',
        apt: `${sudo}apt-get install -y curl`,
        brew: 'brew install curl',
        winget: '', // Default on Windows 10+
        choco: 'choco install curl'
      },
      rust: {
        pkg: 'pkg install -y rust',
        apt: `${sudo}apt-get install -y rustc cargo`,
        brew: 'brew install rust',
        winget: 'winget install Rustlang.Rustup',
        choco: 'choco install rust'
      },
      golang: {
        pkg: 'pkg install -y golang',
        apt: `${sudo}apt-get install -y golang`,
        brew: 'brew install go',
        winget: 'winget install GoLang.Go',
        choco: 'choco install golang'
      }
    };

    // Aliases
    commands['nodejs'] = commands['node'];
    
    // Dependencies bundled with others
    if (['npm', 'pip', 'cargo'].includes(depName)) return '';

    const cmdSet = commands[depName];
    if (!cmdSet) return '';
    return cmdSet[this.pkgManager] || '';
  }

  detect(depName) {
    const conf = DEP_DETECTION[depName];
    if (!conf) return { installed: false, version: null, path: null };

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
        const whereCmd = os.platform() === 'win32' ? `where ${cmdBin}` : `command -v ${cmdBin}`;
        depPath = execSync(whereCmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }).trim();
      } catch (_) { /* ignore */ }

      return { installed: true, version, path: depPath };
    } catch (_) {
      return { installed: false, version: null, path: null };
    }
  }

  isInstalled(depName) {
    return this.detect(depName).installed;
  }

  checkVersion(depName, minVersion) {
    const info = this.detect(depName);
    if (!info.installed) return { compatible: false, current: null, required: minVersion };
    if (!minVersion || info.version === 'unknown') return { compatible: true, current: info.version, required: minVersion };

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

  install(depName) {
    return new Promise((resolve, reject) => {
      const conf = DEP_DETECTION[depName];
      if (!conf) return reject(new Error(`Unknown dependency: ${depName}`));
      
      const installCmdStr = this.getInstallCommand(depName);
      if (!installCmdStr) {
        return resolve(); // Bundled or unsupported auto-install
      }

      logger.info(`Installing dependency: ${depName}...`);

      const parts = installCmdStr.split(' ');
      const cmd = parts[0];
      const args = parts.slice(1);

      const child = spawn(cmd, args, { stdio: 'inherit', shell: os.platform() === 'win32' });

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

  verify(depName) {
    return this.detect(depName).installed;
  }

  update(depName) {
    return this.install(depName);
  }

  getAll() {
    const status = {};
    const seen = new Set();
    for (const dep of Object.keys(DEP_DETECTION)) {
      const canonical = dep === 'nodejs' ? 'node' : dep;
      if (seen.has(canonical)) continue;
      seen.add(canonical);
      status[canonical] = this.detect(dep);
    }
    return status;
  }

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
          result.incompatible.push({ dep: depName, current: check.current, required: check.required });
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
