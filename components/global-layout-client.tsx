"use client"

import type React from "react"
// Removed useState
// Removed usePathname as Sidebar is always shown now
import { Sidebar } from "@/components/sidebar"
// Removed DashboardHeader import
import { DataMigrationClient } from "@/components/data-migration-client"

interface GlobalLayoutClientProps {
  children: React.ReactNode
}

export function GlobalLayoutClient({ children }: GlobalLayoutClientProps) {
  // Removed searchTerm state
  // Removed pathname and showSidebar logic

  return (
    <div className="flex min-h-screen bg-background">
      {/* Run data migration on client-side */}
      <DataMigrationClient />

      <Sidebar /> {/* Sidebar is now always rendered */}
      <main className="flex-1 flex flex-col overflow-hidden"> {/* Removed conditional w-full class */}
        {/* DashboardHeader (search bar) removed from global layout */}
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>
      </main>
    </div>
  )
}