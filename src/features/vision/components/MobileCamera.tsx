"use client";

import { useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Webcam from "react-webcam";
import { processImage, processImageFromFormData } from "../actions/process-image";
import { Button } from "@/components/ui/button";
import { Camera, X } from "lucide-react";

interface MobileCameraProps {
  userId: string;
  /** true: FAZ 3 – fotoğraf çek, library'ye kaydet, /reader?bookId= ile yönlendir */
  saveAndRedirect?: boolean;
  /** false iken: OCR metnini bu callback ile ver (inline flashcard için) */
  onTextExtracted?: (text: string) => void;
}

export function MobileCamera({
  userId,
  saveAndRedirect = false,
  onTextExtracted,
}: MobileCameraProps) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const webcamRef = useRef<{ getScreenshot: () => string | null } | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [status, setStatus] = useState<"idle" | "streaming" | "processing" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    setErrorMessage(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setStatus("streaming");
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Kamera açılamadı.");
    }
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setStatus("idle");
  }, []);

  const captureAndProcessInline = useCallback(async () => {
    if (!videoRef.current || status !== "streaming") return;
    setStatus("processing");
    setErrorMessage(null);

    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setStatus("streaming");
      setErrorMessage("Canvas hatası.");
      return;
    }
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    const base64 = dataUrl.split(",")[1] ?? "";

    const result = await processImage(base64, userId);
    setStatus("streaming");

    if (result.success && result.text) {
      onTextExtracted?.(result.text);
    } else {
      setErrorMessage(result.error ?? "Metin çıkarılamadı.");
    }
  }, [status, userId, onTextExtracted]);

  const captureAndSave = useCallback(async () => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (!imageSrc) return;

    setStatus("processing");
    setErrorMessage(null);

    try {
      const blob = await fetch(imageSrc).then((r) => r.blob());
      const formData = new FormData();
      formData.append("image", blob, "capture.jpg");

      const result = await processImageFromFormData(formData);
      setStatus("idle");

      if (result.success && result.documentId) {
        router.push(`/reader?bookId=${result.documentId}`);
      } else {
        setErrorMessage(result.error ?? "Bir hata oluştu.");
      }
    } catch {
      setErrorMessage("Bağlantı hatası. İnternet bağlantınızı kontrol edin.");
      setStatus("idle");
    }
  }, [router]);

  if (saveAndRedirect) {
    return (
      <div className="flex flex-col items-center gap-4 p-4">
        <div className="relative w-full max-w-md aspect-[3/4] rounded-lg overflow-hidden shadow-2xl bg-black">
          <Webcam
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            videoConstraints={{
              facingMode: "environment",
              width: 1280,
              height: 720,
            }}
            className="w-full h-full object-cover"
          />
        </div>

        {errorMessage && (
          <div className="w-full max-w-md flex items-center gap-2 rounded-lg border border-red-400 bg-red-100 px-4 py-3 text-red-700 dark:bg-red-950/30 dark:border-red-500 dark:text-red-300">
            <X className="h-5 w-5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <Button
          onClick={captureAndSave}
          disabled={status === "processing"}
          className="min-h-[44px] min-w-[44px] touch-manipulation w-full max-w-md"
        >
          <Camera className="mr-2 h-5 w-5" />
          {status === "processing" ? "İşleniyor..." : "Fotoğraf Çek ve Oku"}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="h-full w-full object-cover"
        />
        {status === "idle" && (
          <div className="absolute inset-0 flex items-center justify-center text-white/80">
            Kamera kapalı
          </div>
        )}
      </div>

      {errorMessage && (
        <p className="text-sm text-red-500" role="alert">
          {errorMessage}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        {status === "idle" && (
          <Button
            type="button"
            onClick={startCamera}
            className="min-h-[44px] min-w-[44px] touch-manipulation"
          >
            Kamerayı Aç
          </Button>
        )}
        {status === "streaming" && (
          <>
            <Button
              type="button"
              onClick={captureAndProcessInline}
              disabled={status === "processing"}
              className="min-h-[44px] min-w-[44px] touch-manipulation"
            >
              {status === "processing" ? "İşleniyor…" : "Metni Oku"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={stopCamera}
              className="min-h-[44px] min-w-[44px] touch-manipulation"
            >
              Kapat
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

export default MobileCamera;
