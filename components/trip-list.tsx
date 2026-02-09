"use client"

import React, { useState } from "react"
import {
  Plus,
  MapPin,
  Calendar,
  Users,
  Trash2,
  ArrowRight,
  Loader2,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Itinerary } from "@/lib/types"

interface TripListProps {
  itineraries: Itinerary[]
  currentUserId: string
  onSelect: (id: string) => void
  onCreate: (name: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
  loading: boolean
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

export function TripList({
  itineraries,
  currentUserId,
  onSelect,
  onCreate,
  onDelete,
  loading,
}: TripListProps) {
  const [newName, setNewName] = useState("")
  const [creating, setCreating] = useState(false)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim()) return
    setCreating(true)
    await onCreate(newName.trim())
    setNewName("")
    setCreating(false)
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-3 text-sm text-muted-foreground">Cargando tus viajes...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Create new trip */}
      <Card className="border-dashed border-2 border-border bg-card/50 p-5">
        <form onSubmit={handleCreate} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex flex-col gap-1.5 flex-1">
            <label htmlFor="trip-name" className="text-sm font-medium text-foreground">
              Nuevo viaje
            </label>
            <Input
              id="trip-name"
              placeholder="Ej: Vacaciones Europa 2026"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="h-10"
            />
          </div>
          <Button
            type="submit"
            disabled={!newName.trim() || creating}
            className="bg-primary text-primary-foreground h-10"
          >
            {creating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            Crear viaje
          </Button>
        </form>
      </Card>

      {/* Trip list */}
      {itineraries.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <MapPin className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="mt-4 font-display font-semibold text-foreground">
            Sin viajes aun
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Crea tu primer viaje para comenzar a planificar
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {itineraries.map((it) => {
            const isOwner = it.ownerId === currentUserId
            const destCount = it.destinations.length
            const collabCount = it.collaborators.length

            return (
              <Card
                key={it.id}
                className="group cursor-pointer border-border bg-card p-0 transition-all hover:border-primary/40 hover:shadow-md"
                onClick={() => onSelect(it.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") onSelect(it.id)
                }}
              >
                <div className="flex flex-col gap-3 p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex flex-col gap-1">
                      <h3 className="font-display text-base font-semibold text-foreground group-hover:text-primary transition-colors">
                        {it.name}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {destCount} destino{destCount !== 1 ? "s" : ""}
                        </span>
                        {collabCount > 0 && (
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {collabCount + 1} miembros
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {!isOwner && (
                        <Badge variant="secondary" className="text-xs">
                          Compartido
                        </Badge>
                      )}
                      {isOwner && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            onDelete(it.id)
                          }}
                          className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                          aria-label={`Eliminar viaje ${it.name}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Route preview */}
                  {it.destinations.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
                      {it.destinations.slice(0, 3).map((dest, i) => (
                        <React.Fragment key={dest.id}>
                          {i > 0 && <ArrowRight className="h-3 w-3" />}
                          <span className="font-medium text-foreground">{dest.name}</span>
                        </React.Fragment>
                      ))}
                      {it.destinations.length > 3 && (
                        <span className="text-muted-foreground">
                          +{it.destinations.length - 3} mas
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    Actualizado {formatDate(it.updatedAt)}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
