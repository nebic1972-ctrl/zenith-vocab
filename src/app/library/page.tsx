import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Clock, Plus, Trash2, Library, ArrowUpDown, Calendar, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LibraryBook {
  id: string;
  title: string;
  author: string | null;
  difficulty_level: string | null;
  content_text: string;
  cover_url: string | null;
  created_at: string;
}

type SortOption = "newest" | "recent" | "progress";

export default async function LibraryPage({
  searchParams,
}: {
  searchParams?: Promise<{ sort?: string }> | { sort?: string };
}) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const resolvedParams = await Promise.resolve((searchParams ?? {}) as { sort?: string } | Promise<{ sort?: string }>);
  const sortParam = resolvedParams?.sort;
  const sort: SortOption = sortParam === "recent" || sortParam === "progress" ? sortParam : "newest";

  // Kitapları çek
  const { data: booksRaw, error } = await supabase
    .from("library")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return <div className="p-8 text-red-500">Veri Hatası: {error.message}</div>;

  const bookIds = (booksRaw ?? []).map((b: { id: string }) => b.id);
  const progressMap: Record<string, number> = {};
  const updatedAtMap: Record<string, string> = {};
  if (bookIds.length > 0) {
    const { data: progressRows, error: progressError } = await supabase
      .from("reading_progress")
      .select("book_id, current_position, last_read_at")
      .eq("user_id", user.id)
      .in("book_id", bookIds);
    if (!progressError && progressRows) {
      for (const row of progressRows) {
        progressMap[row.book_id] = row.current_position ?? 0;
        if (row.last_read_at) updatedAtMap[row.book_id] = row.last_read_at;
      }
    }
  }

  // Sıralama
  const books = [...(booksRaw ?? [])].sort((a: LibraryBook, b: LibraryBook) => {
    const wordsA = a.content_text.split(" ").length;
    const wordsB = b.content_text.split(" ").length;
    const posA = progressMap[a.id] ?? 0;
    const posB = progressMap[b.id] ?? 0;
    const pctA = wordsA > 0 ? posA / wordsA : 0;
    const pctB = wordsB > 0 ? posB / wordsB : 0;
    const updatedA = updatedAtMap[a.id] ?? "";
    const updatedB = updatedAtMap[b.id] ?? "";

    if (sort === "newest") {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
    if (sort === "recent") {
      if (updatedB && !updatedA) return 1;
      if (updatedA && !updatedB) return -1;
      if (updatedA && updatedB) return new Date(updatedB).getTime() - new Date(updatedA).getTime();
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
    if (sort === "progress") {
      if (pctB !== pctA) return pctB - pctA;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
    return 0;
  });

  // Admin kontrolü
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const isAdmin = profile?.role === "admin";

  // SİLME AKSİYONU (sadece admin silebilir)
  async function deleteBook(formData: FormData) {
    "use server";
    const bookId = formData.get("bookId") as string;
    if (!bookId) return;

    const supabase = await createClient();
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) return;

    const { data: currentProfile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", currentUser.id)
      .single();

    if (currentProfile?.role !== "admin") return;

    const { error: deleteError } = await supabase.from("library").delete().eq("id", bookId);
    if (!deleteError) revalidatePath("/library");
  }

  return (
    <div className="container mx-auto p-8 min-h-screen">
      {/* BAŞLIK ALANI */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4 border-b border-slate-800 pb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-600/20 rounded-xl">
            <Library className="w-8 h-8 text-blue-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Kütüphane</h1>
            <p className="text-slate-400">Arşivinizdeki tüm eserler burada.</p>
          </div>
        </div>

        {isAdmin && (
          <Link href="/admin">
            <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/20 transition-all hover:scale-105">
              <Plus size={18} className="mr-2" /> Yeni Kitap Ekle
            </Button>
          </Link>
        )}
      </div>

      {/* SIRALAMA */}
      {books && books.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <span className="text-sm text-slate-500 flex items-center gap-1">
            <ArrowUpDown size={14} /> Sırala:
          </span>
          <Link
            href="/library?sort=newest"
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              sort === "newest" ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            En yeni eklenen
          </Link>
          <Link
            href="/library?sort=recent"
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
              sort === "recent" ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            <Calendar size={14} /> En son okunan
          </Link>
          <Link
            href="/library?sort=progress"
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
              sort === "progress" ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            <TrendingUp size={14} /> İlerleme yüksek
          </Link>
        </div>
      )}

      {/* KİTAP IZGARASI */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {books && books.length > 0 ? (
          books.map((book: LibraryBook) => (
            <Card
              key={book.id}
              className="bg-slate-900 border-slate-800 hover:border-blue-500/50 group overflow-hidden relative flex flex-col h-full transition-all duration-300 hover:shadow-2xl hover:shadow-blue-900/10 hover:-translate-y-1"
            >
              {/* SİLME BUTONU (Admin Only) */}
              {isAdmin && (
                <div className="absolute top-3 right-3 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <form action={deleteBook}>
                    <input type="hidden" name="bookId" value={book.id} />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="h-8 w-8 rounded-full shadow-lg hover:bg-red-600 bg-red-500/90 backdrop-blur-sm"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </form>
                </div>
              )}

              {/* GÖRSEL ALANI */}
              <div className="h-56 w-full relative bg-slate-950 flex items-center justify-center overflow-hidden">
                {book.cover_url ? (
                  <img
                    src={book.cover_url}
                    alt={book.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-700 group-hover:text-blue-500 transition-colors">
                    <BookOpen size={64} strokeWidth={1} />
                  </div>
                )}
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-80" />

                {/* Zorluk Rozeti (Resmin üstünde) */}
                <div className="absolute bottom-3 left-3">
                  <Badge
                    className={`
                    ${book.difficulty_level === "İleri" ? "bg-red-500/20 text-red-300 border-red-500/30" : book.difficulty_level === "Orta" ? "bg-amber-500/20 text-amber-300 border-amber-500/30" : "bg-green-500/20 text-green-300 border-green-500/30"} 
                    backdrop-blur-md border px-2 py-0.5
                  `}
                  >
                    {book.difficulty_level || "Genel"}
                  </Badge>
                </div>
              </div>

              <CardHeader className="flex-1 pb-2 pt-4">
                <CardTitle className="line-clamp-2 text-xl leading-tight text-slate-100 group-hover:text-blue-400 transition-colors font-semibold">
                  {book.title}
                </CardTitle>
                <p className="text-sm text-slate-400 font-medium">{book.author || "Bilinmiyor"}</p>
              </CardHeader>

              <CardContent className="space-y-3">
                <div className="flex items-center gap-4 text-xs text-slate-500 font-mono">
                  <span className="flex items-center gap-1 bg-slate-800/50 px-2 py-1 rounded">
                    <Clock size={12} />
                    ~{(book.content_text.split(" ").length / 200).toFixed(0)} dk
                  </span>
                  <span>{book.content_text.split(" ").length} Kelime</span>
                </div>
                {(() => {
                  const wordCount = book.content_text.split(" ").length;
                  const position = progressMap[book.id] ?? 0;
                  const progressPct = wordCount > 0 ? Math.min(100, (position / wordCount) * 100) : 0;
                  const hasProgress = position > 0;
                  if (!hasProgress) return null;
                  return (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-slate-400">
                        <span>İlerleme</span>
                        <span className="tabular-nums">{progressPct.toFixed(0)}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500/80 rounded-full transition-all"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>
                  );
                })()}
              </CardContent>

              <CardFooter className="pt-0 mt-auto pb-6 px-6">
                <Link href={`/reader?bookId=${book.id}`} className="w-full">
                  <Button className="w-full bg-slate-800 hover:bg-blue-600 text-white font-medium border border-slate-700 hover:border-blue-500 transition-all">
                    {(progressMap[book.id] ?? 0) > 0 ? "Kaldığı yerden devam" : "Okumaya Başla"}
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))
        ) : (
          <div className="col-span-full py-32 flex flex-col items-center justify-center text-center bg-slate-900/30 rounded-3xl border border-dashed border-slate-800">
            <div className="bg-slate-800/50 p-6 rounded-full mb-4">
              <BookOpen size={48} className="text-slate-600" />
            </div>
            <h3 className="text-2xl font-bold text-slate-300">Kütüphane Boş</h3>
            <p className="text-slate-500 mt-2 max-w-md mx-auto">
              Henüz sisteme hiç içerik yüklenmemiş. Admin panelinden ilk eseri ekleyerek başlayın.
            </p>
            {isAdmin && (
              <Link href="/admin" className="mt-6">
                <Button variant="outline">İlk Eseri Ekle</Button>
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
