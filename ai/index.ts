import { OpenAI } from 'openai';
import { ResponseInput } from 'openai/resources/responses/responses';

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

export const createResponse = async (model: string, messages: ResponseInput, jsonMode = true) => {
  const response = await openai.responses.create({
    model,
    input: messages,
    ...(jsonMode && { text: { format: { type: 'json_object' } } }),
  });
  return response.output_text;
};