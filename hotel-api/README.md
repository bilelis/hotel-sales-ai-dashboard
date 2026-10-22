# Hotel API: MongoDB + Ollama tool-calling chatbot

Node.js + TypeScript + Express. Needs Node 22 (20.19+ works), your MongoDB with the `hotel` database, and Ollama.

## Run
    cp .env.example .env          # edit MONGO_URI if needed
    ollama pull qwen2.5:7b        # model with reliable tool calling
    npm install
    npm run dev                   # http://localhost:3001

## Endpoints
| Method | Path | What it does |
|---|---|---|
| GET | `/api/health` | Status, database name, data date, model |
| GET | `/api/dashboard` | All dashboard data in one call (KPIs, departments, monthly revenue, reservations, occupancy, channels, top guests) |
| POST | `/api/chat` | `{ "messages": [{ "role": "user", "content": "RevPAR last month?" }] }` returns `{ answer, toolCalls }` |

    curl localhost:3001/api/dashboard
    curl -X POST localhost:3001/api/chat -H "Content-Type: application/json" \
      -d '{"messages":[{"role":"user","content":"Which channel has the highest cancellation rate this year?"}]}'

## How the chatbot works
The LLM never touches the database. It only picks one of 6 tools (`get_kpis`, `get_monthly_kpis`, `revenue_by_department`,
`revenue_by_channel`, `top_guests`, `guests_by_nationality`) and fills in the arguments. The backend validates them (zod),
runs a fixed aggregation from `src/pipelines.ts`, and gives the result back to the model to explain. No generated queries, so no injection risk.
`toolCalls` in the response shows exactly what ran. To add a question type: add a pipeline, a tool definition and an entry in `impl` (`src/tools.ts`).

## Check without MongoDB or Ollama
    DATA_DIR=../hotel_mongo/data npm run check
Runs every tool and the dashboard builder against the NDJSON export with an in-memory emulator and compares the results with known values.

## Deploy later
`Dockerfile` is included (multi-stage build). Next step will be docker-compose with Mongo, Ollama, Caddy and login.
