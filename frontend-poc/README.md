# Frontend POC - OAuth Authentication

This is a proof-of-concept Next.js application demonstrating Google and GitHub OAuth authentication with account linking functionality.

## Features

- **Dual OAuth Support**: Login with GitHub or Google
- **Account Linking**: Connect both GitHub and Google accounts to a single user profile
- **Account Merging**: Automatically merge accounts when linking an already-connected provider
- **Session Management**: JWT-based authentication
- **Protected Routes**: Dashboard accessible only to authenticated users

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Create `.env.local` file:

```bash
cp .env.local.example .env.local
```

3. Update `.env.local` with your backend API URL (default: `http://localhost:3000`)

4. Run the development server:

```bash
npm run dev
```

5. Open [http://localhost:3001](http://localhost:3001) with your browser.

## Authentication Flow

### Initial Login

1. User arrives at the landing page
2. Chooses to login with GitHub or Google
3. Completes OAuth flow
4. Redirected to dashboard

### Account Linking

1. User logs in with one provider (e.g., Google)
2. From dashboard, clicks "Connect GitHub Account"
3. Completes GitHub OAuth flow
4. One of three scenarios occurs:
   - **Not Connected**: GitHub account is linked to current user
   - **Already Connected to Same User**: No action needed
   - **Connected to Different User**: Accounts are merged (keeping older account)

## Project Structure

```
frontend-poc/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx            # Landing page
│   │   ├── dashboard/
│   │   │   └── page.tsx        # Protected dashboard
│   │   └── auth/
│   │       └── error/
│   │           └── page.tsx    # OAuth error page
│   ├── components/
│   │   ├── AuthButtons.tsx     # Login buttons component
│   │   ├── AccountLinking.tsx  # Account linking component
│   │   └── UserProfile.tsx     # User profile display
│   └── lib/
│       └── auth.ts             # Auth utilities and API calls
├── package.json
├── tsconfig.json
├── next.config.js
└── tailwind.config.js
```

## API Integration

The frontend communicates with the backend API at `NEXT_PUBLIC_API_URL`:

- `GET /auth/github/url` - Get GitHub OAuth URL
- `GET /auth/google/url` - Get Google OAuth URL
- `GET /auth/github/link` - Get GitHub link URL for account linking
- `GET /auth/google/link` - Get Google link URL for account linking

## Tech Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Axios** - HTTP client

