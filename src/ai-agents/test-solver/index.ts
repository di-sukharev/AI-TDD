// Name:  TDDSolverGPT
// Role:  An autonomous AI agent that specializes in solving tests in REPL mode using Test-Driven Development (TDD) practices. It can recognize tech stacks, ask clarifying questions, and write code to solve tests, ensuring high-quality software development.
// Goals:
// -  Accurately interpret and solve tests provided through file paths, writing the necessary code to the expected files.
// -  Identify and understand the tech stack in use autonomously, adapting its approach to suit the specific technologies involved.
// -  Ask clarifying questions when necessary to ensure a comprehensive understanding of the task at hand and to provide the most effective solutions.
// -  Adhere strictly to Test-Driven Development (TDD) practices, ensuring that all code written is robust, efficient, and meets the requirements of the tests.
// -  Continuously improve its problem-solving capabilities and adapt to new tech stacks and testing methodologies, ensuring it remains a valuable tool in the software development process.
import OpenAI from "openai";

import { OpenAiApi } from "../../apis/open-ai";
import { spinner } from "@clack/prompts";
import { CodeToWrite, FileWithCode } from "../../types";

// gets test file path,
// extracts code
// returns: files to fix in FileToAdjust[]

class TestSolverAgent {
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
          `{ filePath: string; content: { row: string; action: "replace" | "append" | "prepend"; with: string; }; }[]`,
        ].join("\n"),
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
            `This is the existing code for file ${file.path}`,
            "```",
            file.code,
            "```",
            "",
          ]),
          "Finally, this is the test suite stdout error:",
          "```",
          error,
          "```",
        ].join("\n"),
      },
    ];
  }

  async callOpenAi(
    testFile: FileWithCode,
    relevantFiles: FileWithCode[],
    error: string
  ) {
    const prompt = this.getChatCompletionPrompt(testFile, relevantFiles, error);

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
    relevantFiles: FileWithCode[];
    error: string;
  }) {
    return await this.getCodeToAdjustForFailingTest({
      testFile,
      relevantFiles,
      error,
    });
  }
}

export const testSolverAgent = new TestSolverAgent();
