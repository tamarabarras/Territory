/**
 * main.ts — spaja module:
 *   GpsTracker  → točke
 *   TerritoryEngine → pravila
 *   MapView → prikaz
 *
 * Ovo je jedini "orkestrator"; moduli međusobno ne ovise ciklički.
 */

import { GpsTracker } from "./modules/gps/GpsTracker";
import { MapView } from "./modules/map/MapView";
import { TerritoryEngine } from "./modules/territory/TerritoryEngine";
import { buildCutLineAcross, startDemoWalk } from "./modules/demo/DemoWalk";
import type { LatLng } from "./types";

import "./styles/main.css";

const statusText = document.getElementById("statusText")!;
const trailInfo = document.getElementById("trailInfo")!;
const areaInfo = document.getElementById("areaInfo")!;
const btnTrack = document.getElementById("btnTrack") as HTMLButtonElement;
const btnDemo = document.getElementById("btnDemo") as HTMLButtonElement;
const btnOpponent = document.getElementById("btnOpponent") as HTMLButtonElement;

const mapView = new MapView({ container: "map", zoom: 17 });
const gps = new GpsTracker({ minDistanceMeters: 3 });
const engine = new TerritoryEngine({
  closeThresholdMeters: 15,
  ignoreRecentPoints: 6,
  minPointsForClaim: 5,
});

let stopDemo: (() => void) | null = null;
let lastKnown: LatLng | null = null;

function setStatus(text: string): void {
  statusText.textContent = text;
}

function formatArea(sqm: number): string {
  if (sqm < 10000) return `${Math.round(sqm)} m²`;
  return `${(sqm / 10000).toFixed(2)} ha`;
}

function refreshHud(): void {
  const trail = engine.getTrail("you");
  trailInfo.textContent = `Trag: ${trail.points.length} točaka`;
  areaInfo.textContent = `Teritorij: ${formatArea(engine.getAreaSqMeters("you"))}`;
}

/** Reagiraj na događaje iz TerritoryEngine i osvježi mapu / HUD. */
engine.onEvent((event) => {
  switch (event.type) {
    case "trail-updated":
      mapView.renderTrail(event.playerId, event.points);
      if (event.playerId === "you") refreshHud();
      break;
    case "trail-cleared":
      mapView.clearTrail(event.playerId);
      if (event.playerId === "you") refreshHud();
      setStatus(
        event.playerId === "you"
          ? `Trag obrisan: ${event.reason}`
          : `Protivnik: ${event.reason}`,
      );
      break;
    case "territory-claimed":
      mapView.renderTerritory(event.playerId, event.geometry);
      mapView.clearTrail(event.playerId);
      if (event.playerId === "you") {
        refreshHud();
        setStatus(`Osvojeno! +${formatArea(event.areaSqMeters)}`);
      }
      break;
    case "territory-lost":
      mapView.renderTerritory(event.playerId, null);
      mapView.clearTrail(event.playerId);
      if (event.playerId === "you") {
        refreshHud();
        setStatus(`Izgubljen teritorij: ${event.reason}`);
      }
      break;
  }
});

/** GPS → engine (igrač "you"). */
gps.onPoint((point) => {
  lastKnown = point;
  engine.addPoint("you", point);
  setStatus(`GPS: ${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}`);
});

gps.onError((message) => {
  setStatus(message);
  btnTrack.textContent = "Start GPS";
});

btnTrack.addEventListener("click", () => {
  if (gps.isTracking) {
    gps.stop();
    btnTrack.textContent = "Start GPS";
    setStatus("GPS zaustavljen");
    return;
  }
  mapView.setFollowPlayer(true);
  gps.start();
  btnTrack.textContent = "Stop GPS";
  setStatus("Tražim GPS signal…");
});

btnDemo.addEventListener("click", () => {
  if (stopDemo) {
    stopDemo();
    stopDemo = null;
    btnDemo.textContent = "Demo hod";
    setStatus("Demo zaustavljen");
    return;
  }

  const origin =
    lastKnown ??
    gps.lastAcceptedPoint ??
    ({ lat: 45.815, lng: 15.982 } as LatLng);

  // Centriraj mapu na origin prije hoda
  mapView.centerOn(origin, 18);
  mapView.setFollowPlayer(true);
  gps.resetFilter();

  stopDemo = startDemoWalk(gps, {
    origin,
    radiusMeters: 45,
    steps: 28,
    intervalMs: 280,
  });
  btnDemo.textContent = "Stop demo";
  setStatus("Demo hod — crtam krug…");
});

/**
 * Simulacija protivnika: nacrta liniju preko tvog otvorenog traga.
 * Time se aktivira pravilo "presjek → gubiš teritorij".
 */
btnOpponent.addEventListener("click", () => {
  const myTrail = engine.getTrail("you").points;
  if (myTrail.length < 3) {
    setStatus("Najprije nacrtaj trag (GPS ili Demo), pa simuliraj rez.");
    return;
  }

  const cut = buildCutLineAcross(myTrail);
  // Protivnik crta svoj trag točku po točku
  for (const p of cut) {
    engine.addPoint("opponent", p);
  }
  mapView.renderTrail("opponent", engine.getTrail("opponent").points);
  setStatus("Protivnik je presjekao trag!");
});

// Resize Leaflet nakon layouta (mobilni HUD)
window.addEventListener("load", () => {
  mapView.map.invalidateSize();
});
window.addEventListener("resize", () => {
  mapView.map.invalidateSize();
});

setStatus("Spreman — Start GPS ili Demo hod");
refreshHud();
