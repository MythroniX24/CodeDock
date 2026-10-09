const { parse } = require('./cli/parser');
const logger = require('./core/logger');
const dashboard = require('./ui/dashboard');

// Commands
const install = require('./commands/install');
const uninstall = require('./commands/uninstall');
const update = require('./commands/update');
const doctor = require('./commands/doctor');
const list = require('./commands/list');
const status = require('./commands/status');
const open = require('./commands/open');
const projects = require('./commands/projects');
const help = require('./commands/help');
const clean = require('./commands/clean');
const alias = require('./commands/alias');
const upgrade = require('./commands/upgrade');

const pkg = require('../package.json'); // assuming package.json is in root

async function main() {
  try {
    const { checkAndAutoUpdate } = require('./core/updater');
    const wasUpdated = await checkAndAutoUpdate(false);
    if (wasUpdated) {
      // Re-spawn the newly installed global process and exit this old process
      const { spawnSync } = require('child_process');
      spawnSync('codedock', process.argv.slice(2), { stdio: 'inherit', shell: true });
      return;
    }

    const { command, args, flags } = parse(process.argv);

    if (flags.version) {
      console.log(`CodeDock v${pkg.version || '1.0.0'}`);
      return;
    }

    if (flags.help || command === 'help') {
      await help();
      return;
    }

    switch (command) {
      case 'install':
        await install(args[0], flags);
        break;
      case 'uninstall':
        await uninstall(args[0], flags);
        break;
      case 'update':
        await update(args[0], flags);
        break;
      case 'upgrade':
        await upgrade();
        break;
      case 'doctor':
        await doctor(flags);
        break;
      case 'list':
        await list(flags);
        break;
      case 'status':
        await status(flags);
        break;
      case 'open':
        await open(args[0], flags);
        break;
      case 'projects':
        await projects(flags);
        break;
      case 'clean':
        await clean(flags);
        break;
      case 'alias':
        await alias(args[0], flags);
        break;
      case '':
        await dashboard.showDashboard();
        break;
      default:
        logger.error(`Unknown command: ${command}`);
        logger.info('Run `codedock help` for usage information.');
        process.exit(1);
    }
  } catch (error) {
    logger.error(`An unexpected error occurred: ${error.message}`);
    if (process.argv.includes('--verbose')) {
      console.error(error);
    }
    process.exit(1);
  }
}

module.exports = { main };
