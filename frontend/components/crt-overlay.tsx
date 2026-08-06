/**
 * Purely decorative CRT treatment: light scanlines plus a soft vignette.
 * Kept subtle so long-form rule text stays readable on content pages.
 */
export function CrtOverlay() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-50">
      <div className="crt-overlay absolute inset-0 opacity-25" />
      <div className="crt-vignette absolute inset-0 opacity-70" />
    </div>
  )
}
