import { OpenAI } from 'openai';

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