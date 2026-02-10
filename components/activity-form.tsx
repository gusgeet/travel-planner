"use client"

import React from "react"
import { useState } from "react"
import { Plus, Clock, Link2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface ActivityFormProps {
  onAdd: (activity: { name: string; time?: string; notes?: string; url?: string }) => void
}

export function ActivityForm({ onAdd }: ActivityFormProps) {
  const [name, setName] = useState("")
  const [time, setTime] = useState("")
  const [notes, setNotes] = useState("")
  const [url, setUrl] = useState("")
  const [isExpanded, setIsExpanded] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    onAdd({
      name: name.trim(),
      time: time || undefined,
      notes: notes.trim() || undefined,
      url: url.trim() || undefined,
    })
    setName("")
    setTime("")
    setNotes("")
    setUrl("")
    setIsExpanded(false)
  }

  if (!isExpanded) {
    return (
      <button
        type="button"
        onClick={() => setIsExpanded(true)}
        className="flex w-full items-center gap-2 rounded-md border border-dashed border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
      >
        <Plus className="h-3.5 w-3.5" />
        Agregar actividad
      </button>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-2 rounded-md border border-border bg-card p-3"
    >
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            placeholder="Nombre del lugar o actividad"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-8 text-sm"
            autoFocus
          />
        </div>
        <div className="relative w-28">
          <Clock className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="h-8 pl-7 text-sm"
          />
        </div>
      </div>
      <Input
        placeholder="Notas (opcional)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        className="h-8 text-sm"
      />
      <div className="relative">
        <Link2 className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="URL de Google Maps (opcional)"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="h-8 pl-8 text-sm"
          type="url"
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(false)}
          className="h-7 text-xs"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          size="sm"
          disabled={!name.trim()}
          className="h-7 bg-primary text-xs text-primary-foreground"
        >
          Agregar
        </Button>
      </div>
    </form>
  )
}
