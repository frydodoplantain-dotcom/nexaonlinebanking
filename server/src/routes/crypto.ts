import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireActiveCustomer } from '../middleware/auth.js';
import { prisma } from '../lib/prisma.js';
import { notifyAdmins } from '../services/notificationService.js';

const router = Router();
let cache: { data: unknown; ts: number } | null = null;
const CACHE_MS = 60_000;

const FALLBACK_CRYPTO_MARKET = [
  {
    id: 'bitcoin',
    symbol: 'btc',
    name: 'Bitcoin',
    image: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png',
    current_price: 66432.50,
    price_change_percentage_24h: 2.35,
    sparkline_in_7d: { price: [65000, 65200, 65800, 65400, 66100, 66300, 66432.5] }
  },
  {
    id: 'ethereum',
    symbol: 'eth',
    name: 'Ethereum',
    image: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png',
    current_price: 3274.25,
    price_change_percentage_24h: 1.85,
    sparkline_in_7d: { price: [3200, 3210, 3240, 3220, 3250, 3265, 3274.25] }
  },
  {
    id: 'tether',
    symbol: 'usdt',
    name: 'Tether',
    image: 'https://assets.coingecko.com/coins/images/325/large/Tether.png',
    current_price: 1.00,
    price_change_percentage_24h: 0.01,
    sparkline_in_7d: { price: [1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00] }
  },
  {
    id: 'binancecoin',
    symbol: 'bnb',
    name: 'BNB',
    image: 'https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png',
    current_price: 586.75,
    price_change_percentage_24h: -1.25,
    sparkline_in_7d: { price: [595, 592, 590, 588, 589, 587, 586.75] }
  },
  {
    id: 'solana',
    symbol: 'sol',
    name: 'Solana',
    image: 'https://assets.coingecko.com/coins/images/4128/large/solana.png',
    current_price: 164.85,
    price_change_percentage_24h: 2.15,
    sparkline_in_7d: { price: [160, 161, 163, 162, 164, 164.2, 164.85] }
  }
];

router.get('/market', async (_req, res) => {
  try {
    if (cache && Date.now() - cache.ts < CACHE_MS) return res.json(cache.data);

    const ids = 'bitcoin,ethereum,tether,binancecoin,solana';
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}&sparkline=true&price_change_percentage=24h`,
      { signal: controller.signal }
    ).finally(() => clearTimeout(timeout));

    if (!response.ok) throw new Error('Market API error');
    const data = await response.json();
    cache = { data, ts: Date.now() };
    return res.json(data);
  } catch (e) {
    return res.json(FALLBACK_CRYPTO_MARKET);
  }
});

router.get('/assets', async (_req, res, next) => {
  try {
    const assets = await prisma.cryptoAsset.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { symbol: 'asc' },
    });
    res.json(assets);
  } catch (e) {
    next(e);
  }
});

router.get('/deposits', requireAuth, requireActiveCustomer, async (req, res, next) => {
  try {
    const deposits = await prisma.cryptoDeposit.findMany({
      where: { userId: req.auth!.userId },
      include: { asset: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(deposits);
  } catch (e) {
    next(e);
  }
});

router.post('/deposit-request', requireAuth, requireActiveCustomer, async (req, res, next) => {
  try {
    const data = z.object({
      assetId: z.string(),
      amount: z.number().positive(),
      txHash: z.string().optional(),
    }).parse(req.body);

    const asset = await prisma.cryptoAsset.findUnique({ where: { id: data.assetId } });
    if (!asset || asset.status !== 'ACTIVE') {
      return res.status(400).json({ error: 'Selected asset is not available for deposit' });
    }

    const deposit = await prisma.cryptoDeposit.create({
      data: {
        userId: req.auth!.userId,
        assetId: data.assetId,
        amount: data.amount,
        txHash: data.txHash,
        status: 'PENDING',
      },
      include: { asset: true },
    });

    await notifyAdmins(
      'New Crypto Deposit Request',
      `Customer submitted deposit of ${data.amount} ${asset.symbol.toUpperCase()}`,
      'SYSTEM',
      deposit.id
    );

    res.status(201).json(deposit);
  } catch (e) {
    next(e);
  }
});

export default router;

