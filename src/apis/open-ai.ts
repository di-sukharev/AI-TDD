import axios from "axios";
import OpenAI from "openai";

import { outro } from "@clack/prompts";

import { DEFAULT_MODEL_TOKEN_LIMIT, getConfig } from "../commands/config";
import { outroError } from "../utils/prompts";
// import { tokenCount } from "../utils/token-count";

const config = getConfig();

const OPENAI_API_KEY = config?.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  outro(
    "OPENAI_API_KEY is not set, please run `aitdd config set OPENAI_API_KEY=<your token>. Make sure you add payment details, so API works.`"
  );
  outro(
    "For help look into README https://github.com/di-sukharev/ai-tdd#setup"
  );

  process.exit(1);
}

const MODEL = config.MODEL;

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

async function createChatCompletion(
  messages: Array<OpenAI.Chat.ChatCompletionMessageParam>,
  tools: Array<OpenAI.ChatCompletionTool>
): Promise<OpenAI.Chat.Completions.ChatCompletionMessage> {
  const params = {
    model: MODEL,
    messages,
    tools,
    temperature: 1,
    top_p: 0.1,
    // max_tokens: DEFAULT_MODEL_TOKEN_LIMIT,
  };

  try {
    const completion = await openai.chat.completions.create(params);

    const message = completion.choices[0].message;

    return message;
  } catch (error) {
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
