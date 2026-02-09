"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Map, List, ChevronDown, ChevronUp, Plane, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ItineraryHeader } from "@/components/itinerary-header"
import { DestinationForm } from "@/components/destination-form"
import { TimelineView } from "@/components/timeline-view"
import { TripList } from "@/components/trip-list"
import { ShareDialog } from "@/components/share-dialog"
import { AuthDialog } from "@/components/auth-dialog"
import { useItinerary } from "@/hooks/use-itinerary"
import { useAuth } from "@/lib/auth-context"

function TripPlannerContent() {
  const { user, loading: authLoading } = useAuth()
  const {
    itineraries,
    currentItinerary,
    currentItineraryId,
    setCurrentItineraryId,
    loading,
    createItinerary,
    deleteItinerary,
    updateItineraryName,
    addDestination,
    removeDestination,
    addActivity,
    removeActivity,
    addCollaborator,
    removeCollaborator,
  } = useItinerary()

  const searchParams = useSearchParams()
  const [showForm, setShowForm] = useState(true)
  const [shareOpen, setShareOpen] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)

  // Handle ?trip=ID in URL
  useEffect(() => {
    const tripId = searchParams.get("trip")
    if (tripId && !currentItineraryId) {
      setCurrentItineraryId(tripId)
    }
  }, [searchParams, currentItineraryId, setCurrentItineraryId])

  if (authLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-3 text-sm text-muted-foreground">Cargando...</p>
      </div>
    )
  }

  // Not logged in - show landing
  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 md:px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                <Plane className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-display font-bold text-foreground">
                  TripPlan
                </h1>
                <p className="text-xs text-muted-foreground">
                  Planifica y comparte tus viajes
                </p>
              </div>
            </div>
            <Button
              onClick={() => setAuthOpen(true)}
              className="bg-primary text-primary-foreground"
            >
              Iniciar sesion
            </Button>
          </div>
        </header>

        <main className="mx-auto max-w-3xl px-4 py-16 md:px-6 text-center">
          <div className="flex flex-col items-center gap-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
              <Plane className="h-10 w-10 text-primary" />
            </div>
            <h2 className="font-display text-3xl font-bold text-foreground text-balance">
              Planifica tus viajes de forma colaborativa
            </h2>
            <p className="max-w-lg text-lg text-muted-foreground leading-relaxed">
              Crea itinerarios detallados con destinos, conexiones y actividades diarias.
              Comparte con tus companeros de viaje para planificar juntos en tiempo real.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                size="lg"
                onClick={() => setAuthOpen(true)}
                className="bg-primary text-primary-foreground px-8"
              >
                Comenzar gratis
              </Button>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-3 w-full max-w-2xl">
              {[
                {
                  title: "Destinos y fechas",
                  desc: "Agrega destinos con rangos de fecha, origen y escalas",
                },
                {
                  title: "Actividades por dia",
                  desc: "Planifica que hacer cada dia con horarios y notas",
                },
                {
                  title: "Colabora en equipo",
                  desc: "Comparte el viaje e invita a otros a editar contigo",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="flex flex-col gap-2 rounded-lg border border-border bg-card p-4 text-left"
                >
                  <h3 className="font-display font-semibold text-foreground">
                    {item.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </main>

        <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
      </div>
    )
  }

  // Logged in but no trip selected - show trip list
  if (!currentItinerary) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 md:px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                <Plane className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-display font-bold text-foreground">
                  TripPlan
                </h1>
                <p className="text-xs text-muted-foreground">
                  Mis viajes
                </p>
              </div>
            </div>
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
                <span className="max-w-[140px] truncate">
                  {user.displayName || user.email}
                </span>
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-3xl px-4 py-6 md:px-6 md:py-8">
          <TripList
            itineraries={itineraries}
            currentUserId={user.uid}
            onSelect={(id) => setCurrentItineraryId(id)}
            onCreate={createItinerary}
            onDelete={deleteItinerary}
            loading={loading}
          />
        </main>
      </div>
    )
  }

  // Trip selected - show itinerary editor
  const isOwner = currentItinerary.ownerId === user.uid

  return (
    <div className="min-h-screen bg-background">
      <ItineraryHeader
        name={currentItinerary.name}
        destinationCount={currentItinerary.destinations.length}
        onNameChange={updateItineraryName}
        onShare={() => setShareOpen(true)}
        onBack={() => setCurrentItineraryId(null)}
        showBack
      />

      <main className="mx-auto max-w-5xl px-4 py-6 md:px-6 md:py-8">
        <div className="flex flex-col gap-6">
          {/* Summary bar */}
          {currentItinerary.destinations.length > 0 && (
            <div className="flex flex-wrap items-center gap-3 rounded-lg bg-card border border-border px-4 py-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Map className="h-4 w-4 text-primary" />
                <span className="font-medium text-foreground">Resumen:</span>
              </div>
              {currentItinerary.destinations.map((dest, i) => (
                <span
                  key={dest.id}
                  className="flex items-center gap-1 text-sm"
                >
                  <span className="font-medium text-foreground">
                    {dest.origin}
                  </span>
                  <span className="text-muted-foreground">{"→"}</span>
                  <span className="font-medium text-foreground">
                    {dest.name}
                  </span>
                  {dest.isConnection && dest.connection && (
                    <>
                      <span className="text-muted-foreground">{"→"}</span>
                      <span className="font-medium text-accent">
                        {dest.connection.destination}
                      </span>
                    </>
                  )}
                  {i < currentItinerary.destinations.length - 1 && (
                    <span className="ml-1 text-border">|</span>
                  )}
                </span>
              ))}
            </div>
          )}

          {/* Toggle form button */}
          {currentItinerary.destinations.length > 0 && (
            <Button
              variant="outline"
              onClick={() => setShowForm(!showForm)}
              className="w-full justify-between border-border text-foreground md:w-auto md:self-start"
            >
              <span className="flex items-center gap-2">
                <List className="h-4 w-4" />
                {showForm ? "Ocultar formulario" : "Agregar nuevo destino"}
              </span>
              {showForm ? (
                <ChevronUp className="ml-2 h-4 w-4" />
              ) : (
                <ChevronDown className="ml-2 h-4 w-4" />
              )}
            </Button>
          )}

          {/* Destination Form */}
          {showForm && <DestinationForm onAdd={addDestination} />}

          {/* Timeline section */}
          <div className="flex flex-col gap-3">
            {currentItinerary.destinations.length > 0 && (
              <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-foreground">
                <List className="h-5 w-5 text-primary" />
                Itinerario
              </h2>
            )}
            <TimelineView
              destinations={currentItinerary.destinations}
              onAddActivity={addActivity}
              onRemoveActivity={removeActivity}
              onRemoveDestination={removeDestination}
            />
          </div>
        </div>
      </main>

      <ShareDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        itinerary={currentItinerary}
        onAddCollaborator={addCollaborator}
        onRemoveCollaborator={removeCollaborator}
        isOwner={isOwner}
      />
    </div>
  )
}

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <TripPlannerContent />
    </Suspense>
  )
}
