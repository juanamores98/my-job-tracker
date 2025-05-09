"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { X, Plus, Tag as TagIcon, Check } from "lucide-react" // Renamed Tag to TagIcon to avoid conflict
import { TagBadge } from "./tag-badge" // Import TagBadge
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { technicalSkills, softSkills, requirements } from "@/lib/skill-categories"
import { useLanguage } from "@/lib/i18n"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

// Combine all skills for fast searching
const allSkills = [...technicalSkills, ...softSkills, ...requirements]

interface EnhancedTagInputProps {
  tags: string[]
  onTagsChange: (tags: string[]) => void
  placeholder?: string
}

export function EnhancedTagInput({ tags, onTagsChange, placeholder = "Add a tag..." }: EnhancedTagInputProps) {
  const [inputValue, setInputValue] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const { t } = useLanguage()

  // Filter skills based on input value
  const filteredSkills = allSkills
    .filter((skill) => skill.toLowerCase().includes(inputValue.toLowerCase()) && !tags.includes(skill))
    .slice(0, 15) // Limit results

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && inputValue) {
      e.preventDefault()
      addTag(inputValue)
    } else if (e.key === "," && inputValue) {
      e.preventDefault()
      addTag(inputValue.replace(/,$/, ""))
    } else if (e.key === "Backspace" && !inputValue && tags.length > 0) {
      // Remove the last tag when backspace is pressed on empty input
      removeTag(tags[tags.length - 1])
    }
  }

  const addTag = (tag: string) => {
    const normalizedTag = tag.trim()
    if (normalizedTag && !tags.includes(normalizedTag)) {
      onTagsChange([...tags, normalizedTag])
    }
    setInputValue("")
  }

  const removeTag = (tag: string) => {
    onTagsChange(tags.filter((t) => t !== tag))
  }

  const handleSelectSkill = (skill: string) => {
    addTag(skill)
    setIsOpen(false)
    inputRef.current?.focus()
  }

  // Close popover when clicking outside
  useEffect(() => {
    if (inputValue === "") {
      setIsOpen(false)
    } else if (inputValue.length > 1) {
      setIsOpen(true)
    }
  }, [inputValue])

  // Group tags by category
  const groupedTags = {
    technical: tags.filter((tag) => technicalSkills.includes(tag)),
    soft: tags.filter((tag) => softSkills.includes(tag)),
    requirements: tags.filter((tag) => requirements.includes(tag)),
    other: tags.filter(
      (tag) => !technicalSkills.includes(tag) && !softSkills.includes(tag) && !requirements.includes(tag),
    ),
  }

  const handleAddTag = (tag: string) => {
    const normalizedTag = tag.trim()
    if (normalizedTag && !tags.includes(normalizedTag)) {
      onTagsChange([...tags, normalizedTag])
    }
    setInputValue("")
  }

  const filteredSuggestions = allSkills
    .filter((skill) => skill.toLowerCase().includes(inputValue.toLowerCase()) && !tags.includes(skill))
    .slice(0, 15)

  return (
    <div className="space-y-2">
      {/* Group categories */}
      {Object.entries(groupedTags).map(
        ([category, categoryTags]) =>
          categoryTags.length > 0 && (
            <div key={category} className="space-y-1">
              <div className="text-xs text-muted-foreground capitalize">{category}</div>
              <div className="flex flex-wrap gap-2">
                {categoryTags.map((tag, index) => {
                  const gradients: Array<"blue" | "green" | "orange"> = ["blue", "green", "orange"]
                  // Determine gradient based on category or cycle
                  let gradient: "blue" | "green" | "orange" | "default" = "default"
                  if (category === "technical") gradient = "blue"
                  else if (category === "soft") gradient = "green"
                  else if (category === "requirements") gradient = "orange"
                  else gradient = gradients[index % gradients.length] // Cycle for 'other'

                  return (
                    <div key={tag} className="flex items-center">
                      <TagBadge tag={tag} gradient={gradient} className="text-sm px-2 py-1 h-auto rounded-r-none" />
                      <Button
                        variant="ghost" // This is a valid variant
                        size="icon"    // This is a valid size
                        className={cn(
                          "h-auto p-[5px] rounded-l-none border border-l-0 hover:bg-destructive/20",
                          gradient === "default"
                            ? "border-border hover:text-destructive text-muted-foreground"
                            : "border-white/30 hover:text-white text-white/80"
                        )}
                        onClick={() => removeTag(tag)}
                        aria-label={`Remove ${tag}`}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  )
                })}
              </div>
            </div>
          ),
      )}

      {/* Input with suggestions */}
      <div className="flex gap-2">
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <div className="relative flex-1">
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className="w-full pr-8" // Add padding for the icon
              />
              <TagIcon className="absolute right-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>
          </PopoverTrigger>
          <PopoverContent className="p-0 w-[--radix-popover-trigger-width]" align="start" side="bottom" sideOffset={5} alignOffset={0}>
            <Command className="rounded-lg border shadow-md">
              <CommandInput
                placeholder={placeholder || "Add tag..."}
                value={inputValue}
                onValueChange={setInputValue}
                className="h-9"
              />
              <CommandList>
                <CommandEmpty>
                  <div className="py-3 px-4 text-sm text-muted-foreground">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div>No matching tags found. Press Enter to create a new tag.</div>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          <p>Type a tag name and press Enter to add it</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </CommandEmpty>
                <CommandGroup>
                  {filteredSuggestions.map((suggestion) => (
                    <CommandItem
                      key={suggestion}
                      value={suggestion}
                      onSelect={() => {
                        handleAddTag(suggestion)
                        setInputValue("")
                      }}
                    >
                      <Check className={cn("mr-2 h-4 w-4", tags.includes(suggestion) ? "opacity-100" : "opacity-0")} />
                      {suggestion}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        <Button type="button" size="icon" onClick={() => addTag(inputValue)} disabled={!inputValue}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
