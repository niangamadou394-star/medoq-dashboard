import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PharmacyService } from '../../core/services/pharmacy.service';
import { Pharmacy } from '../../core/models';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h2>Administration</h2>
        <p class="subtitle">Gestion globale de la plateforme Medoq</p>
      </div>

      <div class="admin-stats">
        <div class="stat-card">
          <span class="stat-icon">🏥</span>
          <span class="stat-val">{{ pharmacies().length }}</span>
          <span class="stat-lbl">Pharmacies enregistrées</span>
        </div>
        <div class="stat-card">
          <span class="stat-icon">✅</span>
          <span class="stat-val">{{ verified() }}</span>
          <span class="stat-lbl">Vérifiées</span>
        </div>
        <div class="stat-card">
          <span class="stat-icon">⏳</span>
          <span class="stat-val">{{ pending() }}</span>
          <span class="stat-lbl">En attente</span>
        </div>
        <div class="stat-card">
          <span class="stat-icon">🔴</span>
          <span class="stat-val">{{ inactive() }}</span>
          <span class="stat-lbl">Inactives</span>
        </div>
      </div>

      <div class="panel">
        <div class="panel-header">
          <h3>Toutes les pharmacies</h3>
        </div>
        @if (loading()) {
          <div class="loading">Chargement…</div>
        } @else {
          <table>
            <thead>
              <tr>
                <th>Nom</th>
                <th>Licence</th>
                <th>Ville</th>
                <th>Téléphone</th>
                <th>Note</th>
                <th>Statut</th>
                <th>Vérification</th>
              </tr>
            </thead>
            <tbody>
              @for (ph of pharmacies(); track ph.id) {
                <tr>
                  <td class="ph-name">{{ ph.name }}</td>
                  <td class="monospace">{{ ph.licenseNumber }}</td>
                  <td>{{ ph.location?.city ?? '—' }}</td>
                  <td>{{ ph.phone }}</td>
                  <td>⭐ {{ ph.rating.toFixed(1) }}</td>
                  <td>
                    <span class="badge" [class.active]="ph.isActive" [class.inactive]="!ph.isActive">
                      {{ ph.isActive ? 'Active' : 'Inactive' }}
                    </span>
                  </td>
                  <td>
                    <span class="badge" [class.verified]="ph.isVerified" [class.pending]="!ph.isVerified">
                      {{ ph.isVerified ? '✓ Vérifiée' : '⏳ En attente' }}
                    </span>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        }
      </div>
    </div>
  `,
  styles: [`
    .page { max-width:1100px; }
    .page-header { margin-bottom:24px; }
    h2 { margin:0 0 4px; font-size:24px; color:#1a1a2e; }
    .subtitle { margin:0; color:#888; font-size:14px; }
    .admin-stats { display:grid; grid-template-columns:repeat(auto-fit,minmax(160px,1fr)); gap:14px; margin-bottom:24px; }
    .stat-card { background:#fff; border-radius:12px; padding:20px; box-shadow:0 2px 8px rgba(0,0,0,.06); text-align:center; }
    .stat-icon { display:block; font-size:28px; margin-bottom:6px; }
    .stat-val { display:block; font-size:28px; font-weight:700; color:#1a1a2e; }
    .stat-lbl { font-size:12px; color:#888; }
    .panel { background:#fff; border-radius:12px; box-shadow:0 2px 8px rgba(0,0,0,.06); overflow:hidden; }
    .panel-header { padding:16px 20px; border-bottom:1px solid #f0f0f0; }
    .panel-header h3 { margin:0; font-size:16px; }
    table { width:100%; border-collapse:collapse; }
    th { padding:12px 16px; font-size:11px; font-weight:600; text-align:left; color:#888; text-transform:uppercase; letter-spacing:.5px; background:#f8f9fa; }
    td { padding:12px 16px; border-top:1px solid #f0f0f0; vertical-align:middle; font-size:13px; }
    .ph-name { font-weight:600; color:#1a1a2e; }
    .monospace { font-family:monospace; font-size:12px; color:#888; }
    .badge { font-size:11px; padding:3px 8px; border-radius:20px; font-weight:600; }
    .badge.active { background:#e8f5e9; color:#2e7d32; }
    .badge.inactive { background:#f8d7da; color:#842029; }
    .badge.verified { background:#e3f2fd; color:#0d47a1; }
    .badge.pending { background:#fff3cd; color:#856404; }
    .loading { padding:40px; text-align:center; color:#aaa; }
  `]
})
export class AdminComponent implements OnInit {
  loading = signal(true);
  pharmacies = signal<Pharmacy[]>([]);
  verified = signal(0);
  pending = signal(0);
  inactive = signal(0);

  constructor(private pharmacyService: PharmacyService) {}

  ngOnInit(): void {
    this.pharmacyService.getAllPharmacies(0, 100).subscribe({
      next: (data) => {
        const list = data.content;
        this.pharmacies.set(list);
        this.verified.set(list.filter(p => p.isVerified).length);
        this.pending.set(list.filter(p => !p.isVerified && p.isActive).length);
        this.inactive.set(list.filter(p => !p.isActive).length);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }
}
