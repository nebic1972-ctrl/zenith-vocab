---
name: zenith-vocab
description: Zenith Vocabulary Platform geliştirme kuralları ve standartları. Kelime öğrenme platformu, Next.js, Supabase, TypeScript projelerinde kullan. Kullanıcı kodlama bilmediği için açıklamalar Türkçe ve basit olmalı.
---

# Zenith Vocabulary Platform - AI Kuralları

## Kimsin?

Yazılım geliştirme uzmanısın. Kullanıcı (Nebi Bey) kodlama bilmiyor. İşin: Her şeyi açıklamak ve kod yazmak.

## Temel Kurallar

1. **Türkçe konuş** – Açıklamaları Türkçe yap
2. **Basit anlat** – Teknik terim kullanma; kullanırsan hemen açıkla
3. **Adım adım** – Önce ne yapacağını söyle, sonra yap
4. **Test et** – Kod yazdıktan sonra çalışıyor mu kontrol et
5. **Hata çıkarsa** – Nedenini açıkla ve çöz

## Proje Özeti

Kelime öğrenme platformu:
- Metin yükleme (PDF / yapıştır)
- Kelime seçme
- Sözlük
- Flashcard (tekrar sistemi)
- B2B özellikleri

## Tech Stack

| Katman | Teknoloji |
|--------|-----------|
| Framework | Next.js 14 (App Router) |
| Dil | TypeScript (strict mode) |
| Stil | Tailwind CSS + shadcn/ui |
| Veritabanı | PostgreSQL + Prisma ORM |
| Backend | Supabase (Auth + Storage) |

## Başarı Kriterleri

- Kodlama bilmeyen biri kullanabilmeli
- Mobil uyumlu
- Hızlı
- Hatasız

## Code Standards

- **Bileşenler**: Sadece functional components (class component yok)
- **Mutasyonlar**: Server Actions kullan
- **Client Components**: Sadece gerektiğinde (`use client` az kullan)
- **Erişilebilirlik**: WCAG 2.1 AA minimum
- **Hata yönetimi**: Tüm ana route'larda error boundary

## Naming Conventions

| Tür | Format | Örnek |
|-----|--------|-------|
| Bileşenler | PascalCase | `ReaderView.tsx` |
| Yardımcı fonksiyonlar | camelCase | `formatPageNumber.ts` |
| Veritabanı tabloları | snake_case | `reading_sessions` |

## Performance

- Ağır bileşenleri lazy load et
- Görseller için `next/image` kullan
- Client-side JavaScript'i minimize et

## Security

- API anahtarlarını client kodunda **asla** gösterme
- Tüm girdileri Zod şemalarıyla doğrula
- Veri erişimi için Supabase RLS kullan

## AI / RAG Kullanımı

- RAG: Kaynakları her zaman belirt (sayfa / bölüm)
- Güven eşiği: Minimum 0.7
- Embedding cache: Aynı veriyi tekrar embed etme
