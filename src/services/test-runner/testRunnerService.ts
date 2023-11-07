/*
    This service runs test(s)
*/

import { note } from "@clack/prompts";
import { exe } from "../../utils/shell";

class TestRunnerService {
  private getRunCommand() {
    // how to run test? check config (e.g. package.json) for scripts.test
    // todo: find test runner

    return "bun test".split(" ");
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

    try {
      const { stdout, stderr, exitCode } = await exe([
        ...runCommand,
        testFilePath,
      ]);

      if (stderr) note(stderr);

      return {
        message: this.getMessage(stdout || stderr),
        failed: exitCode !== 0,
      };
    } catch (error) {
      console.log("REMOVE THIS BLOCK IF IT'S NOT BEING CALLED");
      return {
        message: error as string,
        failed: true,
      };
    }
  }
}

export const testRunner = new TestRunnerService();
