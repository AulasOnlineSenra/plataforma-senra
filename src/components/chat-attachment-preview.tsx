"use client";

import { FileText, Download } from "lucide-react";
import { AudioPlayer } from "@/components/audio-player";

interface ChatAttachmentPreviewProps {
  url: string;
  name: string;
  type: string;
  isMine: boolean;
}

function isImageType(type: string) {
  return type.startsWith("image/");
}

function isAudioType(type: string) {
  return type.startsWith("audio/");
}

export function ChatAttachmentPreview({
  url,
  name,
  type,
  isMine,
}: ChatAttachmentPreviewProps) {
  if (isImageType(type)) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="block max-w-[280px]"
      >
        <img
          src={url}
          alt={name}
          className="rounded-lg max-h-60 w-auto object-cover cursor-pointer hover:opacity-90 transition-opacity"
        />
      </a>
    );
  }

  if (isAudioType(type)) {
    return <AudioPlayer src={url} isMine={isMine} />;
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors ${
        isMine
          ? "bg-primary-foreground/10 hover:bg-primary-foreground/20"
          : "bg-background/60 hover:bg-background"
      }`}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-background/20">
        <FileText className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate">{name}</p>
        <p className="text-xs opacity-70">
          {type.split("/")[1]?.toUpperCase() || "Arquivo"}
        </p>
      </div>
      <Download className="h-4 w-4 opacity-70" />
    </a>
  );
}
