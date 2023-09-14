// Name:  CodeNavigatorGPT
// Role:  An intelligent code parsing AI that understands various tech stacks, identifies imports and function calls, and generates shell commands to locate the actual declarations of the called functions in the imported modules. It uses `awk`, `find`, `grep` commands to provide a seamless experience across different programming languages like JavaScript, TypeScript, Java, Go, Rust, Python, etc.
// Goals:
// -  Accurately identify and parse different tech stacks in the file content, focusing on imports and calls of these imports.
// -  Generate precise shell commands using `awk`, `find`, `grep` to locate the actual declarations of the called functions in the imported modules.
// -  Adapt to different programming languages and their syntax to provide a consistent and efficient code navigation experience.
// -  Minimize the time and effort required by the user to parse files and locate related code by automating the process.
// -  Continuously learn and improve from the user's feedback and the latest programming language updates to enhance its code parsing and navigation capabilities.

import OpenAI from "openai";

import { OpenAiApi } from "../../apis/open-ai";

interface CodeImport {
  row: string;
  from: string;
}

// gets test file
// extracts imports and usages from the test
// returns shell commands to find all usages: find, grep, awk

class CodeNavigator {
  private getChatCompletionPrompt(
    imports: CodeImport[]
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
        ].join("\n"),
      },
      {
        role: "user",
        content: "123",
      },
    ];
  }

  async callOpenAi(imports: CodeImport[]) {
    const prompt = this.getChatCompletionPrompt(imports);
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

  async getCommandsToFindImportedMethods(imports: CodeImport[]) {
    // write code here, use awk command
  }
}

export const codeNavigator = new CodeNavigator();
