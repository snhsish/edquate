"use client"

import { RefreshCw, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface SpaceSectionHeaderProps {
  icon: LucideIcon
  title: string
  description: string
  onRefresh?: () => void
  refreshing?: boolean
  actions?: React.ReactNode
}

export function SpaceSectionHeader({
  icon: Icon,
  title,
  description,
  onRefresh,
  refreshing,
  actions,
}: SpaceSectionHeaderProps) {
  return (
    <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border bg-card">
          <Icon className="h-5 w-5 text-muted-foreground" />
        </div>
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            {title}
          </h2>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {actions}
        {onRefresh ? (
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 rounded-full border bg-card px-4 py-2 text-sm text-muted-foreground transition hover:bg-accent disabled:opacity-50"
          >
            <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
            Refresh
          </button>
        ) : null}
      </div>
    </div>
  )
}
