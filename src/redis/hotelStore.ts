import Redis from 'ioredis';

const DEDUPED_KEY = (city: string) => `hotel:orchestrator:${city.trim().toLowerCase()}`;

/** Lua: filter JSON array by price range entirely inside Redis (cjson). */
const FILTER_BY_PRICE_LUA = `
local raw = redis.call('GET', KEYS[1])
if raw == false then
  return nil
end
local data = cjson.decode(raw)
local minP = tonumber(ARGV[1])
local maxP = tonumber(ARGV[2])
local out = {}
for i = 1, #data do
  local h = data[i]
  local p = h.price
  if p >= minP and p <= maxP then
    out[#out + 1] = h
  end
end
return cjson.encode(out)
`;

let client: Redis | null = null;

export function getRedis(): Redis {
  if (!client) {
    const host = process.env.REDIS_HOST ?? '127.0.0.1';
    const port = Number(process.env.REDIS_PORT ?? 6379);
    client = new Redis({ host, port, maxRetriesPerRequest: null });
  }
  return client;
}

export async function saveDedupedHotels(city: string, payloadJson: string): Promise<void> {
  const r = getRedis();
  await r.set(DEDUPED_KEY(city), payloadJson);
}

export async function filterDedupedByPriceInRedis(
  city: string,
  minPrice: number,
  maxPrice: number
): Promise<string | null> {
  const r = getRedis();
  const key = DEDUPED_KEY(city);
  const exists = await r.exists(key);
  if (!exists) return null;
  const result = (await r.eval(FILTER_BY_PRICE_LUA, 1, key, minPrice, maxPrice)) as string | null;
  return result;
}

export async function redisPing(): Promise<boolean> {
  try {
    const r = getRedis();
    const pong = await r.ping();
    return pong === 'PONG';
  } catch {
    return false;
  }
}
