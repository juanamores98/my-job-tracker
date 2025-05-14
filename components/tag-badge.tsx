"use client"

import { cn } from "@/lib/utils"
import { Tag as TagIcon } from "lucide-react"

export interface TagBadgeProps {
  tag: string
  className?: string
  gradient?: "blue" | "green" | "orange" | "default" | "rose" | "amber"
  selected?: boolean
  onClick?: () => void
}

const gradientClasses = {
  blue: "bg-gradient-to-r from-blue-500 to-purple-600 text-white",
  green: "bg-gradient-to-r from-green-400 to-teal-500 text-white",
  orange: "bg-gradient-to-r from-orange-400 to-red-500 text-white",
  rose: "bg-gradient-to-r from-rose-400 to-pink-600 text-white",
  amber: "bg-gradient-to-r from-amber-400 to-yellow-500 text-white",
  default: "bg-secondary text-secondary-foreground",
}

export function TagBadge({ tag, className, gradient = "default", selected = false, onClick }: TagBadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        gradientClasses[gradient],
        selected && "ring-2 ring-white/20 shadow-lg scale-105",
        onClick && "cursor-pointer hover:opacity-90",
        className,
      )}
      onClick={onClick}
    >
      <TagIcon className="mr-1.5 h-3 w-3" />
      {tag}
    </div>
  )
}
