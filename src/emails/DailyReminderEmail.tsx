export interface DailyReminderEmailProps {
  userName: string
  dueWordsCount: number
  studyUrl: string
  settingsUrl: string
}

export default function DailyReminderEmail({
  userName,
  dueWordsCount,
  studyUrl,
  settingsUrl
}: DailyReminderEmailProps): string {
  return `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Günlük Hatırlatma</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f6f9fc;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f6f9fc; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="padding: 32px 48px; border-bottom: 1px solid #e5e7eb;">
              <h1 style="margin: 0; font-size: 24px; font-weight: bold; color: #1f2937;">
                📚 Zenith Vocab
              </h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 32px 48px;">
              <h2 style="margin: 0 0 24px; font-size: 32px; font-weight: bold; color: #1f2937; line-height: 1.2;">
                Merhaba ${userName}! 👋
              </h2>
              
              <p style="margin: 0 0 16px; font-size: 16px; color: #4b5563; line-height: 1.6;">
                Bugün <strong style="color: #3b82f6; font-weight: bold;">${dueWordsCount} kelime</strong> tekrar etmen gerekiyor.
              </p>
              
              <p style="margin: 0 0 16px; font-size: 16px; color: #4b5563; line-height: 1.6;">
                Spaced Repetition algoritması bu kelimeleri tam zamanında hatırlatıyor. Şimdi çalışmak için en uygun zaman! 🚀
              </p>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 32px 0;">
                <tr>
                  <td align="center">
                    <a href="${studyUrl}" style="display: inline-block; background-color: #3b82f6; color: #ffffff; text-decoration: none; padding: 14px 24px; border-radius: 8px; font-size: 16px; font-weight: bold;">
                      🧠 Çalışmaya Başla
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Tip Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
                <tr>
                  <td style="background-color: #f3f4f6; border-radius: 8px; padding: 20px;">
                    <p style="margin: 0 0 8px; font-size: 14px; font-weight: bold; color: #1f2937;">
                      💡 İpucu
                    </p>
                    <p style="margin: 0; font-size: 14px; color: #6b7280; line-height: 1.5;">
                      Günde sadece 10-15 dakika çalışarak kelime dağarcığını sürekli geliştirebilirsin!
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 48px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; font-size: 14px; color: #9ca3af; line-height: 1.5;">
                Bu e-postayı almak istemiyorsan, <a href="${settingsUrl}" style="color: #3b82f6; text-decoration: underline;">ayarlardan</a> bildirimleri kapatabilirsin.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
}
