# NEXA Microfinance Bank

Full-stack digital banking platform with a React customer/admin frontend and an Express + Prisma + SQLite backend.

## Quick start

```bash
npm install
cd server && npx prisma generate && npx prisma db push && npm run db:seed && cd ..
npm run dev
```

- Customer app: http://localhost:5173
- API: http://localhost:3001

## Administrator

Set in `.env` / `server/.env` (defaults):

- Email: `admin@nexa.com`
- Password: `NexaAdmin2026!`

Change these before any production use.

## Architecture

- **Frontend** (`client/`): React, Vite, React Router. All balances and records come from the API.
- **Backend** (`server/`): Express, JWT httpOnly cookies, bcrypt, Prisma.
- **Database**: SQLite at `server/prisma/dev.db` (switch `DATABASE_URL` to PostgreSQL for production).
- Financial changes go through `LedgerService` inside Prisma `$transaction()` so NEXA-to-NEXA transfers are atomic.

## Useful scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Start API + Vite together |
| `npm run db:seed` | Create the administrator account |
| `npm run db:clean` | Remove all customer/financial records; keep admin |

External-bank transfers stay in a pending review workflow until a legitimate provider is connected. Do not treat “Completed” as real-world settlement unless an authorized administrator confirms it.
