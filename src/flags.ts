import chalk from 'chalk';

export const flags = {
  filePath: {
    alias: 'f',
    type: String,
    description: `path to a test file to ${chalk.green('pass')}`
  }
};
