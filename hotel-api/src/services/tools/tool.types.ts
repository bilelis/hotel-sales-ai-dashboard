import type { Db } from 'mongodb';
import type { Tool } from 'ollama';

export interface ToolExecutionContext {
  db: Db;
  asOf: string;
}

export interface IToolHandler {
  name: string;
  definition: Tool;
  execute(args: unknown, context: ToolExecutionContext): Promise<unknown>;
}
