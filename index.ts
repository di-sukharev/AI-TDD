import { cli } from "cleye";

import packageJSON from "./package.json";

import { configCommand } from "./src/commands/config.js";
import { runCommand } from "./src/commands/run";
import { initCommand } from "./src/commands/init";

const extraArgs = process.argv.slice(2);

cli(
  {
    version: packageJSON.version,
    name: "ai-tdd",
    commands: [initCommand, runCommand, configCommand],
    flags: {},
    ignoreArgv: (type) => type === "unknown-flag" || type === "argument",
    help: { description: packageJSON.description },
  },
  async () => {
    // TODO
  },
  extraArgs
);
