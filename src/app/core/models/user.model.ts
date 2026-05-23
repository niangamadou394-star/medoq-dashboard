export enum UserRole {
  ADMIN = 'ADMIN',
  PHARMACY_STAFF = 'PHARMACY_STAFF',
  PHARMACY_OWNER = 'PHARMACY_OWNER',
  PATIENT = 'PATIENT'
}

export interface User {
  id: string;
  phone: string;
  email?: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  avatarUrl?: string;
  pharmacyId?: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: User;
}

export interface LoginRequest {
  phone: string;
  password: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}
