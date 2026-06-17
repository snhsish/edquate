"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import {
  SidebarInput,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { NavUser } from "@/components/nav-user"
import { listSessions, type Session } from "@/lib/api"
import {
  GraduationCap,
  MessageSquare,
  Pencil,
  Target,
  Bot,
  BookOpen,
  Code,
  LayoutDashboard,
  Rocket,
  Trophy,
  Calendar,
  MoreHorizontal,
  Share2,
  Trash2,
  PencilLine,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const navData = {
  learn: [
    {
      title: "Exam Prep",
      url: "/exam",
      icon: GraduationCap,
    },
    {
      title: "Tutor",
      url: "/tutor",
      icon: Pencil,
      collapsible: true,
    },
    {
      title: "Chat",
      url: "/chat",
      icon: MessageSquare,
      collapsible: true,
    },
    {
      title: "Practise",
      url: "/practise",
      icon: Target,
    },
  ],
  tools: [
    {
      title: "Agents",
      url: "/agents",
      icon: Bot,
      collapsible: true,
    },
    {
      title: "Books",
      url: "/books",
      icon: BookOpen,
      collapsible: true,
    },
    {
      title: "Code Lab",
      url: "/code",
      icon: Code,
    },
  ],
  progress: [
    {
      title: "Dashboard",
      url: "/",
      icon: LayoutDashboard,
    },
    {
      title: "Space",
      url: "/space",
      icon: Rocket,
    },
    {
      title: "Achievements",
      url: "/achievements",
      icon: Trophy,
    },
    {
      title: "Calendar",
      url: "/calendar",
      icon: Calendar,
    },
  ],
}

const allNavItems = [
  ...navData.learn,
  ...navData.tools,
  ...navData.progress,
]

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return "Just now"
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  const diffDay = Math.floor(diffHr / 24)
  if (diffDay === 1) return "Yesterday"
  if (diffDay < 7) return `${diffDay}d ago`
  return date.toLocaleDateString()
}

export function ChatSidebar({ ...props }: React.ComponentProps<"div">) {
  const pathname = usePathname()
  const [chats, setChats] = React.useState<Session[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const { state } = useSidebar()
  const { theme } = useTheme()
  const [search, setSearch] = React.useState("")

  const isFirstLoad = React.useRef(true)

  React.useEffect(() => {
    let cancelled = false
    if (isFirstLoad.current) {
      setIsLoading(true)
    }
    listSessions(50, 0)
      .then((sessions) => {
        if (!cancelled) setChats(sessions)
      })
      .catch(() => {
        if (!cancelled) setChats([])
      })
      .finally(() => {
        if (!cancelled) {
          isFirstLoad.current = false
          setIsLoading(false)
        }
      })
    return () => { cancelled = true }
  }, [pathname])

  const filteredChats = chats.filter((chat) =>
    chat.title.toLowerCase().includes(search.toLowerCase())
  )

  const isExpanded = state === "expanded"
  const activeItem = allNavItems.find((item) => pathname === item.url || (item.url !== "/" && pathname.startsWith(item.url + "/"))) || allNavItems[0]

  return (
    <div className="flex h-full">
      <div className="hidden md:flex h-full w-[calc(var(--sidebar-width-icon)+1px)] flex-col border-r bg-sidebar text-sidebar-foreground px-2 py-3">
        <div className="flex flex-col gap-2">
          <div className="flex aspect-square size-6 items-center justify-center overflow-hidden rounded-lg mx-auto">
            <Image
              src={theme === "dark" ? "/icons/edquate-dark.png" : "/icons/edquate-light.png"}
              alt="Edquate"
              width={24}
              height={24}
              className="size-6 object-contain"
            />
          </div>
        </div>
        <div className="my-2 border-t border-sidebar-border" />
        <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-auto">
          {navData.learn.map((item) => (
            <Tooltip key={item.title}>
              <TooltipTrigger asChild>
                <Link
                  href={item.url}
                  className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground ${activeItem?.title === item.title ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground"}`}
                >
                  <item.icon className="size-4" />
                  <span className="sr-only">{item.title}</span>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" align="center">{item.title}</TooltipContent>
            </Tooltip>
          ))}
          <div className="my-1 border-t border-sidebar-border" />
          {navData.tools.map((item) => (
            <Tooltip key={item.title}>
              <TooltipTrigger asChild>
                <Link
                  href={item.url}
                  className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground ${activeItem?.title === item.title ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground"}`}
                >
                  <item.icon className="size-4" />
                  <span className="sr-only">{item.title}</span>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" align="center">{item.title}</TooltipContent>
            </Tooltip>
          ))}
          <div className="my-1 border-t border-sidebar-border" />
          {navData.progress.map((item) => (
            <Tooltip key={item.title}>
              <TooltipTrigger asChild>
                <Link
                  href={item.url}
                  className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground ${activeItem?.title === item.title ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground"}`}
                >
                  <item.icon className="size-4" />
                  <span className="sr-only">{item.title}</span>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" align="center">{item.title}</TooltipContent>
            </Tooltip>
          ))}
        </div>
        <div className="flex flex-col gap-2">
          <NavUser />
        </div>
      </div>

      {isExpanded && (
        <div className="hidden md:flex flex-col h-full w-80 min-w-0 border-r bg-sidebar text-sidebar-foreground overflow-hidden">
          <div className="flex flex-col gap-2 p-2 shrink-0 border-b">
            <div className="flex w-full items-center justify-between">
              <div className="text-base font-medium text-foreground">
                {activeItem?.title === "Chat" ? "Your Chats" : activeItem?.title}
              </div>
            </div>
            <SidebarInput
              placeholder="Search chats..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        <div className="flex min-h-0 flex-1 flex-col gap-0 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <span className="text-xs text-muted-foreground">Loading chats...</span>
              </div>
            ) : filteredChats.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <span className="text-xs text-muted-foreground">No chats found</span>
              </div>
            ) : (
              filteredChats.map((chat) => (
                <Link
                  key={chat.session_id}
                  href={`/chat/${chat.session_id}`}
                  className="flex items-center justify-between gap-2 border-b px-4 py-3 text-sm last:border-b-0 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                >
                  <div className="flex flex-col min-w-0">
                    <span className="font-medium truncate">{chat.title}</span>
                    <span className="text-xs text-muted-foreground truncate">
                      {formatRelativeTime(chat.updated_at)}
                    </span>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                        onClick={(e) => e.preventDefault()}
                      >
                        <MoreHorizontal className="size-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem onClick={(e) => e.preventDefault()}>
                        <Share2 className="size-4" />
                        Share
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => e.preventDefault()}>
                        <PencilLine className="size-4" />
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => e.preventDefault()} className="text-destructive">
                        <Trash2 className="size-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
