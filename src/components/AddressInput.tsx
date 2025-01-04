import { useState } from "react"
import { Plus, Loader2 } from "lucide-react"
import { Input } from "./ui/input"
import { Button } from "./ui/button"
import { Card, CardHeader, CardContent } from "./ui/card"
import { useRoute } from "../contexts/RouteContext"
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip"

export function AddressInput() {
  const [address, setAddress] = useState("")
  const { addLocation, isLoading } = useRoute()

  const handleAddAddress = async () => {
    if (!address.trim()) return
    await addLocation(address)
    setAddress("")
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddAddress()
    }
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold">Add Address</h2>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 w-full">
          <Input
            className="flex-1"
            placeholder="Enter address..."
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            onKeyDown={handleKeyPress}
          />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                onClick={handleAddAddress}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Add address to route</TooltipContent>
          </Tooltip>
        </div>
      </CardContent>
    </Card>
  )
}
