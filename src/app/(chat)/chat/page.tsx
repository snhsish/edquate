import { Mail } from "lucide-react"

export default function ChatPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed bg-background p-8 text-center">
      <Mail className="mb-4 h-12 w-12 text-muted-foreground" />
      <h3 className="mb-2 text-lg font-medium">No chat selected</h3>
      <p className="mb-4 text-sm text-muted-foreground">
        Select a chat from the sidebar to start messaging.
      </p>
    </div>
  )
}
