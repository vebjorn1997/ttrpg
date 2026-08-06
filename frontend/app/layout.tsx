import type { Metadata } from "next"
import { Chakra_Petch, JetBrains_Mono } from "next/font/google"

import { CrtOverlay } from "@/components/crt-overlay"
import { ModuleRail } from "@/components/module-rail"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"
import { TooltipProvider } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

import "./globals.css"

const display = Chakra_Petch({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
})

const terminal = JetBrains_Mono({
  variable: "--font-terminal",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: {
    default: "Traveller · Own Universe — Field Manual",
    template: "%s · Traveller Field Manual",
  },
  description:
    "Public field manual for a homebrew Traveller 2e ruleset: actions, conditions, called shots, critical injuries, healing, feats, NPCs and traits.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={cn("dark h-full", display.variable, terminal.variable)}
    >
      <body className="console-grid flex min-h-full flex-col antialiased">
        <TooltipProvider>
          <CrtOverlay />
          <SiteHeader />
          <ModuleRail />
          <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:py-8">
            {children}
          </main>
          <SiteFooter />
        </TooltipProvider>
      </body>
    </html>
  )
}
