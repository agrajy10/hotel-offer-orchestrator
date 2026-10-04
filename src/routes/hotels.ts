import { Client, Connection } from '@temporalio/client';
import { Router, type Request, type Response } from 'express';
import { hotelOffersWorkflow } from '../workflows/hotelOffers';
import { env } from '../config/env';
import { getCachedOffers, getOffersByPriceRange, hasCityCache } from '../services/redis';
import { hotelsQuerySchema } from './validators';
import type { BestOffer } from '../types/hotel';

const router = Router();

let temporalClient: Client | null = null;

const getTemporalClient = async (): Promise<Client> => {
  if (!temporalClient) {
    const connection = await Connection.connect({
      address: env.temporalAddress,
      tls: false,
    });
    temporalClient = new Client({
      connection,
      namespace: env.temporalNamespace,
    });
  }
  return temporalClient;
};

const runHotelOffersWorkflow = async (city: string): Promise<BestOffer[]> => {
  const client = await getTemporalClient();
  return client.workflow.execute(hotelOffersWorkflow, {
    workflowId: `hotels-${city.toLowerCase()}`,
    taskQueue: env.taskQueue,
    args: [city.toLowerCase()],
  });
};

router.get('/api/hotels', async (req: Request, res: Response): Promise<void> => {
  const parsed = hotelsQuerySchema.safeParse(req.query);

  if (!parsed.success) {
    res.status(400).json({
      error: 'VALIDATION_ERROR',
      message: parsed.error.issues[0]?.message ?? 'Invalid query',
      details: parsed.error.issues,
    });
    return;
  }

  const { city, minPrice, maxPrice } = parsed.data;
  const normalizedCity = city.toLowerCase();
  const isFiltered = minPrice !== undefined || maxPrice !== undefined;

  try {
    const cacheHit = await hasCityCache(normalizedCity);

    if (!cacheHit) {
      await runHotelOffersWorkflow(normalizedCity);
    }

    if (isFiltered) {
      const offers = await getOffersByPriceRange(normalizedCity, minPrice, maxPrice);
      res.json(offers);
      return;
    }

    const offers = await getCachedOffers(normalizedCity);
    res.json(offers);
  } catch (error) {
    console.error('Failed to fetch hotels:', error);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to fetch hotel offers',
    });
  }
});

export default router;
