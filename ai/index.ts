import { OpenAI } from 'openai';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const createEmbedding = async (inputs: string[]) => {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: inputs,
  });
  return response.data.sort((a, b) => a.index - b.index).map((item) => item.embedding);
};

export const createChatCompletion = async (model: string, messages: ChatCompletionMessageParam[], jsonMode = false) => {
  const response = await openai.chat.completions.create({
    model,
    messages,
    ...(jsonMode && { response_format: { type: 'json_object' } }),
  });
  return response.choices[0].message.content;
};