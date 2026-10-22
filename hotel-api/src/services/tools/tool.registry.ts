import { z } from 'zod';
import type { Tool } from 'ollama';
import type { ToolExecutionContext } from './tool.types.js';
import * as P from '../../pipelines.js';
import { COLLECTIONS } from '../../database/collections.js';

export type Ctx = ToolExecutionContext;

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
const dateParam = z.string().regex(dateRegex, 'Date format must be YYYY-MM-DD').optional();

export const rangeSchema = z.object({
  from: dateParam,
  to: dateParam,
});

export const limitParam = z.coerce.number().int().min(1).max(20).default(5);

export function parseDateRange(input: z.infer<typeof rangeSchema>, asOf: string): P.Range {
  const fromStr = input.from ?? `${asOf.slice(0, 4)}-01-01`;
  const toStr = input.to ?? asOf;

  const from = new Date(`${fromStr}T00:00:00Z`);
  const to = new Date(`${toStr}T00:00:00Z`);

  if (isNaN(+from) || isNaN(+to)) {
    throw new Error('Invalid date provided.');
  }
  if (from > to) {
    throw new Error('"from" date must be earlier than or equal to "to" date.');
  }

  return { from, to };
}

const runPipeline = (ctx: ToolExecutionContext, col: string, pipeline: ReturnType<typeof P.kpis>) =>
  ctx.db.collection(col).aggregate(pipeline).toArray();

const dateProperties = {
  from: { type: 'string', description: 'Start date YYYY-MM-DD (default: Jan 1 of the current year)' },
  to: { type: 'string', description: 'End date YYYY-MM-DD (default: as of date / today)' },
};

const createToolDef = (
  name: string,
  description: string,
  properties: Record<string, { type: string; description: string }>
): Tool => ({
  type: 'function',
  function: {
    name,
    description,
    parameters: {
      type: 'object',
      properties,
    },
  } as Tool['function'],
});

export const tools: Tool[] = [
  createToolDef(
    'get_kpis',
    'Get Occupancy %, ADR, RevPAR, and room revenue for a date range.',
    dateProperties
  ),
  createToolDef(
    'get_monthly_kpis',
    'Get month-by-month occupancy %, ADR, RevPAR, and room revenue for a specified year.',
    { year: { type: 'number', description: 'Year to analyze, e.g. 2026' } }
  ),
  createToolDef(
    'revenue_by_department',
    'Get revenue breakdown per hotel department (Rooms, Food & Beverage, Spa & Wellness, Events & Meetings, Minibar & Extras, Transport).',
    dateProperties
  ),
  createToolDef(
    'revenue_by_channel',
    'Analyze booking channels: total bookings, cancellation rate, room nights, room revenue, and ADR.',
    dateProperties
  ),
  createToolDef(
    'top_guests',
    'List highest-spending guests over a date range.',
    {
      ...dateProperties,
      limit: { type: 'number', description: 'Number of guests to return (1-20, default 5)' },
    }
  ),
  createToolDef(
    'guests_by_nationality',
    'Analyze guest volume and spending grouped by nationality.',
    {
      ...dateProperties,
      limit: { type: 'number', description: 'Number of nationalities to return (1-20, default 5)' },
    }
  ),
];

const toolImplementations: Record<string, (args: unknown, ctx: ToolExecutionContext) => Promise<unknown>> = {
  get_kpis: async (args, ctx) => {
    const parsed = rangeSchema.parse(args ?? {});
    const results = await runPipeline(ctx, COLLECTIONS.DAILY_KPIS, P.kpis(parseDateRange(parsed, ctx.asOf)));
    return results[0] ?? { roomsSold: 0, roomsAvailable: 0, roomRevenue: 0, occupancyPct: 0, adr: 0, revpar: 0 };
  },

  get_monthly_kpis: async (args, ctx) => {
    const { year } = z.object({
      year: z.coerce.number().int().min(2000).max(2100).optional(),
    }).parse(args ?? {});
    const targetYear = year ?? Number(ctx.asOf.slice(0, 4));
    return runPipeline(ctx, COLLECTIONS.MONTHLY_KPIS, P.monthlyKpis(targetYear));
  },

  revenue_by_department: (args, ctx) => {
    const parsed = rangeSchema.parse(args ?? {});
    return runPipeline(ctx, COLLECTIONS.RESERVATIONS, P.deptRevenue(parseDateRange(parsed, ctx.asOf)));
  },

  revenue_by_channel: (args, ctx) => {
    const parsed = rangeSchema.parse(args ?? {});
    return runPipeline(ctx, COLLECTIONS.RESERVATIONS, P.channels(parseDateRange(parsed, ctx.asOf)));
  },

  top_guests: (args, ctx) => {
    const parsed = rangeSchema.extend({ limit: limitParam }).parse(args ?? {});
    return runPipeline(ctx, COLLECTIONS.RESERVATIONS, P.topGuests(parseDateRange(parsed, ctx.asOf), parsed.limit));
  },

  guests_by_nationality: (args, ctx) => {
    const parsed = rangeSchema.extend({ limit: limitParam }).parse(args ?? {});
    return runPipeline(ctx, COLLECTIONS.RESERVATIONS, P.nationalities(parseDateRange(parsed, ctx.asOf), parsed.limit));
  },
};

/**
 * Runs a tool by name with arguments.
 * Errors are caught and returned as JSON payload so the LLM can self-correct.
 */
export async function runTool(name: string, args: unknown, ctx: ToolExecutionContext): Promise<unknown> {
  const handler = toolImplementations[name];
  if (!handler) {
    return { error: `Unknown tool "${name}". Available tools: ${Object.keys(toolImplementations).join(', ')}` };
  }

  try {
    return await handler(args ?? {}, ctx);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return {
        error: 'Validation failed: ' + error.issues.map((i: any) => `${i.path.join('.')}: ${i.message}`).join('; '),
      };
    }
    return {
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
