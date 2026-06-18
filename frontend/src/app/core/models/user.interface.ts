export interface User {
  loginName: string;
  passwort: Passwort;
  vorname: string;
  nachname: string;
  strasse: string;
  plz: string;
  ort: string;
  land: string;
  telefon: string;
  email: Email;
}

export interface Passwort {
  passwort: string;
}

export interface Email {
  adresse: string;
}

export interface UserListEntry {
  loginName: string;
  vorname: string;
  nachname: string;
  strasse?: string;
  plz?: string;
  ort?: string;
  land?: string;
}

export interface UserListResponse {
  benutzerliste: UserListEntry[];
}
