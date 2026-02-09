import React from "react"
import type { Metadata, Viewport } from "next"
import { Outfit, Source_Sans_3 } from "next/font/google"
import { Toaster } from "@/components/ui/sonner"
import { AuthProvider } from "@/lib/auth-context"

import "./globals.css"

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
})

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-source-sans",
})

export const metadata: Metadata = {
  title: "TripPlan - Planifica tu Viaje",
  description:
    "Planifica tus itinerarios de viaje con destinos, conexiones y actividades diarias. Comparte y colabora en tiempo real.",
}

export const viewport: Viewport = {
  themeColor: "#1789c9",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className={`${outfit.variable} ${sourceSans.variable}`}>
      <body className="font-sans antialiased">
        <AuthProvider>
          {children}
          <Toaster position="top-right" />
        </AuthProvider>
      </body>
    </html>
  )
}
