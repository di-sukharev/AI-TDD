import { getAITDDLatestVersion } from '../api';
import currentPackage from '../../package.json' assert { type: 'json' };
import chalk from 'chalk';

export const checkIsLatestVersion = async () => {
  const latestVersion = await getAITDDLatestVersion();

  if (latestVersion) {
    const currentVersion = currentPackage.version;

    if (currentVersion !== latestVersion) {
      console.warn(
        chalk.yellow(
          `
You are not using the latest stable version of ai-tdd with new features and bug fixes.
Current version: ${currentVersion}. Latest version: ${latestVersion}.
🚀 To update run: npm i -g ai-tdd@latest.
        `
        )
      );
    }
  }
};
