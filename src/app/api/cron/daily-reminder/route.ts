import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Resend Node.js modülleri (stream vb.) kullanır - dynamic import ile sadece Node.js runtime'da yüklenir
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      console.error('[cron/daily-reminder] SUPABASE_SERVICE_ROLE_KEY eksik')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    if (!process.env.RESEND_API_KEY) {
      console.error('[cron/daily-reminder] RESEND_API_KEY eksik')
      return NextResponse.json(
        { error: 'Email service not configured' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    const { data: users, error } = await supabase.rpc('get_users_for_daily_reminder')

    if (error) {
      console.error('Error getting users:', error)
      throw error
    }

    if (!users || users.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No users to remind at this hour',
        count: 0
      })
    }

    const studyUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/study`

    const { sendDailyReminder } = await import('@/lib/emailService')

    const results = await Promise.allSettled(
      users.map(async (user: { email: string; due_words_count: number; full_name?: string }) => {
        const userName = user.full_name || 'Kullanıcı'

        await sendDailyReminder(user.email, {
          userName,
          dueWordsCount: Number(user.due_words_count ?? 0),
          studyUrl
        })
      })
    )

    const successCount = results.filter(r => r.status === 'fulfilled').length
    const failCount = results.filter(r => r.status === 'rejected').length

    return NextResponse.json({
      success: true,
      message: `Sent ${successCount} reminders, ${failCount} failed`,
      total: users.length,
      successCount,
      failCount
    })
  } catch (error) {
    console.error('Error in daily reminder cron:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
