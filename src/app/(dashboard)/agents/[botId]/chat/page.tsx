import { AgentChatView } from "@/components/agents/agent-chat-view"

export default async function BotChatPage({
  params,
}: {
  params: Promise<{ botId: string }>
}) {
  const { botId } = await params
  return <AgentChatView botId={botId} />
}
