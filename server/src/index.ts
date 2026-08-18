import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import authRoutes from './routes/auth.js';
import customerRoutes from './routes/customer.js';
import transferRoutes from './routes/transfers.js';
import loanRoutes from './routes/loans.js';
import cardRoutes from './routes/cards.js';
import supportRoutes from './routes/support.js';
import adminRoutes from './routes/admin.js';
import cryptoRoutes from './routes/crypto.js';
import { errorHandler } from './middleware/errorHandler.js';
import { initDefaultSettings, initAdminUser } from './services/settingsService.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

// ── DATABASE_URL ────────────────────────────────────────────────────────────
// __dirname at runtime = <deploy_root>/server/dist
// SQLite db lives at    <deploy_root>/server/prisma/dev.db
// => one level up from dist, then into prisma
if (!process.env.DATABASE_URL) {
  const dbPath = path.resolve(__dirname, '../prisma/dev.db');
  process.env.DATABASE_URL = `file:${dbPath}`;
  console.log('[NEXA] DATABASE_URL set to:', process.env.DATABASE_URL);
}

// ── MIDDLEWARE ───────────────────────────────────────────────────────────────
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ── API ROUTES ───────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/customer', customerRoutes);
app.use('/api/transfers', transferRoutes);
app.use('/api/loans', loanRoutes);
app.use('/api/cards', cardRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/crypto', cryptoRoutes);

// ── HEALTH CHECK (responds immediately — required for Railway) ───────────────
app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

app.use(errorHandler);

// ── SERVE REACT SPA ──────────────────────────────────────────────────────────
const clientDistPath = path.join(__dirname, '../../client/dist');
app.use(express.static(clientDistPath));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
    return next();
  }
  res.sendFile(path.join(clientDistPath, 'index.html'));
});

// ── START SERVER ─────────────────────────────────────────────────────────────
app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`[NEXA] Server listening on 0.0.0.0:${PORT}`);

  // Run DB schema push AFTER server is already accepting connections.
  // This prevents Railway health-check timeouts caused by a slow synchronous push.
  const schemaPath = path.resolve(__dirname, '../prisma/schema.prisma');
  exec(
    `npx prisma db push --schema="${schemaPath}" --accept-data-loss --skip-generate`,
    { env: { ...process.env } },
    (err, stdout, stderr) => {
      if (err) {
        console.error('[NEXA] Schema push failed (non-fatal):', stderr || err.message);
      } else {
        console.log('[NEXA] Database schema applied.');
      }

      // Init default settings & admin user once schema is ready
      Promise.all([initDefaultSettings(), initAdminUser()]).catch(e => {
        console.error('[NEXA] Init error:', e);
      });
    }
  );
});
