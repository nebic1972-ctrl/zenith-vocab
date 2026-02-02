"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Plus, Trash2, BookOpen, Search, Filter, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PDFUploader } from "./PDFUploader";

interface LibraryManagerProps {
  userId: string;
  onSelectBook: (book: any) => void;
}

export function LibraryManager({ userId, onSelectBook }: LibraryManagerProps) {
  const [books, setBooks] = useState<any[]>([]);
  const [filteredBooks, setFilteredBooks] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  
  // FİLTRELEME & ARAMA STATE'LERİ
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Tümü");
  
  const [newBook, setNewBook] = useState({ title: "", content: "", category: "Genel" });
  const [isOpen, setIsOpen] = useState(false);

  // Kategoriler
  const categories = ["Tümü", "Genel", "Hikaye", "Akademik", "Kurgu Dışı"];

  useEffect(() => {
    fetchBooks();
  }, [userId]);

  // Arama veya Kategori değişince listeyi güncelle
  useEffect(() => {
    let result = books;

    // 1. Kategori Filtresi
    if (selectedCategory !== "Tümü") {
      result = result.filter(book => book.category === selectedCategory);
    }

    // 2. Arama Filtresi
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(book => 
        book.title.toLowerCase().includes(q) || 
        book.content.toLowerCase().includes(q)
      );
    }

    setFilteredBooks(result);
  }, [books, searchQuery, selectedCategory]);

  const fetchBooks = async () => {
    const { data, error } = await supabase
      .from("user_library")
      .select("*")
      .or(`user_id.eq.${userId},user_id.eq.demo_content`)
      .order("created_at", { ascending: false });
    
    if (data) {
      setBooks(data);
      setFilteredBooks(data); // İlk başta hepsi görünür
    }
  };

  const handleAddBook = async () => {
    if (!newBook.title.trim() || !newBook.content.trim()) {
      alert("Lütfen başlık ve metin giriniz.");
      return;
    }
    setIsUploading(true);
    const { error } = await supabase.from("user_library").insert([{
      user_id: userId,
      title: newBook.title,
      content: newBook.content,
      category: newBook.category,
      words_count: newBook.content.trim().split(/\s+/).length
    }]);

    if (!error) {
      setNewBook({ title: "", content: "", category: "Genel" });
      setIsOpen(false);
      fetchBooks();
    }
    setIsUploading(false);
  };

  const handleDelete = async (id: string, e: any) => {
    e.stopPropagation();
    if(!confirm("Silmek istediğine emin misin?")) return;
    await supabase.from("user_library").delete().eq("id", id);
    fetchBooks();
  };

  // PDF Yüklendiğinde çalışacak fonksiyon
  const handlePDFUpload = async (text: string, title: string) => {
    setIsUploading(true);
    // Doğrudan veritabanına kaydet
    const { error } = await supabase.from("user_library").insert([{
        user_id: userId,
        title: title,
        content: text,
        category: "Kurgu Dışı", // PDF'leri varsayılan bu kategoriye atalım
        words_count: text.split(/\s+/).length
    }]);

    if (!error) {
        fetchBooks(); // Listeyi yenile
    } else {
        alert("PDF kaydedilemedi: " + error.message);
    }
    setIsUploading(false);
  };

  return (
    <div className="space-y-8">
      {/* ÜST BAR: BAŞLIK + EKLE BUTONU */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-white bg-clip-text text-transparent">Nöro-Kütüphane</h2>
          <p className="text-zinc-500 text-sm mt-1">Beyin antrenmanınız için kategorize edilmiş içerikler.</p>
        </div>
        
        <div className="flex gap-2">
          <PDFUploader onTextExtracted={handlePDFUpload} />
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="bg-white text-black hover:bg-zinc-200 font-bold">
                <Plus className="w-4 h-4 mr-2" /> İçerik Ekle
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-950 border-zinc-800 text-white sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Kütüphaneye Ekle</DialogTitle>
              <DialogDescription className="text-zinc-400">
                Okumak istediğiniz metni veya kitabı buraya ekleyin.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <Input 
                placeholder="Başlık" 
                className="bg-zinc-900 border-zinc-700"
                value={newBook.title}
                onChange={(e) => setNewBook({...newBook, title: e.target.value})}
              />
              <Textarea 
                placeholder="Metni yapıştır..." 
                className="bg-zinc-900 border-zinc-700 h-32"
                value={newBook.content}
                onChange={(e) => setNewBook({...newBook, content: e.target.value})}
              />
              <div className="flex gap-2">
                {['Genel', 'Akademik', 'Hikaye', 'Kurgu Dışı'].map(cat => (
                  <button 
                    key={cat}
                    onClick={() => setNewBook({...newBook, category: cat})}
                    className={`px-3 py-1 rounded-full text-xs border transition ${newBook.category === cat ? 'bg-purple-500 border-purple-500 text-white' : 'border-zinc-700 text-zinc-400'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <Button onClick={handleAddBook} disabled={isUploading} className="w-full bg-white text-black font-bold">
                {isUploading ? "Kaydediliyor..." : "Kaydet"}
              </Button>
            </div>
          </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* ARAMA VE FİLTRELEME ÇUBUĞU */}
      <div className="flex flex-col md:flex-row gap-4 items-center bg-zinc-900/50 p-2 rounded-xl border border-zinc-800">
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <Input 
            placeholder="Kitap adı veya içerik ara..." 
            className="pl-9 bg-black/50 border-zinc-800 focus:border-purple-500 h-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat 
                  ? "bg-purple-600 text-white shadow-lg shadow-purple-900/20" 
                  : "bg-black/50 text-zinc-400 hover:bg-zinc-800 hover:text-white"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* KİTAP LİSTESİ */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 min-h-[300px]">
        {filteredBooks.map((book) => (
          <div 
            key={book.id} 
            className="group relative p-6 bg-zinc-900 border border-zinc-800 rounded-2xl hover:border-purple-500/50 hover:bg-zinc-900/80 transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex justify-between items-start mb-4">
                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${
                  book.category === 'Akademik' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 
                  book.category === 'Hikaye' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 
                  'bg-zinc-800 text-zinc-400 border-zinc-700'
                }`}>
                  {book.category}
                </span>
                <span className="text-xs text-zinc-500 flex items-center gap-1">
                   <BookOpen className="w-3 h-3"/> {book.words_count}
                </span>
              </div>
              <h3 className="font-bold text-lg text-white mb-2 line-clamp-2 leading-tight">{book.title}</h3>
              <p className="text-sm text-zinc-500 line-clamp-3">{book.content}</p>
            </div>
            
            <div className="mt-6 flex items-center justify-between pt-4 border-t border-zinc-800/50">
               <Button onClick={() => onSelectBook(book)} variant="secondary" className="h-8 text-xs font-bold bg-white text-black hover:bg-zinc-200">
                  Okumaya Başla
               </Button>
               {book.user_id !== 'demo_content' && (
                  <button onClick={(e) => handleDelete(book.id, e)} className="text-zinc-600 hover:text-red-500 transition p-2">
                    <Trash2 className="w-4 h-4" />
                  </button>
               )}
            </div>
          </div>
        ))}
        
        {filteredBooks.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-20 text-zinc-500 bg-zinc-900/20 rounded-2xl border border-dashed border-zinc-800">
             <Search className="w-10 h-10 mb-4 opacity-20"/>
             <p>Aradığınız kriterlere uygun içerik bulunamadı.</p>
             <Button variant="link" onClick={() => {setSearchQuery(""); setSelectedCategory("Tümü")}} className="text-purple-400">
                Filtreleri Temizle
             </Button>
          </div>
        )}
      </div>
    </div>
  );
}
