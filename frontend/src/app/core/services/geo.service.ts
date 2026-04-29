import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PostalCodeResponse } from '../models';

@Injectable({ providedIn: 'root' })
export class GeoService {
  private readonly apiUrl = environment.apiUrl;
  private readonly geoNamesUsername = environment.geoNamesUsername;

  constructor(private readonly http: HttpClient) {}

  getOrtByPlz(plz: string): Observable<PostalCodeResponse> {
    const params = new HttpParams()
      .set('postalcode', plz)
      .set('username', this.geoNamesUsername);
    return this.http.get<PostalCodeResponse>(`${this.apiUrl}/getOrt`, { params });
  }
}
