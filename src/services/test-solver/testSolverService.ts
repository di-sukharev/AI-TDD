/* This service tries to solve a test file */

import { isCancel, select } from "@clack/prompts";
import chalk from "chalk";
import OpenAI from "openai";
import { outroError } from "src/utils/prompts";
import { exe } from "src/utils/shell";
import { testSolverAgent } from "../../ai-agents/test-solver";
import { fileManipulator } from "../file-manipulator/fileManipulatorService";

interface testRelevantFile {
  name: string;
  from: string;
  declarations: {
    from: string;
    declaration: string;
  }[];
}

export interface ToolCallOutput {
  callId: string;
  name: string;
  content: string;
}

class TestSolverService {
  async callTools(
    tools: OpenAI.Chat.Completions.ChatCompletionMessageToolCall[]
  ): Promise<ToolCallOutput[]> {
    const outputs: ToolCallOutput[] = [];

    for (const tool of tools) {
      console.info(
        `Call function ${chalk.green(
          tool.function.name
        )} with arguments ${chalk.magenta(tool.function.arguments)}`
      );

      const confirmExecution = await select({
        message: `Run?`,
        options: [
          { value: true, label: "✅" },
          { value: false, label: "🚫" },
        ],
      });

      if (isCancel(confirmExecution) || !confirmExecution) process.exit(1);

      try {
        const args = JSON.parse(tool.function.arguments);

        // TODO: sanitize directory, namePattern, and type...

        switch (tool.function.name) {
          case "awk": {
            const { pattern, filePath } = args;

            const { stdout } = await exe(["awk", pattern, filePath]);

            outputs.push({
              callId: tool.id,
              name: tool.function.name,
              content: stdout,
            });

            break;
          }

          case "grep": {
            const { pattern, filePath, flags } = args;

            const flagString = flags.join(" ");
            const { stdout } = await exe([
              "grep",
              pattern,
              filePath,
              flagString,
            ]);

            outputs.push({
              callId: tool.id,
              name: tool.function.name,
              content: stdout,
            });

            break;
          }

          case "find": {
            const { directory, namePattern, type } = args;

            const typeFlag = type === "file" ? "-type f" : "-type d";
            const { stdout } = await exe([
              "find",
              directory,
              "-name",
              namePattern,
              typeFlag,
            ]);

            outputs.push({
              callId: tool.id,
              name: tool.function.name,
              content: stdout,
            });

            break;
          }

          case "write_code": {
            const { modifications } = args as {
              modifications: Array<{
                filePath: string;
                content: {
                  row: string;
                  action: "replace" | "append" | "prepend";
                  with: string;
                }[];
              }>;
            };

            const response = await fileManipulator.manage(modifications);

            outputs.push({
              callId: tool.id,
              name: tool.function.name,
              content:
                response.reduce((acc, result) => `${acc}\n${result}`, "") ?? "",
            });

            break;
          }

          default:
            throw new Error(`Unsupported tool name: ${tool.function.name}`);
        }
      } catch (error) {
        console.error("Error calling tool:", {
          toolCallId: tool.id,
          error,
        });

        throw error;
      }
    }

    return outputs;
  }

  async solve({
    testFilePath,
    error,
    context,
  }: {
    testFilePath: string;
    error: string;
    context: Array<OpenAI.Chat.ChatCompletionMessageParam>;
  }) {
    const testFileCode = await fileManipulator.readFileContent(testFilePath);

    if (!testFileCode) throw new Error("FILE_NOT_FOUND");

    const message = await testSolverAgent.solve({
      testFile: { path: testFilePath, code: testFileCode },
      error,
      context,
    });

    if (!message) {
      outroError("No message present");
      return process.exit(1);
    }

    return message;
  }
}

export const testSolver = new TestSolverService();
