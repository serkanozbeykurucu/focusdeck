# FocusDeck

FocusDeck is a thesis prototype web application that integrates the **Pomodoro Technique**, **LLM-generated flashcards** (Google Gemini 2.5 Flash), and the **SM-2 spaced repetition algorithm** for self-study. It supports the MA thesis *"An Integrated Web Application Combining Pomodoro Technique, Spaced Repetition, and LLM-Generated Practice Questions for Self-Study"* at Vizja University (supervisor: Dr. Marcin Kacprowicz).

## Prerequisites

- Node.js 20+
- Python 3.11+
- Docker Desktop (for Postgres 15 + Redis 7)
- A [Google AI Studio](https://aistudio.google.com/) Gemini API key



## Setup

```bash
# 1. Clone
git clone <repo-url> focusdeck
cd focusdeck

# 2. Start Postgres + Redis
docker compose up -d

# 3. API
cd api
cp .env.example .env   # fill GEMINI_API_KEY and JWT_SECRET
npm install
npx prisma migrate dev --name init
npm run seed           # optional: sample documents for prompt comparison
npm run dev            # http://localhost:3001

# 4. Web (new terminal)
cd web
cp .env.example .env
npm install
npm run dev            # http://localhost:5173
```

Open [http://localhost:5173](http://localhost:5173) and sign up.

## Simulation (RQ2)

Compares SM-2 vs a random baseline over 10 learners × 100 days × 100 cards.

```bash
cd simulation
python -m venv .venv
# Windows: .venv\Scripts\activate
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
python main.py         # writes CSVs to results/
python analyze.py      # charts + summary stats
```

Parameters live in `simulation/config.yaml` (seed fixed for reproducibility).

## Prompt comparison experiment

Chapter 4 of the thesis compares three generation strategies:


| Strategy    | File                            |
| ----------- | ------------------------------- |
| Zero-shot   | `api/src/prompts/zeroShot.ts`   |
| Few-shot    | `api/src/prompts/fewShot.ts`    |
| Bloom-based | `api/src/prompts/bloomBased.ts` |


1. Seed sample texts: `cd api && npm run seed`
2. Sign in, open Documents, generate flashcards with each strategy on the same document
3. Review quality / Bloom distribution offline for the experiment write-up

## Project layout

```
focusdeck/
├── web/           # React 18 + Vite + Tailwind + Zustand
├── api/           # Express + Prisma + Gemini + SM-2
├── simulation/    # Python RQ2 simulation
└── docker-compose.yml
```



## License

MIT