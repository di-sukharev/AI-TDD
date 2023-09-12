import axios from "axios";
import OpenAI from "openai";

import { outro } from "@clack/prompts";

import { DEFAULT_MODEL_TOKEN_LIMIT, getConfig } from "../commands/config";
import { outroError } from "../utils/prompts";
// import { tokenCount } from "../utils/token-count";

enum ERRORS {
  TOO_MUCH_TOKEN = "TOO_MUCH_TOKENS",
}

// TODO: const config = getConfig();

const MAX_TOKENS = 2000;
const OPENAI_API_KEY = Bun.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  outro(
    "AITDD_OPENAI_API_KEY is not set, please run `aitdd config set AITDD_OPENAI_API_KEY=<your token>. Make sure you add payment details, so API works.`"
  );
  outro(
    "For help look into README https://github.com/di-sukharev/ai-tdd#setup"
  );

  process.exit(1);
}

// if (!OPENAI_API_KEY && command !== "config" && mode !== CONFIG_MODES.set) {
//   intro("ai-tdd");

//   outro(
//     "AITDD_OPENAI_API_KEY is not set, please run `aitdd config set AITDD_OPENAI_API_KEY=<your token>. Make sure you add payment details, so API works.`"
//   );
//   outro(
//     "For help look into README https://github.com/di-sukharev/ai-tdd#setup"
//   );

//   process.exit(1);
// }

const MODEL = "gpt-4";

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

async function createChatCompletion(
  messages: Array<OpenAI.Chat.ChatCompletionMessage>
): Promise<string | null> {
  const params = {
    model: MODEL,
    messages,
    temperature: 0,
    top_p: 0.1,
    max_tokens: MAX_TOKENS,
  };
  try {
    // const REQUEST_TOKENS = messages
    //   .filter((msg) => msg.content)
    //   .map((msg) => tokenCount(msg.content!) + 4)
    //   .reduce((a, b) => a + b, 0);

    const REQUEST_TOKENS = messages
      .filter((msg) => msg.content)
      .map((msg) => msg.content?.length! * 3)
      .reduce((a, b) => a + b, 0);

    if (REQUEST_TOKENS > DEFAULT_MODEL_TOKEN_LIMIT - MAX_TOKENS) {
      throw new Error(ERRORS.TOO_MUCH_TOKEN);
    }

    const completion = await openai.chat.completions.create(params);

    const message = completion.choices[0].message;

    return message?.content;
  } catch (error) {
    // TODO: remove
    outroError(JSON.stringify(params));

    const err = error as Error;
    outroError(err.message);

    if (
      axios.isAxiosError<{ error?: { message: string } }>(error) &&
      error.response?.status === 401
    ) {
      const openAiError = error.response.data.error;

      if (openAiError?.message) outro(openAiError.message);
      outro(
        "For help look into README https://github.com/di-sukharev/ai-tdd#setup"
      );
    }

    throw err;
  }
}

export const OpenAiApi = {
  createChatCompletion,
};
