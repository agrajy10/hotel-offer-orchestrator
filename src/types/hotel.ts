import type { SupplierHotel } from '../routes/validators';

export type { SupplierHotel };

export interface BestOffer {
  name: string;
  price: number;
  supplier: string;
  commissionPct: number;
}

export interface HotelQuery {
  city: string;
  minPrice?: number;
  maxPrice?: number;
}
