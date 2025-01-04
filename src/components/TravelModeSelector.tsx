import { Car, Bike, PersonStanding } from "lucide-react";
import { Button } from "./ui/button";
import { useRoute } from "../contexts/RouteContext";
import { TravelMode } from "../lib/api";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

const modeIcons = {
  driving: Car,
  cycling: Bike,
  walking: PersonStanding,
};

const modeLabels = {
  driving: "Driving",
  cycling: "Cycling",
  walking: "Walking",
};

export function TravelModeSelector() {
  const { travelMode, setTravelMode, isLoading } = useRoute();

  const handleModeChange = (mode: TravelMode) => {
    if (mode !== travelMode) {
      setTravelMode(mode);
    }
  };

  return (
    <div className="flex gap-1 bg-muted p-1 rounded-md">
      {(Object.keys(modeIcons) as TravelMode[]).map((mode) => {
        const Icon = modeIcons[mode];
        return (
          <Tooltip key={mode}>
            <TooltipTrigger asChild>
              <Button
                variant={travelMode === mode ? "default" : "ghost"}
                size="sm"
                className="px-3"
                onClick={() => handleModeChange(mode)}
                disabled={isLoading}
              >
                <Icon className="h-4 w-4" />
                <span className="sr-only">{modeLabels[mode]}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{modeLabels[mode]} mode</p>
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}
