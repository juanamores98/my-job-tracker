"use client"

import type React from "react"
import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

import { Sidebar } from "@/components/sidebar"
import { DataMigrationClient } from "@/components/data-migration-client"
import { Toaster } from "@/components/ui/toaster"
import { useAuth } from "@/lib/contexts/auth-context"

interface GlobalLayoutClientProps {
  children: React.ReactNode
}

const AUTH_ROUTES = new Set(["/login", "/register"])

function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  const isAuthRoute = pathname ? AUTH_ROUTES.has(pathname) : false

  useEffect(() => {
    if (loading) return

    if (!user && !isAuthRoute) {
      router.replace("/login")
    } else if (user && isAuthRoute) {
      router.replace("/")
    }
  }, [user, isAuthRoute, loading, router])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (isAuthRoute) {
    return (
      <>
        <DataMigrationClient />
        <div className="min-h-screen bg-background">{children}</div>
        <Toaster />
      </>
    )
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Redirecting...</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-background">
      <DataMigrationClient />
      <Sidebar />
      <main className="flex flex-1 flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
      </main>
      <Toaster />
    </div>
  )
}

export function GlobalLayoutClient({ children }: GlobalLayoutClientProps) {
  return <AuthenticatedLayout>{children}</AuthenticatedLayout>
}