## Basis-URL

- Lokaler FAP-Server: `http://localhost:8080/FAPServer/service/fapservice`
- Externer GeoNames-Service (direkt): `http://api.geonames.org`

---

## 1. Benutzerverwaltung

### 1.1 Benutzer anlegen

**POST** `/addUser`  
Body (JSON):

```json
{
  "loginName": "peterl",
  "passwort": { "passwort": "geheim" },
  "vorname": "Peter",
  "nachname": "Lustig",
  "strasse": "Akazienweg 13",
  "plz": "46397",
  "ort": "Bocholt",
  "land": "Deutschland",
  "telefon": "02871/4711007",
  "email": { "adresse": "peterl@test.de" }
}
```

Antwort:

```json
{ "ergebnis": true, "meldung": "" }
```

bzw. bei Fehler, z. B. Login schon vorhanden:

```json
{ "ergebnis": false, "meldung": "LoginName bereits vorhanden" }
```

---

### 1.2 LoginName prüfen

**GET** `/checkLoginName?id=<loginName>`  
Beispiel: `/checkLoginName?id=pet`  
Antwort:

```json
{ "ergebnis": true | false }
```

- `true` → Loginname ist frei
- `false` → Loginname ist bereits vergeben

---

## 2. Geo-/Ortsinformationen

### 2.1 PLZ → Ort (direkt via GeoNames)

**GET** `http://api.geonames.org/postalCodeSearchJSON?postalcode=<PLZ>&username=<user>`

Antwort-Beispiele:

- Erfolgreich:
  ```json
  {
    "postalCodes": [
      {
        "postalCode": "46397",
        "placeName": "Bocholt",
        "countryCode": "DE",
        "lat": 51.8412666666667,
        "lng": 6.62416666666667,
        ...
      }
    ]
  }
  ```
- Kontingent überschritten:
  ```json
  {
    "status": {
      "message": "the daily limit ... exceeded",
      "value": 18
    }
  }
  ```

### 2.2 PLZ → Ort (indirekt über FAP-Server)

**GET** `/getOrt?postalcode=<PLZ>&username=<user>`

Antwort:

- Entweder durchgereichte GeoNames-Daten:
  ```json
  {
    "postalCodes": [
      {
        "postalCode": "46397",
        "placeName": "Bocholt",
        ...
      }
    ]
  }
  ```
- oder Fehlermeldung/Limit aus GeoNames:
  ```json
  {
    "status": {
      "message": "the daily/hourly limit ... exceeded",
      "value": 18 | 19
    }
  }
  ```

---

## 3. Authentifizierung / Sessions

### 3.1 Login

**POST** `/login`  
Body:

```json
{
  "loginName": "tester",
  "passwort": { "passwort": "tester" }
}
```

Antwort:

```json
{ "sessionID": "UUID" }
```

### 3.2 Logout

**POST** `/logout`  
Body:

```json
{
  "loginName": "tester",
  "sitzung": "SESSION-UUID"
}
```

Antwort:

```json
{ "ergebnis": true }
```

---

## 4. Standort-Funktionen

### 4.1 Standort eines Benutzers setzen

**PUT** `/setStandort`  
Body:

```json
{
  "loginName": "tester",
  "sitzung": "SESSION-UUID",
  "standort": {
    "breitengrad": 11,
    "laengengrad": 10
  }
}
```

Antwort:

```json
{ "ergebnis": true | false }
```

### 4.2 Standort eines Benutzers abfragen

**GET** `/getStandort?login=<loginName>&session=<SESSION-UUID>&id=<benutzerId>`
Beispiel:
`/getStandort?login=tester&session=<SESSION-UUID>&id=tester`

Antwort (wenn vorhanden):

```json
{ "breitengrad": 51.83938, "laengengrad": 6.65168 }
```

oder leeres Objekt:

```json
{}
```

---

### 4.3 Standort per Adresse bestimmen

**GET** `/getStandortPerAdresse?land=<Land>&plz=<PLZ>&ort=<Ort>&strasse=<Straße+Hausnr>`
Beispiel:
`/getStandortPerAdresse?land=Deutschland&plz=46397&ort=Bocholt&strasse=Münsterstrasse 265`

Antwort:

```json
{ "breitengrad": 51.83938, "laengengrad": 6.65168 }
```

---

## 5. Benutzerliste abfragen

**GET** `/getBenutzer?login=<loginName>&session=<SESSION-UUID>`

Antwort:

```json
{
  "benutzerliste": [
    {
      "loginName": "tester",
      "vorname": "Testvorname",
      "nachname": "Testnachname"
    },
    { "loginName": "peterl", "vorname": "Peter", "nachname": "Lustig" }
  ]
}
```
