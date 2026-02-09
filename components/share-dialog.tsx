"use client"

import React, { useState } from "react"
import { Share2, UserPlus, X, Crown, Pencil, Copy, Check } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import type { Itinerary } from "@/lib/types"

interface ShareDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  itinerary: Itinerary
  onAddCollaborator: (email: string) => Promise<void>
  onRemoveCollaborator: (email: string) => Promise<void>
  isOwner: boolean
}

export function ShareDialog({
  open,
  onOpenChange,
  itinerary,
  onAddCollaborator,
  onRemoveCollaborator,
  isOwner,
}: ShareDialogProps) {
  const [email, setEmail] = useState("")
  const [adding, setAdding] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setAdding(true)
    try {
      await onAddCollaborator(email.trim())
      setEmail("")
    } finally {
      setAdding(false)
    }
  }

  const handleCopyLink = () => {
    const url = `${window.location.origin}?trip=${itinerary.id}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-card">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-xl text-foreground">
            <Share2 className="h-5 w-5 text-primary" />
            Compartir viaje
          </DialogTitle>
          <DialogDescription>
            Invita a otras personas para editar este itinerario juntos
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {/* Copy link */}
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-foreground">Enlace del viaje</p>
            <div className="flex gap-2">
              <Input
                readOnly
                value={`${typeof window !== "undefined" ? window.location.origin : ""}?trip=${itinerary.id}`}
                className="text-sm text-muted-foreground"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyLink}
                className="flex-shrink-0 bg-transparent"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-chart-3" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Add collaborator */}
          {isOwner && (
            <form onSubmit={handleAdd} className="flex flex-col gap-2">
              <p className="text-sm font-medium text-foreground">Agregar colaborador</p>
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="email@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1"
                />
                <Button
                  type="submit"
                  disabled={adding || !email.trim()}
                  size="sm"
                  className="bg-primary text-primary-foreground"
                >
                  <UserPlus className="mr-1 h-4 w-4" />
                  Invitar
                </Button>
              </div>
            </form>
          )}

          {/* Members list */}
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-foreground">Miembros</p>
            <div className="flex flex-col gap-1">
              {/* Owner */}
              <div className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                    {itinerary.ownerEmail?.[0]?.toUpperCase() || "O"}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-foreground">
                      {itinerary.ownerEmail}
                    </span>
                  </div>
                </div>
                <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                  <Crown className="h-3 w-3" />
                  Propietario
                </Badge>
              </div>

              {/* Collaborators */}
              {itinerary.collaborators.map((collab) => (
                <div
                  key={collab.email}
                  className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
                      {collab.email[0]?.toUpperCase() || "C"}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-foreground">
                        {collab.displayName || collab.email}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {collab.email}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="flex items-center gap-1 text-xs">
                      <Pencil className="h-3 w-3" />
                      Editor
                    </Badge>
                    {isOwner && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemoveCollaborator(collab.email)}
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
