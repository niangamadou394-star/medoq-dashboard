export enum PaymentMethod {
  CASH = 'CASH',
  WAVE = 'WAVE',
  ORANGE_MONEY = 'ORANGE_MONEY',
  FREE_MONEY = 'FREE_MONEY',
  CARD = 'CARD'
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED'
}

export interface Payment {
  id: string;
  reservationId: string;
  reservationRef: string;
  pharmacyId: string;
  pharmacyName: string;
  patientId: string;
  patientName: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  transactionId?: string;
  processedAt?: string;
  createdAt: string;
  updatedAt: string;
  commissionAmount: number;
  netAmount: number;
}

export interface PaymentSummary {
  totalRevenue: number;
  totalCommission: number;
  netRevenue: number;
  transactionCount: number;
  period: string;
}
