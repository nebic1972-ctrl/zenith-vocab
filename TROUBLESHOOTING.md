# Zenith Vocab - Sorun Giderme

## Tarayıcı Konsol Hataları

### "content.js" ve "listener indicated an asynchronous response"

Bu hatalar **Zenith Vocab uygulamasından değil**, tarayıcınızdaki bir **eklenti**den (örn. ArkSigner) gelir.

- `content.js: v2.0.3` – Eklenti scripti
- "A listener indicated an asynchronous response..." – Chrome eklenti mesajlaşma hatası

**Çözüm:** Bu eklentiyi sitede devre dışı bırakın veya hataları yok sayın. Uygulamanın çalışmasını etkilemez.

### favicon.ico 404

`/favicon.ico` isteği `/icon-192.png` adresine yönlendirilir. Eğer 404 alıyorsanız, son deploy'dan sonra cache temizleyin veya hard refresh (Ctrl+Shift+R) yapın.

### 500 Internal Server Error

- Vercel deploy loglarını kontrol edin
- Supabase bağlantısını ve `NEXT_PUBLIC_SUPABASE_*` ortam değişkenlerini doğrulayın
- `/api/health` endpoint'ini çağırarak API durumunu kontrol edin
