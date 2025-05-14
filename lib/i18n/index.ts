"use client"

import * as React from "react"
import { createContext, useContext, useState, useEffect } from "react"

// Define available languages
export const LANGUAGES = [
  { code: "en", name: "English" },
  { code: "es", name: "Español" },
  { code: "fr", name: "Français" },
  { code: "de", name: "Deutsch" },
  { code: "zh", name: "中文" },
  { code: "ja", name: "日本語" },
  { code: "ko", name: "한국어" },
  { code: "pt", name: "Português" },
  { code: "it", name: "Italiano" },
  { code: "ru", name: "Русский" },
]

// Simplified translations - only include essential keys
export const translations = {
  en: {
    dashboard: "Dashboard",
    resume: "Resume",
    statistics: "Statistics",
    settings: "Settings",
    logout: "Logout",
    uploadNewResume: "Upload a new resume",
    downloadResume: "Download this resume",
    previewResume: "Preview this resume",
    renameResume: "Rename this resume",
    deleteResume: "Delete this resume",
  },
  es: {
    dashboard: "Tablero",
    resume: "Currículum",
    statistics: "Estadísticas",
    settings: "Configuración",
    logout: "Cerrar sesión",
    uploadNewResume: "Subir un nuevo currículum",
    downloadResume: "Descargar este currículum",
    previewResume: "Vista previa de este currículum",
    renameResume: "Renombrar este currículum",
    deleteResume: "Eliminar este currículum",
  },
  fr: {
    dashboard: "Tableau de bord",
    resume: "CV",
    statistics: "Statistiques",
    settings: "Paramètres",
    logout: "Déconnexion",
    uploadNewResume: "Télécharger un nouveau CV",
    downloadResume: "Télécharger ce CV",
    previewResume: "Aperçu de ce CV",
    renameResume: "Renommer ce CV",
    deleteResume: "Supprimer ce CV",
  },
  de: {
    dashboard: "Dashboard",
    resume: "Lebenslauf",
    statistics: "Statistiken",
    settings: "Einstellungen",
    logout: "Abmelden",
    uploadNewResume: "Neuen Lebenslauf hochladen",
    downloadResume: "Diesen Lebenslauf herunterladen",
    previewResume: "Vorschau dieses Lebenslaufs",
    renameResume: "Diesen Lebenslauf umbenennen",
    deleteResume: "Diesen Lebenslauf löschen",
  },
}

// Create language context
type LanguageContextType = {
  language: string
  setLanguage: (lang: string) => void
  t: (key: string, interpolations?: Record<string, string | number>) => string // Modified
}

const defaultLanguageContext: LanguageContextType = {
  language: "en",
  setLanguage: () => {},
  t: (key: string, _interpolations?: Record<string, string | number>) => key, // Modified
}

export const LanguageContext = createContext<LanguageContextType>(defaultLanguageContext)

// Language provider component
export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState("en")
  const [isClient, setIsClient] = useState(false)

  // Handle client-side rendering
  useEffect(() => {
    setIsClient(true)

    // Load language from localStorage on mount
    try {
      const storedSettings = localStorage.getItem("job-tracker-user-settings")
      if (storedSettings) {
        const settings = JSON.parse(storedSettings)
        if (settings.language) {
          setLanguageState(settings.language)
        }
      }
    } catch (error) {
      console.error("Error loading language setting:", error)
    }
  }, [])

  // Set language and update localStorage
  const setLanguage = (lang: string) => {
    setLanguageState(lang)

    // Update language in settings
    try {
      const storedSettings = localStorage.getItem("job-tracker-user-settings")
      if (storedSettings) {
        const settings = JSON.parse(storedSettings)
        settings.language = lang
        localStorage.setItem("job-tracker-user-settings", JSON.stringify(settings))
      } else {
        // Create settings if they don't exist
        const newSettings = { language: lang }
        localStorage.setItem("job-tracker-user-settings", JSON.stringify(newSettings))
      }
    } catch (error) {
      console.error("Error updating language setting:", error)
    }
  }

  // Translation function
  const t = (key: string, interpolations?: Record<string, string | number>): string => {
    if (!isClient) return key // Return key during SSR

    const langDict = translations[language as keyof typeof translations] || translations.en
    let translatedString = (langDict as any)[key] || key

    if (interpolations) {
      Object.keys(interpolations).forEach((interpolationKey) => {
        const value = interpolations[interpolationKey]
        translatedString = translatedString.replace(
          new RegExp(`{{${interpolationKey}}}`, "g"),
          String(value) // Ensure value is a string
        )
      })
    }
    return translatedString
  }

  return React.createElement(LanguageContext.Provider, {
    value: { language, setLanguage, t },
    children
  })
}

// Hook to use language context
export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}
