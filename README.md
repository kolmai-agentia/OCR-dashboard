# OCR Dashboard

A Next.js dashboard for monitoring OCR document processing with password protection and cost tracking.

## Quick Start

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your Supabase credentials
   ```

3. **Run development server**
   ```bash
   npm run dev
   ```

## Deployment

### Deploy to Vercel

1. Push code to GitHub
2. Import repository to [Vercel](https://vercel.com)
3. Add environment variables from `.env.example`
4. Deploy

## Features

- 🔒 Password-protected access
- 📊 Cost tracking (Gemini OCR, SerpAPI, Firecrawl)
- 🏢 Company management with tax ID support
- 📄 Document processing status
- ⚠️ API error notifications

## Tech Stack

- Next.js 15
- TypeScript
- Tailwind CSS
- Supabase
- Recharts