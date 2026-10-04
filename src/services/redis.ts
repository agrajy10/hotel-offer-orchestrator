import Redis from 'ioredis';
import { env } from '../config/env';
import type { BestOffer } from '../types/hotel';

let client: Redis | null = null;

export const getRedisClient = (): Redis => {
  if (!client) {
    client = new Redis(env.redisUrl, {
      maxRetriesPerRequest: 3,
      lazyConnect: false,
    });
  }
  return client;
};

export const pricesKey = (city: string): string => `hotels:${city.toLowerCase()}:prices`;
export const detailsKey = (city: string): string => `hotels:${city.toLowerCase()}:details`;
export const cachedKey = (city: string): string => `hotels:${city.toLowerCase()}:cached`;

export const saveOffers = async (city: string, offers: BestOffer[]): Promise<void> => {
  const redis = getRedisClient();
  const normalizedCity = city.toLowerCase();
  const pKey = pricesKey(normalizedCity);
  const dKey = detailsKey(normalizedCity);
  const cKey = cachedKey(normalizedCity);

  const pipeline = redis.pipeline();
  pipeline.del(pKey);
  pipeline.del(dKey);

  for (const offer of offers) {
    pipeline.zadd(pKey, offer.price, offer.name);
    pipeline.hset(dKey, offer.name, JSON.stringify(offer));
  }

  pipeline.set(cKey, '1');

  const results = await pipeline.exec();
  if (!results) {
    throw new Error(`Failed to write Redis pipeline for city=${normalizedCity}`);
  }

  for (const [err] of results) {
    if (err) {
      throw err;
    }
  }
};

export const hasCityCache = async (city: string): Promise<boolean> => {
  const redis = getRedisClient();
  const exists = await redis.exists(cachedKey(city));
  return exists === 1;
};

export const getCachedOffers = async (city: string): Promise<BestOffer[]> => {
  const redis = getRedisClient();
  const normalizedCity = city.toLowerCase();

  const names = await redis.zrange(pricesKey(normalizedCity), 0, -1);
  if (names.length === 0) {
    return [];
  }

  const values = await redis.hmget(detailsKey(normalizedCity), ...names);
  return values
    .filter((value): value is string => value !== null)
    .map((value) => JSON.parse(value) as BestOffer)
    .sort((a, b) => a.price - b.price);
};

export const getOffersByPriceRange = async (
  city: string,
  minPrice?: number,
  maxPrice?: number
): Promise<BestOffer[]> => {
  const redis = getRedisClient();
  const normalizedCity = city.toLowerCase();
  const min = minPrice ?? '-inf';
  const max = maxPrice ?? '+inf';

  const names = await redis.zrangebyscore(pricesKey(normalizedCity), min, max);
  if (names.length === 0) {
    return [];
  }

  const values = await redis.hmget(detailsKey(normalizedCity), ...names);
  return values
    .filter((value): value is string => value !== null)
    .map((value) => JSON.parse(value) as BestOffer)
    .sort((a, b) => a.price - b.price);
};
