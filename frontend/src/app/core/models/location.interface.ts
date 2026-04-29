export interface Standort {
  breitengrad: number;
  laengengrad: number;
}

export interface SetStandortRequest {
  loginName: string;
  sitzung: string;
  standort: Standort;
}

export interface StandortResponse {
  ergebnis: boolean;
}
