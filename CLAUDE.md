# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Frontend (React)

```bash
cd frontend
bun install          # Install dependencies
bun run dev          # Start dev server at http://localhost:3000
bun run build        # Build for production (outputs to ./dist)
bun run preview      # Preview production build
```

### Backend (Rust)

```bash
cd backend
cargo build          # Build
cargo run            # Run (listens on :8080)
cargo test           # Test
```

Note: Backend is currently a stub with only a health check endpoint (`/api/v1/health`).

### Docker (Full Stack)

```bash
docker-compose up    # Frontend on :80, Backend on :8080
```

## Tech Stack

**Frontend**: React 19, TypeScript 5.9, Rsbuild, Zustand, Tailwind CSS 4, Radix UI, Framer Motion, Bun

**Backend**: Rust Edition 2024, Actix-web, Diesel (stub only)

**Docs**: [Rsbuild](https://rsbuild.rs/llms.txt), [Rspack](https://rspack.rs/llms.txt)

## Project Overview

A React implementation of "Buckshot Roulette" - a turn-based risk/reward game with a shotgun containing live and blank rounds. Supports Human vs AI and AI vs AI modes with multiple LLM providers.

### Core Game Rules

- **Three-match system** with increasing difficulty:
  - Match 1: 2 HP, 0 items (pure psychology)
  - Match 2: 4 HP, 2 items per round
  - Match 3: 5 HP, 4 items per round, guillotine mechanic
- Shoot yourself with blank = keep turn; shoot opponent = ends turn
- 9 item types: saw, handcuffs, cigarettes, magnifier, drink, adrenaline, medicine, inverter, phone
- **Guillotine** (Match 3 only): When HP < 2, healing disabled, one live round hit = instant death
- Items fully reset when ammo is depleted (no carry-over between sub-rounds)

### AI Providers

Supported via Bridge pattern in `frontend/src/agents/services/`:
- `gemini` - Google Generative AI SDK
- `openai` - Native OpenAI SDK
- `deepseek` - OpenAI-compatible (`api.deepseek.com`)
- `grok` - OpenAI-compatible (`api.x.ai`)
- `openrouter` - OpenAI-compatible (`openrouter.ai`)
- `openai-compatible` - Custom baseURL
- `preset` - Backend-managed presets (admin-configured)

## Architecture

### Project Structure

```
BuckshotRoulette/
├── frontend/         # React 19 + TypeScript + Rsbuild
│   └── src/
│       ├── app/
│       │   ├── router.tsx        # React Router v7 routes
│       │   └── stores/           # Zustand stores (game-store, game-settings, auth-store, llm-log-store)
│       ├── agents/               # AI system (bridges, prompts, strategies)
│       ├── entities/             # Domain models (items, shells)
│       ├── features/             # UI features
│       │   ├── auth/             # Login page
│       │   ├── dashboard/        # Admin dashboard (model presets)
│       │   ├── game/             # Game page wrapper
│       │   ├── game-table/       # Main game UI and hooks
│       │   ├── lobby/            # Game lobby / main menu
│       │   ├── player-view/      # Player avatar component
│       │   ├── settings/         # AI settings dialog
│       │   └── signature/        # Waiver signature pad
│       └── shared/               # Shared utilities, UI components, API client
└── backend/          # Rust Actix-web server (stub)
```

### Routes

| Path | Component | Access |
|------|-----------|--------|
| `/` | LobbyPage | Public |
| `/login` | LoginPage | Public |
| `/game` | GamePage | Public |
| `/dashboard` | DashboardPage | Admin only |

### Key Files

| File | Purpose |
|------|---------|
| `frontend/src/app/stores/game-store.ts` | All game logic: damage, items, turns, shooting |
| `frontend/src/app/stores/auth-store.ts` | Authentication state (JWT, user info) |
| `frontend/src/agents/services/ai-bridge.ts` | AIBridge interface, JSON extraction, bracket balancing |
| `frontend/src/agents/strategies/state-serializer.ts` | Game state to AI prompt conversion |
| `frontend/src/features/game-table/hooks/use-ai-turn.ts` | AI turn orchestration |
| `frontend/src/features/game-table/shotgun.tsx` | Shotgun SVG with rotation/muzzle animations |

### Path Aliases (Frontend)

```
@/          → ./src/
@/shared/   → ./src/shared/
@/entities/ → ./src/entities/
@/features/ → ./src/features/
@/agents/   → ./src/agents/
@/app/      → ./src/app/
```

### AI Turn Flow

1. `useAITurn` hook detects AI's turn via `game.phase`
2. Creates `GameSnapshot` from current state
3. Builds prompt via `state-serializer.ts`
4. Streams response through AIBridge
5. Extracts JSON with multi-level fallback (direct parse → code block → bracket matching → auto-fix)
6. `useActionExecutor` executes action (USE_ITEM, SHOOT_OPPONENT, SHOOT_SELF)

### AI Output Format

```typescript
interface AgentTurnOutput {
  thought: string    // Internal reasoning (shown in UI)
  dialogue: string   // Character speech
  action: { type: 'USE_ITEM' | 'SHOOT_OPPONENT' | 'SHOOT_SELF', itemId?: ItemType }
}
```

### Game State Phases

```
'idle' → 'loading' → 'round-start' → 'player-turn'/'dealer-turn' → 'shooting' → 'round-end' → 'game-over'
```

## The Dealer Persona

The AI dealer is an "industrial horror" character - cold, mechanical, with shark-like teeth. Dialogue should be terse and metallic.

## Additional Documentation

- `frontend/CLAUDE.md` - Frontend-specific guidance with detailed game state fields and match configs
- `frontend/ARCHITECTURE.md` - Mermaid diagrams for data flow, state machine, AI flow
- `frontend/GAME_RULES.md` - Detailed game mechanics with examples
