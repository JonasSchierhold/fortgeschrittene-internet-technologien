**Framework**

- Verbindlich Angular (aktuelle Version, kein AngularJS)  

**Architektur & Best Practices**

- Modulstruktur: `CoreModule`, `SharedModule`, Feature-Module (`auth`, `registration`, `location`, `friends` …)  
- Routing mit Lazy Loading für Feature-Module  
- Schichten-Trennung:
  - Komponenten: Darstellung & User-Interaktion  
  - Services: REST, State, Businesslogik  
- Interfaces/Types für alle API-Modelle (User, Location, Session …)  
- Reactive Forms für alle Formulare  
- Zentrales Error Handling (HTTP-Interceptor, Session-Timeout → Redirect Login)  
- Environment-Konfiguration für API-URLs (dev/prod)  
- Nutzung von RxJS (Observables, `pipe`, `tap`, `catchError`)  
- Saubere Ordnerstruktur, sinnvolle Namen, kommentierter Code, kein toter Code  

**Styling & UI**

- Primär Angular Material  
- Layout/Komponenten:
  - `MatToolbar` / `MatSidenav` für Hauptlayout/Navigation  
  - `MatCard` für Formulare  
  - `MatFormField` + `MatInput` + `MatSelect` für Eingaben  
  - `MatButton` für alle Buttons  
  - `MatTable` oder `MatList` / `MatChips` für Überwachungsliste  
  - `MatSnackBar` / `MatDialog` für Fehler/Bestätigungen/Status  
  - `MatIcon` wo sinnvoll  
- Styling:
  - Responsives Layout (Breakpoints, Grid/Flex)  
  - Konsistentes Angular-Material-Theme (Primary/Accent/Warn)  
  - Kartenansicht mit Karten-API (z.B. Leaflet/OSM) in Angular-Komponente, umgebendes Layout mit Angular Material  

**FAP-spezifische Views**

- **Registrierung**
  - Reactive Form mit HTML5-Validation  
  - Ajax-Check „Benutzername verfügbar?“ (async validator)  
  - PLZ → Ort per Ajax  
  - Captcha/Rechenaufgabe: vom Server, Prüfung nach Submit  
  - Nach Erfolg: Karte mit Heimatadresse  

- **Login/Logout**
  - Login als Reactive Form, POST an Login-Service  
  - Session-ID im `AuthService` verwalten, bei Requests mitsenden  
  - Logout-Button, Navigation via Routing  
  - Optional Auto-Login über gespeicherte Credentials  

- **Standortpflege / automatische Meldung**
  - Entweder Formular-Komponente (nur nach Login)  
  - Oder Hintergrund-Task/Timer (z.B. alle 30s Standort-Service)  
  - Validierungs- und Serverfehler im UI (`MatError`, `MatSnackBar` …)  

- **Überwachungsliste mit Karte**
  - Liste beobachteter Benutzer (IDs lokal, optional initial vom Service)  
  - Hinzufügen/Entfernen über UI (z.B. `MatChips` oder `MatTable` mit Actions)  
  - Karte mit Markern für alle beobachteten Benutzer, Marker eindeutig zuordenbar (z.B. Benutzername)  
  - Periodisches Polling zur Positionsaktualisierung, reaktive UI  

**Dokumentation / Code-Qualität**

- Gut strukturierter, kommentierter Angular-Code  
- Aufbau so, dass Architektur- und Komponentenstrukturen leicht in Diagrammen dokumentiert werden können