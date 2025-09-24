// Removed "use client" to allow metadata export

import type React from "react"
// Removed useState, Sidebar, DashboardHeader imports
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { StatusManagerProvider } from "@/lib/contexts/status-manager-context"
import { GlobalLayoutClient } from "@/components/global-layout-client" // Import the new client component
import { AuthProvider } from "@/lib/contexts/auth-context"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = { // This can now be exported
  title: "Job Tracker",
  description: "Track your job applications and interviews",
  generator: "v0dev",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Removed searchTerm state

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <StatusManagerProvider>
              <GlobalLayoutClient>{children}</GlobalLayoutClient>
            </StatusManagerProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
