"use client"

import { useRef, useState, useEffect, useCallback } from "react"
import { Download, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { Itinerary, Destination, DayPlan } from "@/lib/types"

const PALETTE = [
  { bar: "#1a8fcb", light: "#dceef8", text: "#115d87" },
  { bar: "#d4663e", light: "#f8e0d7", text: "#8c3a1f" },
  { bar: "#3d9970", light: "#d6eddf", text: "#255f46" },
  { bar: "#d4a843", light: "#f5ecd0", text: "#8a6d1e" },
  { bar: "#7c5bbf", light: "#e5ddf5", text: "#4c2e8a" },
]

// ── helpers ──────────────────────────────────────────────
function fmtShort(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
  })
}
function fmtDay(d: string) {
  const dt = new Date(d + "T00:00:00")
  const wd = dt.toLocaleDateString("es-ES", { weekday: "short" })
  const rest = dt.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
  })
  return `${wd.charAt(0).toUpperCase() + wd.slice(1)}, ${rest}`
}

// ── Canvas drawing engine ───────────────────────────────
const DPR = 2
const W = 900 // logical width
const PAD = 36
const CONTENT_W = W - PAD * 2

function px(n: number) {
  return n * DPR
}

function drawRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.arcTo(x + w, y, x + w, y + r, r)
  ctx.lineTo(x + w, y + h - r)
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r)
  ctx.lineTo(x + r, y + h)
  ctx.arcTo(x, y + h, x, y + h - r, r)
  ctx.lineTo(x, y + r)
  ctx.arcTo(x, y, x + r, y, r)
  ctx.closePath()
}

function drawCircle(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number
) {
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
}

function textEllipsis(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxW: number
): string {
  if (ctx.measureText(text).width <= maxW) return text
  let t = text
  while (t.length > 1 && ctx.measureText(t + "...").width > maxW) {
    t = t.slice(0, -1)
  }
  return t + "..."
}

