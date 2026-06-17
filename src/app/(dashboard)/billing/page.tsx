"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { CreditCard, Loader2, Crown, Zap, Sparkles } from "lucide-react"
import {
  fetchSubscription,
  redeemCode,
  formatUsageLimit,
  type SubscriptionInfo,
  type PlanId,
} from "@/lib/billing-api"
import { PricingCards } from "@/components/billing/pricing-cards"

function LoadingState() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center gap-2 text-muted-foreground">
      <Loader2 className="h-5 w-5 animate-spin" />
      <span>Loading billing…</span>
    </div>
  )
}

export default function BillingPage() {
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [code, setCode] = useState("")
  const [redeemLoading, setRedeemLoading] = useState(false)
  const [redeemError, setRedeemError] = useState<string | null>(null)
  const [redeemSuccess, setRedeemSuccess] = useState<string | null>(null)
  const initRef = useRef(false)

  const reload = useCallback(async () => {
    try {
      const data = await fetchSubscription()
      setSubscription(data)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load subscription")
    } finally {
      setLoading(false)
    }
  }, [])

useEffect(() => {
    if (initRef.current) return
    initRef.current = true
    void reload()
  }, [reload])

  if (loading) return <LoadingState />
  const currentPlan = (subscription?.plan ?? "free") as PlanId
  const isPaid = currentPlan === "plus" || currentPlan === "pro"
  const usage = subscription?.usage_today
  const limits = subscription?.limits
  const paidUntil = subscription?.paid_until ?? subscription?.pro_until
  const PlanIcon = currentPlan === "pro" ? Crown : currentPlan === "plus" ? Zap : Sparkles

  async function handleRedeem(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = code.trim()
    if (!trimmed) return
    setRedeemLoading(true)
    setRedeemError(null)
    setRedeemSuccess(null)
    try {
      const result = await redeemCode(trimmed)
      setRedeemSuccess(result.message)
      setCode("")
      await reload()
    } catch (err) {
      setRedeemError(err instanceof Error ? err.message : "Failed to redeem code")
    } finally {
      setRedeemLoading(false)
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6 p-6">
      <header className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border bg-muted/50">
          <CreditCard className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-lg font-semibold">Billing & subscription</h1>
          <p className="text-sm text-muted-foreground">
            Manage your plan, redeem codes, and upgrade
          </p>
        </div>
      </header>

      {error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="space-y-6">
        {subscription ? (
          <section className="rounded-xl border p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-sm font-medium">Current subscription</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  {isPaid
                    ? `You are on the ${currentPlan === "pro" ? "Pro" : "Plus"} plan with expanded limits.`
                    : "Upgrade to Plus or Pro for higher daily quotas and faster AI limits."}
                </p>
              </div>
              <span
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-lg",
                  isPaid ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
                )}
              >
                <PlanIcon className="h-4 w-4" />
              </span>
            </div>

            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Plan</dt>
                <dd className={cn("font-medium", isPaid ? "text-primary" : "text-foreground")}>
                  {currentPlan === "pro" ? "Pro" : currentPlan === "plus" ? "Plus" : "Free"}
                </dd>
              </div>
              {isPaid && paidUntil ? (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Active until</dt>
                  <dd className="text-right text-muted-foreground">
                    {new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(paidUntil))}
                  </dd>
                </div>
              ) : null}
              {subscription.days_remaining != null && isPaid ? (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Days remaining</dt>
                  <dd className="tabular-nums">{subscription.days_remaining}</dd>
                </div>
              ) : null}
              {limits?.chat_rpm ? (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">AI requests / min</dt>
                  <dd className="tabular-nums text-foreground">{limits.chat_rpm}</dd>
                </div>
              ) : null}
            </dl>

            {usage && limits ? (
              <div className="mt-4 border-t pt-4">
                <p className="mb-2 text-xs font-medium text-muted-foreground">Usage today</p>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="rounded-lg border bg-muted/50 px-2 py-2">
                    <p className="text-lg font-bold tabular-nums">
                      {formatUsageLimit(usage.chat_messages, limits.chat_messages_per_day)}
                    </p>
                    <p className="text-muted-foreground">Chat</p>
                  </div>
                  <div className="rounded-lg border bg-muted/50 px-2 py-2">
                    <p className="text-lg font-bold tabular-nums">
                      {formatUsageLimit(usage.coding_problems, limits.coding_problems_per_day)}
                    </p>
                    <p className="text-muted-foreground">Code</p>
                  </div>
                  <div className="rounded-lg border bg-muted/50 px-2 py-2">
                    <p className="text-lg font-bold tabular-nums">{usage.tool_calls}</p>
                    <p className="text-muted-foreground">Tools</p>
                  </div>
                </div>
              </div>
            ) : null}

            {currentPlan !== "pro" ? (
              <p className="mt-4 text-xs text-muted-foreground">
                {currentPlan === "free"
                  ? "Upgrade to Plus (\u20B9199/mo) or Pro (\u20B9499/mo) below."
                  : "Upgrade to Pro (\u20B9499/mo) for unlimited access and Pro-only features."}
              </p>
            ) : null}
          </section>
        ) : null}

        <PricingCards currentPlan={currentPlan} />

        <section className="rounded-xl border p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-sm font-medium">Redeem promo code</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Have a promo code? Enter it below to unlock Pro access.
              </p>
            </div>
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <Sparkles className="h-4 w-4" />
            </span>
          </div>

          <form onSubmit={handleRedeem} className="mt-4 flex flex-col gap-3 sm:flex-row">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. EDQUATE7"
              className="flex-1 rounded-xl border bg-transparent px-3 py-2 text-sm text-foreground outline-none focus:border-primary/60"
              disabled={redeemLoading}
            />
            <button
              type="submit"
              disabled={redeemLoading || !code.trim()}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {redeemLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Redeem
            </button>
          </form>

          {redeemError ? (
            <p className="mt-3 text-xs text-destructive">{redeemError}</p>
          ) : null}
          {redeemSuccess ? (
            <p className="mt-3 text-xs text-primary">{redeemSuccess}</p>
          ) : null}
        </section>
      </div>
    </div>
  )
}

function cn(...inputs: (string | undefined | null | false)[]) {
  return inputs.filter(Boolean).join(" ")
}
