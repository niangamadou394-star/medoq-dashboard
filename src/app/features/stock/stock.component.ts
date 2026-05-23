import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PharmacyService } from '../../core/services/pharmacy.service';
import { PharmacyStock, StockStatus, UpdateStockRequest } from '../../core/models';

@Component({
  selector: 'app-stock',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h2>Gestion du Stock</h2>
          <p class="subtitle">{{ total() }} médicaments référencés</p>
        </div>
      </div>

      <div class="toolbar">
        <input class="search-input" type="text" [(ngModel)]="search"
          placeholder="🔍 Rechercher un médicament…" (input)="onSearch()" />
        <div class="status-filters">
          @for (f of filters; track f.value) {
            <button class="filter-btn" [class.active]="activeFilter() === f.value"
              (click)="setFilter(f.value)">{{ f.label }}</button>
          }
        </div>
      </div>

      <!-- Edit Modal -->
      @if (editing()) {
        <div class="modal-overlay" (click)="editing.set(null)"></div>
        <div class="modal">
          <div class="modal-header">
            <h3>Modifier le stock — {{ editing()!.medicationName }}</h3>
            <button class="close-btn" (click)="editing.set(null)">✕</button>
          </div>
          <div class="modal-body">
            <div class="field">
              <label>Quantité (unités)</label>
              <input type="number" [(ngModel)]="editForm.quantity" min="0" />
            </div>
            <div class="field">
              <label>Seuil d'alerte</label>
              <input type="number" [(ngModel)]="editForm.threshold" min="0" />
            </div>
            <div class="field">
              <label>Prix unitaire (FCFA)</label>
              <input type="number" [(ngModel)]="editForm.price" min="0" />
            </div>
            <div class="modal-actions">
              <button class="btn-cancel" (click)="editing.set(null)">Annuler</button>
              <button class="btn-save" (click)="saveStock()" [disabled]="saving()">
                {{ saving() ? 'Sauvegarde…' : 'Sauvegarder' }}
              </button>
            </div>
          </div>
        </div>
      }

      @if (loading()) {
        <div class="loading">Chargement du stock…</div>
      } @else if (filtered().length === 0) {
        <div class="empty">Aucun médicament trouvé</div>
      } @else {
        <div class="stock-grid">
          @for (s of filtered(); track s.id) {
            <div class="stock-card" [class.low]="s.status === 'LIMITED'" [class.out]="s.status === 'OUT_OF_STOCK'">
              <div class="card-header">
                <div class="med-info">
                  <span class="med-name">{{ s.medicationName }}</span>
                  @if (s.medicationDci) { <span class="med-dci">{{ s.medicationDci }}</span> }
                </div>
                <span class="stock-status" [class]="s.status.toLowerCase().replace('_','-')">
                  {{ statusLabel(s.status) }}
                </span>
              </div>

              <div class="card-stats">
                <div class="stat">
                  <span class="stat-val" [class.warn]="s.quantity <= s.threshold" [class.zero]="s.quantity === 0">
                    {{ s.quantity }}
                  </span>
                  <span class="stat-label">Unités</span>
                </div>
                <div class="stat">
                  <span class="stat-val">{{ s.threshold }}</span>
                  <span class="stat-label">Seuil</span>
                </div>
                <div class="stat">
                  <span class="stat-val price">{{ s.price | number:'1.0-0' }} F</span>
                  <span class="stat-label">Prix</span>
                </div>
              </div>

              <div class="stock-bar">
                <div class="bar-fill" [style.width.%]="barWidth(s)" [class]="s.status.toLowerCase().replace('_','-')"></div>
              </div>

              <div class="card-footer">
                <span class="update-date">MAJ: {{ formatDate(s.lastUpdated) }}</span>
                <button class="btn-edit" (click)="openEdit(s)">✏️ Modifier</button>
              </div>
            </div>
          }
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
    .toolbar { display:flex; align-items:center; gap:12px; margin-bottom:20px; flex-wrap:wrap; }
    .search-input { flex:1; min-width:200px; padding:10px 14px; border:1.5px solid #e0e0e0; border-radius:8px; font-size:14px; outline:none; }
    .search-input:focus { border-color:#4a90e2; }
    .status-filters { display:flex; gap:6px; flex-wrap:wrap; }
    .filter-btn { padding:8px 14px; border:1.5px solid #e0e0e0; border-radius:20px; font-size:13px; background:#fff; cursor:pointer; }
    .filter-btn.active { border-color:#4a90e2; background:#4a90e2; color:#fff; }
    .stock-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:16px; }
    .stock-card { background:#fff; border-radius:12px; padding:16px; box-shadow:0 2px 8px rgba(0,0,0,.06); border-left:4px solid #27ae60; transition:box-shadow .15s; }
    .stock-card:hover { box-shadow:0 4px 16px rgba(0,0,0,.1); }
    .stock-card.low { border-left-color:#f39c12; }
    .stock-card.out { border-left-color:#e74c3c; }
    .card-header { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:12px; gap:8px; }
    .med-name { display:block; font-size:14px; font-weight:600; color:#1a1a2e; }
    .med-dci { display:block; font-size:12px; color:#888; }
    .stock-status { font-size:11px; padding:3px 8px; border-radius:20px; font-weight:600; white-space:nowrap; flex-shrink:0; }
    .stock-status.available { background:#e8f5e9; color:#1b5e20; }
    .stock-status.limited { background:#fff3cd; color:#856404; }
    .stock-status.out-of-stock { background:#f8d7da; color:#842029; }
    .card-stats { display:flex; gap:8px; margin-bottom:10px; }
    .stat { flex:1; text-align:center; background:#f8f9fa; border-radius:8px; padding:8px 4px; }
    .stat-val { display:block; font-size:16px; font-weight:700; color:#1a1a2e; }
    .stat-val.warn { color:#f39c12; }
    .stat-val.zero { color:#e74c3c; }
    .stat-val.price { font-size:13px; }
    .stat-label { font-size:11px; color:#888; }
    .stock-bar { height:5px; background:#f0f0f0; border-radius:3px; margin:8px 0; overflow:hidden; }
    .bar-fill { height:100%; border-radius:3px; transition:width .3s; background:#27ae60; }
    .bar-fill.limited { background:#f39c12; }
    .bar-fill.out-of-stock { background:#e74c3c; }
    .card-footer { display:flex; align-items:center; justify-content:space-between; margin-top:8px; }
    .update-date { font-size:11px; color:#aaa; }
    .btn-edit { background:#f0f4ff; color:#4a90e2; border:none; border-radius:6px; padding:6px 12px; cursor:pointer; font-size:12px; font-weight:600; }
    .loading,.empty { background:#fff; border-radius:12px; padding:40px; text-align:center; color:#aaa; box-shadow:0 2px 8px rgba(0,0,0,.06); }
    .pagination { display:flex; align-items:center; justify-content:center; gap:16px; margin-top:20px; }
    .pagination button { padding:8px 16px; border:1px solid #e0e0e0; border-radius:8px; background:#fff; cursor:pointer; }
    .pagination button:disabled { opacity:.4; cursor:not-allowed; }
    /* Modal */
    .modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,.4); z-index:400; }
    .modal { position:fixed; top:50%; left:50%; transform:translate(-50%,-50%); background:#fff; border-radius:12px; width:380px; z-index:401; box-shadow:0 20px 60px rgba(0,0,0,.2); }
    .modal-header { display:flex; align-items:center; justify-content:space-between; padding:20px 24px; border-bottom:1px solid #f0f0f0; }
    .modal-header h3 { margin:0; font-size:15px; }
    .close-btn { background:none; border:none; font-size:20px; cursor:pointer; color:#666; }
    .modal-body { padding:20px 24px; }
    .field { margin-bottom:16px; }
    label { display:block; font-size:13px; font-weight:600; color:#444; margin-bottom:6px; }
    input[type=number] { width:100%; padding:10px 12px; border:1.5px solid #e0e0e0; border-radius:8px; font-size:15px; outline:none; box-sizing:border-box; }
    input[type=number]:focus { border-color:#4a90e2; }
    .modal-actions { display:flex; gap:10px; margin-top:20px; }
    .btn-cancel { flex:1; padding:11px; border:1.5px solid #e0e0e0; border-radius:8px; font-size:14px; background:#fff; cursor:pointer; }
    .btn-save { flex:2; padding:11px; background:#4a90e2; color:#fff; border:none; border-radius:8px; font-size:14px; font-weight:600; cursor:pointer; }
    .btn-save:disabled { opacity:.7; cursor:not-allowed; }
  `]
})
export class StockComponent implements OnInit {
  loading = signal(true);
  saving = signal(false);
  stockItems = signal<PharmacyStock[]>([]);
  filtered = signal<PharmacyStock[]>([]);
  editing = signal<PharmacyStock | null>(null);
  editForm: UpdateStockRequest = { quantity: 0, threshold: 0, price: 0 };
  activeFilter = signal('');
  search = '';
  page = signal(0);
  hasMore = signal(false);
  total = signal(0);

  filters = [
    { label:'Tous', value:'' },
    { label:'Disponible', value:'AVAILABLE' },
    { label:'Faible', value:'LIMITED' },
    { label:'Épuisé', value:'OUT_OF_STOCK' },
  ];

  constructor(private pharmacyService: PharmacyService) {}

  ngOnInit(): void { this.loadPage(); }

  setFilter(v: string): void { this.activeFilter.set(v); this.filter(); }
  onSearch(): void { this.filter(); }

  loadPage(): void {
    this.loading.set(true);
    this.pharmacyService.getMyStock(this.page(), 50, this.search || undefined).subscribe({
      next: (data) => {
        this.stockItems.set(data.content);
        this.total.set(data.totalElements ?? data.content.length);
        this.hasMore.set(!data.last);
        this.filter();
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  filter(): void {
    let items = this.stockItems();
    if (this.activeFilter()) {
      items = items.filter(s => s.status === this.activeFilter());
    }
    if (this.search) {
      const q = this.search.toLowerCase();
      items = items.filter(s => s.medicationName.toLowerCase().includes(q) || (s.medicationDci ?? '').toLowerCase().includes(q));
    }
    this.filtered.set(items);
  }

  changePage(dir: number): void { this.page.update(p => p + dir); this.loadPage(); }

  openEdit(s: PharmacyStock): void {
    this.editing.set(s);
    this.editForm = { quantity: s.quantity, threshold: s.threshold, price: s.price };
  }

  saveStock(): void {
    const s = this.editing();
    if (!s) return;
    this.saving.set(true);
    this.pharmacyService.updateStock(s.id, this.editForm).subscribe({
      next: () => {
        this.editing.set(null);
        this.saving.set(false);
        this.loadPage();
      },
      error: () => this.saving.set(false)
    });
  }

  barWidth(s: PharmacyStock): number {
    if (s.threshold === 0) return s.quantity > 0 ? 100 : 0;
    return Math.min(100, Math.round((s.quantity / (s.threshold * 3)) * 100));
  }

  statusLabel(s: string): string {
    const m: Record<string,string> = { AVAILABLE:'Disponible', LIMITED:'Faible', OUT_OF_STOCK:'Épuisé' };
    return m[s] ?? s;
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('fr-FR', { day:'2-digit', month:'short' });
  }
}
