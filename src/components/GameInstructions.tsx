"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";

export interface GameInstructionsProps {
  title: string;
  description: string;
  steps: string[];
}

export function GameInstructions({
  title,
  description,
  steps,
}: GameInstructionsProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-slate-400 hover:text-white gap-2"
          aria-label="Nasıl oynanır?"
        >
          <HelpCircle size={18} /> Nasıl Oynanır?
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-slate-900 border-slate-800 text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-blue-400">
            {title}
          </DialogTitle>
          <DialogDescription className="text-slate-400 text-base mt-2">
            {description}
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 space-y-3">
          {steps.map((step, index) => (
            <div
              key={index}
              className="flex items-start gap-3 p-3 rounded-lg bg-slate-950/50 border border-slate-800"
            >
              <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-xs font-bold">
                {index + 1}
              </span>
              <p className="text-sm text-slate-300">{step}</p>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
