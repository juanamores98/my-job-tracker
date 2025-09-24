"use client"

import Link from "next/link"
import { BarChart3, FileText, Home, Settings, LogOut } from "lucide-react"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useLanguage } from "@/lib/i18n"
import { ThemeToggle } from "./theme-toggle"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/lib/contexts/auth-context"

// interface SidebarProps { // Props removed
//   searchTerm: string
//   onSearchChange: (value: string) => void
// }

export function Sidebar(/*{ searchTerm, onSearchChange }: SidebarProps*/) { // Props removed
  const pathname = usePathname()
  const { t } = useLanguage()
  const { user, logout } = useAuth()

  const initials = user?.fullName
    ? user.fullName
        .split(" ")
        .map((part) => part.charAt(0))
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : user?.username?.slice(0, 2).toUpperCase() ?? ""

  return (
    <div className="hidden border-r bg-gray-100/40 lg:block dark:bg-gray-800/40 w-64">
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-14 items-center justify-between border-b px-4">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <FileText className="h-6 w-6 text-primary" />
            <span className="whitespace-nowrap">Job Tracker</span>
          </Link>
          <div className="flex items-center"> {/* Container for theme toggle */}
            {/* Search input removed */}
            <ThemeToggle />
          </div>
        </div>
        <div className="flex-1 overflow-auto py-2">
          <nav className="grid items-start px-2 text-sm font-medium">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href="/"
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary",
                      pathname === "/" ? "bg-primary/10 text-primary font-medium" : "text-gray-500 dark:text-gray-400",
                    )}
                  >
                    <Home className="h-4 w-4" />
                    {t("dashboard")}
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>View your job applications</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href="/resume"
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary",
                      pathname === "/resume"
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-gray-500 dark:text-gray-400",
                    )}
                  >
                    <FileText className="h-4 w-4" />
                    {t("resume")}
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>{t("downloadResume")}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href="/statistics"
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary",
                      pathname === "/statistics"
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-gray-500 dark:text-gray-400",
                    )}
                  >
                    <BarChart3 className="h-4 w-4" />
                    {t("statistics")}
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>View job market insights</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href="/settings"
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary",
                      pathname === "/settings"
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-gray-500 dark:text-gray-400",
                    )}
                  >
                    <Settings className="h-4 w-4" />
                    {t("settings")}
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Configure your preferences</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </nav>
        </div>
        <div className="mt-auto space-y-3 p-4">
          <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-background/60 px-3 py-2">
            <Avatar className="h-9 w-9">
              {user?.photo ? (
                <AvatarImage src={user.photo} alt={user.fullName || user.username} />
              ) : (
                <AvatarFallback>{initials || ""}</AvatarFallback>
              )}
            </Avatar>
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-sm font-semibold">{user?.fullName || user?.username}</p>
              <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </div>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={logout}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-primary dark:text-gray-400"
                >
                  <LogOut className="h-4 w-4" />
                  {t("logout")}
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Sign out of your account</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  )
}
