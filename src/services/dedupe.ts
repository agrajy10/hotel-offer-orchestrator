import type { BestOffer, SupplierHotel } from '../types/hotel';

/**
 * Dedupe supplier hotels by name, keeping the cheapest price.
 * Tie-break: first supplier in the input list wins.
 */
export const dedupeByCheapest = (
  supplierA: SupplierHotel[],
  supplierB: SupplierHotel[],
  supplierAName = 'Supplier A',
  supplierBName = 'Supplier B'
): BestOffer[] => {
  const bestByName = new Map<string, BestOffer>();

  const consider = (hotel: SupplierHotel, supplier: string): void => {
    const existing = bestByName.get(hotel.name);
    if (!existing || hotel.price < existing.price) {
      bestByName.set(hotel.name, {
        name: hotel.name,
        price: hotel.price,
        supplier,
        commissionPct: hotel.commissionPct,
      });
    }
  };

  for (const hotel of supplierA) {
    consider(hotel, supplierAName);
  }
  for (const hotel of supplierB) {
    consider(hotel, supplierBName);
  }

  return [...bestByName.values()].sort((a, b) => a.price - b.price);
};
