"use client"

import React from "react"
import { useState } from "react"
import { MapPin, ArrowRight, Plane, Plus } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DatePicker } from "@/components/date-picker"
import type { Destination, Connection } from "@/lib/types"

interface DestinationFormProps {
  onAdd: (destination: Omit<Destination, "id" | "dayPlans">) => void
}

function toDateStr(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

export function DestinationForm({ onAdd }: DestinationFormProps) {
  const [name, setName] = useState("")
  const [origin, setOrigin] = useState("")
  const [startDate, setStartDate] = useState<Date | undefined>(undefined)
  const [endDate, setEndDate] = useState<Date | undefined>(undefined)
  const [isConnection, setIsConnection] = useState(false)
  const [connection, setConnection] = useState<Connection>({
    destination: "",
    airline: "",
    flightNumber: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !origin || !startDate || !endDate) return

    onAdd({
      name,
      origin,
      startDate: toDateStr(startDate),
      endDate: toDateStr(endDate),
      isConnection,
      connection: isConnection ? connection : undefined,
    })

    setName("")
    setOrigin("")
    setStartDate(undefined)
    setEndDate(undefined)
    setIsConnection(false)
    setConnection({ destination: "", airline: "", flightNumber: "" })
  }

  const isValid =
    name && origin && startDate && endDate && startDate <= endDate

  return (
    <Card className="border-dashed border-2 border-border bg-card/50">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-base font-display font-semibold text-foreground">
          <Plus className="h-4 w-4 text-primary" />
          Agregar Destino
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label
                htmlFor="origin"
                className="text-sm font-medium text-foreground"
              >
                Desde
              </Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="origin"
                  placeholder="Ciudad de origen"
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label
                htmlFor="destination"
                className="text-sm font-medium text-foreground"
              >
                Hasta
              </Label>
              <div className="relative">
                <ArrowRight className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
                <Input
                  id="destination"
                  placeholder="Ciudad de destino"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
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
                id="isConnection"
                checked={isConnection}
                onCheckedChange={(checked) =>
                  setIsConnection(checked === true)
                }
              />
              <Label
                htmlFor="isConnection"
                className="text-sm font-medium text-foreground cursor-pointer"
              >
                Es una escala / conexion a otro destino
              </Label>
            </div>

            {isConnection && (
              <div className="ml-6 flex flex-col gap-3 rounded-lg border border-border bg-muted/50 p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-accent">
                  <Plane className="h-4 w-4" />
                  Datos de la conexion
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label
                    htmlFor="connectionDest"
                    className="text-sm text-muted-foreground"
                  >
                    Destino final
                  </Label>
                  <Input
                    id="connectionDest"
                    placeholder="Destino final de la conexion"
                    value={connection.destination}
                    onChange={(e) =>
                      setConnection((prev) => ({
                        ...prev,
                        destination: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <Label
                      htmlFor="airline"
                      className="text-sm text-muted-foreground"
                    >
                      {"Aerolinea (opcional)"}
                    </Label>
                    <Input
                      id="airline"
                      placeholder="Nombre de aerolinea"
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
                      htmlFor="flightNumber"
                      className="text-sm text-muted-foreground"
                    >
                      {"N. de vuelo (opcional)"}
                    </Label>
                    <Input
                      id="flightNumber"
                      placeholder="Ej: AA1234"
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

          <Button
            type="submit"
            disabled={!isValid}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 md:w-auto md:self-end"
          >
            <Plus className="mr-2 h-4 w-4" />
            Agregar destino
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
