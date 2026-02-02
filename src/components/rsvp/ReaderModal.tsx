"use client";

import RSVPReader from "./RSVPReader";
import type { Library } from "@/types";

type ReaderModalProps = {
  libraryItem: Library | null;
  isOpen: boolean;
  onClose: () => void;
};

export default function ReaderModal({ libraryItem, isOpen, onClose }: ReaderModalProps) {
  if (!isOpen || !libraryItem) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90">
      <RSVPReader
        content={libraryItem.content_text}
        initialWpm={300}
        bookId={libraryItem.id}
        onClose={onClose}
      />
    </div>
  );
}
