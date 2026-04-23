import { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { ISession } from "../../types";
import { contextSummarizerPrompt } from "./prompts";
import { createChatCompletion } from "..";

export const memorizationAgent = async (session: ISession | null, messageHistory: ChatCompletionMessageParam[]) => {
  let summary = session?.summary || '';
  try {
  // Generate context summary if the message history is too long
  if (messageHistory.length > 8) {
    const contextSummaryMessages = [
      {
        role: 'system',
        content: contextSummarizerPrompt,
      },
      ...messageHistory,
    ] as ChatCompletionMessageParam[];
    const contextSummary = await createChatCompletion('gpt-4o-mini', contextSummaryMessages);
    summary = JSON.parse(contextSummary as string).summary;
    messageHistory = messageHistory.slice(-8);
  }
  return { summary, messageHistory };
  } catch (error) {
    console.error(error);
    return { summary, messageHistory };
  }
};