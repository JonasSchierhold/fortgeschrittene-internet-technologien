export interface LoginRequest {
  loginName: string;
  passwort: { passwort: string };
}

export interface LoginResponse {
  sessionID: string;
}

export interface LogoutRequest {
  loginName: string;
  sitzung: string;
}

export interface LogoutResponse {
  ergebnis: boolean;
}
