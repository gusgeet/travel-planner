"use client"

import { useEffect, useState } from "react"
import { Bell, Download } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>
}

export function PwaControls() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    typeof window !== "undefined" && "Notification" in window
      ? Notification.permission
      : "default"
  )

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      setDeferredPrompt(event as BeforeInstallPromptEvent)
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    }
  }, [])

  const requestInstall = async () => {
    if (!deferredPrompt) return

    await deferredPrompt.prompt()
    const choice = await deferredPrompt.userChoice
    if (choice.outcome === "accepted") {
      toast.success("App instalada correctamente")
    }
    setDeferredPrompt(null)
  }

  const requestNotifications = async () => {
    if (!("Notification" in window)) {
      toast.error("Este navegador no soporta notificaciones push")
      return
    }

    const permission = await Notification.requestPermission()
    setNotificationPermission(permission)

    if (permission === "granted") {
      toast.success("Notificaciones activadas")
      return
    }

    toast.warning("No se concedieron permisos de notificaciones")
  }

  return (
    <div className="flex items-center gap-2">
      {deferredPrompt ? (
        <Button
          variant="outline"
          size="sm"
          onClick={requestInstall}
          className="text-foreground bg-transparent"
        >
          <Download className="mr-1.5 h-3.5 w-3.5" />
          <span className="hidden sm:inline">Instalar app</span>
        </Button>
      ) : null}

      <Button
        variant={notificationPermission === "granted" ? "secondary" : "outline"}
        size="sm"
        onClick={requestNotifications}
        className="text-foreground"
      >
        <Bell className="mr-1.5 h-3.5 w-3.5" />
        <span className="hidden sm:inline">
          {notificationPermission === "granted" ? "Notificaciones activas" : "Activar alertas"}
        </span>
      </Button>
    </div>
  )
}
