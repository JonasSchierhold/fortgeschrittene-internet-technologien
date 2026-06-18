import { Injectable, signal, computed } from '@angular/core';
import { Standort, UserListEntry } from '../models';

export interface WatchedUser {
  loginName: string;
  vorname?: string;
  nachname?: string;
  standort?: Standort;
  color?: string;
}

@Injectable({ providedIn: 'root' })
export class WatchlistService {
  private readonly STORAGE_KEY = 'watchlist';
  private readonly _watchedUsers = signal<WatchedUser[]>(this.loadFromStorage());

  private readonly COLOR_PALETTE = ['red', 'green', 'orange', 'gold', 'violet', 'grey', 'black'];

  readonly watchedUsers = this._watchedUsers.asReadonly();
  readonly count = computed(() => this._watchedUsers().length);

  addUser(user: UserListEntry): void {
    const current = this._watchedUsers();
    if (!current.find(u => u.loginName === user.loginName)) {
      const color = this.getRandomColor();
      const updated = [...current, { 
        loginName: user.loginName, 
        vorname: user.vorname, 
        nachname: user.nachname,
        color 
      }];
      this._watchedUsers.set(updated);
      this.saveToStorage(updated);
    }
  }

  private getRandomColor(): string {
    return this.COLOR_PALETTE[Math.floor(Math.random() * this.COLOR_PALETTE.length)];
  }

  getMarkerIconUrl(color: string): string {
    return `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`;
  }

  getColorStyle(color: string): string {
    const colorMap: { [key: string]: string } = {
      'red': '#d63e2a',
      'green': '#72b026',
      'orange': '#f59f00',
      'gold': '#f7c900',
      'violet': '#a23bab',
      'grey': '#575757',
      'black': '#2c2c2c'
    };
    return colorMap[color] || '#575757';
  }

  removeUser(loginName: string): void {
    const updated = this._watchedUsers().filter(u => u.loginName !== loginName);
    this._watchedUsers.set(updated);
    this.saveToStorage(updated);
  }

  updateStandort(loginName: string, standort: Standort): void {
    const updated = this._watchedUsers().map(u =>
      u.loginName === loginName ? { ...u, standort } : u
    );
    this._watchedUsers.set(updated);
  }

  isWatched(loginName: string): boolean {
    return this._watchedUsers().some(u => u.loginName === loginName);
  }

  private loadFromStorage(): WatchedUser[] {
    const data = localStorage.getItem(this.STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  private saveToStorage(users: WatchedUser[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(users));
  }
}
