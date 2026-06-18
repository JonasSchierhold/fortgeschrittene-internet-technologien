import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit, input, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import * as L from 'leaflet';

interface LocationData {
  latitude: number;
  longitude: number;
  plz?: string;
  ort?: string;
}

@Component({
  selector: 'app-location-map',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './location-map.component.html',
  styleUrl: './location-map.component.sass',
})
export class LocationMapComponent implements OnInit, AfterViewInit, OnDestroy {
  strasse = input<string>('');
  plz = input<string>('');
  ort = input<string>('');
  land = input<string>('Deutschland');

  @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef;

  private map: L.Map | null = null;
  private marker: L.Marker | null = null;
  isLoading = true;
  locationData: LocationData | null = null;

  constructor() {
    // Reagiere auf Änderungen der Adressinputs
    effect(() => {
      // Lese alle Input-Signale, um den Effect zu registrieren
      const address = `${this.strasse()} ${this.plz()} ${this.ort()} ${this.land()}`;
      
      // Geocode nur, wenn die Karte bereits initialisiert ist
      if (this.map && address.trim().length > 0) {
        this.geocodeAddress();
      }
    });
  }

  ngOnInit(): void {
    // Initial geocoding wird jetzt vom effect übernommen
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.initializeMap();
      // Führe das initiale Geocoding nach der Karteninitialisierung durch
      this.geocodeAddress();
    }, 0);
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
    }
  }

  private initializeMap(): void {
    const mapElement = document.getElementById('map');
    if (!mapElement) {
      console.error('Map container not found');
      return;
    }

    this.map = L.map('map').setView([51.1657, 10.4515], 6); // Center of Germany

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(this.map);

    if (this.locationData) {
      this.addMarker(this.locationData.latitude, this.locationData.longitude);
    }
  }

  private geocodeAddress(): void {
    const address = `${this.strasse()} ${this.plz()} ${this.ort()} ${this.land()}`;
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`;

    fetch(url)
      .then((response) => response.json())
      .then((data) => {
        if (data && data.length > 0) {
          const result = data[0];
          this.locationData = {
            latitude: parseFloat(result.lat),
            longitude: parseFloat(result.lon),
            plz: this.plz(),
            ort: this.ort(),
          };

          if (this.map) {
            this.map.setView([this.locationData.latitude, this.locationData.longitude], 13);
            this.addMarker(this.locationData.latitude, this.locationData.longitude);
          }
        }
        this.isLoading = false;
      })
      .catch(() => {
        this.isLoading = false;
      });
  }

  private addMarker(lat: number, lng: number): void {
    if (this.marker) {
      this.map?.removeLayer(this.marker);
    }

    this.marker = L.marker([lat, lng], {
      icon: L.icon({
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      }),
    }).addTo(this.map!);
  }
}
