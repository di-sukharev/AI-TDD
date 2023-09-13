/*
    This service tries to solve a test file
*/

import OpenAI from "openai";
import { fileManager } from "../file-manager";
import { OpenAiApi } from "../../apis/open-ai";
import { spinner } from "@clack/prompts";

interface IContent {
  row: string;
  action: "replace" | "append" | "prepend";
  with: string;
}

export interface FileToAdjust {
  content: IContent;
  filePath: string;
}

interface FileWithCode {
  path: string;
  code: string | null;
}

class TestSolver {
  // talk to user, ask for confirmations

  private getChatCompletionPrompt(
    test: FileWithCode,
    files: FileWithCode[],
    error: string
  ): Array<OpenAI.Chat.ChatCompletionMessage> {
    return [
      {
        role: "system",
        content: [
          "You are to write code that passes tests as per the Software TDD practice. I send you the test suite, and you write the code that passes it.",
          "DO NOT provide any explanations, strictly response with JSON in this format:",
          `FilesToAdjust {
          content: {
            row: string;
            action: "replace" | "append" | "prepend";
            with: string;
          };
          filePath: string;
        }[]`,
        ].join(""),
      },
      {
        role: "user",
        content: [
          "Below is the test suite code:",
          "```",
          test.code,
          "```",
          "",
          ...files.map((file) => [
            `Below is the existing code for file ${file.path}`,
            "```",
            file.code,
            "```",
            "",
          ]),
          "Below is the test suite stdout error:",
          "```",
          error,
          "```",
        ].join("\n"),
      },
    ];
  }

  private async getCodeToAdjustForFailingTest(
    testFile: FileWithCode,
    testRelevantFiles: FileWithCode[],
    error: string
  ): Promise<FileToAdjust[]> {
    const prompt = this.getChatCompletionPrompt(
      testFile,
      testRelevantFiles,
      error
    );
    const loader = spinner();

    try {
      loader.start("LLM is trying to solve the test");
      const res = await OpenAiApi.createChatCompletion(prompt);

      if (!res) {
        loader.stop("Something went wrong");
        return process.exit(1);
      } else {
        loader.stop("LLM got an idea, applying…");
      }

      const codeToAdjust = JSON.parse(res);

      // todo: validate the codeToAdjust structure with joi

      return codeToAdjust;
    } catch (error) {
      loader.stop("Something went wrong");
      return process.exit(1);
    }
  }

  async solve(
    testFilePath: string,
    testRelevantFilePaths: string[],
    error: string,
    clarifications?: string
  ): Promise<FileToAdjust[]> {
    // TODO: use clarifications

    const testFileCode = await fileManager.readFileContent(testFilePath);

    if (!testFileCode) throw new Error("FILE_NOT_FOUND");

    const testRelevantFilesCode = await Promise.all(
      testRelevantFilePaths.map((path) => fileManager.readFileContent(path))
    );

    const testRelevantFilesWithCode = testRelevantFilesCode.map((code, i) => ({
      path: testRelevantFilePaths[i],
      code,
    }));

    const testFileWithCode = { path: testFilePath, code: testFileCode };

    return await this.getCodeToAdjustForFailingTest(
      testFileWithCode,
      testRelevantFilesWithCode,
      error
    );
  }
}

export const testSolver = new TestSolver();
