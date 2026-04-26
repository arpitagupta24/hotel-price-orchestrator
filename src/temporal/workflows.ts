import { log, proxyActivities } from '@temporalio/workflow';
import type { OrchestratedHotel, SupplierHotel } from '../types/hotel';
import type * as activities from './activities';

const {
  getHotelsFromSupplierA,
  getHotelsFromSupplierB,
  persistDedupedToRedis,
} = proxyActivities<typeof activities>({
  startToCloseTimeout: '30s',
  retry: {
    initialInterval: '500ms',
    maximumAttempts: 5,
    backoffCoefficient: 2,
  },
});

function normalizeName(name: string): string {
  return name.trim().toLowerCase();
}

function mergeBestOffers(listA: SupplierHotel[], listB: SupplierHotel[]): OrchestratedHotel[] {
  const best = new Map<string, OrchestratedHotel>();

  const consider = (h: SupplierHotel, supplier: OrchestratedHotel['supplier']) => {
    const key = normalizeName(h.name);
    const next: OrchestratedHotel = {
      name: h.name.trim(),
      price: h.price,
      supplier,
      commissionPct: h.commissionPct,
    };
    const prev = best.get(key);
    if (!prev || next.price < prev.price) {
      best.set(key, next);
    }
  };

  for (const h of listA) consider(h, 'Supplier A');
  for (const h of listB) consider(h, 'Supplier B');

  return Array.from(best.values()).sort((a, b) => a.name.localeCompare(b.name));
}

export async function hotelOrchestrationWorkflow(city: string): Promise<OrchestratedHotel[]> {
  log.info('Hotel orchestration started', { city });
  const [listA, listB] = await Promise.all([
    getHotelsFromSupplierA(city),
    getHotelsFromSupplierB(city),
  ]);
  log.info('Supplier fetches completed', {
    city,
    countA: listA.length,
    countB: listB.length,
  });
  const merged = mergeBestOffers(listA, listB);
  await persistDedupedToRedis(city, JSON.stringify(merged));
  log.info('Orchestration complete', { city, mergedCount: merged.length });
  return merged;
}
