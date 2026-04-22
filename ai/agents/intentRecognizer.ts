import { ChatCompletionMessageParam } from "openai/resources/index";
import { intentRecognizerPrompt } from "./prompts";
import { createChatCompletion } from "..";
import { IIntentRecognizerResponse } from "../../types";

export const intentRecognizer = async (question: string, messageHistory: ChatCompletionMessageParam[], ) => {
  console.log('intent recognizer called');
  const messages = [
    {
      role: 'system',
      content: intentRecognizerPrompt,
    },
    ...messageHistory,
  ] as ChatCompletionMessageParam[];

  const response = await createChatCompletion('gpt-4o-mini', messages, true);
  console.log('intent recognizer', response);
  try {
    const result = JSON.parse(response as string);
    if (!result.filters) {
      throw new Error('Filters are required');
    }
    if (typeof result.needs_clarification !== 'boolean') {
      throw new Error('Needs clarification must be a boolean');
    }
    if (typeof result.clarifying_question !== 'string' && result.clarifying_question !== null) {
      throw new Error('Clarifying question must be a string or null');
  }

  return result as IIntentRecognizerResponse;
  } catch (error) {
    console.error(error);
    throw new Error('Invalid response format');
  }
}