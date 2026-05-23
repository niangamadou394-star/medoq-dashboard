import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from './api.service';
import { Reservation, ReservationSummary, ReservationStatus, PagedResponse } from '../models';

export interface ReservationFilter {
  status?: ReservationStatus;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

@Injectable({ providedIn: 'root' })
export class ReservationService extends ApiService {

  getMyPharmacyReservations(
    page = 0,
    size = 20,
    filter?: ReservationFilter
  ): Observable<PagedResponse<ReservationSummary>> {
    const params: Record<string, string | number> = { page, size };
    if (filter?.status) params['status'] = filter.status;
    if (filter?.dateFrom) params['dateFrom'] = filter.dateFrom;
    if (filter?.dateTo) params['dateTo'] = filter.dateTo;
    if (filter?.search) params['search'] = filter.search;
    return this.getPaged<ReservationSummary>('reservations/pharmacy', { page, size }, params).pipe(
      map(res => res.data)
    );
  }

  getById(id: string): Observable<Reservation> {
    return this.get<Reservation>(`reservations/${id}`).pipe(
      map(res => res.data)
    );
  }

  confirm(id: string): Observable<Reservation> {
    return this.patch<Reservation>(`reservations/${id}/confirm`, {}).pipe(
      map(res => res.data)
    );
  }

  cancel(id: string, reason?: string): Observable<Reservation> {
    return this.patch<Reservation>(`reservations/${id}/cancel`, { reason }).pipe(
      map(res => res.data)
    );
  }

  markReady(id: string): Observable<Reservation> {
    return this.patch<Reservation>(`reservations/${id}/ready`, {}).pipe(
      map(res => res.data)
    );
  }

  complete(id: string): Observable<Reservation> {
    return this.patch<Reservation>(`reservations/${id}/complete`, {}).pipe(
      map(res => res.data)
    );
  }

  getAnalytics(period: string): Observable<ReservationAnalytics> {
    return this.get<ReservationAnalytics>('reservations/pharmacy/analytics', { period }).pipe(
      map(res => res.data)
    );
  }

  exportCsv(filter?: ReservationFilter): Observable<Blob> {
    const params: Record<string, string> = {};
    if (filter?.status) params['status'] = filter.status;
    if (filter?.dateFrom) params['dateFrom'] = filter.dateFrom;
    if (filter?.dateTo) params['dateTo'] = filter.dateTo;
    return this.http.get(`${this.baseUrl}/reservations/pharmacy/export`, {
      params,
      responseType: 'blob'
    });
  }
}

export interface ReservationAnalytics {
  period: string;
  totalReservations: number;
  completedReservations: number;
  cancelledReservations: number;
  totalRevenue: number;
  completionRate: number;
  averageRating: number;
  dailyData: { date: string; count: number; revenue: number }[];
  topMedications: { medicationName: string; count: number }[];
  statusDistribution: { status: string; count: number; percentage: number }[];
  hourlyDistribution: { hour: number; count: number }[];
  paymentMethodDistribution: { method: string; count: number; amount: number }[];
}
