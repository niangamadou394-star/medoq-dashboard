import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReservationService } from '../../core/services/reservation.service';
import { ReservationStatus } from '../../core/models';

interface MonthStat { label: string; total: number; count: number; }

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h2>Analytiques</h2>
        <p class="subtitle">Performance de votre pharmacie</p>
      </div>

      @if (loading()) {
        <div class="loading">Calcul des statistiques…</div>
      } @else {
        <!-- Summary KPIs -->
        <div class="kpi-row">
          <div class="kpi">
            <span class="kpi-val">{{ stats().totalResas }}</span>
            <span class="kpi-lbl">Total réservations</span>
          </div>
          <div class="kpi">
            <span class="kpi-val">{{ stats().completed }}</span>
            <span class="kpi-lbl">Complétées</span>
          </div>
          <div class="kpi">
            <span class="kpi-val">{{ stats().cancelled }}</span>
            <span class="kpi-lbl">Annulées</span>
          </div>
          <div class="kpi">
            <span class="kpi-val">{{ stats().conversionRate }}%</span>
            <span class="kpi-lbl">Taux de conversion</span>
          </div>
          <div class="kpi green">
            <span class="kpi-val">{{ stats().totalRevenue | number:'1.0-0' }} F</span>
            <span class="kpi-lbl">Chiffre d'affaires</span>
          </div>
        </div>

        <!-- Status breakdown -->
        <div class="panels">
          <div class="panel">
            <h3>Répartition par statut</h3>
            <div class="donut-chart">
              @for (item of statusBreakdown(); track item.label) {
                <div class="breakdown-row">
                  <div class="breakdown-label">
                    <span class="dot" [style.background]="item.color"></span>
                    {{ item.label }}
                  </div>
                  <div class="breakdown-bar-wrap">
                    <div class="breakdown-bar" [style.width.%]="item.pct" [style.background]="item.color"></div>
                  </div>
                  <div class="breakdown-count">{{ item.count }} ({{ item.pct }}%)</div>
                </div>
              }
            </div>
          </div>

          <div class="panel">
            <h3>Revenu moyen par réservation</h3>
            <div class="big-number">
              <span class="big-val">{{ stats().avgRevenue | number:'1.0-0' }}</span>
              <span class="big-unit">FCFA</span>
            </div>
            <p class="insight">Basé sur {{ stats().completed }} réservations complétées</p>
            <div class="trend">
              <span class="trend-icon">📈</span>
              <span>Performance globale: <strong>{{ stats().conversionRate >= 70 ? 'Excellente' : stats().conversionRate >= 50 ? 'Bonne' : 'À améliorer' }}</strong></span>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .page { max-width:1100px; }
    .page-header { margin-bottom:24px; }
    h2 { margin:0 0 4px; font-size:24px; color:#1a1a2e; }
    .subtitle { margin:0; color:#888; font-size:14px; }
    .kpi-row { display:grid; grid-template-columns:repeat(auto-fit,minmax(160px,1fr)); gap:14px; margin-bottom:24px; }
    .kpi { background:#fff; border-radius:12px; padding:20px; box-shadow:0 2px 8px rgba(0,0,0,.06); text-align:center; border-top:3px solid #4a90e2; }
    .kpi.green { border-top-color:#27ae60; }
    .kpi-val { display:block; font-size:22px; font-weight:700; color:#1a1a2e; margin-bottom:4px; }
    .kpi-lbl { font-size:12px; color:#888; }
    .panels { display:grid; grid-template-columns:1fr 1fr; gap:20px; }
    .panel { background:#fff; border-radius:12px; padding:24px; box-shadow:0 2px 8px rgba(0,0,0,.06); }
    .panel h3 { margin:0 0 20px; font-size:16px; color:#1a1a2e; }
    .breakdown-row { display:flex; align-items:center; gap:12px; margin-bottom:12px; }
    .breakdown-label { display:flex; align-items:center; gap:6px; font-size:13px; color:#555; width:120px; flex-shrink:0; }
    .dot { width:10px; height:10px; border-radius:50%; flex-shrink:0; }
    .breakdown-bar-wrap { flex:1; height:8px; background:#f0f0f0; border-radius:4px; overflow:hidden; }
    .breakdown-bar { height:100%; border-radius:4px; transition:width .5s; }
    .breakdown-count { font-size:12px; color:#888; width:80px; text-align:right; flex-shrink:0; }
    .big-number { text-align:center; margin:30px 0 10px; }
    .big-val { font-size:48px; font-weight:700; color:#4a90e2; }
    .big-unit { font-size:18px; color:#888; margin-left:4px; }
    .insight { text-align:center; color:#888; font-size:13px; }
    .trend { display:flex; align-items:center; gap:8px; background:#f0f7ff; border-radius:8px; padding:12px 16px; margin-top:16px; font-size:14px; }
    .trend-icon { font-size:20px; }
    .loading { background:#fff; border-radius:12px; padding:60px; text-align:center; color:#aaa; box-shadow:0 2px 8px rgba(0,0,0,.06); }
    @media(max-width:700px) { .panels { grid-template-columns:1fr; } }
  `]
})
export class AnalyticsComponent implements OnInit {
  loading = signal(true);
  stats = signal({ totalResas:0, completed:0, cancelled:0, conversionRate:0, totalRevenue:0, avgRevenue:0 });
  statusBreakdown = signal<{ label:string; count:number; pct:number; color:string }[]>([]);

  constructor(private resaService: ReservationService) {}

  ngOnInit(): void {
    this.resaService.getMyPharmacyReservations(0, 200).subscribe({
      next: (data) => {
        const all = data.content;
        const total = all.length;
        const byStatus = (s: ReservationStatus) => all.filter(r => r.status === s).length;
        const completed = byStatus(ReservationStatus.COMPLETED);
        const cancelled = byStatus(ReservationStatus.CANCELLED);
        const revenue = all.filter(r => r.status === ReservationStatus.COMPLETED).reduce((s,r) => s+r.totalAmount, 0);

        this.stats.set({
          totalResas: total,
          completed,
          cancelled,
          conversionRate: total ? Math.round((completed/total)*100) : 0,
          totalRevenue: revenue,
          avgRevenue: completed ? Math.round(revenue/completed) : 0
        });

        const colors: Record<string,string> = {
          COMPLETED:'#27ae60', CONFIRMED:'#4a90e2', PENDING:'#f39c12',
          CANCELLED:'#e74c3c', READY:'#8e44ad', EXPIRED:'#aaa'
        };
        const labels: Record<string,string> = {
          COMPLETED:'Complétées', CONFIRMED:'Confirmées', PENDING:'En attente',
          CANCELLED:'Annulées', READY:'Prêtes', EXPIRED:'Expirées'
        };

        this.statusBreakdown.set(
          Object.entries(ReservationStatus).map(([k]) => ({
            label: labels[k] ?? k,
            count: byStatus(k as ReservationStatus),
            pct: total ? Math.round((byStatus(k as ReservationStatus)/total)*100) : 0,
            color: colors[k] ?? '#ccc'
          })).filter(x => x.count > 0)
        );

        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }
}
