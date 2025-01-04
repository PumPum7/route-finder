import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useCallback,
} from "react";
import {
  Location,
  TravelMode,
  geocodeAddress,
  calculateRoute,
  getRouteInstructions,
} from "../lib/api";
import {
  calculateDistance,
  generatePermutations,
  generateRoutePDF,
} from "../lib/utils";
import { useToast } from "../hooks/use-toast";

interface RouteContextType {
  locations: Location[];
  addLocation: (address: string) => Promise<void>;
  removeLocation: (id: string) => void;
  calculateOptimalRoute: () => Promise<void>;
  route: number[][] | null;
  duration: number | null;
  shareRoute: () => void;
  downloadRoute: () => Promise<void>;
  isLoading: boolean;
  reorderLocations: (oldIndex: number, newIndex: number) => void;
  optimizeRoute: () => void;
  travelMode: TravelMode;
  setTravelMode: (mode: TravelMode) => void;
}

const RouteContext = createContext<RouteContextType | undefined>(undefined);

export function RouteProvider({ children }: { children: ReactNode }) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [route, setRoute] = useState<number[][] | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [travelMode, setTravelMode] = useState<TravelMode>("driving");
  const { toast } = useToast();

  const reorderLocations = useCallback((oldIndex: number, newIndex: number) => {
    setLocations((locations) => {
      const newLocations = [...locations];
      const [removed] = newLocations.splice(oldIndex, 1);
      newLocations.splice(newIndex, 0, removed);
      return newLocations;
    });
  }, []);

  // Load route from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const encodedLocations = params.get("locations");

    if (encodedLocations) {
      try {
        const decodedLocations = JSON.parse(atob(encodedLocations));
        if (Array.isArray(decodedLocations)) {
          Promise.all(
            decodedLocations.map((addr) => geocodeAddress(addr)),
          ).then((results) => {
            const validLocations = results.filter(
              (loc): loc is Location => loc !== null,
            );
            setLocations(validLocations);
          });
        }
      } catch (error) {
        console.error("Error loading route from URL:", error);
      }
    }
  }, []);

  useEffect(() => {
    if (locations.length > 1) {
      calculateOptimalRoute();
    }
  }, [locations]);

  const addLocation = async (address: string) => {
    setIsLoading(true);
    try {
      const location = await geocodeAddress(address);
      if (location) {
        setLocations((prev) => [...prev, location]);
      } else {
        toast({
          title: "Error",
          description: "Could not find the address. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const removeLocation = (id: string) => {
    setLocations((prev) => prev.filter((loc) => loc.id !== id));
    setRoute(null);
    setDuration(null);
  };

  const calculateOptimalRoute = async () => {
    setIsLoading(true);
    if (locations.length < 2) {
      toast({
        title: "Error",
        description: "Please add at least two locations.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      const routeResponse = await calculateRoute(locations, travelMode);
      if (routeResponse) {
        setRoute(routeResponse.coordinates);
        setDuration(routeResponse.duration);
      } else {
        toast({
          title: "Error",
          description: "Could not calculate the route. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const shareRoute = () => {
    if (locations.length < 2) {
      toast({
        title: "Cannot share route",
        description: "Add at least two locations to share a route",
        variant: "destructive",
      });
      return;
    }

    const addresses = locations.map((loc) => loc.address);
    const encodedLocations = btoa(JSON.stringify(addresses));
    const url = `${window.location.origin}${window.location.pathname}?locations=${encodedLocations}`;

    navigator.clipboard
      .writeText(url)
      .then(() => {
        toast({
          title: "Route shared!",
          description: "Link copied to clipboard",
        });
      })
      .catch(() => {
        toast({
          title: "Failed to copy",
          description: "Could not copy the link to clipboard",
          variant: "destructive",
        });
      });
  };

  const downloadRoute = async () => {
    if (locations.length < 2) {
      toast({
        title: "Cannot download route",
        description: "Add at least two locations to generate instructions",
        variant: "destructive",
      });
      return;
    }

    const instructions = await getRouteInstructions(locations, travelMode);
    if (instructions) {
      generateRoutePDF(locations, instructions);
      toast({
        title: "Route downloaded!",
        description: "Check your downloads folder for the PDF",
      });
    } else {
      toast({
        title: "Error",
        description: "Could not generate route instructions",
        variant: "destructive",
      });
    }
  };

  const optimizeRoute = useCallback(() => {
    if (locations.length < 3) {
      toast({
        title: "Cannot optimize route",
        description: "Need at least 3 locations to optimize",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Keep first and last locations fixed
      const fixedStart = locations[0];
      const fixedEnd = locations[locations.length - 1];
      const middlePoints = locations.slice(1, -1);

      // Generate all possible permutations of middle points
      const permutations = generatePermutations(middlePoints);

      // Find the shortest route
      let shortestDistance = Infinity;
      let bestOrder = null;

      permutations.forEach((perm) => {
        const fullRoute = [fixedStart, ...perm, fixedEnd];
        let totalDistance = 0;

        for (let i = 0; i < fullRoute.length - 1; i++) {
          totalDistance += calculateDistance(
            [fullRoute[i].lat, fullRoute[i].lon],
            [fullRoute[i + 1].lat, fullRoute[i + 1].lon],
          );
        }

        if (totalDistance < shortestDistance) {
          shortestDistance = totalDistance;
          bestOrder = fullRoute;
        }
      });

      if (bestOrder) {
        setLocations(bestOrder);
        toast({
          title: "Route optimized",
          description:
            "The route has been reordered for the shortest distance.",
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [locations, toast]);

  return (
    <RouteContext.Provider
      value={{
        locations,
        addLocation,
        removeLocation,
        calculateOptimalRoute,
        route,
        duration,
        shareRoute,
        downloadRoute,
        isLoading,
        reorderLocations,
        optimizeRoute,
        travelMode,
        setTravelMode,
      }}
    >
      {children}
    </RouteContext.Provider>
  );
}

export function useRoute() {
  const context = useContext(RouteContext);
  if (context === undefined) {
    throw new Error("useRoute must be used within a RouteProvider");
  }
  return context;
}
