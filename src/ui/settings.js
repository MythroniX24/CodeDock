const { selectPrompt, inputPrompt, confirmPrompt } = require('./components');
const chalk = require('chalk');

async function showSettings(config) {
  while (true) {
    console.clear();
    console.log(chalk.bold.blue('\nCodeDock Settings\n'));
    
    const currentConfig = config.getAll();
    
    const choices = [
      { name: `Default Project Dir: ${currentConfig.defaultProjectDir || '~/Projects'}`, value: 'defaultProjectDir' },
      { name: `Auto-Update: ${currentConfig.autoUpdate ? 'On' : 'Off'}`, value: 'autoUpdate' },
      { name: `Log Level: ${currentConfig.logLevel || 'info'}`, value: 'logLevel' },
      new (require('inquirer')).Separator(),
      { name: 'Back', value: 'back' }
    ];
    
    const setting = await selectPrompt('Select setting to change:', choices);
    
    if (setting === 'back') break;
    
    if (setting === 'defaultProjectDir') {
      const val = await inputPrompt('Enter new default project directory:', currentConfig.defaultProjectDir);
      config.set('defaultProjectDir', val);
    } else if (setting === 'autoUpdate') {
      const val = await confirmPrompt('Enable auto-updates?');
      config.set('autoUpdate', val);
    } else if (setting === 'logLevel') {
      const val = await selectPrompt('Select log level:', ['debug', 'info', 'warn', 'error']);
      config.set('logLevel', val);
    }
    
    config.save();
    console.log(chalk.green('Settings saved.'));
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

module.exports = { showSettings };
