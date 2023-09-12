import { intro } from "@clack/prompts";
import { command } from "cleye";
import { fileManager } from "../services/file-manager";
import { testFinder } from "../services/test-finder";
import { testRunner } from "../services/test-runner";
import { testSolver } from "../services/test-solver";
import { call } from "../utils/call";
import { outroError, outroSuccess } from "../utils/prompts";
import { COMMANDS } from "./enums";

export const runCommand = command(
  {
    name: COMMANDS.run,
    // parameters: ["<mode>", "<key=values...>"],
  },
  async (argv) => {
    intro("AI-TDD is spinning 🪩");

    // TODO: check latest version
    // TODO: check is initialized

    const [testFilePath, testFilePathError] = await call(testFinder.find());

    if (testFilePathError) {
      outroError("Test file not found");
      process.exit(1);
    }

    const MAX_ATTEMPTS = 2; // TODO: make tries configurable

    let attempts = MAX_ATTEMPTS;

    let isTestPassing = false;
    while (!isTestPassing && attempts > 0) {
      const result = await testRunner.assert(testFilePath);

      if (result.failed) {
        const clarifications = "";

        const filesToWrite = await testSolver.solve(
          testFilePath,
          result.message,
          clarifications
        );

        await fileManager.manage(filesToWrite);

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
