import type { SupplierHotel } from '../routes/validators';

export const supplierAHotels: SupplierHotel[] = [
  { hotelId: 'a1', name: 'Holtin', price: 6000, city: 'delhi', commissionPct: 10 },
  { hotelId: 'a2', name: 'Radison', price: 5900, city: 'delhi', commissionPct: 13 },
  { hotelId: 'a3', name: 'Taj Palace', price: 12000, city: 'delhi', commissionPct: 15 },
  { hotelId: 'a4', name: 'Leela Grand', price: 9500, city: 'delhi', commissionPct: 12 },
  { hotelId: 'a5', name: 'Oberoi', price: 14500, city: 'delhi', commissionPct: 16 },
  { hotelId: 'a6', name: 'Hyatt Regency', price: 8200, city: 'delhi', commissionPct: 11 },
  { hotelId: 'a7', name: 'Sheraton', price: 7100, city: 'delhi', commissionPct: 12 },
  { hotelId: 'a8', name: 'Jaypee Vasant Continental', price: 6800, city: 'delhi', commissionPct: 9 },
  { hotelId: 'a9', name: 'The Claridges', price: 10200, city: 'delhi', commissionPct: 14 },
  { hotelId: 'a10', name: 'Shangri-La', price: 13800, city: 'delhi', commissionPct: 17 },
  { hotelId: 'a11', name: 'Hilton Garden Inn', price: 6400, city: 'delhi', commissionPct: 10 },
  { hotelId: 'a12', name: 'Crowne Plaza', price: 8900, city: 'delhi', commissionPct: 12 },
];

export const supplierBHotels: SupplierHotel[] = [
  { hotelId: 'b1', name: 'Holtin', price: 5340, city: 'delhi', commissionPct: 20 },
  { hotelId: 'b2', name: 'Radison', price: 7200, city: 'delhi', commissionPct: 18 },
  { hotelId: 'b3', name: 'ITC Maurya', price: 11000, city: 'delhi', commissionPct: 14 },
  { hotelId: 'b4', name: 'Novotel', price: 7800, city: 'delhi', commissionPct: 11 },
  { hotelId: 'b5', name: 'JW Marriott', price: 15200, city: 'delhi', commissionPct: 18 },
  { hotelId: 'b6', name: 'Le Méridien', price: 9100, city: 'delhi', commissionPct: 13 },
  { hotelId: 'b7', name: 'Taj Vivanta', price: 8600, city: 'delhi', commissionPct: 12 },
  { hotelId: 'b8', name: 'Holiday Inn', price: 5900, city: 'delhi', commissionPct: 10 },
  { hotelId: 'b9', name: 'Pullman', price: 7400, city: 'delhi', commissionPct: 11 },
  { hotelId: 'b10', name: 'The Oberoi New Delhi', price: 16800, city: 'delhi', commissionPct: 19 },
  { hotelId: 'b11', name: 'Fairfield by Marriott', price: 5200, city: 'delhi', commissionPct: 9 },
  { hotelId: 'b12', name: 'Hilton New Delhi', price: 9800, city: 'delhi', commissionPct: 13 },
];

export const getSupplierHotels = (
  hotels: SupplierHotel[],
  city: string
): SupplierHotel[] => hotels.filter((hotel) => hotel.city === city.toLowerCase());
