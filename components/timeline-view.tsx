"use client"

import {
  MapPin,
  Clock,
  Trash2,
  Plane,
  ArrowRight,
  StickyNote,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ActivityForm } from "@/components/activity-form"
import type { Destination, Activity } from "@/lib/types"

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00")
  return date.toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })
}

function formatShortDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00")
  return date.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
  })
}

function getDayNumber(startDate: string, currentDate: string): number {
  const start = new Date(startDate + "T00:00:00")
  const current = new Date(currentDate + "T00:00:00")
  return (
    Math.floor(
      (current.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    ) + 1
  )
}

const DESTINATION_COLORS = [
  { bg: "bg-primary/10", border: "border-primary/30", dot: "bg-primary", text: "text-primary" },
  { bg: "bg-accent/10", border: "border-accent/30", dot: "bg-accent", text: "text-accent" },
  { bg: "bg-chart-3/10", border: "border-chart-3/30", dot: "bg-chart-3", text: "text-chart-3" },
  { bg: "bg-chart-4/10", border: "border-chart-4/30", dot: "bg-chart-4", text: "text-chart-4" },
  { bg: "bg-chart-5/10", border: "border-chart-5/30", dot: "bg-chart-5", text: "text-chart-5" },
]

interface TimelineViewProps {
  destinations: Destination[]
  onAddActivity: (
    destinationId: string,
    date: string,
    activity: Omit<Activity, "id">
  ) => void
  onRemoveActivity: (
    destinationId: string,
    date: string,
    activityId: string
  ) => void
  onRemoveDestination: (destinationId: string) => void
}

export function TimelineView({
  destinations,
  onAddActivity,
  onRemoveActivity,
  onRemoveDestination,
}: TimelineViewProps) {
  if (destinations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
          <MapPin className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="mt-4 font-display font-semibold text-foreground">
          Sin destinos aun
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Agrega tu primer destino para comenzar a planificar
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      {destinations.map((destination, destIndex) => {
        const colors = DESTINATION_COLORS[destIndex % DESTINATION_COLORS.length]

        return (
          <div key={destination.id} className="flex flex-col gap-0">
            {/* Destination Header */}
            <div
              className={`flex items-center justify-between rounded-t-lg border ${colors.border} ${colors.bg} px-4 py-3 md:px-5`}
            >
              <div className="flex flex-col gap-1">
                <div className="flex flex-wrap items-center gap-2">
                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-full ${colors.dot}`}
                  >
                    <MapPin className="h-3.5 w-3.5 text-primary-foreground" />
                  </div>
                  <h2 className="font-display text-lg font-semibold text-foreground">
                    {destination.origin}
                  </h2>
                  <ArrowRight className={`h-4 w-4 ${colors.text}`} />
                  <h2 className="font-display text-lg font-semibold text-foreground">
                    {destination.name}
                  </h2>
                  {destination.isConnection && destination.connection && (
                    <Badge
                      variant="secondary"
                      className="flex items-center gap-1 text-xs"
                    >
                      <Plane className="h-3 w-3" />
                      {"Conexion a "}
                      {destination.connection.destination}
                    </Badge>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <span>
                    {formatShortDate(destination.startDate)}
                    {" - "}
                    {formatShortDate(destination.endDate)}
                  </span>
                  <span className="text-xs">
                    {"("}
                    {destination.dayPlans.length}
                    {" dia"}
                    {destination.dayPlans.length > 1 ? "s" : ""}
                    {")"}
                  </span>
                  {destination.isConnection && destination.connection?.airline && (
                    <span className="text-xs">
                      {destination.connection.airline}
                      {destination.connection.flightNumber
                        ? ` - ${destination.connection.flightNumber}`
                        : ""}
                    </span>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemoveDestination(destination.id)}
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                aria-label={`Eliminar destino ${destination.name}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            {/* Day Plans Timeline */}
            <div className="rounded-b-lg border border-t-0 border-border bg-card">
              {destination.dayPlans.map((dayPlan, dayIndex) => {
                const dayNum = getDayNumber(
                  destination.startDate,
                  dayPlan.date
                )
                const isLast = dayIndex === destination.dayPlans.length - 1

                return (
                  <div
                    key={dayPlan.date}
                    className={`flex ${!isLast ? "border-b border-border" : ""}`}
                  >
                    {/* Timeline line */}
                    <div className="relative flex w-16 flex-shrink-0 flex-col items-center py-4 md:w-20">
                      <div
                        className={`z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 ${colors.border} bg-card text-xs font-semibold ${colors.text}`}
                      >
                        {dayNum}
                      </div>
                      {!isLast && (
                        <div
                          className={`absolute bottom-0 top-12 w-0.5 ${colors.dot} opacity-20`}
                        />
                      )}
                    </div>

                    {/* Day content */}
                    <div className="flex-1 py-4 pr-4 md:pr-5">
                      <div className="mb-3 flex items-baseline gap-2">
                        <span className="text-sm font-semibold text-foreground capitalize">
                          {formatDate(dayPlan.date)}
                        </span>
                      </div>

                      {/* Activities */}
                      <div className="flex flex-col gap-2">
                        {dayPlan.activities.map((activity) => (
                          <div
                            key={activity.id}
                            className="group flex items-start justify-between rounded-md border border-border bg-muted/40 px-3 py-2 transition-colors hover:bg-muted"
                          >
                            <div className="flex items-start gap-2">
                              <MapPin
                                className={`mt-0.5 h-3.5 w-3.5 flex-shrink-0 ${colors.text}`}
                              />
                              <div className="flex flex-col">
                                <span className="text-sm font-medium text-foreground">
                                  {activity.name}
                                </span>
                                <div className="flex flex-wrap items-center gap-2">
                                  {activity.time && (
                                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                      <Clock className="h-3 w-3" />
                                      {activity.time}
                                    </span>
                                  )}
                                  {activity.notes && (
                                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                      <StickyNote className="h-3 w-3" />
                                      {activity.notes}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                onRemoveActivity(
                                  destination.id,
                                  dayPlan.date,
                                  activity.id
                                )
                              }
                              className="h-6 w-6 p-0 opacity-0 transition-opacity group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                              aria-label={`Eliminar actividad ${activity.name}`}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}

                        <ActivityForm
                          onAdd={(activity) =>
                            onAddActivity(
                              destination.id,
                              dayPlan.date,
                              activity
                            )
                          }
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
