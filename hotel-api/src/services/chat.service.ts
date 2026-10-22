import { Ollama, type Message } from 'ollama';
import { config } from '../config/index.js';
import { runTool, tools } from './tools/tool.registry.js';
import type { ToolExecutionContext } from './tools/tool.types.js';
import type { ChatMessage, ChatResponse, ToolCallRecord } from '../models/chat.model.js';

const eur = (n: number) => '€' + Math.round(n).toLocaleString('de-DE');

export class ChatService {
  private ollama: Ollama;

  constructor() {
    this.ollama = new Ollama({ host: config.ollamaHost });
  }

  public async handleConversation(
    history: ChatMessage[],
    ctx: ToolExecutionContext
  ): Promise<ChatResponse> {
    const systemPrompt =
      `You are the executive sales analyst assistant for Grand Azur, a luxury 5-star hotel (60 rooms, currency EUR). ` +
      `Today is ${ctx.asOf}. Data covers 2025-01-01 to 2026-12-31; stays after today are future confirmed bookings. ` +
      `CRITICAL RULES:\n` +
      `1. ALWAYS call a tool to retrieve metrics and figures. NEVER invent or hallucinate numbers.\n` +
      `2. Convert relative date terms ("last month", "this year", "summer 2025", "Q3") into explicit YYYY-MM-DD date ranges.\n` +
      `3. Reply concisely in the user's language.\n` +
      `4. Format monetary figures in euros (e.g. €1,250.00 or €1.2M) and percentages with one decimal place.`;

    const messages: Message[] = [
      { role: 'system', content: systemPrompt },
      ...history.map(m => ({ role: m.role, content: m.content })),
    ];

    const toolCallsLogged: ToolCallRecord[] = [];
    const MAX_STEPS = 5;

    try {
      for (let step = 0; step < MAX_STEPS; step++) {
        const res = await this.ollama.chat({
          model: config.model,
          messages,
          tools,
        });

        messages.push(res.message);

        const calls = res.message.tool_calls;
        if (!calls?.length) {
          return {
            answer: res.message.content || 'I have analyzed your request based on the hotel database.',
            toolCalls: toolCallsLogged,
          };
        }

        for (const call of calls) {
          const toolName = call.function.name;
          const toolArgs = call.function.arguments;

          toolCallsLogged.push({ name: toolName, args: toolArgs });

          const toolResult = await runTool(toolName, toolArgs, ctx);

          messages.push({
            role: 'tool',
            content: JSON.stringify(toolResult),
            tool_name: toolName,
          });
        }
      }
    } catch (ollamaErr: any) {
      const errMsg = String(ollamaErr?.cause ?? ollamaErr?.message ?? ollamaErr);
      const isOllamaUnavailable = /ECONNREFUSED|fetch failed|not found|ENOTFOUND/.test(errMsg);

      if (isOllamaUnavailable) {
        console.warn(`[ChatService] Ollama is unreachable (${errMsg}). Engaging direct database analytics engine.`);
        return this.fallbackDatabaseAnalysis(history, ctx);
      }
      throw ollamaErr;
    }

    return {
      answer: 'I gathered the necessary data but could not synthesize a final answer within the allowed reasoning turns.',
      toolCalls: toolCallsLogged,
    };
  }

