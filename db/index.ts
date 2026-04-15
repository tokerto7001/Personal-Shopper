import { QdrantClient } from '@qdrant/js-client-rest';
import { IProductWithVector } from '../types';

const client = new QdrantClient({
  url: process.env.QDRANT_URL,
});

const createCollection = async () => {
  console.log('Creating collection...');
  const name = 'products';
  const collection = await client.getCollections();
  if(!collection.collections.find((c) => c.name === name)) {
    await client.createCollection(name, {
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
  await client.upsert('products', {
    points: products.map(({ id, vector, ...payload }) => ({
      id,
      vector,
      payload,
    })),
  });
};

export { createCollection, client, insertProductsWithVector };