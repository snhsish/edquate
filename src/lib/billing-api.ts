import { API_BASE, getStoredToken } from "@/lib/api"

export type PlanId = "free" | "plus" | "pro"

export type PlanLimits = {
  chat_messages_per_day: number | null
  knowledge_bases_max: number | null
  documents_per_kb_max: number | null
  coding_problems_per_day: number | null
  chat_rpm?: number
  book_gen_rpm?: number
  tools: string[] | "all"
  capabilities: string[] | "all"
  playground_plugins: boolean
  session_history_days: number | null
  pro_only_features?: boolean
}

export type UsageToday = {
  chat_messages: number
  coding_problems: number
  tool_calls: number
}

export type PlanCatalogEntry = {
  id: PlanId
  name: string
  price_inr: number
  price_paise: number
  limits: PlanLimits
}

export type SubscriptionInfo = {
  plan: PlanId | string
  active: boolean
  pro_until: string | null
  paid_until?: string | null
  source: string | null
  days_remaining: number | null
  redeem_days_default: number
  plus_monthly_price_inr: number
  pro_monthly_price_inr: number
  limits?: PlanLimits
  usage_today?: UsageToday
  plan_catalog?: PlanCatalogEntry[]
  upgrade_path?: string
}

export type RedeemResult = {
  ok: boolean
  code: string
  days_granted: number
  plan: string
  pro_until: string | null
  days_remaining: number | null
  message: string
}

export type CheckoutResult = {
  plan_id: string
  amount: number
  currency: string
  description: string
  checkout_endpoint: string
}

export type PricingPlan = {
  id: PlanId
  name: string
  tagline: string
  price: string
  priceDetail: string
  pricePaise: number
  highlighted?: boolean
  badge?: string
  features: string[]
  cta: string
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: "free",
    name: "Free",
    tagline: "Explore Edquate at your own pace",
    price: "\u20B90",
    priceDetail: "forever",
    pricePaise: 0,
    features: [
      "50 tutor messages per day",
      "20 AI requests per minute",
      "1 knowledge base \u00B7 5 documents",
      "5 coding problems per day",
      "Core tools (chat, RAG, web search)",
    ],
    cta: "Current plan",
  },
  {
    id: "plus",
    name: "Plus",
    tagline: "More room to learn every day",
    price: "\u20B9199",
    priceDetail: "per month",
    pricePaise: 19900,
    highlighted: true,
    badge: "Most popular",
    features: [
      "200 tutor messages per day",
      "40 AI requests per minute",
      "3 knowledge bases \u00B7 15 documents each",
      "25 coding problems per day",
      "Book generation & playground plugins",
    ],
    cta: "Upgrade to Plus",
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "Unlimited deep learning",
    price: "\u20B9499",
    priceDetail: "per month",
    pricePaise: 49900,
    features: [
      "Unlimited tutor chat & tool calls",
      "60 AI requests per minute",
      "Unlimited knowledge bases & uploads",
      "Unlimited coding practice",
      "Whiteboard, career tools & priority compute",
    ],
    cta: "Upgrade to Pro",
  },
]

export function planRank(plan: PlanId): number {
  switch (plan) {
    case "pro":
      return 3
    case "plus":
      return 2
    default:
      return 1
  }
}

export function isUpgrade(from: PlanId, to: PlanId): boolean {
  return planRank(to) > planRank(from)
}

export function formatProUntil(iso: string | null | undefined): string {
  if (!iso) return ""
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

export function formatUsageLimit(
  used: number,
  limit: number | null | undefined,
): string {
  if (limit == null) return `${used} / Unlimited`
  return `${used} / ${limit}`
}

function getAuthHeaders(): Record<string, string> {
  const token = getStoredToken()
  const headers: Record<string, string> = { "Content-Type": "application/json" }
  if (token) headers["Authorization"] = `Bearer ${token}`
  return headers
}

async function parseError(response: Response): Promise<string> {
  try {
    const data = await response.json()
    return data.message ?? data.detail ?? data.error ?? `Server error: ${response.status}`
  } catch {
    return `Server error: ${response.status}`
  }
}

async function billingFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = getAuthHeaders()
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...headers, ...(options.headers as Record<string, string>) },
    credentials: "include",
  })
  if (!res.ok) {
    if (res.status === 401) {
      throw new Error("Session expired. Please log in again.")
    }
    throw new Error(await parseError(res))
  }
  return res.json()
}

export async function fetchSubscription(): Promise<SubscriptionInfo> {
  return billingFetch<SubscriptionInfo>("/billing/subscription")
}

export async function redeemCode(code: string): Promise<RedeemResult> {
  return billingFetch<RedeemResult>("/billing/redeem", {
    method: "POST",
    body: JSON.stringify({ code: code.trim() }),
  })
}

export async function startCheckout(planId: PlanId): Promise<CheckoutResult> {
  return billingFetch<CheckoutResult>("/billing/checkout", {
    method: "POST",
    body: JSON.stringify({ plan_id: planId }),
  })
}
