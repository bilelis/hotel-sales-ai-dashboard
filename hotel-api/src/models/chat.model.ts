import { z } from 'zod';

export const chatMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1, 'Message content cannot be empty').max(2000, 'Message cannot exceed 2000 characters'),
});

export const chatRequestSchema = z.object({
  messages: z.array(chatMessageSchema).min(1, 'At least one message is required').max(20, 'Maximum of 20 messages in conversation history'),
});

export type ChatMessage = z.infer<typeof chatMessageSchema>;
export type ChatRequest = z.infer<typeof chatRequestSchema>;

export interface ToolCallRecord {
  name: string;
  args: unknown;
}

export interface ChatResponse {
  answer: string;
  toolCalls: ToolCallRecord[];
}
