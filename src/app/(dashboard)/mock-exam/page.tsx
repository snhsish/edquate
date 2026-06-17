import { MockExamSession } from "@/components/practice/MockExamSession"

export default async function MockExamPage({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string; milestone?: string }>
}) {
  const params = await searchParams
  return (
    <MockExamSession
      initialTopic={params.topic}
      milestoneId={params.milestone ?? null}
    />
  )
}
