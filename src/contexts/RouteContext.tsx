import { createContext, useContext, useState, ReactNode, useEffect } from "react"
import { Location, geocodeAddress, calculateRoute, getRouteInstructions } from "../lib/api"
import { generateRoutePDF } from "../lib/utils"
import { useToast } from "../hooks/use-toast"

interface RouteContextType {
  locations: Location[]
  addLocation: (address: string) => Promise<void>
  removeLocation: (id: string) => void
  calculateOptimalRoute: () => Promise<void>
  route: number[][] | null
  duration: number | null
  shareRoute: () => void
  downloadRoute: () => Promise<void>
  isLoading: boolean
}

const RouteContext = createContext<RouteContextType | undefined>(undefined)

export function RouteProvider({ children }: { children: ReactNode }) {
  const [locations, setLocations] = useState<Location[]>([])
  const [route, setRoute] = useState<number[][] | null>(null)
  const [duration, setDuration] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  // Load route from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const encodedLocations = params.get('locations')
    
    if (encodedLocations) {
      try {
        const decodedLocations = JSON.parse(atob(encodedLocations))
        if (Array.isArray(decodedLocations)) {
          Promise.all(decodedLocations.map(addr => geocodeAddress(addr)))
            .then(results => {
              const validLocations = results.filter((loc): loc is Location => loc !== null)
              setLocations(validLocations)
            })
        }
      } catch (error) {
        console.error("Error loading route from URL:", error)
      }
    }
  }, [])

  const addLocation = async (address: string) => {
    setIsLoading(true)
    try {
      const location = await geocodeAddress(address)
      if (location) {
        setLocations(prev => [...prev, location])
      } else {
        toast({
          title: "Error",
          description: "Could not find the address. Please try again.",
          variant: "destructive"
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  const removeLocation = (id: string) => {
    setLocations(prev => prev.filter(loc => loc.id !== id))
    setRoute(null)
    setDuration(null)
  }

  const calculateOptimalRoute = async () => {
    setIsLoading(true)
    if (locations.length < 2) {
      toast({
        title: "Error",
        description: "Please add at least two locations.",
        variant: "destructive"
      })
      setIsLoading(false)
      return
    }

    try {
      const routeResponse = await calculateRoute(locations)
      if (routeResponse) {
        setRoute(routeResponse.coordinates)
        setDuration(routeResponse.duration)
      } else {
        toast({
          title: "Error",
          description: "Could not calculate the route. Please try again.",
          variant: "destructive"
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  const shareRoute = () => {
    if (locations.length < 2) {
      toast({
        title: "Cannot share route",
        description: "Add at least two locations to share a route",
        variant: "destructive"
      })
      return
    }

    const addresses = locations.map(loc => loc.address)
    const encodedLocations = btoa(JSON.stringify(addresses))
    const url = `${window.location.origin}${window.location.pathname}?locations=${encodedLocations}`
    
    navigator.clipboard.writeText(url).then(() => {
      toast({
        title: "Route shared!",
        description: "Link copied to clipboard"
      })
    }).catch(() => {
      toast({
        title: "Failed to copy",
        description: "Could not copy the link to clipboard",
        variant: "destructive"
      })
    })
  }

  const downloadRoute = async () => {
    if (locations.length < 2) {
      toast({
        title: "Cannot download route",
        description: "Add at least two locations to generate instructions",
        variant: "destructive"
      })
      return
    }

    const instructions = await getRouteInstructions(locations)
    if (instructions) {
      generateRoutePDF(locations, instructions)
      toast({
        title: "Route downloaded!",
        description: "Check your downloads folder for the PDF"
      })
    } else {
      toast({
        title: "Error",
        description: "Could not generate route instructions",
        variant: "destructive"
      })
    }
  }

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
        isLoading
      }}
    >
      {children}
    </RouteContext.Provider>
  )
}

export function useRoute() {
  const context = useContext(RouteContext)
  if (context === undefined) {
    throw new Error("useRoute must be used within a RouteProvider")
  }
  return context
}
