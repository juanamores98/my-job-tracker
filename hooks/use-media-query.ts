"use client"

import { useState, useEffect } from "react"

export const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia(query)

    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches)
    }

    // Set initial value
    setMatches(mediaQuery.matches)

    // Add event listener
    mediaQuery.addEventListener("change", handleChange)

    // Clean up
    return () => {
      mediaQuery.removeEventListener("change", handleChange)
    }
  }, [query])

  return matches
}
