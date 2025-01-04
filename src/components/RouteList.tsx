import { Card, CardHeader, CardContent } from "./ui/card"
import { Button } from "./ui/button"
import { MapPin, RotateCw, X, Share2, Download, MoreHorizontal, Loader2, GripVertical, Trash } from "lucide-react"
import { DndContext, DragEndEvent, MouseSensor, TouchSensor, useSensor, useSensors } from "@dnd-kit/core"
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { useRoute } from "../contexts/RouteContext"
import { cn, formatDuration } from "../lib/utils"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip"
import { Location } from "../lib/api"

function SortableLocation({ location, index }: { location: Location, index: number }) {
  const { removeLocation } = useRoute()
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: location.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div 
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg transition-colors",
        "bg-muted hover:bg-muted/80"
      )}
    >
      <Button 
        variant="ghost" 
        size="sm" 
        className="h-8 w-8 p-0 cursor-grab active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </Button>
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
  )
}

export function RouteList() {
  const { locations, calculateOptimalRoute, duration, shareRoute, downloadRoute, isLoading, reorderLocations, optimizeRoute, removeLocation } = useRoute()
  
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 8,
      },
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    
    if (over && active.id !== over.id) {
      const oldIndex = locations.findIndex((loc) => loc.id === active.id)
      const newIndex = locations.findIndex((loc) => loc.id === over.id)
      
      reorderLocations(oldIndex, newIndex)
    }
  }

  const removeAllLocations = () => {
    for (const location of locations) {
      removeLocation(location.id)
    }
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
                    Actions
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={optimizeRoute} disabled={locations.length < 3}>
                    <RotateCw className="h-4 w-4 mr-2" />
                    Optimize Route
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={downloadRoute}>
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={shareRoute}>
                    <Share2 className="h-4 w-4 mr-2" />
                    Share Route
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={removeAllLocations}>
                    <Trash className="h-4 w-4 mr-2" />
                    Remove All
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
          <DndContext 
            sensors={sensors}
            onDragEnd={handleDragEnd}
          >
            <SortableContext 
              items={locations.map(loc => loc.id)}
              strategy={verticalListSortingStrategy}
            >
              {locations.map((location, index) => (
                <SortableLocation 
                  key={location.id} 
                  location={location}
                  index={index}
                />
              ))}
            </SortableContext>
          </DndContext>
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
