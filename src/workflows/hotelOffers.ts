import { proxyActivities } from '@temporalio/workflow';
import type * as activities from '../activities/fetchHotels';
import { dedupeByCheapest } from '../services/dedupe';
import type { BestOffer } from '../types/hotel';

const { fetchFromSupplierA, fetchFromSupplierB, saveOffersToRedis } =
  proxyActivities<typeof activities>({
    startToCloseTimeout: '30 seconds',
  });

export async function hotelOffersWorkflow(city: string): Promise<BestOffer[]> {
  const [supplierA, supplierB] = await Promise.all([
    fetchFromSupplierA(city),
    fetchFromSupplierB(city),
  ]);

  const offers = dedupeByCheapest(supplierA, supplierB);
  await saveOffersToRedis(city, offers);

  return offers;
}
