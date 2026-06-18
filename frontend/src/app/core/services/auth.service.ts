import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginRequest, LoginResponse, LogoutRequest, LogoutResponse } from '../models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = environment.apiUrl;

  private readonly _sessionId = signal<string | null>(null);
  private readonly _loginName = signal<string | null>(null);

  readonly sessionId = this._sessionId.asReadonly();
  readonly loginName = this._loginName.asReadonly();
  readonly isLoggedIn = computed(() => !!this._sessionId());

  constructor(private readonly http: HttpClient) {
    this.restoreSession();
  }

  private restoreSession(): void {
    const sessionId = sessionStorage.getItem('sessionId');
    const loginName = sessionStorage.getItem('loginName');
    if (sessionId && loginName) {
      this._sessionId.set(sessionId);
      this._loginName.set(loginName);
    }
  }

  login(loginName: string, passwort: string): Observable<LoginResponse> {
    const body: LoginRequest = {
      loginName,
      passwort: { passwort }
    };
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, body).pipe(
      tap(response => {
        this._sessionId.set(response.sessionID);
        this._loginName.set(loginName);
        sessionStorage.setItem('sessionId', response.sessionID);
        sessionStorage.setItem('loginName', loginName);
      })
    );
  }

  logout(): Observable<LogoutResponse> {
    const body: LogoutRequest = {
      loginName: this._loginName()!,
      sitzung: this._sessionId()!
    };
    return this.http.post<LogoutResponse>(`${this.apiUrl}/logout`, body).pipe(
      tap(() => this.clearSession())
    );
  }

  clearSession(): void {
    this._sessionId.set(null);
    this._loginName.set(null);
    sessionStorage.removeItem('sessionId');
    sessionStorage.removeItem('loginName');
  }
}
