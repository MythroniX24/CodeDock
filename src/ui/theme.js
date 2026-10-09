'use strict';

const chalk = require('chalk');
const Config = require('../core/config');

const themes = {
  default: {
    primary: chalk.cyan,
    secondary: chalk.blueBright,
    success: chalk.green,
    error: chalk.red,
    muted: chalk.gray,
    border: chalk.cyan,
    text: chalk.white,
    highlight: chalk.bgCyan.black
  },
  hacker: {
    primary: chalk.green,
    secondary: chalk.greenBright,
    success: chalk.greenBright,
    error: chalk.bgRed.white,
    muted: chalk.hex('#116611'),
    border: chalk.green,
    text: chalk.greenBright,
    highlight: chalk.bgGreen.black
  },
  cyberpunk: {
    primary: chalk.magentaBright,
    secondary: chalk.yellowBright,
    success: chalk.cyanBright,
    error: chalk.redBright,
    muted: chalk.gray,
    border: chalk.yellowBright,
    text: chalk.white,
    highlight: chalk.bgMagenta.white
  },
  dracula: {
    primary: chalk.hex('#bd93f9'),
    secondary: chalk.hex('#ff79c6'),
    success: chalk.hex('#50fa7b'),
    error: chalk.hex('#ff5555'),
    muted: chalk.hex('#6272a4'),
    border: chalk.hex('#bd93f9'),
    text: chalk.hex('#f8f8f2'),
    highlight: chalk.bgHex('#bd93f9').black
  }
};

function getTheme() {
  const name = Config.get('theme', 'default');
  return themes[name] || themes.default;
}

module.exports = { getTheme, themes };
