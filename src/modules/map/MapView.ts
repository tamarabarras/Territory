/**
 * Map modul
 * ---------
 * Odgovoran isključivo za vizualni prikaz (Leaflet + OpenStreetMap).
 * Ne odlučuje o pravilima igre — samo crta što mu se pošalje.
 */

import L from "leaflet";
import type { LatLng, PlayerId, PlayerPalette } from "../../types";
import { PLAYER_COLORS } from "../../types";

import "leaflet/dist/leaflet.css";

export type MapViewOptions = {
  /** HTML element ili CSS selektor za mapu. */
  container: string | HTMLElement;
  center?: LatLng;
  zoom?: number;
};

type TrailLayerState = {
  polyline: L.Polyline;
  marker: L.CircleMarker;
};

type TerritoryLayerState = {
  polygon: L.GeoJSON;
};

/**
 * MapView — Leaflet omotač s OSM pločicama, zoom/pan, tragovima i teritorijima.
 */
export class MapView {
  readonly map: L.Map;
  private readonly trails = new Map<PlayerId, TrailLayerState>();
  private readonly territories = new Map<PlayerId, TerritoryLayerState>();
  private followPlayer = true;

  constructor(options: MapViewOptions) {
    const center = options.center ?? { lat: 45.815, lng: 15.982 }; // Zagreb default
    const zoom = options.zoom ?? 17;

    this.map = L.map(options.container, {
      zoomControl: true,
      attributionControl: true,
    }).setView([center.lat, center.lng], zoom);

    // OpenStreetMap — bez API ključa, dovoljno za prototip
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(this.map);

    // Korisnik ručno miče mapu → privremeno isključi auto-follow
    this.map.on("dragstart", () => {
      this.followPlayer = false;
    });
  }

  /** Uključi/isključi praćenje igrača kamerom. */
  setFollowPlayer(enabled: boolean): void {
    this.followPlayer = enabled;
  }

  /** Centriraj mapu na točku (npr. tipka "moja lokacija"). */
  centerOn(point: LatLng, zoom?: number): void {
    if (zoom !== undefined) {
      this.map.setView([point.lat, point.lng], zoom);
    } else {
      this.map.panTo([point.lat, point.lng]);
    }
    this.followPlayer = true;
  }

  /**
   * Ažuriraj vizualni trag igrača (linija + marker na zadnjoj točki).
   */
  renderTrail(playerId: PlayerId, points: LatLng[]): void {
    const palette = this.palette(playerId);
    const latLngs: L.LatLngExpression[] = points.map((p) => [p.lat, p.lng]);

    let state = this.trails.get(playerId);
    if (!state) {
      const polyline = L.polyline(latLngs, {
        color: palette.trail,
        weight: 4,
        opacity: 0.95,
        lineJoin: "round",
        lineCap: "round",
      }).addTo(this.map);

      const last = points[points.length - 1] ?? { lat: 0, lng: 0 };
      const marker = L.circleMarker([last.lat, last.lng], {
        radius: 7,
        color: "#0b1f17",
        weight: 2,
        fillColor: palette.marker,
        fillOpacity: 1,
      }).addTo(this.map);

      state = { polyline, marker };
      this.trails.set(playerId, state);
    } else {
      state.polyline.setLatLngs(latLngs);
      if (points.length > 0) {
        const last = points[points.length - 1];
        state.marker.setLatLng([last.lat, last.lng]);
      }
    }

    if (playerId === "you" && this.followPlayer && points.length > 0) {
      const last = points[points.length - 1];
      this.map.panTo([last.lat, last.lng], { animate: true, duration: 0.25 });
    }
  }

  /** Obriši otvoreni trag s mape (npr. nakon rezanja ili zatvaranja). */
  clearTrail(playerId: PlayerId): void {
    const state = this.trails.get(playerId);
    if (!state) return;
    this.map.removeLayer(state.polyline);
    this.map.removeLayer(state.marker);
    this.trails.delete(playerId);
  }

  /**
   * Nacrtaj osvojeni teritorij (GeoJSON Polygon / MultiPolygon).
   */
  renderTerritory(
    playerId: PlayerId,
    geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon | null,
  ): void {
    const existing = this.territories.get(playerId);
    if (existing) {
      this.map.removeLayer(existing.polygon);
      this.territories.delete(playerId);
    }
    if (!geometry) return;

    const palette = this.palette(playerId);
    const polygon = L.geoJSON(
      { type: "Feature", properties: {}, geometry } as GeoJSON.Feature,
      {
        style: {
          color: palette.stroke,
          weight: 2,
          fillColor: palette.fill,
          fillOpacity: 0.55,
        },
      },
    ).addTo(this.map);

    this.territories.set(playerId, { polygon });
  }

  private palette(playerId: PlayerId): PlayerPalette {
    return PLAYER_COLORS[playerId] ?? PLAYER_COLORS.you;
  }
}
