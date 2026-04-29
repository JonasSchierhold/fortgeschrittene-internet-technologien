import { Injectable, signal, computed } from '@angular/core';
import { Standort, UserListEntry } from '../models';

export interface WatchedUser {
  loginName: string;
  vorname?: string;
  nachname?: string;
  standort?: Standort;
}

@Injectable({ providedIn: 'root' })
export class WatchlistService {
  private readonly STORAGE_KEY = 'watchlist';
  private readonly _watchedUsers = signal<WatchedUser[]>(this.loadFromStorage());

  readonly watchedUsers = this._watchedUsers.asReadonly();
  readonly count = computed(() => this._watchedUsers().length);

  addUser(user: UserListEntry): void {
    const current = this._watchedUsers();
    if (!current.find(u => u.loginName === user.loginName)) {
      const updated = [...current, { loginName: user.loginName, vorname: user.vorname, nachname: user.nachname }];
      this._watchedUsers.set(updated);
      this.saveToStorage(updated);
    }
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
