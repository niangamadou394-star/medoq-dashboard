import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { PharmacyService } from '../../core/services/pharmacy.service';
import { User, Pharmacy } from '../../core/models';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <h2>Profil & Paramètres</h2>

      @if (saved()) {
        <div class="alert-success">✅ Modifications enregistrées !</div>
      }

      <div class="panels">
        <!-- User info -->
        <div class="panel">
          <h3>Informations personnelles</h3>
          @if (user()) {
            <div class="avatar-row">
              <div class="avatar-circle">{{ initials() }}</div>
              <div>
                <p class="full-name">{{ user()!.firstName }} {{ user()!.lastName }}</p>
                <p class="user-role">{{ roleLabel(user()!.role) }}</p>
              </div>
            </div>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-lbl">Téléphone</span>
                <span class="info-val">{{ user()!.phone }}</span>
              </div>
              <div class="info-item">
                <span class="info-lbl">Email</span>
                <span class="info-val">{{ user()!.email ?? 'Non renseigné' }}</span>
              </div>
              <div class="info-item">
                <span class="info-lbl">Membre depuis</span>
                <span class="info-val">{{ formatDate(user()!.createdAt) }}</span>
              </div>
            </div>
          }
        </div>

        <!-- Pharmacy info -->
        <div class="panel">
          <h3>Informations de la pharmacie</h3>
          @if (pharmacy()) {
            <form (ngSubmit)="savePharmacy()">
              <div class="field">
                <label>Nom de la pharmacie</label>
                <input type="text" [(ngModel)]="pharmaForm.name" name="ph-name" />
              </div>
              <div class="field">
                <label>Téléphone</label>
                <input type="tel" [(ngModel)]="pharmaForm.phone" name="ph-phone" />
              </div>
              <div class="field">
                <label>Email</label>
                <input type="email" [(ngModel)]="pharmaForm.email" name="ph-email" />
              </div>
              <div class="field">
                <label>Description</label>
                <textarea [(ngModel)]="pharmaForm.description" name="ph-desc" rows="3"></textarea>
              </div>

              <div class="ph-meta-grid">
                <div class="meta-item">
                  <span class="meta-lbl">Statut</span>
                  <span class="meta-val" [class.active]="pharmacy()!.isActive">
                    {{ pharmacy()!.isActive ? '🟢 Active' : '🔴 Inactive' }}
                  </span>
                </div>
                <div class="meta-item">
                  <span class="meta-lbl">Vérification</span>
                  <span class="meta-val" [class.verified]="pharmacy()!.isVerified">
                    {{ pharmacy()!.isVerified ? '✓ Vérifiée' : '⏳ En attente' }}
                  </span>
                </div>
                <div class="meta-item">
                  <span class="meta-lbl">Note</span>
                  <span class="meta-val">⭐ {{ pharmacy()!.rating.toFixed(1) }} ({{ pharmacy()!.ratingCount }} avis)</span>
                </div>
              </div>

              <button type="submit" class="btn-save" [disabled]="saving()">
                {{ saving() ? 'Sauvegarde…' : '💾 Enregistrer' }}
              </button>
            </form>
          } @else {
            <div class="loading">Chargement…</div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page { max-width:900px; }
    h2 { margin:0 0 20px; font-size:24px; color:#1a1a2e; }
    .alert-success { background:#e8f5e9; border:1px solid #a5d6a7; border-radius:8px; padding:12px 16px; color:#2e7d32; font-size:14px; margin-bottom:20px; }
    .panels { display:grid; grid-template-columns:1fr 1fr; gap:20px; }
    .panel { background:#fff; border-radius:12px; padding:24px; box-shadow:0 2px 8px rgba(0,0,0,.06); }
    .panel h3 { margin:0 0 20px; font-size:16px; color:#1a1a2e; border-bottom:1px solid #f0f0f0; padding-bottom:12px; }
    .avatar-row { display:flex; align-items:center; gap:16px; margin-bottom:20px; }
    .avatar-circle { width:56px; height:56px; border-radius:50%; background:#4a90e2; color:#fff; font-size:20px; font-weight:700; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .full-name { margin:0 0 4px; font-size:18px; font-weight:600; color:#1a1a2e; }
    .user-role { margin:0; font-size:13px; color:#888; }
    .info-grid { display:flex; flex-direction:column; gap:12px; }
    .info-item { display:flex; flex-direction:column; }
    .info-lbl { font-size:11px; text-transform:uppercase; letter-spacing:.5px; color:#aaa; margin-bottom:2px; }
    .info-val { font-size:14px; color:#1a1a2e; font-weight:500; }
    .field { margin-bottom:14px; }
    label { display:block; font-size:12px; font-weight:600; color:#555; margin-bottom:5px; }
    input,textarea { width:100%; padding:10px 12px; border:1.5px solid #e0e0e0; border-radius:8px; font-size:14px; outline:none; box-sizing:border-box; font-family:inherit; }
    input:focus,textarea:focus { border-color:#4a90e2; }
    textarea { resize:vertical; }
    .ph-meta-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin:16px 0; }
    .meta-item { background:#f8f9fa; border-radius:8px; padding:10px 12px; }
    .meta-lbl { display:block; font-size:11px; color:#aaa; text-transform:uppercase; letter-spacing:.5px; margin-bottom:4px; }
    .meta-val { font-size:13px; font-weight:600; color:#555; }
    .meta-val.active,.meta-val.verified { color:#27ae60; }
    .btn-save { width:100%; padding:12px; background:#4a90e2; color:#fff; border:none; border-radius:8px; font-size:15px; font-weight:600; cursor:pointer; margin-top:8px; }
    .btn-save:disabled { opacity:.7; cursor:not-allowed; }
    .loading { color:#aaa; text-align:center; padding:20px; }
    @media(max-width:700px) { .panels { grid-template-columns:1fr; } }
  `]
})
export class ProfileComponent implements OnInit {
  user = signal<User | null>(null);
  pharmacy = signal<Pharmacy | null>(null);
  saving = signal(false);
  saved = signal(false);
  pharmaForm = { name: '', phone: '', email: '', description: '' };

  constructor(private authService: AuthService, private pharmacyService: PharmacyService) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(u => this.user.set(u));
    this.pharmacyService.getMyPharmacy().subscribe(ph => {
      this.pharmacy.set(ph);
      this.pharmaForm = { name: ph.name, phone: ph.phone, email: ph.email ?? '', description: ph.description ?? '' };
    });
  }

  savePharmacy(): void {
    const ph = this.pharmacy();
    if (!ph) return;
    this.saving.set(true);
    this.pharmacyService.updatePharmacy(ph.id, this.pharmaForm).subscribe({
      next: () => {
        this.saving.set(false);
        this.saved.set(true);
        setTimeout(() => this.saved.set(false), 3000);
      },
      error: () => this.saving.set(false)
    });
  }

  initials(): string {
    const u = this.user();
    if (!u) return '?';
    return `${u.firstName[0]}${u.lastName[0]}`.toUpperCase();
  }

  roleLabel(r: string): string {
    const m: Record<string,string> = { ADMIN:'Administrateur', PHARMACY_STAFF:'Personnel', PHARMACY_OWNER:'Propriétaire', PATIENT:'Patient' };
    return m[r] ?? r;
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('fr-FR', { day:'2-digit', month:'long', year:'numeric' });
  }
}
