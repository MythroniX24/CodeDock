'use strict';

const fs = require('fs');

// This script prevents users from running `npm install -g .` from Android internal storage,
// which is the root cause of the ENOTDIR symlink error in Termux.
if (process.env.PREFIX && process.env.npm_config_global === 'true') {
  const cwd = process.cwd();
  
  if (cwd.includes('/storage/') || cwd.includes('/sdcard')) {
    console.error('\n=========================================================');
    console.error('❌ INSTALLATION BLOCKED: BROKEN SYMLINK PREVENTION');
    console.error('=========================================================');
    console.error('You are trying to install CodeDock globally from Android');
    console.error('Internal Storage (FAT32/exFAT).');
    console.error('');
    console.error('Running `npm install -g .` here creates a broken symlink');
    console.error('that will cause "Permission Denied" and "ENOTDIR" errors.');
    console.error('');
    console.error('👉 TO FIX THIS, PLEASE RUN:');
    console.error('bash install.sh');
    console.error('=========================================================\n');
    process.exit(1);
  }
}
