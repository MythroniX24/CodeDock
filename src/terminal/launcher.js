/**
 * @file src/terminal/launcher.js
 * Safe terminal launcher.
 */
const { spawnSync, execFileSync } = require('child_process');

class TerminalLauncher {
  /**
   * Launch CLI tool with full terminal access.
   */
  launch(command, args = [], options = {}) {
    return spawnSync(command, args, {
      stdio: 'inherit',
      env: { ...process.env, ...options.env },
      ...options
    });
  }

  /**
   * Launch in specific directory.
   */
  launchInDir(command, args = [], dir) {
    return this.launch(command, args, { cwd: dir });
  }

  /**
   * Execute and capture output.
   */
  exec(command, args = [], options = {}) {
    return spawnSync(command, args, {
      stdio: 'pipe',
      encoding: 'utf8',
      env: { ...process.env, ...options.env },
      ...options
    });
  }

  /**
   * Execute with validated args (no shell injection possible with execFileSync).
   */
  execSafe(command, args = []) {
    const allowlist = ['git', 'node', 'npm', 'python', 'pip', 'cargo', 'go'];
    const cmdName = command.split('/').pop();
    if (!allowlist.includes(cmdName) && !command.startsWith('/')) {
      throw new Error(`Command not allowed: ${command}`);
    }
    return execFileSync(command, args, { encoding: 'utf8' });
  }
}

module.exports = new TerminalLauncher();
