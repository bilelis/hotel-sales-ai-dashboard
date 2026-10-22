import { Router } from 'express';
import { postChat } from '../controllers/chat.controller.js';

export const chatRouter = Router();

chatRouter.post('/chat', postChat);

chatRouter.get('/chat', (_req, res) => {
  res.json({
    ok: true,
    message: 'Grand Azur AI Chatbot endpoint is ready.',
    instructions: 'Send a POST request with JSON payload: { "messages": [{ "role": "user", "content": "..." }] }',
    example: {
      method: 'POST',
      url: '/api/chat',
      headers: { 'Content-Type': 'application/json' },
      body: {
        messages: [{ role: 'user', content: 'What was the RevPAR last month?' }],
      },
    },
  });
});
