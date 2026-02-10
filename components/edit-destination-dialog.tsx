"use client"

import React, { useState, useEffect } from "react"
import { MapPin, ArrowRight, Plane, Save } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { DatePicker } from "@/components/date-picker"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { Destination, Connection } from "@/lib/types"

interface EditDestinationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  destination: Destination
  onSave: (
    destinationId: string,
    updates: Partial<Omit<Destination, "id" | "dayPlans">>
  ) => void
}

function toDateStr(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

function parseDate(dateStr: string): Date {
  return new Date(dateStr + "T00:00:00")
}

export function EditDestinationDialog({
  open,
  onOpenChange,
  destination,
  onSave,
}: EditDestinationDialogProps) {
  const [name, setName] = useState(destination.name)
  const [origin, setOrigin] = useState(destination.origin)
  const [startDate, setStartDate] = useState<Date | undefined>(
    parseDate(destination.startDate)
  )
  const [endDate, setEndDate] = useState<Date | undefined>(
    parseDate(destination.endDate)
  )
  const [isConnection, setIsConnection] = useState(destination.isConnection)
  const [connection, setConnection] = useState<Connection>(
    destination.connection || { destination: "", airline: "", flightNumber: "" }
  )

  // Sync when destination prop changes
  useEffect(() => {
    setName(destination.name)
    setOrigin(destination.origin)
    setStartDate(parseDate(destination.startDate))
    setEndDate(parseDate(destination.endDate))
    setIsConnection(destination.isConnection)
    setConnection(
      destination.connection || {
        destination: "",
        airline: "",
        flightNumber: "",
      }
    )
  }, [destination])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !origin || !startDate || !endDate) return

    onSave(destination.id, {
      name,
      origin,
      startDate: toDateStr(startDate),
      endDate: toDateStr(endDate),
      isConnection,
      connection: isConnection ? connection : undefined,
    })
    onOpenChange(false)
  }

  const isValid =
    name && origin && startDate && endDate && startDate <= endDate

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display">
            <MapPin className="h-5 w-5 text-primary" />
            Editar destino
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label
                htmlFor="edit-origin"
                className="text-sm font-medium text-foreground"
              >
                Desde
              </Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="edit-origin"
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label
                htmlFor="edit-destination"
                className="text-sm font-medium text-foreground"
              >
                Hasta
              </Label>
              <div className="relative">
                <ArrowRight className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
                <Input
                  id="edit-destination"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm font-medium text-foreground">
                Fecha de llegada
              </Label>
              <DatePicker
                value={startDate}
                onChange={setStartDate}
                placeholder="Seleccionar llegada"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm font-medium text-foreground">
                Fecha de salida
              </Label>
              <DatePicker
                value={endDate}
                onChange={setEndDate}
                placeholder="Seleccionar salida"
                fromDate={startDate}
              />
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Checkbox
                id="edit-isConnection"
                checked={isConnection}
                onCheckedChange={(checked) =>
                  setIsConnection(checked === true)
                }
              />
              <Label
                htmlFor="edit-isConnection"
                className="text-sm font-medium text-foreground cursor-pointer"
              >
                Es una escala / conexion a otro destino
              </Label>
            </div>

            {isConnection && (
              <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/50 p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-accent">
                  <Plane className="h-4 w-4" />
                  Datos de la conexion
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label
                    htmlFor="edit-connectionDest"
                    className="text-sm text-muted-foreground"
                  >
                    Destino final
                  </Label>
                  <Input
                    id="edit-connectionDest"
                    value={connection.destination}
                    onChange={(e) =>
                      setConnection((prev) => ({
                        ...prev,
                        destination: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <Label
                      htmlFor="edit-airline"
                      className="text-sm text-muted-foreground"
                    >
                      {"Aerolinea (opcional)"}
                    </Label>
                    <Input
                      id="edit-airline"
                      value={connection.airline}
                      onChange={(e) =>
                        setConnection((prev) => ({
                          ...prev,
                          airline: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label
                      htmlFor="edit-flightNumber"
                      className="text-sm text-muted-foreground"
                    >
                      {"N. de vuelo (opcional)"}
                    </Label>
                    <Input
                      id="edit-flightNumber"
                      value={connection.flightNumber}
                      onChange={(e) =>
                        setConnection((prev) => ({
                          ...prev,
                          flightNumber: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="text-foreground"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!isValid}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Save className="mr-2 h-4 w-4" />
              Guardar cambios
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
