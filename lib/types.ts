export interface Activity {
  id: string
  name: string
  time?: string
  notes?: string
}

export interface DayPlan {
  date: string
  activities: Activity[]
}

export interface Connection {
  destination: string
  airline?: string
  flightNumber?: string
}

export interface Destination {
  id: string
  name: string
  origin: string
  startDate: string
  endDate: string
  isConnection: boolean
  connection?: Connection
  dayPlans: DayPlan[]
}

export interface Collaborator {
  uid: string
  email: string
  displayName: string
  role: "owner" | "editor"
}

export interface Itinerary {
  id: string
  name: string
  destinations: Destination[]
  ownerId: string
  ownerEmail: string
  collaborators: Collaborator[]
  createdAt: string
  updatedAt: string
}
