import { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { createChatCompletion, createEmbedding } from "..";
import { orchestratorPrompt, orchestratorPromptWithSession } from "./prompts";
import { getSession, searchProducts, setSession } from "../../db";
import { randomUUID } from 'crypto';
import { memorizationAgent } from "./memory";
import { IProduct, ISession } from "../../types";
import { intentRecognizer } from "./intentRecognizer";
import { productsReviewer } from "./productsReviewer";

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
    ...(session ? session.messages.filter(message => message.role === 'user') : []),
    {
      role: 'user',
      content: question,
    }
  ];

  messageHistory.push({
    role: 'user',
    content: question,
  });

  // orchestrator response
  const response = await createChatCompletion('gpt-4o-mini', messages, true);

  try {
    const result = JSON.parse(response as string);
    if (!result.message && result.call_intent_recognizer == undefined) {
      throw new Error('Message or call intent recognizer is required');
    }
    if (typeof result.call_intent_recognizer !== 'boolean') {
      throw new Error('Call intent recognizer must be a boolean');
    }

    // if the user does not have a shopping intent, reply directly to the user
    if (!result.call_intent_recognizer) {
      messageHistory.push({
        role: 'assistant',
        content: result.message,
      });
      
      const { summary, messageHistory: newMessageHistory } = await memorizationAgent(session, messageHistory);
      await setSession(userSessionId!, { messages: newMessageHistory, summary });

      return { message: result.message, sessionId: userSessionId }; // return sessionId for further talk in the same session
    } else {
      // if the user has a shopping intent, call the intent recognizer agent
      const { filters, needs_clarification, clarifying_question, search_query} = await intentRecognizer(question, messageHistory);
      // if the user needs clarification, ask the clarifying question
      if(needs_clarification) {
        messageHistory.push({
          role: 'assistant',
          content: clarifying_question,
        });
        const { summary, messageHistory: newMessageHistory } = await memorizationAgent(session, messageHistory);
        await setSession(userSessionId!, { messages: newMessageHistory, summary });
        return { message: clarifying_question, sessionId: userSessionId };
      } else {
        // filter products according to filters
        const queryVector = await createEmbedding([search_query as string]);
        const qdrantFilters: Record<string, string | number | string[]> = {};
        // convert filters to qdrant filters
        Object.entries(filters).forEach(([field, value]) => {
          if(Array.isArray(value) && value.length) {
            if(value.length > 1) {
              if(!qdrantFilters.should) {
                qdrantFilters.should = [];
              }
              value.forEach((v) => {
                (qdrantFilters.should as unknown as { key: string; match: { value: string } }[]).push({
                  key: field,
                  match: {
                    value: v,
                  }
                })
              })
            } else {
              if(!qdrantFilters.must) {
                qdrantFilters.must = [];
              }
             (qdrantFilters.must as unknown as { key: string; match: { value: string } }[]).push({
              key: field,
              match: {
                value: value[0],
              }
             })
            }
          }
        });

        const products = await searchProducts(queryVector[0], qdrantFilters);
        if(!products.length) {
          messageHistory.push({
            role: 'assistant',
            content: 'No products found',
          });
          
          const { summary, messageHistory: newMessageHistory } = await memorizationAgent(session, messageHistory);
          await setSession(userSessionId!, { messages: newMessageHistory, summary });
          return { message: 'Unfortunately, no products found. Would you like to try again with different filters?', sessionId: userSessionId };
        }

        const productsReviewerResponse = await productsReviewer(products, messageHistory);
        const reviewedProducts = products.filter((product) => productsReviewerResponse.includes(product.id)).map((p) => p.payload as unknown as IProduct);
        const message = productsReviewerResponse.length ?
        `Found ${productsReviewerResponse.length} product(s): ${reviewedProducts.map((p: IProduct) => `${p.title} ($${p.price})`).join(', ')}.` :
        'Unfortunately, no products found. Would you like to try again with different filters?';
     
        messageHistory.push({
          role: 'assistant',
          content: message,
        });
      
        const { summary, messageHistory: newMessageHistory } = await memorizationAgent(session, messageHistory);
        await setSession(userSessionId!, { messages: newMessageHistory, summary })
        return { products: reviewedProducts, sessionId: userSessionId };
      }
   

    }
  } catch (error) {
    console.error(error);
    throw new Error('Invalid response format');
  }
  
}