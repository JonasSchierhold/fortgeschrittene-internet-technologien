import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { WatchlistService, WatchedUser } from '../../../core/services/watchlist.service';
import { LocationService, UserService, AuthService } from '../../../core/services';
import { UserListEntry } from '../../../core/models';
import { AddUserDialogComponent } from '../add-user-dialog/add-user-dialog.component';

@Component({
  selector: 'app-monitoring',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatListModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDialogModule,
    MatSnackBarModule
  ],
  templateUrl: './monitoring.component.html',
  styleUrl: './monitoring.component.sass'
})
export class MonitoringComponent implements OnInit, OnDestroy {
  watchedUsers: WatchedUser[] = [];
  private pollingInterval: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly watchlistService: WatchlistService,
    private readonly locationService: LocationService,
    private readonly authService: AuthService,
    private readonly dialog: MatDialog,
    private readonly snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.watchedUsers = this.watchlistService.watchedUsers();
    this.refreshPositions();
    this.startPolling();
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }

  openAddUserDialog(): void {
    const dialogRef = this.dialog.open(AddUserDialogComponent, {
      width: '400px'
    });

    dialogRef.afterClosed().subscribe((user: UserListEntry | undefined) => {
      if (user) {
        this.watchlistService.addUser(user);
        this.watchedUsers = this.watchlistService.watchedUsers();
        this.refreshPositionForUser(user.loginName);
        this.snackBar.open(`${user.vorname} ${user.nachname} zur Überwachung hinzugefügt.`, 'OK', { duration: 3000 });
      }
    });
  }

  removeUser(loginName: string): void {
    this.watchlistService.removeUser(loginName);
    this.watchedUsers = this.watchlistService.watchedUsers();
    this.snackBar.open('Benutzer entfernt.', 'OK', { duration: 3000 });
  }

  refreshPositions(): void {
    for (const user of this.watchedUsers) {
      this.refreshPositionForUser(user.loginName);
    }
  }

  private refreshPositionForUser(loginName: string): void {
    this.locationService.getStandort(loginName).subscribe({
      next: (standort) => {
        if (standort.breitengrad && standort.laengengrad) {
          this.watchlistService.updateStandort(loginName, standort);
          this.watchedUsers = this.watchlistService.watchedUsers();
        }
      }
    });
  }

  private startPolling(): void {
    this.pollingInterval = setInterval(() => this.refreshPositions(), 30000);
  }

  private stopPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }
}
