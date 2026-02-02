// src/data/genesisLibrary.ts

export interface GenesisBook {
  id: string;
  title: string;
  author: string;
  category: 'fiction' | 'science' | 'speech';
  difficulty: number;
  req_level: number;
  file_path: string;
  cover_color: string;
}

export const GENESIS_LIBRARY: GenesisBook[] = [
  // --- HİKAYELER (FICTION) ---
  {
    id: "fic_001",
    title: "Tavşan ile Kaplumbağa",
    author: "Ezop Masalları",
    category: "fiction",
    difficulty: 1,
    req_level: 1,
    file_path: "books/aesop.txt",
    cover_color: "from-green-400 to-emerald-600"
  },
  {
    id: "fic_002",
    title: "Küçük Prens (Özet)",
    author: "Antoine de Saint-Exupéry",
    category: "fiction",
    difficulty: 2,
    req_level: 3,
    file_path: "books/little_prince.txt",
    cover_color: "from-yellow-400 to-orange-500"
  },
  {
    id: "fic_003",
    title: "Dönüşüm",
    author: "Franz Kafka",
    category: "fiction",
    difficulty: 4,
    req_level: 5,
    file_path: "books/kafka.txt",
    cover_color: "from-red-400 to-rose-600"
  },

  // --- BİLİM (SCIENCE) ---
  {
    id: "sci_001",
    title: "Neden Uyuruz?",
    author: "Matthew Walker",
    category: "science",
    difficulty: 2,
    req_level: 1,
    file_path: "books/why_we_sleep.txt",
    cover_color: "from-blue-400 to-indigo-600"
  },
  {
    id: "sci_002",
    title: "İzafiyet Teorisi",
    author: "Albert Einstein",
    category: "science",
    difficulty: 5,
    req_level: 7,
    file_path: "books/relativity.txt",
    cover_color: "from-purple-400 to-violet-600"
  },

  // --- KONUŞMALAR (SPEECH) ---
  {
    id: "spc_001",
    title: "Ay'a Gitmeyi Seçiyoruz",
    author: "J.F. Kennedy",
    category: "speech",
    difficulty: 3,
    req_level: 2,
    file_path: "books/jfk_moon.txt",
    cover_color: "from-gray-400 to-slate-600"
  },
  {
    id: "spc_002",
    title: "I Have a Dream",
    author: "Martin Luther King Jr.",
    category: "speech",
    difficulty: 3,
    req_level: 4,
    file_path: "books/mlk_dream.txt",
    cover_color: "from-amber-400 to-yellow-600"
  }
];

// 🔥 YENİ EKLENEN AKILLI FONKSİYON
export const getGenesisBookBySlug = (slug: string): GenesisBook | undefined => {
  // "genesis_" önekini kaldırıp temiz ID ile arama yap
  const cleanId = slug.replace('genesis_', '');
  return GENESIS_LIBRARY.find(b => b.id === cleanId);
};