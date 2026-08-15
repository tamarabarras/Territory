/**
 * DemoWalk — simulira hodanje u krugu / putanji oko trenutne lokacije.
 * Korisno za testiranje na stolici ili u cloud okruženju bez GPS-a.
 */

import type { LatLng } from "../../types";
import { GpsTracker } from "../gps/GpsTracker";

export type DemoWalkOptions = {
  /** Centar kruga (obično trenutna GPS točka). */
  origin: LatLng;
  /** Polumjer kruga u metrima. */
  radiusMeters?: number;
  /** Broj točaka punog kruga. */
  steps?: number;
  /** Interval između točaka (ms). */
  intervalMs?: number;
};

/**
 * Metri → delta lat/lng (približno, dovoljno za lokalni prototip).
 */
function offsetLatLng(origin: LatLng, eastMeters: number, northMeters: number): LatLng {
  const lat = origin.lat + northMeters / 111320;
  const lng =
    origin.lng + eastMeters / (111320 * Math.cos((origin.lat * Math.PI) / 180));
  return { lat, lng };
}

/**
 * Pokreni demo hod u krugu i ubrizgavaj točke u GpsTracker.
 * Vraća stop() funkciju.
 */
export function startDemoWalk(
  tracker: GpsTracker,
  options: DemoWalkOptions,
): () => void {
  const radius = options.radiusMeters ?? 40;
  const steps = options.steps ?? 24;
  const intervalMs = options.intervalMs ?? 350;
  let i = 0;
  let stopped = false;

  const tick = (): void => {
    if (stopped) return;
    const angle = (i / steps) * Math.PI * 2;
    // Zatvori krug: zadnjih par točaka se vraća blizu starta
    const point = offsetLatLng(
      options.origin,
      Math.cos(angle) * radius,
      Math.sin(angle) * radius,
    );
    tracker.injectPoint(point, 3);
    i += 1;
    // Jedan pun krug + malo preklapanja za close detection
    if (i <= steps + 3) {
      window.setTimeout(tick, intervalMs);
    }
  };

  tick();
  return () => {
    stopped = true;
  };
}

/**
 * Simulira protivnika koji crta liniju preko tvog traga (rez).
 * `crossPoints` su točke koje se dodaju u TerritoryEngine za "opponent".
 */
export function buildCutLineAcross(
  trail: LatLng[],
): LatLng[] {
  if (trail.length < 2) {
    // Fallback: kratka linija oko origin
    const o = trail[0] ?? { lat: 45.815, lng: 15.982 };
    return [
      offsetLatLng(o, -30, 0),
      offsetLatLng(o, 30, 0),
    ];
  }

  // Uzmi sredinu traga i nacrtaj okomicu preko nje
  const mid = trail[Math.floor(trail.length / 2)];
  const a = trail[Math.max(0, Math.floor(trail.length / 2) - 1)];
  const dx = mid.lng - a.lng;
  const dy = mid.lat - a.lat;
  // Okomici vektor (aproksimacija u lokalnim metrima)
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  // 50 m na svaku stranu (pretvoreno grubo iz "degree unit")
  const scale = 0.00045;
  return [
    { lat: mid.lat + ny * scale, lng: mid.lng + nx * scale },
    { lat: mid.lat - ny * scale, lng: mid.lng - nx * scale },
  ];
}
