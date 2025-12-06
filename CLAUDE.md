# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
bun install          # Install dependencies
bun run dev          # Start dev server at http://localhost:3000
bun run build        # Build for production
bun run preview      # Preview production build
```

## Tech Stack

- **React 19** + TypeScript 5.9 + Rsbuild (Rspack-based bundler)
- **Zustand** for state management
- **Tailwind CSS 4** with Radix UI primitives
- **Framer Motion** for animations
- **Bun** as package manager
- ES Modules (`"type": "module"`)

## Project Overview

A React implementation of "Buckshot Roulette" (霰弹枪轮盘赌/恶魔轮盘) - a turn-based risk/reward game where players take turns with a shotgun containing live and blank rounds. Supports Human vs AI and AI vs AI modes.

### Core Game Rules

- **Three-match system**: Game consists of 3 matches with increasing difficulty
  - Match 1: 2 HP, 0 items per round (pure psychology)
  - Match 2: 4 HP, 2 items per round (introduces items)
  - Match 3: 5 HP, 4 items per round (guillotine mechanic)
- Shotgun contains randomized live (damage) and blank (safe) rounds
- Shoot yourself with blank = keep your turn; shoot opponent = always ends turn
- Players have health (defibrillator charges); match ends when one player's HP reaches 0
- 9 item types: saw, handcuffs, cigarettes, magnifier, drink, adrenaline, medicine, inverter, phone
- Handcuffs skip opponent's turn (user gets consecutive turns)
- Adrenaline steals item to your inventory (does not immediately use)
- Items fully reset when ammo is depleted (no carry-over between sub-rounds)
- **Guillotine mechanic** (Match 3 only): When HP drops below 2, player enters "one-hit kill" state - healing items are disabled and any live round hit is instant death

## Architecture

### Directory Structure

```
src/
├── app/stores/           # Zustand stores
│   ├── game-store.ts     # Core game state, actions (shoot, useItem, nextTurn)
│   ├── game-settings.ts  # AI config, game mode settings (persisted)
│   └── llm-log-store.ts  # LLM interaction logging for debug UI
├── agents/               # AI system
│   ├── types.ts          # AgentTurnOutput, GameSnapshot, AgentAction types
│   ├── prompts/          # System prompt construction (dealer persona, rules context)
│   ├── services/         # AI bridge abstraction
│   │   ├── ai-bridge.ts  # AIBridge interface, ConversationManager, JSON parsing
│   │   └── bridges/      # Provider implementations (GeminiBridge, OpenAIBridge)
│   └── strategies/       # State serialization for AI prompts
├── entities/             # Domain models
│   ├── items/            # Item types and effects
│   └── shell/            # Shell (bullet) types
├── shared/               # Shared utilities and UI components
│   ├── lib/utils.ts      # cn() utility for className merging
│   └── ui/               # Radix UI primitives (Button, Card, Dialog, Input, Select)
└── features/             # UI features
    ├── game-table/       # Main game UI
    │   ├── hooks/        # useAITurn, useActionExecutor
    │   └── components/   # LLM log panel, spectate controls, adrenaline modal
    ├── player-view/      # Player avatar component
    ├── settings/         # Settings dialog for AI configuration
    └── signature/        # Signature pad and waiver dialog
```

### Key Patterns

**AI Bridge Pattern**: All AI providers implement `AIBridge` interface with `query()`, `queryStream()`, and `validateConfig()`. Bridges registered via factory in `services/index.ts`. Supported providers:
- `gemini` - Google Generative AI SDK
- `deepseek` - OpenAI-compatible (`https://api.deepseek.com`)
- `grok` - OpenAI-compatible (`https://api.x.ai/v1`)
- `openai` - Native OpenAI
- `openrouter` - OpenAI-compatible (`https://openrouter.ai/api/v1`)
- `openai-compatible` - Custom baseURL

**Game State Flow**:
1. `useAITurn` hook detects AI's turn via `game.phase`
2. Creates `GameSnapshot` from current state
3. Builds prompt via `state-serializer.ts`
4. Streams response, extracts thought/dialogue/action
5. `useActionExecutor` executes the action (USE_ITEM, SHOOT_OPPONENT, SHOOT_SELF)

**AI vs AI Mode**:
- Both players can be AI-controlled simultaneously
- `useAITurn` hook maintains independent state for each AI (`playerAiState`, `dealerAiState`)
- Spectate controls available: pause/resume, speed (0.5x-3x), step mode
- Each AI has its own `ConversationManager` to maintain conversation history

**AI Output Format** (JSON):
```typescript
interface AgentTurnOutput {
  thought: string    // Internal reasoning (shown in UI)
  dialogue: string   // Character speech
  action: { type: 'USE_ITEM' | 'SHOOT_OPPONENT' | 'SHOOT_SELF', itemId?: ItemType }
}
```

### Important Files

- `src/app/stores/game-store.ts` - All game logic: damage, item effects, turn management, shooting animations
- `src/agents/services/ai-bridge.ts` - JSON extraction with bracket balancing, handles malformed LLM output
- `src/agents/strategies/state-serializer.ts` - Converts game state to AI-readable prompts
- `src/features/game-table/hooks/use-ai-turn.ts` - Orchestrates AI turn flow
- `src/features/game-table/shotgun.tsx` - Shotgun SVG with rotation/muzzle flash animations

## The Dealer Persona

The AI dealer is an "industrial horror" character - cold, mechanical, with shark-like teeth. Dialogue should be terse and metallic:
- Opening: "签下免责声明。" (Please sign the waiver.)
- Advantage: "有意思。" (Interesting...)
- Disadvantage: "还没结束。" (Not over yet.)

## Game State Key Fields

```typescript
interface GameState {
  phase: 'idle' | 'loading' | 'round-start' | 'player-turn' | 'dealer-turn' | 'shooting' | 'round-end' | 'game-over'
  match: 1 | 2 | 3                          // Current match number
  subRound: number                          // Current sub-round (ammo cycle)
  matchConfig: MatchConfig                  // Current match settings
  shootingTarget: 'self' | 'opponent' | null  // For gun rotation animation
  lastShotResult: 'live' | 'blank' | null     // For muzzle flash (live) vs smoke (blank)
}

interface PlayerState {
  guillotineActive: boolean  // One-hit kill state (Match 3, HP < 2)
  // ...other fields
}

// Match configuration
const MATCH_CONFIGS = {
  1: { initialHealth: 2, itemsPerRound: 0, initialShells: 2, hasGuillotine: false },
  2: { initialHealth: 4, itemsPerRound: 2, initialShells: 3, hasGuillotine: false },
  3: { initialHealth: 5, itemsPerRound: 4, initialShells: 4, hasGuillotine: true },
}
// Shell count per sub-round: initialShells + (subRound - 1), max 8
```
