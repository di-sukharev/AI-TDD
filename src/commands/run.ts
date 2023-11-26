import { intro, note } from "@clack/prompts";
import { command } from "cleye";
import OpenAI from "openai";
import { testFinder } from "../services/test-finder/testFinderService";
import { testRunner } from "../services/test-runner/testRunnerService";
import {
  ToolCallOutput,
  testSolver,
} from "../services/test-solver/testSolverService";
import { call } from "../utils/call";
import { outroError, outroSuccess } from "../utils/prompts";
import { COMMANDS } from "./enums";

export const runCommand = command(
  {
    name: COMMANDS.run,
    // parameters: ["<mode>", "<key=values...>"],
  },
  async (argv) => {
    intro("aitdd is spinning 🪩");

    // TODO: check latest version
    // TODO: check is initialized

    const [testFilePath, testFilePathError] = await call(testFinder.find());

    if (testFilePathError) {
      outroError("Test file not found");
      return process.exit(1);
    }

    const MAX_ATTEMPTS = 10; // TODO: make tries configurable

    let attempts = MAX_ATTEMPTS;

    const context: Array<OpenAI.Chat.ChatCompletionMessageParam> = [];

    let isTestPassing = false;
    while (!isTestPassing && attempts > 0) {
      const result = await testRunner.assert(testFilePath);

      if (result.failed) {
        const message = await testSolver.solve({
          testFilePath,
          error: result.message,
          context,
        });

        if (message.content)
          console.info(message.content); // todo: stream tokens to stdout
        else note("No content in message");

        context.push(message);

        if (message.tool_calls) {
          const callOutputs = await testSolver.callTools(message.tool_calls);

          callOutputs?.forEach((out: ToolCallOutput) =>
            context.push({
              role: "tool",
              tool_call_id: out.callId,
              content: out.content,
            })
          );
        }

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
