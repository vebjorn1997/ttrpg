"use client"

import Link from "next/link"
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react"
import {
  Orientation,
  defineHex,
  Grid,
  rectangle,
} from "honeycomb-grid"
import { Minus, Plus, Scan, X } from "lucide-react"

import type { StarSystem } from "@/lib/api-types"
import {
  boundsFromCoords,
  parseLocationCoords,
  type HexCoords,
} from "@/lib/hex-location"
import { cn } from "@/lib/utils"

const HEX_SIZE = 42
const MAP_PAD = 18
const FIT_PAD = 0.08
const MIN_VIEW_SPAN = HEX_SIZE * 3
const ZOOM_STEP = 1.25

const Tile = defineHex({
  dimensions: HEX_SIZE,
  orientation: Orientation.POINTY,
  origin: "topLeft",
})

type Camera = { x: number; y: number; w: number; h: number }

type PlacedSystem = {
  system: StarSystem
  coords: HexCoords
  zone: "amber" | "red" | null
}

function travelZone(system: StarSystem): "amber" | "red" | null {
  for (const trait of system.traits) {
    const name = trait.name.toLowerCase()
    if (name.includes("red zone")) return "red"
    if (name.includes("amber zone")) return "amber"
  }
  return null
}

function pointsAttr(corners: { x: number; y: number }[]): string {
  return corners.map(({ x, y }) => `${x},${y}`).join(" ")
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

/** Build a viewBox that shows the whole chart, letterboxed to the viewport aspect. */
function fitCamera(
  contentW: number,
  contentH: number,
  viewportW: number,
  viewportH: number
): Camera {
  const aspect = viewportW / Math.max(viewportH, 1)
  const paddedW = Math.max(contentW, 1) * (1 + FIT_PAD)
  const paddedH = Math.max(contentH, 1) * (1 + FIT_PAD)

  let w: number
  let h: number
  if (paddedW / paddedH > aspect) {
    w = paddedW
    h = w / aspect
  } else {
    h = paddedH
    w = h * aspect
  }

  return {
    x: (contentW - w) / 2,
    y: (contentH - h) / 2,
    w,
    h,
  }
}

type SystemsMapProps = {
  systems: StarSystem[]
}

/**
 * Interactive hex chart of charted worlds. Coordinates come from each system's
 * four-character `location`; honeycomb-grid handles layout math.
 */
export function SystemsMap({ systems }: SystemsMapProps) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const cameraRef = useRef<Camera | null>(null)
  const viewportSizeRef = useRef({ w: 0, h: 0 })
  const dragRef = useRef<{
    pointerId: number
    startX: number
    startY: number
    origin: Camera
    moved: boolean
    systemId: string | null
  } | null>(null)

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [camera, setCamera] = useState<Camera | null>(null)
  const [viewport, setViewport] = useState({ w: 0, h: 0 })

  cameraRef.current = camera
  viewportSizeRef.current = viewport

  const placed = useMemo(() => {
    const byKey = new Map<string, PlacedSystem>()
    for (const system of systems) {
      const coords = parseLocationCoords(system.location)
      if (!coords) continue
      byKey.set(`${coords.col},${coords.row}`, {
        system,
        coords,
        zone: travelZone(system),
      })
    }
    return byKey
  }, [systems])

  const { grid, width, height, occupied, originX, originY } = useMemo(() => {
    const coords = [...placed.values()].map((entry) => entry.coords)
    const bounds = boundsFromCoords(coords, 1)
    const widthCells = bounds.maxCol - bounds.minCol + 1
    const heightCells = bounds.maxRow - bounds.minRow + 1

    const grid = new Grid(
      Tile,
      rectangle({
        width: widthCells,
        height: heightCells,
        start: { col: bounds.minCol, row: bounds.minRow },
      })
    )

    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity
    for (const hex of grid) {
      for (const corner of hex.corners) {
        minX = Math.min(minX, corner.x)
        minY = Math.min(minY, corner.y)
        maxX = Math.max(maxX, corner.x)
        maxY = Math.max(maxY, corner.y)
      }
    }

    if (!Number.isFinite(minX)) {
      minX = 0
      minY = 0
      maxX = 0
      maxY = 0
    }

    return {
      grid,
      originX: minX,
      originY: minY,
      width: maxX - minX + MAP_PAD,
      height: maxY - minY + MAP_PAD,
      occupied: placed.size,
    }
  }, [placed])

  const maxViewSpan = Math.max(width, height) * 2.5

  const applyFit = useCallback(
    (vw: number, vh: number) => {
      if (vw < 1 || vh < 1) return
      setCamera(fitCamera(width, height, vw, vh))
    },
    [width, height]
  )

  useEffect(() => {
    const el = viewportRef.current
    if (!el) return

    const sync = (fit: boolean) => {
      const next = { w: el.clientWidth, h: el.clientHeight }
      const prevSize = viewportSizeRef.current
      setViewport(next)
      viewportSizeRef.current = next
      if (fit || !cameraRef.current) {
        applyFit(next.w, next.h)
        return
      }
      // Keep world-units-per-pixel and center when the pane resizes.
      const prev = cameraRef.current
      const scale = prev.w / Math.max(prevSize.w, 1)
      const cx = prev.x + prev.w / 2
      const cy = prev.y + prev.h / 2
      const w = next.w * scale
      const h = next.h * scale
      setCamera({ x: cx - w / 2, y: cy - h / 2, w, h })
    }

    sync(true)
    const observer = new ResizeObserver(() => sync(false))
    observer.observe(el)
    return () => observer.disconnect()
  }, [applyFit, width, height])

  const zoomAt = useCallback(
    (clientX: number, clientY: number, factor: number) => {
      const el = viewportRef.current
      const cam = cameraRef.current
      if (!el || !cam) return

      const rect = el.getBoundingClientRect()
      const mx = clamp((clientX - rect.left) / Math.max(rect.width, 1), 0, 1)
      const my = clamp((clientY - rect.top) / Math.max(rect.height, 1), 0, 1)
      const worldX = cam.x + mx * cam.w
      const worldY = cam.y + my * cam.h
      const aspect = cam.w / cam.h
      const w = clamp(cam.w * factor, MIN_VIEW_SPAN * aspect, maxViewSpan)
      const h = w / aspect
      setCamera({
        x: worldX - mx * w,
        y: worldY - my * h,
        w,
        h,
      })
    },
    [maxViewSpan]
  )

  const zoomFromCenter = useCallback(
    (factor: number) => {
      const el = viewportRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      zoomAt(rect.left + rect.width / 2, rect.top + rect.height / 2, factor)
    },
    [zoomAt]
  )

  useEffect(() => {
    const el = viewportRef.current
    if (!el) return

    const onWheel = (event: WheelEvent) => {
      event.preventDefault()
      const factor = event.deltaY > 0 ? ZOOM_STEP : 1 / ZOOM_STEP
      zoomAt(event.clientX, event.clientY, factor)
    }

    el.addEventListener("wheel", onWheel, { passive: false })
    return () => el.removeEventListener("wheel", onWheel)
  }, [zoomAt])

  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (!camera || event.button !== 0) return

    const target = event.target
    const systemId =
      target instanceof Element
        ? target.closest("[data-system-id]")?.getAttribute("data-system-id")
        : null

    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      origin: camera,
      moved: false,
      systemId,
    }
  }

  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId || viewport.w < 1) return

    const dx = event.clientX - drag.startX
    const dy = event.clientY - drag.startY
    if (!drag.moved && Math.hypot(dx, dy) > 4) {
      drag.moved = true
      event.currentTarget.setPointerCapture(event.pointerId)
    }
    if (!drag.moved) return

    const scaleX = drag.origin.w / viewport.w
    const scaleY = drag.origin.h / viewport.h
    setCamera({
      ...drag.origin,
      x: drag.origin.x - dx * scaleX,
      y: drag.origin.y - dy * scaleY,
    })
  }

  function onPointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return

    const { moved, systemId } = drag
    dragRef.current = null

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }

    if (!moved && systemId) {
      setSelectedId(systemId)
    }
  }

  const selected = selectedId
    ? [...placed.values()].find((entry) => entry.system.id === selectedId)
    : null

  const zoomPercent =
    camera && viewport.w > 0
      ? Math.round((width / camera.w) * (viewport.w / Math.max(width, 1)) * 100)
      : 100

  return (
    <div
      className={cn(
        "grid h-full min-h-0 gap-4",
        selected ? "lg:grid-cols-[minmax(0,1fr)_17rem]" : "grid-cols-1"
      )}
    >      <div className="relative flex min-h-0 flex-col overflow-hidden border border-hairline bg-[radial-gradient(ellipse_at_center,color-mix(in_oklch,var(--signal)_8%,transparent),transparent_65%),linear-gradient(180deg,color-mix(in_oklch,var(--panel)_90%,black),var(--panel))]">
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-hairline px-3 py-2">
          <p className="console-label text-muted-foreground">
            Hex chart · {String(occupied).padStart(2, "0")} occupied
          </p>
          <div className="flex items-center gap-1">
            <span className="console-label mr-2 hidden text-muted-foreground/70 sm:inline">
              {zoomPercent}% · click world · scroll zoom · drag pan
            </span>
            <button
              type="button"
              aria-label="Zoom out"
              className="inline-flex size-7 items-center justify-center border border-hairline text-muted-foreground transition-colors hover:border-signal/50 hover:text-signal"
              onClick={() => zoomFromCenter(ZOOM_STEP)}
            >
              <Minus aria-hidden className="size-3.5" />
            </button>
            <button
              type="button"
              aria-label="Zoom in"
              className="inline-flex size-7 items-center justify-center border border-hairline text-muted-foreground transition-colors hover:border-signal/50 hover:text-signal"
              onClick={() => zoomFromCenter(1 / ZOOM_STEP)}
            >
              <Plus aria-hidden className="size-3.5" />
            </button>
            <button
              type="button"
              aria-label="Fit all worlds"
              className="inline-flex size-7 items-center justify-center border border-hairline text-muted-foreground transition-colors hover:border-signal/50 hover:text-signal"
              onClick={() => applyFit(viewport.w, viewport.h)}
            >
              <Scan aria-hidden className="size-3.5" />
            </button>
          </div>
        </div>

        <div
          ref={viewportRef}
          className="relative min-h-0 flex-1 touch-none cursor-grab active:cursor-grabbing"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          {camera ? (
            <svg
              role="img"
              aria-label="Star system hex map"
              viewBox={`${camera.x} ${camera.y} ${camera.w} ${camera.h}`}
              className="absolute inset-0 h-full w-full touch-manipulation select-none"
              preserveAspectRatio="xMidYMid meet"
              style={{ userSelect: "none", WebkitUserSelect: "none" }}
            >
              <g
                transform={`translate(${MAP_PAD / 2 - originX} ${MAP_PAD / 2 - originY})`}
              >
                {[...grid].map((hex) => {
                  const key = `${hex.col},${hex.row}`
                  const entry = placed.get(key)
                  const isSelected = entry?.system.id === selectedId
                  const isHovered = entry?.system.id === hoveredId
                  const fill = entry
                    ? entry.zone === "red"
                      ? "color-mix(in oklch, var(--oxide) 28%, var(--card))"
                      : entry.zone === "amber"
                        ? "color-mix(in oklch, var(--ochre) 24%, var(--card))"
                        : "color-mix(in oklch, var(--signal) 18%, var(--card))"
                    : "color-mix(in oklch, var(--card) 55%, transparent)"
                  const stroke = entry
                    ? isSelected || isHovered
                      ? "var(--signal)"
                      : entry.zone === "red"
                        ? "color-mix(in oklch, var(--oxide) 70%, white)"
                        : entry.zone === "amber"
                          ? "color-mix(in oklch, var(--ochre) 70%, white)"
                          : "color-mix(in oklch, var(--signal) 55%, white)"
                    : "var(--hairline)"

                  const labelX = hex.x
                  const labelY = hex.y
                  const corners = pointsAttr(hex.corners)

                  if (!entry) {
                    return (
                      <g key={key}>
                        <polygon
                          points={corners}
                          fill={fill}
                          stroke={stroke}
                          strokeWidth={1}
                        />
                        <text
                          x={labelX}
                          y={labelY}
                          textAnchor="middle"
                          dominantBaseline="central"
                          className="fill-muted-foreground/35"
                          style={{
                            fontSize: 7,
                            fontFamily: "var(--font-terminal)",
                            pointerEvents: "none",
                            userSelect: "none",
                          }}
                        >
                          {String(hex.col).padStart(2, "0")}
                          {String(hex.row).padStart(2, "0")}
                        </text>
                      </g>
                    )
                  }

                  const { system } = entry
                  return (
                    <g key={key} data-system-id={system.id}>
                      <polygon
                        points={corners}
                        fill={fill}
                        stroke={stroke}
                        strokeWidth={isSelected || isHovered ? 2 : 1.25}
                      />
                      <text
                        x={labelX}
                        y={labelY - 10}
                        textAnchor="middle"
                        className="fill-signal"
                        style={{
                          fontSize: 7,
                          fontFamily: "var(--font-terminal)",
                          letterSpacing: "0.12em",
                          pointerEvents: "none",
                          userSelect: "none",
                        }}
                      >
                        {system.location}
                      </text>
                      <text
                        x={labelX}
                        y={labelY + 2}
                        textAnchor="middle"
                        className="fill-foreground"
                        style={{
                          fontSize: 9,
                          fontFamily: "var(--font-display)",
                          fontWeight: 600,
                          pointerEvents: "none",
                          userSelect: "none",
                        }}
                      >
                        {system.name.length > 10
                          ? `${system.name.slice(0, 9)}…`
                          : system.name}
                      </text>
                      <text
                        x={labelX}
                        y={labelY + 13}
                        textAnchor="middle"
                        className="fill-muted-foreground"
                        style={{
                          fontSize: 7,
                          fontFamily: "var(--font-terminal)",
                          pointerEvents: "none",
                          userSelect: "none",
                        }}
                      >
                        TL{system.techLevel} · L{system.lawLevel}
                      </text>
                      {/* Transparent hit target above labels so clicks always hit the hex. */}
                      <polygon
                        points={corners}
                        fill="transparent"
                        stroke="none"
                        className="cursor-pointer"
                        data-system-id={system.id}
                        onMouseEnter={() => setHoveredId(system.id)}
                        onMouseLeave={() =>
                          setHoveredId((current) =>
                            current === system.id ? null : current
                          )
                        }
                      >
                        <title>
                          {system.name} · {system.location}
                        </title>
                      </polygon>
                    </g>
                  )
                })}
              </g>
            </svg>
          ) : null}
        </div>
      </div>

      {selected ? (
        <aside className="min-h-0 overflow-y-auto border border-hairline bg-card/60 p-4 lg:max-h-full">
          <div className="flex items-start justify-between gap-2">
            <p className="console-label text-muted-foreground">Selected hex</p>
            <button
              type="button"
              aria-label="Close dossier panel"
              className="inline-flex size-7 shrink-0 items-center justify-center border border-hairline text-muted-foreground transition-colors hover:border-signal/50 hover:text-signal"
              onClick={() => setSelectedId(null)}
            >
              <X aria-hidden className="size-3.5" />
            </button>
          </div>

          <div className="mt-3 space-y-3">
            <div>
              <p className="font-mono text-sm tracking-[0.18em] text-signal">
                {selected.system.location}
              </p>
              <h2 className="mt-1 font-heading text-xl tracking-wide uppercase">
                {selected.system.name}
              </h2>
            </div>
            <dl className="space-y-1.5 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Tech</dt>
                <dd>
                  TL {selected.system.techLevel}
                  {selected.system.techLevelName
                    ? ` · ${selected.system.techLevelName}`
                    : ""}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Law</dt>
                <dd>
                  {selected.system.lawLevel}
                  {selected.system.lawLevelName
                    ? ` · ${selected.system.lawLevelName}`
                    : ""}
                </dd>
              </div>
              {selected.zone ? (
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Zone</dt>
                  <dd
                    className={cn(
                      selected.zone === "red" ? "text-oxide" : "text-ochre"
                    )}
                  >
                    {selected.zone === "red" ? "Red" : "Amber"}
                  </dd>
                </div>
              ) : null}
            </dl>
            {selected.system.description ? (
              <p className="line-clamp-6 text-sm leading-relaxed text-muted-foreground">
                {selected.system.description}
              </p>
            ) : null}
            <Link
              href={`/systems/${selected.system.id}`}
              className="inline-flex border border-signal/45 bg-signal/10 px-3 py-2 font-heading text-xs tracking-[0.14em] text-signal uppercase transition-colors hover:bg-signal/20"
            >
              Open dossier
            </Link>
          </div>

          <div className="mt-6 space-y-2 border-t border-hairline pt-4">
            <p className="console-label text-muted-foreground">Legend</p>
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              <li className="flex items-center gap-2">
                <span
                  className="size-2.5 border border-signal/60"
                  style={{
                    background:
                      "color-mix(in oklch, var(--signal) 18%, var(--card))",
                  }}
                />
                Charted world
              </li>
              <li className="flex items-center gap-2">
                <span
                  className="size-2.5 border border-ochre/60"
                  style={{
                    background:
                      "color-mix(in oklch, var(--ochre) 24%, var(--card))",
                  }}
                />
                Amber zone
              </li>
              <li className="flex items-center gap-2">
                <span
                  className="size-2.5 border border-oxide/60"
                  style={{
                    background:
                      "color-mix(in oklch, var(--oxide) 28%, var(--card))",
                  }}
                />
                Red zone
              </li>
            </ul>
          </div>
        </aside>
      ) : null}
    </div>
  )
}
