import { Component, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule, DecimalPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatListModule } from '@angular/material/list';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { LocationService, AuthService, GeoService } from '../../../core/services';
import { WatchlistService, WatchedUser } from '../../../core/services/watchlist.service';
import { Standort } from '../../../core/models';
import { AddUserDialogComponent } from '../../monitoring/add-user-dialog/add-user-dialog.component';
import * as L from 'leaflet';

@Component({
  selector: 'app-location',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DecimalPipe,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSnackBarModule,
    MatIconModule,
    MatDialogModule,
    MatListModule,
    MatChipsModule,
    MatTooltipModule,
  ],
  templateUrl: './location.component.html',
  styleUrl: './location.component.sass',
})
export class LocationComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('map', { static: false }) mapElement!: ElementRef;

  locationForm: FormGroup;
  currentStandort: Standort | null = null;
  autoUpdateActive = false;
  watchedUsers: WatchedUser[] = [];
  land = 'Deutschland';

  private map: L.Map | null = null;
  private ownMarker: L.Marker | null = null;
  private friendMarkers = new Map<string, L.Marker>();
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private pollingInterval: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly fb: FormBuilder,
    private readonly locationService: LocationService,
    private readonly authService: AuthService,
    private readonly geoService: GeoService,
    public readonly watchlistService: WatchlistService,
    private readonly dialog: MatDialog,
    private readonly snackBar: MatSnackBar,
  ) {
    this.locationForm = this.fb.group({
      strasse: ['', Validators.required],
      plz: ['', [Validators.required, Validators.pattern(/^\d{4,5}$/)]],
      ort: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.watchedUsers = this.watchlistService.watchedUsers();
    this.loadCurrentStandort();
    this.startFriendPolling();
  }

  ngAfterViewInit(): void {
    this.initMap();
  }

  ngOnDestroy(): void {
    this.stopAutoUpdate();
    this.stopFriendPolling();
    if (this.map) {
      this.map.remove();
    }
  }

  loadCurrentStandort(): void {
    const loginName = this.authService.loginName();
    if (!loginName) return;

    this.locationService.getStandort(loginName).subscribe({
      next: (standort) => {
        if (standort.breitengrad && standort.laengengrad) {
          this.currentStandort = standort;
          this.updateOwnMarker(standort);
        }
      },
    });
  }

  onPlzBlur(): void {
    const plz = this.locationForm.get('plz')?.value;
    if (plz && plz.length >= 4) {
      this.geoService.getOrtByPlz(plz).subscribe({
        next: (response) => {
          if (response.postalCodes && response.postalCodes.length > 0) {
            response.postalCodes = response.postalCodes.filter((entry) => entry.countryCode === 'DE');
            if (response.postalCodes.length > 0) {
              this.locationForm.patchValue({ ort: response.postalCodes[0].placeName });
            }
          }
        },
        error: () => {
          this.snackBar.open('Ort konnte nicht ermittelt werden.', 'OK', { duration: 3000 });
        },
      });
    }
  }

  onSubmit(): void {
    if (this.locationForm.invalid) return;

    const formValue = this.locationForm.value;
    this.watchedUsers = this.watchedUsers.filter(u => u.loginName !== this.authService.loginName());
    
    this.locationService.getStandortPerAdresse(
      this.land,
      formValue.plz,
      formValue.ort,
      formValue.strasse
    ).subscribe({
      next: (standort) => {
        if (standort.breitengrad && standort.laengengrad) {
          this.locationService.setStandort(standort).subscribe({
            next: (response) => {
              if (response.ergebnis) {
                console.log(this.watchedUsers)
                this.currentStandort = standort;
                this.updateOwnMarker(standort);
                this.snackBar.open('Standort erfolgreich gesetzt!', 'OK', { duration: 3000 });
              } else {
                this.snackBar.open('Standort konnte nicht gesetzt werden.', 'OK', { duration: 5000 });
              }
            },
            error: () => {
              this.snackBar.open('Fehler beim Setzen des Standorts.', 'OK', { duration: 5000 });
            },
          });
        } else {
          this.snackBar.open('Koordinaten konnten nicht ermittelt werden.', 'OK', { duration: 5000 });
        }
      },
      error: () => {
        this.snackBar.open('Fehler beim Abrufen der Koordinaten.', 'OK', { duration: 5000 });
      }
    });
  }

  toggleAutoUpdate(): void {
    if (this.autoUpdateActive) {
      this.stopAutoUpdate();
    } else {
      this.startAutoUpdate();
    }
  }

  private startAutoUpdate(): void {
    this.autoUpdateActive = true;
    this.sendCurrentPosition();
    this.intervalId = setInterval(() => this.sendCurrentPosition(), 30000);
    this.snackBar.open('Automatische Standortmeldung aktiviert (alle 30s)', 'OK', {
      duration: 3000,
    });
  }

  private stopAutoUpdate(): void {
    this.autoUpdateActive = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.snackBar.open('Automatische Standortmeldung deaktiviert', 'OK', { duration: 3000 });
  }

  private sendCurrentPosition(): void {
    if (this.locationForm.invalid) return;

    const formValue = this.locationForm.value;
    this.locationService.getStandortPerAdresse(
      this.land,
      formValue.plz,
      formValue.ort,
      formValue.strasse
    ).subscribe({
      next: (standort) => {
        if (standort.breitengrad && standort.laengengrad) {
          this.locationService.setStandort(standort).subscribe({
            next: (response) => {
              if (response.ergebnis) {
                this.currentStandort = standort;
                this.updateOwnMarker(standort);
              }
            },
          });
        }
      }
    });
  }

  // Map methods
  private initMap(): void {
    // Initialize map centered on Germany
    this.map = L.map(this.mapElement.nativeElement).setView([51.1657, 10.4515], 6);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(this.map);

    // Don't create marker here - wait for loadCurrentStandort to complete
    this.refreshFriendPositions();
  }

  private updateOwnMarker(standort: Standort): void {
    if (!this.map) return;

    // Remove ALL markers from the map first (nuclear option)
    this.map.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        this.map?.removeLayer(layer);
      }
    });
    
    // Clear the reference
    this.ownMarker = null;
    
    // Clear friend markers map
    this.friendMarkers.clear();

    // Create new marker with icon
    const icon = L.icon({
      iconUrl:
        'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    });

    this.ownMarker = L.marker([standort.breitengrad, standort.laengengrad], { icon })
      .bindPopup('<b>Mein Standort</b>')
      .addTo(this.map);

    // Re-add friend markers
    for (const user of this.watchedUsers) {
      if (user.standort) {
        this.updateFriendMarker(user);
      }
    }

    this.map.setView([standort.breitengrad, standort.laengengrad], 13);
  }

  private updateFriendMarker(user: WatchedUser): void {
    if (!this.map || !user.standort) return;

    // Remove old marker completely if it exists
    const existingMarker = this.friendMarkers.get(user.loginName);
    if (existingMarker) {
      existingMarker.remove();
      this.friendMarkers.delete(user.loginName);
    }

    // Create new marker
    const markerColor = user.color || 'green';
    const icon = L.icon({
      iconUrl: this.watchlistService.getMarkerIconUrl(markerColor),
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    });

    const marker = L.marker([user.standort.breitengrad, user.standort.laengengrad], { icon })
      .bindPopup(`<b>${user.vorname} ${user.nachname}</b><br>${user.loginName}`)
      .addTo(this.map);

    this.friendMarkers.set(user.loginName, marker);
  }

  private removeFriendMarker(loginName: string): void {
    const marker = this.friendMarkers.get(loginName);
    if (marker && this.map) {
      this.map.removeLayer(marker);
      this.friendMarkers.delete(loginName);
    }
  }

  // Friend management methods
  openAddUserDialog(): void {
    const dialogRef = this.dialog.open(AddUserDialogComponent, {
      width: '400px',
    });

    dialogRef.afterClosed().subscribe((user) => {
      if (user) {
        this.watchlistService.addUser(user);
        this.watchedUsers = this.watchlistService.watchedUsers();
        this.refreshFriendPosition(user.loginName);
        this.snackBar.open(`${user.vorname} ${user.nachname} zur Karte hinzugefügt.`, 'OK', {
          duration: 3000,
        });
      }
    });
  }

  removeUser(loginName: string): void {
    this.watchlistService.removeUser(loginName);
    this.watchedUsers = this.watchlistService.watchedUsers();
    this.removeFriendMarker(loginName);
    this.snackBar.open('Benutzer von der Karte entfernt.', 'OK', { duration: 3000 });
  }

  zoomToFriend(loginName: string): void {
    const user = this.watchedUsers.find((u) => u.loginName === loginName);
    if (!this.map || !user?.standort) return;

    // If we have both own position and friend position, fit bounds to show both
    if (this.currentStandort) {
      const bounds = L.latLngBounds([
        [this.currentStandort.breitengrad, this.currentStandort.laengengrad],
        [user.standort.breitengrad, user.standort.laengengrad],
      ]);
      this.map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    } else {
      // Otherwise just center on friend
      this.map.setView([user.standort.breitengrad, user.standort.laengengrad], 13);
    }
  }

  refreshFriendPositions(): void {
    for (const user of this.watchedUsers) {
      this.refreshFriendPosition(user.loginName);
    }
  }

  private refreshFriendPosition(loginName: string): void {
    this.locationService.getStandort(loginName).subscribe({
      next: (standort) => {
        if (standort.breitengrad && standort.laengengrad) {
          this.watchlistService.updateStandort(loginName, standort);
          this.watchedUsers = this.watchlistService.watchedUsers();
          const user = this.watchedUsers.find((u) => u.loginName === loginName);
          if (user) {
            this.updateFriendMarker(user);
          }
        }
      },
    });
  }

  private startFriendPolling(): void {
    this.pollingInterval = setInterval(() => this.refreshFriendPositions(), 30000);
  }

  private stopFriendPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }
}
