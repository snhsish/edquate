# Edquate Backend API Documentation

Base URL: `/api/v2`  
Port: `4700` (default)  
Auth: `Authorization: Bearer <jwt>` or `eq_token` cookie or `?token=<jwt>` query param

---

# Authentication Flow

## Auth Provider: Supabase

Supabase handles all user management (signup, login, password reset). The backend proxies auth requests to Supabase's REST API.

## Auth Flow — Step by Step

### 1. Register (`POST /api/v2/auth/register`)
- Frontend sends email + password to backend
- Backend proxies to Supabase `/auth/v1/signup`
- Supabase creates user, may send verification email
- Backend returns `access_token` only if email is already confirmed
- **Your frontend must store:** Nothing yet (user needs to verify email first if `needs_email_verification: true`)

### 2. Login (`POST /api/v2/auth/login`)
- Frontend sends email + password
- Backend proxies to Supabase `/auth/v1/token?grant_type=password`
- On success, backend:
  - **Sets an HttpOnly cookie** named `eq_token` with the JWT (path: `/`, secure, same-site lax, 7-day expiry)
  - **Returns the access_token in the response body**
- **Your frontend must do:**
  - Store the `access_token` from response body in **localStorage** or **memory** (for Bearer header usage)
  - The `eq_token` cookie is set automatically by the browser for same-origin requests

### 3. Authenticating API Requests

You have **3 methods** to authenticate (backend tries them in this order):

| Method | How to send | Where to store token |
|---|---|---|
| **Authorization header** (preferred) | `Authorization: Bearer <jwt>` | localStorage or memory |
| **eq_token cookie** (automatic) | Browser sends it automatically | HttpOnly cookie (set by backend on login) |
| **Query parameter** (for WebSocket) | `wss://host/api/v2/ws?token=<jwt>` | localStorage |

