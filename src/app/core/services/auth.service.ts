import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User, UserRole, AuthResponse, LoginRequest, RefreshTokenRequest } from '../models';

const ACCESS_TOKEN_KEY = 'medoq_access_token';
const REFRESH_TOKEN_KEY = 'medoq_refresh_token';
const USER_KEY = 'medoq_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = `${environment.apiUrl}/auth`;

  private _currentUser = new BehaviorSubject<User | null>(this.loadStoredUser());
  public currentUser$ = this._currentUser.asObservable();

  // Angular signals
  currentUserSignal = signal<User | null>(this.loadStoredUser());
  isAuthenticatedSignal = computed(() => !!this.currentUserSignal());

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  login(phone: string, password: string): Observable<AuthResponse> {
    const payload: LoginRequest = { phone, password };
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, payload).pipe(
      tap(response => this.handleAuthSuccess(response)),
      catchError(err => throwError(() => err))
    );
  }

  refreshToken(): Observable<AuthResponse> {
    const token = this.getRefreshToken();
    if (!token) {
      this.logout();
      return throwError(() => new Error('No refresh token'));
    }
    const payload: RefreshTokenRequest = { refreshToken: token };
    return this.http.post<AuthResponse>(`${this.apiUrl}/refresh`, payload).pipe(
      tap(response => this.handleAuthSuccess(response)),
      catchError(err => {
        this.logout();
        return throwError(() => err);
      })
    );
  }

  logout(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this._currentUser.next(null);
    this.currentUserSignal.set(null);
    this.router.navigate(['/auth/login']);
  }

  isAuthenticated(): boolean {
    const token = this.getAccessToken();
    if (!token) return false;
    try {
      const payload = this.parseJwt(token);
      return payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  }

  getCurrentUser(): User | null {
    return this._currentUser.getValue();
  }

  getRole(): UserRole | null {
    return this.getCurrentUser()?.role ?? null;
  }

  hasRole(role: UserRole): boolean {
    return this.getRole() === role;
  }

  isAdmin(): boolean {
    return this.hasRole(UserRole.ADMIN);
  }

  getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  private handleAuthSuccess(response: AuthResponse): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, response.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, response.refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(response.user));
    this._currentUser.next(response.user);
    this.currentUserSignal.set(response.user);
  }

  private loadStoredUser(): User | null {
    try {
      const userStr = localStorage.getItem(USER_KEY);
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  }

  private parseJwt(token: string): { exp: number; sub: string; role: string } {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(window.atob(base64));
  }
}
