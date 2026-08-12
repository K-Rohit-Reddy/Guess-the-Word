# <img src="./frontend/src/app/icon.svg" width="36" align="top" /> Guess the Word

> A production-ready, full-stack Wordle-inspired word guessing game with user authentication, role-based access control (Player / Admin), player analytics, and an admin reporting dashboard — built as an **OpenText pre-boarding internship project**.

**Next.js 16 · TypeScript · Tailwind CSS v4 · shadcn/ui · FastAPI · SQLAlchemy (async) · PostgreSQL**

---

## 📑 Table of Contents

| | Section | What You'll Find |
|---|---------|-----------------|
| 1 | [🌐 Live Demo](#-live-demo) | Deployed app links + demo credentials |
| 2 | [✅ Requirements Coverage](#-requirements-coverage) | Every spec requirement mapped to implementation |
| 3 | [🧠 Design Decisions](#-design-decisions) | Why I chose each technology and pattern |
| 4 | [🏗️ Architecture](#️-architecture) | System architecture + request flow |
| 5 | [🗂️ Data Model](#️-data-model) | Entities, relationships, and schema |
| 6 | [🔒 Role-Based Access Control](#-role-based-access-control) | Permission matrix by role |
| 7 | [🔐 Authentication Flow](#-authentication-flow) | Server-side session lifecycle |
| 8 | [🎮 Game Logic](#-game-logic) | Core Wordle algorithm + daily limits |
| 9 | [🔗 API Endpoints](#-api-endpoints) | Full endpoint reference (22 endpoints) |
| 10 | [📁 Project Structure](#-project-structure) | Folder layout for frontend + backend |
| 11 | [⚡ Setup & Running](#-setup--running) | Local development setup |
| 12 | [☁️ Deployment](#️-deployment) | AWS (backend) + Vercel (frontend) |
| 13 | [🛠️ Tech Stack](#️-tech-stack) | Full technology table with rationale |
| 14 | [🧪 Testing](#-testing) | E2E test suite |
| 15 | [📝 Assumptions & Tradeoffs](#-assumptions--tradeoffs) | What I chose, what I gave up, and why |

---

## 🌐 Live Demo

The app is **deployed and live** — no local setup needed to evaluate:

| | Link |
|---|------|
| 🎮 **Frontend (Vercel)** | **[`<your-app>.vercel.app`](#)** |
| 📖 **API Docs (Swagger)** | **[`http://<EC2_IP>:8000/docs`](#)** |
| ❤️ Health Check | [`http://<EC2_IP>:8000/`](#) |

### Demo Admin Credentials

| Field | Value |
|-------|-------|
| Username | `admin` |
| Password | `Admin$123` |

> [!TIP]
> Log in as **admin** to access the full admin dashboard — platform stats, daily/user reports, user management, and word dictionary management. Then register a new player account to experience the game flow.

---

## ✅ Requirements Coverage

Every requirement from the project specification is implemented. Here's the mapping:

### 📋 Core Requirements

| # | Specification | Status | Implementation |
|---|--------------|:------:|----------------|
| 1 | **Two types of users** — Admin (configure + reports) and Player (play the game) | ✅ | `User.role` field with values `"admin"` / `"player"`. Admin gets sidebar dashboard at `/admin/*`; Player gets game at `/game` and dashboard at `/dashboard`. Role enforced via `require_admin()` dependency. |
| 2 | **User registration** with username and password | ✅ | `POST /api/auth/register` — creates a new player account with display name, username, and password. |
| 3 | **Username validation** — at least 5 letters, both upper and lower case | ✅ | Pydantic validator: `len(v) >= 5`, `v.isalpha()`, and `v != v.lower() and v != v.upper()` — rejects all-upper, all-lower, or non-alpha usernames. |
| 4 | **Password validation** — at least 5 characters, alpha + numeric + one of `$`, `%`, `*` | ✅ | Pydantic validator: `len(v) >= 5`, regex checks for `[a-zA-Z]`, `[0-9]`, and `[$%*]`. |
| 5 | **Save twenty 5-letter words** in database to start with | ✅ | `seed.py` runs on startup — inserts 20 curated words: APPLE, BRAVE, CRANE, DREAM, EAGLE, FLAME, GRAPE, HOUSE, IMAGE, JOINT, KNEEL, LEMON, MANGO, NOBLE, OCEAN, PIANO, QUEEN, ROVER, STONE, TIGER. |
| 6 | **Pick one word randomly** from the database when a user starts playing | ✅ | `random.choice(available_words)` in `game_service.py`. Words already played that day are excluded. |
| 7 | **Don't allow more than 3 words to guess in a day** | ✅ | `start_game()` counts today's games per user — returns `400` if `>= 3`. Daily limit resets at midnight IST (timezone-configurable). |
| 8 | **Allow user to submit a 5-letter word (upper case only), max 5 guesses** | ✅ | `GuessRequest` validator auto-uppercases and validates `len == 5` + `isalpha()`. Service enforces `MAX_GUESSES = 5`. |
| 9 | **Green** — correct letter, correct position | ✅ | Two-pass algorithm in `evaluate_guess()`: first pass marks exact matches as `"correct"` → rendered with green tile styling. |
| 10 | **Orange** — correct letter, wrong position | ✅ | Second pass marks partial matches from remaining letters as `"present"` → rendered with orange tile styling. |
| 11 | **Grey** — letter not in word | ✅ | Letters not matched in either pass marked as `"absent"` → rendered with grey tile styling. |
| 12 | **User wins** — show congratulatory message, click OK to stop | ✅ | `GameResultDialog` shows "Congratulations!" with confetti animation when `status == "won"`. Game stops on dismiss. |
| 13 | **All 5 guesses used, not correct** — show "better luck next time", click OK to stop | ✅ | `GameResultDialog` shows "Better luck next time!" with the correct answer revealed when `status == "lost"`. |
| 14 | **Show earlier guesses in sequence** and allow next guess | ✅ | `GameBoard` renders all previous `GuessResponse` rows in order, each with color-coded tiles. New input row appears below. |
| 15 | **Save in database** the words given and the words guessed with date | ✅ | `games` table stores the target word (via `word_id`), date, and status. `guesses` table stores each guess word and attempt number. |
| 16 | **Admin report for a day** — number of users and number of correct guesses | ✅ | `GET /api/admin/report/daily?date=YYYY-MM-DD` returns `total_users`, `total_games`, `total_correct_guesses`, and `win_rate`. |
| 17 | **Admin report for a user** — date, number of words tried, number of correct guesses | ✅ | `GET /api/admin/report/user/{id}` returns per-day breakdown with `date`, `words_tried`, `correct_guesses`, and `win_rate`. |

### 🚀 Beyond the Requirements

| Enhancement | Description |
|------------|-------------|
| **Full-featured admin dashboard** | Platform overview with real-time stats, date-range reports, user management (CRUD), and word dictionary management — not just basic reports. |
| **Player dashboard & stats** | Personal analytics — total games, wins, win rate, current/best streak, games remaining today, full game history with replay. |
| **Profile settings** | Players can update display name, username (with live availability check), and password. |
| **Interactive on-screen keyboard** | Virtual keyboard with color state tracking across guesses — letters turn green/orange/grey as they're used. |
| **Confetti win animation** | Celebratory particle effect on successful guess. |
| **No repeat words per day** | A player never gets the same word twice in a single day. |
| **Timezone-aware daily reset** | Configurable `GAME_TIMEZONE` (default: Asia/Kolkata) so the 3-game-per-day limit resets at local midnight, not UTC midnight. |
| **Live username availability check** | Debounced API call on the registration form shows real-time availability. |
| **Auto-generated API documentation** | Interactive Swagger UI at `/docs` — test every endpoint directly from the browser. |
| **Server-side sessions** | Signed httpOnly cookies with bcrypt password hashing — more secure than JWT for this use case. |
| **E2E test suite** | Automated tests covering the full user journey: register → login → play → admin reports. |
| **Production deployment** | Backend on AWS EC2 + RDS, frontend on Vercel — not just a localhost demo. |
| **Admin word management** | Admins can add/remove words from the dictionary beyond the initial 20. |
| **Admin user management** | Search, sort, edit roles, reset passwords, delete users (with self-deletion protection). |

---

## 🧠 Design Decisions

> The project spec says *"feel free to choose any libraries, frameworks, or databases."* Here's why each choice was made:

| Decision | Reasoning |
|----------|-----------|
| **Next.js (App Router) over plain React** | File-based routing, layouts, and route groups cleanly separate `(auth)`, `(player)`, and `(admin)` concerns. Each group gets its own layout — players see a navbar, admins see a sidebar. |
| **FastAPI over Django/Flask** | Async-first with native Pydantic validation, auto-generated OpenAPI docs (`/docs`), and dependency injection (`get_current_user`, `require_admin`). Perfect for a game API. |
| **PostgreSQL over SQLite/MongoDB** | Game data is inherently relational — users own games, games reference words, guesses belong to games. SQL aggregations (`COUNT`, `SUM`, `GROUP BY`) power the reporting dashboard directly. |
| **Server-side sessions over JWT** | Sessions can be revoked instantly (logout = delete from DB). JWTs require token blacklisting for the same effect. Signed httpOnly cookies prevent XSS token theft — simpler and more secure for a single-server app. |
| **Async SQLAlchemy over sync** | FastAPI is async-native. Using `asyncpg` + async sessions avoids blocking the event loop on database I/O, enabling higher concurrency. |
| **Timezone-aware daily limit** | Without timezone handling, "midnight" resets at UTC (05:30 IST), frustrating Indian users. A configurable `GAME_TIMEZONE` setting solves this cleanly. |
| **Two-pass guess evaluation** | Wordle's algorithm requires **exact matches first**, then partial matches from remaining letters. This prevents double-counting a letter that appears once in the target but twice in the guess. |
| **Service layer separation** | Game logic lives in `game_service.py`, not in route handlers. Routes handle HTTP; services handle business logic. Makes it testable without HTTP. |
| **shadcn/ui component library** | Pre-built, accessible components with full source code ownership. No vendor lock-in — components live in the codebase and can be customized freely. |
| **Pydantic validation** | Registration rules (username: 5+ letters, mixed case; password: 5+ chars, alpha + numeric + `$%*`) are enforced at the schema level — invalid requests are rejected before touching the database. |

---

## 🏗️ Architecture

```
┌─────────────────────────────────┐       ┌──────────────────────────────────┐
│         Frontend (Vercel)       │       │        Backend (AWS EC2)         │
│                                 │       │                                  │
│  Next.js 16 (App Router)       │       │  FastAPI + Uvicorn               │
│  TypeScript + Tailwind v4      │ HTTPS │  SQLAlchemy (async)              │
│  shadcn/ui + Lucide Icons      │──────▶│  Pydantic validation             │
│                                 │       │  bcrypt + signed sessions        │
│  Routes:                        │       │                                  │
│   / (login)                     │       │  Layers:                         │
│   /register                     │       │   Routes → Services → ORM → DB  │
│   /dashboard                    │       │                                  │
│   /game                         │       └──────────┬───────────────────────┘
│   /settings                     │                  │
│   /admin/*                      │                  ▼
│                                 │       ┌──────────────────────┐
└─────────────────────────────────┘       │  PostgreSQL (RDS)    │
                                          │                      │
                                          │  Tables:             │
                                          │   users              │
                                          │   sessions           │
                                          │   words              │
                                          │   games              │
                                          │   guesses            │
                                          └──────────────────────┘
```

### Request Flow

```
Browser → Next.js Page → API Client (fetch) → FastAPI Route
                                                    │
                                          ┌─────────▼──────────┐
                                          │  Dependency Chain   │
                                          │                     │
                                          │  get_db()           │  ← async DB session
                                          │  get_current_user() │  ← cookie → session → user
                                          │  require_admin()    │  ← role check
                                          └─────────┬──────────┘
                                                    │
                                          ┌─────────▼──────────┐
                                          │  Service Layer      │
                                          │  (game_service.py)  │
                                          └─────────┬──────────┘
                                                    │
                                          ┌─────────▼──────────┐
                                          │  SQLAlchemy ORM     │
                                          │  (asyncpg driver)   │
                                          └─────────┬──────────┘
                                                    │
                                              PostgreSQL
```

---

## 🗂️ Data Model

```mermaid
erDiagram
    USERS {
        int id PK
        string display_name
        string username UK
        string hashed_password
        string role "player | admin"
        datetime created_at
    }

    SESSIONS {
        string id PK
        int user_id FK
        datetime expires_at
    }

    WORDS {
        int id PK
        string word UK "5-letter uppercase"
    }

    GAMES {
        int id PK
        int user_id FK
        int word_id FK
        string status "in_progress | won | lost"
        date date "timezone-aware game day"
        datetime created_at
    }

    GUESSES {
        int id PK
        int game_id FK
        string guess_word "5-letter uppercase"
        int attempt_number "1-5"
        datetime created_at
    }

    USERS ||--o{ SESSIONS : "has"
    USERS ||--o{ GAMES : "plays"
    WORDS ||--o{ GAMES : "assigned to"
    GAMES ||--o{ GUESSES : "contains"
```

---

## 🔒 Role-Based Access Control

Every API endpoint is protected by FastAPI dependency injection:

| Resource | Player | Admin |
|----------|:------:|:-----:|
| Register / Login / Logout | ✅ | ✅ |
| Play game (start, guess) | ✅ | ❌ |
| View own stats & history | ✅ | ❌ |
| Update own profile & password | ✅ | ❌ |
| Platform statistics | ❌ | ✅ |
| Daily reports (single + range) | ❌ | ✅ |
| Per-user reports | ❌ | ✅ |
| User management (CRUD) | ❌ | ✅ |
| Word management (CRUD) | ❌ | ✅ |

**Implementation**: `get_current_user()` extracts the session from the signed httpOnly cookie and resolves the user. `require_admin()` extends this by checking `user.role == "admin"` and returning `403 Forbidden` if not.

---

## 🔐 Authentication Flow

```mermaid
sequenceDiagram
    participant B as Browser
    participant F as Frontend
    participant A as FastAPI
    participant D as Database

    B->>F: Submit login form
    F->>A: POST /api/auth/login {username, password}
    A->>D: SELECT user WHERE username = ?
    D-->>A: User record
    A->>A: Verify bcrypt hash
    A->>D: INSERT session (id, user_id, expires_at)
    A-->>F: 200 OK + Set-Cookie: session_id (httpOnly, SameSite)
    F-->>B: Redirect to /dashboard

    Note over B,A: Subsequent requests carry cookie automatically

    B->>F: Click "Logout"
    F->>A: POST /api/auth/logout (cookie attached)
    A->>D: DELETE session WHERE id = ?
    A-->>F: 200 OK + Clear-Cookie
    F-->>B: Redirect to /
```

**Security measures:**
- Passwords hashed with **bcrypt** (via passlib)
- Session IDs are **64-character hex tokens** (cryptographically random via `secrets.token_hex(32)`)
- Cookies are **signed** with `itsdangerous` (tamper-proof)
- Cookies are **httpOnly** (no JavaScript access → XSS-safe)
- Sessions have a **24-hour TTL** (configurable via `SESSION_MAX_AGE`)
- Expired sessions are **cleaned up on access**

---

## 🎮 Game Logic

### Guess Evaluation Algorithm

The evaluation follows the official Wordle algorithm — a **two-pass approach** to handle duplicate letters correctly:

```
Target: CRANE     Guess: CARRY

Pass 1 — Exact matches:
  C → C  ✅ correct (green)
  A → R  ⏳ skip
  R → A  ⏳ skip
  R → N  ⏳ skip
  Y → E  ⏳ skip

  Remaining target letters: [R, A, N, E]

Pass 2 — Partial matches from remaining:
  A → found in remaining → 🟧 present (orange), remove A
  R → found in remaining → 🟧 present (orange), remove R
  R → NOT in remaining   → ⬜ absent (grey)
  Y → NOT in remaining   → ⬜ absent (grey)

Final: 🟩🟧🟧⬜⬜
```

### Game Rules (as per specification)

| Rule | Value | Spec Reference |
|------|-------|---------------|
| Word length | **5 letters, uppercase** | "allow the user to submit a 5-letter word (upper case only)" |
| Max guesses per game | **5** | "Allow a maximum of 5 guesses" |
| Max games per day | **3** | "Don't allow more than 3 words to guess in a day" |
| Daily reset timezone | **Asia/Kolkata** (configurable) | Midnight IST |
| Word reuse within a day | **Not allowed** | Each game gets a unique word |
| Correct letter, right position | **Green** | "highlighted in green" |
| Correct letter, wrong position | **Orange** | "highlight it in orange color" |
| Letter not in word | **Grey** | "highlighted in grey" |
| Win message | **"Congratulations!"** + confetti | "Show congratulatory message" |
| Loss message | **"Better luck next time!"** + correct answer | "show 'better luck next time' message" |

---

## 🔗 API Endpoints

**Base URL:** `http://<BACKEND_URL>/api`

### Auth (4 endpoints)

| Method | Endpoint | Auth | Description |
|--------|----------|:----:|-------------|
| `POST` | `/auth/register` | 🔓 | Register a new player account |
| `POST` | `/auth/login` | 🔓 | Login → creates session → sets cookie |
| `POST` | `/auth/logout` | 🔒 | Logout → deletes session → clears cookie |
| `GET` | `/auth/me` | 🔒 | Get current authenticated user |

### Game (6 endpoints)

| Method | Endpoint | Auth | Description |
|--------|----------|:----:|-------------|
| `POST` | `/game/start` | 🔒 | Start a new game (enforces 3/day limit) |
| `POST` | `/game/{id}/guess` | 🔒 | Submit a 5-letter guess |
| `GET` | `/game/current` | 🔒 | Get active in-progress game |
| `GET` | `/game/{id}` | 🔒 | Get a specific game's state |
| `GET` | `/game/history/` | 🔒 | Get all completed games with full replay |
| `GET` | `/game/stats/` | 🔒 | Get player stats (wins, streak, etc.) |

### Settings (3 endpoints)

| Method | Endpoint | Auth | Description |
|--------|----------|:----:|-------------|
| `GET` | `/settings/check-username/{name}` | 🔒 | Live username availability check |
| `PUT` | `/settings/profile` | 🔒 | Update display name / username |
| `PUT` | `/settings/password` | 🔒 | Change password (requires current) |

### Admin (9 endpoints)

| Method | Endpoint | Auth | Description |
|--------|----------|:----:|-------------|
| `GET` | `/admin/stats` | 👑 | Platform-wide statistics |
| `GET` | `/admin/report/daily` | 👑 | Daily report — users, games, correct guesses (`?date=YYYY-MM-DD`) |
| `GET` | `/admin/report/daily-range` | 👑 | Date range report (`?from_date=...&to_date=...`) |
| `GET` | `/admin/report/user/{id}` | 👑 | User report — date, words tried, correct guesses |
| `GET` | `/admin/users` | 👑 | List all users (search, sort, filter) |
| `PUT` | `/admin/users/{id}` | 👑 | Edit user (name, username, role, password) |
| `DELETE` | `/admin/users/{id}` | 👑 | Delete user (cascades games & guesses) |
| `GET` | `/admin/words` | 👑 | List all words in dictionary |
| `POST` | `/admin/words` | 👑 | Add a new 5-letter word |
| `DELETE` | `/admin/words/{id}` | 👑 | Remove a word from dictionary |

> 🔓 = Public &nbsp;&nbsp; 🔒 = Authenticated (any role) &nbsp;&nbsp; 👑 = Admin only

---

## 📁 Project Structure

```
project/
├── README.md
│
├── frontend/                          # Next.js 16 (App Router)
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx               # Login page (landing)
│   │   │   ├── layout.tsx             # Root layout (fonts, theme, toaster)
│   │   │   ├── globals.css            # Tailwind v4 + custom theme
│   │   │   │
│   │   │   ├── (auth)/               # Auth route group
│   │   │   │   ├── layout.tsx         # Centered card layout
│   │   │   │   ├── login/page.tsx
│   │   │   │   └── register/page.tsx
│   │   │   │
│   │   │   ├── (player)/             # Player route group
│   │   │   │   ├── layout.tsx         # Navbar + auth guard
│   │   │   │   ├── dashboard/page.tsx # Stats + game history
│   │   │   │   ├── game/page.tsx      # Game board + keyboard
│   │   │   │   └── settings/page.tsx  # Profile & password settings
│   │   │   │
│   │   │   └── (admin)/              # Admin route group
│   │   │       ├── layout.tsx         # Sidebar navigation layout
│   │   │       └── admin/
│   │   │           ├── page.tsx       # Platform overview dashboard
│   │   │           ├── daily-report/  # Daily analytics
│   │   │           ├── user-report/   # Per-user analytics
│   │   │           ├── users/         # User management (CRUD)
│   │   │           └── words/         # Word dictionary management
│   │   │
│   │   ├── components/
│   │   │   ├── ui/                    # shadcn/ui primitives (16 components)
│   │   │   └── custom/               # App-specific components
│   │   │       ├── GameBoard.tsx      # 5×5 tile grid
│   │   │       ├── Tile.tsx           # Letter tile with flip animation
│   │   │       ├── Keyboard.tsx       # On-screen keyboard with color tracking
│   │   │       ├── ConfettiEffect.tsx # Win celebration animation
│   │   │       ├── GameResultDialog.tsx # Win/loss outcome modal
│   │   │       ├── Navbar.tsx         # Top navigation bar
│   │   │       ├── AdminSidebar.tsx   # Admin panel side navigation
│   │   │       └── Brand.tsx         # App logo/branding
│   │   │
│   │   ├── hooks/
│   │   │   ├── useAuth.tsx            # Auth context + session management
│   │   │   ├── useGame.ts            # Game state machine (start → guess → result)
│   │   │   └── useDebounce.ts        # Input debouncing for username check
│   │   │
│   │   └── lib/
│   │       ├── api.ts                 # Centralized API client (all 22 endpoints)
│   │       └── utils.ts              # Utility functions (cn helper)
│   │
│   ├── package.json
│   ├── tsconfig.json
│   ├── next.config.ts
│   └── .gitignore
│
└── backend/                           # Python FastAPI
    ├── app/
    │   ├── main.py                    # App entry (CORS, lifespan, router)
    │   │
    │   ├── api/                       # Route handlers (HTTP layer)
    │   │   ├── auth.py                # Register, login, logout, me
    │   │   ├── game.py                # Start, guess, current, history, stats
    │   │   ├── settings.py            # Profile updates, password change
    │   │   └── admin.py               # Stats, reports, user/word CRUD
    │   │
    │   ├── core/                      # Infrastructure
    │   │   ├── config.py              # Pydantic settings (env-based)
    │   │   ├── database.py            # Async engine + session factory
    │   │   ├── security.py            # bcrypt, sessions, auth dependencies
    │   │   └── gameday.py             # Timezone-aware daily reset logic
    │   │
    │   ├── models/                    # SQLAlchemy ORM models
    │   │   ├── user.py                # User (id, username, role, ...)
    │   │   ├── session.py             # Session (id, user_id, expires_at)
    │   │   ├── word.py                # Word (id, word)
    │   │   └── game.py                # Game + Guess
    │   │
    │   ├── schemas/                   # Pydantic request/response schemas
    │   │   ├── auth.py                # Login, Register + validation rules
    │   │   ├── game.py                # GuessRequest, GameResponse, LetterResult
    │   │   ├── settings.py            # ProfileUpdate, PasswordChange
    │   │   └── admin.py               # Reports, UserList, WordManagement
    │   │
    │   └── services/                  # Business logic (no HTTP concerns)
    │       └── game_service.py        # start_game, evaluate_guess, submit_guess
    │
    ├── seed.py                        # Database seeder (admin user + 20 words)
    ├── test_e2e.py                    # End-to-end API test suite
    ├── test_gameday.py                # Timezone/gameday unit tests
    ├── requirements.txt               # Python dependencies
    └── .env                           # Environment config (not committed)
```

---

## ⚡ Setup & Running

### Prerequisites

- **Node.js** 18+ and **npm**
- **Python** 3.11+
- **PostgreSQL** (running locally or remotely)

### 1. Database

```sql
CREATE DATABASE guess_the_word;
```

### 2. Backend

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Configure environment — create .env with:
#   SECRET_KEY=<random-secret>
#   DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/guess_the_word
#   ADMIN_USERNAME=admin
#   ADMIN_PASSWORD=Admin$123
#   ADMIN_DISPLAY_NAME=System Administrator

# Start the server (auto-creates tables + seeds data on first run)
uvicorn app.main:app --reload
```

API available at **`http://localhost:8000`** · Swagger docs at **`http://localhost:8000/docs`**

### 3. Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

App available at **`http://localhost:3000`**

---

## ☁️ Deployment

| Component | Platform | URL |
|-----------|----------|-----|
| **Frontend** | Vercel | `https://<your-app>.vercel.app` |
| **Backend** | AWS EC2 (Ubuntu) | `http://<EC2_IP>:8000` |
| **Database** | AWS RDS PostgreSQL | *(private, EC2 access only)* |

### Backend (AWS EC2)

1. Launch an **Ubuntu EC2 instance** (`t2.micro` for free tier)
2. Create an **RDS PostgreSQL** instance in the same VPC
3. SSH into EC2, clone the repo, create `.env` with production RDS credentials
4. Set `ALLOWED_ORIGINS=https://your-app.vercel.app` in `.env`
5. Run with **systemd** for 24/7 uptime

### Frontend (Vercel)

1. Push the `frontend/` directory to a GitHub repository
2. Import into **Vercel** → auto-detects Next.js
3. Set environment variable: `NEXT_PUBLIC_API_URL=http://<EC2_IP>:8000/api`
4. Deploy → Vercel provides a `*.vercel.app` URL automatically

---

## 🛠️ Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Frontend** | Next.js 16 (App Router) | File-based routing, route groups, layouts |
| **Language** | TypeScript | Type safety across API types, props, hooks |
| **Styling** | Tailwind CSS v4 | Utility-first CSS with new v4 engine |
| **UI Components** | shadcn/ui | Accessible, customizable — source code in project |
| **Icons** | Lucide React | Tree-shakeable, consistent icon library |
| **Toasts** | Sonner | Minimal, animated notifications |
| **Backend** | FastAPI | Async-first, auto Swagger docs, dependency injection |
| **ORM** | SQLAlchemy 2.0 (async) | Mature, type-hinted, async-native |
| **Validation** | Pydantic v2 | Request/response validation + JSON schema |
| **Database** | PostgreSQL | ACID-compliant, perfect for relational game data |
| **DB Driver** | asyncpg | Fastest async PostgreSQL driver for Python |
| **Password Hashing** | bcrypt (passlib) | Industry standard, configurable work factor |
| **Session Signing** | itsdangerous | Tamper-proof signed cookies |
| **Deployment** | AWS EC2 + RDS / Vercel | EC2 for backend, RDS for Postgres, Vercel for frontend |

---

## 🧪 Testing

The project includes end-to-end API tests covering the complete user journey:

```bash
cd backend
source venv/bin/activate

# Run all E2E tests
python -m pytest test_e2e.py -v

# Run gameday timezone tests
python -m pytest test_gameday.py -v
```

### Test Coverage

| Test Suite | Covers |
|-----------|--------|
| `test_e2e.py` | Full flow: register → login → start game → guess → check stats → admin reports → user management → word management |
| `test_gameday.py` | Timezone-aware daily reset logic across different UTC offsets |

---

## 📝 Assumptions & Tradeoffs

| Decision | What I Chose | What I Gave Up | Why |
|----------|-------------|----------------|-----|
| **Session auth over JWT** | Instant revocation, simpler model | Stateless scalability | Single-server deployment; server-side sessions are more secure |
| **No word validation against dictionary** | Any 5-letter string accepted as a guess | Invalid words waste attempts | Could be added with a dictionary API; keeps scope focused |
| **Random word per player** | Each player gets a different random word | Classic Wordle "one word for everyone" | Enables replayability; no spoiler risk between players |
| **Hard delete for users** | Clean data, simple cascades | Audit trail of deleted accounts | `ON DELETE CASCADE` keeps referential integrity clean |
| **Client-side route guards** | Fast UX, no redirect round-trip | Page-level auth is cosmetic only | API enforces auth on every endpoint — client guards are purely UX |
| **No email verification** | Simpler registration | Account recovery | Scope-appropriate for a game; easy to add later |

---

<p align="center">
  Built with ❤️ as an <strong>OpenText Pre-boarding Internship Project</strong> · August 2026
</p>
