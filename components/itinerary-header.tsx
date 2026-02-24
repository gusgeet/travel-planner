"use client"

import { useState } from "react"
import { Plane, Pencil, Check, LogOut, Share2, ArrowLeft, User, Download } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { AuthDialog } from "@/components/auth-dialog"
import { PwaControls } from "@/components/pwa-controls"

interface ItineraryHeaderProps {
  name: string
  destinationCount: number
  onNameChange: (name: string) => void
  onShare?: () => void
  onExport?: () => void
  onBack?: () => void
  showBack?: boolean
}

export function ItineraryHeader({
  name,
  destinationCount,
  onNameChange,
  onShare,
  onExport,
  onBack,
  showBack = false,
}: ItineraryHeaderProps) {
  const { user, signOut } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(name)
  const [authOpen, setAuthOpen] = useState(false)

  const handleSave = () => {
    onNameChange(editValue)
    setIsEditing(false)
  }

  return (
    <>
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 md:px-6">
          <div className="flex items-center gap-3">
            {showBack && onBack ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="mr-1 text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            ) : null}
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <Plane className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSave()}
                    className="h-8 w-48 text-lg font-display font-semibold"
                    autoFocus
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleSave}
                    aria-label="Guardar nombre"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-display font-semibold text-foreground">
                    {name}
                  </h1>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setEditValue(name)
                      setIsEditing(true)
                    }}
                    aria-label="Editar nombre"
                  >
                    <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                </div>
              )}
              <p className="text-sm text-muted-foreground">
                {destinationCount === 0
                  ? "Sin destinos agregados"
                  : `${destinationCount} destino${destinationCount > 1 ? "s" : ""}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <PwaControls />

            {onExport && (
              <Button
                variant="outline"
                size="sm"
                onClick={onExport}
                className="text-foreground bg-transparent"
              >
                <Download className="mr-1.5 h-3.5 w-3.5" />
                <span className="hidden sm:inline">Exportar</span>
              </Button>
            )}

            {onShare && (
              <Button
                variant="outline"
                size="sm"
                onClick={onShare}
                className="text-foreground bg-transparent"
              >
                <Share2 className="mr-1.5 h-3.5 w-3.5" />
                <span className="hidden sm:inline">Compartir</span>
              </Button>
            )}

            {user ? (
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-1.5 text-sm text-muted-foreground">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL || "/placeholder.svg"}
                      alt={user.displayName || "Avatar"}
                      className="h-7 w-7 rounded-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                      {(user.displayName?.[0] || user.email?.[0] || "U").toUpperCase()}
                    </div>
                  )}
                  <span className="max-w-[120px] truncate">{user.displayName || user.email}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={signOut}
                  className="text-muted-foreground hover:text-foreground"
                  aria-label="Cerrar sesion"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAuthOpen(true)}
                className="text-foreground"
              >
                <User className="mr-1.5 h-3.5 w-3.5" />
                <span className="hidden sm:inline">Iniciar sesion</span>
              </Button>
            )}
          </div>
        </div>
      </header>
      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
    </>
  )
}
