import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="login-page">
      <div class="login-card">
        <div class="login-brand">
          <span class="brand-icon">💊</span>
          <h1>Medoq</h1>
          <p>Tableau de bord Pharmacie</p>
        </div>

        <form (ngSubmit)="onLogin()" class="login-form">
          <div class="field" [class.error]="fieldError('phone')">
            <label>Téléphone</label>
            <input type="tel" [(ngModel)]="phone" name="phone"
              placeholder="+221 77 000 00 00" required autocomplete="tel" />
            @if (fieldError('phone')) { <span class="err-msg">{{ fieldError('phone') }}</span> }
          </div>

          <div class="field" [class.error]="fieldError('password')">
            <label>Mot de passe</label>
            <div class="pass-wrap">
              <input [type]="showPass() ? 'text' : 'password'"
                [(ngModel)]="password" name="password" required autocomplete="current-password" />
              <button type="button" class="toggle-pass" (click)="togglePass()">
                {{ showPass() ? '🙈' : '👁️' }}
              </button>
            </div>
            @if (fieldError('password')) { <span class="err-msg">{{ fieldError('password') }}</span> }
          </div>

          @if (apiError()) {
            <div class="alert-error">{{ apiError() }}</div>
          }

          <button type="submit" class="btn-login" [disabled]="loading()">
            @if (loading()) { <span class="spinner"></span> Connexion… }
            @else { Se connecter }
          </button>
        </form>

        <p class="register-link">
          Nouvelle pharmacie ?
          <a routerLink="/auth/register-pharmacy">Créer un compte</a>
        </p>
      </div>
    </div>
  `,
  styles: [`
    .login-page { min-height:100vh; display:flex; align-items:center; justify-content:center; background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%); padding:20px; }
    .login-card { background:#fff; border-radius:16px; padding:40px; width:100%; max-width:400px; box-shadow:0 20px 60px rgba(0,0,0,.3); }
    .login-brand { text-align:center; margin-bottom:32px; }
    .brand-icon { font-size:48px; }
    h1 { margin:8px 0 4px; font-size:28px; color:#1a1a2e; }
    .login-brand p { color:#888; font-size:14px; }
    .field { margin-bottom:20px; }
    label { display:block; font-size:13px; font-weight:600; color:#444; margin-bottom:6px; }
    input { width:100%; padding:12px 14px; border:1.5px solid #e0e0e0; border-radius:8px; font-size:15px; outline:none; box-sizing:border-box; transition:border .15s; }
    input:focus { border-color:#4a90e2; }
    .field.error input { border-color:#e74c3c; }
    .err-msg { font-size:12px; color:#e74c3c; margin-top:4px; display:block; }
    .pass-wrap { position:relative; }
    .pass-wrap input { padding-right:44px; }
    .toggle-pass { position:absolute; right:10px; top:50%; transform:translateY(-50%); background:none; border:none; cursor:pointer; font-size:18px; }
    .alert-error { background:#fef0ef; border:1px solid #f5c6c0; border-radius:8px; padding:12px; color:#c0392b; font-size:14px; margin-bottom:16px; }
    .btn-login { width:100%; padding:14px; background:#4a90e2; color:#fff; border:none; border-radius:8px; font-size:16px; font-weight:600; cursor:pointer; transition:background .15s; display:flex; align-items:center; justify-content:center; gap:8px; }
    .btn-login:hover:not(:disabled) { background:#357abd; }
    .btn-login:disabled { opacity:.7; cursor:not-allowed; }
    .spinner { width:18px; height:18px; border:2px solid rgba(255,255,255,.4); border-top-color:#fff; border-radius:50%; animation:spin .6s linear infinite; }
    @keyframes spin { to { transform:rotate(360deg); } }
    .register-link { text-align:center; margin-top:20px; font-size:14px; color:#888; }
    .register-link a { color:#4a90e2; text-decoration:none; font-weight:600; }
  `]
})
export class LoginComponent {
  phone = '';
  password = '';
  loading = signal(false);
  showPass = signal(false);
  apiError = signal('');
  errors = signal<Record<string, string>>({});

  constructor(private auth: AuthService, private router: Router) {}

  togglePass(): void { this.showPass.update(v => !v); }
  fieldError(k: string): string { return this.errors()[k] ?? ''; }

  onLogin(): void {
    const errs: Record<string, string> = {};
    if (!this.phone) errs['phone'] = 'Téléphone requis';
    if (!this.password) errs['password'] = 'Mot de passe requis';
    this.errors.set(errs);
    if (Object.keys(errs).length > 0) return;

    this.loading.set(true);
    this.apiError.set('');
    this.auth.login(this.phone, this.password).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (e) => {
        this.apiError.set(e?.error?.message ?? 'Identifiants incorrects');
        this.loading.set(false);
      }
    });
  }
}
