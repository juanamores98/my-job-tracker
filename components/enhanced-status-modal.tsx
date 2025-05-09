"use client"

import React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet"
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
import { GripVertical, Plus, Pencil, Trash2, AlertTriangle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useLanguage } from "@/lib/i18n"
import type { JobState } from "@/lib/types"
import { DndProvider, useDrag, useDrop } from "react-dnd"
import { HTML5Backend } from "react-dnd-html5-backend"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { useMediaQuery } from "@/hooks/use-media-query"

interface EnhancedStatusModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  jobStates: JobState[]
  onAddStatus: (status: JobState) => void
  onUpdateStatus: (status: JobState) => void
  onDeleteStatus: (statusId: string) => void
  onReorderStatuses: (reorderedStates: JobState[]) => void
}

type DragItem = {
  index: number
  id: string
  type: string
}

const DraggableStatusItem = ({
  state,
  index,
  moveStatus,
  onEdit,
  onDelete,
}: {
  state: JobState
  index: number
  moveStatus: (dragIndex: number, hoverIndex: number) => void
  onEdit: (state: JobState) => void
  onDelete: (stateId: string) => void
}) => {
  const ref = React.useRef<HTMLDivElement>(null)

  const [{ handlerId }, drop] = useDrop({
    accept: "status",
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId(),
      }
    },
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

      // Determine rectangle on screen
      const hoverBoundingRect = ref.current?.getBoundingClientRect()

      // Get vertical middle
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2

      // Determine mouse position
      const clientOffset = monitor.getClientOffset()

      // Get pixels to the top
      const hoverClientY = clientOffset!.y - hoverBoundingRect.top

      // Only perform the move when the mouse has crossed half of the items height
      // When dragging downwards, only move when the cursor is below 50%
      // When dragging upwards, only move when the cursor is above 50%

      // Dragging downwards
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return
      }

      // Dragging upwards
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return
      }

      // Time to actually perform the action
      moveStatus(dragIndex, hoverIndex)

      // Note: we're mutating the monitor item here!
      // Generally it's better to avoid mutations,
      // but it's good here for the sake of performance
      // to avoid expensive index searches.
      item.index = hoverIndex
    },
  })

  const [{ isDragging }, drag, preview] = useDrag({
    type: "status",
    item: () => {
      return { id: state.id, index }
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  })

  const opacity = isDragging ? 0.4 : 1

  drag(drop(ref))

  return (
    <div
      ref={ref}
      className="flex items-center p-3 bg-background border rounded-md mb-2 cursor-move"
      style={{ opacity }}
      data-handler-id={handlerId}
    >
      <GripVertical className="h-5 w-5 text-muted-foreground mr-2 flex-shrink-0" />
      <div className="flex items-center flex-1 min-w-0">
        <div className="w-3 h-3 rounded-full mr-2 flex-shrink-0" style={{ backgroundColor: state.color }} />
        <span className="font-medium truncate">{state.name}</span>
        {state.isDefault && (
          <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">Default</span>
        )}
      </div>
      <div className="flex items-center gap-1 ml-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(state)}>
                <Pencil className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>Edit status properties</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={() => onDelete(state.id)}
                disabled={state.isSystem || state.isDefault}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>
                {state.isSystem || state.isDefault ? "Cannot delete system or default status" : "Delete this status"}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  )
}

