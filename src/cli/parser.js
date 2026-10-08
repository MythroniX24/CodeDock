/**
 * CLI argument parser
 * @param {string[]} argv - process.argv
 * @returns {object} { command: string, args: string[], flags: object }
 */
function parse(argv) {
  const args = argv.slice(2);
  const result = {
    command: '',
    args: [],
    flags: {}
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      if (key === 'yes') {
        result.flags.yes = true;
      } else {
        result.flags[key] = true;
      }
    } else if (arg.startsWith('-')) {
      const flags = arg.slice(1).split('');
      flags.forEach(f => {
        if (f === 'y') result.flags.yes = true;
        if (f === 'v') result.flags.version = true;
        if (f === 'h') result.flags.help = true;
      });
    } else if (!result.command) {
      result.command = arg;
    } else {
      result.args.push(arg);
    }
  }

  return result;
}

module.exports = { parse };
