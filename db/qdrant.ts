import { QdrantClient } from '@qdrant/js-client-rest';
import { IProductWithVector } from '../types';
import { components } from '@qdrant/js-client-rest/dist/types/openapi/generated_schema';

const qdrantClient = new QdrantClient({
  url: process.env.QDRANT_URL,
});

const createCollection = async () => {
  console.log('Creating collection...');
  const name = 'products';
  const collection = await qdrantClient.getCollections();
  if(!collection.collections.find((c) => c.name === name)) {
    await qdrantClient.createCollection(name, {
      vectors: {
        size: 1536,
        distance: 'Cosine',
      },
    });
    console.log(`Collection ${name} created`);
    return;
  }
  console.log(`Collection ${name} already exists`);
};

const insertProductsWithVector = async (products: IProductWithVector[]) => {
  await qdrantClient.upsert('products', {
    points: products.map(({ id, vector, ...payload }) => ({
      id,
      vector,
      payload,
    })),
  });
};

const searchProducts = async (vector: number[], filters: Record<string, string | number | string[]>): Promise< (components["schemas"]["ScoredPoint"])[]> => {
  const response = await qdrantClient.query('products', {
    query: vector,
    ...(Object.keys(filters).length && { filter: filters }),
    limit: 10,
    with_payload: true,
    score_threshold: 0.40,
  })
  return response.points;
};

export { createCollection, qdrantClient, insertProductsWithVector, searchProducts };