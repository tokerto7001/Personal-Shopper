import express, { Express } from 'express';
import dotenv from 'dotenv';

dotenv.config();

const app: Express = express();

app.get('/', (req, res) => {
  res.send('Hello World');
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});