"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { SPACE_ITEMS } from "./space-items"

function isActive(pathname: string, href: string): boolean {
  if (href === "/space") {
    return pathname === "/space"
  }
  return pathname === href || pathname.startsWith(`${href}/`)
}

export default function SpaceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
      <aside className="hidden h-full w-[240px] shrink-0 flex-col border-r bg-card lg:flex">
        <div className="border-b px-5 py-6">
          <h1 className="text-lg font-semibold tracking-tight text-foreground">
            Space
          </h1>
          <p className="mt-1 text-xs leading-snug text-muted-foreground">
            Your personal learning library
          </p>
        </div>

        <nav className="flex-1 space-y-0.5 p-3">
          {SPACE_ITEMS.map(({ href, label, description, icon: Icon }) => {
            const active = isActive(pathname, href)
            return (
              <Link
                key={href}
                href={href}
                title={description}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all",
                  active
                    ? "bg-accent text-foreground"
                    : "text-muted-foreground hover:bg-card hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate font-medium">{label}</span>
              </Link>
            )
          })}
        </nav>
      </aside>

      <nav
        className="shrink-0 border-b bg-card lg:hidden"
        aria-label="Space sections"
      >
        <div className="flex gap-1 overflow-x-auto px-3 py-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {SPACE_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, href)
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "inline-flex shrink-0 items-center gap-2 rounded-full px-3 py-2 text-xs font-medium transition",
                  active
                    ? "bg-accent text-foreground"
                    : "text-muted-foreground hover:bg-card hover:text-foreground",
                )}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                {label}
              </Link>
            )
          })}
        </div>
      </nav>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="mx-auto flex w-full max-w-5xl min-h-0 flex-1 flex-col px-4 pt-6 sm:px-6 sm:pt-8">
          {children}
        </div>
      </div>
    </div>
  )
}
