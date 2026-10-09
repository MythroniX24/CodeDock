'use strict';

const { spawnSync } = require('child_process');
const os = require('os');
const logger = require('../core/logger');
const { getPackageManager } = require('../core/environment');

class AutoHealer {
  /**
   * Executes a shell command, streams output to the terminal, and captures stderr.
   * If it fails, uses heuristics to identify the error, apply a fix, and retry.
   */
  executeWithHealing(command, maxRetries = 2) {
    let currentCommand = command;
    let attempt = 0;
    
    while (attempt <= maxRetries) {
      if (attempt > 0) {
        logger.info(`\n[Auto-Healer] Retrying (${attempt}/${maxRetries}): ${currentCommand}`);
      }
      
      let stderrOutput = '';
      const isWin = os.platform() === 'win32';
      
      // We use spawnSync to stream output but also capture stderr for analysis
      const child = spawnSync(currentCommand, [], {
        shell: true,
        encoding: 'utf8'
      });

      // Since we didn't use inherit (to capture output), we print it manually
      if (child.stdout) process.stdout.write(child.stdout);
      if (child.stderr) {
        process.stderr.write(child.stderr);
        stderrOutput += child.stderr;
      }

      if (child.status === 0 && !child.error) {
        if (attempt > 0) logger.success(`[Auto-Healer] Command succeeded after automated fix!`);
        return true;
      }

      attempt++;
      if (attempt > maxRetries) {
        const err = child.error ? child.error.message : `Exit code ${child.status}`;
        throw new Error(`Command failed after ${maxRetries} retry attempts. Error: ${err}`);
      }

      const errMsg = stderrOutput.toLowerCase();
      logger.warn(`\n[Auto-Healer] Installation failed. Analyzing error...`);

      // ── Rule 1: EACCES / Permission Denied ──
      if (errMsg.includes('eacces') || errMsg.includes('permission denied')) {
        logger.step(`Auto-Fix: Detected permission error.`, false);
        if (!isWin && !process.env.PREFIX) {
          logger.step(`Applying fix: Elevating with sudo...`);
          currentCommand = `sudo ${currentCommand}`;
          continue;
        } else if (process.env.PREFIX && currentCommand.includes('npm')) {
           logger.step(`Applying fix: Cleaning npm cache & bypassing bin links...`);
           currentCommand = `${currentCommand} --no-bin-links --unsafe-perm`;
           continue;
        }
      }

      // ── Rule 2: Python PEP 668 (Externally Managed Environment) ──
      if (errMsg.includes('externally-managed-environment')) {
        logger.step(`Auto-Fix: Detected Python PEP-668 restriction.`, false);
        logger.step(`Applying fix: Adding --break-system-packages flag...`);
        currentCommand = currentCommand.replace(/pip install/g, 'pip install --break-system-packages');
        currentCommand = currentCommand.replace(/pip3 install/g, 'pip3 install --break-system-packages');
        continue;
      }

      // ── Rule 3: Missing Build Tools (node-gyp, make, gcc) ──
      if (errMsg.includes('node-gyp') || errMsg.includes('make: not found') || errMsg.includes('gcc: command not found') || errMsg.includes('c++: not found')) {
        logger.step(`Auto-Fix: Missing C++/native build tools.`, false);
        logger.step(`Applying fix: Installing build-essential packages...`);
        try {
          const pkgMgr = getPackageManager();
          if (pkgMgr === 'pkg') spawnSync('pkg install -y build-essential python', { shell: true, stdio: 'ignore' });
          else if (pkgMgr === 'apt') spawnSync('sudo apt-get install -y build-essential python3', { shell: true, stdio: 'ignore' });
          else if (pkgMgr === 'brew') spawnSync('brew install make gcc', { shell: true, stdio: 'ignore' });
        } catch(e) {}
        continue;
      }

      // ── Rule 4: Network Timeouts (ENOTFOUND, ETIMEDOUT) ──
      if (errMsg.includes('enotfound') || errMsg.includes('etimedout') || errMsg.includes('network error')) {
        logger.step(`Auto-Fix: Detected network or registry timeout.`, false);
        logger.step(`Applying fix: Switching registry (if npm) and waiting 3 seconds...`);
        if (currentCommand.includes('npm') && !currentCommand.includes('--registry')) {
            currentCommand = `${currentCommand} --registry=https://registry.npmjs.org/`;
        }
        spawnSync(isWin ? 'timeout 3' : 'sleep 3', { shell: true });
        continue;
      }

      // ── Rule 5: CGO / Go Compiler Issues ──
      if (errMsg.includes('cgo_enabled') || errMsg.includes('cgo:')) {
        logger.step(`Auto-Fix: Detected Go compiler CGO error.`, false);
        logger.step(`Applying fix: Disabling CGO...`);
        currentCommand = isWin ? `set CGO_ENABLED=0 && ${currentCommand}` : `CGO_ENABLED=0 ${currentCommand}`;
        continue;
      }

      // Default fallback if no heuristics match
      logger.warn(`[Auto-Healer] No targeted fix found. Waiting 2s before generic retry...`);
      spawnSync(isWin ? 'timeout 2' : 'sleep 2', { shell: true });
    }
  }
}

module.exports = new AutoHealer();
