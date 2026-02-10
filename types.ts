
export type UserRole = 'admin' | 'staff';

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  password?: string;
}

export interface Product {
  id: string;
  name: string;
  unit: string;
  unitPrice: number;
}

export interface DailyStockEntry {
  productId: string;
  section: 'gudang' | 'booth';
  openingStock?: number;
  stockIn: number;
  stockOut: number;
  description: string;
  lastModifiedBy?: string;
  lastModifiedAt?: string;
}

export interface DayData {
  day: number;
  entries: Record<string, DailyStockEntry>;
}

export interface InventoryState {
  month: number;
  year: number;
  products: Product[];
  days: Record<number, DayData>;
}

export interface CalculatedStock {
  productId: string;
  name: string;
  unit: string;
  section: 'gudang' | 'booth';
  initialStock: number;
  stockIn: number;
  stockOut: number;
  endStock: number;
  unitPrice: number;
  description: string;
  lastModifiedBy?: string;
  lastModifiedAt?: string;
}
