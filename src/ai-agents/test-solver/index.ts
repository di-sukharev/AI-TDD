import OpenAI from "openai";

import { OpenAiApi } from "../../apis/open-ai";
import { spinner } from "@clack/prompts";
import { CodeToWrite, FileWithCode } from "../../types";

class TestSolverAgent {
  private getChatCompletionPrompt(
    test: FileWithCode,
    error: string,
    files: FileWithCode[] = []
  ): Array<OpenAI.Chat.ChatCompletionMessage> {
    return [
      {
        role: "system",
        content: [
          "You are an AI agent that solves tests in REPL mode using Test-Driven Development (TDD) practices. I send you a test suite code with related modules—you recognize the tech stack and generate code to pass all the tests.",
          "Adhere strictly to Test-Driven Development (TDD) practices, ensuring that all code written is robust, efficient, and passes the tests.",
          "DO NOT provide any explanations, strictly response in the JSON format:",
          "```",
          `{ filePath: string; content: { row: string; action: "replace" | "append" | "prepend"; with: string; }; }[]`,
          "```",
          "Where:",
          "'row' is not a line number but the actual line of code,",
          "'append' action appends to the 'row', 'replace' replaces the non-empty-string row, and 'prepend' the 'with' code prepends before the row.",
          "and 'filePath' is an absolute file path relative to the test file path, so if test path is 'src/__tests__/file.test.ts' then import should be relative to that path, e.g. 'src/__tests__/<your_file>'.",
          "",
          "You must not leave TODO code, generate production ready code.",
        ].join("\n"),
      },
      {
        role: "user",
        content: [
          `Below is the '${test.path}' content:`,
          "```",
          test.code,
          "```",
          "",
          `This is a stdout error for the '${test.path}' run:`,
          "```",
          error,
          "```",
          "",
          ...files.map((file) => [
            `This is the '${file.path}' content:`,
            "```",
            file.code,
            "```",
            "",
          ]),
          "",
          "Make the tests pass.",
        ].join("\n"),
      },
    ];
  }

  async callOpenAi(
    testFile: FileWithCode,
    relevantFiles: FileWithCode[],
    error: string
  ) {
    const prompt = this.getChatCompletionPrompt(testFile, error, relevantFiles);

    console.log({ prompt });

    const res = await OpenAiApi.createChatCompletion(prompt);

    return res;
  }

  private async getCodeToAdjustForFailingTest({
    testFile,
    relevantFiles,
    error,
  }: {
    testFile: FileWithCode;
    relevantFiles: FileWithCode[];
    error: string;
  }): Promise<CodeToWrite[]> {
    const loader = spinner();

    try {
      loader.start("LLM is solving the test");
      const res = await this.callOpenAi(testFile, relevantFiles, error);
      loader.stop("LLM got an idea, applying…");

      if (!res) {
        loader.stop("Something went wrong");
        return process.exit(1);
      }

      const codeToAdjust = JSON.parse(res);

      // todo: validate the codeToAdjust structure with joi

      return codeToAdjust;
    } catch (error) {
      loader.stop("Something went wrong");
      return process.exit(1);
    }
  }

  async solve({
    testFile,
    relevantFiles,
    error,
  }: {
    testFile: FileWithCode;
    relevantFiles?: FileWithCode[];
    error: string;
  }) {
    return await this.getCodeToAdjustForFailingTest({
      testFile,
      relevantFiles: relevantFiles || [],
      error,
    });
  }
}

export const testSolverAgent = new TestSolverAgent();
