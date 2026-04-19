import { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { ISession } from "../../types";
import { contextSummarizerPrompt } from "./prompts";
import { createChatCompletion } from "..";

export const memorizationAgent = async (session: ISession | null, messageHistory: ChatCompletionMessageParam[]) => {
  // Generate context summary if the message history is too long
  let summary = session?.summary || '';
  if (messageHistory.length > 8) {
    const contextSummaryMessages = [
      {
        role: 'system',
        content: contextSummarizerPrompt,
      },
      ...messageHistory,
    ] as ChatCompletionMessageParam[];
    const contextSummary = await createChatCompletion('gpt-4o-mini', contextSummaryMessages);
    summary = contextSummary as string;
    messageHistory = messageHistory.slice(-8);
  }
  return { summary, messageHistory };
};