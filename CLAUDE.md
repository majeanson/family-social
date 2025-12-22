# Family Social

A private family/friend relationship visualizer - PWA with local-first data storage.

> For comprehensive project documentation, see [SUMMARY.md](./SUMMARY.md)

## Tech Stack

- Next.js 16 (App Router, React 19)
- TypeScript (strict mode)
- Tailwind CSS v4, shadcn/ui
- Zustand for state management
- File System Access API + IndexedDB for local storage

## Development Principles

### Code Quality (Priority: Quality > Speed)

- **DRY**: Extract shared logic into hooks/utils, no copy-paste
- **Separation of Concerns**: Components handle UI, hooks handle logic, services handle I/O
- **Atomicity**: Small, focused functions/components (<150 lines preferred)
- **Type Safety**: Strict TypeScript, Zod schemas for runtime validation

### UI/UX Guidelines

- **Simplicity**: Minimal cognitive load, clear visual hierarchy
- **Information Density**: Important info upfront, no unnecessary clicks
- **Accessibility**: Semantic HTML, keyboard navigation, ARIA labels
- **Mobile-First**: Touch-friendly, responsive breakpoints (sm/md/lg)

## File Organization

```
src/
├── app/           # Routes (App Router)
├── components/    # UI components
│   ├── ui/        # shadcn primitives
│   └── [feature]/ # Feature-specific (dashboard, events, people, settings)
├── features/      # Business logic hooks (use-*.ts)
├── services/      # External I/O (storage.ts)
├── stores/        # Zustand stores (data-store.ts)
├── types/         # TypeScript interfaces
└── lib/           # Utilities (date-utils, validation, etc.)
```

## Best Practices

### Components

- Use `"use client"` directive only where needed (interactivity)
- Create barrel exports (`index.ts`) for each component folder
- Keep components focused - extract when >150 lines
- Use compound components pattern (Card, Dialog compositions)
- Add `aria-hidden="true"` to decorative icons

### State Management

- Use Zustand with Immer for immutable updates
- Create feature hooks in `src/features/` for business logic
- Memoize expensive computations with `useMemo`
- Use selectors to prevent unnecessary re-renders

### Validation

- Validate all user inputs (email, phone, dates)
- Use Zod schemas for data import validation
- Provide clear error messages via toast notifications
- Validate on both client and import/export boundaries

### Styling

- Mobile-first approach: base styles, then `sm:`, `md:`, `lg:`
- Use Tailwind's color palette consistently
- Prefer `gap-*` over margins for spacing in flex/grid
- Use semantic color names (primary, muted, destructive)

### Accessibility

- All interactive elements need accessible names
- Use `aria-label` for icon-only buttons
- Include `sr-only` text for screen readers
- Support keyboard navigation in custom components

### Data Integrity

- Cascade deletes: removing a person cleans up relationships and events
- Deep merge settings to preserve nested defaults
- Filter orphaned references on data load
- Validate data format before import

## Common Patterns

### Adding a New Feature

1. Define types in `src/types/`
2. Add state/actions to `src/stores/data-store.ts`
3. Create feature hook in `src/features/use-[feature].ts`
4. Build components in `src/components/[feature]/`
5. Add page in `src/app/(main)/[feature]/page.tsx`

### Form Validation Pattern

```typescript
import { isValidEmail, isValidPhone, isValidBirthday } from "@/lib/utils";

// In form handler:
if (email && !isValidEmail(email)) {
  toast.error("Please enter a valid email address");
  return;
}
```

### Date Handling

```typescript
import { getBirthdayInfo, getNextOccurrence, getOrdinal } from "@/lib/date-utils";

// Use these utilities for consistent date calculations
const info = getBirthdayInfo(person.birthday);
const { daysUntil, isToday } = info;
```

## Data Storage

- No external database - user owns their data locally
- Primary: File System Access API (Chrome, Edge)
- Fallback: IndexedDB (Safari, Firefox, iOS)
- Temporary share links: Upstash Redis with TTL

## Commands

```bash
npm run dev      # Start development server
npm run build    # Production build
npm run lint     # Run ESLint
```

## Important Notes

- Never store sensitive data in git (use .env.local)
- Share links use cryptographically secure codes
- All data processing happens client-side
- PWA installable on all platforms
