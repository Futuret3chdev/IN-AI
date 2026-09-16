# IN-AI

Part of the **$MT ECO SYSTEM**. Developed by **Futuret3ch**, **T3x** and **MemeTorrent**.

- Code: [github.com/Futuret3chdev/IN-AI](https://github.com/Futuret3chdev/IN-AI)
- Live: [in-ai-futuret3ch.vercel.app](https://in-ai-futuret3ch.vercel.app) · [adept-learning-agent.vercel.app](https://adept-learning-agent.vercel.app)
- Local: `E:\learning-agent`

A multi-user **learning agent** with Imagine, video, speech, and a public developer API. The model is SpaceXAI Grok (`grok-4.6`) via the xAI API.

## What it does

- **Work agent** — does the task, then saves skills and lessons
- **Tutor** — teaches in small steps, quizzes, tracks mastery, spaced repetition
- **Knowledge** — ingest notes/files, answer from your library
- **Research** — plan, live web search, save a sourced report
- **Memory** — facts, preferences, goals, and lessons that persist across sessions
- **Imagine** — generate and edit images (`grok-imagine-image-2.0`)
- **Video** — animate a still (`grok-imagine-video-1.5`)
- **Speech** — text to speech (`POST https://api.x.ai/v1/tts` with `voice_id` and `language`)
- **Developer API** — Bearer keys at `/developers`, REST under `/api/v1`

Nothing is mocked. Chat, Imagine, video, and speech fail with a real API error if `XAI_API_KEY` is missing.

## Developer API

Create a key in the app under **API**, then:

```bash
curl https://YOUR_HOST/api/v1/chat \
  -H "Authorization: Bearer inai_…" \
  -H "Content-Type: application/json" \
  -d '{"input":"Teach me Bayes theorem","mode":"tutor"}'

curl https://YOUR_HOST/api/v1/images \
  -H "Authorization: Bearer inai_…" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"a brass lamp on a dark desk","aspect_ratio":"16:9"}'
```

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/api/v1/chat` | Agent chat (`mode`: work, tutor, research, knowledge) |
| POST | `/api/v1/images` | Generate or edit an image (`image` = base64 to edit) |
| POST | `/api/v1/videos` | Image-to-video |
| POST | `/api/v1/speech` | Text to speech (`voice_id`, `language`) |
| GET | `/api/v1/media` | List generated media |
| GET/POST | `/api/v1/memories` | Memory |
| GET/POST | `/api/v1/knowledge` | Document library |
| GET/POST | `/api/v1/skills` | Learned skills |
| GET | `/api/v1/models` | Model list |

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

All local data is written on **E:** under `E:\learning-agent\data\`:

- `in-ai.db` — accounts, chats, memory, skills, tutor
- `media\` — generated images, video, speech files
- `knowledge\` — uploaded documents
- `notes\` — pasted notes

## Deploy (Vercel)

`in-ai.vercel.app` is not this project (that alias is already taken). Production is
[adept-learning-agent.vercel.app](https://adept-learning-agent.vercel.app) and
[in-ai-futuret3ch.vercel.app](https://in-ai-futuret3ch.vercel.app).

Serverless hosts cannot keep a local SQLite file. Accounts, memory, and media
**will not persist on Vercel** until you attach Turso and set:

- `XAI_API_KEY`
- `AUTH_SECRET`
- `TURSO_DATABASE_URL` (`libsql://…`)
- `TURSO_AUTH_TOKEN`

```bash
npx vercel --prod
```

## Stack

Next.js App Router, Tailwind, libSQL, Vercel AI SDK, `@ai-sdk/xai`.
