"use client"

import { useEffect, useState } from "react"
import { analyzeJobDescription } from "@/lib/job-analyzer"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Plus, Code, Heart, Award } from "lucide-react"
import { useLanguage } from "@/lib/i18n"
import { TagBadge } from "./tag-badge"

interface KeywordSuggestionsProps {
  text: string
  onAddKeywords: (keywords: string[]) => void
}

interface CategoryKeywords {
  technicalSkills: string[]
  softSkills: string[]
  requirements: string[]
}

export function KeywordSuggestions({ text, onAddKeywords }: KeywordSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<CategoryKeywords>({
    technicalSkills: [],
    softSkills: [],
    requirements: [],
  })
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([])
  const { t } = useLanguage()

  useEffect(() => {
    if (text && text.length > 30) {
      // Only extract keywords if we have enough text
      const extracted = analyzeJobDescription(text)
      setSuggestions(extracted)
    } else {
      setSuggestions({
        technicalSkills: [],
        softSkills: [],
        requirements: [],
      })
    }
  }, [text])

  const totalSuggestions = suggestions.technicalSkills.length + suggestions.softSkills.length + suggestions.requirements.length

  const toggleKeyword = (keyword: string) => {
    setSelectedKeywords((prev) => 
      prev.includes(keyword) 
        ? prev.filter((k) => k !== keyword) 
        : [...prev, keyword]
    )
  }

  const addSelectedKeywords = () => {
    if (selectedKeywords.length > 0) {
      onAddKeywords(selectedKeywords)
      setSelectedKeywords([])
    }
  }

  const addAllKeywords = () => {
    if (totalSuggestions > 0) {
      const allKeywords = [
        ...suggestions.technicalSkills,
        ...suggestions.softSkills,
        ...suggestions.requirements,
      ]
      onAddKeywords(allKeywords)
      setSelectedKeywords([])
    }
  }

  if (totalSuggestions === 0) {
    return null
  }

  return (
    <div className="mt-2 p-3 border rounded-md bg-card/50 shadow-sm">
      <div className="flex justify-between items-center mb-2">
        <h4 className="text-sm font-medium">{t("suggestedKeywords")}</h4>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={addSelectedKeywords} disabled={selectedKeywords.length === 0}>
            {t("addSelected")} ({selectedKeywords.length})
          </Button>
          <Button variant="outline" size="sm" onClick={addAllKeywords}>
            {t("addAll")} ({totalSuggestions})
          </Button>
        </div>
      </div>

      {/* Category headers */}
      <div className="space-y-3">
        {suggestions.technicalSkills.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <Code className="h-3.5 w-3.5 text-blue-500" />
              <span className="text-xs font-medium text-blue-500">{t("technicalSkills")}</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {suggestions.technicalSkills.map((keyword, index) => (
                <TooltipProvider key={index}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div onClick={() => toggleKeyword(keyword)}>
                        <TagBadge
                          tag={keyword}
                          gradient="blue"
                          className={`cursor-pointer transition-all hover:scale-105 ${
                            selectedKeywords.includes(keyword) ? "ring-1 ring-primary" : ""
                          }`}
                          selected={selectedKeywords.includes(keyword)}
                        />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{selectedKeywords.includes(keyword) ? t("clickToRemove") : t("clickToAdd")}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
          </div>
        )}

        {suggestions.softSkills.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <Heart className="h-3.5 w-3.5 text-rose-500" />
              <span className="text-xs font-medium text-rose-500">{t("softSkills")}</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {suggestions.softSkills.map((keyword, index) => (
                <TooltipProvider key={index}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div onClick={() => toggleKeyword(keyword)}>
                        <TagBadge
                          tag={keyword}
                          gradient="rose"
                          className={`cursor-pointer transition-all hover:scale-105 ${
                            selectedKeywords.includes(keyword) ? "ring-1 ring-primary" : ""
                          }`}
                          selected={selectedKeywords.includes(keyword)}
                        />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{selectedKeywords.includes(keyword) ? t("clickToRemove") : t("clickToAdd")}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
          </div>
        )}

        {suggestions.requirements.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <Award className="h-3.5 w-3.5 text-amber-500" />
              <span className="text-xs font-medium text-amber-500">{t("requirements")}</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {suggestions.requirements.map((keyword, index) => (
                <TooltipProvider key={index}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div onClick={() => toggleKeyword(keyword)}>
                        <TagBadge
                          tag={keyword}
                          gradient="amber"
                          className={`cursor-pointer transition-all hover:scale-105 ${
                            selectedKeywords.includes(keyword) ? "ring-1 ring-primary" : ""
                          }`}
                          selected={selectedKeywords.includes(keyword)}
                        />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{selectedKeywords.includes(keyword) ? t("clickToRemove") : t("clickToAdd")}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
