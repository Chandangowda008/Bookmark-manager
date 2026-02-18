# 🔖 Smart Bookmark Manager

A modern, real-time bookmark management application built with Next.js 14 and Supabase. Save, organize, and sync your bookmarks instantly across multiple devices and browser tabs.

## ✨ Features

- **🔐 Secure Authentication**: Google OAuth integration via Supabase Auth
- **⚡ Real-time Sync**: Changes instantly reflect across all open tabs/devices
- **🔒 Privacy First**: Row Level Security ensures your bookmarks are 100% private
- **🎨 Clean UI**: Modern, responsive design with Tailwind CSS and dark mode support
- **🚀 Fast & Scalable**: Built on Next.js 14 App Router and Supabase
- **📱 Responsive**: Works seamlessly on desktop, tablet, and mobile

## 🛠️ Tech Stack

- **Frontend Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Backend/Database**: [Supabase](https://supabase.com/)
  - PostgreSQL Database
  - Authentication (Google OAuth)
  - Real-time Subscriptions
  - Row Level Security (RLS)

## 🚀 Live Demo

[Live Demo](#) _(Deploy your own and add the link here)_

## 📦 Repository

[GitHub Repository](#) _(Add your repository link here)_

## 🏁 Getting Started

### Prerequisites

Before you begin, ensure you have:

- **Node.js** 18.17 or later
- **npm** or **yarn** or **pnpm**
- A **Supabase account** (free tier available at [supabase.com](https://supabase.com))
- A **Google Cloud Project** for OAuth credentials

### Step 1: Clone the Repository

```bash
git clone <your-repo-url>
cd smart-bookmark-manager
```

### Step 2: Install Dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### Step 3: Set Up Supabase

#### 3.1 Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Create a new project
4. Wait for the database to be ready (takes ~2 minutes)

#### 3.2 Run SQL Schema

1. In your Supabase dashboard, go to the **SQL Editor**
2. Open the `supabase-schema.sql` file from this project
3. Copy all the SQL code
4. Paste it into the SQL Editor
5. Click **RUN** to execute

This will:
- Create the `bookmarks` table
- Enable Row Level Security (RLS)
- Create security policies
- Enable Realtime subscriptions

#### 3.3 Enable Google OAuth

1. Go to **Authentication** > **Providers** in your Supabase dashboard
2. Find **Google** and toggle it ON
3. You'll need to configure Google OAuth credentials:

**Get Google OAuth Credentials:**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing)
3. Go to **APIs & Services** > **Credentials**
4. Click **+ CREATE CREDENTIALS** > **OAuth 2.0 Client ID**
5. Configure OAuth consent screen if prompted
6. Application type: **Web application**
7. Add Authorized redirect URI:
   ```
   https://<your-project-ref>.supabase.co/auth/v1/callback
   ```
   _(Find your project ref in Supabase settings)_
8. Copy **Client ID** and **Client Secret**

**Add to Supabase:**

1. Back in Supabase, paste your **Client ID** and **Client Secret**
2. Click **Save**

### Step 4: Configure Environment Variables

1. Copy the example environment file:

```bash
cp .env.local.example .env.local
```

2. Open `.env.local` and add your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

**Where to find these:**
- Go to your Supabase project
- Navigate to **Settings** > **API**
- Copy **Project URL** and **anon public** key

### Step 5: Run the Development Server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
smart-bookmark-manager/
├── app/
│   ├── dashboard/
│   │   └── page.tsx          # Dashboard with bookmark CRUD
│   ├── globals.css            # Global styles
│   ├── layout.tsx             # Root layout
│   └── page.tsx               # Login page
├── lib/
│   └── supabase.ts            # Supabase client configuration
├── supabase-schema.sql        # Database schema & RLS policies
├── .env.local.example         # Environment variables template
├── next.config.js             # Next.js configuration
├── tailwind.config.ts         # Tailwind CSS configuration
├── tsconfig.json              # TypeScript configuration
├── package.json               # Dependencies
└── README.md                  # This file
```

## 🔐 How Authentication Works

1. User visits the app (/)
2. Clicks "Login with Google"
3. Redirected to Google OAuth consent screen
4. After approval, Google redirects to Supabase
5. Supabase validates the token and creates a session
6. User is redirected to /dashboard
7. Session is persisted in localStorage
8. Subsequent visits skip login if session is valid

**Session Management:**
- Sessions are stored in browser localStorage
- Auto-refresh tokens before expiry
- Sessions persist across page refreshes
- Sign out clears the session

## 🔒 How Row Level Security (RLS) Works

RLS is a PostgreSQL feature that restricts which rows users can access based on policies.

### Without RLS (Insecure):
```sql
SELECT * FROM bookmarks;
-- Returns ALL bookmarks from ALL users ❌
```

### With RLS (Secure):
```sql
SELECT * FROM bookmarks;
-- Returns ONLY current user's bookmarks ✅
```

### Our RLS Policies:

1. **SELECT Policy**: Users can only view their own bookmarks
   ```sql
   auth.uid() = user_id
   ```

2. **INSERT Policy**: Users can only create bookmarks for themselves
   ```sql
   auth.uid() = user_id
   ```

3. **DELETE Policy**: Users can only delete their own bookmarks
   ```sql
   auth.uid() = user_id
   ```

**Key Points:**
- `auth.uid()` returns the current user's ID (from JWT token)
- If no user is authenticated, `auth.uid()` returns NULL
- RLS is enforced at the database level, not in application code
- Even if someone hacks the frontend, they can't access other users' data

## ⚡ How Real-time Works

Real-time sync is powered by Supabase's **Postgres Changes** feature.

### Architecture:

```
Browser Tab 1                    Supabase Database                    Browser Tab 2
     |                                  |                                  |
     |-- INSERT bookmark -->      [Database]                              |
     |                                  |                                  |
     |                          [Realtime Engine]                          |
     |                                  |                                  |
     |                                  |-- BROADCAST INSERT event -->     |
     |                                  |                                  |
     |                                  |                     [Update UI automatically]
```

### Implementation:

```typescript
// Subscribe to changes
supabase
  .channel('bookmarks-changes')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'bookmarks'
  }, (payload) => {
    // New bookmark added - update UI
    setBookmarks(current => [payload.new, ...current])
  })
  .subscribe()
```

### What this means:
- Open the app in 2+ tabs
- Add a bookmark in Tab 1
- See it instantly appear in Tab 2
- No manual refresh needed
- Works across different devices too (same user)

### How it works:
1. Client subscribes to database changes via WebSocket
2. When a row is inserted/updated/deleted, database triggers an event
3. Supabase broadcasts event to all subscribed clients
4. Clients update their UI automatically

## 🚨 Problems Faced During Development & Solutions

### Problem: "supabaseUrl is required" Build Error

**What Happened:**
During the Vercel deployment, the build failed with:
```
Error: supabaseUrl is required.
at new cd (.next/server/chunks/ssr/_9b88919e._.js:37:43440)
```

**Root Cause:**
- The Supabase client was being initialized at the top level of the module
- During Next.js build, environment variables weren't available yet
- The Supabase library validates the URL immediately, causing a crash

**Solution Implemented:**
1. **Lazy Initialization**: Deferred Supabase client creation to runtime (when it's first accessed)
   ```typescript
   let supabaseClient: SupabaseClient | null = null
   
   function initSupabase(): SupabaseClient {
     if (!supabaseClient) {
       supabaseClient = createClient(supabaseUrl, supabaseAnonKey)
     }
     return supabaseClient
   }
   ```

2. **Proxy Pattern**: Used a Proxy to transparently initialize on first property access
   ```typescript
   export const supabase = new Proxy<SupabaseClient>(
     {} as SupabaseClient,
     {
       get: (target, prop) => {
         if (!supabaseClient) supabaseClient = initSupabase()
         return (supabaseClient as any)[prop]
       }
     }
   )
   ```

3. **Result**: Build now succeeds and client initializes when first used in the browser

---

### Problem: "Configuration Error - Missing Supabase Variables" at Runtime

**What Happened:**
App deployed successfully but showed error in browser:
```
Configuration Error
Missing Supabase configuration. Please set environment variables.
```

**Root Cause:**
- Environment variables checked with `process.env` inside client components
- At runtime in the browser, `process.env` is empty (only available at build time)
- Even though we set environment variables in Vercel, the checks failed

**Solution Implemented:**
1. **Removed Runtime Checks**: Deleted `process.env` checks from client components
2. **Rely on Build Time**: Environment variables are embedded into the JavaScript bundle during build by Next.js
3. **Added `.env.production`**: File with credentials for local/backup builds
4. **Error Handling**: Only throw errors when Supabase client is actually used, not on component mount

---

### Problem: OAuth Redirect to Localhost Instead of Vercel

**What Happened:**
After Google login:
- Expected: Redirect to `https://bookmark-manager-73r7.vercel.app/dashboard`
- Actual: Redirected to `http://localhost:3000/dashboard` (invalid)

**Root Cause:**
- Initial code had hardcoded localhost redirect
- Vercel URL not configured in Supabase OAuth settings
- Google OAuth callback didn't recognize the Vercel domain

**Solution Implemented:**
1. **Dynamic Redirect URL**:
   ```typescript
   redirectTo: `${window.location.origin}/dashboard`
   ```
   This automatically uses the current domain (Vercel or localhost)

2. **Supabase Configuration**:
   - Added Vercel URL to Supabase's "URL Configuration" → "Redirect URLs"
   - Updated Google OAuth to include the new Vercel domain

---

### Problem: TypeScript Errors in Dashboard Component

**What Happened:**
TypeScript compilation failed with:
```
No overload matches this call.
Type '{ user_id: any; title: string; url: string; }[]' is not assignable to parameter type 'never'.
```

**Root Cause:**
- Supabase client was not properly typed
- TypeScript couldn't infer the correct types for database operations
- Using `Proxy` without proper type annotations confused the type system

**Solution Implemented:**
1. **Imported SupabaseClient Type**:
   ```typescript
   import { createClient, type SupabaseClient } from '@supabase/supabase-js'
   ```

2. **Properly Typed Proxy**:
   ```typescript
   export const supabase = new Proxy<SupabaseClient>(
     {} as SupabaseClient,
     {
       get: (target, prop: string | symbol) => {
         if (!supabaseClient) {
           supabaseClient = initSupabase()
         }
         return (supabaseClient as any)[prop]
       }
     }
   ) as ReturnType<typeof createClient>
   ```

3. **Removed Unused Validation**: Removed redundant `validateSupabaseConfig()` that wasn't needed

---

## 🚨 Common Problems & Solutions (General Troubleshooting)


### Problem 1: "Invalid redirect URL" error

**Cause**: Google OAuth redirect URI not configured correctly

**Solution**:
1. Check your Google Cloud Console
2. Ensure redirect URI is exactly:
   ```
   https://<your-project-ref>.supabase.co/auth/v1/callback
   ```
3. Note: It's `.supabase.co`, not `.supabase.com`

---

### Problem 2: Real-time not working

**Cause**: Realtime not enabled for the table

**Solution**:
1. Go to Supabase dashboard
2. Navigate to **Database** > **Replication**
3. Ensure `bookmarks` table is checked
4. Or run in SQL Editor:
   ```sql
   ALTER PUBLICATION supabase_realtime ADD TABLE bookmarks;
   ```

---

### Problem 3: "Missing environment variables" error

**Cause**: `.env.local` file not created or has wrong values

**Solution**:
1. Copy `.env.local.example` to `.env.local`
2. Get correct values from Supabase dashboard (**Settings** > **API**)
3. Restart development server after changing env variables

---

### Problem 4: Can see other users' bookmarks

**Cause**: RLS policies not applied correctly

**Solution**:
1. Go to Supabase **SQL Editor**
2. Run:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'bookmarks';
   ```
3. Should show 4 policies (SELECT, INSERT, UPDATE, DELETE)
4. If missing, re-run `supabase-schema.sql`

---

### Problem 5: "Failed to fetch" error on login

**Cause**: Supabase URL or Anon Key incorrect

**Solution**:
1. Double-check `.env.local` values
2. Ensure no extra spaces or quotes
3. Verify in Supabase dashboard (**Settings** > **API**)
4. Restart dev server

---

### Problem 6: Dark mode not working

**Cause**: Browser/OS dark mode preference

**Solution**:
- The app automatically detects system dark mode preference
- Change your OS/browser dark mode settings
- If you want to add a manual toggle, modify `app/layout.tsx`

## 🚀 Deployment

### Deploy to Vercel (Recommended)

1. Push your code to GitHub

2. Go to [vercel.com](https://vercel.com)

3. Click **New Project**

4. Import your repository

5. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

6. Click **Deploy**

7. Update Google OAuth redirect URI:
   ```
   https://your-app.vercel.app/dashboard
   ```

### Deploy to Other Platforms

This app can be deployed to any platform that supports Next.js 14:
- **Netlify**: Use Next.js runtime
- **Railway**: Set Node.js 18+
- **Render**: Configure build command `npm run build`
- **Cloudflare Pages**: Enable Node.js compatibility

## 📚 Learn More

### Next.js Resources
- [Next.js Documentation](https://nextjs.org/docs)
- [App Router Guide](https://nextjs.org/docs/app)

### Supabase Resources
- [Supabase Documentation](https://supabase.com/docs)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Realtime Guide](https://supabase.com/docs/guides/realtime)

### TypeScript Resources
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Powered by [Supabase](https://supabase.com/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)

## 📧 Contact

Questions? Feel free to reach out!

---

**Made with ❤️ using Next.js and Supabase**
