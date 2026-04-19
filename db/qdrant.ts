import { QdrantClient } from '@qdrant/js-client-rest';
import { IProductWithVector } from '../types';

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

export { createCollection, qdrantClient, insertProductsWithVector };