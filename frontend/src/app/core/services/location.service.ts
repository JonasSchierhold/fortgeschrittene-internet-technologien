import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Standort, SetStandortRequest, StandortResponse } from '../models';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class LocationService {
  private readonly apiUrl = environment.apiUrl;

  constructor(
    private readonly http: HttpClient,
    private readonly authService: AuthService
  ) {}

  setStandort(standort: Standort): Observable<StandortResponse> {
    const body: SetStandortRequest = {
      loginName: this.authService.loginName()!,
      sitzung: this.authService.sessionId()!,
      standort
    };
    return this.http.put<StandortResponse>(`${this.apiUrl}/setStandort`, body);
  }

  getStandort(benutzerId: string): Observable<Standort> {
    const params = new HttpParams()
      .set('login', this.authService.loginName()!)
      .set('session', this.authService.sessionId()!)
      .set('id', benutzerId);
    return this.http.get<Standort>(`${this.apiUrl}/getStandort`, { params });
  }

  getStandortPerAdresse(land: string, plz: string, ort: string, strasse: string): Observable<Standort> {
    const params = new HttpParams()
      .set('land', land)
      .set('plz', plz)
      .set('ort', ort)
      .set('strasse', strasse);
    return this.http.get<Standort>(`${this.apiUrl}/getStandortPerAdresse`, { params });
  }
}
