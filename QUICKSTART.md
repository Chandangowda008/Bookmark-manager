# Quick Start Guide

Follow these steps to get your Smart Bookmark Manager up and running in 10 minutes!

## ⚡ Quick Setup Checklist

- [ ] Node.js 18+ installed
- [ ] Supabase account created
- [ ] Google Cloud project created
- [ ] Dependencies installed
- [ ] Database schema created
- [ ] Google OAuth configured
- [ ] Environment variables set
- [ ] App running locally

## 🏃 Step-by-Step

### 1. Install Dependencies (1 min)

```bash
npm install
```

### 2. Create Supabase Project (3 min)

1. Go to https://supabase.com
2. Click "New Project"
3. Fill in details:
   - Project Name: `bookmark-manager`
   - Database Password: (generate strong password)
   - Region: (choose closest to you)
4. Wait ~2 minutes for setup

### 3. Run Database Schema (1 min)

1. Open Supabase dashboard
2. Go to **SQL Editor** (left sidebar)
3. Click **New Query**
4. Copy entire contents of `supabase-schema.sql`
5. Paste and click **RUN**
6. Should see "Success" message

### 4. Setup Google OAuth (3 min)

**Get Credentials:**
1. Go to https://console.cloud.google.com/
2. Create new project
3. Go to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth Client ID**
5. If prompted, configure consent screen:
   - User Type: External
   - App name: Smart Bookmark Manager
   - User support email: your-email@gmail.com
   - Developer email: your-email@gmail.com
   - Click Save and Continue (skip optional fields)
6. Create OAuth Client:
   - Application type: Web application
   - Name: Bookmark Manager
   - Authorized redirect URIs: `https://yourproject.supabase.co/auth/v1/callback`
     - Replace `yourproject` with your Supabase project ref (found in Project Settings > API)
7. Copy **Client ID** and **Client Secret**

**Configure Supabase:**
1. In Supabase dashboard, go to **Authentication** > **Providers**
2. Find **Google** and toggle it ON
3. Paste **Client ID** and **Client Secret**
4. Click **Save**

### 5. Set Environment Variables (1 min)

1. Copy `.env.local.example` to `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```

2. Edit `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://yourproject.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

3. Get values from Supabase:
   - Go to **Settings** > **API**
   - Copy **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - Copy **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 6. Run the App (1 min)

```bash
npm run dev
```

Open http://localhost:3000

## ✅ Verify Everything Works

1. **Login Test:**
   - Click "Login with Google"
   - Should redirect to Google
   - After login, should land on /dashboard

2. **Add Bookmark Test:**
   - Title: "Google"
   - URL: "google.com"
   - Click "Add Bookmark"
   - Should appear in list below

3. **Realtime Test:**
   - Open http://localhost:3000/dashboard in a new tab
   - In first tab, add a bookmark
   - Should instantly appear in second tab

4. **Delete Test:**
   - Hover over a bookmark
   - Click trash icon
   - Should disappear from both tabs

5. **Privacy Test:**
   - Open app in incognito/private window
   - Login with different Google account
   - Should see empty list (not your bookmarks)

## 🚨 Troubleshooting

| Problem | Solution |
|---------|----------|
| "Invalid redirect URL" | Check Google OAuth redirect URI matches Supabase project URL |
| Can't login | Verify Google OAuth is enabled in Supabase Auth settings |
| No bookmarks appear | Check RLS policies are created (run schema.sql again) |
| Realtime not working | Enable Replication for bookmarks table in Supabase |
| Environment error | Ensure .env.local exists and has correct values |

## 🚀 Next Steps

- [ ] Customize the UI in `app/dashboard/page.tsx`
- [ ] Add bookmark folders/tags
- [ ] Implement search functionality
- [ ] Deploy to Vercel
- [ ] Share with friends!

## 📚 Need Help?

- Check the main [README.md](README.md) for detailed explanations
- Review [Supabase Docs](https://supabase.com/docs)
- Check [Next.js Docs](https://nextjs.org/docs)

---

**Total Setup Time: ~10 minutes** ⏱️
