import { Component, OnInit, OnDestroy, signal, computed, HostListener } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../.././../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { PharmacyService } from '../../../core/services/pharmacy.service';
import { WebSocketService } from '../../../core/services/websocket.service';
import { NotificationPanelComponent } from '../notification-panel/notification-panel.component';
import { UserRole, User, Pharmacy } from '../../../core/models';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  roles?: UserRole[];
  badge?: number;
}

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatBadgeModule,
    MatMenuModule,
    MatTooltipModule,
    NotificationPanelComponent
  ],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss'
})
export class LayoutComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  sidebarOpen = signal(true);
  notificationPanelOpen = signal(false);
  currentUser = signal<User | null>(null);
  currentPharmacy = signal<Pharmacy | null>(null);
  unreadCount = signal(0);
  isMobile = signal(false);

  navItems: NavItem[] = [
    { label: 'Tableau de bord', icon: 'dashboard', route: '/dashboard' },
    { label: 'Stock', icon: 'inventory_2', route: '/stock' },
    { label: 'Réservations', icon: 'receipt_long', route: '/reservations' },
    { label: 'Analytiques', icon: 'bar_chart', route: '/analytics' },
    { label: 'Profil', icon: 'store', route: '/profile' },
    { label: 'Administration', icon: 'admin_panel_settings', route: '/admin', roles: [UserRole.ADMIN] }
  ];

  visibleNavItems = computed(() => {
    const user = this.currentUser();
    if (!user) return this.navItems.filter(item => !item.roles);
    return this.navItems.filter(item => !item.roles || item.roles.includes(user.role));
  });

  constructor(
    private authService: AuthService,
    private notificationService: NotificationService,
    private pharmacyService: PharmacyService,
    private wsService: WebSocketService
  ) {}

  ngOnInit(): void {
    this.checkScreenSize();

    this.authService.currentUser$.pipe(takeUntil(this.destroy$)).subscribe(user => {
      this.currentUser.set(user);
    });

    this.notificationService.unreadCount$.pipe(takeUntil(this.destroy$)).subscribe(count => {
      this.unreadCount.set(count);
    });

    this.pharmacyService.getMyPharmacy().pipe(takeUntil(this.destroy$)).subscribe(pharmacy => {
      this.currentPharmacy.set(pharmacy);
      this.wsService.connect(pharmacy.id);
    });

    this.notificationService.getUnreadCount().pipe(takeUntil(this.destroy$)).subscribe();

    // Load initial notifications
    this.notificationService.getNotifications().pipe(takeUntil(this.destroy$)).subscribe();
  }

  @HostListener('window:resize')
  onResize(): void {
    this.checkScreenSize();
  }

  private checkScreenSize(): void {
    const mobile = window.innerWidth < 768;
    this.isMobile.set(mobile);
    if (mobile) {
      this.sidebarOpen.set(false);
    } else {
      this.sidebarOpen.set(true);
    }
  }

  toggleSidebar(): void {
    this.sidebarOpen.update(v => !v);
  }

  toggleNotificationPanel(): void {
    this.notificationPanelOpen.update(v => !v);
  }

  closeNotificationPanel(): void {
    this.notificationPanelOpen.set(false);
  }

  closeSidebarOnMobile(): void {
    if (this.isMobile()) {
      this.sidebarOpen.set(false);
    }
  }

  logout(): void {
    this.wsService.disconnect();
    this.authService.logout();
  }

  getUserInitials(): string {
    const user = this.currentUser();
    if (!user) return '?';
    return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
