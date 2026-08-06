/**
 * Purely decorative CRT treatment: scanlines plus a corner vignette, layered
 * above the page but transparent to pointer and screen-reader alike.
 */
export function CrtOverlay() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-50">
      <div className="crt-overlay absolute inset-0 opacity-60" />
      <div className="crt-vignette absolute inset-0" />
    </div>
  )
}