**Recommendation for your frontend:**
```javascript
// After login:
const { access_token } = await response.json();
localStorage.setItem('eq_access_token', access_token);

// On every API call:
fetch('/api/v2/chat/stream', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('eq_access_token')}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ message: "hello" })
});

// For WebSocket:
const ws = new WebSocket(`wss://host/api/v2/ws?token=${localStorage.getItem('eq_access_token')}`);
```

### 4. Checking Auth Status (`GET /api/v2/auth/status`)
- Backend reads `eq_token` cookie to verify if user is logged in
- If cookie is set, it validates the JWT (or falls back to Supabase `/auth/v1/user`)
- Returns authenticated user info
- **Frontend should call this on app load** to restore session from cookie

### 5. Logout (`POST /api/v2/auth/logout`)
- Backend clears the `eq_token` cookie
- **Your frontend must:** Clear `access_token` from localStorage

### 6. JWT Token Details

- **Algorithm:** HMAC (HS256) by default, but Supabase may issue ES256 tokens
- **Validation:** Backend tries local HMAC verification first; if that fails, it calls Supabase `/auth/v1/user` as fallback
- **Claims:** `sub` (user ID), `email`, `role`, `app_metadata.roles`
- **User ID** is extracted from `sub` claim and injected into request context as `user_id`
- **Role** is determined by checking `role` field + `app_metadata.roles` array (hierarchy: student < mentor < moderator < admin < founder)

### 7. User Roles System

| Role | Access |
|---|---|
| `student` | Default. Access to all learning features |
| `mentor` | Mentor dashboard, student management, messaging |
| `recruiter` | Recruiter dashboard, candidate search |
| `moderator` | Read-only admin timeline |
| `admin` | Full admin/ops access |
| `founder` | Top-level access |

### Important Notes for Your Frontend
- **`eq_token` cookie is HttpOnly** — your JS cannot read it, but browser sends it automatically on same-origin requests. This is for SSR/initial page load scenarios.
- **For SPA/CORS** (your separate frontend on a different origin), always use the `Authorization: Bearer` header with the token from localStorage.
- **WebSocket auth** requires `?token=` query param because WebSocket API doesn't support custom headers.
- **Token expiry**: Supabase JWT typically expires after 1 hour. When you get a 401, redirect to login page.
- **No refresh token flow** is implemented on the backend. Your frontend must handle re-login when token expires.

## Auth Endpoints

### `POST /api/v2/auth/login`
**Auth:** None  
**Body:**
```json
{ "email": "string", "password": "string", "device_type": "string", "browser": "string", "os": "string" }
```
**Response:** Sets `eq_token` HttpOnly cookie + returns:
```json
{ "ok": true, "role": "student", "access_token": "jwt..." }
```

### `POST /api/v2/auth/register`
**Auth:** None  
**Body:**
```json
{ "email": "string", "password": "string", "device_type": "string", "browser": "string", "os": "string" }
```
**Response:**
```json
{ "ok": true, "role": "student", "is_first_user": false, "needs_email_verification": false }
```

### `POST /api/v2/auth/logout`
**Auth:** None  
**Response:** Clears `eq_token` cookie + returns `{"ok": true}`

### `GET /api/v2/auth/status`
**Auth:** Optional (reads `eq_token` cookie)  
**Response:**
```json
{
  "enabled": true,
  "authenticated": true,
  "user_id": "uuid",
  "username": "user@email.com",
  "role": "student",
  "display_name": "John"
}
```

---

## Global Middleware (applied automatically)

| Middleware | Effect |
|---|---|
| `RequestID` | Adds X-Request-ID |
| `TraceMiddleware` | OpenTelemetry tracing |
| `RealIP` | Trusts X-Forwarded-For |
| `Logger` | Request logging |
| `Recoverer` | Panic recovery |
| `LoadShed` | Drops requests under high load |
| `CORS` | Allows configured origins |

### Per-endpoint middleware:

- **`auth.RequireAuth`** — JWT verification (Bearer/cookie/query). Supports Supabase JWT (HMAC) + fallback to `/auth/v1/user` endpoint. Extracts `user_id` and `role` into context.
- **`auth.RequireRole("admin", ...)`** — RBAC enforcement
- **`entitlement.Check(feature)`** — Plan-based feature gating
- **`ailimit.PlanAwareLimit("chat", 1min)`** — Per-user rate limiting
- **`bodylimitmw.MaxBytesReader(1MB)`** — Body size limit

### Entitlement Features:
| Feature Key | Gating |
|---|---|
| `ai_chat` | Daily quota check |
| `tutorbot` | Available on all plans (RPM limited) |
| `book_generation` | Plus/Pro plans (RPM limited) |
| `career` | Pro plan required |
| `whiteboard` | Pro plan required |
| `knowledge_base` | Count enforced at create |
| `coding_lab` | Daily quota enforced in handler |
| `practice` | Plan-gated |

---

## 1. Chat (AI Tutor)

**Mount:** `/api/v2/chat`  
**Auth:** `RequireAuth` + `entitlement.Check("ai_chat")` + `ailimit.PlanAwareLimit("chat", 1min)`

### `POST /chat/stream`
**Type:** SSE (Server-Sent Events) stream  
**Request Body:**
```json
{
  "message": "string (required)",
  "session_id": "string|null (optional, auto-generated if omitted)",
  "mode": "string (optional, default: 'deep_learn')",
  "kb_name": "string (optional, for RAG)",
  "enable_rag": "bool (optional, default: false)",
  "memory_facets": ["journey", "strengths", "gaps", "preferences"]
}
```

**Supported Modes:**
| Mode Value | Description |
|---|---|
| `deep_learn` | Deep learning (default) |
| `exam_sprint` | Exam preparation |
| `placement_prep` | Placement/Interview prep |
| `revision_blitz` | Quick revision |
| `practice_mode` | Practice mode |

**SSE Events Received:**
```
event: status     data: {"stage":"analyzing","message":"Analyzing query..."}
event: status     data: {"stage":"retrieval","message":"Searching knowledge base..."}
event: status     data: {"stage":"memory","message":"Loading learner memory..."}
event: stream     data: {"content":"<token text>"}
event: done       data: {}
event: error      data: {"message":"<error text>"}
event: upgrade_required  data: {"feature":"ai_chat","message":"...","code":"..."}
```

**Flow:**
1. Status: Analyzing → RAG retrieval (if enabled) → Memory loading (if facets provided)
2. Fetches last 20 chat messages from session history
3. Ensures session exists + persists user message
4. Sends request to AI Core via gRPC
5. Streams tokens back via SSE
6. Persists assistant response
7. Sends `done` event

---

## 2. TutorBot (Custom AI Bots)

**Mount:** `/api/v2/tutorbot`  
**Auth:** `RequireAuth` + `entitlement.Check("tutorbot")` + `ailimit.PlanAwareLimit("chat", 1min)`

### `GET /tutorbot/`
List all bots for the user.

### `POST /tutorbot/`
Create a new bot or restart an existing one.
```json
{
  "name": "string",
  "description": "string",
  "persona": "string (system prompt)",
  "soul_template_id": "string (optional)",
  "bot_id": "string (send only to restart a stopped bot)",
  "llm_selection": { "model": "string", "provider": "string" }
}
```

### `GET /tutorbot/souls`
List available soul templates.

### `POST /tutorbot/souls`
Create a soul template.
```json
{ "id": "string (optional)", "name": "string", "content": "string" }
```

### `PUT /tutorbot/souls/{soul_id}`
Update a soul template.

### `DELETE /tutorbot/souls/{soul_id}`
Delete a soul template.

### `GET /tutorbot/channels/schema`
Get channel configuration schema.

### `GET /tutorbot/recent`
List recent bot interactions.

### `GET /tutorbot/{bot_id}`
Get bot details. Query: `?include_secrets=true`

### `PATCH /tutorbot/{bot_id}`
Update bot properties. Body: `{ "field": "value", ... }`

### `GET /tutorbot/{bot_id}/files`
List files attached to the bot.

### `PUT /tutorbot/{bot_id}/files/{filename}`
Upload/update a file on the bot.
```json
{ "content": "string" }
```

### `GET /tutorbot/{bot_id}/history`
Get bot conversation history.

### `GET /tutorbot/{bot_id}/ws`
WebSocket endpoint for real-time bot chat.

### `DELETE /tutorbot/{bot_id}`
Stop the bot (pause).

### `DELETE /tutorbot/{bot_id}/destroy`
Permanently delete the bot.

### `POST /tutorbot/{bot_id}/stream`
**Type:** SSE stream  
```json
{ "message": "string" }
```
**SSE Events:** Same as `/chat/stream` — `event: stream`, `event: done`, `event: error`  
**Mode used:** `tutorbot_strict` — uses bot's persona + constraints.

---

## 3. Sessions (Chat Sessions Management)

**Mount:** `/api/v2/sessions`  
**Auth:** `RequireAuth`

### `GET /sessions/`
List sessions for the user. Query: `?limit=50&offset=0`

### `POST /sessions/`
Create a new session.
```json
{ "title": "string (default: 'New chat')", "mode": "string (default: 'deep_learn')" }
```

### `GET /sessions/{session_id}`
Get session details with messages.

### `PATCH /sessions/{session_id}`
Update session title.
```json
{ "title": "string" }
```

### `DELETE /sessions/{session_id}`
Delete session.

### `PATCH /sessions/{session_id}/share`
Toggle sharing.
```json
{ "is_shared": true/false }
```

### `PUT /sessions/{session_id}/branch-selection`
Update branch selections.
```json
{ "selected_branches": { "branch_key": 1 } }
```

### `GET /sessions/public/{session_id}`
Get a shared public session (no auth required).

### `DELETE /sessions/{session_id}/messages/{message_id}`
Delete a specific message.

### `POST /sessions/{session_id}/quiz-results`
Record quiz results (stub).
```json
{ "quiz_id": "string", "score": 0 }
```

**Session Response Format:**
```json
{
  "id": "sess_abc123",
  "session_id": "sess_abc123",
  "title": "Chat title",
  "created_at": "ISO8601",
  "updated_at": "ISO8601",
  "status": "idle",
  "is_shared": false,
  "preferences": { "mode": "deep_learn", "selected_branches": {} },
  "messages": [{ "id": 1, "session_id": "...", "role": "user", "content": "...", "capability": "", "events": [], "attachments": [], "metadata": {}, "created_at": "ISO8601", "parent_message_id": null }],
  "active_turns": []
}
```

---

## 4. Learning Profile

**Mount:** `/api/v2/learning-profile`  
**Auth:** `RequireAuth`

### `GET /learning-profile/`
Get user's learning profile.
```json
{
  "display_name": "string",
  "avatar_url": "string",
  "target_path": "string",
  "goals": ["build_projects", "interview_prep", ...],
  "learning_styles": ["visual", ...],
  "weekly_hours": 10,
  "experience_level": "beginner",
  "diagnostic_completed": true/false,
  "diagnostic_summary": { "score": 0.75, "completed_at": "ISO8601" },
  "profile_image": "url"
}
```

### `PUT /learning-profile/`
Update profile fields. Body: `{ "field": "value", ... }`  
**Requires:** At least one goal if diagnostic is completed.

### `POST /learning-profile/upload-avatar`
Upload avatar (multipart form: `avatar` or `file` field, max 2MB).

---

## 5. Learning Plan / Roadmap

**Mount:** `/api/v2/learning-plan`  
**Auth:** `RequireAuth`

### `GET /learning-plan/`
Get the user's learning plan/roadmap. Returns milestones grouped by phase.

### `PATCH /learning-plan/milestones/{milestoneID}`
Update milestone status.
```json
{ "status": "active|completed|available" }
```

---

## 6. Diagnostic Quiz

**Mount:** `/api/v2/diagnostic`  
**Auth:** `RequireAuth`

### `POST /diagnostic/start`
Start diagnostic quiz. Returns 3 hardcoded questions.

### `POST /diagnostic/finish`
Submit diagnostic answers.
```json
{
  "quiz_id": "diag_default",
  "answers": [{ "question_id": "diag_q1", "answer": "B" }]
}
```
**Response:**
```json
{
  "score": { "correct": 2, "incorrect": 1, "total": 3, "percentage": 66 },
  "awarded_xp": 50,
  "diagnostic_completed": true,
  "diagnostic_summary": { "score": 0.66, "completed_at": "ISO8601" }
}
```
Auto-updates learning profile with diagnostic results.

---

## 7. Practice / Quiz Engine

**Mount:** `/api/v2/practice`  
**Auth:** `RequireAuth`

### `GET /practice/hub`
Get practice hub dashboard. Returns:
- recommended actions
- coding stats (solves today, suggested topic, streak)
- quiz stats (completed today)
- book practice items
- revision due count
- active milestone

### `GET /practice/topics`
List available topics.

### `GET /practice/questions`
Get practice questions. Query params:
- `topic` — topic name
- `difficulty` — `easy|medium|hard|mixed` (default: mixed)
- `limit` — number of questions (default: 5)
- `milestone` — milestone ID
**Response:**
```json
{
  "quiz_id": "quiz_uuid",
  "items": [{ "id": "q_uuid", "question": "...", "options": [{"key":"A","text":"..."}], "difficulty": "medium", "topic": "...", "tags": [] }],
  "generated": true,
  "offline": false,
  "filters": { "topic": "...", "difficulty": "mixed", "limit": 5 }
}
```

### `POST /practice/check`
Check a single answer.
```json
{ "quiz_id": "string", "question_id": "string", "answer": "A" }
```
**Response:**
```json
{ "question_id": "string", "correct": "A", "is_correct": true/false, "explanation": "..." }
```

### `POST /practice/submit`
Submit quiz answers.
```json
{
  "quiz_id": "string",
  "duration_seconds": 120,
  "answers": [{ "question_id": "string", "answer": "A" }]
}
```
**Response:**
```json
{
  "score": { "correct": 4, "incorrect": 1, "total": 5, "percentage": 80 },
  "awarded_xp": 100,
  "events": [{...}]
}
```

### `POST /practice/exam/start`
Start a mock exam.
```json
{ "topic": "string", "difficulty": "mixed", "limit": 10, "timer_sec": 1200 }
```
**Response:**
```json
{
  "quiz_id": "string",
  "items": [...],
  "timer_sec": 1200,
  "expires_at_ms": 1234567890,
  "question_count": 10,
  "topic": "...",
  "offline": false,
  "generated": true
}
```

### `POST /practice/exam/submit`
Submit mock exam.
```json
{
  "quiz_id": "string",
  "duration_seconds": 900,
  "answers": [{ "question_id": "string", "answer": "A" }]
}
```
**Response:** Includes full `review` array with explanations.

### `POST /practice/book-session/complete`
Submit book practice session results.
```json
{ "book_id": "string", "total": 10, "good": 5, "easy": 3, "score_pct": 80 }
```

---

## 8. Book Generation

**Mount:** `/api/v2/book`  
**Auth:** `RequireAuth` + `entitlement.Check("book_generation")` + `ailimit.PlanAwareLimit("book_gen", 1min)`

### `GET /book/modules`
Get available curriculum modules.

### `GET /book/`
List user's books.

### `POST /book/`
Create a new book.
```json
{ "title": "string", "description": "string (optional)", "source_type": "curriculum|upload", "config": {} }
```

### `GET /book/{bookID}`
Get book details.

### `GET /book/{bookID}/detail`
Get detailed book info with outline, chapters.

### `POST /book/{bookID}/outline/generate`
Start outline generation. Returns job.

### `GET /book/{bookID}/outline`
Get current outline.

### `PUT /book/{bookID}/outline/approve`
Approve outline with custom chapters.
```json
{ "chapters": [{ "title": "string", "description": "string", "topics": ["string"] }] }
```

### `POST /book/{bookID}/generate`
Start full book generation. Returns job.

### `GET /book/{bookID}/progress`
Get generation progress.

### `GET /book/{bookID}/stream`
SSE stream for real-time generation progress.

### `GET /book/{bookID}/chapters/{chapterID}`
Get chapter with sections.

### `GET /book/{bookID}/chapters/{chapterID}/blocks`
Get chapter practice blocks (quizzes, flashcards).

### `POST /book/{bookID}/chapters/{chapterID}/regenerate`
Regenerate a chapter. Returns job.

### `POST /book/{bookID}/ingest`
Upload document for book (multipart form), `file` field, max 50MB.

### `GET /book/{bookID}/export/{format}`
Export book. Formats: `markdown|md|html|epub|docx`.

### `GET /book/{bookID}/jobs/{jobID}`
Get job status.

### `POST /book/{bookID}/jobs/{jobID}/retry`
Retry a failed job.

---

## 9. Knowledge Base (RAG)

**Mount:** `/api/v2/knowledge`  
**Auth:** `RequireAuth`

### `GET /knowledge/` or `/knowledge/list`
List knowledge bases for the user.

### `GET /knowledge/rag-providers`
List available RAG providers.

### `GET /knowledge/supported-file-types`
Returns supported file extensions and limits.
```json
{ "extensions": [".pdf",".txt",".md",".docx"], "max_file_size_bytes": 104857600 }
```

### `POST /knowledge/create`
Create KB with multipart form (`name` + `files`).

### `POST /knowledge/`
Create KB with JSON.
```json
{ "name": "string", "description": "string" }
```

### `PUT /knowledge/default/{name}`
Set default knowledge base.

### `GET /knowledge/{name}/files`
List files in KB.

### `GET /knowledge/{name}/files/*`
Redirect to signed file URL.

### `POST /knowledge/{name}/upload`
Upload files to KB (multipart form, `files` field).

### `POST /knowledge/{name}/search`
Search KB.
```json
{ "query": "string", "limit": 5 }
```
**Response:**
```json
{ "chunks": [{ "id": "uuid", "content": "...", "summary": "...", "keywords": [], "source_page": 1, "book_id": null }] }
```

### `POST /knowledge/{name}/reindex`
Trigger reindex of KB.

### `DELETE /knowledge/{name}`
Delete a knowledge base.

### `POST /knowledge/{kb_id}/documents`
Upload document (legacy route). Multipart form with `document` or `files` field.

### `DELETE /knowledge/{kb_id}/documents/{doc_id}`
Delete a document from KB.

---

## 10. Code Lab (Coding Practice)

**Mount:** `/api/v2/coding-practice`  
**Auth:** `RequireAuth` + `entitlement.Check("coding_lab")`

### `GET /coding-practice/toolchains`
Get available language toolchains and their status.

### `GET /coding-practice/problem`
Get a coding problem. Query params:
- `topic` — topic name
- `difficulty` — `easy|medium|hard`
- `language` — `python|javascript|go|java|ruby|cpp` (default: python)
- `nonce` — refresh nonce to get a new problem

**Response:**
```json
{
  "problem_id": "uuid",
  "title": "Two Sum",
  "description": "...",
  "difficulty": "medium",
  "topic": "arrays",
  "language": "python",
  "starter_code": "def solve():",
  "entrypoint": "solve",
  "test_count": 5,
  "tier": "default"
}
```

### `POST /coding-practice/run`
Run code against sample test cases.
```json
{ "problem_id": "uuid", "code": "def solve(): ..." }
```

### `POST /coding-practice/submit`
Submit final solution.
```json
{ "problem_id": "uuid", "code": "def solve(): ...", "solve_seconds": 120, "submit_attempt": 1 }
```
**Response:**
```json
{ "all_passed": true, "awarded_xp": 130, "tests": [...], "streak_current": 3, "total_xp": 2500, "newly_unlocked": [...] }
```

### `GET /coding-practice/exam/status`
Get proctoring status.

### `POST /coding-practice/exam/start`
Start proctored exam.
```json
{ "problem_id": "uuid" }
```

### `POST /coding-practice/exam/violation`
Record proctoring violation.
```json
{ "session_id": "uuid", "reason": "tab_hidden|fullscreen_exit|window_blur|navigation_attempt|copy_attempt|paste_attempt|context_menu|devtools_hotkey|selection_blocked" }
```

### `POST /coding-practice/exam/end`
End proctored exam.
```json
{ "session_id": "uuid", "submitted": true/false }
```

---

## 11. Gamification

**Mount:** `/api/v2/gamification`  
**Auth:** `RequireAuth`

### `GET /gamification/achievements`
Get achievements and badges status.

### `POST /gamification/achievements/{id}/claim`
Claim a specific badge/achievement.

### `GET /gamification/leaderboard`
Get leaderboard (currently shows self only).

### `GET /gamification/state`
Get full gamification state (XP, level, streak).

### `GET /gamification/xp-history`
Get XP history. Query: `?limit=20`

### `GET /gamification/missions/today`
Get today's missions.

### `POST /gamification/missions/{id}/complete`
Mark a mission as complete.

### `POST /gamification/award`
Manually award XP (for custom actions).
```json
{ "action": "string", "xp": 100, "source": "string (optional)", "metadata": {} }
```

### `GET /gamification/badges`
Get all badges with unlock status.

---

## 12. Learner -> Mentor Messaging

**Mount:** `/api/v2/learner`  
**Auth:** `RequireAuth`

### `GET /learner/mentor/unread`
Get unread mentor message count.

### `GET /learner/mentor/thread`
Get mentor conversation thread. Query: `?mentor_id=string`

### `POST /learner/mentor/thread/reply`
Reply to mentor.
```json
{ "body": "string", "mentor_id": "string" }
```

---

## 13. Mentor Dashboard

**Mount:** `/api/mentor/me` (self profile) + `/api/mentors/` (directory) + `/api/v2/mentor` (routes)

### Self Profile (`/api/mentor` mount at `/api/mentor`)

| Method | Route | Auth |
|---|---|---|
| GET/PATCH | `/api/mentor/me` | RequireAuth + role(mentor, admin) |
| PATCH | `/api/mentor/status` | RequireAuth + role(mentor, admin) |
| PATCH | `/api/mentor/presence` | RequireAuth + role(mentor, admin) |
| PATCH | `/api/mentor/availability` | RequireAuth + role(mentor, admin) |
| POST | `/api/mentor/upload-avatar` | RequireAuth + role(mentor, admin) |
| GET | `/api/mentor/sessions` | RequireAuth + role(mentor, admin) |
| PATCH | `/api/mentor/sessions/{id}` | RequireAuth + role(mentor, admin) |

### Mentor Dashboard (`/api/v2/mentor`)

| Method | Route | Auth |
|---|---|---|
| GET | `/api/v2/mentor/dashboard/summary` | RequireAuth + role(mentor, admin) |
| GET | `/api/v2/mentor/students` | RequireAuth + role(mentor, admin) |
| GET | `/api/v2/mentor/assignments` | RequireAuth + role(mentor, admin) |
| PUT | `/api/v2/mentor/assignments` | RequireAuth + role(mentor, admin) |
| POST | `/api/v2/mentor/assignments/{student_id}` | RequireAuth + role(mentor, admin) |
| DELETE | `/api/v2/mentor/assignments/{student_id}` | RequireAuth + role(mentor, admin) |
| GET | `/api/v2/mentor/assignments/candidates` | RequireAuth + role(mentor, admin) |
| GET | `/api/v2/mentor/students/{student_id}/snapshot` | RequireAuth + role(mentor, admin) |
| GET | `/api/v2/mentor/interventions` | RequireAuth + role(mentor, admin) |
| GET | `/api/v2/mentor/analytics/cohort` | RequireAuth + role(mentor, admin) |
| GET | `/api/v2/mentor/messages/ws` | RequireAuth + role(mentor, admin) |
| GET | `/api/v2/mentor/messages/threads` | RequireAuth + role(mentor, admin) |
| GET | `/api/v2/mentor/messages/{student_id}` | RequireAuth + role(mentor, admin) |
| POST | `/api/v2/mentor/messages/{student_id}` | RequireAuth + role(mentor, admin) |
| GET | `/api/v2/mentor/notes` | RequireAuth + role(mentor, admin) |
| GET | `/api/v2/mentor/notes/{student_id}` | RequireAuth + role(mentor, admin) |
| POST | `/api/v2/mentor/notes/{student_id}` | RequireAuth + role(mentor, admin) |

### Mentor Directory (`/api/mentors`)

| Method | Route | Auth |
|---|---|---|
| GET | `/api/mentors/` | RequireAuth |
| GET | `/api/mentors/online` | RequireAuth |
| GET | `/api/mentors/{id}` | RequireAuth |
| PATCH | `/api/mentors/status` | RequireAuth |
| PATCH | `/api/mentors/profile` | RequireAuth |
| POST | `/api/mentors/book-session` | RequireAuth |
| POST | `/api/mentors/contact` | RequireAuth |

---

## 14. Recruiter

**Mount:** `/api/v2/recruiter`  
**Auth:** `RequireAuth` + `role(recruiter, admin)`

### `GET /recruiter/dashboard/summary`
### `GET /recruiter/candidates/search`
Query: `?q=string&limit=20`
### `GET /recruiter/candidates/{candidate_id}/detail`
### `POST /recruiter/candidates/compare`
Body: `{ "candidate_ids": ["string"] }`
### `POST /recruiter/candidates/{candidate_id}/bookmark/toggle`
### `POST /recruiter/candidates/{candidate_id}/shortlist/toggle`
### `POST /recruiter/candidates/{candidate_id}/notes`
### `PUT /recruiter/candidates/{candidate_id}/tags`
### `GET /recruiter/bookmarks`
### `GET /recruiter/shortlist`
### `GET /recruiter/saved-searches`
### `POST /recruiter/saved-searches`
### `DELETE /recruiter/saved-searches/{id}`
### `GET /recruiter/profile/me`
### `PATCH /recruiter/profile/me`

---

## 15. Billing / Subscription

**Mount:** `/api/v2/billing`  
**Auth:** `RequireAuth` (except webhook)

### `GET /billing/subscription`
Get subscription info.

### `POST /billing/redeem`
Redeem promo code.
```json
{ "code": "string" }
```

### `POST /billing/checkout`
Initiate checkout.
```json
{ "plan_id": "pro|plus" }
```
**Response:** Returns Razorpay order details.

### `POST /billing/webhook`
Public Stripe/Razorpay webhook endpoint.

---

## 16. Payments

**Mount:** `/api/v2/payments`  
**Auth:** `RequireAuth` + body limit 1MB

(Razorpay integration - details in `internal/modules/payments/`)

---

## 17. Notifications

**Mount:** `/api/v2/notifications`  
**Auth:** `RequireAuth`

### `GET /notifications/`
List notifications with `counts.total`, `counts.unread`.

### `POST /notifications/mark-all-read`
Mark all as read.

### `POST /notifications/{id}/read`
Mark one notification as read.

### `DELETE /notifications/{id}`
Dismiss notification.

---

## 18. Space (Activity Feed)

**Mount:** `/api/v2/space`  
**Auth:** `RequireAuth`

### `GET /space/feed`
Get activity feed. Query: `?limit=20`

### `GET /space/stats`
Get user stats.

### `GET /space/search`
Search across user's workspace. Query: `?q=string&limit=20`

---

## 19. Memory (Learner Memory Store)

**Mount:** `/api/v2/memory`  
**Auth:** `RequireAuth`

### `GET /memory/`
Get full memory snapshot (journey, strengths, gaps, preferences).

### `PUT /memory/{facet}`
Update a facet.
```json
{ "content": { "key": "value" } }
```
Facets: `journey`, `strengths`, `gaps`, `preferences`

### `DELETE /memory/{facet}`
Clear a facet.

### `POST /memory/consolidate`
AI-powered memory consolidation (uses AI Core).

---

## 20. Tutor (Adaptive Engine)

**Mount:** `/api/v2/tutor`  
**Auth:** `RequireAuth`

### `POST /tutor/recommendations/dismiss`
```json
{ "id": "string" }
```
### `POST /tutor/recommendations/click`
```json
{ "id": "string", "kind": "string" }
```
### `POST /tutor/adaptive/metrics`
```json
{ "name": "string", "labels": { "key": "value" } }
```
### `GET /tutor/continuity`
Get continuity snapshot (roadmap progress, weak topics, adaptive data). Query: `?language=en`

---

## 21. Skills

**Mount:** `/api/v2/skills`  
**Auth:** `RequireAuth`

### `GET /skills/list`
### `POST /skills/create`
```json
{ "name": "string", "description": "string", "category": "string" }
```
### `GET /skills/{name}`
### `POST /skills/tags/list`
### `POST /skills/tags/create`
```json
{ "name": "string" }
```
### `GET /skills/tags/{name}`

---

## 22. Model Routing

**Mount:** `/api/v2/model-routing`  
**Auth:** `RequireAuth`

### `GET /model-routing/catalog`
Get available AI models catalog.

### `GET /model-routing/feature-surfaces`
Get feature-to-model mappings.

---

## 23. Workflow / Journey

**Mount:** `/api/v2/workflow`  
**Auth:** `RequireAuth`

### `GET /workflow/journey`
Get full learning journey (profile, plan, milestones, topic mastery, gamification, next action).

### `GET /workflow/next`
Get recommended next action.

---

## 24. Notebook

**Mount:** `/api/v2/notebook`  
**Auth:** `RequireAuth`

### `GET /notebook/`
List notes.
### `POST /notebook/`
Create note.
```json
{ "title": "string", "content": "string", "source_type": "manual|chat|book|code_lab|agent", "source_id": "string" }
```
### `PUT /notebook/{noteID}`
Update note.
```json
{ "title": "string", "content": "string" }
```
### `DELETE /notebook/{noteID}`
Delete note.

---

## 25. Revision (Spaced Repetition)

**Mount:** `/api/v2/revision`  
**Auth:** `RequireAuth`

### `GET /revision/queue`
Get due revision cards. Query: `?limit=20`

### `POST /revision/review`
Submit card review.
```json
{ "card_id": "string", "grade": "again|good|easy" }
```

---

## 26. Career Intelligence

**Mount:** `/api/v2/career`  
**Auth:** `RequireAuth` + `entitlement.Check("career")`

### `GET /career/intelligence`
Get career intelligence for the user.

### `GET /career/paths`
List available career paths.

### `GET /career/paths/{path_id}`
Get detailed career path info.

---

## 27. Admin / Metrics

**Mount:** `/api/v2/admin`  
**Auth:** `RequireAuth` + `role(admin, founder)` or `role(moderator)`

### `GET /admin/metrics/stream`
SSE stream of live metrics.

### `GET /admin/metrics/snapshot`
Get current metrics snapshot.

### `GET /admin/metrics/history`
Query: `?limit=48`

### `GET /admin/flags`
List feature flags.

### `PUT /admin/flags`
Set a feature flag.
```json
{ "key": "string", "enabled": true/false }
```
Available flags: `sys:mode:emergency`, `sys:disable:deep_learn`

### `GET /admin/timeline`
Search telemetry timeline. Query: `?q=string&limit=100`

### `GET /admin/timeline/read`
Same as timeline, accessible by moderator+.

### `GET /admin/traces/{requestID}`
Get trace details for a request.

### `GET /admin/traces/failed/list`
List failed traces. Query: `?limit=50`

### `GET /admin/education/heatmap`
Get education heatmap data.

---

## 28. Operator Console

**Mount:** `/api/v2/console`  
**Auth:** Password-protected (session cookie)

### `GET /console/status`
Check console availability and auth status.

### `POST /console/login`
```json
{ "password": "string" }
```
### `POST /console/logout`
### `GET /console/promo`
List promo codes.
### `POST /console/promo`
Create promo codes.
```json
{ "count": 1, "plan": "pro", "duration_days": 7, "max_redemptions": 1, "prefix": "string", "label": "string" }
```
### `GET /console/registrations`
List auth events. Query: `?limit=100&event_type=register&q=string`
### `GET /console/users/banned`
### `POST /console/users/{userID}/ban`
```json
{ "reason": "string" }
```
### `DELETE /console/users/{userID}/ban`
### `DELETE /console/users/{userID}`
### `GET /console/system`
System snapshot.
### `GET /console/metrics/stream`
SSE metrics stream.
### `GET /console/keys`
Get AI provider key quotas.
### `PUT /console/keys/{accountID}`
Set key control.
```json
{ "disabled": true/false, "weight": 1 }
```
### `POST /console/keys/balance`
Balance key load.

---

## 29. Unified WebSocket (`/api/v2/ws`)

**Mount:** `/api/v2/ws`  
**Auth:** `RequireAuth`

Single WebSocket endpoint for real-time AI chat. Supports message types:

### Client -> Server messages:
```json
{ "type": "start_turn", "content": "string", "session_id": "string (optional)", "mode": "string (optional)", "capability": "string (optional)", "parent_message_id": 123 }
{ "type": "message", "content": "string", ... }  // same as start_turn
{ "type": "cancel_turn", "turn_id": "string" }
{ "type": "subscribe_turn", "turn_id": "string", "after_seq": 0 }
{ "type": "resume_from", "turn_id": "string", "seq": 0 }
{ "type": "ping" }
```

### Server -> Client events:
```
type: "stage_start"    stage: "reasoning"       content: "Analyzing request..."
type: "content"        stage: "generation"      content: "<token>"
type: "stage_end"      stage: "generation"      content: ""
type: "result"         stage: "complete"        content: "<full response>"
type: "session"        source: "server"         metadata: {session_id, turn_id}
type: "session_meta"   metadata: {title}
type: "error"          content: "<error>"
type: "done"           metadata: {status: "completed|failed"}
type: "pong"
```

Each event includes: `turn_id`, `seq`, `timestamp`, `source: "orchestrator"|"server"`

---

## 30. Health & Readiness

### `GET /health`
Always returns `{"status":"ok"}`

### `GET /ready`
Checks Postgres, Redis, MongoDB connectivity. Returns 200 or 503.
```json
{ "status": "ready|not_ready", "dependencies": [{ "name": "postgres", "ok": true, "ms": 5 }] }
```

---

# System Architecture & Workflows

## Overall Architecture

```
Frontend (your new app)  <--HTTP/SSE/WS-->  Main Backend (:4700)  <--gRPC-->  AI Core (:9107)
                                                |                      |
                                          Postgres/Redis/Mongo      Redis/Mongo
```

**Databases:**
- **PostgreSQL** — User profiles, sessions, books, KBase docs, gamification, billing
- **Redis (DB 0)** — Main cache + PubSub for WebSocket
- **Redis (DB 1)** — AI Core cache, quotas, feature flags
- **Redis (DB 5)** — Rate limiting
- **MongoDB** — AI Core cognitive states, conversation intelligence, telemetry

---

## AI Chat Flow (SSE)

```
1. Frontend POST /api/v2/chat/stream
       │  {message, session_id?, mode?, kb_name?, enable_rag?, memory_facets?}
       ▼
2. Main Backend (ChatHandler)
   ├── Auth check (JWT)
   ├── Entitlement check (daily quota)
   ├── Rate limit check (60 req/min)
   ├── SSE headers sent
   ├── SEND: event:status → "Analyzing query..."
   ├── (optional) RAG search via Knowledge Service
   ├── (optional) Memory facet loading
   ├── Fetch last 20 chat messages from Session store (Postgres)
   ├── Ensure session exists, persist user message
   ├── Build OrchestrationRequest
   └── Call AI Gateway
        │
        ▼
3. AI Gateway
   ├── Picks a gRPC provider (circuit breaker pattern)
   ├── Classifies errors (FATAL, RETRYABLE, RATE_LIMITED)
   ├── Retries up to 3x with exponential backoff
   └── Sends gRPC OrchestrateStream → AI Core
        │
        ▼
4. AI Core (gRPC server :9107)
   ├── Auth: x-internal-token header
   ├── Intent Analysis (heuristic)
   ├── Cache Check (Redis + precomputed)
   ├── Request Collapsing (dedup identical concurrent reqs)
   ├── Parallel Context Retrieval (Mongo cognitive state + RAG)
   ├── Cognitive State Engine
   ├── Operating Mode selection (5 modes)
   ├── Prompt Engineering
   ├── Model Routing (gemma-fast vs gemma-deep)
   ├── LLM Inference (Gemini API via Google AI Studio)
   ├── Reflection & Evaluation
   ├── Response Shaping
   └── Background Persistence (cache, mastery updates, intelligence)
        │
        ▼
   Returns streaming OrchestrationEvent → Token chunks → Done
        │
        ▼
5. Main Backend streams tokens back to Frontend as SSE
   └── SEND: event:stream → {"content":"<token>"}
   └── SEND: event:done → {}
   └── Persist assistant message to session
```

---

## Unified WebSocket Chat Flow

```
1. Frontend opens WS → wss://host/api/v2/ws?token=<jwt>
2. Client sends: {"type":"start_turn","content":"hello","session_id":"sess_abc","mode":"deep_learn"}
3. Server responds with events (each has turn_id + seq):
   ├── stage_start (reasoning)
   ├── session (includes session_id + turn_id)
   ├── content* (tokens)
   ├── stage_end
   ├── result (full text)
   └── done (status: "completed")
4. Messages persisted to Postgres after turn completes
5. Client can: cancel_turn, subscribe_turn (catch up), resume_from (replay)
```

---

## TutorBot Flow

```
1. User creates bot POST /tutorbot/ → {name, persona, soul_template_id}
2. Bot stored in-memory (persisted to disk)
3. Chat via POST /tutorbot/{bot_id}/stream (SSE) or /tutorbot/{bot_id}/ws
4. Bot context: persona + constraints + attached files + history
5. AI request mode: "tutorbot_strict"
6. Response streamed back (same SSE format as chat)
7. History appended to bot's in-memory conversation
```

---

## Book Generation Flow

```
1. POST /book/ → Create book metadata (Postgres)
2. POST /book/{id}/outline/generate → AI generates outline (async job)
3. GET /book/{id}/outline → Review outline
4. PUT /book/{id}/outline/approve → Approve/manual edit outline
5. POST /book/{id}/generate → Start chapter generation (async job)
6. GET /book/{id}/stream → SSE progress stream
   Events: progress → {status, current_step, progress%, ...}
   Terminal: completed, failed, awaiting_approval
7. GET /book/{id}/chapters/{ch} → Read generated chapter
8. GET /book/{id}/chapters/{ch}/blocks → Quiz/flashcard blocks
9. GET /book/{id}/export/{format} → Download (markdown, html, epub, docx)

Book statuses: draft → outlining → outlining_complete → generating → reviewing → published
```

---

## Practice & Quiz Flow

```
1. GET /practice/questions?topic=arrays&difficulty=medium&limit=5
2. AI Core generates MCQ questions (or falls back to offline cache)
3. Quiz cached in Redis (5min TTL)
4. POST /practice/check → Check single answer (no XP)
5. POST /practice/submit → Submit all answers → Score + XP awarded
6. Gamification: XP, streaks, missions, badges all auto-update
7. Attempts recorded for analytics

Exam mode:
1. POST /practice/exam/start → Get questions + timer
2. POST /practice/exam/submit → Score + full review with explanations
3. Check disabled during exam; explanations revealed at end
```

---

## Coding Practice Flow

```
1. GET /coding-practice/problem?topic=arrays&difficulty=medium&language=python
2. Problem generated by AI, cached in Redis (configurable TTL)
3. POST /coding-practice/run → Run against sample test cases (2 max)
4. POST /coding-practice/submit → Run all tests → XP awarded if all pass
5. XP: 130 per solve, speedrun badges, zero-miss badges
6. Proctoring: tab switch, fullscreen exit violations tracked
```

---

## Gamification System

```
Triggers (auto-awarded by handlers):
- practice.correct_answer → +100 XP
- practice.incorrect_answer → +10 XP
- practice.quiz_complete → +25 XP
- practice.perfect_quiz → +150 XP
- practice.mock_exam_complete → +100-150 XP
- coding_practice.solve → +130 XP
- book_practice.session_complete → up to +100 XP
- book.create → gamification event
- notebook.create → gamification event
- knowledge.upload → gamification event
- tutorbot.create → gamification event

Store: Postgres (gamification_ledger, achievements) + Redis (streaks, counters)
```

---

## Key Database Tables (PostgreSQL)

| Table | Purpose |
|---|---|
| `chat_sessions` | Chat sessions with messages |
| `chat_messages` | Individual chat messages |
| `books` | Book metadata |
| `book_chapters` | Generated chapters |
| `book_sections` | Chapter sections |
| `book_outlines` | Book outlines |
| `book_generation_jobs` | Async job tracking |
| `knowledge_bases` | RAG knowledge bases |
| `knowledge_documents` | Uploaded documents |
| `document_chunks` | Vector-embedded document chunks (pgvector) |
| `learner_profiles` | Learning profile JSON |
| `learner_memory` | Memory facets (journey, strengths, gaps, preferences) |
| `learning_plan_progress` | Milestone progress |
| `workspace_notebooks` | User notes |
| `gamification_ledger` | XP transaction log |
| `achievements` | Unlocked achievements |
| `promo_codes` | Promotional codes |
| `promo_redemptions` | Code redemptions |
| `auth_events` | Login/register audit log |
| `banned_users` | Banned users list |

---

## Error Response Formats

**JSON errors:**
```json
{ "detail": "error message" }
```

**SSE errors:**
```
event: error
data: {"message":"error message"}
```

**Plan limit errors:**
```json
{
  "error": "upgrade_required",
  "feature": "ai_chat",
  "message": "Daily chat message limit reached",
  "code": "daily_limit",
  "plan": "free",
  "limit": 50,
  "used": 50,
  "upgrade_url": "/billing"
}
```

**SSE plan limit:**
```
event: upgrade_required
data: {"feature":"ai_chat","message":"...","code":"daily_limit"}
```

---

## Environment Variables (Main Backend)

| Variable | Default | Description |
|---|---|---|
| `APP_ENV` | `development` | Environment |
| `MAINBACKEND_PORT` | `4700` | HTTP port |
| `MONGO_URI` | `""` | MongoDB connection |
| `POSTGRES_URI` | `""` | PostgreSQL connection |
| `REDIS_URI_MAINBACKEND` | `redis://localhost:6379/0` | Main Redis |
| `REDIS_URI_RATE_LIMIT` | `redis://localhost:6379/5` | Rate limit Redis |
| `AI_CORE_GRPC_ADDR` | `127.0.0.1:9107` | AI Core gRPC address |
| `INTERNAL_AI_TOKEN` | `edquate-internal-secret-token` | gRPC auth token |
| `JWT_SECRET` | `supersecret-dev-key` | JWT signing secret |
| `SUPABASE_URL` | `""` | Supabase project URL |
| `SUPABASE_ANON_KEY` | `""` | Supabase anon key |
