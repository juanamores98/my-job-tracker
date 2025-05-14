"use client"

import { useState, useEffect } from "react"
import { MapPin, Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from "@/components/ui/command"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"

interface LocationSearchProps {
  onLocationSelect: (location: string) => void
  onClose?: () => void
  initialValue?: string
  className?: string
}

// Popular cities for quick selection
const POPULAR_CITIES = [
  "New York, USA",
  "London, UK",
  "San Francisco, USA",
  "Berlin, Germany",
  "Tokyo, Japan",
  "Singapore",
  "Toronto, Canada",
  "Sydney, Australia",
  "Paris, France",
  "Amsterdam, Netherlands",
  "Barcelona, Spain",
  "Remote"
]

// Countries for search results
const COUNTRIES = [
  "United States",
  "United Kingdom",
  "Canada",
  "Australia",
  "Germany",
  "France",
  "Japan",
  "China",
  "India",
  "Brazil",
  "Mexico",
  "Spain",
  "Italy",
  "Netherlands",
  "Sweden",
  "Norway",
  "Denmark",
  "Finland",
  "Singapore",
  "South Korea",
  "Ireland",
  "New Zealand",
  "Switzerland",
  "Austria",
  "Belgium",
  "Portugal",
  "Greece",
  "Poland",
  "Czech Republic",
  "Hungary"
]

// Major cities for each country (simplified for demo)
const CITIES: Record<string, string[]> = {
  "United States": [
    "New York", "Los Angeles", "Chicago", "Houston", "Phoenix", "Philadelphia",
    "San Antonio", "San Diego", "Dallas", "San Jose", "Austin", "Jacksonville",
    "Fort Worth", "Columbus", "San Francisco", "Charlotte", "Indianapolis",
    "Seattle", "Denver", "Washington DC", "Boston", "Nashville", "Portland"
  ],
  "United Kingdom": [
    "London", "Birmingham", "Manchester", "Glasgow", "Liverpool", "Bristol",
    "Edinburgh", "Leeds", "Sheffield", "Newcastle", "Belfast", "Cardiff"
  ],
  "Canada": [
    "Toronto", "Montreal", "Vancouver", "Calgary", "Edmonton", "Ottawa",
    "Winnipeg", "Quebec City", "Hamilton", "Kitchener"
  ],
  "Australia": [
    "Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide", "Gold Coast",
    "Canberra", "Newcastle", "Wollongong", "Hobart"
  ],
  "Germany": [
    "Berlin", "Hamburg", "Munich", "Cologne", "Frankfurt", "Stuttgart",
    "Düsseldorf", "Leipzig", "Dortmund", "Essen"
  ],
  "France": [
    "Paris", "Marseille", "Lyon", "Toulouse", "Nice", "Nantes",
    "Strasbourg", "Montpellier", "Bordeaux", "Lille"
  ],
  "Japan": [
    "Tokyo", "Yokohama", "Osaka", "Nagoya", "Sapporo", "Fukuoka",
    "Kobe", "Kyoto", "Kawasaki", "Saitama"
  ]
}

export function LocationSearch({
  onLocationSelect,
  onClose,
  initialValue = "",
  className = ""
}: LocationSearchProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [results, setResults] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Function to generate search results
  const generateResults = (term: string) => {
    if (!term.trim()) {
      return POPULAR_CITIES
    }

    const termLower = term.toLowerCase()
    let searchResults: string[] = []

    // Check if term matches any popular city
    const matchingPopularCities = POPULAR_CITIES.filter(city =>
      city.toLowerCase().includes(termLower)
    )
    searchResults = [...matchingPopularCities]

    // Check if term matches any country
    const matchingCountries = COUNTRIES.filter(country =>
      country.toLowerCase().includes(termLower)
    )

    // Add cities from matching countries
    matchingCountries.forEach(country => {
      const cities = CITIES[country] || []
      cities.forEach(city => {
        const location = `${city}, ${country}`
        if (!searchResults.includes(location)) {
          searchResults.push(location)
        }
      })
    })

    // Check if term matches any city
    Object.entries(CITIES).forEach(([country, cities]) => {
      const matchingCities = cities.filter(city =>
        city.toLowerCase().includes(termLower)
      )
      matchingCities.forEach(city => {
        const location = `${city}, ${country}`
        if (!searchResults.includes(location)) {
          searchResults.push(location)
        }
      })
    })

    // Limit results to avoid overwhelming the UI
    return searchResults.slice(0, 20)
  }

  // Update results when search term changes
  useEffect(() => {
    setIsLoading(true)

    // Simulate API call with a small delay
    const timer = setTimeout(() => {
      setResults(generateResults(searchTerm))
      setIsLoading(false)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchTerm])

  return (
    <Command className={className}>
      <div className="flex items-center border-b px-3">
        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
        <CommandInput
          placeholder="Search cities or countries..."
          value={searchTerm}
          onValueChange={setSearchTerm}
          className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
        />
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      <CommandList>
        <CommandEmpty>
          {isLoading ? (
            <div className="p-2 space-y-1">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : (
            <p className="py-3 px-4 text-sm text-muted-foreground">
              No locations found. Try a different search term or add your own.
            </p>
          )}
        </CommandEmpty>
        <ScrollArea className="max-h-[250px]">
          {isLoading ? (
            <div className="p-2 space-y-1">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : (
            <CommandGroup heading={searchTerm ? "Search Results" : "Popular Locations"}>
              {results.map((location, index) => (
                <CommandItem
                  key={index}
                  value={location}
                  onSelect={() => onLocationSelect(location)}
                >
                  <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                  {location}
                </CommandItem>
              ))}
              {searchTerm && (
                <CommandItem
                  value={`Use "${searchTerm}"`}
                  onSelect={() => onLocationSelect(searchTerm)}
                >
                  <MapPin className="mr-2 h-4 w-4 text-primary" />
                  Use "{searchTerm}"
                </CommandItem>
              )}
            </CommandGroup>
          )}
        </ScrollArea>
      </CommandList>
    </Command>
  )
}
