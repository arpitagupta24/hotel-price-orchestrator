import type { SupplierHotel } from '../types/hotel';

/** Overlapping names between A and B for Delhi; prices differ for merge tests. */
export const SUPPLIER_A_HOTELS: SupplierHotel[] = [
  {
    hotelId: 'a1',
    name: 'Holtin',
    price: 6000,
    city: 'delhi',
    commissionPct: 10,
  },
  {
    hotelId: 'a2',
    name: 'Radison',
    price: 6200,
    city: 'delhi',
    commissionPct: 13,
  },
  {
    hotelId: 'a3',
    name: 'Grand Plaza',
    price: 4500,
    city: 'delhi',
    commissionPct: 8,
  },
  {
    hotelId: 'a4',
    name: 'Sea View Only A',
    price: 8000,
    city: 'delhi',
    commissionPct: 15,
  },
];

export const SUPPLIER_B_HOTELS: SupplierHotel[] = [
  {
    hotelId: 'b1',
    name: 'Holtin',
    price: 5340,
    city: 'delhi',
    commissionPct: 20,
  },
  {
    hotelId: 'b2',
    name: 'Radison',
    price: 5900,
    city: 'delhi',
    commissionPct: 12,
  },
  {
    hotelId: 'b3',
    name: 'Grand Plaza',
    price: 5200,
    city: 'delhi',
    commissionPct: 9,
  },
  {
    hotelId: 'b4',
    name: 'Riverside Only B',
    price: 4100,
    city: 'delhi',
    commissionPct: 11,
  },
];

export function filterByCity(hotels: SupplierHotel[], city: string): SupplierHotel[] {
  const c = city.trim().toLowerCase();
  return hotels.filter((h) => h.city.toLowerCase() === c);
}
