import { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { createChatCompletion } from "..";
import { productsReviewerPrompt } from "./prompts";
import { components } from "@qdrant/js-client-rest/dist/types/openapi/generated_schema";

export const productsReviewer = async (products: (components["schemas"]["ScoredPoint"])[], messageHistory: ChatCompletionMessageParam[]) => {
  try {
    const messages = [
      {
        role: 'system',
        content: productsReviewerPrompt,
      },
      ...messageHistory,
      {
        role: 'user',
        content: `Candidate Products: ${JSON.stringify(products)}`,
      },
    ] as ChatCompletionMessageParam[];
  
    const response = await createChatCompletion('gpt-4o-mini', messages, true);
    const result = JSON.parse(response as string);
    if (!result.productIds) {
      throw new Error('Product IDs are required');
    }
    if (!Array.isArray(result.productIds)) {
      throw new Error('Product IDs must be an array');
    }
    return result.productIds;
  } catch (error) {
    console.error(error);
    return products.map((product) => product.id);
  }
}