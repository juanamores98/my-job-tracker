"use client"

import { useState, useEffect } from "react"
import { X, Search, MapPin } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface MapSearchProps {
  onLocationSelect: (location: string) => void
  onClose: () => void
}

// Mock locations for demo purposes
const MOCK_LOCATIONS = [
  "New York, NY, USA",
  "San Francisco, CA, USA",
  "Seattle, WA, USA",
  "Austin, TX, USA",
  "Boston, MA, USA",
  "Chicago, IL, USA",
  "Los Angeles, CA, USA",
  "Denver, CO, USA",
  "Atlanta, GA, USA",
  "Miami, FL, USA",
  "Portland, OR, USA",
  "Nashville, TN, USA",
  "Remote",
]

export function MapSearch({ onLocationSelect, onClose }: MapSearchProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [results, setResults] = useState<string[]>([])

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setResults([])
      return
    }

    // Filter locations based on search term
    const filteredLocations = MOCK_LOCATIONS.filter((location) =>
      location.toLowerCase().includes(searchTerm.toLowerCase()),
    )

    setResults(filteredLocations)
  }, [searchTerm])

  return (
    <Card className="absolute z-10 w-full mt-1 shadow-lg">
      <CardContent className="p-2">
        <div className="flex items-center gap-2 mb-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search locations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
              autoFocus
            />
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="max-h-[200px] overflow-y-auto">
          {results.length > 0 ? (
            <ul className="space-y-1">
              {results.map((location, index) => (
                <li key={index}>
                  <button
                    type="button"
                    className="w-full text-left px-2 py-1.5 text-sm rounded-md hover:bg-accent flex items-center gap-2"
                    onClick={() => onLocationSelect(location)}
                  >
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                    {location}
                  </button>
                </li>
              ))}
            </ul>
          ) : searchTerm.trim() !== "" ? (
            <p className="text-sm text-muted-foreground p-2">No locations found</p>
          ) : (
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground p-2">Popular locations:</p>
              {MOCK_LOCATIONS.slice(0, 5).map((location, index) => (
                <button
                  key={index}
                  type="button"
                  className="w-full text-left px-2 py-1.5 text-sm rounded-md hover:bg-accent flex items-center gap-2"
                  onClick={() => onLocationSelect(location)}
                >
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                  {location}
                </button>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
