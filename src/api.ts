import { intro, outro } from '@clack/prompts';
import axios from 'axios';
import chalk from 'chalk';
import {
  ChatCompletionRequestMessage,
  Configuration as OpenAiApiConfiguration,
  OpenAIApi
} from 'openai';

import { CONFIG_MODES, getConfig } from './commands/config';

const config = getConfig();

let apiKey = config?.OPENAI_API_KEY;

const [command, mode] = process.argv.slice(2);

if (!apiKey && command !== 'config' && mode !== CONFIG_MODES.set) {
  intro('ai-tdd');

  outro(
    'OPENAI_API_KEY is not set, please run `tdd config set OPENAI_API_KEY=<your token>. Make sure you add payment details, so API works.`'
  );
  outro(
    'For help look into README https://github.com/di-sukharev/ai-tdd#setup'
  );

  process.exit(1);
}

class OpenAi {
  private openAiApiConfiguration = new OpenAiApiConfiguration({
    apiKey: apiKey
  });

  private openAI = new OpenAIApi(this.openAiApiConfiguration);

  public createChatCompletion = async (
    messages: Array<ChatCompletionRequestMessage>,
    onStream: (token: string) => void,
    onComplete: (completion: string) => void
  ): Promise<void> => {
    try {
      const res: any = await this.openAI.createChatCompletion(
        {
          model: config?.model || 'gpt-4',
          messages,
          temperature: 0,
          top_p: 0.1,
          stream: true,
          max_tokens: config?.maxTokens || 2000
        },
        { responseType: 'stream' }
      );

      let tokens = '';

      res.data.on('data', (data: Buffer) => {
        const lines = data
          .toString()
          .split('\n')
          .filter((line) => line.trim() !== '');
        for (const line of lines) {
          const message = line.replace(/^data: /, '');
          if (message === '[DONE]') {
            onComplete(tokens);
            break;
          } else {
            try {
              const parsed = JSON.parse(message);
              const [choice] = parsed.choices;
              const token = choice.delta?.content;

              if (!token && parsed.finish_reason === 'stop') {
                onComplete(tokens);
                break;
              } else if (!token) continue;
              onStream(token);
              tokens += token;
            } catch (error) {
              console.error(
                'Could not JSON.parse stream message',
                message,
                error
              );

              // throw error;
            }
          }
        }
      });
    } catch (error: unknown) {
      outro(`${chalk.red('✖')} ${error}`);

      if (
        axios.isAxiosError<{ error?: { message: string } }>(error) &&
        error.response?.status === 401
      ) {
        const openAiError = error.response.data.error;

        if (openAiError?.message) outro(openAiError.message);
        outro(
          'For help look into README https://github.com/di-sukharev/aitdd#setup'
        );
      }

      process.exit(1);
    }
  };
}

export const getAITDDLatestVersion = async (): Promise<string | undefined> => {
  try {
    const { data } = await axios.get('https://unpkg.com/ai-tdd/package.json');
    return data.version;
  } catch (_) {
    outro('Error while getting the latest version of ai-tdd');
    return undefined;
  }
};

export const api = new OpenAi();
