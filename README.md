# Adept

A multi-user **learning agent**: tutor, knowledge companion, researcher, and self-improving work agent. The model is SpaceXAI Grok (`grok-4.6`) via the xAI API.

## What it does

- **Work agent** — does the task, then saves skills and lessons
- **Tutor** — teaches in small steps, quizzes, tracks mastery, spaced repetition
- **Knowledge** — ingest notes/files, answer from your library
- **Research** — plan, live web search, save a sourced report
- **Memory** — facts, preferences, goals, and lessons that persist across sessions

Each user has their own data. The first account on an instance is admin. Users can paste their own `XAI_API_KEY` in Settings, or the instance can share one.

## Run locally

```bash
cd learning-agent
cp .env.example .env.local
```

Edit `.env.local`:

```
XAI_API_KEY=your_key_from_https://console.x.ai
AUTH_SECRET=a-long-random-string
```

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), create an account, then open Chat.

Local data lives in `data/adept.db` (SQLite / libSQL).

## Deploy (Vercel)

Serverless hosts cannot keep a local SQLite file. Create a free [Turso](https://turso.tech) database, then set:

- `XAI_API_KEY`
- `AUTH_SECRET`
- `TURSO_DATABASE_URL` (`libsql://…`)
- `TURSO_AUTH_TOKEN`

```bash
npx vercel --prod
```

## Stack

Next.js App Router, Tailwind, libSQL, Vercel AI SDK, `@ai-sdk/xai`.
