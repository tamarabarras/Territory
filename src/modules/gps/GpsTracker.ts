/**
 * GPS Tracking modul
 * -------------------
 * Hvata lokaciju uređaja (Geolocation API) i prosljeđuje točke pretplatnicima.
 * Ne zna ništa o mapi niti o teritoriju — samo stream koordinata.
 */

import type { LatLng } from "../../types";

export type GpsListener = (point: LatLng, accuracyMeters: number) => void;
export type GpsErrorListener = (message: string) => void;

export type GpsTrackerOptions = {
  /** Minimalna udaljenost (m) između dvije zabilježene točke — smanjuje šum. */
  minDistanceMeters?: number;
  enableHighAccuracy?: boolean;
  maximumAgeMs?: number;
  timeoutMs?: number;
};

/**
 * Pretvara stupnjeve u radijane.
 */
function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * Haversine udaljenost između dvije točke u metrima.
 */
export function distanceMeters(a: LatLng, b: LatLng): number {
  const R = 6371000;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/**
 * GpsTracker — wrapper oko navigator.geolocation.watchPosition.
 */
export class GpsTracker {
  private watchId: number | null = null;
  private lastPoint: LatLng | null = null;
  private readonly listeners = new Set<GpsListener>();
  private readonly errorListeners = new Set<GpsErrorListener>();
  private readonly minDistanceMeters: number;
  private readonly enableHighAccuracy: boolean;
  private readonly maximumAgeMs: number;
  private readonly timeoutMs: number;

  constructor(options: GpsTrackerOptions = {}) {
    this.minDistanceMeters = options.minDistanceMeters ?? 4;
    this.enableHighAccuracy = options.enableHighAccuracy ?? true;
    this.maximumAgeMs = options.maximumAgeMs ?? 1000;
    this.timeoutMs = options.timeoutMs ?? 15000;
  }

  /** Je li praćenje trenutno aktivno. */
  get isTracking(): boolean {
    return this.watchId !== null;
  }

  /** Zadnja prihvaćena točka (nakon filtera). */
  get lastAcceptedPoint(): LatLng | null {
    return this.lastPoint;
  }

  onPoint(listener: GpsListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  onError(listener: GpsErrorListener): () => void {
    this.errorListeners.add(listener);
    return () => this.errorListeners.delete(listener);
  }

  /**
   * Pokreće kontinualno GPS praćenje.
   * Na iOS/Android zahtijeva HTTPS (ili localhost) + dozvolu lokacije.
   */
  start(): void {
    if (!("geolocation" in navigator)) {
      this.emitError("Ovaj uređaj ne podržava Geolocation API.");
      return;
    }
    if (this.watchId !== null) return;

    this.watchId = navigator.geolocation.watchPosition(
      (pos) => this.handlePosition(pos),
      (err) => this.emitError(this.mapError(err)),
      {
        enableHighAccuracy: this.enableHighAccuracy,
        maximumAge: this.maximumAgeMs,
        timeout: this.timeoutMs,
      },
    );
  }

  /** Zaustavlja GPS watch. */
  stop(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  /**
   * Ručno ubaci točku (demo hod / test bez stvarnog GPS-a).
   * Poštuje isti minDistance filter kao pravi GPS.
   */
  injectPoint(point: LatLng, accuracyMeters = 5): void {
    this.acceptIfFarEnough(point, accuracyMeters);
  }

  /** Reset filtera (npr. nakon gubitka traga). */
  resetFilter(): void {
    this.lastPoint = null;
  }

  private handlePosition(pos: GeolocationPosition): void {
    const point: LatLng = {
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
    };
    this.acceptIfFarEnough(point, pos.coords.accuracy);
  }

  private acceptIfFarEnough(point: LatLng, accuracyMeters: number): void {
    if (
      this.lastPoint &&
      distanceMeters(this.lastPoint, point) < this.minDistanceMeters
    ) {
      return;
    }
    this.lastPoint = point;
    for (const listener of this.listeners) {
      listener(point, accuracyMeters);
    }
  }

  private emitError(message: string): void {
    for (const listener of this.errorListeners) {
      listener(message);
    }
  }

  private mapError(err: GeolocationPositionError): string {
    switch (err.code) {
      case err.PERMISSION_DENIED:
        return "Lokacija odbijena. Uključi GPS dozvolu u postavkama preglednika.";
      case err.POSITION_UNAVAILABLE:
        return "GPS signal nedostupan.";
      case err.TIMEOUT:
        return "GPS timeout — pokušaj ponovo na otvorenom.";
      default:
        return err.message || "Nepoznata GPS greška.";
    }
  }
}
