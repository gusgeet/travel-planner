"use client"

import { useRef, useState } from "react"
import html2canvas from "html2canvas"
import {
  Download,
  MapPin,
  Clock,
  StickyNote,
  Plane,
  ArrowRight,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { Itinerary } from "@/lib/types"

const COLORS = [
  { bar: "#1a8fcb", light: "#e8f4fb", text: "#115d87" },
  { bar: "#d4663e", light: "#fbeee9", text: "#8c3a1f" },
  { bar: "#3d9970", light: "#e8f5ef", text: "#255f46" },
  { bar: "#d4a843", light: "#fbf5e5", text: "#8a6d1e" },
  { bar: "#d47f3e", light: "#fbf0e5", text: "#8a4f1e" },
]

function formatShort(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00")
  return d.toLocaleDateString("es-ES", { day: "numeric", month: "short" })
}

function formatDayLabel(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00")
  return d.toLocaleDateString("es-ES", {
    weekday: "short",
    day: "numeric",
    month: "short",
  })
}

interface ExportItineraryProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  itinerary: Itinerary
}

export function ExportItinerary({
  open,
  onOpenChange,
  itinerary,
}: ExportItineraryProps) {
  const exportRef = useRef<HTMLDivElement>(null)
  const [exporting, setExporting] = useState(false)

  const handleExport = async () => {
    if (!exportRef.current) return
    setExporting(true)
    try {
      const canvas = await html2canvas(exportRef.current, {
        scale: 2,
        backgroundColor: "#f8f6f3",
        useCORS: true,
        logging: false,
      })
      const link = document.createElement("a")
      link.download = `${itinerary.name.replace(/\s+/g, "_")}_itinerario.png`
      link.href = canvas.toDataURL("image/png")
      link.click()
    } catch {
      // silently fail
    } finally {
      setExporting(false)
    }
  }

  // Compute total days across all destinations
  const totalDays = itinerary.destinations.reduce(
    (acc, d) => acc + d.dayPlans.length,
    0
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 bg-card">
        <DialogHeader className="sticky top-0 z-10 flex flex-row items-center justify-between border-b border-border bg-card px-6 py-4">
          <DialogTitle className="font-display text-lg font-semibold text-foreground">
            Exportar itinerario
          </DialogTitle>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleExport}
              disabled={exporting}
              className="bg-primary text-primary-foreground"
              size="sm"
            >
              <Download className="mr-1.5 h-4 w-4" />
              {exporting ? "Exportando..." : "Descargar PNG"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 p-0 text-muted-foreground"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Cerrar</span>
            </Button>
          </div>
        </DialogHeader>

        {/* Exportable content */}
        <div className="px-4 py-4">
          <div
            ref={exportRef}
            style={{
              background: "#f8f6f3",
              padding: "32px",
              fontFamily: "'Outfit', 'Source Sans 3', system-ui, sans-serif",
              minWidth: "700px",
            }}
          >
            {/* Header */}
            <div style={{ marginBottom: "28px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  marginBottom: "4px",
                }}
              >
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "8px",
                    background: "#1a8fcb",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Plane
                    style={{ width: "18px", height: "18px", color: "white" }}
                  />
                </div>
                <div>
                  <h1
                    style={{
                      fontSize: "22px",
                      fontWeight: 700,
                      color: "#1e293b",
                      margin: 0,
                      lineHeight: 1.3,
                    }}
                  >
                    {itinerary.name}
                  </h1>
                  <p
                    style={{
                      fontSize: "13px",
                      color: "#64748b",
                      margin: 0,
                    }}
                  >
                    {itinerary.destinations.length} destino
                    {itinerary.destinations.length > 1 ? "s" : ""} &middot;{" "}
                    {totalDays} dia{totalDays > 1 ? "s" : ""}
                  </p>
                </div>
              </div>
            </div>

            {/* Horizontal timeline bar */}
            <div style={{ marginBottom: "32px" }}>
              <div
                style={{
                  display: "flex",
                  borderRadius: "10px",
                  overflow: "hidden",
                  height: "52px",
                  border: "1px solid #e2ddd6",
                }}
              >
                {itinerary.destinations.map((dest, i) => {
                  const color = COLORS[i % COLORS.length]
                  const widthPercent =
                    totalDays > 0
                      ? (dest.dayPlans.length / totalDays) * 100
                      : 100 / itinerary.destinations.length
                  return (
                    <div
                      key={dest.id}
                      style={{
                        width: `${widthPercent}%`,
                        background: color.bar,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "4px 8px",
                        position: "relative",
                        minWidth: "60px",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "13px",
                          fontWeight: 700,
                          color: "white",
                          textAlign: "center",
                          lineHeight: 1.2,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          maxWidth: "100%",
                        }}
                      >
                        {dest.name}
                      </span>
                      <span
                        style={{
                          fontSize: "10px",
                          color: "rgba(255,255,255,0.85)",
                          textAlign: "center",
                          lineHeight: 1.2,
                        }}
                      >
                        {formatShort(dest.startDate)} -{" "}
                        {formatShort(dest.endDate)}
                      </span>
                    </div>
                  )
                })}
              </div>

              {/* Day ticks below the bar */}
              <div style={{ display: "flex", marginTop: "6px" }}>
                {itinerary.destinations.map((dest, i) => {
                  const color = COLORS[i % COLORS.length]
                  const widthPercent =
                    totalDays > 0
                      ? (dest.dayPlans.length / totalDays) * 100
                      : 100 / itinerary.destinations.length
                  return (
                    <div
                      key={dest.id}
                      style={{
                        width: `${widthPercent}%`,
                        display: "flex",
                        justifyContent: "space-around",
                        minWidth: "60px",
                      }}
                    >
                      {dest.dayPlans.map((dp, di) => (
                        <div
                          key={dp.date}
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            flex: 1,
                          }}
                        >
                          <div
                            style={{
                              width: "2px",
                              height: "6px",
                              background: color.bar,
                              opacity: 0.4,
                            }}
                          />
                          <span
                            style={{
                              fontSize: "9px",
                              color: color.text,
                              fontWeight: 500,
                              whiteSpace: "nowrap",
                            }}
                          >
                            D{di + 1}
                          </span>
                        </div>
                      ))}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Detailed activities per destination */}
            {itinerary.destinations.map((dest, destIdx) => {
              const color = COLORS[destIdx % COLORS.length]
              return (
                <div key={dest.id} style={{ marginBottom: "24px" }}>
                  {/* Destination sub-header */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginBottom: "12px",
                      paddingBottom: "8px",
                      borderBottom: `2px solid ${color.bar}`,
                    }}
                  >
                    <div
                      style={{
                        width: "24px",
                        height: "24px",
                        borderRadius: "50%",
                        background: color.bar,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <MapPin
                        style={{
                          width: "12px",
                          height: "12px",
                          color: "white",
                        }}
                      />
                    </div>
                    <span
                      style={{
                        fontSize: "15px",
                        fontWeight: 700,
                        color: "#1e293b",
                      }}
                    >
                      {dest.origin}
                    </span>
                    <ArrowRight
                      style={{
                        width: "14px",
                        height: "14px",
                        color: color.bar,
                      }}
                    />
                    <span
                      style={{
                        fontSize: "15px",
                        fontWeight: 700,
                        color: "#1e293b",
                      }}
                    >
                      {dest.name}
                    </span>
                    {dest.isConnection && dest.connection && (
                      <span
                        style={{
                          fontSize: "11px",
                          color: color.text,
                          background: color.light,
                          padding: "2px 8px",
                          borderRadius: "4px",
                          fontWeight: 600,
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <Plane style={{ width: "10px", height: "10px" }} />
                        Conexion a {dest.connection.destination}
                      </span>
                    )}
                  </div>

                  {/* Days grid */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fill, minmax(200px, 1fr))",
                      gap: "10px",
                    }}
                  >
                    {dest.dayPlans.map((dp, di) => (
                      <div
                        key={dp.date}
                        style={{
                          background: "white",
                          borderRadius: "8px",
                          border: `1px solid ${color.light}`,
                          padding: "10px 12px",
                          minHeight: "60px",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            marginBottom: "8px",
                          }}
                        >
                          <div
                            style={{
                              width: "22px",
                              height: "22px",
                              borderRadius: "50%",
                              background: color.light,
                              border: `2px solid ${color.bar}`,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "10px",
                              fontWeight: 700,
                              color: color.text,
                              flexShrink: 0,
                            }}
                          >
                            {di + 1}
                          </div>
                          <span
                            style={{
                              fontSize: "12px",
                              fontWeight: 600,
                              color: color.text,
                              textTransform: "capitalize",
                            }}
                          >
                            {formatDayLabel(dp.date)}
                          </span>
                        </div>
                        {dp.activities.length === 0 ? (
                          <span
                            style={{
                              fontSize: "11px",
                              color: "#94a3b8",
                              fontStyle: "italic",
                            }}
                          >
                            Sin actividades
                          </span>
                        ) : (
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: "5px",
                            }}
                          >
                            {dp.activities.map((act) => (
                              <div
                                key={act.id}
                                style={{
                                  display: "flex",
                                  alignItems: "flex-start",
                                  gap: "6px",
                                  fontSize: "12px",
                                }}
                              >
                                <div
                                  style={{
                                    width: "4px",
                                    minHeight: "16px",
                                    height: "100%",
                                    borderRadius: "2px",
                                    background: color.bar,
                                    opacity: 0.5,
                                    flexShrink: 0,
                                    marginTop: "2px",
                                  }}
                                />
                                <div
                                  style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "1px",
                                  }}
                                >
                                  <span
                                    style={{
                                      fontWeight: 600,
                                      color: "#1e293b",
                                      lineHeight: 1.3,
                                    }}
                                  >
                                    {act.name}
                                  </span>
                                  <div
                                    style={{
                                      display: "flex",
                                      gap: "8px",
                                      flexWrap: "wrap",
                                    }}
                                  >
                                    {act.time && (
                                      <span
                                        style={{
                                          display: "flex",
                                          alignItems: "center",
                                          gap: "3px",
                                          fontSize: "10px",
                                          color: "#64748b",
                                        }}
                                      >
                                        <Clock
                                          style={{
                                            width: "9px",
                                            height: "9px",
                                          }}
                                        />
                                        {act.time}
                                      </span>
                                    )}
                                    {act.notes && (
                                      <span
                                        style={{
                                          display: "flex",
                                          alignItems: "center",
                                          gap: "3px",
                                          fontSize: "10px",
                                          color: "#64748b",
                                        }}
                                      >
                                        <StickyNote
                                          style={{
                                            width: "9px",
                                            height: "9px",
                                          }}
                                        />
                                        {act.notes}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}

            {/* Footer */}
            <div
              style={{
                marginTop: "20px",
                paddingTop: "12px",
                borderTop: "1px solid #e2ddd6",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ fontSize: "10px", color: "#94a3b8" }}>
                Generado con TripPlan
              </span>
              <span style={{ fontSize: "10px", color: "#94a3b8" }}>
                {new Date().toLocaleDateString("es-ES", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
