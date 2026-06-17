"use client"

import { useCallback, useEffect, useState } from "react"
import { Bot, Heart } from "lucide-react"
import { cn } from "@/lib/utils"
import { listBots, listSouls } from "@/lib/agent-api"
import { BotsTab } from "@/components/agents/bots-tab"
import { SoulsTab } from "@/components/agents/souls-tab"
import type { AgentsTab, BotInfo, SoulTemplate } from "@/components/agents/types"

export default function AgentsPage() {
  const [activeTab, setActiveTab] = useState<AgentsTab>("bots")
  const [bots, setBots] = useState<BotInfo[]>([])
  const [souls, setSouls] = useState<SoulTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<string | null>(null)

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    window.setTimeout(() => setToast(null), 3000)
  }, [])

  useEffect(() => {
    let cancelled = false
    Promise.all([listBots(), listSouls()])
      .then(([botList, soulList]) => {
        if (!cancelled) {
          setBots(botList)
          setSouls(soulList)
          setLoading(false)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setToast(err instanceof Error ? err.message : "Failed to load agents")
          setTimeout(() => setToast(null), 3000)
          setLoading(false)
        }
      })
    return () => { cancelled = true }
  }, [])

  const reload = useCallback(async () => {
    try {
      const [botList, soulList] = await Promise.all([listBots(), listSouls()])
      setBots(botList)
      setSouls(soulList)
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to load agents")
    }
  }, [showToast])

  const tabs: { id: AgentsTab; label: string; icon: typeof Bot }[] = [
    { id: "bots", label: "Bots", icon: Bot },
    { id: "souls", label: "Souls", icon: Heart },
  ]

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <header className="shrink-0 border-b px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Agents
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Create and manage personalized agents with custom personas.
        </p>
        <div className="mt-4 flex gap-2">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={cn(
                "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition",
                activeTab === id
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
        {activeTab === "bots" ? (
          <BotsTab
            bots={bots}
            souls={souls}
            loading={loading}
            onReload={reload}
            onToast={showToast}
          />
        ) : (
          <SoulsTab souls={souls} onReload={reload} onToast={showToast} />
        )}
      </div>

      {toast ? (
        <div className="pointer-events-none fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full border bg-card px-4 py-2 text-sm text-foreground shadow-lg">
          {toast}
        </div>
      ) : null}
    </div>
  )
}
