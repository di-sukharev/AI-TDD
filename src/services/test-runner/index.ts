/*
    This service runs test(s)
*/

import { execa } from "execa";

class TestRunner {
  private getRunCommand() {
    // how to run test? check config (e.g. package.json) for scripts.test
    // todo: find test runner

    return "bun test";
  }

  getError(stdout: string) {
    // TODO: extract only failed tests part
    return stdout;
  }

  getMessage(stdout: string) {
    // TODO: extract any helpful message
    return stdout;
  }

  async assert(testFilePath: string) {
    const runCommand = this.getRunCommand();

    const result = await execa(runCommand, [testFilePath]);

    const failed = result.failed;

    return {
      message: this.getMessage(result.stdout),
      failed,
      error: failed ? this.getError(result.stdout) : null,
    };
  }
}

export const testRunner = new TestRunner();
