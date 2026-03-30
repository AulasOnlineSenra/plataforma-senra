"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { Play, Pause, AlertCircle } from "lucide-react";

interface AudioPlayerProps {
  src: string;
  isMine: boolean;
  duration?: number;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function AudioPlayer({ src, isMine, duration: initialDuration }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(initialDuration || 0);
  const [hasError, setHasError] = useState(false);
  const progressBarRef = useRef<HTMLDivElement>(null);

  const togglePlay = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio || hasError) return;

    try {
      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
      } else {
        await audio.play();
        setIsPlaying(true);
      }
    } catch {
      setHasError(true);
      setIsPlaying(false);
    }
  }, [isPlaying, hasError]);

  const handleTimeUpdate = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    setCurrentTime(audio.currentTime);
  }, []);

  const handleLoadedMetadata = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    setDuration(audio.duration);
    setHasError(false);
  }, []);

  const handleEnded = useCallback(() => {
    setIsPlaying(false);
    setCurrentTime(0);
  }, []);

  const handleError = useCallback(() => {
    setHasError(true);
    setIsPlaying(false);
  }, []);

  const handleProgressClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const audio = audioRef.current;
      const bar = progressBarRef.current;
      if (!audio || !bar || !duration) return;

      const rect = bar.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const pct = Math.max(0, Math.min(1, x / rect.width));
      audio.currentTime = pct * duration;
      setCurrentTime(audio.currentTime);
    },
    [duration],
  );

  // Sync state if audio is paused externally (e.g. by another AudioPlayer)
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onPause = () => setIsPlaying(false);
    const onPlay = () => setIsPlaying(true);

    audio.addEventListener("pause", onPause);
    audio.addEventListener("play", onPlay);

    return () => {
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("play", onPlay);
    };
  }, []);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const barColor = isMine
    ? "bg-primary-foreground/30"
    : "bg-muted-foreground/20";
  const progressColor = isMine
    ? "bg-primary-foreground"
    : "bg-primary";
  const iconColor = isMine
    ? "text-primary-foreground"
    : "text-primary";

  if (hasError) {
    return (
      <div className="flex items-center gap-2 min-w-[200px] max-w-[280px] opacity-70">
        <AlertCircle className="h-4 w-4" />
        <span className="text-xs">Áudio indisponível</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 min-w-[200px] max-w-[280px]">
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onError={handleError}
      />

      <button
        type="button"
        onClick={togglePlay}
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors ${
          isMine
            ? "bg-primary-foreground/20 hover:bg-primary-foreground/30"
            : "bg-primary/10 hover:bg-primary/20"
        }`}
        aria-label={isPlaying ? "Pausar" : "Reproduzir"}
      >
        {isPlaying ? (
          <Pause className={`h-4 w-4 ${iconColor}`} fill="currentColor" />
        ) : (
          <Play className={`h-4 w-4 ${iconColor} ml-0.5`} fill="currentColor" />
        )}
      </button>

      <div className="flex-1 min-w-0 mt-1">
        <div
          ref={progressBarRef}
          className={`h-1.5 w-full rounded-full cursor-pointer ${barColor}`}
          onClick={handleProgressClick}
        >
          <div
            className={`h-full rounded-full transition-[width] duration-100 ${progressColor}`}
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className={`mt-1 text-[11px] tabular-nums ${isMine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
          {formatDuration(currentTime)} / {formatDuration(duration)}
        </div>
      </div>
    </div>
  );
}
