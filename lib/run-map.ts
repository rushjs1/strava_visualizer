export type Coordinate = [number, number];

// Strava uses Google's encoded-polyline format, latitude first. GeoJSON and
// Mapbox use longitude first. Invalid/truncated geometry is treated as no GPS.
export function decodeRoute(encoded?: string | null): Coordinate[] {
  if (!encoded) return [];
  let index = 0;
  let latitude = 0;
  let longitude = 0;
  const coordinates: Coordinate[] = [];
  function readDelta(): number {
    let result = 0;
    let shift = 0;
    let byte: number;
    do {
      if (index >= encoded!.length || shift > 30) throw new Error("Invalid polyline");
      byte = encoded!.charCodeAt(index++) - 63;
      if (byte < 0 || byte > 63) throw new Error("Invalid polyline");
      result += (byte & 31) * 2 ** shift;
      shift += 5;
    } while (byte >= 32);
    return result % 2 ? -(result + 1) / 2 : result / 2;
  }
  try {
    while (index < encoded.length) {
      latitude += readDelta();
      longitude += readDelta();
      if (Math.abs(latitude) > 90e5 || Math.abs(longitude) > 180e5) return [];
      coordinates.push([longitude / 1e5, latitude / 1e5]);
    }
    return coordinates.length > 1 ? coordinates : [];
  } catch {
    return [];
  }
}

export function routeBounds(routes: Coordinate[][]): [Coordinate, Coordinate] | null {
  let west = Infinity, south = Infinity, east = -Infinity, north = -Infinity;
  for (const route of routes) for (const [lng, lat] of route) {
    west = Math.min(west, lng); east = Math.max(east, lng);
    south = Math.min(south, lat); north = Math.max(north, lat);
  }
  return Number.isFinite(west) ? [[west, south], [east, north]] : null;
}

// Deliberately illustrative Indianapolis loops, only used with labeled mock data.
export function demoRoute(index: number): Coordinate[] {
  const center: Coordinate = [-86.17 + (index % 4) * .009, 39.775 + Math.floor(index / 4) * .012];
  return Array.from({ length: 65 }, (_, step) => {
    const angle = step / 64 * Math.PI * 2;
    const radius = .008 + (index % 3) * .003;
    return [center[0] + Math.cos(angle) * radius * (1 + .15 * Math.sin(angle * 3)),
      center[1] + Math.sin(angle) * radius * .75] as Coordinate;
  });
}
