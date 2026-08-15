/**
 * Territory logika
 * ----------------
 * Pravila osvajanja:
 * 1) Igrač crta otvoreni trag (niz GPS točaka).
 * 2) Kad se trag zatvori u petlju ILI spoji na već osvojeni teritorij →
 *    unutrašnjost poligona postaje (ili se spaja s) teritorijem igrača.
 * 3) Ako protivnikov trag PRESJEČE otvoreni trag prije zatvaranja →
 *    žrtva gubi otvoreni trag i sav osvojeni teritorij.
 *
 * Geospatial: @turf/turf (boolean ops, area, union, lineIntersect).
 */

import * as turf from "@turf/turf";
import type { Feature, LineString, MultiPolygon, Polygon } from "geojson";
import type { ClaimedTerritory, LatLng, PlayerId, Trail } from "../../types";
import { distanceMeters } from "../gps/GpsTracker";

export type TerritoryEvent =
  | { type: "trail-updated"; playerId: PlayerId; points: LatLng[] }
  | {
      type: "territory-claimed";
      playerId: PlayerId;
      geometry: Polygon | MultiPolygon;
      areaSqMeters: number;
    }
  | { type: "trail-cleared"; playerId: PlayerId; reason: string }
  | {
      type: "territory-lost";
      playerId: PlayerId;
      reason: string;
    };

export type TerritoryEngineOptions = {
  /** Udaljenost (m) za detekciju "zatvaranja" petlje. */
  closeThresholdMeters?: number;
  /** Koliko zadnjih točaka ignorirati pri self-close (izbjegava lažne petlje). */
  ignoreRecentPoints?: number;
  /** Minimalan broj točaka za validan poligon. */
  minPointsForClaim?: number;
};

type Listener = (event: TerritoryEvent) => void;

/**
 * TerritoryEngine — čisto stanje igre, bez UI-a.
 */
export class TerritoryEngine {
  private readonly trails = new Map<PlayerId, LatLng[]>();
  private readonly claims = new Map<PlayerId, ClaimedTerritory>();
  private readonly listeners = new Set<Listener>();
  private readonly closeThresholdMeters: number;
  private readonly ignoreRecentPoints: number;
  private readonly minPointsForClaim: number;

  constructor(options: TerritoryEngineOptions = {}) {
    this.closeThresholdMeters = options.closeThresholdMeters ?? 12;
    this.ignoreRecentPoints = options.ignoreRecentPoints ?? 5;
    this.minPointsForClaim = options.minPointsForClaim ?? 4;
  }

