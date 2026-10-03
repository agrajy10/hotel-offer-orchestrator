import { env } from '../config/env';
import { saveOffers } from '../services/redis';
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

  const data = (await response.json()) as SupplierHotel[];

  if (!Array.isArray(data)) {
    throw new Error(`Supplier ${supplier} returned non-array payload`);
  }

  return data;
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
