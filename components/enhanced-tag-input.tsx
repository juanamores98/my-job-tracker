"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { X, Plus, Tag as TagIcon, Check } from "lucide-react" // Renamed Tag to TagIcon to avoid conflict
import { TagBadge } from "./tag-badge" // Import TagBadge
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import * as skillsData from "@/lib/skills"
// import { useLanguage } from "@/lib/i18n"
// import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

// Combine all skills for fast searching
const allSkills = [...skillsData.technicalSkills, ...skillsData.softSkills, ...skillsData.requirements]

interface EnhancedTagInputProps {
  tags: string[]
  onTagsChange: (tags: string[]) => void
  placeholder?: string
  suggestions?: string[]
  allSuggestions?: string[]
}

export function EnhancedTagInput({ tags, onTagsChange, placeholder = "Add a tag...", suggestions, allSuggestions }: EnhancedTagInputProps) {
  const [inputValue, setInputValue] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  // const { t } = useLanguage() // Uncomment if needed for translations

  // Use provided suggestions or allSuggestions or default to all skills
  const skillsToUse = suggestions || allSuggestions || allSkills

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

  // Removed unused function

  // Control popover visibility based on input
  useEffect(() => {
    if (inputValue === "") {
      setIsOpen(false)
    } else {
      // Open the popover as soon as the user starts typing
      setIsOpen(true)
    }
  }, [inputValue])

  // Group tags by category using skillsData.categorizeSkill
  const groupedTags: Record<string, string[]> = {
    technical: [],
    soft: [],
    requirements: [],
    other: [],
  };
  tags.forEach(tag => {
    const category = skillsData.categorizeSkill(tag);
    switch (category) {
      case "technical":
        groupedTags.technical.push(tag);
        break;
      case "soft":
        groupedTags.soft.push(tag);
        break;
      case "requirement":
        groupedTags.requirements.push(tag);
        break;
      default: // "unknown"
        groupedTags.other.push(tag);
        break;
    }
  });

  // The old logic based on allSuggestions is no longer needed here
  // if (allSuggestions) { ... }

  const handleAddTag = (tag: string) => {
    const normalizedTag = tag.trim()
    if (normalizedTag && !tags.includes(normalizedTag)) {
      onTagsChange([...tags, normalizedTag])
    }
    setInputValue("")
  }

  // Get filtered suggestions using skillsData.getSimilarSkills
  const filteredSuggestions = inputValue.length > 0
    ? skillsData.getSimilarSkills(inputValue, 20).filter(skill => !tags.includes(skill))
    : suggestions?.filter(s => !tags.includes(s)).slice(0, 8) || []

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
                  let isDefaultGradient = true

                  if (category === "technical") {
                    gradient = "blue"
                    isDefaultGradient = false
                  } else if (category === "soft") {
                    gradient = "green"
                    isDefaultGradient = false
                  } else if (category === "requirements") {
                    gradient = "orange"
                    isDefaultGradient = false
                  } else {
                    gradient = gradients[index % gradients.length] // Cycle for 'other'
                    isDefaultGradient = false
                  }

                  return (
                    <div key={tag} className="flex items-center">
                      <TagBadge tag={tag} gradient={gradient} className="text-sm px-2 py-1 h-auto rounded-r-none" />
                      <Button
                        variant="ghost" // This is a valid variant
                        size="icon"    // This is a valid size
                        className={cn(
                          "h-auto p-[5px] rounded-l-none border border-l-0 hover:bg-destructive/20",
                          isDefaultGradient
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
                placeholder={"Search skills..."} // Generic placeholder
                value={inputValue}
                onValueChange={setInputValue}
                className="h-9"
                autoFocus
              />
              <CommandList>
                <CommandEmpty>
                  <div className="py-3 px-4 text-sm text-muted-foreground">
                    {inputValue.length > 0 ? (
                      <div className="flex flex-col gap-1">
                        <div>No matching skills found.</div>
                        <div className="text-xs">Press Enter to add "{inputValue}" as a custom skill.</div>
                      </div>
                    ) : (
                      <div>Start typing to search for skills...</div>
                    )}
                  </div>
                </CommandEmpty>
                <CommandGroup>
                  {filteredSuggestions.length > 0 && (
                    <div className="px-2 py-1.5 text-xs text-muted-foreground">
                      {filteredSuggestions.length} {filteredSuggestions.length === 1 ? 'result' : 'results'} found
                    </div>
                  )}
                  {filteredSuggestions.map((suggestion) => {
                    // Determine the category of the suggestion
                    let category = "";
                    let categoryColor = "";

                    if (skillsData.technicalSkills.includes(suggestion)) {
                      category = "Technical";
                      categoryColor = "text-blue-500";
                    } else if (skillsData.softSkills.includes(suggestion)) {
                      category = "Soft Skill";
                      categoryColor = "text-rose-500";
                    } else if (skillsData.requirements.includes(suggestion)) {
                      category = "Requirement";
                      categoryColor = "text-amber-500";
                    }

                    return (
                      <CommandItem
                        key={suggestion}
                        value={suggestion}
                        onSelect={() => {
                          handleAddTag(suggestion)
                          setInputValue("")
                        }}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center">
                          <Check className={cn("mr-2 h-4 w-4", tags.includes(suggestion) ? "opacity-100" : "opacity-0")} />
                          <span>{suggestion}</span>
                        </div>
                        {category && (
                          <span className={cn("text-xs", categoryColor)}>{category}</span>
                        )}
                      </CommandItem>
                    );
                  })}
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
