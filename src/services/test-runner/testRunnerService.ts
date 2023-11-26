/*
    This service runs test(s)
*/

import { note } from "@clack/prompts";
import { getConfig } from "src/commands/config";
import { exe } from "../../utils/shell";

const config = getConfig();

class TestRunnerService {
  private getRunCommand() {
    if (!config?.RUN_TESTS) {
      note(
        `Command for running tests not found, set it via \`aitdd config set RUN_TESTS=<your_command>\`, e.g. RUN_TESTS="npm run test"`
      );

      return process.exit(1);
    }

    return config.RUN_TESTS.split(" ");
  }

  getError(stdout: string) {
    // TODO: extract only failed tests part
    return stdout;
  }

  getMessage(stdout: string) {
    // TODO: extract any helpful message, cut logs

    return stdout;
  }

  async assert(testFilePath: string) {
    const runCommand = this.getRunCommand();

    const { stdout, stderr, exitCode } = await exe([
      ...runCommand,
      testFilePath,
    ]);

    if (stderr) note(stderr);

    return {
      message: this.getMessage(stdout || stderr),
      failed: exitCode !== 0,
    };
  }
}

export const testRunner = new TestRunnerService();
