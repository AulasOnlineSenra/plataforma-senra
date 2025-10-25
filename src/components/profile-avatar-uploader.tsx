
'use client';

import { useState, useRef } from 'react';
import { User, Teacher } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { Upload, X, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface ProfileAvatarUploaderProps {
  user: User | Teacher;
  onSave: (avatarUrl: string) => void;
  canEdit: boolean;
}

export function ProfileAvatarUploader({ user, onSave, canEdit }: ProfileAvatarUploaderProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 2 * 1024 * 1024) { // 2MB limit
        toast({
          variant: 'destructive',
          title: 'Arquivo muito grande',
          description: 'Por favor, selecione uma imagem menor que 2MB.',
        });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
        setFile(selectedFile);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleCancel = () => {
    setPreview(null);
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = () => {
    if (!preview) return;
    onSave(preview);
    toast({
      title: 'Avatar Atualizado!',
      description: 'Sua nova foto de perfil foi salva.',
    });
    handleCancel();
  };

  return (
    <div className="relative group w-32 h-32">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/png, image/jpeg, image/gif"
        className="hidden"
      />
      <Avatar className="w-32 h-32 text-4xl border-4 border-card">
        <AvatarImage src={preview || user.avatarUrl} alt={user.name} />
        <AvatarFallback>{user.name?.charAt(0) || '?'}</AvatarFallback>
      </Avatar>

      {canEdit && !preview && (
        <Button
          variant="outline"
          size="icon"
          className="absolute bottom-2 right-2 rounded-full h-10 w-10 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="h-5 w-5" />
          <span className="sr-only">Upload</span>
        </Button>
      )}

      {preview && (
        <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center gap-2">
            <Button
                variant="secondary"
                size="icon"
                className="rounded-full h-10 w-10"
                onClick={handleSave}
            >
                <Save className="h-5 w-5" />
                <span className="sr-only">Salvar</span>
            </Button>
            <Button
                variant="destructive"
                size="icon"
                className="rounded-full h-10 w-10"
                onClick={handleCancel}
            >
                <X className="h-5 w-5" />
                <span className="sr-only">Cancelar</span>
            </Button>
        </div>
      )}
    </div>
  );
}
