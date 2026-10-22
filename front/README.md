# Grand Azur – hotel dashboard (React + Vite + TypeScript)

Frontend for the hotel-api backend: dashboard cards and charts plus an AI chat that asks your MongoDB data through Ollama.

## Run
    npm install
    cp .env.example .env     # optional
    npm run dev              # http://localhost:5173

Start the backend first (`npm run dev` in `hotel-api`, port 3001) and Ollama. Vite proxies `/api` to the backend.

## Environment variables (.env)
| Variable | Default | Meaning |
|---|---|---|
| `VITE_API_URL` | empty | Backend URL. Empty = use the Vite proxy to `http://localhost:3001`. Set it when the API runs elsewhere |
| `VITE_USE_MOCK` | `false` | `true` = built-in sample data, no backend needed (good for UI work) |

## Commands
`npm run dev` development server · `npm run build` type-check and production build (`dist/`) · `npm run preview` serve the build

## Structure
    src/api.ts            typed API client (20 s timeout, chat 120 s, ApiError with HTTP status)
    src/types.ts          response types (Dashboard, ChatResponse...)
    src/mock.ts           sample data, same shape as the API
    src/format.ts         €7.974.381 / €220,90 formatting
    src/hooks/            useDashboard (refetch every 60 s + on focus), motion (reveal, count-up, reduced motion)
    src/components/       Sidebar, Topbar, UpdateCard, KpiCard, DepartmentDonut, ReservationsList, RevenueBars,
                          OccupancyGauge, ChatCard, Skeletons, Card
    src/index.css         Tailwind + design tokens (light/dark follow the system)

## Notes
- Charts are hand-written SVG/CSS, so there is no chart library.
- Chat sends the last 10 messages. "How I got this" lists the tools the backend ran.
- Errors: 503 shows "The AI model is offline", other errors show a generic message, both with Retry.
