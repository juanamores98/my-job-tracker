"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Plus, Edit, Trash2, AlertTriangle, ArrowUp, ArrowDown } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { getJobStates, saveJobStates, deleteJobState } from "@/lib/storage"
import type { JobState } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export function JobStatesManager() {
  const [jobStates, setJobStates] = useState<JobState[]>([])
  const [editingState, setEditingState] = useState<JobState | null>(null)
  const [newState, setNewState] = useState<JobState>({
    id: "",
    name: "",
    color: "#3b82f6",
    order: 0,
    isDefault: false,
  })
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [deleteConfirmState, setDeleteConfirmState] = useState<JobState | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    const states = getJobStates()
    setJobStates(states.sort((a, b) => a.order - b.order))
  }, [])

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
      order: Math.max(...jobStates.map((s) => s.order), 0) + 1,
    }

    const updatedStates = [...jobStates, stateToAdd].sort((a, b) => a.order - b.order)

    // If this is the first state or marked as default, ensure it's the only default
    if (stateToAdd.isDefault || updatedStates.length === 1) {
      updatedStates.forEach((s) => {
        if (s.id !== stateToAdd.id) {
          s.isDefault = false
        }
      })
      stateToAdd.isDefault = true
    }

    setJobStates(updatedStates)
    saveJobStates(updatedStates)

    setNewState({
      id: "",
      name: "",
      color: "#3b82f6",
      order: 0,
      isDefault: false,
    })

    setIsAddDialogOpen(false)

    toast({
      title: "Estado añadido",
      description: `El estado "${stateToAdd.name}" ha sido añadido correctamente.`,
    })
  }

  const handleEditState = () => {
    if (!editingState) return

    const updatedStates = jobStates.map((state) => (state.id === editingState.id ? editingState : state))

    // If this state is marked as default, ensure it's the only default
    if (editingState.isDefault) {
      updatedStates.forEach((s) => {
        if (s.id !== editingState.id) {
          s.isDefault = false
        }
      })
    } else {
      // Ensure there's always at least one default state
      const hasDefault = updatedStates.some((s) => s.isDefault)
      if (!hasDefault && updatedStates.length > 0) {
        updatedStates[0].isDefault = true
      }
    }

    setJobStates(updatedStates.sort((a, b) => a.order - b.order))
    saveJobStates(updatedStates)

    setEditingState(null)
    setIsEditDialogOpen(false)

    toast({
      title: "Estado actualizado",
      description: `El estado "${editingState.name}" ha sido actualizado correctamente.`,
    })
  }

  const handleDeleteState = () => {
    if (!deleteConfirmState) return

    // Check if this is the only state
    if (jobStates.length <= 1) {
      toast({
        title: "No se puede eliminar",
        description: "Debe haber al menos un estado en el sistema.",
        variant: "destructive",
      })
      setDeleteConfirmState(null)
      return
    }

    // Check if this is a system state
    if (deleteConfirmState.isSystem) {
      toast({
        title: "No se puede eliminar",
        description: "Los estados del sistema no pueden ser eliminados.",
        variant: "destructive",
      })
      setDeleteConfirmState(null)
      return
    }

    const result = deleteJobState(deleteConfirmState.id)

    setJobStates(result.states.sort((a, b) => a.order - b.order))
    setDeleteConfirmState(null)

    toast({
      title: "Estado eliminado",
      description: `El estado "${deleteConfirmState.name}" ha sido eliminado correctamente.`,
    })
  }

  const moveStateUp = (index: number) => {
    if (index <= 0) return

    const updatedStates = [...jobStates]

    // Swap orders
    const temp = updatedStates[index].order
    updatedStates[index].order = updatedStates[index - 1].order
    updatedStates[index - 1].order = temp

    // Sort by order
    const sortedStates = updatedStates.sort((a, b) => a.order - b.order)

    setJobStates(sortedStates)
    saveJobStates(sortedStates)
  }

  const moveStateDown = (index: number) => {
    if (index >= jobStates.length - 1) return

    const updatedStates = [...jobStates]

    // Swap orders
    const temp = updatedStates[index].order
    updatedStates[index].order = updatedStates[index + 1].order
    updatedStates[index + 1].order = temp

    // Sort by order
    const sortedStates = updatedStates.sort((a, b) => a.order - b.order)

    setJobStates(sortedStates)
    saveJobStates(sortedStates)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Estados de Trabajo</h3>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" /> Añadir Estado
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Añadir Nuevo Estado</DialogTitle>
              <DialogDescription>Crea un nuevo estado para tus aplicaciones de trabajo.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre</Label>
                <Input
                  id="name"
                  value={newState.name}
                  onChange={(e) => setNewState({ ...newState, name: e.target.value })}
                  placeholder="Ej: Entrevista Técnica"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="color">Color</Label>
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
                <Label htmlFor="default">Estado predeterminado</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAddState} disabled={!newState.name.trim()}>
                Añadir Estado
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Separator />

      <div className="space-y-2">
        {jobStates.map((state, index) => (
          <div
            key={state.id}
            className="flex items-center justify-between p-2 rounded-md border hover:bg-accent/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: state.color }} />
              <span className="font-medium">{state.name}</span>
              {state.isDefault && (
                <Badge variant="outline" className="text-xs">
                  Predeterminado
                </Badge>
              )}
              {state.isSystem && (
                <Badge variant="secondary" className="text-xs">
                  Sistema
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => moveStateUp(index)}
                      disabled={index === 0}
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Mover arriba</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => moveStateDown(index)}
                      disabled={index === jobStates.length - 1}
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Mover abajo</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <Dialog
                open={isEditDialogOpen && editingState?.id === state.id}
                onOpenChange={(open) => {
                  setIsEditDialogOpen(open)
                  if (!open) setEditingState(null)
                }}
              >
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingState(state)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Editar Estado</DialogTitle>
                    <DialogDescription>Modifica las propiedades de este estado de trabajo.</DialogDescription>
                  </DialogHeader>
                  {editingState && (
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-name">Nombre</Label>
                        <Input
                          id="edit-name"
                          value={editingState.name}
                          onChange={(e) => setEditingState({ ...editingState, name: e.target.value })}
                          disabled={editingState.isSystem}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="edit-color">Color</Label>
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
                          disabled={editingState.isDefault && jobStates.length > 0}
                        />
                        <Label htmlFor="edit-default">Estado predeterminado</Label>
                      </div>

                      {editingState.isSystem && (
                        <div className="flex p-3 text-sm items-center gap-2 bg-amber-50 text-amber-800 rounded-md border border-amber-200 dark:bg-amber-950/30 dark:border-amber-900 dark:text-amber-300">
                          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                          <p>Este es un estado del sistema. Algunas propiedades no pueden ser modificadas.</p>
                        </div>
                      )}
                    </div>
                  )}
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditingState(null)
                        setIsEditDialogOpen(false)
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button onClick={handleEditState} disabled={!editingState?.name.trim()}>
                      Guardar Cambios
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <AlertDialog
                open={deleteConfirmState?.id === state.id}
                onOpenChange={(open) => {
                  if (!open) setDeleteConfirmState(null)
                }}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => setDeleteConfirmState(state)}
                  disabled={state.isSystem || jobStates.length <= 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acción eliminará el estado "{state.name}" y moverá todos los trabajos asociados al estado
                      predeterminado. Esta acción no se puede deshacer.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteState}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Eliminar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        ))}

        {jobStates.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No hay estados definidos. Añade uno para comenzar.
          </div>
        )}
      </div>
    </div>
  )
}
