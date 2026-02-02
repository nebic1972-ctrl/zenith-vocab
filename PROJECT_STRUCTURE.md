# Neuro Read Platform - Proje Yapısı

## Kök Dizin

```
neuro-read-platform/
├── .cursorrules
├── .eslintrc.json
├── .gitignore
├── components.json
├── next.config.js
├── package.json
├── package-lock.json
├── postcss.config.js
├── tailwind.config.ts
├── tsconfig.json
│
├── 📄 Dokümantasyon
│   ├── README.md
│   ├── DEPENDENCIES.md
│   ├── SETUP_RECIPE.md
│   └── TECHNICAL_REPORT.md
│
├── 📁 public/
│   ├── books/
│   │   ├── aesop.pdf
│   │   ├── aesop.txt
│   │   ├── jfk_moon.txt
│   │   ├── kafka.txt
│   │   ├── little_prince.txt
│   │   ├── mlk_dream.txt
│   │   ├── relativity.txt
│   │   └── why_we_sleep.txt
│   ├── icon-192.png
│   ├── icon-512.png
│   ├── pdf.worker.min.mjs
│   ├── sw.js
│   └── workbox-4754cb34.js
│
├── 📁 src/
│   ├── app/                    # Next.js App Router
│   ├── components/             # React bileşenleri
│   ├── core/                   # Çekirdek modüller
│   ├── data/                   # Veri kaynakları
│   ├── engines/                # Motorlar
│   ├── features/               # Özellik modülleri
│   ├── hooks/                  # React hooks
│   ├── lib/                    # Yardımcı kütüphaneler
│   ├── services/               # Servis katmanı
│   ├── store/                  # State yönetimi
│   ├── types/                  # TypeScript tipleri
│   ├── utils/                  # Yardımcı fonksiyonlar
│   └── middleware.ts
│
└── 📁 Supabase Migrations
    ├── supabase_migration_add_cover_and_storage.sql
    ├── supabase_migration_add_last_position.sql
    ├── supabase_migration_add_reading_stats.sql
    ├── supabase_migration_add_text_analysis.sql
    ├── supabase_migration_add_xp_level.sql
    ├── supabase_migration_anon_to_authenticated.sql
    ├── supabase_migration_enable_rls.sql
    ├── supabase_migration_fix_search_path.sql
    ├── supabase_migration_flashcards.sql
    ├── supabase_migration_game_scores.sql
    ├── supabase_migration_reading_progress.sql
    ├── supabase_migration_secure_insert_policies.sql
    └── supabase_migration_vocabulary.sql
```

## src/ Detaylı Yapı

### app/ (Next.js App Router)

```
app/
├── actions/
│   └── gameActions.ts
├── admin/
│   ├── actions.ts
│   ├── AdminBookForm.tsx
│   ├── AdminLibraryList.tsx
│   ├── dashboard/page.tsx
│   └── page.tsx
├── api/
│   ├── flashcard/route.ts
│   ├── health/route.ts
│   └── quiz/route.ts
├── arena/page.tsx
├── auth/
│   └── callback/route.ts
├── capture/
│   ├── CaptureView.tsx
│   └── page.tsx
├── dashboard/page.tsx
├── error.tsx
├── events/page.tsx
├── exercises/
│   ├── eye-tracking/page.tsx
│   ├── memory/page.tsx
│   ├── page.tsx
│   ├── saccadic/page.tsx
│   └── schulte/page.tsx
├── flashcards/page.tsx
├── gym/
│   ├── memory/page.tsx
│   ├── page.tsx
│   ├── saccade/page.tsx
│   └── schulte/page.tsx
├── leaderboard/page.tsx
├── library/page.tsx
├── login/page.tsx
├── manifest.ts
├── not-found.tsx
├── offline/page.tsx
├── page.tsx
├── profile/page.tsx
├── reader/
│   ├── layout.tsx
│   └── page.tsx
├── register/page.tsx
├── settings/page.tsx
├── useReadingStore.ts
└── vocabulary/
    ├── AddVocabularyCard.tsx
    ├── ExportVocabularyCSV.tsx
    ├── page.tsx
    ├── VocabularyList.tsx
    └── VocabularySearch.tsx
```

### components/