function drawItinerary(
  canvas: HTMLCanvasElement,
  it: Itinerary
): void {
  const totalDays = it.destinations.reduce(
    (s, d) => s + d.dayPlans.length,
    0
  )

  // ── Pre-calculate total height ──────────────────────
  // header + timeline bar + ticks
  let totalH = 100

  // per destination section
  for (const dest of it.destinations) {
    totalH += 60 // subheader + gap
    const cols = 3
    const rows = Math.ceil(dest.dayPlans.length / cols)
    for (let row = 0; row < rows; row++) {
      let maxRowH = 80 // min card height
      for (let col = 0; col < cols; col++) {
        const idx = row * cols + col
        if (idx >= dest.dayPlans.length) continue
        const dp = dest.dayPlans[idx]
        const cardH = 40 + Math.max(1, dp.activities.length) * 28 + 12
        if (cardH > maxRowH) maxRowH = cardH
      }
      totalH += maxRowH + 10
    }
    totalH += 20
  }

  totalH += 50 // footer

  canvas.width = px(W)
  canvas.height = px(totalH)
  canvas.style.width = `${W}px`
  canvas.style.height = `${totalH}px`

  const ctx = canvas.getContext("2d")!
  ctx.scale(DPR, DPR)

  // Background
  ctx.fillStyle = "#f8f6f3"
  ctx.fillRect(0, 0, W, totalH)

  let y = PAD

  // ── HEADER ────────────────────────────────────────────
  // Icon circle
  ctx.fillStyle = PALETTE[0].bar
  drawRoundRect(ctx, PAD, y, 38, 38, 8)
  ctx.fill()
  // Plane icon (simple triangle)
  ctx.fillStyle = "#ffffff"
  ctx.font = "bold 18px system-ui"
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.fillText("\u2708", PAD + 19, y + 20)

  ctx.textAlign = "left"
  ctx.textBaseline = "top"
  ctx.fillStyle = "#1e293b"
  ctx.font = "bold 22px system-ui, sans-serif"
  ctx.fillText(it.name, PAD + 50, y + 2)

  ctx.fillStyle = "#64748b"
  ctx.font = "13px system-ui, sans-serif"
  ctx.fillText(
    `${it.destinations.length} destino${it.destinations.length > 1 ? "s" : ""} \u00B7 ${totalDays} dia${totalDays > 1 ? "s" : ""}`,
    PAD + 50,
    y + 26
  )

  y += 56

  // ── HORIZONTAL TIMELINE BAR ────────────────────────────
  const barH = 60
  const barY = y
  const barR = 10
  let barX = PAD

  // Full bar background for rounded clip
  ctx.save()
  drawRoundRect(ctx, PAD, barY, CONTENT_W, barH, barR)
  ctx.clip()

  for (let i = 0; i < it.destinations.length; i++) {
    const dest = it.destinations[i]
    const color = PALETTE[i % PALETTE.length]
    const segW =
      totalDays > 0
        ? (dest.dayPlans.length / totalDays) * CONTENT_W
        : CONTENT_W / it.destinations.length

    ctx.fillStyle = color.bar
    ctx.fillRect(barX, barY, segW, barH)

    const cx = barX + segW / 2

    // Line 1: origin -> destination (two-line layout for readability)
    ctx.fillStyle = "#ffffff"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"

    // Origin
    ctx.font = "11px system-ui, sans-serif"
    const originLabel = textEllipsis(ctx, dest.origin, segW / 2 - 14)
    // Arrow
    const arrowStr = " \u2192 "
    // Destination
    ctx.font = "bold 12px system-ui, sans-serif"
    const destLabel = textEllipsis(ctx, dest.name, segW / 2 - 14)

    // Measure full line to center it
    ctx.font = "11px system-ui, sans-serif"
    const originW = ctx.measureText(originLabel).width
    const arrowW = ctx.measureText(arrowStr).width
    ctx.font = "bold 12px system-ui, sans-serif"
    const destW = ctx.measureText(destLabel).width
    const fullW = originW + arrowW + destW
    const startX = cx - fullW / 2

    // Draw origin
    ctx.font = "11px system-ui, sans-serif"
    ctx.fillStyle = "rgba(255,255,255,0.9)"
    ctx.textAlign = "left"
    ctx.fillText(originLabel, startX, barY + barH / 2 - 10)

    // Draw arrow
    ctx.fillText(arrowStr, startX + originW, barY + barH / 2 - 10)

    // Draw destination (bold)
    ctx.font = "bold 12px system-ui, sans-serif"
    ctx.fillStyle = "#ffffff"
    ctx.fillText(destLabel, startX + originW + arrowW, barY + barH / 2 - 10)

    // Line 2: Date range
    ctx.font = "10px system-ui, sans-serif"
    ctx.fillStyle = "rgba(255,255,255,0.8)"
    ctx.textAlign = "center"
    const dateLabel = `${fmtShort(dest.startDate)} - ${fmtShort(dest.endDate)}`
    ctx.fillText(dateLabel, cx, barY + barH / 2 + 10)

    barX += segW
  }

  ctx.restore()

  // Border around bar
  drawRoundRect(ctx, PAD, barY, CONTENT_W, barH, barR)
  ctx.strokeStyle = "#d4cfc8"
  ctx.lineWidth = 1
  ctx.stroke()

  y += barH + 4

  // ── DAY TICKS ──────────────────────────────────────────
  const tickH = 20
  barX = PAD
  ctx.textAlign = "center"
  ctx.textBaseline = "top"

  for (let i = 0; i < it.destinations.length; i++) {
    const dest = it.destinations[i]
    const color = PALETTE[i % PALETTE.length]
    const segW =
      totalDays > 0
        ? (dest.dayPlans.length / totalDays) * CONTENT_W
        : CONTENT_W / it.destinations.length
    const slotW = segW / dest.dayPlans.length

    for (let di = 0; di < dest.dayPlans.length; di++) {
      const cx = barX + slotW * di + slotW / 2
      // tick line
      ctx.fillStyle = color.bar
      ctx.globalAlpha = 0.4
      ctx.fillRect(cx - 1, y, 2, 6)
      ctx.globalAlpha = 1
      // label
      ctx.fillStyle = color.text
      ctx.font = "500 9px system-ui, sans-serif"
      ctx.fillText(`D${di + 1}`, cx, y + 8)
    }
    barX += segW
  }

  y += tickH + 16

  // ── DESTINATIONS DETAIL ────────────────────────────────
  const cardGap = 10
  const cols = 3
  const cardW = (CONTENT_W - cardGap * (cols - 1)) / cols

  for (let di = 0; di < it.destinations.length; di++) {
    const dest = it.destinations[di]
    const color = PALETTE[di % PALETTE.length]

    // ── Sub-header: origin -> name ──
    // Pin circle
    drawCircle(ctx, PAD + 12, y + 12, 12)
    ctx.fillStyle = color.bar
    ctx.fill()
    ctx.fillStyle = "#ffffff"
    ctx.font = "bold 12px system-ui"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillText("\u25C9", PAD + 12, y + 13)

    ctx.textAlign = "left"
    ctx.textBaseline = "top"
    ctx.fillStyle = "#1e293b"
    ctx.font = "bold 15px system-ui, sans-serif"
    const originText = dest.origin
    const originW = ctx.measureText(originText).width
    ctx.fillText(originText, PAD + 32, y + 5)

    // Arrow
    ctx.fillStyle = color.bar
    ctx.font = "bold 15px system-ui"
    ctx.fillText("\u2192", PAD + 32 + originW + 8, y + 5)
    const arrowW = ctx.measureText("\u2192").width

    ctx.fillStyle = "#1e293b"
    ctx.font = "bold 15px system-ui, sans-serif"
    ctx.fillText(dest.name, PAD + 32 + originW + 8 + arrowW + 8, y + 5)

    // Connection badge
    if (dest.isConnection && dest.connection) {
      const badgeX = PAD + 32 + originW + 8 + arrowW + 8 + ctx.measureText(dest.name).width + 12
      ctx.fillStyle = color.light
      const badgeText = `\u2708 Conexion a ${dest.connection.destination}`
      ctx.font = "600 10px system-ui, sans-serif"
      const bw = ctx.measureText(badgeText).width + 12
      drawRoundRect(ctx, badgeX, y + 4, bw, 18, 4)
      ctx.fill()
      ctx.fillStyle = color.text
      ctx.fillText(badgeText, badgeX + 6, y + 8)
    }

    y += 28

    // Colored line below subheader
    ctx.fillStyle = color.bar
    ctx.fillRect(PAD, y, CONTENT_W, 2)
    y += 12

    // ── Day cards grid ──
    const rows = Math.ceil(dest.dayPlans.length / cols)
    for (let row = 0; row < rows; row++) {
      // Compute max card height in row
      let maxCardH = 80
      for (let col = 0; col < cols; col++) {
        const idx = row * cols + col
        if (idx >= dest.dayPlans.length) continue
        const dp = dest.dayPlans[idx]
        const h = 40 + Math.max(1, dp.activities.length) * 28 + 12
        if (h > maxCardH) maxCardH = h
      }

      for (let col = 0; col < cols; col++) {
        const idx = row * cols + col
        if (idx >= dest.dayPlans.length) continue
        const dp = dest.dayPlans[idx]
        const cx = PAD + col * (cardW + cardGap)

        // Card background
        drawRoundRect(ctx, cx, y, cardW, maxCardH, 8)
        ctx.fillStyle = "#ffffff"
        ctx.fill()
        ctx.strokeStyle = color.light
        ctx.lineWidth = 1
        ctx.stroke()

        // Day number badge
        const badgeCx = cx + 18
        const badgeCy = y + 18
        drawCircle(ctx, badgeCx, badgeCy, 11)
        ctx.fillStyle = color.light
        ctx.fill()
        ctx.strokeStyle = color.bar
        ctx.lineWidth = 2
        ctx.stroke()
        ctx.fillStyle = color.text
        ctx.font = "bold 10px system-ui"
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.fillText(`${idx + 1}`, badgeCx, badgeCy)

        // Day label
        ctx.textAlign = "left"
        ctx.textBaseline = "top"
        ctx.fillStyle = color.text
        ctx.font = "600 11px system-ui, sans-serif"
        ctx.fillText(fmtDay(dp.date), cx + 34, y + 12)

        // Activities
        let ay = y + 36
        if (dp.activities.length === 0) {
          ctx.fillStyle = "#94a3b8"
          ctx.font = "italic 11px system-ui, sans-serif"
          ctx.fillText("Sin actividades", cx + 14, ay)
        } else {
          for (const act of dp.activities) {
            // Color bar
            ctx.fillStyle = color.bar
            ctx.globalAlpha = 0.5
            drawRoundRect(ctx, cx + 12, ay + 1, 3, 16, 1.5)
            ctx.fill()
            ctx.globalAlpha = 1

            // Activity name
            ctx.fillStyle = "#1e293b"
            ctx.font = "600 11px system-ui, sans-serif"
            const actName = textEllipsis(ctx, act.name, cardW - 50)
            ctx.fillText(actName, cx + 22, ay)

            // Time & notes
            let infoX = cx + 22
            if (act.time) {
              ctx.fillStyle = "#64748b"
              ctx.font = "10px system-ui, sans-serif"
              const timeStr = `\u{1F552} ${act.time}`
              ctx.fillText(timeStr, infoX, ay + 14)
              infoX += ctx.measureText(timeStr).width + 10
            }
            if (act.notes) {
              ctx.fillStyle = "#64748b"
              ctx.font = "10px system-ui, sans-serif"
              const noteStr = textEllipsis(ctx, act.notes, cardW - (infoX - cx) - 16)
              ctx.fillText(noteStr, infoX, ay + 14)
            }

            ay += 28
          }
        }
      }

      y += maxCardH + cardGap
    }

    y += 14
  }

  // ── FOOTER ─────────────────────────────────────────────
  ctx.fillStyle = "#d4cfc8"
  ctx.fillRect(PAD, y, CONTENT_W, 1)
  y += 14

  ctx.fillStyle = "#94a3b8"
  ctx.font = "10px system-ui, sans-serif"
  ctx.textAlign = "left"
  ctx.textBaseline = "top"
  ctx.fillText("Generado con Planner for Trips", PAD, y)
  ctx.textAlign = "right"
  ctx.fillText(
    new Date().toLocaleDateString("es-ES", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
    W - PAD,
    y
  )
}

// ── Preview-only HTML component (non-canvas, for the dialog) ──
function PreviewCard({
  dest,
  colorIdx,
}: {
  dest: Destination
  colorIdx: number
}) {
  const color = PALETTE[colorIdx % PALETTE.length]
  return (
    <div style={{ marginBottom: 20 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          paddingBottom: 8,
          borderBottom: `2px solid ${color.bar}`,
          marginBottom: 10,
        }}
      >
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: "50%",
            background: color.bar,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontSize: 12,
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          {"\u25C9"}
        </div>
        <span style={{ fontWeight: 700, fontSize: 15, color: "#1e293b" }}>
          {dest.origin}
        </span>
        <span style={{ color: color.bar, fontWeight: 700 }}>{"\u2192"}</span>
        <span style={{ fontWeight: 700, fontSize: 15, color: "#1e293b" }}>
          {dest.name}
        </span>
        {dest.isConnection && dest.connection && (
          <span
            style={{
              fontSize: 10,
              background: color.light,
              color: color.text,
              padding: "2px 8px",
              borderRadius: 4,
              fontWeight: 600,
            }}
          >
            {"\u2708"} Conexion a {dest.connection.destination}
          </span>
        )}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 8,
        }}
      >
        {dest.dayPlans.map((dp: DayPlan, di: number) => (
          <div
            key={dp.date}
            style={{
              background: "#fff",
              borderRadius: 8,
              border: `1px solid ${color.light}`,
              padding: "8px 10px",
              minHeight: 60,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                marginBottom: 6,
              }}
            >
              <div
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  background: color.light,
                  border: `2px solid ${color.bar}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 9,
                  fontWeight: 700,
                  color: color.text,
                  flexShrink: 0,
                }}
              >
                {di + 1}
              </div>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: color.text,
                }}
              >
                {fmtDay(dp.date)}
              </span>
            </div>
            {dp.activities.length === 0 ? (
              <span
                style={{ fontSize: 11, color: "#94a3b8", fontStyle: "italic" }}
              >
                Sin actividades
              </span>
            ) : (
              dp.activities.map((act) => (
                <div
                  key={act.id}
                  style={{
                    display: "flex",
                    gap: 6,
                    marginBottom: 4,
                    fontSize: 11,
                  }}
                >
                  <div
                    style={{
                      width: 3,
                      minHeight: 14,
                      borderRadius: 2,
                      background: color.bar,
                      opacity: 0.5,
                      flexShrink: 0,
                      marginTop: 2,
                    }}
                  />
                  <div>
                    <div style={{ fontWeight: 600, color: "#1e293b" }}>
                      {act.name}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                        fontSize: 10,
                        color: "#64748b",
                      }}
                    >
                      {act.time && <span>{act.time}</span>}
                      {act.notes && <span>{act.notes}</span>}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main Export Component ─────────────────────────────────
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
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [exporting, setExporting] = useState(false)

  const renderCanvas = useCallback(() => {
    if (!canvasRef.current || !open) return
    drawItinerary(canvasRef.current, itinerary)
  }, [open, itinerary])

  useEffect(() => {
    if (open) {
      // Small delay to ensure canvas is mounted
      const t = setTimeout(renderCanvas, 100)
      return () => clearTimeout(t)
    }
  }, [open, renderCanvas])

  const handleExport = () => {
    if (!canvasRef.current) return
    setExporting(true)
    try {
      const link = document.createElement("a")
      link.download = `${itinerary.name.replace(/\s+/g, "_")}_itinerario.png`
      link.href = canvasRef.current.toDataURL("image/png")
      link.click()
    } finally {
      setExporting(false)
    }
  }

  const totalDays = itinerary.destinations.reduce(
    (s, d) => s + d.dayPlans.length,
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

        <div className="px-4 py-4">
          {/* Hidden canvas for the actual export */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Visual preview using HTML */}
          <div
            style={{
              background: "#f8f6f3",
              padding: 28,
              borderRadius: 10,
              fontFamily: "system-ui, sans-serif",
              minWidth: 650,
            }}
          >
            {/* Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 20,
              }}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 8,
                  background: PALETTE[0].bar,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontSize: 20,
                }}
              >
                {"\u2708"}
              </div>
              <div>
                <h2
                  style={{
                    margin: 0,
                    fontSize: 22,
                    fontWeight: 700,
                    color: "#1e293b",
                  }}
                >
                  {itinerary.name}
                </h2>
                <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>
                  {itinerary.destinations.length} destino
                  {itinerary.destinations.length > 1 ? "s" : ""} &middot;{" "}
                  {totalDays} dia{totalDays > 1 ? "s" : ""}
                </p>
              </div>
            </div>

            {/* Timeline bar */}
            <div style={{ marginBottom: 28 }}>
              <div
              style={{
                display: "flex",
                borderRadius: 10,
                overflow: "hidden",
                border: "1px solid #d4cfc8",
                height: 60,
              }}
              >
                {itinerary.destinations.map((dest, i) => {
                  const color = PALETTE[i % PALETTE.length]
                  const pct =
                    totalDays > 0
                      ? (dest.dayPlans.length / totalDays) * 100
                      : 100 / itinerary.destinations.length
                  return (
                    <div
                      key={dest.id}
                      style={{
                        width: `${pct}%`,
                        background: color.bar,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "4px 6px",
                        overflow: "hidden",
                      }}
                    >
                      <span
                        style={{
                          fontSize: 12,
                          color: "#fff",
                          lineHeight: 1.2,
                          textOverflow: "ellipsis",
                          overflow: "hidden",
                          whiteSpace: "nowrap",
                          maxWidth: "100%",
                          textAlign: "center",
                        }}
                      >
                        <span style={{ opacity: 0.9 }}>{dest.origin}</span>
                        <span style={{ opacity: 0.9 }}>{" \u2192 "}</span>
                        <span style={{ fontWeight: 700 }}>{dest.name}</span>
                      </span>
                      <span
                        style={{
                          fontSize: 10,
                          color: "rgba(255,255,255,0.85)",
                          lineHeight: 1.2,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {fmtShort(dest.startDate)} -{" "}
                        {fmtShort(dest.endDate)}
                      </span>
                    </div>
                  )
                })}
              </div>

              {/* Day ticks */}
              <div style={{ display: "flex", marginTop: 4 }}>
                {itinerary.destinations.map((dest, i) => {
                  const color = PALETTE[i % PALETTE.length]
                  const pct =
                    totalDays > 0
                      ? (dest.dayPlans.length / totalDays) * 100
                      : 100 / itinerary.destinations.length
                  return (
                    <div
                      key={dest.id}
                      style={{
                        width: `${pct}%`,
                        display: "flex",
                        justifyContent: "space-around",
                      }}
                    >
                      {dest.dayPlans.map((_, di) => (
                        <div
                          key={di}
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            flex: 1,
                          }}
                        >
                          <div
                            style={{
                              width: 2,
                              height: 6,
                              background: color.bar,
                              opacity: 0.4,
                            }}
                          />
                          <span
                            style={{
                              fontSize: 9,
                              color: color.text,
                              fontWeight: 500,
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

            {/* Destinations detail */}
            {itinerary.destinations.map((dest, i) => (
              <PreviewCard key={dest.id} dest={dest} colorIdx={i} />
            ))}

            {/* Footer */}
            <div
              style={{
                marginTop: 16,
                paddingTop: 12,
                borderTop: "1px solid #d4cfc8",
                display: "flex",
                justifyContent: "space-between",
                fontSize: 10,
                color: "#94a3b8",
              }}
            >
              <span>Generado con Planner for Trips</span>
              <span>
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
