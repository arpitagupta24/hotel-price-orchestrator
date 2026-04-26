import * as activity from '@temporalio/activity';
import type { SupplierHotel } from '../types/hotel';
import { saveDedupedHotels } from '../redis/hotelStore';

function apiBase(): string {
  return (process.env.API_BASE_URL ?? 'http://127.0.0.1:3001').replace(/\/$/, '');
}

async function fetchSupplier(path: string, city: string): Promise<SupplierHotel[]> {
  const url = `${apiBase()}${path}?city=${encodeURIComponent(city)}`;
  activity.log.info('Fetching supplier', { url });
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 15_000);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} from ${path}`);
    }
    return (await res.json()) as SupplierHotel[];
  } finally {
    clearTimeout(t);
  }
}

export async function getHotelsFromSupplierA(city: string): Promise<SupplierHotel[]> {
  return fetchSupplier('/supplierA/hotels', city);
}

export async function getHotelsFromSupplierB(city: string): Promise<SupplierHotel[]> {
  return fetchSupplier('/supplierB/hotels', city);
}

export async function persistDedupedToRedis(city: string, jsonPayload: string): Promise<void> {
  activity.log.info('Saving deduplicated hotels to Redis', { city });
  await saveDedupedHotels(city, jsonPayload);
}
