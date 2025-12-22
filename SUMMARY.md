# Family Social - Project Summary

A private, local-first family and friend relationship visualizer built as a Progressive Web App. Users own their data completely - no account required, no cloud dependency.

## Core Philosophy

- **Privacy First**: All data stays on the user's device
- **User Ownership**: Export/import JSON at any time
- **No Lock-in**: Works offline, no account needed
- **Simplicity**: Minimal cognitive load, clear visual hierarchy

## Features

### People Management
- Add family members and friends with photos, contact info, birthdays
- Custom fields for flexible data capture
- Tag-based organization
- Quick review mode for updating incomplete profiles
- Share contact info via temporary links

### Relationship Tracking
- Define relationships between people (parent, sibling, spouse, friend, etc.)
- Automatic inverse relationships (if A is B's parent, B is A's child)
- Visual relationship indicators with customizable colors
- Family group detection via connected relationships

### Events & Milestones
- Track life events: weddings, graduations, births, moves, etc.
- Recurring annual events with reminders
- Custom event types
- Timeline and grid views

### Family Visualization
- Interactive force-directed graph
- Family grouping with distinct colors
- Pan, zoom, and navigate relationships visually
- Filter by family group

### Smart Reminders
- Birthday reminders with configurable timing
- Event reminders (same day, 1 day, 3 days, 1 week, 2 weeks before)
- Dashboard widgets for upcoming birthdays and events
- Toast notifications and banner alerts

### Form Sharing
- Create shareable forms to collect contact info
- QR code generation for easy sharing
- Temporary share links with expiration (1 hour, 24 hours, 7 days)
- Import responses directly as new people

### Customization
- Light/dark/system theme modes
- Theme presets (default, forest, ocean, sunset, lavender)
- Custom theme colors
- Family color customization
- Relationship color customization

## Technical Architecture

### Tech Stack
- **Framework**: Next.js 16 (App Router, React 19)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS v4 + shadcn/ui components
- **State**: Zustand with Immer for immutable updates
- **Storage**: File System Access API (desktop) / IndexedDB (mobile)
- **Backend**: Minimal - Upstash Redis for temporary share links only

### Project Structure
```
src/
├── app/                    # Next.js App Router pages
│   ├── (main)/            # Main app routes with shared layout
│   │   ├── dashboard/     # Dashboard with widgets
│   │   ├── events/        # Events management
│   │   ├── forms/         # Form template management
│   │   ├── graph/         # Relationship visualization
│   │   ├── person/[id]/   # Person profile pages
│   │   └── settings/      # App settings
│   ├── api/               # API routes (share functionality)
│   └── share/             # Public share form page
├── components/
│   ├── dashboard/         # Dashboard widgets
│   ├── events/            # Event components
│   ├── graph/             # Graph visualization
│   ├── layout/            # App layout (header, providers)
│   ├── people/            # People-related components
│   ├── relationships/     # Relationship UI components
│   ├── settings/          # Settings section cards
│   ├── sync/              # Cloud sync components
│   └── ui/                # shadcn/ui primitives
├── features/              # Business logic hooks
│   ├── use-birthday-reminders.ts
│   ├── use-event-reminders.ts
│   ├── use-family-groups.ts
│   └── use-primary-user.ts
├── lib/                   # Utilities
│   ├── date-utils.ts      # Date calculations, formatting
│   ├── form-encoding.ts   # Form template URL encoding
│   ├── mock-data.ts       # Demo data
│   ├── response-parser.ts # Form response parsing
│   ├── utils.ts           # General utilities
│   └── validation.ts      # Zod schemas
├── services/              # External I/O
│   └── storage.ts         # File/IndexedDB storage adapters
├── stores/                # Zustand stores
│   └── data-store.ts      # Main application state
└── types/                 # TypeScript interfaces
    ├── data-store.ts      # Store types, settings, defaults
    ├── event.ts           # Event types
    ├── form-template.ts   # Form template types
    ├── person.ts          # Person types
    └── relationship.ts    # Relationship types
```

### Data Model

**Person**
- Core fields: firstName, lastName, nickname, email, phone, birthday, photo
- Metadata: tags, notes, customFields, createdAt, updatedAt

**Relationship**
- Links two people with a type (parent, child, spouse, sibling, etc.)
- Stores both forward and reverse type for bidirectional queries
- Auto-detected family groups based on connected relationships

**FamilyEvent**
- Title, date, type (wedding, graduation, birth, etc.)
- Associated people (personIds array)
- Optional recurring flag with yearly frequency
- Custom reminder timing

**FormTemplate**
- Configurable fields for data collection
- Shareable via encoded URLs
- Response parsing for multiple formats

### Storage Strategy

1. **Primary**: File System Access API
   - User selects a JSON file location
   - Auto-saves on changes (debounced)
   - Full user control over data

2. **Fallback**: IndexedDB
   - For browsers without File System Access (iOS, Firefox)
   - Data persists in browser storage
   - Export available for backup

3. **Temporary**: Redis (Upstash)
   - Only for share links
   - TTL-based expiration (1h, 24h, 7d)
   - No permanent data storage

## Key Design Patterns

### Component Patterns
- **Compound Components**: Dialog, Select, Card compositions
- **Feature Folders**: Related components grouped together
- **Barrel Exports**: Clean imports via index.ts files

### State Management
- **Zustand + Immer**: Immutable updates with mutable syntax
- **Selector Hooks**: Feature-specific hooks for business logic
- **Derived State**: Memoized computations for performance

### Validation
- **Zod Schemas**: Runtime validation for imports
- **Form Validation**: Email, phone, birthday format checks
- **Type Safety**: Strict TypeScript throughout

### Accessibility
- Semantic HTML structure
- ARIA labels on interactive elements
- Keyboard navigation support
- Screen reader announcements

## Commands

```bash
npm run dev      # Start development server
npm run build    # Production build
npm run lint     # Run ESLint
npm run start    # Start production server
```

## Browser Support

- **Full Features**: Chrome, Edge (File System Access API)
- **Fallback Mode**: Safari, Firefox, iOS (IndexedDB)
- **PWA**: Installable on all platforms

## Security Considerations

- No user accounts or authentication required
- Share links use cryptographically secure random codes
- Temporary links expire automatically
- All data processing happens client-side
- Redis credentials in environment variables only

---

*Last updated: December 2024*
