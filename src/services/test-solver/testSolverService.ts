/*
    This service tries to solve a test file
*/

import { outroError } from "src/utils/prompts";
import { testSolverAgent } from "../../ai-agents/test-solver";
import { CodeToWrite } from "../../types";
import { fileManipulator } from "../file-manager/fileManagerService";
import OpenAI from "openai";
import { exe } from "src/utils/shell";

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
    toolCalls: OpenAI.Chat.Completions.ChatCompletionMessageToolCall[]
  ): Promise<ToolCallOutput[]> {
    const outputs: ToolCallOutput[] = [];

    for (const toolCall of toolCalls) {
      try {
        const args = JSON.parse(toolCall.function.arguments);

        switch (toolCall.function.name) {
          case "awk": {
            // Perform validation for arguments specific to awk
            const { pattern, filePath } = args;
            // Validate pattern and filePath...
            const { stdout } = await exe(["awk", pattern, filePath]);

            outputs.push({
              callId: toolCall.id,
              name: toolCall.function.name,
              content: stdout,
            });

            break;
          }

          case "grep": {
            // Perform validation for arguments specific to grep
            const { pattern, filePath, flags } = args;
            // Validate pattern, filePath, and flags...
            const flagString = flags.join(" ");
            const { stdout } = await exe([
              "grep",
              pattern,
              filePath,
              flagString,
            ]);

            outputs.push({
              callId: toolCall.id,
              name: toolCall.function.name,
              content: stdout,
            });

            break;
          }

          case "find": {
            // Perform validation for arguments specific to find
            const { directory, namePattern, type } = args;
            // Validate directory, namePattern, and type...
            const typeFlag = type === "file" ? "-type f" : "-type d";
            const { stdout } = await exe([
              "find",
              directory,
              "-name",
              namePattern,
              typeFlag,
            ]);

            outputs.push({
              callId: toolCall.id,
              name: toolCall.function.name,
              content: stdout,
            });

            break;
          }

          case "write_code": {
            // Perform validation for arguments specific to write_code
            const { modifications } = args;
            // Validate modifications...

            for (const modification of modifications) {
              // Here you would apply the changes to the code as specified.
              // Since the OpenAI API cannot actually modify files, you would
              // simulate this by perhaps outputting the intended changes or
              // providing a description of what would be done.
              // This is just a placeholder for the logic you would implement.

              const response = await fileManipulator.manage(modification.items);

              outputs.push({
                callId: toolCall.id,
                name: toolCall.function.name,
                content:
                  response.reduce((acc, result) => `${acc}\n${result}`, "") ??
                  "",
              });
            }

            break;
          }

          default:
            throw new Error(`Unsupported tool name: ${toolCall.function.name}`);
        }
      } catch (error) {
        console.error("Error calling tool:", {
          toolCallId: toolCall.id,
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

    if (message.tool_calls) {
      const callOutputs = await this.callTools(message.tool_calls);
      return { message, callOutputs };
    }

    return { message };
  }
}

export const testSolver = new TestSolverService();
