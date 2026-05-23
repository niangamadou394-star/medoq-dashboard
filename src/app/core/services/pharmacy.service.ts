import { Injectable, signal } from '@angular/core';
import { Observable, map, tap } from 'rxjs';
import { ApiService } from './api.service';
import { Pharmacy, PharmacyStock, UpdateStockRequest, NearbyPharmacy, PagedResponse } from '../models';

@Injectable({ providedIn: 'root' })
export class PharmacyService extends ApiService {
  currentPharmacy = signal<Pharmacy | null>(null);

  getMyPharmacy(): Observable<Pharmacy> {
    return this.get<Pharmacy>('pharmacies/my').pipe(
      map(res => res.data),
      tap(pharmacy => this.currentPharmacy.set(pharmacy))
    );
  }

  getById(id: string): Observable<Pharmacy> {
    return this.get<Pharmacy>(`pharmacies/${id}`).pipe(
      map(res => res.data)
    );
  }

  updatePharmacy(id: string, data: Partial<Pharmacy>): Observable<Pharmacy> {
    return this.put<Pharmacy>(`pharmacies/${id}`, data).pipe(
      map(res => res.data),
      tap(pharmacy => this.currentPharmacy.set(pharmacy))
    );
  }

  getMyStock(page = 0, size = 20, search?: string): Observable<PagedResponse<PharmacyStock>> {
    const params: Record<string, string | number> = { page, size };
    if (search) params['search'] = search;
    return this.getPaged<PharmacyStock>('pharmacies/my/stock', { page, size }, search ? { search } : {}).pipe(
      map(res => res.data)
    );
  }

  updateStock(stockId: string, update: UpdateStockRequest): Observable<PharmacyStock> {
    return this.put<PharmacyStock>(`pharmacies/my/stock/${stockId}`, update).pipe(
      map(res => res.data)
    );
  }

  addMedication(medicationId: string, data: UpdateStockRequest): Observable<PharmacyStock> {
    return this.post<PharmacyStock>('pharmacies/my/stock', { medicationId, ...data }).pipe(
      map(res => res.data)
    );
  }

  getNearby(lat: number, lng: number, radius = 5): Observable<NearbyPharmacy[]> {
    return this.get<NearbyPharmacy[]>('pharmacies/nearby', { lat, lng, radius }).pipe(
      map(res => res.data)
    );
  }

  getAllPharmacies(page = 0, size = 20): Observable<PagedResponse<Pharmacy>> {
    return this.getPaged<Pharmacy>('pharmacies', { page, size }).pipe(
      map(res => res.data)
    );
  }

  activatePharmacy(id: string): Observable<Pharmacy> {
    return this.patch<Pharmacy>(`pharmacies/${id}/activate`, {}).pipe(
      map(res => res.data)
    );
  }

  deactivatePharmacy(id: string): Observable<Pharmacy> {
    return this.patch<Pharmacy>(`pharmacies/${id}/deactivate`, {}).pipe(
      map(res => res.data)
    );
  }

  uploadLogo(id: string, file: File): Observable<{ logoUrl: string }> {
    const formData = new FormData();
    formData.append('logo', file);
    return this.http.post<{ logoUrl: string }>(`${this.baseUrl}/pharmacies/${id}/logo`, formData);
  }

  getDashboardStats(pharmacyId: string): Observable<DashboardStats> {
    return this.get<DashboardStats>(`pharmacies/${pharmacyId}/stats`).pipe(
      map(res => res.data)
    );
  }

  getStockAlerts(pharmacyId: string): Observable<PharmacyStock[]> {
    return this.get<PharmacyStock[]>(`pharmacies/${pharmacyId}/stock/alerts`).pipe(
      map(res => res.data)
    );
  }
}

export interface DashboardStats {
  reservationsToday: number;
  revenueToday: number;
  stockAlerts: number;
  averageRating: number;
  reservationsWeek: number;
  revenueWeek: number;
  completionRate: number;
}
