import { Component, OnInit, OnDestroy } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { LocationService, AuthService } from '../../../core/services';
import { Standort } from '../../../core/models';

@Component({
  selector: 'app-location',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    DecimalPipe,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSnackBarModule,
    MatIconModule
  ],
  templateUrl: './location.component.html',
  styleUrl: './location.component.sass'
})
export class LocationComponent implements OnInit, OnDestroy {
  locationForm: FormGroup;
  currentStandort: Standort | null = null;
  autoUpdateActive = false;
  mapUrl: SafeResourceUrl | null = null;
  private intervalId: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly fb: FormBuilder,
    private readonly locationService: LocationService,
    private readonly authService: AuthService,
    private readonly snackBar: MatSnackBar,
    private readonly sanitizer: DomSanitizer
  ) {
    this.locationForm = this.fb.group({
      breitengrad: [null, [Validators.required, Validators.min(-90), Validators.max(90)]],
      laengengrad: [null, [Validators.required, Validators.min(-180), Validators.max(180)]]
    });
  }

  ngOnInit(): void {
    this.loadCurrentStandort();
  }

  ngOnDestroy(): void {
    this.stopAutoUpdate();
  }

  loadCurrentStandort(): void {
    const loginName = this.authService.loginName();
    if (!loginName) return;

    this.locationService.getStandort(loginName).subscribe({
      next: (standort) => {
        if (standort.breitengrad && standort.laengengrad) {
          this.currentStandort = standort;
          this.locationForm.patchValue(standort);
          this.updateMapUrl(standort);
        }
      }
    });
  }

  onSubmit(): void {
    if (this.locationForm.invalid) return;

    const standort: Standort = this.locationForm.value;
    this.locationService.setStandort(standort).subscribe({
      next: (response) => {
        if (response.ergebnis) {
          this.currentStandort = standort;
          this.updateMapUrl(standort);
          this.snackBar.open('Standort erfolgreich gesetzt!', 'OK', { duration: 3000 });
        } else {
          this.snackBar.open('Standort konnte nicht gesetzt werden.', 'OK', { duration: 5000 });
        }
      },
      error: () => {
        this.snackBar.open('Fehler beim Setzen des Standorts.', 'OK', { duration: 5000 });
      }
    });
  }

  useCurrentPosition(): void {
    if (!navigator.geolocation) {
      this.snackBar.open('Geolocation wird nicht unterstützt.', 'OK', { duration: 3000 });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.locationForm.patchValue({
          breitengrad: position.coords.latitude,
          laengengrad: position.coords.longitude
        });
      },
      () => {
        this.snackBar.open('Standort konnte nicht ermittelt werden.', 'OK', { duration: 3000 });
      }
    );
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
    this.snackBar.open('Automatische Standortmeldung aktiviert (alle 30s)', 'OK', { duration: 3000 });
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
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const standort: Standort = {
          breitengrad: position.coords.latitude,
          laengengrad: position.coords.longitude
        };
        this.locationService.setStandort(standort).subscribe({
          next: (response) => {
            if (response.ergebnis) {
              this.currentStandort = standort;
              this.locationForm.patchValue(standort);
              this.updateMapUrl(standort);
            }
          }
        });
      }
    );
  }

  private updateMapUrl(standort: Standort): void {
    const url = `https://www.openstreetmap.org/export/embed.html?bbox=${standort.laengengrad - 0.01},${standort.breitengrad - 0.01},${standort.laengengrad + 0.01},${standort.breitengrad + 0.01}&layer=mapnik&marker=${standort.breitengrad},${standort.laengengrad}`;
    this.mapUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }
}
