import { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { createChatCompletion } from "..";
import { orchestratorPrompt, orchestratorPromptWithSession } from "./prompts";
import { getSession, setSession } from "../../db";
import { randomUUID } from 'crypto';
import { memorizationAgent } from "./memory";
import { ISession } from "../../types";
import { intentRecognizer } from "./intentRecognizer";

export const orchestrator = async (question: string, sessionId?: string) => {
  let messageHistory: ChatCompletionMessageParam[] = [];
  const session: ISession | null = sessionId ? await getSession(sessionId) : null;
  let userSessionId = session ? sessionId : randomUUID();

  if(session) {
    messageHistory = session.messages;
  }

  const systemPrompt = session ? orchestratorPrompt + '\n' + orchestratorPromptWithSession(session?.summary || '') : orchestratorPrompt;
  const messages = [
    {
      role: 'system',
      content: systemPrompt,
    },
    ...(session ? session.messages : []),
    {
      role: 'user',
      content: question,
    }
  ];

  messageHistory.push({
    role: 'user',
    content: question,
  });

  const response = await createChatCompletion('gpt-4o-mini', messages);

  try {
    const result = JSON.parse(response as string);
    if (!result.message) {
      throw new Error('Message is required');
    }
    if (typeof result.call_intent_recognizer !== 'boolean') {
      throw new Error('Call intent recognizer must be a boolean');
    }

    if (!result.call_intent_recognizer) {
      messageHistory.push({
        role: 'assistant',
        content: result.message,
      });
      const { summary, messageHistory: newMessageHistory } = await memorizationAgent(session, messageHistory);

      await setSession(userSessionId!, { messages: newMessageHistory, summary });
      return { message: result.message, sessionId: userSessionId };
    } else {
      const { filters, needs_clarification, clarifying_question} = await intentRecognizer(question, messageHistory);
      if(needs_clarification) {
        messageHistory.push({
          role: 'assistant',
          content: clarifying_question,
        });
        await memorizationAgent(session, messageHistory);
        await setSession(userSessionId!, { messages: messageHistory, summary: session?.summary || '' });
        return { message: clarifying_question, sessionId: userSessionId };
      } else {
        // filter products according to filters
        return { filters, sessionId: userSessionId };
      }
   

    }
  } catch (error) {
    console.error(error);
    throw new Error('Invalid response format');
  }
  
}