  onEvent(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getTrail(playerId: PlayerId): Trail {
    return { playerId, points: [...(this.trails.get(playerId) ?? [])] };
  }

  getClaim(playerId: PlayerId): ClaimedTerritory | null {
    return this.claims.get(playerId) ?? null;
  }

  /** Površina teritorija u m² (0 ako nema). */
  getAreaSqMeters(playerId: PlayerId): number {
    const claim = this.claims.get(playerId);
    if (!claim) return 0;
    return turf.area(turf.feature(claim.geometry));
  }

  /**
   * Dodaj GPS točku igraču. Može zatvoriti poligon ili biti presječen.
   */
  addPoint(playerId: PlayerId, point: LatLng): void {
    const points = this.trails.get(playerId) ?? [];
    points.push(point);
    this.trails.set(playerId, points);
    this.emit({ type: "trail-updated", playerId, points: [...points] });

    // Nakon svake nove točke: provjeri je li netko presjekao tuđi otvoreni trag
    this.checkCutsInvolving(playerId);

    // Zatim: je li ovaj igrač zatvorio petlju / spojio teritorij?
    if (this.trails.has(playerId)) {
      this.tryClaim(playerId);
    }
  }

  /** Obriši trag bez gubitka teritorija (npr. ručni reset). */
  clearTrail(playerId: PlayerId, reason: string): void {
    if (!this.trails.has(playerId)) return;
    this.trails.delete(playerId);
    this.emit({ type: "trail-cleared", playerId, reason });
  }

  /** Potpuni gubitak teritorija + traga. */
  loseTerritory(playerId: PlayerId, reason: string): void {
    this.trails.delete(playerId);
    this.claims.delete(playerId);
    this.emit({ type: "trail-cleared", playerId, reason });
    this.emit({ type: "territory-lost", playerId, reason });
  }

  /**
   * Pokušaj zatvoriti poligon iz traga.
   * Uvjeti: self-close (blizu starije točke) ILI touch vlastitog teritorija.
   */
  private tryClaim(playerId: PlayerId): void {
    const points = this.trails.get(playerId);
    if (!points || points.length < this.minPointsForClaim) return;

    const last = points[points.length - 1];
    const closeIndex = this.findCloseIndex(points, last);
    const touchesOwnTerritory = this.pointTouchesClaim(playerId, last);

    if (closeIndex === null && !touchesOwnTerritory) return;

    // Petlja: od closeIndex do kraja; ako touch teritorija — cijeli trag + projekcija na granicu
    let loopPoints: LatLng[];
    if (closeIndex !== null) {
      loopPoints = points.slice(closeIndex);
    } else {
      loopPoints = [...points];
    }

    if (loopPoints.length < this.minPointsForClaim) return;

    const polygon = this.pointsToPolygon(loopPoints);
    if (!polygon) return;

    const merged = this.mergeWithExisting(playerId, polygon);
    this.claims.set(playerId, { playerId, geometry: merged });
    this.trails.delete(playerId);

    const areaSqMeters = turf.area(turf.feature(merged));
    this.emit({ type: "trail-cleared", playerId, reason: "zatvoren poligon" });
    this.emit({
      type: "territory-claimed",
      playerId,
      geometry: merged,
      areaSqMeters,
    });
  }

  /**
   * Nađi najstariju točku traga dovoljno blizu `last` (preskače recentne).
   */
  private findCloseIndex(points: LatLng[], last: LatLng): number | null {
    const limit = Math.max(0, points.length - 1 - this.ignoreRecentPoints);
    for (let i = 0; i < limit; i++) {
      if (distanceMeters(points[i], last) <= this.closeThresholdMeters) {
        return i;
      }
    }
    return null;
  }

  /** Je li točka unutar ili na rubu vlastitog teritorija? */
  private pointTouchesClaim(playerId: PlayerId, point: LatLng): boolean {
    const claim = this.claims.get(playerId);
    if (!claim) return false;
    const pt = turf.point([point.lng, point.lat]);
    const poly = turf.feature(claim.geometry);
    if (turf.booleanPointInPolygon(pt, poly)) return true;
    // Blizina granice (buffer u km)
    const buffered = turf.buffer(poly, this.closeThresholdMeters / 1000, {
      units: "kilometers",
    });
    return buffered ? turf.booleanPointInPolygon(pt, buffered) : false;
  }

  /** Pretvori petlju točaka u validan GeoJSON Polygon. */
  private pointsToPolygon(points: LatLng[]): Feature<Polygon> | null {
    const ring = points.map((p) => [p.lng, p.lat] as [number, number]);
    // Zatvori ring ako nije zatvoren
    const first = ring[0];
    const last = ring[ring.length - 1];
    if (first[0] !== last[0] || first[1] !== last[1]) {
      ring.push([first[0], first[1]]);
    }
    if (ring.length < 4) return null;

    try {
      const poly = turf.polygon([ring]);
      // Ako je self-intersecting, pokušaj unkink / clean
      const unkinked = turf.unkinkPolygon(poly);
      if (unkinked.features.length === 0) return null;
      // Uzmi najveći poligon ako ih ima više
      let best = unkinked.features[0] as Feature<Polygon>;
      let bestArea = turf.area(best);
      for (const f of unkinked.features) {
        const a = turf.area(f);
        if (a > bestArea) {
          best = f as Feature<Polygon>;
          bestArea = a;
        }
      }
      if (bestArea < 1) return null; // premalo (šum)
      return best;
    } catch {
      return null;
    }
  }

  /** Union s postojećim teritorijem istog igrača. */
  private mergeWithExisting(
    playerId: PlayerId,
    next: Feature<Polygon>,
  ): Polygon | MultiPolygon {
    const existing = this.claims.get(playerId);
    if (!existing) return next.geometry;

    try {
      const unioned = turf.union(
        turf.featureCollection([turf.feature(existing.geometry), next]),
      );
      if (!unioned) return next.geometry;
      return unioned.geometry as Polygon | MultiPolygon;
    } catch {
      return next.geometry;
    }
  }

  /**
   * Provjeri siječe li trag `moverId` nečiji otvoreni trag.
   * Ako da → žrtva gubi teritorij (pravilo specifikacije).
   */
  private checkCutsInvolving(moverId: PlayerId): void {
    const moverPoints = this.trails.get(moverId);
    if (!moverPoints || moverPoints.length < 2) return;

    const moverLine = this.toLine(moverPoints);
    if (!moverLine) return;

    for (const [otherId, otherPoints] of this.trails) {
      if (otherId === moverId) continue;
      if (otherPoints.length < 2) continue;

      // Ne broji sjecište ako su oba "glava" blizu (start u istoj točki)
      const otherLine = this.toLine(otherPoints);
      if (!otherLine) continue;

      const hits = turf.lineIntersect(moverLine, otherLine);
      if (hits.features.length === 0) continue;

      // Ignoriraj sjecišta blizu zadnje točke žrtve (još nije pravi rez)
      const meaningful = hits.features.some((f) => {
        const [lng, lat] = f.geometry.coordinates;
        const tip = otherPoints[otherPoints.length - 1];
        return distanceMeters({ lat, lng }, tip) > this.closeThresholdMeters;
      });
      if (!meaningful) continue;

      // Protivnik (mover) reže žrtvin (other) trag → other gubi teritorij
      this.loseTerritory(
        otherId,
        `Trag presječen od strane igrača "${moverId}"`,
      );
    }
  }

  private toLine(points: LatLng[]): Feature<LineString> | null {
    if (points.length < 2) return null;
    return turf.lineString(points.map((p) => [p.lng, p.lat]));
  }

  private emit(event: TerritoryEvent): void {
    for (const listener of this.listeners) {
      listener(event);
    }
  }
}
