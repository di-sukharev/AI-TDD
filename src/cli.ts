#!/usr/bin/env node

import { flags } from './flags';
import { cli } from 'cleye';
import packageJSON from '../package.json' assert { type: 'json' };
import { configCommand } from './commands/config';
import { tddCommand } from './commands/tdd';
import { checkIsLatestVersion } from './utils/checkIsLatestVersion';

const args = process.argv.slice(2);

cli(
  {
    version: packageJSON.version,
    name: 'ai-tdd',
    commands: [configCommand],
    flags,
    ignoreArgv: (type) => type === 'unknown-flag' || type === 'argument',
    help: { description: packageJSON.description }
  },
  async () => {
    await checkIsLatestVersion();

    try {
      tddCommand(args);
    } catch (error) {
      throw error;
    }
  },
  args
);
