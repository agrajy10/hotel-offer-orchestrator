import { env } from '../config/env';
import { saveOffers } from '../services/redis';
import { supplierHotelsResponseSchema } from '../routes/validators';
import type { BestOffer, SupplierHotel } from '../types/hotel';

const fetchSupplierHotels = async (
  supplier: 'A' | 'B',
  city: string
): Promise<SupplierHotel[]> => {
  const url = `${env.supplierBaseUrl}/supplier${supplier}/hotels?city=${encodeURIComponent(city)}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Supplier ${supplier} request failed with status ${response.status}`);
  }

  const json: unknown = await response.json();
  const parsed = supplierHotelsResponseSchema.safeParse(json);

  if (!parsed.success) {
    throw new Error(
      `Supplier ${supplier} returned invalid payload: ${JSON.stringify(parsed.error.issues)}`
    );
  }

  return parsed.data;
};

export const fetchFromSupplierA = async (city: string): Promise<SupplierHotel[]> => {
  return fetchSupplierHotels('A', city);
};

export const fetchFromSupplierB = async (city: string): Promise<SupplierHotel[]> => {
  return fetchSupplierHotels('B', city);
};

export interface SaveOffersResult {
  city: string;
  saved: number;
}

export const saveOffersToRedis = async (
  city: string,
  offers: BestOffer[]
): Promise<SaveOffersResult> => {
  await saveOffers(city, offers);
  return { city: city.toLowerCase(), saved: offers.length };
};
