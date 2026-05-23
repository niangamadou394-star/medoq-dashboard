export enum StockStatus {
  AVAILABLE = 'AVAILABLE',
  LIMITED = 'LIMITED',
  OUT_OF_STOCK = 'OUT_OF_STOCK'
}

export interface PharmacyHours {
  day: string;
  dayLabel: string;
  open: boolean;
  openTime: string;
  closeTime: string;
}

export interface PharmacyLocation {
  latitude: number;
  longitude: number;
  address: string;
  city: string;
  region: string;
}

export interface Pharmacy {
  id: string;
  name: string;
  licenseNumber: string;
  phone: string;
  email?: string;
  description?: string;
  logoUrl?: string;
  location: PharmacyLocation;
  openingHours: PharmacyHours[];
  ownerId: string;
  isActive: boolean;
  isVerified: boolean;
  rating: number;
  ratingCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PharmacyStock {
  id: string;
  pharmacyId: string;
  medicationId: string;
  medicationName: string;
  medicationDci?: string;
  category?: string;
  quantity: number;
  threshold: number;
  price: number;
  status: StockStatus;
  lastUpdated: string;
  expiryDate?: string;
}

export interface UpdateStockRequest {
  quantity: number;
  threshold: number;
  price: number;
}

export interface NearbyPharmacy extends Pharmacy {
  distance: number;
  distanceUnit: string;
}
