"use client"

import React from "react"
import { useState, useEffect } from "react"
import { Clock, Link2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { Activity } from "@/lib/types"

interface EditActivityDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  activity: Activity
  onSave: (updates: Partial<Omit<Activity, "id">>) => void
}

export function EditActivityDialog({
  open,
  onOpenChange,
  activity,
  onSave,
}: EditActivityDialogProps) {
  const [name, setName] = useState(activity.name)
  const [time, setTime] = useState(activity.time || "")
  const [notes, setNotes] = useState(activity.notes || "")
  const [url, setUrl] = useState(activity.url || "")

  useEffect(() => {
    setName(activity.name)
    setTime(activity.time || "")
    setNotes(activity.notes || "")
    setUrl(activity.url || "")
  }, [activity])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    onSave({
      name: name.trim(),
      time: time || undefined,
      notes: notes.trim() || undefined,
      url: url.trim() || undefined,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Editar actividad</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="edit-act-name" className="text-sm font-medium text-foreground">
              Nombre
            </label>
            <Input
              id="edit-act-name"
              placeholder="Nombre del lugar o actividad"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="text-sm"
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="edit-act-time" className="text-sm font-medium text-foreground">
              Hora
            </label>
            <div className="relative">
              <Clock className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="edit-act-time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="pl-8 text-sm"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="edit-act-notes" className="text-sm font-medium text-foreground">
              Notas
            </label>
            <Input
              id="edit-act-notes"
              placeholder="Notas (opcional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="text-sm"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="edit-act-url" className="text-sm font-medium text-foreground">
              URL (Google Maps)
            </label>
            <div className="relative">
              <Link2 className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="edit-act-url"
                placeholder="https://maps.google.com/..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="pl-8 text-sm"
                type="url"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={!name.trim()}
              className="bg-primary text-primary-foreground"
            >
              Guardar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
