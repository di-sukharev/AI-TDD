import { intro, isCancel, select } from "@clack/prompts";
import { command } from "cleye";
import { fileManagerService } from "../services/file-manager";
import { testFinderService } from "../services/test-finder";
import { testRunnerService } from "../services/test-runner";
import { testSolver } from "../services/test-solver";
import { call } from "../utils/call";
import { outroError, outroSuccess } from "../utils/prompts";
import { COMMANDS } from "./enums";
import { codeNavigatorService } from "../services/code-navigator";
import chalk from "chalk";

export const runCommand = command(
  {
    name: COMMANDS.run,
    // parameters: ["<mode>", "<key=values...>"],
  },
  async (argv) => {
    intro("AI-TDD is spinning 🪩");

    // TODO: check latest version
    // TODO: check is initialized

    const [testFilePath, testFilePathError] = await call(
      testFinderService.find()
    );

    if (testFilePathError) {
      outroError("Test file not found");
      process.exit(1);
    }

    const MAX_ATTEMPTS = 2; // TODO: make tries configurable

    let attempts = MAX_ATTEMPTS;

    let isTestPassing = false;
    while (!isTestPassing && attempts > 0) {
      const result = await testRunnerService.assert(testFilePath);

      if (result.failed) {
        const clarifications =
          "TODO: any apis to call, any file that can be used as an example?";

        const testRelevantFiles = await codeNavigatorService.findImportsForFile(
          testFilePath
        );

        const filesToWrite = await testSolver.solve({
          testFilePath,
          testRelevantFilePaths: testRelevantFiles?.map((file) => file.from),
          error: result.message,
          clarifications,
        });

        const confirmExecution = await select({
          message: chalk.cyan(`Execute command?\n\n${filesToWrite}`),
          options: [
            { value: true, label: "YES 🪩" },
            { value: true, label: "NO 🚫" },
          ],
        });

        console.log({ confirmExecution });

        if (isCancel(confirmExecution) || !confirmExecution)
          return process.exit(1);

        return process.exit(1);

        await fileManagerService.manage(filesToWrite);

        attempts--;
      } else {
        isTestPassing = true;
      }
    }

    if (isTestPassing) {
      outroSuccess("All tests pass");
      process.exit(0);
    } else {
      outroError(
        `Failed to pass the test ${testFilePath} after ${MAX_ATTEMPTS} attempt(s).`
      );

      // TODO: try to solve the problem in an interactive conversation: ask questions, simplify test

      process.exit(0);
    }
  }
);
