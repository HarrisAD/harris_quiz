# Realtime Vibe Quiz - Implementation Plan

## Overview
Build a multiplayer quiz app with React + Vite + TypeScript, Firebase Realtime Database, and Tailwind CSS. Deployed to GitHub Pages.

---

## Phase 1: Project Setup

### 1.1 Initialize React + Vite + TypeScript
- Run `npm create vite@latest . -- --template react-ts`
- Install dependencies: `npm install`

### 1.2 Install Additional Dependencies
```bash
npm install firebase react-router-dom
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### 1.3 Configure Tailwind
- Update `tailwind.config.js` with content paths
- Add Tailwind directives to `src/index.css`

### 1.4 Firebase Project Setup (Manual Steps)
1. Go to https://console.firebase.google.com/
2. Click "Create a project" → name it (e.g., "harris-quiz")
3. Disable Google Analytics (optional, simplifies setup)
4. Once created, click "Web" icon to add a web app
5. Register app name, copy the config object
6. Go to "Build" → "Realtime Database" → "Create Database"
7. Choose location, start in **test mode** (open access for development)
8. Copy your database URL

### 1.5 Environment Setup
- Create `.env.local` with Firebase config values
- Add `.env.local` to `.gitignore`

---

## Phase 2: Firebase Data Layer

### 2.1 Data Schema (Realtime Database)
```
/quizzes/{quizId}
  - name: string
  - rounds: [{
      name: string,
      questions: [{
        question: string,
        options: string[],
        correctIndex: number,
        timeLimit: number (default 30)
      }]
    }]

/sessions/{sessionCode}
  - quizId: string
  - status: "lobby" | "playing" | "finished"
  - currentRound: number
  - currentQuestion: number
  - questionStartedAt: timestamp
  - createdAt: timestamp

/players/{sessionCode}/{odUserId}
  - teamName: string
  - odUserId: number
  - scores: { [roundIndex]: number }
  - totalScore: number
  - joinedAt: timestamp

/answers/{sessionCode}/{odUserId}_{roundIndex}_{questionIndex}
  - odUserId: string
  - answerIndex: number
  - answeredAt: timestamp
  - correct: boolean
  - points: number
```

### 2.2 Firebase Configuration File
- Create `src/firebase/config.ts` - initialize Firebase app
- Create `src/firebase/database.ts` - helper functions for CRUD operations

### 2.3 Custom Hooks
- `useSession(sessionCode)` - subscribe to session state
- `usePlayers(sessionCode)` - subscribe to player list
- `useQuiz(quizId)` - fetch quiz data

---

## Phase 3: Core Components & Routing

### 3.1 App Structure
```
src/
├── components/
│   ├── admin/
│   │   ├── AdminHome.tsx      # Create/load quiz, generate session
│   │   ├── AdminLobby.tsx     # See joined players, start quiz
│   │   ├── AdminQuestion.tsx  # Show question, see live answers
│   │   └── AdminLeaderboard.tsx
│   ├── player/
│   │   ├── JoinGame.tsx       # Enter code + team name
│   │   ├── PlayerLobby.tsx    # Waiting for host to start
│   │   ├── PlayerQuestion.tsx # Answer with countdown
│   │   └── PlayerResults.tsx  # See score after question
│   └── shared/
│       ├── Timer.tsx          # Countdown component
│       ├── Leaderboard.tsx    # Reusable leaderboard
│       └── QuestionDisplay.tsx
├── firebase/
│   ├── config.ts
│   └── database.ts
├── hooks/
│   ├── useSession.ts
│   ├── usePlayers.ts
│   └── useQuiz.ts
├── types/
│   └── index.ts               # TypeScript interfaces
├── data/
│   └── sample-quiz.json       # Demo quiz content
├── App.tsx
├── main.tsx
└── index.css
```

### 3.2 Routing
```
/                  → Home (choose Admin or Player)
/admin             → AdminHome (create/select quiz)
/admin/:sessionCode → AdminLobby/AdminQuestion (control panel)
/play              → JoinGame (enter code)
/play/:sessionCode → PlayerLobby/PlayerQuestion (game view)
```

---

## Phase 4: Quiz Logic Implementation

### 4.1 Session State Machine
```
lobby → playing → finished
         ↓
    (per question cycle)
    showing → answering → revealed → next
```

### 4.2 Scoring System
- Correct answer: 1000 base points
- Speed bonus: up to +500 points for faster answers
- Formula: `1000 + Math.floor(500 * (timeRemaining / timeLimit))`

### 4.3 Timer Logic
- Admin starts question → writes `questionStartedAt` timestamp
- Players calculate remaining time client-side
- When time expires, answer is locked (no more submissions)
- Admin advances to reveal/next question

### 4.4 Answer Flow
1. Admin clicks "Start Question"
2. `questionStartedAt` is set in session
3. Players see question + countdown
4. Player submits answer → written to `/answers/`
5. Timer expires → UI locks
6. Admin clicks "Reveal Answer" → players see correct answer
7. Admin clicks "Next" → advances to next question or leaderboard

---

## Phase 5: Sample Quiz Data

Create a fun sample quiz with 2 rounds, 3-4 questions each, covering general knowledge topics.

---

## Phase 6: Styling & Polish

### 6.1 Design Goals
- Mobile-first (players use phones)
- Large touch targets for answer buttons
- Clear visual feedback (selected, correct, wrong)
- Fun, vibrant colors

### 6.2 Key UI Elements
- Big countdown timer (circular or bar)
- Answer buttons (A, B, C, D style with colors)
- Animated leaderboard transitions
- Confetti or celebration for winners

---

## Phase 7: GitHub Pages Deployment

### 7.1 Configure Vite for GitHub Pages
- Set `base` in `vite.config.ts` to repo name
- Add deploy script to `package.json`

### 7.2 GitHub Actions (optional)
- Auto-deploy on push to main

---

## Files to Create (in order)

1. Initialize Vite project (command)
2. `tailwind.config.js` - Tailwind configuration
3. `src/index.css` - Global styles + Tailwind
4. `.env.local` - Firebase config (template)
5. `.gitignore` - Update with .env.local
6. `src/types/index.ts` - TypeScript interfaces
7. `src/firebase/config.ts` - Firebase initialization
8. `src/firebase/database.ts` - Database helpers
9. `src/hooks/useSession.ts` - Session hook
10. `src/hooks/usePlayers.ts` - Players hook
11. `src/hooks/useQuiz.ts` - Quiz hook
12. `src/components/shared/Timer.tsx`
13. `src/components/shared/Leaderboard.tsx`
14. `src/components/player/JoinGame.tsx`
15. `src/components/player/PlayerLobby.tsx`
16. `src/components/player/PlayerQuestion.tsx`
17. `src/components/player/PlayerResults.tsx`
18. `src/components/admin/AdminHome.tsx`
19. `src/components/admin/AdminLobby.tsx`
20. `src/components/admin/AdminQuestion.tsx`
21. `src/components/admin/AdminLeaderboard.tsx`
22. `src/App.tsx` - Main app with routing
23. `src/data/sample-quiz.json` - Demo content
24. `vite.config.ts` - Update for GitHub Pages

---

## Estimated Complexity
- ~20-25 files to create
- Core logic concentrated in hooks and database helpers
- UI components are relatively straightforward

Ready to build when approved!
