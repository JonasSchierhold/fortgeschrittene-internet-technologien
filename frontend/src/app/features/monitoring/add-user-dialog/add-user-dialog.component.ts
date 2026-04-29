import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { UserService, AuthService } from '../../../core/services';
import { WatchlistService } from '../../../core/services/watchlist.service';
import { UserListEntry } from '../../../core/models';

@Component({
  selector: 'app-add-user-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatListModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule
  ],
  templateUrl: './add-user-dialog.component.html',
  styleUrl: './add-user-dialog.component.sass'
})
export class AddUserDialogComponent implements OnInit {
  users: UserListEntry[] = [];
  filteredUsers: UserListEntry[] = [];
  searchText = '';

  constructor(
    private readonly dialogRef: MatDialogRef<AddUserDialogComponent>,
    private readonly userService: UserService,
    private readonly authService: AuthService,
    private readonly watchlistService: WatchlistService
  ) {}

  ngOnInit(): void {
    const loginName = this.authService.loginName();
    const session = this.authService.sessionId();
    if (loginName && session) {
      this.userService.getBenutzer(loginName, session).subscribe({
        next: (response) => {
          // Filter: eigener User und bereits beobachtete nicht anzeigen
          this.users = response.benutzerliste.filter(
            u => u.loginName !== loginName && !this.watchlistService.isWatched(u.loginName)
          );
          this.filteredUsers = this.users;
        }
      });
    }
  }

  filterUsers(): void {
    const search = this.searchText.toLowerCase();
    this.filteredUsers = this.users.filter(u =>
      u.loginName.toLowerCase().includes(search) ||
      u.vorname.toLowerCase().includes(search) ||
      u.nachname.toLowerCase().includes(search)
    );
  }

  selectUser(user: UserListEntry): void {
    this.dialogRef.close(user);
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
