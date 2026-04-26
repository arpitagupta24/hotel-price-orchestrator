export interface SupplierHotel {
  hotelId: string;
  name: string;
  price: number;
  city: string;
  commissionPct: number;
}

export interface OrchestratedHotel {
  name: string;
  price: number;
  supplier: 'Supplier A' | 'Supplier B';
  commissionPct: number;
}
