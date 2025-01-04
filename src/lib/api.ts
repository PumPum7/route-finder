const NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org";

const OSRM_BASE_URL = "https://router.project-osrm.org/route/v1";

interface RouteStep {
  distance: number;
  duration: number;
  instruction: string;
}

export interface RouteInstructions {
  steps: RouteStep[];
  distance: number;
  duration: number;
}

interface Step {
  distance: number;
  duration: number;
  instruction: string;
  maneuver: {
    modifier: string;
    type: string;
  };
  name: string;
  geometry: {
    coordinates: [number, number][];
  };
}

interface Leg {
  steps: Step[];
}

export async function getRouteInstructions(
  locations: Location[]
): Promise<RouteInstructions | null> {
  if (locations.length < 2) return null;

  const coordinates = locations.map((loc) => `${loc.lon},${loc.lat}`).join(";");

  try {
    const response = await fetch(
      `${OSRM_BASE_URL}/driving/${coordinates}?overview=full&geometries=geojson&steps=true`
    );
    const data = await response.json();

    if (data.routes && data.routes[0]) {
      const route = data.routes[0];
      const steps = route.legs.flatMap((leg: Leg) =>
        leg.steps.map((step: Step) => ({
          distance: step.distance,
          duration: step.duration,
          instruction:
            step.maneuver.type === "arrive"
              ? `Arrive at destination (${step.name})`
              : step.maneuver.type === "depart"
              ? `Depart from origin (${step.name})`
              : (step.maneuver.type === "turn" &&
                step.maneuver.modifier !== "straight"
                  ? `Turn ${step.maneuver.modifier} onto `
                  : "Continue on ") + step.name,
          maneuver: step.maneuver
        }))
      );

      return {
        steps,
        distance: route.distance,
        duration: route.duration,
      };
    }
    return null;
  } catch (error) {
    console.error("Error getting route instructions:", error);
    return null;
  }
}

export interface Location {
  id: string;
  address: string;
  lat: number;
  lon: number;
}

export async function geocodeAddress(
  address: string
): Promise<Location | null> {
  try {
    const response = await fetch(
      `${NOMINATIM_BASE_URL}/search?format=json&q=${encodeURIComponent(
        address
      )}`
    );
    const data = await response.json();

    if (data && data[0]) {
      return {
        id: crypto.randomUUID(),
        address,
        lat: parseFloat(data[0].lat),
        lon: parseFloat(data[0].lon),
      };
    }
    return null;
  } catch (error) {
    console.error("Error geocoding address:", error);
    return null;
  }
}

interface RouteResponse {
  coordinates: [number, number][];
  duration: number; // in seconds
}

export async function calculateRoute(
  locations: Location[]
): Promise<RouteResponse | null> {
  if (locations.length < 2) return null;

  const coordinates = locations.map((loc) => `${loc.lon},${loc.lat}`).join(";");

  try {
    const response = await fetch(
      `${OSRM_BASE_URL}/driving/${coordinates}?overview=full&geometries=geojson`
    );
    const data = await response.json();

    if (data.routes && data.routes[0]) {
      return {
        coordinates: data.routes[0].geometry.coordinates,
        duration: data.routes[0].duration, // in seconds
      };
    }
    return null;
  } catch (error) {
    console.error("Error calculating route:", error);
    return null;
  }
}
