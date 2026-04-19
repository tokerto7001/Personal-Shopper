import { createClient } from 'redis';
import { ISession } from '../types';

const redisClient = createClient({
  url: process.env.REDIS_URL,
});

redisClient.on('error', (err) => {
  console.error('Redis error', err);
});

redisClient.connect();

redisClient.on('connect', () => {
  console.log('Redis connected');
});

const getSession = async (sessionId: string): Promise<ISession | null> => {
  const session = await redisClient.get(`session:${sessionId}`);
  if (!session) {
    return null;
  }
  return JSON.parse(session);
};

const setSession = async (sessionId: string, session: ISession) => {
  await redisClient.set(`session:${sessionId}`, JSON.stringify(session), { EX: 60 * 60 * 24 * 30 });
};

export { redisClient, getSession, setSession }; 