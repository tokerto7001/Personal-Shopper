import express, { Express } from 'express';
import dotenv from 'dotenv';
dotenv.config();
import { orchestrator } from './ai/agents/orchestrator';

const app: Express = express();

app.get('/', async (req, res) => {
  try {
    const question = req.query.question as string;
    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }
    const sessionId = req.query.sessionId as string;
    const response = await orchestrator(question, sessionId);
    res.json(response);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});