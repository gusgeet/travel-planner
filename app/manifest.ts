import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Planner for Trips",
    short_name: "Trips Planner",
    description: "Planificador colaborativo de viajes con notificaciones en tiempo real.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#1789c9",
    lang: "es",
    icons: [
      {
        src: "/placeholder-logo.svg",
        sizes: "192x192",
        type: "image/svg+xml",
      },
      {
        src: "/placeholder-logo.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "any maskable",
      },
    ],
  }
}
