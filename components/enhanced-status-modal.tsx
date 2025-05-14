"use client"

import React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
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
import { GripVertical, Plus, Pencil, Trash2, AlertTriangle, RotateCcw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useLanguage } from "@/lib/i18n"
import type { JobState, JobData } from "@/lib/types"
import { defaultJobStates } from "@/lib/data"
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
  onRestoreDefaults: (fallbackStatus: string) => void
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

  const [{ handlerId }, drop] = useDrop<DragItem, void, { handlerId: string | symbol | null }>({
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
                disabled={state.isSystem}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>
                {state.isSystem ? "Cannot delete system status" : "Delete this status"}
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
  onRestoreDefaults,
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
  const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false)
  const [isRestoreConfirmDialogOpen, setIsRestoreConfirmDialogOpen] = useState(false)
  const [fallbackStatusForRestore, setFallbackStatusForRestore] = useState<string>("wishlist")
  const isMobile = useMediaQuery("(max-width: 768px)")

  const { toast } = useToast()
  const { t } = useLanguage()

  const handleRestoreDefaults = () => {
    if (!onRestoreDefaults) return
    onRestoreDefaults(fallbackStatusForRestore)
    setIsRestoreConfirmDialogOpen(false)
    setIsRestoreDialogOpen(false)
    
    toast({
      title: "Default statuses restored",
      description: "All job statuses have been reset to their default values."
    })
  }

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

    // Create the new state
    const stateToAdd: JobState = {
      ...newState,
      id: id || `state-${Date.now()}`,
      order: states.length, // Put it at the end
    }

    // Check if this is the first state or marked as default
    if (stateToAdd.isDefault) {
      // If this state is marked as default, make other states not default
      setStates(
        states.map((state) => ({
          ...state,
          isDefault: false,
        }))
      )
    } else if (states.length === 0) {
      // If this is the first state, make it default automatically
      stateToAdd.isDefault = true
    }

    // Add the new state
    setStates([...states, stateToAdd])
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
      title: "Status added",
      description: `The status "${stateToAdd.name}" has been added successfully.`,
    })
  }

  const handleEditState = () => {
    if (!editingState) return

    // Check if this state is marked as default
    if (editingState.isDefault) {
      // Make other states not default
      setStates(
        states.map((state) =>
          state.id === editingState.id ? editingState : { ...state, isDefault: false }
        )
      )
    } else {
      // If this state is not default, ensure there's still a default state
      const hasDefault = states.some((s) => s.id !== editingState.id && s.isDefault)
      if (!hasDefault) {
        // If no other state is default, make this one default
        editingState.isDefault = true
      }
    }

    // Update the state
    setStates(
      states.map((state) => (state.id === editingState.id ? editingState : state))
    )
    onUpdateStatus(editingState)

    // Reset form and close dialog
    setEditingState(null)
    setIsEditDialogOpen(false)

    toast({
      title: "Status updated",
      description: `The status "${editingState.name}" has been updated successfully.`,
    })
  }

  const handleDeleteState = () => {
    if (!deleteStateId) return

    // Check if this is the only state
    if (states.length <= 1) {
      toast({
        title: "Cannot delete",
        description: "There must be at least one status in the system.",
        variant: "destructive",
      })
      setIsDeleteDialogOpen(false)
      setDeleteStateId(null)
      return
    }

    // Find the state to delete
    const stateToDelete = states.find((s) => s.id === deleteStateId)
    if (!stateToDelete) {
      setIsDeleteDialogOpen(false)
      setDeleteStateId(null)
      return
    }

    // Check if this is a system state
    if (stateToDelete.isSystem) {
      toast({
        title: "Cannot delete",
        description: "System statuses cannot be deleted.",
        variant: "destructive",
      })
      setIsDeleteDialogOpen(false)
      setDeleteStateId(null)
      return
    }

    // Delete the state
    onDeleteStatus(deleteStateId)
    
    // Remove from local state
    setStates(states.filter((state) => state.id !== deleteStateId))

    // If the deleted state was default, make another state default
    if (stateToDelete.isDefault && states.length > 1) {
      const newDefaultState = states.find((s) => s.id !== deleteStateId)
      if (newDefaultState) {
        newDefaultState.isDefault = true
        onUpdateStatus(newDefaultState)
      }
    }

    // Reset state and close dialog
    setIsDeleteDialogOpen(false)
    setDeleteStateId(null)

    toast({
      title: "Status deleted",
      description: `The status "${stateToDelete.name}" has been deleted successfully.`,
    })
  }

  const handleSaveChanges = () => {
    // Update the order of states
    onReorderStatuses(states)
    
    // Close the modal
    onOpenChange(false)
    
    toast({
      title: "Changes saved",
      description: "Your changes to job statuses have been saved.",
    })
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md md:max-w-lg">
          <DialogHeader>
            <DialogTitle>Manage Job Statuses</DialogTitle>
            <DialogDescription>
              Add, edit, delete, and reorder job statuses. Changes will be applied to all job applications.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium">Current Job Statuses</h3>
              <Button variant="outline" size="sm" onClick={() => setIsRestoreDialogOpen(true)}>
                <RotateCcw className="h-3.5 w-3.5 mr-1" />
                Restore Defaults
              </Button>
            </div>

            <DndProvider backend={HTML5Backend}>
              <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
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
              </div>
            </DndProvider>

            <Button className="w-full mt-4" onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add New Status
            </Button>
          </div>

          <DialogFooter className="flex items-center justify-between">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleSaveChanges}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Status Dialog */}
      <AlertDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Add New Status</AlertDialogTitle>
            <AlertDialogDescription>Enter the details for the new job status.</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="status-name">Status Name</Label>
              <Input
                id="status-name"
                value={newState.name}
                onChange={(e) => setNewState({ ...newState, name: e.target.value })}
                placeholder="e.g., Interview, Offer, etc."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status-color">Status Color</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="status-color"
                  type="color"
                  value={newState.color}
                  onChange={(e) => setNewState({ ...newState, color: e.target.value })}
                  className="w-12 h-10 p-1 cursor-pointer"
                />
                <div className="flex-1 font-mono text-sm">{newState.color}</div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="status-default" className="flex-1">
                Set as default for new jobs
              </Label>
              <Switch
                id="status-default"
                checked={newState.isDefault}
                onCheckedChange={(checked) => setNewState({ ...newState, isDefault: checked })}
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleAddState} disabled={!newState.name.trim()}>
              Add Status
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Status Dialog */}
      <AlertDialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Edit Status</AlertDialogTitle>
            <AlertDialogDescription>Modify the properties of this job status.</AlertDialogDescription>
          </AlertDialogHeader>
          {editingState && (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="edit-status-name">Status Name</Label>
                <Input
                  id="edit-status-name"
                  value={editingState.name}
                  onChange={(e) => setEditingState({ ...editingState, name: e.target.value })}
                  placeholder="e.g., Interview, Offer, etc."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-status-color">Status Color</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="edit-status-color"
                    type="color"
                    value={editingState.color}
                    onChange={(e) => setEditingState({ ...editingState, color: e.target.value })}
                    className="w-12 h-10 p-1 cursor-pointer"
                  />
                  <div className="flex-1 font-mono text-sm">{editingState.color}</div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="edit-status-default" className="flex-1">
                  Set as default for new jobs
                </Label>
                <Switch
                  id="edit-status-default"
                  checked={editingState.isDefault}
                  onCheckedChange={(checked) => setEditingState({ ...editingState, isDefault: checked })}
                  disabled={editingState.isDefault && states.filter(s => s.isDefault).length <= 1}
                />
              </div>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleEditState} disabled={!editingState || !editingState.name.trim()}>
              Save Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Status Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Status</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this status? Jobs with this status will be moved to the default status.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteState} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Restore Defaults First Dialog */}
      <AlertDialog open={isRestoreDialogOpen} onOpenChange={setIsRestoreDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore Default Statuses</AlertDialogTitle>
            <AlertDialogDescription>
              This will reset all job statuses to the predefined defaults:
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Wishlist (default for new jobs)</li>
                <li>Applied</li>
                <li>Interview</li>
                <li>Offer</li>
                <li>Rejected</li>
              </ul>
              <p className="mt-3 font-medium text-destructive flex items-center">
                <AlertTriangle className="h-4 w-4 mr-2" />
                All custom statuses will be deleted!
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4">
            <p className="text-sm">What should happen to existing jobs that have custom statuses?</p>
            <RadioGroup
              value={fallbackStatusForRestore}
              onValueChange={setFallbackStatusForRestore}
              className="gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="wishlist" id="fallback-wishlist" />
                <Label htmlFor="fallback-wishlist">{defaultJobStates.find(s => s.id === 'wishlist')?.name || "Wishlist"}</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="rejected" id="fallback-rejected" />
                <Label htmlFor="fallback-rejected">{defaultJobStates.find(s => s.id === 'rejected')?.name || "Rejected"}</Label>
              </div>
            </RadioGroup>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setIsRestoreDialogOpen(false);
                setIsRestoreConfirmDialogOpen(true);
              }}
              className="bg-destructive hover:bg-destructive/90"
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Restore Defaults Final Confirmation Dialog */}
      <AlertDialog open={isRestoreConfirmDialogOpen} onOpenChange={setIsRestoreConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. All custom statuses will be permanently deleted and replaced with the default ones.
              <p className="mt-3">
                Jobs with custom statuses will be moved to "{defaultJobStates.find(s => s.id === fallbackStatusForRestore)?.name || fallbackStatusForRestore}".
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRestoreDefaults} className="bg-destructive hover:bg-destructive/90">
              Yes, Reset All Statuses
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
