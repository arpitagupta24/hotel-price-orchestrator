import { Router } from 'express';
import { redisPing } from '../redis/hotelStore';

const router = Router();

async function supplierPing(path: string, base: string): Promise<{ ok: boolean; latencyMs?: number }> {
  const url = `${base}${path}?city=delhi`;
  const start = Date.now();
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 3000);
  try {
    const res = await fetch(url, { signal: controller.signal });
    const ok = res.ok;
    return { ok, latencyMs: Date.now() - start };
  } catch {
    return { ok: false };
  } finally {
    clearTimeout(t);
  }
}

router.get('/health', async (_req, res) => {
  const base = (process.env.API_BASE_URL ?? `http://127.0.0.1:${process.env.PORT ?? 3000}`).replace(
    /\/$/,
    ''
  );
  const [redisOk, supplierA, supplierB] = await Promise.all([
    redisPing(),
    supplierPing('/supplierA/hotels', base),
    supplierPing('/supplierB/hotels', base),
  ]);

  const temporalAddress = process.env.TEMPORAL_ADDRESS ?? '127.0.0.1:7233';
  let temporalOk = false;
  try {
    const { Connection } = await import('@temporalio/client');
    const conn = await Connection.connect({ address: temporalAddress, connectTimeout: '2s' });
    temporalOk = true;
    conn.close();
  } catch {
    temporalOk = false;
  }

  const suppliersHealthy = supplierA.ok && supplierB.ok;
  const overall =
    redisOk && temporalOk && suppliersHealthy ? 'healthy' : 'degraded';

  res.status(overall === 'healthy' ? 200 : 503).json({
    status: overall,
    redis: redisOk ? 'up' : 'down',
    temporal: temporalOk ? 'up' : 'down',
    suppliers: {
      supplierA: supplierA.ok ? 'up' : 'down',
      supplierB: supplierB.ok ? 'up' : 'down',
      details: {
        supplierA,
        supplierB,
      },
    },
  });
});

export { router as healthRoutes };
