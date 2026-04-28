import { ISession } from "../../types";
import { contextSummarizerPrompt } from "./prompts";
import { createResponse } from "..";
import { ResponseInput } from "openai/resources/responses/responses";

export const memorizationAgent = async (session: ISession | null, messageHistory: ResponseInput) => {
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
    ] as ResponseInput;
    const contextSummary = await createResponse('gpt-4o-mini', contextSummaryMessages);
    summary = JSON.parse(contextSummary as string).summary;
    messageHistory = messageHistory.slice(-8);
  }
  return { summary, messageHistory };
  } catch (error) {
    console.error(error);
    return { summary, messageHistory };
  }
};