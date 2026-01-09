# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React Native mobile application built with Expo that implements a B2B e-commerce platform with phone-based OTP authentication. The app uses Supabase for backend services (authentication, database) and Twilio for SMS OTP delivery.

## Tech Stack

- **Frontend**: React Native with Expo Router (file-based routing)
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions)
- **SMS**: Twilio for OTP delivery
- **Storage**: AsyncStorage for session persistence
- **Language**: TypeScript

## Development Commands

```bash
# Start development server
npm start

# Run on specific platform
npm run android
npm run ios
npm run web
```

## Environment Configuration

The app requires environment variables to be configured before running:

1. Copy `.env.example` to `.env`
2. Set the following variables:
   - `EXPO_PUBLIC_SUPABASE_URL`: Your Supabase project URL
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon/public key

Environment variables are loaded via `app.config.js` using dotenv and exposed through `expo-constants`.

## Project Structure

```
src/app/
├── _layout.tsx              # Root layout with AuthProvider
├── index.tsx                # Entry point with auth routing logic
├── auth.tsx                 # Email/password auth (signup/login)
├── phone-auth.tsx           # OTP verification screen
├── registration.tsx         # User registration form
├── categories/              # Category browsing screens
├── (b2b)/                   # B2B-specific screens (route group)
├── cart.tsx                 # Shopping cart (modal)
└── lib/
    ├── auth-context.tsx     # Global auth state management
    ├── supabase.ts          # Supabase client initialization
    ├── api.ts               # API calls to Supabase Edge Functions
    └── config.ts            # App configuration from environment

supabase/
├── functions/               # Edge Functions (Deno runtime)
│   ├── send-otp/           # Sends OTP via Twilio
│   ├── verify-otp/         # Verifies OTP code
│   ├── check-email-exists/ # Checks if email is registered
│   └── delete-user/        # User deletion
└── migrations/
    └── 001_create_otp_table.sql  # OTP storage schema
```

## Authentication Flow

The app implements a two-factor authentication system:

1. **Email/Password Auth** (via Supabase Auth)
   - User signs up or logs in with email/password at `/auth`
   - Creates/validates Supabase session

2. **Phone Verification** (via OTP)
   - After email auth, user must verify phone number at `/phone-auth`
   - OTP sent via Twilio through `send-otp` Edge Function
   - OTP stored in `otp_verifications` table with 5-minute expiry
   - Verification happens through `verify-otp` Edge Function
   - Phone verification status saved to user metadata and AsyncStorage

3. **Auth State Management** (`auth-context.tsx`)
   - Manages session, user, and phone verification status globally
   - Persists phone verification in both AsyncStorage and user metadata
   - `useAuth()` hook provides auth state throughout the app

4. **Route Protection** (`index.tsx`)
   - No session → redirect to `/auth`
   - Session but no phone verification → redirect to `/phone-auth`
   - Both complete → redirect to `/categories`

## Supabase Edge Functions

Edge Functions run on Deno and require environment secrets to be configured:

**Required Secrets** (set via Supabase Dashboard or CLI):
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_PHONE_NUMBER`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

**Functions:**
- `send-otp`: Generates 6-digit OTP, stores in DB, sends via Twilio to Indian numbers (+91 prefix)
- `verify-otp`: Validates OTP code, updates user metadata with phone verification
- `check-email-exists`: Checks if email is already registered (with fallback logic)
- `delete-user`: Handles user account deletion

## Key Implementation Details

### Storage Strategy
- **Session persistence**: Supabase client uses AsyncStorage adapter (not SecureStore due to compatibility)
- **Phone verification**: Stored in both user metadata (source of truth) and AsyncStorage (for performance)
- On logout: Clears all Supabase-related AsyncStorage keys

### OTP Phone Number Format
- Expects 10-digit Indian phone numbers (no country code)
- Backend automatically adds +91 prefix when sending SMS via Twilio
- Validation: `/^\d{10}$/`

### Email Existence Check
- Primary: Uses `check-email-exists` Edge Function with service role
- Fallback: Client-side attempt using dummy password sign-in (when Edge Function unavailable)
- Returns ambiguous results for security (prevents user enumeration)

### Configuration Loading
- `app.config.js`: Loads `.env` via dotenv, exposes variables to Expo via `extra` field
- `src/app/lib/config.ts`: Retrieves config from `expo-constants` for runtime use

### Navigation Structure
- Expo Router with file-based routing
- Stack navigation defined in `_layout.tsx`
- Route groups like `(b2b)/` allow shared layouts without affecting URL structure
- Modal presentation for cart screen

## Working with This Codebase

### When modifying authentication:
- Update `auth-context.tsx` for state management changes
- Ensure phone verification persists to both AsyncStorage and user metadata
- Test the full flow: signup → OTP → main app
- Remember logout must clear both session and phone verification

### When adding new screens:
- Create files in `src/app/` (Expo Router auto-generates routes)
- Add screen configuration to `_layout.tsx` if needed
- Use `useAuth()` hook to access session and verification status
- Protect routes by checking session/phone verification in the component

### When modifying Edge Functions:
- Edge Functions use Deno (not Node.js) - syntax differences apply
- Environment variables accessed via `Deno.env.get()`
- CORS headers required for all responses
- Test with `supabase functions serve <function-name>` locally
- Deploy with `supabase functions deploy <function-name>`

### Database Schema:
- `otp_verifications` table: stores temporary OTP codes with expiry
- User data in Supabase Auth (email, password)
- Phone verification stored in user metadata: `user.user_metadata.phone_verified`
