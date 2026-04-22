import dotenv from 'dotenv';
dotenv.config();

import { createEmbedding } from '../ai';
import { createCollection, insertProductsWithVector } from '../db';
import products from '../products.json';

const insertProducts = async () => {
  console.log('Inserting products...');
  await createCollection();

  const productEmbeddingTexts = products.map((product) => {
    return `${product.title} ${product.description} ${product.tags.join(' ')} ${product.category} ${product.color}`;
  })
  const productEmbeddings = await createEmbedding(productEmbeddingTexts);

  const productsWithVector = products.map((product, index) => ({
    ...product,
    vector: productEmbeddings[index],
  }));

  await insertProductsWithVector(productsWithVector);
  console.log('Products inserted successfully');
  process.exit(0);
};

insertProducts().catch(console.error);