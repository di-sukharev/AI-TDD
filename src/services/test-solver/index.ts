/*
    This service tries to solve a test file
*/

import OpenAI from "openai";
import { fileManager } from "../file-manager";

interface IContent {
  target: string;
  action: "replace" | "append" | "prepend";
  with: string;
}

export interface FileToAdjust {
  content: IContent;
  filePath: string;
}

const INIT_MESSAGES_PROMPT: Array<OpenAI.Chat.ChatCompletionMessage> = [
  {
    role: "system",
    content:
      "You are to write code that passes test suites as per the Software TDD practice. I send you the test suite, and you response with code that passes it. I run the test over your code. Do NOT provide any explanations, response only with the code.",
  },
];

class TestSolver {
  // talk to user, ask for confirmations

  private getChatCompletionPrompt() {}

  private async getCodeToAdjustForFailingTest(
    code: string,
    error: string
  ): Promise<FileToAdjust[]> {
    // TODO: call openAI;

    return [{}]; // adapt the response
  }

  async solve(
    testFilePath: string,
    error: string,
    clarifications?: string
  ): Promise<FileToAdjust[]> {
    // TODO: use clarifications

    const testFileCode = await fileManager.readFileContent(testFilePath);

    if (!testFileCode) throw new Error("FILE_NOT_FOUND");

    return await this.getCodeToAdjustForFailingTest(testFileCode, error);
  }
}

export const testSolver = new TestSolver();
