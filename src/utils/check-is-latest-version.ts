import chalk from "chalk";

import { outro } from "@clack/prompts";

import PACKAGE_JSON from "../../package.json";
import npmApi from "../apis/npm";

export const checkIsLatestVersion = async () => {
  const latestVersion = await npmApi.getLatestVersion();

  if (latestVersion) {
    const currentVersion = PACKAGE_JSON.version;

    if (currentVersion !== latestVersion) {
      outro(
        chalk.yellow(
          `
You are not using the latest stable version of AITDD with new features and bug fixes.
Current version: ${currentVersion}. Latest version: ${latestVersion}.
🚀 To update run: npm i -g ai-tdd@latest.
        `
        )
      );
    }
  }
};
