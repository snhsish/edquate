"use client"

import Link from "next/link"
import Image from "next/image"
import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  SidebarResizeHandle,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
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
  ChevronDown,
  Flame,
  Crown,
  CreditCard,
} from "lucide-react"
import { NavUser } from "@/components/nav-user"
import {
  fetchGamificationState,
  fetchAchievements,
  type GamificationState,
  type LevelInfo,
} from "@/lib/gamification-api"

const data = {
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
      title: "Billing",
      url: "/billing",
      icon: CreditCard,
    },
  ],
}

export function DefaultSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { theme } = useTheme()
  const [gamification, setGamification] = useState<GamificationState | null>(null)
  const [level, setLevel] = useState<LevelInfo | null>(null)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const [g, a] = await Promise.all([
          fetchGamificationState(),
          fetchAchievements(),
        ])
        if (cancelled) return
        setGamification(g)
        setLevel(a.level)
      } catch {
        // sidebar fetch errors are non-critical
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem className="flex flex-row items-center justify-between group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:gap-2">
            <SidebarMenuButton
              size="lg"
              className="pointer-events-none data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground hover:bg-transparent hover:text-sidebar-foreground"
            >
              <div className="flex aspect-square size-6 items-center justify-center overflow-hidden rounded-lg">
                <Image
                  src={theme === "dark" ? "/icons/edquate-dark.png" : "/icons/edquate-light.png"}
                  alt="Edquate"
                  width={24}
                  height={24}
                  className="size-6 object-contain"
                />
              </div>
            </SidebarMenuButton>
            <SidebarTrigger />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Learn</SidebarGroupLabel>
          <SidebarMenu>
            {data.learn.map((item) => (
              item.collapsible ? (
                <Collapsible
                  key={item.title}
                  asChild
                  className="group/collapsible"
                >
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip={item.title}>
                      <Link href={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuAction>
                        <ChevronDown className="transition-transform group-data-[state=open]/collapsible:rotate-90" />
                        <span className="sr-only">Toggle</span>
                      </SidebarMenuAction>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton asChild>
                            <Link href={item.url}>
                              <span>View all {item.title}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              ) : (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            ))}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Tools</SidebarGroupLabel>
          <SidebarMenu>
            {data.tools.map((item) => (
              item.collapsible ? (
                <Collapsible
                  key={item.title}
                  asChild
                  className="group/collapsible"
                >
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip={item.title}>
                      <Link href={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuAction>
                        <ChevronDown className="transition-transform group-data-[state=open]/collapsible:rotate-90" />
                        <span className="sr-only">Toggle</span>
                      </SidebarMenuAction>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton asChild>
                            <Link href={item.url}>
                              <span>View all {item.title}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              ) : (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            ))}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Progress</SidebarGroupLabel>
          <SidebarMenu>
            {data.progress.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild tooltip={item.title}>
                  <Link href={item.url}>
                    <item.icon />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        {(gamification || level) && (
          <div className="border-t border-border px-2 pt-4 pb-1.5 group-data-[collapsible=icon]:hidden">
            <div className="flex items-center justify-between gap-2 text-xs">
              {level && (
                <div className="flex items-center gap-1.5">
                  <Crown className="size-3.5 text-primary" />
                  <span className="font-semibold text-foreground">Level {level.level}</span>
                </div>
              )}
              {gamification && gamification.streak_current > 0 && (
                <div className="flex items-center gap-1">
                  <Flame className="size-3 text-orange-500" />
                  <span className="font-medium text-foreground">{gamification.streak_current}</span>
                </div>
              )}
            </div>
            {level && (
              <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${level.progress_pct}%` }}
                />
              </div>
            )}
          </div>
        )}
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
      <SidebarResizeHandle />
    </Sidebar>
  )
}
