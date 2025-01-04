import { useEffect, useMemo } from "react"
import { useTheme } from "../contexts/ThemeContext"
import { MapContainer as LeafletMapContainer, TileLayer, Polyline, Marker, useMap } from "react-leaflet"
import { useRoute } from "../contexts/RouteContext"
import "leaflet/dist/leaflet.css"
import L from "leaflet"

// Create custom numbered icons
function createNumberedIcon(number: number) {
  return L.divIcon({
    className: 'custom-marker-icon',
    html: `<div class="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium shadow-lg">${number}</div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  })
}

function MapUpdater() {
  const map = useMap()
  const { locations } = useRoute()

  useEffect(() => {
    if (locations.length > 0) {
      const bounds = L.latLngBounds(locations.map(loc => [loc.lat, loc.lon]))
      map.fitBounds(bounds, { padding: [50, 50] })
    }
  }, [locations, map])

  return null
}

export function MapContainer() {
  const { locations, route } = useRoute()
  const { theme } = useTheme()
  
  const center = useMemo(() => {
    if (locations.length > 0) {
      return [locations[0].lat, locations[0].lon] as [number, number]
    }
    return [51.505, -0.09] as [number, number] // Default to London
  }, [locations])

  return (
    <div className="h-full rounded-lg overflow-hidden border">
      <LeafletMapContainer
        center={center}
        zoom={13}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url={theme === 'dark' 
            ? "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          }
          className={theme === 'dark' ? 'brightness-[.7] contrast-[1.2]' : ''}
        />
        {locations.map((location, index) => (
          <Marker 
            key={location.id}
            position={[location.lat, location.lon]}
            icon={createNumberedIcon(index + 1)}
          />
        ))}
        {route && (
          <Polyline
            positions={route.map(([lon, lat]) => [lat, lon])}
            pathOptions={{
              color: 'rgb(59, 130, 246)',
              weight: 4,
              opacity: 0.8
            }}
            className="animate-in fade-in-50 duration-500"
          />
        )}
        <MapUpdater />
      </LeafletMapContainer>
    </div>
  )
}
