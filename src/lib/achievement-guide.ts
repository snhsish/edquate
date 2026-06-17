export type AchievementTier = "micro" | "streak" | "feature" | "skill" | "legendary"

export type AchievementGuideEntry = {
  badge_id: string
  icon: string
  title: string
  tier: AchievementTier
  rare: boolean
  xp_reward_display: number
  summary: string
  how_to: string[]
  where_to_go: { label: string; href: string }
  pro_tip?: string
}

export type XPSource = {
  action: string
  xp: number
  where: string
  href?: string
}

export const GUIDE_INTRO =
  "Edquate tracks your learning with XP, streaks, and achievements. Small actions count — sending a chat message, solving one problem, or showing up three days in a row all move the needle. Badge XP rewards shown in the catalog are display-only; you earn XP from the activities themselves, not from unlocking a badge."

export const XP_SOURCES: XPSource[] = [
  { action: "Start a chat session", xp: 10, where: "Chat", href: "/chat" },
  { action: "Send a chat message", xp: 15, where: "Chat", href: "/chat" },
  { action: "Solve a Code Lab problem (all tests pass)", xp: 130, where: "Code Lab", href: "/code" },
  { action: "Create a book", xp: 40, where: "Books", href: "/books" },
  { action: "Publish a book", xp: 100, where: "Books (auto on generation complete)", href: "/books" },
  { action: "Create a tutor bot", xp: 35, where: "Agents", href: "/agents" },
  { action: "Create a notebook note", xp: 20, where: "Space / Notebook", href: "/space" },
  { action: "Upload to knowledge base", xp: 25, where: "Knowledge", href: "/space" },
  { action: "Complete a topic quiz (5 MCQs)", xp: 25, where: "Practice", href: "/practise" },
  { action: "Complete a mock exam", xp: 100, where: "Mock exam", href: "/mock-exam" },
  { action: "Complete a daily mission", xp: 30, where: "Dashboard missions (30–75 XP)", href: "/" },
]

export const STREAK_RULES: string[] = [
  "A streak day counts when you earn any XP that UTC calendar day.",
  "Your streak continues if you were active today or yesterday — a grace window so you don't lose it at midnight.",
  "streak_current is your live consecutive-day count; streak_max is your personal best ever.",
  "Streak achievements unlock when your best streak hits 3, 7, or 30 days.",
  "The fire counter on the achievements page works like Snapchat: one number, one flame, no fluff.",
]

export const LEVEL_RULES: string[] = [
  "Levels use a triangular XP curve — each level tier needs more total XP than the last.",
  "Level 1: 0–999 XP total. Level 2: 1,000–2,999. Level 3: 3,000–5,999. Level n needs n x 1,000 cumulative XP for that tier.",
  "Reach Level 10 to unlock the Main Character achievement.",
  "Check your progress bar on the achievements page to see XP into the next level.",
]

export const DAILY_MISSIONS = [
  {
    id: "chat::send_message",
    title: "Drop a message",
    description: "Send any message in Chat",
    reward_xp: 30,
    href: "/chat",
  },
  {
    id: "coding::solve_one",
    title: "Lock in on Code Lab",
    description: "Solve one Code Lab problem today",
    reward_xp: 75,
    href: "/code",
  },
  {
    id: "book::create_or_open",
    title: "Book era check-in",
    description: "Create a book or open an existing one",
    reward_xp: 40,
    href: "/books",
  },
  {
    id: "practice::topic_quiz",
    title: "Complete a topic quiz",
    description: "Finish a 5-question MCQ drill in Practice",
    reward_xp: 40,
    href: "/practise",
  },
] as const

