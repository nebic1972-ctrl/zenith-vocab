#!/usr/bin/env node
/**
 * SQL dosyasını çalıştırmaya hazır hale getirir.
 * "#" ile başlayan satırları (örn. "# Dosya: ...") kaldırır - PostgreSQL bunları kabul etmez.
 * Kullanım: node scripts/run-sql-clean.js supabase_migration_collections_init_templates.sql
 * Çıktıyı Supabase SQL Editor'a yapıştırın veya: node scripts/run-sql-clean.js dosya.sql | pbcopy
 */

const fs = require('fs')
const path = require('path')

const file = process.argv[2]
if (!file) {
  console.error('Kullanım: node scripts/run-sql-clean.js <sql-dosyasi>')
  process.exit(1)
}

const filePath = path.isAbsolute(file) ? file : path.join(process.cwd(), file)
if (!fs.existsSync(filePath)) {
  console.error('Dosya bulunamadı:', filePath)
  process.exit(1)
}

let content = fs.readFileSync(filePath, 'utf8')
const lines = content.split('\n')
const cleaned = lines.filter((line) => {
  const trimmed = line.trim()
  return !trimmed.startsWith('#')
})
const output = cleaned.join('\n')
process.stdout.write(output)
