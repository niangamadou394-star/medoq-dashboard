import { Component, OnInit, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { NotificationService } from '../../../core/services/notification.service';
import { Notification } from '../../../core/models';

@Component({
  selector: 'app-notification-panel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="notif-panel">
      <div class="notif-header">
        <h3>Notifications</h3>
        <button class="close-btn" (click)="close.emit()">✕</button>
      </div>
      <div class="notif-list">
        @if (notifications().length === 0) {
          <div class="notif-empty">
            <span>🔔</span>
            <p>Aucune notification</p>
          </div>
        }
        @for (n of notifications(); track n.id) {
          <div class="notif-item" [class.unread]="!n.isRead" (click)="markRead(n)">
            <div class="notif-icon">{{ getIcon(n.type) }}</div>
            <div class="notif-body">
              <p class="notif-title">{{ n.title }}</p>
              <p class="notif-msg">{{ n.message }}</p>
              <span class="notif-time">{{ formatTime(n.createdAt) }}</span>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .notif-panel { background:#fff; border-radius:12px; box-shadow:0 8px 32px rgba(0,0,0,.12); width:340px; max-height:480px; display:flex; flex-direction:column; overflow:hidden; }
    .notif-header { display:flex; align-items:center; justify-content:space-between; padding:16px 20px; border-bottom:1px solid #f0f0f0; }
    .notif-header h3 { margin:0; font-size:16px; font-weight:600; }
    .close-btn { background:none; border:none; cursor:pointer; font-size:18px; color:#666; padding:4px; }
    .notif-list { overflow-y:auto; flex:1; }
    .notif-empty { display:flex; flex-direction:column; align-items:center; padding:40px 20px; color:#aaa; }
    .notif-empty span { font-size:32px; margin-bottom:8px; }
    .notif-item { display:flex; gap:12px; padding:14px 20px; border-bottom:1px solid #f5f5f5; cursor:pointer; transition:background .15s; }
    .notif-item:hover { background:#f9f9f9; }
    .notif-item.unread { background:#f0f7ff; }
    .notif-icon { font-size:20px; flex-shrink:0; margin-top:2px; }
    .notif-title { margin:0 0 2px; font-size:13px; font-weight:600; color:#1a1a2e; }
    .notif-msg { margin:0 0 4px; font-size:12px; color:#666; line-height:1.4; }
    .notif-time { font-size:11px; color:#aaa; }
  `]
})
export class NotificationPanelComponent implements OnInit {
  @Output() close = new EventEmitter<void>();

  private destroy$ = new Subject<void>();
  notifications = signal<Notification[]>([]);

  constructor(private notifService: NotificationService) {}

  ngOnInit(): void {
    this.notifService.notifications$.pipe(takeUntil(this.destroy$)).subscribe(notifs => {
      this.notifications.set(notifs);
    });
    this.notifService.getNotifications().pipe(takeUntil(this.destroy$)).subscribe();
  }

  markRead(n: Notification): void {
    if (!n.isRead) {
      this.notifService.markAsRead(n.id).subscribe();
    }
  }

  getIcon(type: string): string {
    const icons: Record<string, string> = {
      RESERVATION: '📋', STOCK_ALERT: '⚠️', PAYMENT: '💳', SYSTEM: '🔔'
    };
    return icons[type] ?? '🔔';
  }

  formatTime(iso: string): string {
    const d = new Date(iso);
    const diff = (Date.now() - d.getTime()) / 1000;
    if (diff < 60) return 'À l\'instant';
    if (diff < 3600) return `Il y a ${Math.floor(diff/60)} min`;
    if (diff < 86400) return `Il y a ${Math.floor(diff/3600)}h`;
    return d.toLocaleDateString('fr-FR');
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }
}
