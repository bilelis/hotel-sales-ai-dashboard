import type { Request, Response, NextFunction } from 'express';
import { dbManager } from '../database/connection.js';
import { chatService } from '../services/chat.service.js';
import { chatRequestSchema } from '../models/chat.model.js';

export async function postChat(req: Request, res: Response, next: NextFunction) {
  const parseResult = chatRequestSchema.safeParse(req.body);

  if (!parseResult.success) {
    res.status(400).json({
      error: 'Invalid chat request body',
      details: parseResult.error.flatten(),
    });
    return;
  }

  try {
    const db = dbManager.getDb();
    const asOf = dbManager.getAsOfDate();
    const response = await chatService.handleConversation(parseResult.data.messages, {
      db,
      asOf,
    });
    res.json(response);
  } catch (error) {
    next(error);
  }
}
