import { AddressInput } from "./components/AddressInput";
import { MapContainer } from "./components/MapContainer";
import { RouteList } from "./components/RouteList";
import { RouteProvider } from "./contexts/RouteContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ThemeToggle } from "./components/ui/theme-toggle";
import { Toaster } from "./components/ui/toaster";
import { TooltipProvider } from "./components/ui/tooltip";

function App() {
  return (
    <TooltipProvider>
      <ThemeProvider>
        <RouteProvider>
          <div className="min-h-screen bg-background flex flex-col justify-between w-screen">
            <div className="w-full max-w-7xl px-4 sm:px-6 lg:px-0 py-4 mx-auto">
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">
                  Route Finder
                </h1>
                <ThemeToggle />
              </div>

              {/* Mobile: Map on top, controls below */}
              <div className="block md:hidden mb-4 h-[300px]">
                <MapContainer />
              </div>

              {/* Desktop: Side-by-side layout */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-4">
                  <AddressInput />
                  <RouteList />
                </div>
                <div className="hidden md:block md:col-span-2 h-[600px]">
                  <MapContainer />
                </div>
              </div>
            </div>
            <Toaster />
          </div>
        </RouteProvider>
      </ThemeProvider>
    </TooltipProvider>
  );
}

export default App;
