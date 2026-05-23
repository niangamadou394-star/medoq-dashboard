import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { PharmacyService } from '../../core/services/pharmacy.service';
import { ReservationService } from '../../core/services/reservation.service';
import { ReservationStatus, ReservationSummary, PharmacyStock, StockStatus } from '../../core/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="dashboard">
      <div class="page-header">
        <div>
          <h2>Tableau de bord</h2>
          <p class="subtitle">{{ today() }}</p>
        </div>
        <button class="btn-refresh" (click)="load()">🔄 Actualiser</button>
      </div>

      <!-- KPI cards -->
      <div class="kpi-grid">
        <div class="kpi-card blue">
          <div class="kpi-icon">📋</div>
          <div class="kpi-body">
            <span class="kpi-val">{{ stats().pending }}</span>
            <span class="kpi-label">En attente</span>
          </div>
        </div>
        <div class="kpi-card green">
          <div class="kpi-icon">✅</div>
          <div class="kpi-body">
            <span class="kpi-val">{{ stats().confirmed }}</span>
            <span class="kpi-label">Confirmées</span>
          </div>
        </div>
        <div class="kpi-card orange">
          <div class="kpi-icon">⚠️</div>
          <div class="kpi-body">
            <span class="kpi-val">{{ stats().lowStock }}</span>
            <span class="kpi-label">Stock faible</span>
          </div>
        </div>
        <div class="kpi-card purple">
          <div class="kpi-icon">💰</div>
          <div class="kpi-body">
            <span class="kpi-val">{{ stats().todayRevenue | number:'1.0-0' }} F</span>
            <span class="kpi-label">Recettes du jour</span>
          </div>
        </div>
      </div>

      <div class="panels">
        <!-- Recent reservations -->
        <div class="panel">
          <div class="panel-header">
            <h3>Réservations récentes</h3>
            <a routerLink="/reservations" class="see-all">Voir tout →</a>
          </div>
          @if (loading()) {
            <div class="loading-state">Chargement…</div>
          } @else if (recentResas().length === 0) {
            <div class="empty-state">Aucune réservation aujourd'hui</div>
          } @else {
            <div class="resa-list">
              @for (r of recentResas(); track r.id) {
                <div class="resa-row">
                  <div class="resa-ref">{{ r.reference }}</div>
                  <div class="resa-patient">
                    <span class="resa-name">{{ r.patientName }}</span>
                    <span class="resa-meds">{{ r.medicationSummary }}</span>
                  </div>
                  <div class="resa-amount">{{ r.totalAmount | number:'1.0-0' }} F</div>
                  <span class="status-badge" [class]="r.status.toLowerCase()">{{ statusLabel(r.status) }}</span>
                </div>
              }
            </div>
          }
        </div>

        <!-- Low stock alert -->
        <div class="panel">
          <div class="panel-header">
            <h3>Alertes stock</h3>
            <a routerLink="/stock" class="see-all">Gérer →</a>
          </div>
          @if (lowStock().length === 0) {
            <div class="empty-state ok">✅ Tous les stocks sont bons</div>
          } @else {
            <div class="stock-alerts">
              @for (s of lowStock(); track s.id) {
                <div class="stock-row">
                  <div class="stock-name">{{ s.medicationName }}</div>
                  <div class="stock-qty" [class.critical]="s.quantity === 0">
                    {{ s.quantity === 0 ? 'Épuisé' : s.quantity + ' unités' }}
                  </div>
                </div>
              }
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard { max-width:1100px; }
    .page-header { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:24px; }
    h2 { margin:0 0 4px; font-size:24px; color:#1a1a2e; }
    .subtitle { margin:0; color:#888; font-size:14px; }
    .btn-refresh { background:#f5f6fa; border:1px solid #e0e0e0; border-radius:8px; padding:8px 16px; cursor:pointer; font-size:14px; }
    .kpi-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); gap:16px; margin-bottom:24px; }
    .kpi-card { display:flex; align-items:center; gap:16px; padding:20px; border-radius:12px; background:#fff; box-shadow:0 2px 8px rgba(0,0,0,.06); }
    .kpi-card.blue { border-left:4px solid #4a90e2; }
    .kpi-card.green { border-left:4px solid #27ae60; }
    .kpi-card.orange { border-left:4px solid #f39c12; }
    .kpi-card.purple { border-left:4px solid #8e44ad; }
    .kpi-icon { font-size:28px; }
    .kpi-val { display:block; font-size:24px; font-weight:700; color:#1a1a2e; }
    .kpi-label { font-size:12px; color:#888; }
    .panels { display:grid; grid-template-columns:1fr 380px; gap:20px; }
    .panel { background:#fff; border-radius:12px; padding:20px; box-shadow:0 2px 8px rgba(0,0,0,.06); }
    .panel-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:16px; }
    .panel-header h3 { margin:0; font-size:16px; color:#1a1a2e; }
    .see-all { font-size:13px; color:#4a90e2; text-decoration:none; }
    .loading-state,.empty-state { text-align:center; padding:30px; color:#aaa; font-size:14px; }
    .empty-state.ok { color:#27ae60; }
    .resa-row { display:flex; align-items:center; gap:12px; padding:10px 0; border-bottom:1px solid #f5f5f5; }
    .resa-ref { font-size:12px; color:#aaa; font-family:monospace; width:80px; flex-shrink:0; }
    .resa-patient { flex:1; min-width:0; }
    .resa-name { display:block; font-size:13px; font-weight:600; color:#1a1a2e; }
    .resa-meds { display:block; font-size:12px; color:#888; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .resa-amount { font-size:13px; font-weight:600; color:#27ae60; width:80px; text-align:right; flex-shrink:0; }
    .status-badge { font-size:11px; padding:3px 8px; border-radius:20px; font-weight:600; flex-shrink:0; }
    .status-badge.pending { background:#fff3cd; color:#856404; }
    .status-badge.confirmed { background:#d1e7dd; color:#155724; }
    .status-badge.ready { background:#cfe2ff; color:#0a58ca; }
    .status-badge.completed { background:#e8f5e9; color:#1b5e20; }
    .status-badge.cancelled { background:#f8d7da; color:#842029; }
    .stock-row { display:flex; align-items:center; justify-content:space-between; padding:10px 0; border-bottom:1px solid #f5f5f5; }
    .stock-name { font-size:13px; font-weight:500; color:#1a1a2e; }
    .stock-qty { font-size:12px; color:#f39c12; font-weight:600; }
    .stock-qty.critical { color:#e74c3c; }
    @media(max-width:900px) { .panels { grid-template-columns:1fr; } }
  `]
})
export class DashboardComponent implements OnInit {
  loading = signal(true);
  recentResas = signal<ReservationSummary[]>([]);
  lowStock = signal<PharmacyStock[]>([]);
  stats = signal({ pending: 0, confirmed: 0, lowStock: 0, todayRevenue: 0 });
  today = signal(new Date().toLocaleDateString('fr-FR', { weekday:'long', year:'numeric', month:'long', day:'numeric' }));

  constructor(
    private resaService: ReservationService,
    private pharmacyService: PharmacyService
  ) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    forkJoin({
      resas: this.resaService.getMyPharmacyReservations(0, 10),
      stock: this.pharmacyService.getMyStock(0, 100)
    }).subscribe({
      next: ({ resas, stock }) => {
        this.recentResas.set(resas.content.slice(0, 6));
        const low = stock.content.filter(s => s.status !== StockStatus.AVAILABLE);
        this.lowStock.set(low.slice(0, 6));
        this.stats.set({
          pending: resas.content.filter(r => r.status === ReservationStatus.PENDING).length,
          confirmed: resas.content.filter(r => r.status === ReservationStatus.CONFIRMED).length,
          lowStock: low.length,
          todayRevenue: resas.content
            .filter(r => r.status === ReservationStatus.COMPLETED)
            .reduce((s, r) => s + r.totalAmount, 0)
        });
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  statusLabel(s: string): string {
    const m: Record<string,string> = {
      PENDING:'En attente', CONFIRMED:'Confirmée', READY:'Prête', COMPLETED:'Complétée', CANCELLED:'Annulée', EXPIRED:'Expirée'
    };
    return m[s] ?? s;
  }
}
