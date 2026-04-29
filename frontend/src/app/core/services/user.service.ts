import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User, ApiResponse, CheckLoginResponse, UserListResponse } from '../models';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  addUser(user: User): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.apiUrl}/addUser`, user);
  }

  checkLoginName(loginName: string): Observable<CheckLoginResponse> {
    const params = new HttpParams().set('id', loginName);
    return this.http.get<CheckLoginResponse>(`${this.apiUrl}/checkLoginName`, { params });
  }

  getBenutzer(loginName: string, session: string): Observable<UserListResponse> {
    const params = new HttpParams()
      .set('login', loginName)
      .set('session', session);
    return this.http.get<UserListResponse>(`${this.apiUrl}/getBenutzer`, { params });
  }
}
