# Territory — Dokumentacija projekta

> Ovaj dokument je **jedini izvor istine** o projektu. Ako se cijeli kod obriše, iz ovog fajla mora biti moguće ponovno izgraditi identičan projekt.

---

## 1. Što je Territory?

**Territory** je mobilni web prototip (PWA) za **osvajanje teritorija u stvarnom vremenu** pomoću GPS-a.

Korisnik hoda s telefonom. Aplikacija crta **trag** (liniju) na interaktivnoj mapi. Kad se trag **zatvori u petlju** ili **spoji na već osvojeni teritorij**, prostor unutar poligona postaje **teritorij** igrača (ispunjen bojom). Ako **drugi igrač presiječe** otvoreni trag prije zatvaranja, prvi igrač **gubi trag i sav teritorij**.

Naziv / cilj: minimalni prototip mehanike „Territory / Paper.io-style“ na stvarnoj karti.

---

## 2. Tehnologije (zašto ove)

| Dio | Izbor | Zašto |
|-----|--------|--------|
| Jezik | TypeScript | Tipovi za GPS/GeoJSON, manje grešaka |
| Build | Vite 6 | Brzi dev server, jednostavan PWA build |
| Mapa | Leaflet + OpenStreetMap | Besplatno, bez API ključa, zoom/pan ugrađen |
| Geo logika | @turf/turf | Petlje, union, lineIntersect, area |
| Lokacija | Browser Geolocation API | Radi na telefonu (HTTPS / localhost) |
| Distribucija | PWA (vite-plugin-pwa) | „Add to Home Screen“ na mobitelu |

Nije native React Native / Flutter jer je cilj brzi prototip koji se otvara u Safari/Chrome na telefonu bez App Store builda.

---

## 3. Struktura foldera

```
documents/Territory/
├── docs/
│   ├── projekat.md                 ← ovaj fajl
│   ├── terms_and_conditions.md
│   └── progress/progress.md
├── public/
│   └── favicon.svg
├── src/
│   ├── main.ts                     ← orkestrator (spaja module)
│   ├── types.ts                    ← zajednički tipovi
│   ├── vite-env.d.ts
│   ├── styles/main.css
│   └── modules/
│       ├── gps/GpsTracker.ts       ← GPS tracking modul
│       ├── map/MapView.ts          ← Map prikaz modul
│       ├── territory/TerritoryEngine.ts  ← Territory logika
│       └── demo/DemoWalk.ts        ← demo hod + simulacija reza
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── .gitignore
└── README.md
```

### Pravila modularnosti

1. **GpsTracker** — samo lokacija; ne zna za mapu ni teritorij.
2. **MapView** — samo crta; ne odlučuje o pravilima.
3. **TerritoryEngine** — samo stanje i pravila; nema DOM/Leaflet.
4. **main.ts** — jedini sloj koji ih spaja i ažurira HUD.

---

## 4. Funkcije (što radi aplikacija)

| ID | Funkcija | Gdje | Opis |
|----|----------|------|------|
| F1 | GPS praćenje | `GpsTracker` | `watchPosition`, filter min. udaljenosti (~3–4 m) |
| F2 | Interaktivna mapa | `MapView` | OSM tileovi, zoom (+/−), pan/drag |
| F3 | Trag (linija) | `MapView` + engine | Polyline prati kretanje |
| F4 | Zatvaranje poligona | `TerritoryEngine.tryClaim` | Self-close blizu starije točke ILI touch vlastitog teritorija |
| F5 | Popuna teritorija | `MapView.renderTerritory` | GeoJSON fill različitim bojama (you / opponent) |
| F6 | Spajanje teritorija | `turf.union` | Novi poligon se spaja s postojećim |
| F7 | Rez traga | `checkCutsInvolving` | Protivnikov trag siječe otvoreni → žrtva gubi teritorij |
| F8 | Demo hod | `DemoWalk` | Simulira krug oko točke (test bez hodanja) |
| F9 | Simuliraj rez | `buildCutLineAcross` | Lokalni „opponent“ crta liniju preko tvog traga |
| F10 | HUD | `index.html` + CSS | Start/Stop GPS, demo, status, broj točaka, m² |

