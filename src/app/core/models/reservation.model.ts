export enum ReservationStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  READY = 'READY',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED'
}

export interface ReservationItem {
  medicationId: string;
  medicationName: string;
  medicationDci?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Reservation {
  id: string;
  reference: string;
  pharmacyId: string;
  pharmacyName?: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  items: ReservationItem[];
  totalAmount: number;
  status: ReservationStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
  confirmedAt?: string;
  readyAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
}

export interface ReservationSummary {
  id: string;
  reference: string;
  patientName: string;
  patientPhone: string;
  medicationSummary: string;
  totalAmount: number;
  status: ReservationStatus;
  createdAt: string;
  expiresAt: string;
  itemCount: number;
}
