"use client"

import { CheckIcon } from "lucide-react"
import { PRICING_PLANS, planRank, type PlanId } from "@/lib/billing-api"
import { useState, useEffect, useRef } from "react"
import { fetchSubscription, type SubscriptionInfo } from "@/lib/billing-api"

export default function UpgradePage() {
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const didLoad = useRef(false)

  useEffect(() => {
    if (didLoad.current) return
    didLoad.current = true
    void (async () => {
      try {
        const data = await fetchSubscription()
        setSubscription(data)
      } catch {
        // silent
      } finally {
        setLoading(false)
      }
    })()
  }, [setSubscription])

  const currentPlan = (subscription?.plan ?? "free") as PlanId

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6 p-6">
      <header>
        <div className="mb-1">
          <h1 className="text-lg font-semibold">Choose your plan</h1>
          <p className="text-sm text-muted-foreground">
            Daily quotas and per-minute AI limits scale with your subscription.
          </p>
        </div>
        <div className="mt-2 inline-flex rounded-lg border px-3 py-1 font-mono text-sm">
          Plans in INR
        </div>
      </header>

      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
          {PRICING_PLANS.map((plan) => {
            const isCurrent = currentPlan === plan.id
            const canUpgrade = plan.id !== "free" && planRank(plan.id) > planRank(currentPlan)

            return (
              <div
                key={plan.id}
                className={cn(
                  "relative flex flex-col rounded-xl border p-6 transition-shadow",
                  plan.highlighted
                    ? "border-primary/40 shadow-lg shadow-primary/10"
                    : "border-border shadow-sm",
                )}
              >
                {plan.highlighted ? (
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
                ) : null}

                <div className="mb-4 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-semibold text-foreground">{plan.name}</h3>
                    {plan.badge ? (
                      <span className="rounded-full border border-primary/40 bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                        {plan.badge}
                      </span>
                    ) : null}
                  </div>
                  <p className="text-xs text-muted-foreground">{plan.tagline}</p>
                </div>

                <div className="mb-5 flex items-end gap-1">
                  <span className="text-3xl font-extrabold tracking-tight text-foreground">
                    {plan.price}
                  </span>
                  <span className="pb-1 text-sm text-muted-foreground">{plan.priceDetail}</span>
                </div>

                <ul className="mb-6 flex-1 space-y-2 text-sm text-muted-foreground">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {isCurrent ? (
                  <div className="w-full rounded-lg border border-primary/50 bg-primary/5 py-2 text-center text-sm font-medium text-primary">
                    Current plan
                  </div>
                ) : canUpgrade ? (
                  <a
                    href="/billing"
                    className="w-full rounded-lg bg-primary py-2 text-center text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    {plan.cta}
                  </a>
                ) : (
                  <div className="w-full rounded-lg border bg-muted/30 py-2 text-center text-sm font-medium text-muted-foreground">
                    Included in your plan
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <p className="text-center text-sm text-muted-foreground">
        Need help choosing? Visit the{" "}
        <a href="/billing" className="text-primary underline underline-offset-4">
          billing page
        </a>{" "}
        to manage your subscription.
      </p>
    </div>
  )
}

function cn(...inputs: (string | undefined | null | false)[]) {
  return inputs.filter(Boolean).join(" ")
}