```
components/
├── auth/AuthProvider.tsx
├── dashboard/
│   ├── Achievements.tsx
│   ├── AISettings.tsx
│   ├── AnalyticsView.tsx
│   ├── CognitiveLeague.tsx
│   ├── DailyGoals.tsx
│   ├── DailyQuestCard.tsx
│   ├── EyeTracking.tsx
│   ├── Leaderboard.tsx
│   ├── LibraryGrid.tsx
│   ├── LibraryManager.tsx
│   ├── Marketplace.tsx
│   ├── PreFlightCheck.tsx
│   ├── SchulteTrainer.tsx
│   ├── StroopTest.tsx
│   └── UserProgress.tsx
├── exercises/
│   ├── EyeTrackingGame.tsx
│   └── MemoryGame.tsx
├── layout/
│   ├── BottomNav.tsx
│   ├── ClientLayout.tsx
│   └── Sidebar.tsx
├── library/
│   ├── AddBookModal.tsx
│   ├── AIQuizModal.tsx
│   ├── PDFUploader.tsx
│   ├── SentimentBadge.tsx
│   └── SummaryModal.tsx
├── marketing/LandingPage.tsx
├── onboarding/OnboardingModal.tsx
├── profile/
│   ├── ActivityHeatmap.tsx
│   ├── ProgressChart.tsx
│   └── ShareCard.tsx
├── reader/
│   ├── QuizModal.tsx
│   ├── ReaderDisplay.tsx
│   ├── ResultModal.tsx
│   ├── RSVPEngine.tsx
│   └── WarmUpSuggestion.tsx
├── reading-surface/
│   ├── index.ts
│   └── ReadingSurface.tsx
├── rsvp/
│   ├── ReaderModal.tsx
│   └── RSVPReader.tsx
├── shared/
│   ├── CommandMenu.tsx
│   ├── GlobalSettings.tsx
│   ├── PremiumModal.tsx
│   ├── PremiumPaywall.tsx
│   └── WeeklyRecapModal.tsx
├── ui/                    # shadcn/ui bileşenleri
│   ├── badge.tsx
│   ├── button.tsx
│   ├── card.tsx
│   ├── dialog.tsx
│   ├── input.tsx
│   ├── InstructionsModal.tsx
│   ├── label.tsx
│   ├── popover.tsx
│   ├── progress.tsx
│   ├── slider.tsx
│   ├── tabs.tsx
│   ├── textarea.tsx
│   └── toast.tsx
├── AIQuiz.tsx
├── AIQuizModal.tsx
├── AudioPlayer.tsx
├── CalibrationModal.tsx
├── CameraOCR.tsx
├── CognitiveLeague.tsx
├── CognitiveRadar.tsx
├── ConfirmationQuiz.tsx
├── CorporateAdminDashboard.tsx
├── DailyQuestCard.tsx
├── DiagnosticTest.tsx
├── Disclaimer.tsx
├── DisclaimerModal.tsx
├── ExerciseFooter.tsx
├── FileUploader.tsx
├── FocusController.tsx
├── GameInstructions.tsx
├── InsightEngine.tsx
├── JourneyMap.tsx
├── LandingPage.tsx
├── Leaderboard.tsx
├── LibraryManager.tsx
├── MeetingProcessor.tsx
├── mode-toggle.tsx
├── OfflineIndicator.tsx
├── PDFUploader.tsx
├── QuizModal.tsx
├── ReadingStats.tsx
├── RSVPReader.tsx
├── Scoreboard.tsx
├── SessionResult.tsx
├── SyncManager.tsx
├── TextPreview.tsx
├── theme-provider.tsx
└── UserProgress.tsx
```

### core/

```
core/
├── adaptive-engine/DifficultyScaler.ts
├── google/
│   ├── gemini.ts
│   └── vision.ts
├── index.ts
├── performance/TalentScout.ts
├── sensors/InputAdapter.ts
└── sentinel/AntiCheat.ts
```

### features/

```
features/
├── learning/
│   ├── actions/
│   │   ├── create-flashcard.ts
│   │   ├── delete-vocabulary.ts
│   │   ├── reading-progress.ts
│   │   ├── save-flashcard.ts
│   │   └── update-vocabulary.ts
│   └── components/
│       ├── FlashcardGenerator.tsx
│       ├── FlashcardModal.tsx
│       └── SelectionFlashcardButton.tsx
├── pwa/
│   └── components/
│       ├── PWAInstallPrompt.tsx
│       ├── ReadingReminderCard.tsx
│       └── ReadingReminderToast.tsx
└── vision/
    ├── actions/process-image.ts
    └── components/MobileCamera.tsx
```

### lib/

```
lib/
├── supabase/
│   ├── client.ts
│   ├── middleware.ts
│   └── server.ts
├── aiProvider.ts
├── ambientEngine.ts
├── date-utils.ts
├── db.ts
├── epubUtils.ts
├── examEngine.ts
├── gameScores.ts
├── league-system.ts
├── library.ts
├── nlpEngine.ts
├── ocrEngine.ts
├── pdfProcessor.ts
├── pdfUtils.ts
├── rank-system.ts
├── readability.ts
├── recapEngine.ts
├── supabase.ts
├── supabaseClient.ts
├── text-analysis.ts
├── toneAnalyzer.ts
├── ttsEngine.ts
└── utils.ts
```

### Diğer src/ Klasörleri

```
src/
├── data/genesisLibrary.ts
├── engines/
│   ├── .gitkeep
│   └── README.md
├── hooks/useVoiceControl.ts
├── services/
│   ├── ai.ts
│   └── gemini.ts
├── store/
│   ├── useNeuroStore.ts
│   └── useReadingStore.ts
├── types/index.ts
└── utils/fileParser.ts
```

## Özet

| Kategori | Açıklama |
|----------|----------|
| **Framework** | Next.js (App Router) |
| **UI** | React, Tailwind CSS, shadcn/ui |
| **Veritabanı** | Supabase |
| **AI** | Google Gemini |
| **Özellikler** | RSVP okuma, flashcard, kelime hazinesi, bilişsel egzersizler, PWA |
