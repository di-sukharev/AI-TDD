import {
  ChatCompletionRequestMessage,
  ChatCompletionRequestMessageRoleEnum
} from 'openai';
import { api } from './api';

const INIT_MESSAGES_PROMPT: Array<ChatCompletionRequestMessage> = [
  {
    role: ChatCompletionRequestMessageRoleEnum.System,
    content: `You are to do TDD and write code that passes tests. I send you the test suite, and you response with code that passes it. Do NOT provide any explanations, response only with the code.`
  }
];

const generateChatCompletionPrompt = (
  content: string
): Array<ChatCompletionRequestMessage> => {
  const chatContextAsCompletionRequest = [...INIT_MESSAGES_PROMPT];

  chatContextAsCompletionRequest.push({
    role: ChatCompletionRequestMessageRoleEnum.User,
    content
  });

  return chatContextAsCompletionRequest;
};

export enum ERRORS_ENUM {
  tooMuchTokens = 'TOO_MUCH_TOKENS',
  internalError = 'INTERNAL_ERROR',
  emptyMessage = 'EMPTY_MESSAGE'
}

export const solveTest = async (
  testFileContent: string,
  onStream: (token: string) => void,
  onComplete: (completion: string) => void = () => {}
): Promise<void> => {
  try {
    const messages = generateChatCompletionPrompt(testFileContent);

    await api.createChatCompletion(messages, onStream, onComplete);
  } catch (error) {
    throw error;
  }
};
