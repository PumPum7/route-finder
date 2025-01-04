import { useState, useEffect, useRef } from "react";
import { useToast } from "../hooks/use-toast";
import { Plus, Loader2, MapPin, Locate } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardHeader, CardContent } from "./ui/card";
import { useRoute } from "../contexts/RouteContext";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { Input } from "./ui/input";
import { cn } from "@/lib/utils";

interface Suggestion {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

export function AddressInput() {
  const [address, setAddress] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { addLocation, isLoading } = useRoute();
  const { toast } = useToast();

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Error",
        description: "Geolocation is not supported by your browser",
        variant: "destructive",
      });
      return;
    }

    setIsLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}`,
          );
          const data = await response.json();
          if (data.display_name) {
            await addLocation(data.display_name);
          } else {
            toast({
              title: "Error",
              description: "Could not get address for current location",
              variant: "destructive",
            });
          }
        } catch (error) {
          console.error("Error getting location:", error);
          toast({
            title: "Error",
            description: "Could not get current location",
            variant: "destructive",
          });
        } finally {
          setIsLoadingLocation(false);
        }
      },
      (error) => {
        setIsLoadingLocation(false);
        toast({
          title: "Error",
          description: error.message || "Could not get current location",
          variant: "destructive",
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      },
    );
  };
  const inputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (address.trim().length < 3) {
        setSuggestions([]);
        return;
      }

      setIsSearching(true);
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            address,
          )}&limit=5&dedupe=1`,
        );
        const data = await response.json();
        setSuggestions(
          data
            .map((item: {
              place_id: number;
              display_name: string;
              lat: string;
              lon: string;
              name: string;
            }) => ({
              place_id: item.place_id,
              display_name:
                item.name !== ""
                  ? item.name
                  : item.display_name.replace(/^(\d+),\s*([^,]+)/, "$2 $1"),
              lat: item.lat,
              lon: item.lon,
            }))
            .filter(
              (item: Suggestion, index: number, self: Suggestion[]) =>
                index ===
                self.findIndex(
                  (t: Suggestion) => t.lat === item.lat && t.lon === item.lon,
                ),
            ),
        );
      } catch (error) {
        console.error("Error fetching suggestions:", error);
      } finally {
        setIsSearching(false);
      }
    };

    const timeoutId = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timeoutId);
  }, [address]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAddAddress = async (selectedAddress?: Suggestion) => {
    if (selectedAddress) {
      await addLocation(selectedAddress.display_name);
      setAddress("");
      setSuggestions([]);
      setShowSuggestions(false);
    } else if (address.trim()) {
      await addLocation(address);
      setAddress("");
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold">Add Address</h2>
      </CardHeader>
      <CardContent>
        <div className="relative" ref={inputRef}>
          <div className="flex gap-2 w-full items-start">
            <div className="relative flex-1">
              <Input
                placeholder="Enter address..."
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                className="w-full"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleAddAddress();
                  }
                }}
              />
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute w-full mt-1 py-1 bg-popover rounded-md border shadow-md z-50 max-h-[300px] overflow-y-auto">
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion.place_id}
                      className={cn(
                        "w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground",
                        "focus:bg-accent focus:text-accent-foreground focus:outline-none",
                      )}
                      onClick={() => handleAddAddress(suggestion)}
                    >
                      <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="truncate text-left">
                        {suggestion.display_name}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => handleAddAddress()}
                    disabled={isLoading || isSearching || isLoadingLocation}
                  >
                    {isLoading || isSearching ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Add address to route</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    onClick={handleGetLocation}
                    disabled={isLoading || isSearching || isLoadingLocation}
                  >
                    <Locate className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Use current location</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
