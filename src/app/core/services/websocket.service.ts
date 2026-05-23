import { Injectable, OnDestroy } from '@angular/core';
import { Client, IMessage, StompConfig } from '@stomp/stompjs';
import { Subject, Observable, BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Reservation } from '../models';
import { AuthService } from './auth.service';

export enum WsConnectionState {
  DISCONNECTED = 'DISCONNECTED',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  ERROR = 'ERROR'
}

@Injectable({ providedIn: 'root' })
export class WebSocketService implements OnDestroy {
  private client: Client | null = null;
  private newReservations$ = new Subject<Reservation>();
  private connectionState$ = new BehaviorSubject<WsConnectionState>(WsConnectionState.DISCONNECTED);
  private audioCtx: AudioContext | null = null;

  constructor(private authService: AuthService) {}

  connect(pharmacyId: string): void {
    if (this.client?.active) return;

    const token = this.authService.getAccessToken();

    const config: StompConfig = {
      brokerURL: environment.wsUrl,
      connectHeaders: {
        Authorization: `Bearer ${token ?? ''}`
      },
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      reconnectDelay: 5000,
      onConnect: () => {
        this.connectionState$.next(WsConnectionState.CONNECTED);
        this.subscribeToPharmacyReservations(pharmacyId);
      },
      onDisconnect: () => {
        this.connectionState$.next(WsConnectionState.DISCONNECTED);
      },
      onStompError: (frame) => {
        console.error('STOMP error:', frame);
        this.connectionState$.next(WsConnectionState.ERROR);
      }
    };

    this.client = new Client(config);
    this.connectionState$.next(WsConnectionState.CONNECTING);
    this.client.activate();
  }

  disconnect(): void {
    if (this.client?.active) {
      this.client.deactivate();
      this.connectionState$.next(WsConnectionState.DISCONNECTED);
    }
  }

  getNewReservations(): Observable<Reservation> {
    return this.newReservations$.asObservable();
  }

  getConnectionState(): Observable<WsConnectionState> {
    return this.connectionState$.asObservable();
  }

  private subscribeToPharmacyReservations(pharmacyId: string): void {
    if (!this.client?.active) return;

    this.client.subscribe(`/topic/pharmacy/${pharmacyId}/reservations`, (message: IMessage) => {
      try {
        const reservation: Reservation = JSON.parse(message.body);
        this.newReservations$.next(reservation);
        this.playNotificationSound();
      } catch (e) {
        console.error('Error parsing WS message:', e);
      }
    });
  }

  playNotificationSound(): void {
    try {
      if (!this.audioCtx) {
        this.audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      }

      const ctx = this.audioCtx;

      // Create a pleasant two-tone beep
      const playTone = (frequency: number, startTime: number, duration: number) => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(frequency, startTime);

        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      };

      const now = ctx.currentTime;
      playTone(880, now, 0.15);
      playTone(1100, now + 0.18, 0.2);
    } catch (e) {
      console.warn('Could not play notification sound:', e);
    }
  }

  ngOnDestroy(): void {
    this.disconnect();
    this.newReservations$.complete();
  }
}
