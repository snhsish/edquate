import { PracticeHubView } from "@/components/practice/PracticeHubView"

export default async function PractisePage({
  searchParams,
}: {
  searchParams: Promise<{ focus?: string; milestone?: string; topic?: string }>
}) {
  const params = await searchParams
  const focus = params.focus as
    | "codelab"
    | "book"
    | "chat"
    | "revision"
    | "quiz"
    | "exam"
    | undefined
  return (
    <PracticeHubView
      focus={focus ?? null}
      milestoneId={params.milestone ?? null}
      initialTopic={params.topic ?? null}
    />
  )
}
