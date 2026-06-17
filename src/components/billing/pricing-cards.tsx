"use client"

import { useState } from "react"
import { CheckIcon, Gift, Loader2 } from "lucide-react"
import { redeemCode, type PlanId, PRICING_PLANS, planRank } from "@/lib/billing-api"

export function PricingCards({
  currentPlan = "free",
}: {
  currentPlan?: PlanId
}) {
  return (
    <section className="space-y-5">
      <div className="mx-auto max-w-xl space-y-3 text-center">
        <div className="flex justify-center">
          <div className="rounded-lg border px-4 py-1 font-mono text-sm">
            Plans in INR
          </div>
        </div>
        <h2 className="text-2xl font-bold tracking-tighter text-foreground md:text-3xl">
          Choose the plan that fits your pace
        </h2>
        <p className="text-sm text-muted-foreground md:text-base">
          Daily quotas and per-minute AI limits scale with your subscription.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {PRICING_PLANS.map((plan) => {
          const isCurrent = currentPlan === plan.id
          const canUpgrade = plan.id !== "free" && planRank(plan.id) > planRank(currentPlan)

          return (
            <div
              key={plan.id}
              className={cn(
                "relative flex flex-col rounded-xl border p-6",
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
                  href={`/billing`}
                  className="w-full rounded-lg bg-primary py-2 text-center text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors inline-block"
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
    </section>
  )
}

export function RedeemCodeCard({ onRedeemed }: { onRedeemed: () => void }) {
  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = code.trim()
    if (!trimmed) return

    setLoading(true)
    setError(null)
    setSuccess(null)
    try {
      const result = await redeemCode(trimmed)
      setSuccess(result.message)
      setCode("")
      onRedeemed()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to redeem code")
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="rounded-xl border p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-medium">Redeem promo code</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Have a promo code? Enter it below to unlock Pro access.
          </p>
        </div>
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <Gift className="h-4 w-4" />
        </span>
      </div>

      <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3 sm:flex-row">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="e.g. EDQUATE7"
          className="flex-1 rounded-xl border bg-transparent px-3 py-2 text-sm text-foreground outline-none focus:border-primary/60"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !code.trim()}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Redeem
        </button>
      </form>

      {error ? (
        <p className="mt-3 text-xs text-destructive">{error}</p>
      ) : null}
      {success ? (
        <p className="mt-3 text-xs text-primary">{success}</p>
      ) : null}
    </section>
  )
}

function cn(...inputs: (string | undefined | null | false)[]) {
  return inputs.filter(Boolean).join(" ")
}
