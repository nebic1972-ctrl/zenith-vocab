const fs = require('fs');
const path = require('path');
try {
  const envPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    const match = content.match(/NEXT_PUBLIC_GEMINI_API_KEY\s*=\s*(.+)/);
    const val = match ? match[1].trim().replace(/^["']|["']$/g, '') : '';
    console.log('GEMINI_API_KEY:', val ? 'EXISTS' : 'MISSING');
  } else {
    console.log('GEMINI_API_KEY: MISSING (.env.local not found)');
  }
} catch (e) {
  console.log('GEMINI_API_KEY: MISSING (error:', e.message + ')');
}
