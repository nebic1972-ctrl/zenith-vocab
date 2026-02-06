/**
 * E-posta servisi - Resend API kullanır
 * Günlük hatırlatma, haftalık rapor vb. bildirimler
 */

import { Resend } from 'resend'
import DailyReminderEmail from '@/emails/DailyReminderEmail'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'Zenith Vocab <onboarding@resend.dev>'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

export interface DailyReminderPayload {
  userName: string
  dueWordsCount: number
  studyUrl: string
}

/**
 * Günlük kelime hatırlatması e-postası gönderir
 */
export async function sendDailyReminder(
  to: string,
  { userName, dueWordsCount, studyUrl }: DailyReminderPayload
): Promise<void> {
  const settingsUrl = `${APP_URL}/settings`

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: [to],
    subject: `🧠 ${dueWordsCount} kelime seni bekliyor!`,
    html: DailyReminderEmail({
      userName,
      dueWordsCount,
      studyUrl,
      settingsUrl
    })
  })

  if (error) {
    console.error('[emailService] Daily reminder gönderilemedi:', error)
    throw error
  }
}

export interface SendEmailOptions {
  to: string | string[]
  subject: string
  html: string
  text?: string
}

/**
 * Genel e-posta gönderimi
 */
export async function sendEmail(options: SendEmailOptions) {
  const { to, subject, html, text } = options
  const toArray = Array.isArray(to) ? to : [to]

  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: toArray,
    subject,
    html,
    text: text ?? undefined
  })

  if (error) {
    console.error('[emailService] E-posta gönderilemedi:', error)
    throw error
  }

  return data
}