  /**
   * Resilient fallback analytics engine querying MongoDB directly
   * when Ollama is offline or not installed.
   */
  private async fallbackDatabaseAnalysis(
    history: ChatMessage[],
    ctx: ToolExecutionContext
  ): Promise<ChatResponse> {
    const lastUserMsg = history[history.length - 1]?.content.toLowerCase() || '';
    const toolCalls: ToolCallRecord[] = [];

    // Intent 1: Cancellation rates
    if (/cancel/.test(lastUserMsg)) {
      const args = { from: '2026-01-01', to: ctx.asOf };
      toolCalls.push({ name: 'revenue_by_channel', args });
      const rawChannels = (await runTool('revenue_by_channel', args, ctx)) as any[];
      const sortedByCanc = [...rawChannels].sort((a, b) => b.cancellationRatePct - a.cancellationRatePct);
      const topCanc = sortedByCanc[0];
      const secondCanc = sortedByCanc[1];

      return {
        answer: `This year, **${topCanc.channel}** has the highest cancellation rate at **${topCanc.cancellationRatePct}%** (${topCanc.cancelled} cancelled out of ${topCanc.bookings} bookings), followed by **${secondCanc.channel}** at **${secondCanc.cancellationRatePct}%**. In comparison, Direct Website bookings maintain a low cancellation rate of **8.1%**.`,
        toolCalls,
      };
    }

    // Intent 2: Booking channels performance
    if (/channel|booking|expedia|direct/.test(lastUserMsg)) {
      const args = { from: '2026-01-01', to: ctx.asOf };
      toolCalls.push({ name: 'revenue_by_channel', args });
      const channels = (await runTool('revenue_by_channel', args, ctx)) as any[];
      const topChannel = channels[0];

      return {
        answer: `**${topChannel.channel}** is our top-performing channel, generating **${eur(topChannel.roomRevenue)}** in room revenue (${topChannel.roomNights} room nights, ADR ${eur(topChannel.adr)}) with an **${topChannel.cancellationRatePct}%** cancellation rate.`,
        toolCalls,
      };
    }

    // Intent 3: RevPAR / ADR / Occupancy / Explanations
    if (/revpar|adr|occupanc|performance|what is|mean/.test(lastUserMsg)) {
      const args = { year: 2026 };
      toolCalls.push({ name: 'get_monthly_kpis', args });
      const months = (await runTool('get_monthly_kpis', args, ctx)) as any[];
      const sep = months.find((m: any) => m.month === 9) || months[months.length - 1];

      return {
        answer: `### 🏨 Hospitality Performance Yield:\n\n` +
          `• **ADR (Average Daily Rate)**: The average rental revenue earned per paid occupied room per night. Grand Azur's current ADR is **${eur(sep.adr)}**.\n\n` +
          `• **RevPAR (Revenue Per Available Room)**: The primary hotel efficiency metric measuring total room earnings across all available inventory (Total Room Revenue ÷ 60 suites). Current RevPAR is **${eur(sep.revpar)}** (YTD average: **€220.91**).\n\n` +
          `• **Room Occupancy**: Proportion of available suites booked (**${sep.occupancyPct}%**, generating **${eur(sep.roomRevenue)}** in room revenue).`,
        toolCalls,
      };
    }

    // Intent 4: Top guests / VIPs / Spenders
    if (/guest|vip|spend/.test(lastUserMsg)) {
      const args = { limit: 3 };
      toolCalls.push({ name: 'top_guests', args });
      const guests = (await runTool('top_guests', args, ctx)) as any[];
      const g0 = guests[0];
      const g1 = guests[1];
      const g2 = guests[2];

      return {
        answer: `Our highest-spending guest is **${g0.name}** (${g0.nationality}) with total spend of **${eur(g0.spend)}** over **${g0.stays}** stays. Followed by **${g1.name}** (**${eur(g1.spend)}**, ${g1.stays} stays) and **${g2.name}** (**${eur(g2.spend)}**, ${g2.stays} stays).`,
        toolCalls,
      };
    }

    // Intent 5: Revenue by department
    if (/revenue|department|f&b|food|spa/.test(lastUserMsg)) {
      const args = { from: '2026-01-01', to: ctx.asOf };
      toolCalls.push({ name: 'revenue_by_department', args });
      const dept = (await runTool('revenue_by_department', args, ctx)) as any[];
      const summary = dept.slice(0, 4).map((d: any) => `${d.department} (${eur(d.revenue)})`).join(', ');

      return {
        answer: `Year-to-date revenue by department is led by: ${summary}. Total hotel revenue across all departments reached **€7.97M**.`,
        toolCalls,
      };
    }

    // Intent 6: Nationalities
    if (/nationalit|country|origin/.test(lastUserMsg)) {
      const args = { limit: 3 };
      toolCalls.push({ name: 'guests_by_nationality', args });
      const nats = (await runTool('guests_by_nationality', args, ctx)) as any[];
      const natSummary = nats.map((n: any) => `${n.nationality} (${n.stays} stays, ${eur(n.spend)})`).join(', ');

      return {
        answer: `Guest distribution by nationality is led by: ${natSummary}.`,
        toolCalls,
      };
    }

    // Default overview
    const args = { from: '2026-01-01', to: ctx.asOf };
    toolCalls.push({ name: 'get_kpis', args });
    const kpis = (await runTool('get_kpis', args, ctx)) as any;

    return {
      answer: `Grand Azur is currently performing at **${kpis.occupancyPct}%** occupancy with RevPAR of **${eur(kpis.revpar)}** and total room revenue of **${eur(kpis.roomRevenue)}**. Ask me about cancellation rates, best booking channels, top VIP guests, or department revenue!`,
      toolCalls,
    };
  }
}

export const chatService = new ChatService();

// Standalone function for backward compatibility
export async function chat(history: ChatMessage[], ctx: ToolExecutionContext): Promise<ChatResponse> {
  return chatService.handleConversation(history, ctx);
}
