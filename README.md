# OCR Dashboard Deployment Guide

## 🎯 **IMPORTANT: Dashboard-Only Deployment**

This guide is for deploying **ONLY the dashboard folder** to Vercel, not the entire project.

## Local Development Setup

1. **Clone the repository and navigate to dashboard**
   ```bash
   git clone <your-repo-url>
   cd "OCR Kolmai/dashboard"
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` with your actual values:
   - `NEXT_PUBLIC_SUPABASE_URL`: https://your-project-ref.supabase.co
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: your-anon-key
   - `SUPABASE_SERVICE_ROLE_KEY`: your-service-role-key
   - `DATABASE_URL`: your-database-url
   - `NEXT_PUBLIC_DASHBOARD_PASSWORD`: your-chosen-password

4. **Run the development server**
   ```bash
   npm run dev
   ```

## Vercel Deployment (Dashboard Only)

### Prerequisites
- GitHub repository with your code
- Supabase project set up
- Vercel account (free tier works perfectly)

### Steps

1. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - **⚠️ CRITICAL**: Set **Root Directory** to `dashboard` (this deploys only the dashboard folder)
   - Framework: Next.js (auto-detected)

2. **Environment Variables**
   In Vercel dashboard under Settings → Environment Variables, add:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   DATABASE_URL=postgresql://postgres:your-password@db.your-project-ref.supabase.co:5432/postgres
   NEXT_PUBLIC_DASHBOARD_PASSWORD=your-chosen-password
   ```

3. **Deploy**
   - Vercel will build and deploy only the dashboard
   - Your dashboard will be live at `https://your-project.vercel.app`
   - The n8n workflows and database files stay in GitHub but won't be deployed

### Free Tier Limits
- **Vercel**: 100GB bandwidth, 1000 function invocations/day
- **Supabase**: 50MB database, 2GB bandwidth, 50k monthly active users
- **Perfect for**: Dashboard usage, small-medium teams

## Security Notes

- ✅ Environment variables are properly ignored by git
- ✅ Secrets are only stored in deployment environment  
- ✅ Password protection prevents unauthorized access
- ✅ RLS policies should be configured in Supabase

### GitIgnore Files Explained

There are TWO `.gitignore` files in this project:

1. **Root `.gitignore`** (`/OCR Kolmai/.gitignore`) - Protects the overall project
2. **Dashboard `.gitignore`** (`/OCR Kolmai/dashboard/.gitignore`) - **This is the important one for Vercel**

When Vercel deploys with Root Directory set to `dashboard`, it uses the dashboard's `.gitignore` file, which properly excludes `.env*` files. Your secrets are safe!

## Features

- 🔒 Password-protected dashboard with progressive timeouts
- 📊 Cost tracking for Gemini OCR, SerpAPI, and Firecrawl
- 🏢 Company management with tax ID support
- ⚠️ API error notifications from document processing
- 📱 Responsive design for mobile and desktop