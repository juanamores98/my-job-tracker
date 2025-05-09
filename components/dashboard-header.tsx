"use client"

import { Search } from "lucide-react"
import { UserNav } from "./user-nav"
import { ThemeToggle } from "./theme-toggle"
import { Input } from "@/components/ui/input"
import { useLanguage } from "@/lib/i18n"

interface DashboardHeaderProps {
  searchTerm: string
  onSearchChange: (value: string) => void
}

export function DashboardHeader({ searchTerm, onSearchChange }: DashboardHeaderProps) {
  const { t } = useLanguage()

  return (
    <div className="border-b">
      <div className="flex h-16 items-center px-4">
        <div className="font-bold text-xl flex items-center mr-8">
          <span className="text-primary mr-1">Job</span>
          <span>Tracker</span>
        </div>

        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder={t("searchJobs")}
            className="w-full pl-8 py-2"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        <div className="ml-auto flex items-center space-x-4">
          <ThemeToggle />
          <UserNav />
        </div>
      </div>
    </div>
  )
}
