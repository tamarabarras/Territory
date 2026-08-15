# Territory

Mobilni PWA prototip: **GPS trag → zatvori petlju → osvoji teritorij na mapi**.

## Brzi start

```bash
cd documents/Territory
npm install
npm run dev -- --host
```

Na telefonu otvori ispisani Network URL i dopusti lokaciju. Za test bez hodanja: **Demo hod**.

## Moduli

| Modul | Put | Uloga |
|-------|-----|--------|
| GPS | `src/modules/gps/` | Praćenje lokacije |
| Map | `src/modules/map/` | Leaflet / OSM prikaz |
| Territory | `src/modules/territory/` | Petlje, claim, rez |
| Demo | `src/modules/demo/` | Simulacija hoda i reza |

## Dokumentacija

- [`docs/projekat.md`](docs/projekat.md) — potpuni opis (za obnovu projekta)
- [`docs/terms_and_conditions.md`](docs/terms_and_conditions.md)
- [`docs/progress/progress.md`](docs/progress/progress.md) — checkpoint **1.1**
