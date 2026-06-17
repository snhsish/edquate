import { Suspense } from "react"
import { KnowledgeSection } from "@/components/space/knowledge-section"
import { Loader2 } from "lucide-react"

export default function SpaceKnowledgePage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <KnowledgeSection />
    </Suspense>
  )
}