export const ACHIEVEMENT_GUIDE: AchievementGuideEntry[] = [
  {
    badge_id: "first_showed_up",
    icon: "Flame",
    title: "You Actually Showed Up",
    tier: "micro",
    rare: false,
    xp_reward_display: 50,
    summary: "Complete your first learning activity on Edquate.",
    how_to: [
      "Do any one thing that earns XP: start chat, send a message, solve a problem, create a book, bot, note, or upload a file.",
      "The badge unlocks automatically after your first XP event.",
    ],
    where_to_go: { label: "Open Dashboard", href: "/" },
    pro_tip: "Starting a chat session (+10 XP) is the fastest way to get on the board.",
  },
  {
    badge_id: "first_message",
    icon: "MessageCircle",
    title: "First Message Drop",
    tier: "micro",
    rare: false,
    xp_reward_display: 30,
    summary: "Send your first chat message.",
    how_to: [
      "Go to Chat and open or create a session.",
      "Type anything and send — even a hello counts.",
      "You'll earn +15 XP and unlock this badge.",
    ],
    where_to_go: { label: "Go to Chat", href: "/chat" },
    pro_tip: "Ask the tutor a real question — you'll get XP and actual help.",
  },
  {
    badge_id: "first_solve",
    icon: "Bug",
    title: "Bug Slayer",
    tier: "micro",
    rare: false,
    xp_reward_display: 75,
    summary: "Solve your first Code Lab problem.",
    how_to: [
      "Open Code Lab and pick a topic and difficulty.",
      "Write code that passes all hidden tests.",
      "Submit when all tests pass — +130 XP and this badge unlock.",
    ],
    where_to_go: { label: "Open Code Lab", href: "/code" },
    pro_tip: "Use Run to test sample cases before submitting.",
  },
  {
    badge_id: "locked_in",
    icon: "Zap",
    title: "Locked In",
    tier: "streak",
    rare: false,
    xp_reward_display: 80,
    summary: "Maintain a 3-day study streak.",
    how_to: [
      "Earn any XP on three consecutive UTC days.",
      "Your streak counter (fire + number) tracks consecutive days.",
      "Unlocks when your best streak reaches 3.",
    ],
    where_to_go: { label: "View streak", href: "/achievements" },
    pro_tip: "Send one chat message each day — low effort, streak saved.",
  },
  {
    badge_id: "weekender",
    icon: "Star",
    title: "Weekender Warrior",
    tier: "streak",
    rare: false,
    xp_reward_display: 200,
    summary: "Maintain a 7-day study streak.",
    how_to: [
      "Stay active (earn XP) every day for a full week.",
      "The grace rule still applies — yesterday counts if you miss today until end of day.",
      "Unlocks when streak_max hits 7.",
    ],
    where_to_go: { label: "View streak", href: "/achievements" },
    pro_tip: "Complete daily missions for a structured reason to show up each day.",
  },
  {
    badge_id: "no_days_off",
    icon: "Link2",
    title: "No Days Off",
    tier: "streak",
    rare: true,
    xp_reward_display: 600,
    summary: "Maintain a 30-day study streak.",
    how_to: [
      "Earn XP on 30 consecutive UTC days.",
      "This is a rare flex badge — most people unlock it over a month of consistency.",
      "Track progress via streak_max on the achievements page.",
    ],
    where_to_go: { label: "View streak", href: "/achievements" },
    pro_tip: "Set a daily reminder. Even 5 minutes of chat or one code run counts.",
  },
  {
    badge_id: "booktok_energy",
    icon: "BookOpen",
    title: "BookTok Energy",
    tier: "feature",
    rare: false,
    xp_reward_display: 60,
    summary: "Create your first AI book.",
    how_to: [
      "Go to Books and start a new book with a title and topic.",
      "Creating the book awards +40 XP.",
      "The badge unlocks on your first book creation.",
    ],
    where_to_go: { label: "Create a book", href: "/books" },
    pro_tip: "You can generate an outline before committing to full generation.",
  },
  {
    badge_id: "agent_spawner",
    icon: "Bot",
    title: "Agent Spawner",
    tier: "feature",
    rare: false,
    xp_reward_display: 55,
    summary: "Create your first tutor bot.",
    how_to: [
      "Open Agents and create a new tutor bot with a name and persona.",
      "First creation awards +35 XP and unlocks this badge.",
      "Restarting an existing bot does not count.",
    ],
    where_to_go: { label: "Create a bot", href: "/agents" },
    pro_tip: "Pick a soul template to get a strong personality out of the box.",
  },
  {
    badge_id: "notebook_era",
    icon: "FileText",
    title: "Notebook Era",
    tier: "feature",
    rare: false,
    xp_reward_display: 40,
    summary: "Create your first notebook note.",
    how_to: [
      "Create a note with a title and content in your workspace notebook.",
      "First note awards +20 XP.",
      "Badge unlocks automatically.",
    ],
    where_to_go: { label: "Open Space", href: "/space" },
    pro_tip: "Jot down something you learned in chat — instant note material.",
  },
  {
    badge_id: "brain_dump",
    icon: "Brain",
    title: "Brain Dump Complete",
    tier: "feature",
    rare: false,
    xp_reward_display: 45,
    summary: "Upload your first knowledge document.",
    how_to: [
      "Create or open a knowledge base.",
      "Upload a PDF, text, or markdown file.",
      "First upload awards +25 XP and unlocks the badge.",
    ],
    where_to_go: { label: "Open Space", href: "/space" },
    pro_tip: "Upload lecture notes or a syllabus — tutors can reference them later.",
  },
  {
    badge_id: "speedrun_energy",
    icon: "Timer",
    title: "Speedrun Energy",
    tier: "skill",
    rare: false,
    xp_reward_display: 120,
    summary: "Solve a Code Lab problem in under half the time limit.",
    how_to: [
      "Pick a problem and solve it with all tests passing.",
      "Finish in 45% of the time limit: Easy 180s (81s), Medium 150s (67s), Hard 120s (54s).",
      "Badge unlocks on submit when you hit the speed threshold.",
    ],
    where_to_go: { label: "Code Lab", href: "/code" },
    pro_tip: "Start with Easy problems to learn the timing before going for Medium.",
  },
  {
    badge_id: "zero_misses",
    icon: "Crosshair",
    title: "Zero Misses",
    tier: "skill",
    rare: false,
    xp_reward_display: 100,
    summary: "Pass all tests on your first submission.",
    how_to: [
      "Load a Code Lab problem.",
      "Submit once and pass every hidden test — no failed attempts first.",
      "Use Run on sample tests before your first Submit.",
    ],
    where_to_go: { label: "Code Lab", href: "/code" },
    pro_tip: "If you fail and retry, you can still earn XP on the pass — but this badge needs a first-try win.",
  },
  {
    badge_id: "century_club",
    icon: "Award",
    title: "Century Club",
    tier: "skill",
    rare: true,
    xp_reward_display: 500,
    summary: "Solve 100 Code Lab problems.",
    how_to: [
      "Each successful Code Lab submit counts toward the total.",
      "Progress shows on the achievements page before unlock.",
      "100 solves — rare badge, serious grind.",
    ],
    where_to_go: { label: "Code Lab", href: "/code" },
    pro_tip: "Mix topics so you don't burn out on one area.",
  },
  {
    badge_id: "main_character",
    icon: "Crown",
    title: "Main Character",
    tier: "legendary",
    rare: true,
    xp_reward_display: 1000,
    summary: "Reach Level 10.",
    how_to: [
      "Earn XP across chat, Code Lab, books, bots, and daily missions.",
      "Level 10 requires significant total XP under the triangular curve.",
      "Check your level progress bar on the achievements page.",
    ],
    where_to_go: { label: "View level", href: "/achievements" },
    pro_tip: "Code Lab solves (+130) are the fastest XP path for level grinding.",
  },
  {
    badge_id: "chronically_online",
    icon: "Gem",
    title: "Chronically Online",
    tier: "legendary",
    rare: true,
    xp_reward_display: 1500,
    summary: "Earn 25,000 total XP.",
    how_to: [
      "Every XP event adds to your lifetime total.",
      "Progress bar on the Chronically Online card shows how close you are.",
      "Unlocks at 25,000 total XP — endgame flex.",
    ],
    where_to_go: { label: "View XP", href: "/achievements" },
    pro_tip: "Consistency beats cramming — daily missions stack over time.",
  },
  {
    badge_id: "graduated_fr",
    icon: "GraduationCap",
    title: "Graduated (Fr)",
    tier: "legendary",
    rare: true,
    xp_reward_display: 300,
    summary: "Publish a complete AI book.",
    how_to: [
      "Create a book, approve the outline, and run full generation.",
      "When generation completes, status becomes published (+100 XP).",
      "Badge unlocks on first published book.",
    ],
    where_to_go: { label: "Books", href: "/books" },
    pro_tip: "Start with a short outline to finish your first publish faster.",
  },
]

export const TIER_LABELS: Record<AchievementTier, string> = {
  micro: "Micro-wins",
  streak: "Streak grind",
  feature: "Feature flex",
  skill: "Skill flex",
  legendary: "Legendary",
}

export const GUIDE_SECTIONS = [
  { id: "xp", label: "How XP works" },
  { id: "streaks", label: "Streaks" },
  { id: "levels", label: "Levels" },
  { id: "missions", label: "Daily missions" },
  { id: "catalog", label: "All achievements" },
] as const

export function achievementsByTier(tier: AchievementTier): AchievementGuideEntry[] {
  return ACHIEVEMENT_GUIDE.filter((a) => a.tier === tier)
}
