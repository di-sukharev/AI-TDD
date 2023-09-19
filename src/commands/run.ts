import { intro, isCancel, note, select } from "@clack/prompts";
import { command } from "cleye";
import { fileManagerService } from "../services/file-manager/fileManagerService";
import { testFinderService } from "../services/test-finder/testFinderService";
import { testRunnerService } from "../services/test-runner/testRunnerService";
import { testSolver } from "../services/test-solver/testSolverService";
import { call } from "../utils/call";
import { outroError, outroSuccess } from "../utils/prompts";
import { COMMANDS } from "./enums";
import { codeNavigatorService } from "../services/code-navigator/codeNavigatorService";
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

        const testRelevantFilePaths = testRelevantFiles?.map(
          (file) => file.from
        );

        const filesToWrite = await testSolver.solve({
          testFilePath,
          testRelevantFilePaths,
          error: result.message,
          clarifications,
        });

        await note(`COMMAND:\n${JSON.stringify(filesToWrite)}`);

        const confirmExecution = await select({
          message: chalk.cyan(`Execute command?`),
          options: [
            { value: true, label: "YES 🪩" },
            { value: false, label: "NO 🚫" },
          ],
        });

        if (isCancel(confirmExecution) || !confirmExecution)
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
