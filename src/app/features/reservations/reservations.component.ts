import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReservationService } from '../../core/services/reservation.service';
import { ReservationSummary, ReservationStatus, Reservation } from '../../core/models';

@Component({
  selector: 'app-reservations',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h2>Réservations</h2>
          <p class="subtitle">Gérez les demandes de vos patients</p>
        </div>
      </div>

      <!-- Filters -->
      <div class="filters-bar">
        <input class="search-input" type="text" [(ngModel)]="search"
          placeholder="🔍 Rechercher par patient, réf…" (input)="onSearch()" />
        <div class="status-tabs">
          @for (tab of tabs; track tab.value) {
            <button class="tab-btn" [class.active]="activeTab() === tab.value"
              (click)="setTab(tab.value)">{{ tab.label }}</button>
          }
        </div>
      </div>

      <!-- Detail drawer -->
      @if (selected()) {
        <div class="drawer-overlay" (click)="selected.set(null)"></div>
        <div class="drawer">
          <div class="drawer-header">
            <h3>Réservation {{ selected()!.reference }}</h3>
            <button class="close-btn" (click)="selected.set(null)">✕</button>
          </div>
          <div class="drawer-body">
            <div class="info-row"><span>Patient</span><strong>{{ selected()!.patientName }}</strong></div>
            <div class="info-row"><span>Téléphone</span><strong>{{ selected()!.patientPhone }}</strong></div>
            <div class="info-row"><span>Statut</span>
              <span class="status-badge" [class]="selected()!.status.toLowerCase()">{{ statusLabel(selected()!.status) }}</span>
            </div>
            <div class="info-row"><span>Date</span><strong>{{ formatDate(selected()!.createdAt) }}</strong></div>
            <div class="info-row"><span>Expiration</span><strong>{{ formatDate(selected()!.expiresAt) }}</strong></div>

            <h4>Médicaments</h4>
            <div class="items-list">
              @for (item of selected()!.items; track item.medicationId) {
                <div class="item-row">
                  <span class="item-name">{{ item.medicationName }}</span>
                  <span class="item-qty">×{{ item.quantity }}</span>
                  <span class="item-price">{{ item.totalPrice | number:'1.0-0' }} F</span>
                </div>
              }
            </div>
            <div class="total-row">
              <span>Total</span>
              <strong>{{ selected()!.totalAmount | number:'1.0-0' }} FCFA</strong>
            </div>

            @if (selected()!.notes) {
              <div class="notes">📝 {{ selected()!.notes }}</div>
            }

            <div class="actions">
              @if (selected()!.status === 'PENDING') {
                <button class="btn-confirm" (click)="doAction('confirm')">✅ Confirmer</button>
                <button class="btn-cancel" (click)="doAction('cancel')">✕ Annuler</button>
              }
              @if (selected()!.status === 'CONFIRMED') {
                <button class="btn-ready" (click)="doAction('ready')">📦 Marquer Prête</button>
                <button class="btn-cancel" (click)="doAction('cancel')">✕ Annuler</button>
              }
              @if (selected()!.status === 'READY') {
                <button class="btn-complete" (click)="doAction('complete')">🎉 Compléter</button>
              }
            </div>
          </div>
        </div>
      }

      <!-- Table -->
      @if (loading()) {
        <div class="loading">Chargement…</div>
      } @else if (resas().length === 0) {
        <div class="empty">Aucune réservation trouvée</div>
      } @else {
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Référence</th>
                <th>Patient</th>
                <th>Médicaments</th>
                <th>Montant</th>
                <th>Statut</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (r of resas(); track r.id) {
                <tr>
                  <td class="ref-col">{{ r.reference }}</td>
                  <td>
                    <div class="patient-name">{{ r.patientName }}</div>
                    <div class="patient-phone">{{ r.patientPhone }}</div>
                  </td>
                  <td class="meds-col">{{ r.medicationSummary }}</td>
                  <td class="amount-col">{{ r.totalAmount | number:'1.0-0' }} F</td>
                  <td><span class="status-badge" [class]="r.status.toLowerCase()">{{ statusLabel(r.status) }}</span></td>
                  <td class="date-col">{{ formatDate(r.createdAt) }}</td>
                  <td><button class="btn-view" (click)="viewDetail(r.id)">Voir</button></td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        <div class="pagination">
          <button [disabled]="page() === 0" (click)="changePage(-1)">← Préc.</button>
          <span>Page {{ page() + 1 }}</span>
          <button [disabled]="!hasMore()" (click)="changePage(1)">Suiv. →</button>
        </div>
      }
    </div>
  `,
  styles: [`
    .page { max-width:1100px; }
    .page-header { margin-bottom:20px; }
    h2 { margin:0 0 4px; font-size:24px; color:#1a1a2e; }
    .subtitle { margin:0; color:#888; font-size:14px; }
    .filters-bar { display:flex; align-items:center; gap:12px; margin-bottom:20px; flex-wrap:wrap; }
    .search-input { flex:1; min-width:200px; padding:10px 14px; border:1.5px solid #e0e0e0; border-radius:8px; font-size:14px; outline:none; }
    .search-input:focus { border-color:#4a90e2; }
    .status-tabs { display:flex; gap:6px; flex-wrap:wrap; }
    .tab-btn { padding:8px 14px; border:1.5px solid #e0e0e0; border-radius:20px; font-size:13px; background:#fff; cursor:pointer; }
    .tab-btn.active { border-color:#4a90e2; background:#4a90e2; color:#fff; }
    .table-wrap { background:#fff; border-radius:12px; box-shadow:0 2px 8px rgba(0,0,0,.06); overflow:hidden; }
    table { width:100%; border-collapse:collapse; }
    thead { background:#f8f9fa; }
    th { padding:12px 16px; font-size:12px; font-weight:600; text-align:left; color:#888; text-transform:uppercase; letter-spacing:.5px; }
    td { padding:12px 16px; border-top:1px solid #f0f0f0; vertical-align:middle; }
    .ref-col { font-family:monospace; font-size:12px; color:#888; }
    .patient-name { font-size:13px; font-weight:600; color:#1a1a2e; }
    .patient-phone { font-size:12px; color:#888; }
    .meds-col { font-size:12px; color:#555; max-width:200px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .amount-col { font-size:13px; font-weight:600; color:#27ae60; }
    .date-col { font-size:12px; color:#888; white-space:nowrap; }
    .status-badge { font-size:11px; padding:3px 8px; border-radius:20px; font-weight:600; white-space:nowrap; }
    .status-badge.pending { background:#fff3cd; color:#856404; }
    .status-badge.confirmed { background:#d1e7dd; color:#155724; }
    .status-badge.ready { background:#cfe2ff; color:#0a58ca; }
    .status-badge.completed { background:#e8f5e9; color:#1b5e20; }
    .status-badge.cancelled { background:#f8d7da; color:#842029; }
    .status-badge.expired { background:#e9ecef; color:#6c757d; }
    .btn-view { background:#f0f4ff; color:#4a90e2; border:none; border-radius:6px; padding:6px 12px; cursor:pointer; font-size:12px; font-weight:600; }
    .loading,.empty { background:#fff; border-radius:12px; padding:40px; text-align:center; color:#aaa; box-shadow:0 2px 8px rgba(0,0,0,.06); }
    .pagination { display:flex; align-items:center; justify-content:center; gap:16px; margin-top:16px; }
    .pagination button { padding:8px 16px; border:1px solid #e0e0e0; border-radius:8px; background:#fff; cursor:pointer; }
    .pagination button:disabled { opacity:.4; cursor:not-allowed; }
    /* Drawer */
    .drawer-overlay { position:fixed; inset:0; background:rgba(0,0,0,.3); z-index:300; }
    .drawer { position:fixed; right:0; top:0; bottom:0; width:420px; background:#fff; z-index:301; box-shadow:-4px 0 24px rgba(0,0,0,.1); display:flex; flex-direction:column; overflow-y:auto; }
    .drawer-header { display:flex; align-items:center; justify-content:space-between; padding:20px 24px; border-bottom:1px solid #f0f0f0; flex-shrink:0; }
    .drawer-header h3 { margin:0; font-size:16px; }
    .close-btn { background:none; border:none; font-size:20px; cursor:pointer; color:#666; }
    .drawer-body { padding:20px 24px; }
    .info-row { display:flex; align-items:center; justify-content:space-between; padding:8px 0; border-bottom:1px solid #f5f5f5; font-size:14px; }
    .info-row span { color:#888; }
    h4 { margin:20px 0 10px; font-size:14px; color:#666; }
    .items-list { background:#f8f9fa; border-radius:8px; padding:10px 14px; margin-bottom:10px; }
    .item-row { display:flex; align-items:center; gap:8px; padding:6px 0; font-size:13px; border-bottom:1px solid #eee; }
    .item-row:last-child { border-bottom:none; }
    .item-name { flex:1; font-weight:500; }
    .item-qty { color:#888; width:30px; text-align:center; }
    .item-price { font-weight:600; color:#27ae60; }
    .total-row { display:flex; justify-content:space-between; padding:10px 0; font-size:15px; border-top:2px solid #e0e0e0; }
    .notes { background:#fffde7; border-radius:8px; padding:10px 12px; font-size:13px; color:#555; margin:12px 0; }
    .actions { display:flex; gap:10px; margin-top:20px; flex-wrap:wrap; }
    .btn-confirm,.btn-ready,.btn-complete { flex:1; padding:12px; border:none; border-radius:8px; font-size:14px; font-weight:600; cursor:pointer; }
    .btn-confirm { background:#27ae60; color:#fff; }
    .btn-ready { background:#4a90e2; color:#fff; }
    .btn-complete { background:#8e44ad; color:#fff; }
    .btn-cancel { flex:1; padding:12px; border:1.5px solid #e74c3c; border-radius:8px; font-size:14px; font-weight:600; cursor:pointer; background:#fff; color:#e74c3c; }
    @media(max-width:600px) { .drawer { width:100%; } }
  `]
})
export class ReservationsComponent implements OnInit {
  loading = signal(true);
  resas = signal<ReservationSummary[]>([]);
  selected = signal<Reservation | null>(null);
  page = signal(0);
  hasMore = signal(false);
  activeTab = signal<string>('');
  search = '';

  tabs = [
    { label:'Tous', value:'' },
    { label:'En attente', value:'PENDING' },
    { label:'Confirmés', value:'CONFIRMED' },
    { label:'Prêts', value:'READY' },
    { label:'Complétés', value:'COMPLETED' },
  ];

  constructor(private resaService: ReservationService) {}

  ngOnInit(): void { this.loadPage(); }

  setTab(v: string): void { this.activeTab.set(v); this.page.set(0); this.loadPage(); }
  onSearch(): void { this.page.set(0); this.loadPage(); }

  loadPage(): void {
    this.loading.set(true);
    const filter = {
      status: this.activeTab() ? (this.activeTab() as ReservationStatus) : undefined,
      search: this.search || undefined
    };
    this.resaService.getMyPharmacyReservations(this.page(), 15, filter).subscribe({
      next: (data) => {
        this.resas.set(data.content);
        this.hasMore.set(!data.last);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  changePage(dir: number): void { this.page.update(p => p + dir); this.loadPage(); }

  viewDetail(id: string): void {
    this.resaService.getById(id).subscribe(r => this.selected.set(r));
  }

  doAction(action: string): void {
    const r = this.selected();
    if (!r) return;
    const obs$ = action === 'confirm' ? this.resaService.confirm(r.id) :
                 action === 'ready'   ? this.resaService.markReady(r.id) :
                 action === 'complete'? this.resaService.complete(r.id) :
                                       this.resaService.cancel(r.id);
    obs$.subscribe({
      next: (updated) => {
        this.selected.set(updated);
        this.loadPage();
      }
    });
  }

  statusLabel(s: string): string {
    const m: Record<string,string> = {
      PENDING:'En attente', CONFIRMED:'Confirmée', READY:'Prête', COMPLETED:'Complétée', CANCELLED:'Annulée', EXPIRED:'Expirée'
    };
    return m[s] ?? s;
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('fr-FR', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });
  }
}
