"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { toast } from "sonner"
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  deleteDoc,
  query,
  where,
  updateDoc,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/lib/auth-context"
import type {
  Itinerary,
  Destination,
  Activity,
  DayPlan,
  Collaborator,
} from "@/lib/types"

function generateId() {
  return Math.random().toString(36).substring(2, 11)
}

// Recursively remove undefined values so Firestore doesn't reject them
function stripUndefined<T>(obj: T): T {
  if (Array.isArray(obj)) {
    return obj.map(stripUndefined) as T
  }
  if (obj !== null && typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj as Record<string, unknown>)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, stripUndefined(v)])
    ) as T
  }
  return obj
}

function getDaysBetween(start: string, end: string): string[] {
  const days: string[] = []
  const startDate = new Date(start + "T00:00:00")
  const endDate = new Date(end + "T00:00:00")
  const current = new Date(startDate)
  while (current <= endDate) {
    days.push(current.toISOString().split("T")[0])
    current.setDate(current.getDate() + 1)
  }
  return days
}

// Merge two itinerary arrays, preferring the newer version of each
function mergeItineraries(a: Itinerary[], b: Itinerary[]): Itinerary[] {
  const map = new Map<string, Itinerary>()
  for (const it of a) map.set(it.id, it)
  for (const it of b) {
    const existing = map.get(it.id)
    if (!existing || new Date(it.updatedAt) >= new Date(existing.updatedAt)) {
      map.set(it.id, it)
    }
  }
  return Array.from(map.values()).sort(
    (x, y) => new Date(y.updatedAt).getTime() - new Date(x.updatedAt).getTime()
  )
}

