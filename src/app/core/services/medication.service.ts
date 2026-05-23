import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from './api.service';
import { Medication, MedicationSearchResult, MedicationCategory } from '../models';

@Injectable({ providedIn: 'root' })
export class MedicationService extends ApiService {

  search(query: string, category?: string): Observable<MedicationSearchResult[]> {
    const params: Record<string, string> = { q: query };
    if (category) params['category'] = category;
    return this.get<MedicationSearchResult[]>('medications/search', params).pipe(
      map(res => res.data)
    );
  }

  getById(id: string): Observable<Medication> {
    return this.get<Medication>(`medications/${id}`).pipe(
      map(res => res.data)
    );
  }

  getPopular(limit = 10): Observable<MedicationSearchResult[]> {
    return this.get<MedicationSearchResult[]>('medications/popular', { limit }).pipe(
      map(res => res.data)
    );
  }

  getCategories(): Observable<MedicationCategory[]> {
    return this.get<MedicationCategory[]>('medications/categories').pipe(
      map(res => res.data)
    );
  }
}
