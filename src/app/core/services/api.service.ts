import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, PagedResponse, PaginationParams } from '../models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  protected readonly baseUrl = environment.apiUrl;

  constructor(protected http: HttpClient) {}

  get<T>(path: string, params?: Record<string, string | number | boolean>): Observable<ApiResponse<T>> {
    const httpParams = params ? this.buildParams(params) : undefined;
    return this.http.get<ApiResponse<T>>(`${this.baseUrl}/${path}`, { params: httpParams });
  }

  getPaged<T>(path: string, pagination?: PaginationParams, filters?: Record<string, string | number | boolean>): Observable<ApiResponse<PagedResponse<T>>> {
    let params: Record<string, string | number | boolean> = {};
    if (pagination) {
      params['page'] = pagination.page;
      params['size'] = pagination.size;
      if (pagination.sort) {
        params['sort'] = `${pagination.sort.field},${pagination.sort.direction}`;
      }
    }
    if (filters) {
      params = { ...params, ...filters };
    }
    return this.http.get<ApiResponse<PagedResponse<T>>>(`${this.baseUrl}/${path}`, {
      params: this.buildParams(params)
    });
  }

  post<T>(path: string, body: unknown): Observable<ApiResponse<T>> {
    return this.http.post<ApiResponse<T>>(`${this.baseUrl}/${path}`, body);
  }

  put<T>(path: string, body: unknown): Observable<ApiResponse<T>> {
    return this.http.put<ApiResponse<T>>(`${this.baseUrl}/${path}`, body);
  }

  patch<T>(path: string, body: unknown): Observable<ApiResponse<T>> {
    return this.http.patch<ApiResponse<T>>(`${this.baseUrl}/${path}`, body);
  }

  delete<T>(path: string): Observable<ApiResponse<T>> {
    return this.http.delete<ApiResponse<T>>(`${this.baseUrl}/${path}`);
  }

  private buildParams(params: Record<string, string | number | boolean>): HttpParams {
    let httpParams = new HttpParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        httpParams = httpParams.set(key, String(value));
      }
    });
    return httpParams;
  }
}