export function useItinerary() {
  const { user } = useAuth()
  const [ownedItineraries, setOwnedItineraries] = useState<Itinerary[]>([])
  const [sharedItineraries, setSharedItineraries] = useState<Itinerary[]>([])
  const [currentItineraryId, setCurrentItineraryId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const resolvedRef = useRef(new Set<string>())
  const notifiedVersionsRef = useRef(new Map<string, string>())

  // All itineraries merged
  const itineraries = mergeItineraries(ownedItineraries, sharedItineraries)
  const rawCurrentItinerary = itineraries.find((it) => it.id === currentItineraryId) || null

  // Always sort destinations by startDate
  const currentItinerary = rawCurrentItinerary
    ? {
        ...rawCurrentItinerary,
        destinations: [...rawCurrentItinerary.destinations].sort(
          (a, b) => a.startDate.localeCompare(b.startDate)
        ),
      }
    : null

  // Listen to itineraries the user OWNS
  useEffect(() => {
    if (!user) {
      setOwnedItineraries([])
      setSharedItineraries([])
      setCurrentItineraryId(null)
      setLoading(false)
      return
    }

    const ownedQuery = query(
      collection(db, "itineraries"),
      where("ownerId", "==", user.uid)
    )

    const unsub = onSnapshot(ownedQuery, (snapshot) => {
      const results = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Itinerary[]
      setOwnedItineraries(results)
      setLoading(false)
    })

    return unsub
  }, [user])

  // Listen to itineraries shared WITH the user (by email)
  useEffect(() => {
    if (!user?.email) return

    const sharedQuery = query(
      collection(db, "itineraries"),
      where("collaboratorEmails", "array-contains", user.email)
    )

    const unsub = onSnapshot(sharedQuery, (snapshot) => {
      const results = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Itinerary[]
      setSharedItineraries(results)
    })

    return unsub
  }, [user])

  // When shared itineraries arrive, resolve our UID into the collaborator entry
  useEffect(() => {
    if (!user?.email) return

    for (const it of sharedItineraries) {
      // Skip if already resolved for this itinerary in this session
      if (resolvedRef.current.has(it.id)) continue

      const myCollab = it.collaborators.find(
        (c) => c.email === user.email && c.uid === ""
      )
      if (myCollab) {
        resolvedRef.current.add(it.id)
        const updatedCollabs = it.collaborators.map((c) =>
          c.email === user.email
            ? { ...c, uid: user.uid, displayName: user.displayName || c.displayName }
            : c
        )
        updateDoc(doc(db, "itineraries", it.id), {
          collaborators: stripUndefined(updatedCollabs),
          collaboratorUids: arrayUnion(user.uid),
        }).catch(() => {
          // If it fails, allow retry next time
          resolvedRef.current.delete(it.id)
        })
      }
    }
  }, [user, sharedItineraries])


  useEffect(() => {
    if (!user) return

    const seenVersions = notifiedVersionsRef.current
    const activeIds = new Set(itineraries.map((itinerary) => itinerary.id))

    for (const itinerary of itineraries) {
      const previousVersion = seenVersions.get(itinerary.id)

      if (!previousVersion) {
        seenVersions.set(itinerary.id, itinerary.updatedAt)
        continue
      }

      if (previousVersion === itinerary.updatedAt) continue
      seenVersions.set(itinerary.id, itinerary.updatedAt)

      if (!itinerary.lastModifiedByUid || itinerary.lastModifiedByUid === user.uid) continue

      const actor = itinerary.lastModifiedByName || itinerary.lastModifiedByEmail || "Otro colaborador"
      const body = `${actor} actualizó "${itinerary.name}".`

      toast.info(body)

      if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
        const showNativeNotification = async () => {
          const registration = await navigator.serviceWorker.getRegistration()
          if (registration) {
            await registration.showNotification("Viaje actualizado", {
              body,
              icon: "/placeholder-logo.svg",
              badge: "/placeholder-logo.svg",
              data: { url: `/?trip=${itinerary.id}` },
            })
            return
          }

          new Notification("Viaje actualizado", { body })
        }

        showNativeNotification().catch(() => {
          // Keep UI responsive if OS-level notifications fail.
        })
      }
    }

    for (const itineraryId of Array.from(seenVersions.keys())) {
      if (!activeIds.has(itineraryId)) {
        seenVersions.delete(itineraryId)
      }
    }
  }, [itineraries, user])

  // Listen to real-time updates on the current itinerary (covers direct link access)
  useEffect(() => {
    if (!currentItineraryId) return

    const unsub = onSnapshot(
      doc(db, "itineraries", currentItineraryId),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = { id: docSnap.id, ...docSnap.data() } as Itinerary
          // Update in both lists
          setOwnedItineraries((prev) =>
            prev.some((it) => it.id === data.id)
              ? prev.map((it) => (it.id === data.id ? data : it))
              : prev
          )
          setSharedItineraries((prev) =>
            prev.some((it) => it.id === data.id)
              ? prev.map((it) => (it.id === data.id ? data : it))
              : prev
          )
          setLoading(false)
        }
      }
    )

    return unsub
  }, [currentItineraryId])

  const saveItinerary = useCallback(async (itinerary: Itinerary) => {
    const { id, ...data } = itinerary
    const collaboratorUids = itinerary.collaborators
      .map((c) => c.uid)
      .filter((uid) => uid !== "")
    const collaboratorEmails = itinerary.collaborators.map((c) => c.email)
    const cleaned = stripUndefined({
      ...data,
      collaboratorUids,
      collaboratorEmails,
      updatedAt: new Date().toISOString(),
      lastModifiedByUid: user?.uid || "",
      lastModifiedByName: user?.displayName || user?.email || "Usuario",
      lastModifiedByEmail: user?.email || "",
    })
    await setDoc(doc(db, "itineraries", id), cleaned)
  }, [user])

  const createItinerary = useCallback(
    async (name: string) => {
      if (!user) return
      const id = generateId()
      const now = new Date().toISOString()
      const newItinerary: Itinerary = {
        id,
        name,
        destinations: [],
        ownerId: user.uid,
        ownerEmail: user.email || "",
        collaborators: [],
        createdAt: now,
        updatedAt: now,
        lastModifiedByUid: user.uid,
        lastModifiedByName: user.displayName || user.email || "Usuario",
        lastModifiedByEmail: user.email || "",
      }
      await setDoc(doc(db, "itineraries", id), stripUndefined({
        ...newItinerary,
        collaboratorUids: [],
        collaboratorEmails: [],
      }))
      setCurrentItineraryId(id)
    },
    [user]
  )

  const deleteItinerary = useCallback(
    async (itineraryId: string) => {
      await deleteDoc(doc(db, "itineraries", itineraryId))
      if (currentItineraryId === itineraryId) {
        setCurrentItineraryId(null)
      }
    },
    [currentItineraryId]
  )

  const updateItineraryName = useCallback(
    async (name: string) => {
      if (!currentItinerary) return
      await saveItinerary({ ...currentItinerary, name })
    },
    [currentItinerary, saveItinerary]
  )

  const addDestination = useCallback(
    async (destination: Omit<Destination, "id" | "dayPlans">) => {
      if (!currentItinerary) return
      const days = getDaysBetween(destination.startDate, destination.endDate)
      const dayPlans: DayPlan[] = days.map((date) => ({
        date,
        activities: [],
      }))
      const newDest: Destination = {
        ...destination,
        id: generateId(),
        dayPlans,
      }
      await saveItinerary({
        ...currentItinerary,
        destinations: [...currentItinerary.destinations, newDest],
      })
    },
    [currentItinerary, saveItinerary]
  )

  const updateDestination = useCallback(
    async (destinationId: string, updates: Partial<Omit<Destination, "id" | "dayPlans">>) => {
      if (!currentItinerary) return

      await saveItinerary({
        ...currentItinerary,
        destinations: currentItinerary.destinations.map((d) => {
          if (d.id !== destinationId) return d

          const updated = { ...d, ...updates }

          // If dates changed, regenerate dayPlans preserving existing activities
          const newStart = updates.startDate || d.startDate
          const newEnd = updates.endDate || d.endDate
          if (updates.startDate || updates.endDate) {
            const newDays = getDaysBetween(newStart, newEnd)
            const existingPlanMap = new Map(d.dayPlans.map((dp) => [dp.date, dp]))
            updated.dayPlans = newDays.map((date) => existingPlanMap.get(date) || { date, activities: [] })
          }

          return updated
        }),
      })
    },
    [currentItinerary, saveItinerary]
  )

  const removeDestination = useCallback(
    async (destinationId: string) => {
      if (!currentItinerary) return
      await saveItinerary({
        ...currentItinerary,
        destinations: currentItinerary.destinations.filter(
          (d) => d.id !== destinationId
        ),
      })
    },
    [currentItinerary, saveItinerary]
  )

  const addActivity = useCallback(
    async (destinationId: string, date: string, activity: Omit<Activity, "id">) => {
      if (!currentItinerary) return
      const newActivity: Activity = { ...activity, id: generateId() }
      await saveItinerary({
        ...currentItinerary,
        destinations: currentItinerary.destinations.map((d) => {
          if (d.id !== destinationId) return d
          return {
            ...d,
            dayPlans: d.dayPlans.map((dp) => {
              if (dp.date !== date) return dp
              return { ...dp, activities: [...dp.activities, newActivity] }
            }),
          }
        }),
      })
    },
    [currentItinerary, saveItinerary]
  )

  const updateActivity = useCallback(
    async (
      destinationId: string,
      date: string,
      activityId: string,
      updates: Partial<Omit<Activity, "id">>
    ) => {
      if (!currentItinerary) return
      await saveItinerary({
        ...currentItinerary,
        destinations: currentItinerary.destinations.map((d) => {
          if (d.id !== destinationId) return d
          return {
            ...d,
            dayPlans: d.dayPlans.map((dp) => {
              if (dp.date !== date) return dp
              return {
                ...dp,
                activities: dp.activities.map((a) =>
                  a.id === activityId ? { ...a, ...updates } : a
                ),
              }
            }),
          }
        }),
      })
    },
    [currentItinerary, saveItinerary]
  )

  const removeActivity = useCallback(
    async (destinationId: string, date: string, activityId: string) => {
      if (!currentItinerary) return
      await saveItinerary({
        ...currentItinerary,
        destinations: currentItinerary.destinations.map((d) => {
          if (d.id !== destinationId) return d
          return {
            ...d,
            dayPlans: d.dayPlans.map((dp) => {
              if (dp.date !== date) return dp
              return {
                ...dp,
                activities: dp.activities.filter((a) => a.id !== activityId),
              }
            }),
          }
        }),
      })
    },
    [currentItinerary, saveItinerary]
  )

  const addCollaborator = useCallback(
    async (email: string) => {
      if (!currentItinerary || !user) return

      // Don't add if already exists
      if (currentItinerary.collaborators.some((c) => c.email === email)) return
      // Don't add the owner
      if (email === currentItinerary.ownerEmail) return

      const collab: Collaborator = {
        uid: "", // Resolved when they sign in
        email,
        displayName: email.split("@")[0],
        role: "editor",
      }

      await saveItinerary({
        ...currentItinerary,
        collaborators: [...currentItinerary.collaborators, collab],
      })
    },
    [currentItinerary, user, saveItinerary]
  )

  const removeCollaborator = useCallback(
    async (email: string) => {
      if (!currentItinerary) return
      const collab = currentItinerary.collaborators.find((c) => c.email === email)

      // Remove UID from array if it was resolved
      if (collab?.uid) {
        await updateDoc(doc(db, "itineraries", currentItinerary.id), {
          collaboratorUids: arrayRemove(collab.uid),
          collaboratorEmails: arrayRemove(collab.email),
        })
      }

      await saveItinerary({
        ...currentItinerary,
        collaborators: currentItinerary.collaborators.filter(
          (c) => c.email !== email
        ),
      })
    },
    [currentItinerary, saveItinerary]
  )

  return {
    itineraries,
    currentItinerary,
    currentItineraryId,
    setCurrentItineraryId,
    loading,
    createItinerary,
    deleteItinerary,
    updateItineraryName,
    addDestination,
    updateDestination,
    removeDestination,
    addActivity,
    updateActivity,
    removeActivity,
    addCollaborator,
    removeCollaborator,
  }
}
