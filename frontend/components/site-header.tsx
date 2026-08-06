"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { LayoutDashboard, Menu } from "lucide-react"

import { SunburstMark } from "@/components/sunburst-mark"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { accentClasses, dataModules } from "@/lib/modules"
import { cn } from "@/lib/utils"

export function SiteHeader() {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 border-b border-hairline bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4">
        <Link href="/" className="group flex items-center gap-3">
          <SunburstMark className="transition-transform group-hover:rotate-15" />
          <span className="flex flex-col">
            <span className="font-heading text-sm leading-none font-semibold tracking-[0.32em] uppercase text-glow">
              Traveller
            </span>
            <span className="console-label mt-1 text-muted-foreground">
              Own Universe · Rules Console
            </span>
          </span>
        </Link>

        <nav className="ml-auto hidden items-center gap-1 md:flex">
          <Link
            href="/"
            aria-current={pathname === "/" ? "page" : undefined}
            className={cn(
              "console-label flex items-center gap-1.5 border border-transparent px-2.5 py-1.5 transition-colors",
              pathname === "/"
                ? "border-ochre/45 bg-ochre/10 text-ochre"
                : "text-muted-foreground hover:border-hairline hover:text-foreground"
            )}
          >
            <LayoutDashboard className="size-3.5" />
            Dashboard
          </Link>
        </nav>

        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetTrigger
            render={
              <Button
                variant="outline"
                size="icon-sm"
                className="ml-auto rounded-none md:ml-0"
                aria-label="Open module index"
              />
            }
          >
            <Menu />
          </SheetTrigger>
          <SheetContent
            side="right"
            className="rounded-none border-hairline bg-background"
          >
            <SheetHeader className="border-b border-hairline">
              <SheetTitle className="font-heading tracking-[0.2em] uppercase">
                Module index
              </SheetTitle>
              <SheetDescription className="console-label">
                {dataModules.length} datasets
              </SheetDescription>
            </SheetHeader>

            <nav className="flex flex-col gap-1 p-3">
              <Link
                href="/"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 border border-hairline px-3 py-2 transition-colors hover:border-ochre/45 hover:bg-ochre/5"
              >
                <LayoutDashboard className="size-4 text-ochre" />
                <span className="font-heading text-sm tracking-wide">
                  Dashboard
                </span>
              </Link>

              {dataModules.map((module) => {
                const Icon = module.icon
                const tone = accentClasses[module.accent]
                const active = pathname === module.href

                return (
                  <Link
                    key={module.id}
                    href={module.href}
                    onClick={() => setMenuOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-3 border px-3 py-2 transition-colors",
                      active
                        ? cn(tone.border, tone.bg)
                        : "border-hairline hover:border-ochre/45 hover:bg-ochre/5"
                    )}
                  >
                    <Icon className={cn("size-4", tone.text)} />
                    <span className="min-w-0 flex-1">
                      <span className="block font-heading text-sm tracking-wide">
                        {module.title}
                      </span>
                      <span className="console-label text-muted-foreground">
                        {module.endpoint}
                      </span>
                    </span>
                    <span className={cn("console-label", tone.text)}>
                      {module.code}
                    </span>
                  </Link>
                )
              })}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}
