export type BookSourceType = "curriculum" | "upload" | "hybrid"

export type BookStatus =
  | "draft"
  | "outlining"
  | "outlining_complete"
  | "generating"
  | "reviewing"
  | "published"
  | "failed"

export interface BookConfig {
  target_audience: "beginner" | "intermediate" | "advanced"
  depth: "overview" | "comprehensive" | "deep-dive"
  include_exercises: boolean
  include_diagrams: boolean
  language: string
  style: "academic" | "conversational" | "tutorial"
  chapters_count: number
  pages_count: number
  source_kb_ids: string[]
  curriculum_topics: string[]
  sources?: BookSourceRefs
}

export interface BookSourceRefs {
  chat_bot_ids?: string[]
  chat_selections?: { bot_id: string; max_messages?: number }[]
  notebook_note_ids?: string[]
  user_intent?: string
}

export interface ExplorationReport {
  summary?: string
  candidate_concepts?: string[]
  queries?: string[]
}

export interface Book {
  id: string
  user_id: string
  title: string
  description: string
  status: BookStatus
  source_type: BookSourceType
  config: BookConfig
  exploration?: ExplorationReport
  created_at: string
  updated_at: string
  published_at?: string
}

export interface OutlineSection {
  id: string
  title: string
  summary: string
  key_points: string[]
  estimated_words: number
}

export interface OutlineChapter {
  id: string
  index: number
  title: string
  summary: string
  sections: OutlineSection[]
  prerequisites: string[]
  learning_goals: string[]
  estimated_words: number
}

export interface BookOutline {
  id: string
  book_id: string
  title: string
  chapters: OutlineChapter[]
  version: number
  status: "draft" | "approved" | "rejected"
  created_at: string
  updated_at: string
}

export interface Chapter {
  id: string
  book_id: string
  index: number
  title: string
  summary: string
  status: string
  word_count: number
  content?: string
  memory_state: string
  created_at: string
  updated_at: string
  completed_at?: string
}

export interface Section {
  id: string
  chapter_id: string
  index: number
  title: string
  content: string
  word_count: number
  status: string
  citations?: Citation[]
}

export interface Citation {
  id: string
  section_id: string
  source_type: string
  source_id: string
  source_title: string
  chunk_ids: string[]
  confidence: number
}

export interface GenerationJob {
  id: string
  book_id: string
  type: string
  status: "queued" | "running" | "completed" | "failed" | "cancelled"
  progress: number
  current_step: string
  error?: string
  payload?: Record<string, unknown>
  result?: Record<string, unknown>
  started_at?: string
  completed_at?: string
  created_at: string
}

export interface ProgressEvent {
  book_id: string
  job_id: string
  chapter?: number
  chapter_id?: string
  status: string
  progress: number
  current_section?: string
  current_step?: string
  message?: string
  content_delta?: string
  stream_content?: string
}

export interface CreateBookRequest {
  title: string
  description?: string
  source_type: BookSourceType
  config: Partial<BookConfig>
}

export interface BookDetail {
  book: Book
  outline: BookOutline | null
  chapters: Chapter[]
  latest_job?: GenerationJob | null
}

export const DEFAULT_BOOK_CONFIG: BookConfig = {
  target_audience: "intermediate",
  depth: "comprehensive",
  include_exercises: true,
  include_diagrams: false,
  language: "en",
  style: "academic",
  chapters_count: 8,
  pages_count: 50,
  source_kb_ids: [],
  curriculum_topics: [],
  sources: {},
}

export interface BookModuleInfo {
  name: string
  version: string
  source_types: BookSourceType[]
  export_formats: string[]
  features: string[]
}

export type BlockType =
  | "text"
  | "heading"
  | "code"
  | "callout"
  | "list"
  | "quote"
  | "quiz"
  | "deep_dive"
  | "section"
  | "citation"
  | "figure"
  | "flash_cards"
  | "timeline"

export interface ContentBlock {
  id: string
  type: BlockType
  level?: number
  content: string
  language?: string
  items?: string[]
  meta?: Record<string, unknown>
}

export interface SourceRef {
  index: number
  id: string
  title: string
  source: string
}

export interface ChapterBlocks {
  chapter_id: string
  title: string
  index: number
  blocks: ContentBlock[]
  sources?: SourceRef[]
}

export type ExportFormat = "markdown" | "html" | "epub" | "docx"

export interface IngestResult {
  document_id: string
  filename: string
  chunk_count: number
  token_estimate: number
  status: string
}
