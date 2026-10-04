import { ApplicationFailure, proxyActivities } from '@temporalio/workflow';
import type * as activities from '../activities/fetchHotels';
import { dedupeByCheapest } from '../services/dedupe';
import type { BestOffer, SupplierHotel } from '../types/hotel';

const { fetchFromSupplierA, fetchFromSupplierB, saveOffersToRedis } =
  proxyActivities<typeof activities>({
    startToCloseTimeout: '30 seconds',
    retry: {
      maximumAttempts: 1,
    },
  });

const fulfilledHotels = (result: PromiseSettledResult<SupplierHotel[]>): SupplierHotel[] =>
  result.status === 'fulfilled' ? result.value : [];

export async function hotelOffersWorkflow(city: string): Promise<BestOffer[]> {
  const [resultA, resultB] = await Promise.allSettled([
    fetchFromSupplierA(city),
    fetchFromSupplierB(city),
  ]);

  if (resultA.status === 'rejected' && resultB.status === 'rejected') {
    throw ApplicationFailure.create({
      message: `Both suppliers failed for city=${city}`,
      type: 'SupplierUnavailable',
      nonRetryable: true,
    });
  }

  const offers = dedupeByCheapest(fulfilledHotels(resultA), fulfilledHotels(resultB));
  await saveOffersToRedis(city, offers);

  return offers;
}
