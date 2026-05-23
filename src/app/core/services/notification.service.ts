import { Injectable, signal } from '@angular/core';
import { Observable, map, tap } from 'rxjs';
import { BehaviorSubject } from 'rxjs';
import { ApiService } from './api.service';
import { Notification, PagedResponse } from '../models';

@Injectable({ providedIn: 'root' })
export class NotificationService extends ApiService {
  private _unreadCount = new BehaviorSubject<number>(0);
  unreadCount$ = this._unreadCount.asObservable();
  unreadCountSignal = signal<number>(0);

  private _notifications = new BehaviorSubject<Notification[]>([]);
  notifications$ = this._notifications.asObservable();

  getNotifications(page = 0, size = 20): Observable<PagedResponse<Notification>> {
    return this.getPaged<Notification>('notifications', { page, size }).pipe(
      map(res => res.data),
      tap(paged => {
        if (page === 0) {
          this._notifications.next(paged.content);
        }
        const unread = paged.content.filter(n => !n.isRead).length;
        this.updateUnreadCount(unread);
      })
    );
  }

  markAsRead(id: string): Observable<Notification> {
    return this.patch<Notification>(`notifications/${id}/read`, {}).pipe(
      map(res => res.data),
      tap(() => {
        const current = this._notifications.getValue();
        const updated = current.map(n => n.id === id ? { ...n, isRead: true } : n);
        this._notifications.next(updated);
        const unread = updated.filter(n => !n.isRead).length;
        this.updateUnreadCount(unread);
      })
    );
  }

  markAllAsRead(): Observable<void> {
    return this.patch<void>('notifications/read-all', {}).pipe(
      map(res => res.data),
      tap(() => {
        const current = this._notifications.getValue();
        const updated = current.map(n => ({ ...n, isRead: true }));
        this._notifications.next(updated);
        this.updateUnreadCount(0);
      })
    );
  }

  getUnreadCount(): Observable<number> {
    return this.get<number>('notifications/unread-count').pipe(
      map(res => res.data),
      tap(count => this.updateUnreadCount(count))
    );
  }

  addNotification(notification: Notification): void {
    const current = this._notifications.getValue();
    this._notifications.next([notification, ...current]);
    const unread = this._unreadCount.getValue() + 1;
    this.updateUnreadCount(unread);
  }

  private updateUnreadCount(count: number): void {
    this._unreadCount.next(count);
    this.unreadCountSignal.set(count);
  }
}
