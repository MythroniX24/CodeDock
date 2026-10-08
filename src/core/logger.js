/**
 * @file src/core/logger.js
 * Structured logging with terminal colors.
 */
const chalk = require('chalk');

const isTTY = process.stdout.isTTY;

class Logger {
  info(...args) {
    console.log(chalk.blue('ℹ'), ...args);
  }

  success(...args) {
    console.log(chalk.green('✓'), ...args);
  }

  warn(...args) {
    console.warn(chalk.yellow('⚠'), ...args);
  }

  error(...args) {
    console.error(chalk.red('✖'), ...args);
  }

  step(text, isSuccess = true) {
    if (isSuccess) {
      console.log(chalk.green('✓'), text);
    } else {
      console.log(chalk.red('✗'), text);
    }
  }

  header(text) {
    const len = text.length;
    const border = '─'.repeat(len + 4);
    console.log(chalk.cyan(`┌${border}┐`));
    console.log(chalk.cyan(`│  ${chalk.bold(text)}  │`));
    console.log(chalk.cyan(`└${border}┘`));
  }

  divider() {
    const cols = process.stdout.columns || 80;
    console.log(chalk.dim('─'.repeat(cols)));
  }

  table(rows) {
    if (!rows || rows.length === 0) return;
    
    const colWidths = [];
    rows.forEach(row => {
      row.forEach((cell, i) => {
        const cellStr = String(cell);
        colWidths[i] = Math.max(colWidths[i] || 0, cellStr.length);
      });
    });

    rows.forEach(row => {
      const formattedRow = row.map((cell, i) => {
        const cellStr = String(cell);
        return cellStr.padEnd(colWidths[i], ' ');
      }).join(' │ ');
      console.log(formattedRow);
    });
  }

  progress(text) {
    console.log(chalk.magenta('↻'), text);
  }

  blank() {
    console.log();
  }
}

module.exports = new Logger();
