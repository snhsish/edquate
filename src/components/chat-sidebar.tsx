"use client"

import * as React from "react"
import Image from "next/image"
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

const chatList = [
  {
    id: "1",
    name: "Alice Smith",
    lastMessage: "Thanks for the update!",
    time: "2m ago",
    unread: 2,
  },
  {
    id: "2",
    name: "Bob Johnson",
    lastMessage: "Let me know when you're free",
    time: "15m ago",
    unread: 0,
  },
  {
    id: "3",
    name: "Emily Davis",
    lastMessage: "Great work on the project",
    time: "1h ago",
    unread: 1,
  },
  {
    id: "4",
    name: "Michael Wilson",
    lastMessage: "Meeting tomorrow at 10 AM",
    time: "3h ago",
    unread: 0,
  },
  {
    id: "5",
    name: "Sarah Brown",
    lastMessage: "I'll send the docs shortly",
    time: "Yesterday",
    unread: 0,
  },
  {
    id: "6",
    name: "David Lee",
    lastMessage: "Can we discuss the new feature?",
    time: "Yesterday",
    unread: 3,
  },
  {
    id: "7",
    name: "Olivia Wilson",
    lastMessage: "Sounds good to me!",
    time: "2 days ago",
    unread: 0,
  },
  {
    id: "8",
    name: "James Martin",
    lastMessage: "Thanks for the help!",
    time: "3 days ago",
    unread: 0,
  },
]

const allNavItems = [
  ...navData.learn,
  ...navData.tools,
  ...navData.progress,
]

export function ChatSidebar({ ...props }: React.ComponentProps<"div">) {
  const pathname = usePathname()
  const [chats] = React.useState(chatList)
  const { state } = useSidebar()
  const { theme } = useTheme()
  const [search, setSearch] = React.useState("")

  const filteredChats = chats.filter((chat) =>
    chat.name.toLowerCase().includes(search.toLowerCase())
  )

  const isExpanded = state === "expanded"
  const activeItem = allNavItems.find((item) => item.url === pathname) || allNavItems[0]

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
                <a
                  href={item.url}
                  className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground ${activeItem?.title === item.title ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground"}`}
                >
                  <item.icon className="size-4" />
                  <span className="sr-only">{item.title}</span>
                </a>
              </TooltipTrigger>
              <TooltipContent side="right" align="center">{item.title}</TooltipContent>
            </Tooltip>
          ))}
          <div className="my-1 border-t border-sidebar-border" />
          {navData.tools.map((item) => (
            <Tooltip key={item.title}>
              <TooltipTrigger asChild>
                <a
                  href={item.url}
                  className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground ${activeItem?.title === item.title ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground"}`}
                >
                  <item.icon className="size-4" />
                  <span className="sr-only">{item.title}</span>
                </a>
              </TooltipTrigger>
              <TooltipContent side="right" align="center">{item.title}</TooltipContent>
            </Tooltip>
          ))}
          <div className="my-1 border-t border-sidebar-border" />
          {navData.progress.map((item) => (
            <Tooltip key={item.title}>
              <TooltipTrigger asChild>
                <a
                  href={item.url}
                  className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground ${activeItem?.title === item.title ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground"}`}
                >
                  <item.icon className="size-4" />
                  <span className="sr-only">{item.title}</span>
                </a>
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
        <div className="hidden md:flex flex-col w-80 min-w-0 border-r bg-sidebar text-sidebar-foreground">
          <div className="flex flex-col gap-2 p-2 shrink-0 border-b">
            <div className="flex w-full items-center justify-between">
              <div className="text-base font-medium text-foreground">
                {activeItem?.title}
              </div>
            </div>
            <SidebarInput
              placeholder="Search chats..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        <div className="flex min-h-0 flex-1 flex-col gap-0 overflow-auto">
            {filteredChats.map((chat) => (
              <a
                key={chat.id}
                href={`/chat/${chat.id}`}
                className="flex items-center justify-between gap-2 border-b px-4 py-3 text-sm last:border-b-0 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
              >
                <div className="flex flex-col min-w-0">
                  <span className="font-medium truncate">{chat.name}</span>
                  <span className="text-xs text-muted-foreground truncate">{chat.time}</span>
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
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
