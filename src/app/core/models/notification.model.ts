export enum NotificationType {
  NEW_RESERVATION = 'NEW_RESERVATION',
  RESERVATION_CANCELLED = 'RESERVATION_CANCELLED',
  LOW_STOCK = 'LOW_STOCK',
  OUT_OF_STOCK = 'OUT_OF_STOCK',
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  ACCOUNT_VALIDATED = 'ACCOUNT_VALIDATED',
  SYSTEM = 'SYSTEM'
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
  readAt?: string;
  actionUrl?: string;
}

export interface NotificationPreferences {
  newReservations: boolean;
  lowStockAlerts: boolean;
  paymentAlerts: boolean;
  systemAlerts: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
}
