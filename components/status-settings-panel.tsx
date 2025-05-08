"use client"

import { useRef } from "react"

import { useState, useEffect } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { AlertTriangle, ArrowDown, ArrowUp, Trash2, GripVertical, Settings } from "lucide-react"
import { useLanguage } from "@/lib/i18n"
import type { JobState } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { DndProvider, useDrag, useDrop } from "react-dnd"
import { HTML5Backend } from "react-dnd-html5-backend"

interface StatusSettingsPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  jobStates: JobState[]
  selectedStatusId: string | null
  onUpdateStatus: (status: JobState) => void
  onDeleteStatus: (statusId: string) => void
  onMoveStatus: (dragIndex: number, hoverIndex: number) => void
}

export function StatusSettingsPanel({
  open,
  onOpenChange,
  jobStates,
  selectedStatusId,
  onUpdateStatus,
  onDeleteStatus,
  onMoveStatus,
}: StatusSettingsPanelProps) {
  const { t } = useLanguage()
  const { toast } = useToast()
  const [editingStatus, setEditingStatus] = useState<JobState | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [statusToDelete, setStatusToDelete] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      if (selectedStatusId) {
        const status = jobStates.find((s) => s.id === selectedStatusId)
        if (status) {
          setEditingStatus(status)
        }
      } else {
        setEditingStatus(null)
      }
    }
  }, [open, selectedStatusId, jobStates])

  const handleColorChange = (color: string) => {
    if (editingStatus) {
      setEditingStatus({ ...editingStatus, color })
    }
  }

  const handleNameChange = (name: string) => {
    if (editingStatus) {
      setEditingStatus({ ...editingStatus, name })
    }
  }

  const handleDefaultChange = (isDefault: boolean) => {
    if (editingStatus) {
      setEditingStatus({ ...editingStatus, isDefault })
    }
  }

  const handleSaveStatus = () => {
    if (editingStatus) {
      onUpdateStatus(editingStatus)
      toast({
        title: t("statusUpdated"),
        description: t("statusSettingsUpdated"),
      })
    }
  }

  const handleDeleteClick = (statusId: string) => {
    setStatusToDelete(statusId)
    setDeleteConfirmOpen(true)
  }

  const handleConfirmDelete = () => {
    if (statusToDelete) {
      onDeleteStatus(statusToDelete)
      setDeleteConfirmOpen(false)
      setStatusToDelete(null)

      // If we're deleting the currently edited status, close the panel
      if (editingStatus?.id === statusToDelete) {
        onOpenChange(false)
      }
    }
  }

  const handleMoveUp = (index: number) => {
    if (index > 0) {
      onMoveStatus(index, index - 1)
    }
  }

  const handleMoveDown = (index: number) => {
    if (index < jobStates.length - 1) {
      onMoveStatus(index, index + 1)
    }
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="left" className="w-[400px] sm:max-w-md">
          <SheetHeader>
            <SheetTitle>
              {editingStatus ? t("editStatus", { status: editingStatus.name }) : t("manageStatuses")}
            </SheetTitle>
            <SheetDescription>
              {editingStatus ? t("customizeStatusAppearance") : t("dragAndDropToReorderStatuses")}
            </SheetDescription>
          </SheetHeader>

          <div className="py-6 space-y-6">
            {editingStatus ? (
              // Edit single status
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="status-name">{t("statusName")}</Label>
                  <Input
                    id="status-name"
                    value={editingStatus.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    disabled={editingStatus.isSystem}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status-color">{t("statusColor")}</Label>
                  <div className="flex gap-2 items-center">
                    <Input
                      id="status-color"
                      type="color"
                      value={editingStatus.color}
                      onChange={(e) => handleColorChange(e.target.value)}
                      className="w-12 h-8 p-1"
                    />
                    <Input
                      value={editingStatus.color}
                      onChange={(e) => handleColorChange(e.target.value)}
                      className="flex-1"
                    />
                    <div className="w-8 h-8 rounded-md border" style={{ backgroundColor: editingStatus.color }} />
                  </div>
                </div>

                <div className="flex items-center space-x-2 pt-2">
                  <Switch
                    id="default-status"
                    checked={editingStatus.isDefault}
                    onCheckedChange={handleDefaultChange}
                    disabled={editingStatus.isDefault && jobStates.length > 0}
                  />
                  <Label htmlFor="default-status">{t("defaultStatus")}</Label>
                </div>

                {editingStatus.isSystem && (
                  <div className="flex p-3 text-sm items-center gap-2 bg-amber-50 text-amber-800 rounded-md border border-amber-200 dark:bg-amber-950/30 dark:border-amber-900 dark:text-amber-300">
                    <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                    <p>{t("systemStatusWarning")}</p>
                  </div>
                )}

                <div className="pt-4">
                  <Button
                    variant="destructive"
                    onClick={() => handleDeleteClick(editingStatus.id)}
                    disabled={editingStatus.isSystem || editingStatus.isDefault || jobStates.length <= 1}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    {t("deleteStatus")}
                  </Button>
                </div>
              </div>
            ) : (
              // List all statuses
              <DndProvider backend={HTML5Backend}>
                <div className="space-y-2">
                  {jobStates.map((state, index) => (
                    <DraggableStatusItem
                      key={state.id}
                      state={state}
                      index={index}
                      onEdit={() => {
                        setEditingStatus(state)
                      }}
                      onDelete={() => handleDeleteClick(state.id)}
                      onMoveUp={() => handleMoveUp(index)}
                      onMoveDown={() => handleMoveDown(index)}
                      moveStatus={onMoveStatus}
                      canMoveUp={index > 0}
                      canMoveDown={index < jobStates.length - 1}
                      canDelete={!state.isSystem && !state.isDefault && jobStates.length > 1}
                    />
                  ))}
                </div>
              </DndProvider>
            )}
          </div>

          <SheetFooter>
            {editingStatus ? (
              <div className="flex justify-between w-full">
                <Button variant="outline" onClick={() => setEditingStatus(null)}>
                  {t("back")}
                </Button>
                <Button onClick={handleSaveStatus}>{t("saveChanges")}</Button>
              </div>
            ) : (
              <Button onClick={() => onOpenChange(false)}>{t("close")}</Button>
            )}
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("confirmDelete")}</AlertDialogTitle>
            <AlertDialogDescription>{t("deleteStatusWarning")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground">
              {t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

interface DraggableStatusItemProps {
  state: JobState
  index: number
  onEdit: () => void
  onDelete: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  moveStatus: (dragIndex: number, hoverIndex: number) => void
  canMoveUp: boolean
  canMoveDown: boolean
  canDelete: boolean
}

interface DragItem {
  index: number
  id: string
  type: string
}

function DraggableStatusItem({
  state,
  index,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
  moveStatus,
  canMoveUp,
  canMoveDown,
  canDelete,
}: DraggableStatusItemProps) {
  const ref = useRef<HTMLDivElement>(null)
  const { t } = useLanguage()

  const [{ isDragging }, drag] = useDrag({
    type: "status-item",
    item: { index, id: state.id },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  })

  const [, drop] = useDrop({
    accept: "status-item",
    hover(item: DragItem, monitor) {
      if (!ref.current) {
        return
      }
      const dragIndex = item.index
      const hoverIndex = index

      // Don't replace items with themselves
      if (dragIndex === hoverIndex) {
        return
      }

      moveStatus(dragIndex, hoverIndex)

      // Update the item's index for future drags
      item.index = hoverIndex
    },
  })

  drag(drop(ref))

  return (
    <div
      ref={ref}
      className={`flex items-center justify-between p-2 rounded-md border hover:bg-accent/50 transition-colors ${
        isDragging ? "opacity-50" : ""
      }`}
      style={{ backgroundColor: `${state.color}10` }}
    >
      <div className="flex items-center gap-2">
        <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: state.color }} />
        <span className="font-medium">{state.name}</span>
        {state.isDefault && (
          <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">{t("default")}</span>
        )}
        {state.isSystem && (
          <span className="text-xs bg-secondary/50 text-secondary-foreground px-1.5 py-0.5 rounded-full">
            {t("system")}
          </span>
        )}
      </div>

      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onMoveUp} disabled={!canMoveUp}>
          <ArrowUp className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onMoveDown} disabled={!canMoveDown}>
          <ArrowDown className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit}>
          <Settings className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={onDelete}
          disabled={!canDelete}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
