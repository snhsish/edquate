import {
  BookOpen,
  Brain,
  History,
  LayoutList,
  Library,
  NotebookPen,
  type LucideIcon,
} from "lucide-react"

export type SpaceItemKey =
  | "pulse"
  | "chat_history"
  | "memory"
  | "knowledge"
  | "books"
  | "notebooks"

export interface SpaceItem {
  key: SpaceItemKey
  href: string
  label: string
  description: string
  icon: LucideIcon
}

export const SPACE_ITEMS: SpaceItem[] = [
  {
    key: "pulse",
    href: "/space",
    label: "Activity",
    description: "Recent activity across chats, books, and knowledge.",
    icon: LayoutList,
  },
  {
    key: "chat_history",
    href: "/space/chat-history",
    label: "Chat History",
    description: "Review and reopen previous conversations.",
    icon: History,
  },
  {
    key: "memory",
    href: "/space/memory",
    label: "Memory",
    description: "Your learner graph — journey, strengths, gaps, preferences.",
    icon: Brain,
  },
  {
    key: "knowledge",
    href: "/space/knowledge",
    label: "Knowledge",
    description: "Knowledge bases indexed with HashEmbed and pgvector.",
    icon: Library,
  },
  {
    key: "books",
    href: "/space/books",
    label: "Books",
    description: "Generated books with exploration insights.",
    icon: BookOpen,
  },
  {
    key: "notebooks",
    href: "/space/notebooks",
    label: "Notebooks",
    description: "Saved notes from chat, books, code lab, and agents.",
    icon: NotebookPen,
  },
]
