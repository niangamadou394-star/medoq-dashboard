import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-pharmacy-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="reg-page">
      <div class="reg-card">
        <div class="reg-brand">
          <span>💊</span>
          <h1>Enregistrer votre pharmacie</h1>
          <p>Rejoignez le réseau Medoq</p>
        </div>

        <form (ngSubmit)="onRegister()" class="reg-form">
          <h3 class="section-title">Informations personnelles</h3>
          <div class="row-2">
            <div class="field">
              <label>Prénom *</label>
              <input type="text" [(ngModel)]="form.firstName" name="firstName" placeholder="Amadou" />
            </div>
            <div class="field">
              <label>Nom *</label>
              <input type="text" [(ngModel)]="form.lastName" name="lastName" placeholder="Niang" />
            </div>
          </div>
          <div class="field">
            <label>Téléphone *</label>
            <input type="tel" [(ngModel)]="form.phone" name="phone" placeholder="+221 77 XXX XX XX" />
          </div>
          <div class="field">
            <label>Mot de passe *</label>
            <input type="password" [(ngModel)]="form.password" name="password" />
          </div>

          <h3 class="section-title">Informations de la pharmacie</h3>
          <div class="field">
            <label>Nom de la pharmacie *</label>
            <input type="text" [(ngModel)]="form.pharmacyName" name="pharmacyName" placeholder="Pharmacie Centrale" />
          </div>
          <div class="field">
            <label>N° de licence *</label>
            <input type="text" [(ngModel)]="form.licenseNumber" name="licenseNumber" placeholder="PH-DK-2024-001" />
          </div>
          <div class="field">
            <label>Adresse *</label>
            <input type="text" [(ngModel)]="form.address" name="address" placeholder="Avenue Léopold Sédar Senghor, Dakar" />
          </div>

          @if (apiError()) {
            <div class="alert-error">{{ apiError() }}</div>
          }
          @if (success()) {
            <div class="alert-success">Compte créé ! Redirection vers la connexion…</div>
          }

          <button type="submit" class="btn-submit" [disabled]="loading()">
            @if (loading()) { Création du compte… } @else { Créer le compte }
          </button>
        </form>

        <p class="login-link">
          Déjà un compte ? <a routerLink="/auth/login">Se connecter</a>
        </p>
      </div>
    </div>
  `,
  styles: [`
    .reg-page { min-height:100vh; display:flex; align-items:center; justify-content:center; background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%); padding:20px; }
    .reg-card { background:#fff; border-radius:16px; padding:36px; width:100%; max-width:520px; box-shadow:0 20px 60px rgba(0,0,0,.3); }
    .reg-brand { text-align:center; margin-bottom:24px; }
    .reg-brand span { font-size:40px; }
    h1 { margin:8px 0 4px; font-size:22px; color:#1a1a2e; }
    .reg-brand p { color:#888; font-size:13px; }
    .section-title { font-size:13px; text-transform:uppercase; letter-spacing:.8px; color:#888; margin:20px 0 12px; border-bottom:1px solid #eee; padding-bottom:6px; }
    .field { margin-bottom:14px; }
    .row-2 { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
    label { display:block; font-size:12px; font-weight:600; color:#555; margin-bottom:4px; }
    input { width:100%; padding:10px 12px; border:1.5px solid #e0e0e0; border-radius:8px; font-size:14px; outline:none; box-sizing:border-box; }
    input:focus { border-color:#4a90e2; }
    .alert-error { background:#fef0ef; border:1px solid #f5c6c0; border-radius:8px; padding:12px; color:#c0392b; font-size:13px; margin-bottom:14px; }
    .alert-success { background:#e8f5e9; border:1px solid #a5d6a7; border-radius:8px; padding:12px; color:#2e7d32; font-size:13px; margin-bottom:14px; }
    .btn-submit { width:100%; padding:13px; background:#4a90e2; color:#fff; border:none; border-radius:8px; font-size:15px; font-weight:600; cursor:pointer; margin-top:8px; }
    .btn-submit:disabled { opacity:.7; cursor:not-allowed; }
    .login-link { text-align:center; margin-top:16px; font-size:13px; color:#888; }
    .login-link a { color:#4a90e2; text-decoration:none; font-weight:600; }
  `]
})
export class PharmacyRegisterComponent {
  loading = signal(false);
  apiError = signal('');
  success = signal(false);
  form = { firstName:'', lastName:'', phone:'', password:'', pharmacyName:'', licenseNumber:'', address:'' };

  constructor(private http: HttpClient, private router: Router) {}

  onRegister(): void {
    this.loading.set(true);
    this.apiError.set('');
    this.http.post(`${environment.apiUrl}/auth/register-pharmacy`, this.form).subscribe({
      next: () => {
        this.success.set(true);
        setTimeout(() => this.router.navigate(['/auth/login']), 1500);
      },
      error: (e) => {
        this.apiError.set(e?.error?.message ?? 'Erreur lors de l\'inscription');
        this.loading.set(false);
      }
    });
  }
}