### Pravila igre (točna)

1. Igrač `"you"` dobiva točke s GPS-a ili dema.
2. Točke idu u otvoreni trag.
3. Ako je nova točka ≤ `closeThresholdMeters` (default 15 m) od **starije** točke traga (ignorira zadnjih N), formira se petlja → claim.
4. Ako nova točka dira (ili je unutar buffera) **vlastiti** teritorij → claim cijelog trenutnog traga kao petlje.
5. Claim: `unkinkPolygon` → najveći komad → `union` s postojećim → obriši trag → fill na mapi.
6. Ako trag igrača A siječe **otvoreni** trag igrača B (lineIntersect, zanemari sjecište baš na vrhu B) → B gubi **trag + sav teritorij**.

Boje: ti = zelena (`#3dff9a`), protivnik = crvena (`#ff5c5c`).

---

## 5. Kako pokrenuti (korak po korak)

### Preduvjeti

- Node.js 20+ i npm
- Telefon i računalo na istoj Wi‑Fi mreži **ILI** deploy na HTTPS (GPS na telefonu zahtijeva siguran kontekst)

### Instalacija

```bash
cd documents/Territory
npm install
```

### Development (laptop)

```bash
npm run dev
```

Otvori ispisani URL (npr. `http://localhost:5173`).

### Development s telefona (ista mreža)

```bash
npm run dev -- --host
```

Na telefonu otvori `http://<IP-tvog-laptopa>:5173`.  
Na iOS-u: Safari → dopusti lokaciju. (HTTP lokalno: neki uređaji dopuštaju geolocation na LAN IP; ako ne, treba HTTPS tunel ili deploy.)

### Produkcijski build

```bash
npm run build
npm run preview -- --host
```

Static output je u `dist/` — može se hostati na bilo kojem static hostingu (GitHub Pages, Netlify, Cloudflare Pages) preko HTTPS-a.

### Kako testirati mehaniku bez hodanja

1. Otvori app → **Demo hod** (crta krug oko Zagreba ili zadnje GPS točke).
2. Kad se krug zatvori, zeleni fill = teritorij; HUD pokazuje m².
3. Ponovo **Demo hod** ili GPS da nastaviš trag; spoji se na teritorij za proširenje.
4. Dok imaš **otvoreni** trag (ne zatvoren), stisni **Simuliraj rez** → gubiš teritorij.

---

## 6. Kako obnoviti projekt samo iz ovog fajla

1. Kreiraj strukturu iz odjeljka 3.
2. `package.json` dependencies: `leaflet`, `@turf/turf`; dev: `vite`, `typescript`, `@types/leaflet`, `vite-plugin-pwa`.
3. Implementiraj module točno po ulogama iz odjeljka 3 i pravilima iz odjeljka 4.
4. `index.html`: full-bleed `#map`, top-bar brand **Territory**, HUD gumbi Start GPS / Demo hod / Simuliraj rez.
5. CSS: tamna šumsko-zelena tema, fontovi Syne + IBM Plex Sans, mapa edge-to-edge.
6. `vite.config.ts`: PWA manifest ime Territory, theme `#0b1f17`, `server.host: true`.
7. Default map center ako nema GPS: Zagreb `45.815, 15.982`, zoom 17.

---

## 7. Što još NIJE u prototipu (sljedeći checkpointi)

- Pravi multiplayer sync (WebSocket / backend) — trenutno je lokalna simulacija protivnika
- Auth / više stvarnih korisnika
- Persistencija teritorija (baza)
- Offline tile cache napredniji od PWA precache
- Fine-tuning anti-cheat / GPS drift

---

## 8. Checkpointi

| Verzija | Što |
|---------|-----|
| 1.0 | Samo docs / radni prostor |
| 1.1 | PWA prototip: GPS + Leaflet mapa + territory engine + demo/rez |

Detalji: `docs/progress/progress.md`.

---

*Zadnja izmjena: 2026-08-15 — checkpoint 1.1*
