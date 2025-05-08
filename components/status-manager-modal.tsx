"use client"

import React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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

interface StatusManagerModalProps {
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
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(state)}>
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive"
          onClick={() => onDelete(state.id)}
          disabled={state.isSystem || state.isDefault}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

export function StatusManagerModal({
  open,
  onOpenChange,
  jobStates,
  onAddStatus,
  onUpdateStatus,
  onDeleteStatus,
  onReorderStatuses,
}: StatusManagerModalProps) {
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

    const stateToAdd: JobState = {
      ...newState,
      id: id || `state-${Date.now()}`,
      order: states.length,
    }

    // If this is the first state or marked as default, ensure it's the only default
    if (stateToAdd.isDefault || states.length === 0) {
      const updatedStates = states.map((s) => ({
        ...s,
        isDefault: false,
      }))
      setStates([...updatedStates, stateToAdd])
    } else {
      setStates([...states, stateToAdd])
    }

    // Call the parent's add handler
    onAddStatus(stateToAdd)

    // Reset form and close dialog
    setNewState({
      id: "",
      name: "",
      color: "#3b82f6",
      order: 0,
      isDefault: false,
    })
    setIsAddDialogOpen(false)

    toast({
      title: t("statusAdded"),
      description: `${t("newStatusAdded")}: ${stateToAdd.name}`,
    })
  }

  const handleEditState = () => {
    if (!editingState) return

    // Update the state in the local array
    const updatedStates = states.map((state) => {
      if (state.id === editingState.id) {
        return editingState
      }

      // If this state is now default, remove default from others
      if (editingState.isDefault && state.id !== editingState.id) {
        return {
          ...state,
          isDefault: false,
        }
      }

      return state
    })

    setStates(updatedStates)

    // Call the parent's update handler
    onUpdateStatus(editingState)

    // Reset form and close dialog
    setEditingState(null)
    setIsEditDialogOpen(false)

    toast({
      title: t("statusUpdated"),
      description: `${t("statusUpdated")}: ${editingState.name}`,
    })
  }

  const handleDeleteState = () => {
    if (!deleteStateId) return

    // Find the state to delete
    const stateToDelete = states.find((s) => s.id === deleteStateId)
    if (!stateToDelete) return

    // Check if it's the default state
    if (stateToDelete.isDefault) {
      toast({
        title: t("cannotDeleteStatus"),
        description: t("cannotDeleteDefaultStatus"),
        variant: "destructive",
      })
      setDeleteStateId(null)
      setIsDeleteDialogOpen(false)
      return
    }

    // Check if it's a system state
    if (stateToDelete.isSystem) {
      toast({
        title: t("cannotDeleteStatus"),
        description: t("cannotDeleteSystemStatus"),
        variant: "destructive",
      })
      setDeleteStateId(null)
      setIsDeleteDialogOpen(false)
      return
    }

    // Remove the state from the local array
    const updatedStates = states.filter((s) => s.id !== deleteStateId)
    setStates(updatedStates)

    // Call the parent's delete handler
    onDeleteStatus(deleteStateId)

    // Reset and close dialog
    setDeleteStateId(null)
    setIsDeleteDialogOpen(false)

    toast({
      title: t("statusDeleted"),
      description: t("statusDeletedAndJobsMoved"),
    })
  }

  const handleSaveChanges = () => {
    // Save the reordered states
    onReorderStatuses(states)

    // Close the modal
    onOpenChange(false)

    toast({
      title: t("changesSaved"),
      description: t("statusOrderUpdated"),
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("manageStatuses")}</DialogTitle>
          <DialogDescription>{t("manageStatusesDescription")}</DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <Button onClick={() => setIsAddDialogOpen(true)} className="mb-4">
            <Plus className="h-4 w-4 mr-2" />
            {t("addNewStatus")}
          </Button>

          <DndProvider backend={HTML5Backend}>
            <div className="space-y-2">
              {states.map((state, index) => (
                <DraggableStatusItem
                  key={state.id}
                  state={state}
                  index={index}
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

              {states.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">{t("noStatusesDefined")}</div>
              )}
            </div>
          </DndProvider>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button onClick={handleSaveChanges}>{t("saveChanges")}</Button>
        </DialogFooter>
      </DialogContent>

      {/* Add Status Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t("addNewStatus")}</DialogTitle>
            <DialogDescription>{t("createNewStatusDescription")}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t("statusName")}</Label>
              <Input
                id="name"
                value={newState.name}
                onChange={(e) => setNewState({ ...newState, name: e.target.value })}
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
                  value={newState.color}
                  onChange={(e) => setNewState({ ...newState, color: e.target.value })}
                  className="w-12 h-8 p-1"
                />
                <Input
                  value={newState.color}
                  onChange={(e) => setNewState({ ...newState, color: e.target.value })}
                  className="flex-1"
                />
                <div className="w-8 h-8 rounded-md border" style={{ backgroundColor: newState.color }} />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="default"
                checked={newState.isDefault}
                onCheckedChange={(checked) => setNewState({ ...newState, isDefault: checked })}
              />
              <Label htmlFor="default">{t("defaultStatus")}</Label>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              {t("cancel")}
            </Button>
            <Button onClick={handleAddState} disabled={!newState.name.trim()}>
              {t("addStatus")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Status Dialog */}
      {editingState && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{t("editStatus")}</DialogTitle>
              <DialogDescription>{t("editStatusDescription")}</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">{t("statusName")}</Label>
                <Input
                  id="edit-name"
                  value={editingState.name}
                  onChange={(e) => setEditingState({ ...editingState, name: e.target.value })}
                  placeholder={t("statusNamePlaceholder")}
                  disabled={editingState.isSystem}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-color">{t("statusColor")}</Label>
                <div className="flex gap-2 items-center">
                  <Input
                    id="edit-color"
                    type="color"
                    value={editingState.color}
                    onChange={(e) => setEditingState({ ...editingState, color: e.target.value })}
                    className="w-12 h-8 p-1"
                  />
                  <Input
                    value={editingState.color}
                    onChange={(e) => setEditingState({ ...editingState, color: e.target.value })}
                    className="flex-1"
                  />
                  <div className="w-8 h-8 rounded-md border" style={{ backgroundColor: editingState.color }} />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-default"
                  checked={editingState.isDefault}
                  onCheckedChange={(checked) => setEditingState({ ...editingState, isDefault: checked })}
                  disabled={editingState.isDefault && states.length > 0}
                />
                <Label htmlFor="edit-default">{t("defaultStatus")}</Label>
              </div>

              {editingState.isSystem && (
                <div className="flex p-3 text-sm items-center gap-2 bg-amber-50 text-amber-800 rounded-md border border-amber-200 dark:bg-amber-950/30 dark:border-amber-900 dark:text-amber-300">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                  <p>{t("systemStatusWarning")}</p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                {t("cancel")}
              </Button>
              <Button onClick={handleEditState} disabled={!editingState.name.trim()}>
                {t("saveChanges")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("confirmDeleteStatus")}</AlertDialogTitle>
            <AlertDialogDescription>{t("deleteStatusWarning")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteState}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("deleteStatus")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  )
}
