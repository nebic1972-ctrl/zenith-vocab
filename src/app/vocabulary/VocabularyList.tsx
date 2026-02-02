"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Pencil } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { deleteVocabularyItem } from "@/features/learning/actions/delete-vocabulary";
import { updateVocabularyItem } from "@/features/learning/actions/update-vocabulary";
import { toast } from "sonner";

interface VocabularyItem {
  id: string;
  word: string;
  definition: string;
  example_sentence: string | null;
  book_id: string | null;
  created_at: string;
}

export function VocabularyList({ items }: { items: VocabularyItem[] }) {
  const router = useRouter();
  const [flipped, setFlipped] = useState<Record<string, boolean>>({});
  const [deleting, setDeleting] = useState<Record<string, boolean>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDefinition, setEditDefinition] = useState("");
  const [editExample, setEditExample] = useState("");
  const [saving, setSaving] = useState(false);

  const toggleFlip = (id: string) => {
    setFlipped((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const openEdit = (item: VocabularyItem) => {
    setEditingId(item.id);
    setEditDefinition(item.definition);
    setEditExample(item.example_sentence ?? "");
  };

  const closeEdit = () => {
    setEditingId(null);
    setEditDefinition("");
    setEditExample("");
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    setSaving(true);
    const result = await updateVocabularyItem(editingId, {
      definition: editDefinition,
      example_sentence: editExample.trim() || null,
    });
    setSaving(false);
    if (result.success) {
      toast.success("Kart güncellendi.");
      closeEdit();
      router.refresh();
    } else {
      toast.error(result.error ?? "Güncellenemedi.");
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting((prev) => ({ ...prev, [id]: true }));
    const result = await deleteVocabularyItem(id);
    setDeleting((prev) => ({ ...prev, [id]: false }));
    if (result.success) {
      toast.success("Kart silindi.");
      router.refresh();
    } else {
      toast.error(result.error ?? "Silinemedi.");
    }
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <Card
          key={item.id}
          className="border-white/10 bg-[#111] overflow-hidden min-h-[44px] touch-manipulation cursor-pointer"
          onClick={() => toggleFlip(item.id)}
        >
          <CardHeader className="py-2 px-4 flex flex-row items-center justify-between space-y-0">
            <span className="text-xs text-gray-500">
              {new Date(item.created_at).toLocaleDateString("tr-TR")}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="min-h-[44px] min-w-[44px] touch-manipulation text-slate-400 hover:text-white hover:bg-white/10"
                onClick={(e) => {
                  e.stopPropagation();
                  openEdit(item);
                }}
                aria-label="Düzenle"
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="min-h-[44px] min-w-[44px] touch-manipulation text-red-400 hover:text-red-300 hover:bg-red-500/10"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(item.id);
                }}
                disabled={deleting[item.id]}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="py-2 px-4 pb-4">
            {flipped[item.id] ? (
              <div className="space-y-2">
                <p className="text-sm text-gray-300">{item.definition}</p>
                {item.example_sentence && (
                  <p className="text-xs text-gray-500 italic">&quot;{item.example_sentence}&quot;</p>
                )}
              </div>
            ) : (
              <p className="text-base font-medium text-white">{item.word}</p>
            )}
          </CardContent>
        </Card>
      ))}

      <Dialog open={!!editingId} onOpenChange={(open) => !open && closeEdit()}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle>Kartı düzenle</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-definition" className="text-slate-300">Tanım</Label>
              <Input
                id="edit-definition"
                value={editDefinition}
                onChange={(e) => setEditDefinition(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-example" className="text-slate-300">Örnek cümle (isteğe bağlı)</Label>
              <Input
                id="edit-example"
                value={editExample}
                onChange={(e) => setEditExample(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white"
                placeholder="Örnek cümle..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeEdit} className="border-slate-700 text-slate-300">
              İptal
            </Button>
            <Button onClick={handleSaveEdit} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
              {saving ? "Kaydediliyor..." : "Kaydet"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
