/**
 * Zajednički tipovi za Territory.
 * Koriste se u GPS, Map i Territory modulima.
 */

/** Geografska točka: latituda / longituda u WGS84. */
export type LatLng = {
  lat: number;
  lng: number;
};

/** Jedinstveni identifikator igrača (lokalni prototip: "you" | "opponent"). */
export type PlayerId = string;

/** Otvoreni trag koji još nije zatvoren u teritorij. */
export type Trail = {
  playerId: PlayerId;
  points: LatLng[];
};

/** Osvojeni poligon jednog igrača. */
export type ClaimedTerritory = {
  playerId: PlayerId;
  /** GeoJSON Polygon ili MultiPolygon koordinate (lng, lat) — Turf format. */
  geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon;
};

/** Boje igrača na mapi. */
export type PlayerPalette = {
  trail: string;
  fill: string;
  stroke: string;
  marker: string;
};

export const PLAYER_COLORS: Record<string, PlayerPalette> = {
  you: {
    trail: "#3dff9a",
    fill: "#1dbf6eaa",
    stroke: "#0f8f4e",
    marker: "#3dff9a",
  },
  opponent: {
    trail: "#ff5c5c",
    fill: "#c62828aa",
    stroke: "#8e1b1b",
    marker: "#ff5c5c",
  },
};
