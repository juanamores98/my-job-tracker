"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useLanguage } from "@/lib/i18n"
import type { JobState } from "@/lib/types"

interface AddStatusModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddStatus: (status: JobState) => void
  existingStates: JobState[]
}

export function AddStatusModal({ open, onOpenChange, onAddStatus, existingStates }: AddStatusModalProps) {
  const { t } = useLanguage()
  const [name, setName] = useState("")
  const [color, setColor] = useState("#3b82f6")
  const [isDefault, setIsDefault] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) return

    // Create a slug-like ID from the name
    const id = name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^\w-]+/g, "")
      .replace(/--+/g, "-")
      .replace(/^-+/, "")
      .replace(/-+$/, "")

    // Ensure ID is unique
    let uniqueId = id
    let counter = 1
    while (existingStates.some((state) => state.id === uniqueId)) {
      uniqueId = `${id}-${counter}`
      counter++
    }

    // Calculate next order
    const maxOrder = Math.max(0, ...existingStates.map((state) => state.order))

    const newStatus: JobState = {
      id: uniqueId,
      name,
      color,
      order: maxOrder + 1,
      isDefault,
    }

    onAddStatus(newStatus)

    // Reset form
    setName("")
    setColor("#3b82f6")
    setIsDefault(false)

    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t("addNewStatus")}</DialogTitle>
          <DialogDescription>{t("createNewStatusDescription")}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t("statusName")}</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("statusNamePlaceholder")}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="color">{t("statusColor")}</Label>
            <div className="flex gap-2 items-center">
              <Input
                id="color"
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-12 h-8 p-1"
              />
              <Input value={color} onChange={(e) => setColor(e.target.value)} className="flex-1" />
              <div className="w-8 h-8 rounded-md border" style={{ backgroundColor: color }} />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch id="default" checked={isDefault} onCheckedChange={setIsDefault} />
            <Label htmlFor="default">{t("defaultStatus")}</Label>
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={!name.trim()}>
              {t("addStatus")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
