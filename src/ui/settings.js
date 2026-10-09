const { selectPrompt, inputPrompt, confirmPrompt } = require('./components');
const chalk = require('chalk');
const { getTheme } = require('./theme');

async function showSettings(config) {
  while (true) {
    const t = getTheme();
    console.clear();
    console.log(t.secondary.bold('\nCodeDock Settings\n'));
    
    const currentConfig = config.getAll();
    
    const choices = [
      { name: t.text(`🔑 API Key Vault`), value: 'apiVault' },
      { name: t.text(`🎨 UI Theme: `) + t.primary(currentConfig.theme || 'default'), value: 'theme' },
      { name: t.text(`📂 Default Project Dir: `) + t.primary(currentConfig.defaultProjectDir || '~/Projects'), value: 'defaultProjectDir' },
      { name: t.text(`🔄 Auto-Update: `) + t.primary(currentConfig.autoUpdate ? 'On' : 'Off'), value: 'autoUpdate' },
      { name: t.text(`📝 Log Level: `) + t.primary(currentConfig.logLevel || 'info'), value: 'logLevel' },
      new (require('inquirer')).Separator(),
      { name: t.muted('← Back'), value: 'back' }
    ];
    
    const setting = await selectPrompt(t.text('Select setting to change:'), choices);
    
    if (setting === 'back') break;
    
    if (setting === 'apiVault') {
      await manageApiKeys(config);
      continue;
    } else if (setting === 'theme') {
      const val = await selectPrompt(t.text('Select UI Theme:'), ['default', 'hacker', 'cyberpunk', 'dracula']);
      config.set('theme', val);
    } else if (setting === 'defaultProjectDir') {
      const val = await inputPrompt(t.text('Enter new default project directory:'), currentConfig.defaultProjectDir);
      config.set('defaultProjectDir', val);
    } else if (setting === 'autoUpdate') {
      const val = await confirmPrompt(t.text('Enable auto-updates?'));
      config.set('autoUpdate', val);
    } else if (setting === 'logLevel') {
      const val = await selectPrompt(t.text('Select log level:'), ['debug', 'info', 'warn', 'error']);
      config.set('logLevel', val);
    }
    
    console.log(t.success('Settings saved.'));
    await new Promise(resolve => setTimeout(resolve, 800));
  }
}

async function manageApiKeys(config) {
  while (true) {
    console.clear();
    console.log(chalk.bold.yellow('\n🔑 CodeDock API Key Vault'));
    console.log(chalk.gray('Keys stored here are automatically injected into AI tools when launched.\n'));
    
    const keys = config.getApiKeys();
    const keyNames = Object.keys(keys);
    
    const choices = keyNames.map(k => ({
      name: `✏️  Edit ${k} (Current: ${keys[k].substring(0,4)}...${keys[k].substring(keys[k].length-4)})`,
      value: k
    }));
    
    choices.push(new (require('inquirer')).Separator());
    choices.push({ name: '➕ Add New API Key', value: 'add_new' });
    choices.push({ name: '🗑️  Delete an API Key', value: 'delete_key' });
    choices.push({ name: '← Back to Settings', value: 'back' });
    
    const action = await selectPrompt('Manage Vault:', choices);
    
    if (action === 'back') break;
    
    if (action === 'add_new') {
      const keyName = await inputPrompt('Enter API Key Name (e.g. OPENAI_API_KEY):');
      if (!keyName) continue;
      const keyValue = await inputPrompt(`Enter value for ${keyName}:`);
      if (keyValue) config.setApiKey(keyName.trim(), keyValue.trim());
    } else if (action === 'delete_key') {
      if (keyNames.length === 0) continue;
      const toDelete = await selectPrompt('Select key to delete:', keyNames);
      config.setApiKey(toDelete, null);
    } else {
      // Edit existing
      const newVal = await inputPrompt(`Enter new value for ${action}:`, keys[action]);
      if (newVal) config.setApiKey(action, newVal.trim());
      else config.setApiKey(action, null); // Delete if empty
    }
  }
}

module.exports = { showSettings };
