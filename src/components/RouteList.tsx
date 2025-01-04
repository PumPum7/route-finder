import { Card, CardHeader, CardContent } from "./ui/card"
import { Button } from "./ui/button"
import { MapPin, RotateCw, X, Share2, Download, MoreHorizontal, Loader2 } from "lucide-react"
import { useRoute } from "../contexts/RouteContext"
import { cn } from "../lib/utils"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip"

export function RouteList() {
  const { locations, removeLocation, calculateOptimalRoute, duration, shareRoute, downloadRoute, isLoading } = useRoute()

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes} minutes`
  }

  return (
    <Card>
      <CardHeader className="space-y-2">
        <div className="space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h2 className="text-lg font-semibold">Route Stops</h2>
            <div className="flex flex-wrap gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm"
                    disabled={locations.length < 2}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <MoreHorizontal className="h-4 w-4 mr-2" />
                    )}
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={downloadRoute}>
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={shareRoute}>
                    <Share2 className="h-4 w-4 mr-2" />
                    Share Route
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={calculateOptimalRoute}
                    disabled={locations.length < 2 || isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <RotateCw className="h-4 w-4 mr-2" />
                    )}
                    Calculate
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Calculate optimal route</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>
        {duration && (
          <div className="text-sm text-muted-foreground">
            Estimated driving time: {formatDuration(duration)}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {locations.map((location, index) => (
            <div 
              key={location.id} 
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg transition-colors",
                "bg-muted hover:bg-muted/80"
              )}
            >
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                {index + 1}
              </div>
              <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="flex-1 truncate text-sm">{location.address}</span>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive text-muted-foreground"
                onClick={() => removeLocation(location.id)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          {locations.length === 0 && (
            <div className="text-sm text-muted-foreground text-center py-8 px-4">
              Add at least two addresses to calculate a route
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
