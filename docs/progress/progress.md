# Territory — Progress / Checkpointi

Svrha: povijest izmjena s timestampom. Naredba „vrati na X.Y“ = vrati stanje opisano u tom checkpointu.

---

## Checkpoint 1.0 — Osnivanje radnog prostora

- **Timestamp:** 2026-08-15 18:27 UTC
- **Status:** arhivirano (nadograđeno na 1.1)

### Što je napravljeno

1. Mapa `documents/Territory`
2. Početni docs: `projekat.md`, `terms_and_conditions.md`, `progress.md`
3. Bez aplikacijskog koda

### Stanje foldera na 1.0

```
documents/Territory/
├── docs/projekat.md
├── docs/terms_and_conditions.md
├── docs/progress/progress.md
└── README.md
```

### Kako vratiti na 1.0

Obriši sav kod (`src/`, `public/`, `package.json`, build fajlove itd.) i ostavi samo docs + README iz 1.0.

---

## Checkpoint 1.1 — PWA prototip (GPS + mapa + teritorij)

- **Timestamp:** 2026-08-15 18:45 UTC
- **Status:** aktivna baza

### Što je napravljeno

1. Vite + TypeScript + PWA scaffold
2. Modul **GPS**: `src/modules/gps/GpsTracker.ts`
3. Modul **Map**: `src/modules/map/MapView.ts` (Leaflet + OSM, zoom/pan)
4. Modul **Territory**: `src/modules/territory/TerritoryEngine.ts` (zatvaranje poligona, union, rez → gubitak)
5. Demo hod + gumb „Simuliraj rez“
6. UI: full-bleed mapa, HUD, brand Territory
7. `npm run build` uspješan

### Stanje foldera na 1.1

```
documents/Territory/
├── docs/…
├── public/favicon.svg
├── src/
│   ├── main.ts
│   ├── types.ts
│   ├── styles/main.css
│   └── modules/{gps,map,territory,demo}/…
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── …
```

### Kako vratiti na 1.1

Vrati git commit oznake checkpointa 1.1 (ili obnovi datoteke prema `projekat.md` v1.1). Ne uključuj kasniji multiplayer backend ako bude dodan u 1.2+.

### Napomena za test

- `npm install && npm run dev -- --host`
- Demo hod zatvara krug → zeleni teritorij
- Otvoreni trag + Simuliraj rez → gubitak teritorija

---
