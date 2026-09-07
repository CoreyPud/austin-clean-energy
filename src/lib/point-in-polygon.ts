// Standard ray-casting point-in-polygon test. Same algorithm used to recompute in_ae
// (see fix_in_ae_service_area.sql) and to draw the AE/council-district overlays -- this is
// the client-side counterpart, for assigning each loaded property to a council district.

type Ring = [number, number][]; // [lon, lat] pairs

function pointInRing(lon: number, lat: number, ring: Ring): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const intersect = yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/** Outer ring only -- fine for boundary data with no holes (AE service area, council districts). */
export function pointInGeoJsonGeometry(
  lon: number,
  lat: number,
  geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon,
): boolean {
  const polygons = geometry.type === "MultiPolygon" ? geometry.coordinates : [geometry.coordinates];
  for (const polygon of polygons) {
    if (pointInRing(lon, lat, polygon[0] as Ring)) return true;
  }
  return false;
}

/** Returns the first matching feature's `properties[idProp]`, or null if the point falls
 *  outside every feature (e.g. genuinely outside the polygon set, or a real gap in the data). */
export function findContainingFeatureId(
  lon: number,
  lat: number,
  featureCollection: GeoJSON.FeatureCollection,
  idProp: string,
): string | null {
  for (const feature of featureCollection.features) {
    const geom = feature.geometry;
    if (geom.type !== "Polygon" && geom.type !== "MultiPolygon") continue;
    if (pointInGeoJsonGeometry(lon, lat, geom)) {
      return feature.properties?.[idProp] ?? null;
    }
  }
  return null;
}
