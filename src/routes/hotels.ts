import { Router } from 'express';
import { runHotelOrchestration } from '../temporal/client';
import { filterDedupedByPriceInRedis } from '../redis/hotelStore';

const router = Router();

function parsePriceParam(v: unknown, fallback: number): number {
  if (typeof v !== 'string' || v.trim() === '') return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

router.get('/api/hotels', async (req, res) => {
  const city = typeof req.query.city === 'string' ? req.query.city : '';
  if (!city.trim()) {
    res.status(400).json({ error: 'Missing required query: city' });
    return;
  }

  const minQ = req.query.minPrice;
  const maxQ = req.query.maxPrice;
  const hasMin = typeof minQ === 'string' && minQ.trim() !== '';
  const hasMax = typeof maxQ === 'string' && maxQ.trim() !== '';

  try {
    if (hasMin || hasMax) {
      const minPrice = parsePriceParam(minQ, 0);
      const maxPrice = parsePriceParam(maxQ, Number.MAX_SAFE_INTEGER);
      if (hasMin && hasMax && minPrice > maxPrice) {
        res.status(400).json({ error: 'minPrice cannot be greater than maxPrice' });
        return;
      }
      let filtered = await filterDedupedByPriceInRedis(city, minPrice, maxPrice);
      console.log('filtered', filtered);
      if (filtered === null) {
        await runHotelOrchestration(city);
        filtered = await filterDedupedByPriceInRedis(city, minPrice, maxPrice);
      }
      if (filtered === null) {
        res.status(503).json({ error: 'Could not load hotels from cache; retry shortly.' });
        return;
      }
      res.json(JSON.parse(filtered) as unknown);
      return;
    }

    const hotels = await runHotelOrchestration(city);
    res.json(hotels);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    res.status(502).json({ error: 'Orchestration failed', detail: message });
  }
});

export { router as hotelRoutes };
