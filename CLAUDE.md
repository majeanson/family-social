# Family Social

A private family/friend relationship visualizer - PWA with local-first data storage.

## Tech Stack

- Next.js 16 (App Router, React Server Components)
- React 19, TypeScript (strict mode)
- Tailwind CSS v4, shadcn/ui
- Zustand for state management
- File System Access API + IndexedDB for local storage

## Development Principles

### Code Quality (Priority: Quality > Speed)

- **DRY**: Extract shared logic into hooks/utils, no copy-paste
- **Separation of Concerns**: Components handle UI, hooks handle logic, services handle I/O
- **Atomicity**: Small, focused functions/components (<150 lines)
- **Type Safety**: Strict TypeScript, Zod for runtime validation

### UI/UX Guidelines

- **Simplicity**: Minimal cognitive load, clear visual hierarchy
- **Information Density**: Important info upfront, no unnecessary clicks
- **Accessibility**: Semantic HTML, keyboard navigation, ARIA labels
- **Mobile-First**: Touch-friendly, responsive design

### Component Patterns

- Server Components for static content/layouts
- Client Components (`"use client"`) for interactivity
- Compound components for complex UI (Card, Dialog, etc.)
- Feature folders: `components/[feature]/` for related components

## File Organization

```
src/
├── app/           # Routes (App Router)
├── components/    # UI components
│   ├── ui/        # shadcn primitives
│   └── [feature]/ # Feature-specific
├── features/      # Business logic hooks
├── services/      # External I/O (file system, etc.)
├── stores/        # Zustand stores
├── types/         # TypeScript interfaces
└── lib/           # Utilities
```

## Data Storage

- No database - user owns their data locally
- Primary: File System Access API (desktop browsers)
- Fallback: IndexedDB (iOS/mobile)
- Always provide export/import JSON

## Common Commands

- `npm run dev` - Start development server
- `npm run build` - Production build
- `npm run lint` - Run ESLint
