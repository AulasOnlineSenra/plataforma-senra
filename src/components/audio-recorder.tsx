"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { Mic, Square, Trash2, Send, Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AudioRecorderProps {
  onSend: (blob: Blob, duration: number) => void;
  onCancel: () => void;
}

const MAX_DURATION_SEC = 300;

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

type RecorderState = "idle" | "recording" | "preview";

export function AudioRecorder({ onSend, onCancel }: AudioRecorderProps) {
  const [state, setState] = useState<RecorderState>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewDuration, setPreviewDuration] = useState(0);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const blobRef = useRef<Blob | null>(null);

  const cleanup = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    mediaRecorderRef.current = null;
    chunksRef.current = [];
  }, [previewUrl]);

  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
        },
      });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : MediaRecorder.isTypeSupported("audio/ogg;codecs=opus")
            ? "audio/ogg;codecs=opus"
            : "audio/mp4";

      const recorder = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 128000,
      });
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        blobRef.current = blob;
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
        setState("preview");
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setState("recording");
      setElapsed(0);

      timerRef.current = setInterval(() => {
        setElapsed((prev) => {
          if (prev + 1 >= MAX_DURATION_SEC) {
            recorder.stop();
            if (timerRef.current) clearInterval(timerRef.current);
            return MAX_DURATION_SEC;
          }
          return prev + 1;
        });
      }, 1000);
    } catch {
      onCancel();
    }
  }, [onCancel]);

  const stopRecording = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  const cancelRecording = useCallback(() => {
    cleanup();
    onCancel();
  }, [cleanup, onCancel]);

  const handleSend = useCallback(() => {
    if (blobRef.current) {
      onSend(blobRef.current, elapsed);
    }
  }, [onSend, elapsed]);

  const togglePreview = useCallback(() => {
    const audio = previewAudioRef.current;
    if (!audio || !previewUrl) return;

    if (isPreviewPlaying) {
      audio.pause();
      setIsPreviewPlaying(false);
    } else {
      audio.play();
      setIsPreviewPlaying(true);
    }
  }, [isPreviewPlaying, previewUrl]);

  const handlePreviewLoaded = useCallback(() => {
    const audio = previewAudioRef.current;
    if (audio) setPreviewDuration(audio.duration);
  }, []);

  // Auto-start recording when component mounts
  useEffect(() => {
    startRecording();
  }, [startRecording]);

  if (state === "recording") {
    return (
      <div className="flex items-center gap-2 w-full">
        <div className="flex items-center gap-2 flex-1">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
          </span>
          <span className="text-sm font-mono text-red-500 font-medium tabular-nums">
            {formatTime(elapsed)}
          </span>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted"
          onClick={cancelRecording}
          aria-label="Cancelar"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="icon"
          className="h-11 w-11 rounded-full bg-red-500 text-white hover:bg-red-600"
          onClick={stopRecording}
          aria-label="Parar gravação"
        >
          <Square className="h-4 w-4" fill="currentColor" />
        </Button>
      </div>
    );
  }

  if (state === "preview" && previewUrl) {
    return (
      <div className="flex items-center gap-2 w-full">
        <audio
          ref={previewAudioRef}
          src={previewUrl}
          preload="metadata"
          onLoadedMetadata={handlePreviewLoaded}
          onEnded={() => setIsPreviewPlaying(false)}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted"
          onClick={togglePreview}
          aria-label={isPreviewPlaying ? "Pausar" : "Reproduzir"}
        >
          {isPreviewPlaying ? (
            <Pause className="h-4 w-4" fill="currentColor" />
          ) : (
            <Play className="h-4 w-4 ml-0.5" fill="currentColor" />
          )}
        </Button>
        <div className="flex-1 min-w-0">
          <div className="h-1.5 w-full rounded-full bg-muted-foreground/20">
            <div className="h-full w-full rounded-full bg-primary" />
          </div>
          <span className="text-[11px] text-muted-foreground tabular-nums">
            {formatTime(previewDuration || elapsed)}
          </span>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted"
          onClick={cancelRecording}
          aria-label="Descartar"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="icon"
          className="h-11 w-11 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
          onClick={handleSend}
          aria-label="Enviar áudio"
        >
          <Send className="h-5 w-5" strokeWidth={2.4} />
        </Button>
      </div>
    );
  }

  return null;
}
