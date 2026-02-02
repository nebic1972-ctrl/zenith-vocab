# Neuro-Read

Enterprise-grade cognitive reading platform with adaptive difficulty and biophilic design.

## Philosophy

- **No-Nonsense UI**: Game-like feel without toy-like appearance. No fantasy elements.
- **Biophilic Design**: Natural colors (Slate, Teal, Sage) that enhance focus and reduce cognitive load.
- **Reality Transfer**: Skills developed here transfer to real-world reading scenarios.
- **Strict Standards**: No TODOs, no temporary solutions. Production-ready code.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript (Strict Mode)
- **UI**: Shadcn/ui + Tailwind CSS
- **State**: Zustand (Global) + TanStack Query (Server State)

## Architecture

### Core (`src/core/`)

- **Performance**: `TalentScout.ts` - WPM & comprehension tracking, fast-track detection
- **Adaptive Engine**: `DifficultyScaler.ts` - Zone of Proximal Development (ZPD) implementation
- **Sensors**: `InputAdapter.ts` - Unified input interface (Mouse, Touch, Eye-tracking)
- **Sentinel**: `AntiCheat.ts` - Silent observer for integrity

### Components (`src/components/`)

- **Reading Surface**: Focus-enhancing reading interface

## NeuroRead 2.0 (Vision + Gemini + PWA)

- **Capture** (`/capture`): Kamera ile sayfa/not fotoğrafı → OCR (Google Vision) → library’ye kayıt → Reader’da aç.
- **Kelimelerim** (`/vocabulary`): AI flashcard listesi, silme, “Yeni kart oluştur” (kelime + bağlam).
- **Reader’da Kart oluştur**: Mevcut kelime + çevre metinle tek kart (Gemini) → vocabulary.
- **PWA**: Manifest, service worker (next-pwa), “Uygulamayı yükle” banner, `/offline` fallback.
- **API**: Google Vision (OCR), Gemini (flashcard); Server Actions + rate limit (middleware).

Kurulum: `.env.local` (Supabase + `GOOGLE_CLOUD_VISION_API_KEY`, `GOOGLE_GEMINI_API_KEY`), Supabase migration’ları (`SETUP_RECIPE.md` §5). Sağlık: `GET /api/health`.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Code Standards

- Airbnb Style Guide
- TypeScript Strict Mode
- No `any` types
- Comprehensive error handling
- WCAG 2.1 compliant
