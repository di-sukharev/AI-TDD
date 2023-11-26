import { cli } from "cleye";

import packageJSON from "./package.json";

import { configCommand } from "./src/commands/config.js";
import { runCommand } from "./src/commands/run.js";
import { initCommand } from "./src/commands/init.js";

const extraArgs = process.argv.slice(2);

cli(
  {
    version: packageJSON.version,
    name: "aitdd",
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
