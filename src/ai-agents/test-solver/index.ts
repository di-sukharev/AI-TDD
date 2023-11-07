import OpenAI from "openai";

import { spinner } from "@clack/prompts";
import { OpenAiApi } from "../../apis/open-ai";
import { FileWithCode } from "../../types";
import { FUNCTIONS } from "./functions";

interface Props {
  testFile: FileWithCode;
  relevantFiles?: FileWithCode[];
  error: string;
  context?: Array<OpenAI.Chat.ChatCompletionMessageParam>;
}

class TestSolverAgent {
  private getChatCompletionPrompt(
    test: FileWithCode,
    error: string,
    files: FileWithCode[] = []
  ): Array<OpenAI.Chat.ChatCompletionMessageParam> {
    return [
      {
        role: "system",
        content: [
          "You are autoregressive language model that has been fine-tuned with instruction-tuning and RLHF, each token you produce is another opportunity to use computation, therefore you always spend a few sentences explaining background context, assumptions, and step-by-step thinking BEFORE you try to respond.",
          "You are to act as an AI agent that solves tests in REPL mode as per the Test-Driven Development (TDD) practices.",
          "I send you a test suite code, then you recognize the tech stack and generate production ready code to pass all the tests.",
          "Adhere strictly to Test-Driven Development (TDD) practices, ensuring that all code written is robust, efficient, and passes the tests.",
          "Call a tool in each response to improve collaboration performance.",
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
          `This is a stderr for the '${test.path}' run:`,
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

  async callOpenAi({ testFile, relevantFiles, error, context = [] }: Props) {
    const prompt = this.getChatCompletionPrompt(testFile, error, relevantFiles);

    console.log({ prompt });

    const chat = [...prompt, ...context];

    const message = await OpenAiApi.createChatCompletion(chat, [
      {
        type: "function",
        function: FUNCTIONS.AWK,
      },
      {
        type: "function",
        function: FUNCTIONS.GREP,
      },
      {
        type: "function",
        function: FUNCTIONS.FIND,
      },
      {
        type: "function",
        function: FUNCTIONS.WRITE_CODE,
      },
    ]);

    return message;
  }

  async solve({
    testFile,
    relevantFiles = [],
    error,
    context = [],
  }: Props): Promise<OpenAI.Chat.Completions.ChatCompletionMessage> {
    const loader = spinner();

    try {
      loader.start("GPT is solving the test");
      const message = await this.callOpenAi({
        testFile,
        relevantFiles,
        error,
        context,
      });
      // TODO: map over tool_calls and describe what it wants to do

      loader.stop("GPT has an idea, applying 🔧🪛🔨");

      // todo: validate the codeToAdjust structure with joi

      console.log({ message: JSON.stringify(message) });

      return message;
    } catch (error) {
      loader.stop("Something went wrong");
      return process.exit(1);
    }
  }
}

export const testSolverAgent = new TestSolverAgent();