export function EnhancedStatusModal({
  open,
  onOpenChange,
  jobStates,
  onAddStatus,
  onUpdateStatus,
  onDeleteStatus,
  onReorderStatuses,
}: EnhancedStatusModalProps) {
  const [states, setStates] = useState<JobState[]>([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [newState, setNewState] = useState<JobState>({
    id: "",
    name: "",
    color: "#3b82f6",
    order: 0,
    isDefault: false,
  })
  const [editingState, setEditingState] = useState<JobState | null>(null)
  const [deleteStateId, setDeleteStateId] = useState<string | null>(null)
  const isMobile = useMediaQuery("(max-width: 768px)")

  const { toast } = useToast()
  const { t } = useLanguage()

  // Initialize states when modal opens
  useEffect(() => {
    if (open) {
      setStates([...jobStates].sort((a, b) => a.order - b.order))
    }
  }, [open, jobStates])

  const moveStatus = (dragIndex: number, hoverIndex: number) => {
    const draggedState = states[dragIndex]

    // Create a new array with the reordered states
    const updatedStates = [...states]
    updatedStates.splice(dragIndex, 1)
    updatedStates.splice(hoverIndex, 0, draggedState)

    // Update the order property for each state
    const reorderedStates = updatedStates.map((state, index) => ({
      ...state,
      order: index,
    }))

    setStates(reorderedStates)
  }

  const handleAddState = () => {
    // Create a slug-like ID from the name
    const id = newState.name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^\w-]+/g, "")
      .replace(/--+/g, "-")
      .replace(/^-+/, "")
      .replace(/-+$/, "")

    if (!id) {
      toast({
        title: t("invalidStatusName"),
        description: t("statusNameCannotBeEmpty"),
        variant: "destructive",
      })
      return
    }

    // Check if ID already exists
    if (states.some((state) => state.id === id)) {
      toast({
        title: t("statusAlreadyExists"),
        description: t("pleaseUseADifferentName"),
        variant: "destructive",
      })
      return
    }

    // Add the new state with the generated ID
    const stateToAdd: JobState = {
      ...newState,
      id,
      order: states.length,
    }

    onAddStatus(stateToAdd)

    // Reset the form and close the dialog
    setNewState({
      id: "",
      name: "",
      color: "#3b82f6",
      order: 0,
      isDefault: false,
    })
    setIsAddDialogOpen(false)
  }

  const handleEditState = () => {
    if (!editingState) return

    // Ensure the name is not empty
    if (!editingState.name.trim()) {
      toast({
        title: t("invalidStatusName"),
        description: t("statusNameCannotBeEmpty"),
        variant: "destructive",
      })
      return
    }

    // Call the update callback
    onUpdateStatus(editingState)

    // Close the dialog
    setIsEditDialogOpen(false)
    setEditingState(null)
  }

  const handleDeleteState = () => {
    if (!deleteStateId) return

    // Call the delete callback
    onDeleteStatus(deleteStateId)

    // Close the dialog
    setIsDeleteDialogOpen(false)
    setDeleteStateId(null)
  }

  const handleSaveChanges = () => {
    // Save the reordered states
    onReorderStatuses(states)

    // Close the modal
    onOpenChange(false)
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent 
          side={isMobile ? "bottom" : "right"} 
          className={cn(
            "sm:max-w-md w-full flex flex-col",
            isMobile ? "h-[90vh] rounded-t-xl" : ""
          )}
        >
          <SheetHeader className="mb-6">
            <SheetTitle className="text-xl">{t("manageStatuses")}</SheetTitle>
            <SheetDescription>{t("dragToReorderStatusesOrEdit")}</SheetDescription>
          </SheetHeader>
          
          <div className="flex-1 overflow-y-auto pb-6">
            <div className="flex justify-end mb-4">
              <Button variant="outline" size="sm" onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                {t("addStatus")}
              </Button>
            </div>
            
            <DndProvider backend={HTML5Backend}>
              <div>
                {states.map((state, index) => (
                  <DraggableStatusItem
                    key={state.id}
                    index={index}
                    state={state}
                    moveStatus={moveStatus}
                    onEdit={(state) => {
                      setEditingState(state)
                      setIsEditDialogOpen(true)
                    }}
                    onDelete={(stateId) => {
                      setDeleteStateId(stateId)
                      setIsDeleteDialogOpen(true)
                    }}
                  />
                ))}
              </div>
            </DndProvider>
          </div>
          
          <SheetFooter className="pt-4 border-t">
            <div className="w-full flex justify-between">
              <SheetClose asChild>
                <Button variant="outline">{t("cancel")}</Button>
              </SheetClose>
              <Button onClick={handleSaveChanges}>{t("saveChanges")}</Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Add Status Dialog */}
      <AlertDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("addNewStatus")}</AlertDialogTitle>
            <AlertDialogDescription>{t("enterStatusDetails")}</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="statusName">{t("statusName")}</Label>
              <Input
                id="statusName"
                value={newState.name}
                onChange={(e) => setNewState((prev) => ({ ...prev, name: e.target.value }))}
                placeholder={t("enterStatusName")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="statusColor">{t("statusColor")}</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="statusColor"
                  type="color"
                  value={newState.color}
                  onChange={(e) => setNewState((prev) => ({ ...prev, color: e.target.value }))}
                  className="w-12 h-10 p-1"
                />
                <Input
                  type="text"
                  value={newState.color}
                  onChange={(e) => setNewState((prev) => ({ ...prev, color: e.target.value }))}
                  className="flex-1"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="isDefault"
                checked={newState.isDefault}
                onCheckedChange={(checked) => setNewState((prev) => ({ ...prev, isDefault: checked }))}
              />
              <Label htmlFor="isDefault">{t("makeDefaultStatus")}</Label>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleAddState}>{t("add")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Status Dialog */}
      <AlertDialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("editStatus")}</AlertDialogTitle>
            <AlertDialogDescription>{t("updateStatusDetails")}</AlertDialogDescription>
          </AlertDialogHeader>
          {editingState && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="editStatusName">{t("statusName")}</Label>
                <Input
                  id="editStatusName"
                  value={editingState.name}
                  onChange={(e) => setEditingState((prev) => ({ ...prev!, name: e.target.value }))}
                  placeholder={t("enterStatusName")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editStatusColor">{t("statusColor")}</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="editStatusColor"
                    type="color"
                    value={editingState.color}
                    onChange={(e) => setEditingState((prev) => ({ ...prev!, color: e.target.value }))}
                    className="w-12 h-10 p-1"
                  />
                  <Input
                    type="text"
                    value={editingState.color}
                    onChange={(e) => setEditingState((prev) => ({ ...prev!, color: e.target.value }))}
                    className="flex-1"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="editIsDefault"
                  checked={editingState.isDefault}
                  onCheckedChange={(checked) => setEditingState((prev) => ({ ...prev!, isDefault: checked }))}
                  disabled={editingState.isSystem}
                />
                <Label htmlFor="editIsDefault">{t("makeDefaultStatus")}</Label>
              </div>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleEditState}>{t("save")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Status Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              {t("deleteStatus")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteStatusWarning")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={handleDeleteState}>
              {t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
} 