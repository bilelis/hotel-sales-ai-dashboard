import type { ChatMessage, ChatResponse, Dashboard } from './types';

export const delay = <T,>(v: T, ms: number) => new Promise<T>(r => setTimeout(() => r(v), ms));

export const mockDashboard: Dashboard = {
  period: 'Jan 2026 – Oct 2026', asof: 'Oct 17, 2026',
  rev: 7974381.5, yoy: 0.3, revpar: 220.9, revparYoy: -0.7,
  last: { label: 'Sep 2026', total: 993268.2, mom: -21.9, occ: 75.3, adr: 370.57, revpar: 278.95 },
  months: [
    { m: 'Feb', room: 310000, other: 180000 }, { m: 'Mar', room: 420000, other: 240000 }, { m: 'Apr', room: 520000, other: 300000 },
    { m: 'May', room: 610000, other: 350000 }, { m: 'Jun', room: 740000, other: 420000 }, { m: 'Jul', room: 880000, other: 520000 },
    { m: 'Aug', room: 960000, other: 560000 }, { m: 'Sep', room: 640000, other: 353268 }, { m: 'Oct', room: 330000, other: 190000 },
  ],
  dept: [['Rooms', 3854973], ['Food & Beverage', 2210597], ['Events & Meetings', 1177881], ['Spa & Wellness', 402005], ['Transport', 168971], ['Minibar & Extras', 159955]],
  res: [
    { n: 'Charlotte Willems', t: 'Junior Suite', ci: '10-15', co: '10-17', v: 702, s: 'Completed' },
    { n: 'Antoine Bernard', t: 'Deluxe Sea View', ci: '10-10', co: '10-17', v: 2030, s: 'Completed' },
    { n: 'Sarra Khemiri', t: 'Executive Suite', ci: '10-12', co: '10-19', v: 3640, s: 'In-house' },
  ],
  occ: [84, 80, 78, 75, 82, 77, 73, 70, 68, 72, 71, 66.7, 63, 60],
  ch: [['Direct Website', 899100, 368.94, 7.6], ['Booking.com', 725518, 370.73, 19.6]],
  guests: [['Carlos García', 28360.39, 1], ['Sarra Khemiri', 27123.9, 1]],
};

export async function mockChat(messages: ChatMessage[]): Promise<ChatResponse> {
  const q = (messages[messages.length - 1]?.content ?? '').toLowerCase();
  if (/cancel/.test(q)) return delay({ answer: 'Booking.com has the highest cancellation rate this year at 19,6%, followed by Expedia at 15,8%.', toolCalls: [{ name: 'revenue_by_channel', args: { from: '2026-01-01', to: '2026-10-17' } }] }, 1200);
  if (/revpar|adr|occupanc/.test(q)) return delay({ answer: 'In September 2026, RevPAR was €278,95 with an ADR of €370,57 and 75,3% occupancy.', toolCalls: [{ name: 'get_kpis', args: { from: '2026-09-01', to: '2026-09-30' } }] }, 1200);
  return delay({ answer: 'This is sample data (mock mode). Connect the API to ask real questions.', toolCalls: [] }, 800);
}
