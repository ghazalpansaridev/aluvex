# CLAUDE.md

## Context
B2B wholesale e-commerce app (Fittmart). Solo developer with web dev background. Spec-driven development - specs provided in `.context/opus/specs/`.

## Tech Stack
- **Frontend**: React Native + Expo Router (file-based routing) + TypeScript
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions/Deno, Storage)
- **State**: Zustand (global), React Query (server state)
- **Forms**: react-hook-form + zod
- **Lists**: FlashList for performance
- **SMS**: Twilio (OTP via Edge Functions)

## Commands
```bash
npm start          # Dev server
npm run ios        # iOS simulator
npm run android    # Android emulator
```

## Environment
Copy `.env.example` → `.env`. Required: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`

## Before Starting Work
1. **Check current structure** - List relevant directories; structure evolves per roadmap
2. **Read related files** - Understand existing patterns before adding/modifying code
3. **Follow the spec** - Implementation details are in the provided spec

## Code Style
```typescript
// Components: PascalCase.tsx
// Hooks: useFeatureName.ts
// Types: types.ts per feature or /types/index.ts
// API: feature.api.ts
// Exports: index.ts barrels
```

## Frontend Standards
- TypeScript strict - no `any` types where avoidable
- Functional components with hooks
- NativeWind or StyleSheet for styling
- Handle loading and error states for every async operation
- Test on both iOS and Android simulators

## Backend Standards (Supabase)
- SQL migrations in `/supabase/migrations/`
- RLS policies required for all tables
- Edge Functions use Deno runtime:
  - Environment: `Deno.env.get('VAR_NAME')`
  - CORS headers required for all responses
  - Test: `supabase functions serve <name>`
  - Deploy: `supabase functions deploy <name>`

## App-Specific Details
- **Phone format**: 10-digit Indian numbers, backend adds +91 prefix
- **Roles**: `retailer`, `admin`, `ops`, `sales` (stored in `user.user_metadata.role`)
- **Route groups**: `/(retailer)/`, `/(admin)/`, `/(ops)/`, `/(sales)/`

## UI/UX (when given design refs)
- Reference Material Design 3 + iOS HIG
- Adapt Dribbble refs to RN/Expo capabilities
- Prioritize: thumb-friendly, fast scanning, clear hierarchies

## Response Format
- Skip preamble, go direct to solution
- Code: complete + runnable
- File paths: always specify where code goes
- When multiple options: recommend ONE, explain briefly
- Large tasks: numbered steps with checkpoints

## Don'ts
- Don't over-engineer early
- Don't add libraries without clear need
- Don't refactor working code prematurely
- Don't skip error/loading states
