'use client';

import { useState, useRef } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { UploadCloud, X } from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from './ui/card';

export function AppLogoUploader() {
  const [preview, setPreview] = useState<string | null>('/logo.png');
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        toast({
            variant: 'destructive',
            title: 'Arquivo muito grande',
            description: 'Por favor, selecione um arquivo menor que 2MB.',
        });
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
        setFile(file);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleRemoveImage = () => {
    setPreview(null);
    setFile(null);
    if(fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  }

  const handleUpload = () => {
    if (!file) {
       toast({
            variant: 'destructive',
            title: 'Nenhum arquivo selecionado',
            description: 'Por favor, selecione um arquivo para fazer o upload.',
        });
      return;
    }
    // In a real application, you would upload the file to a server/storage
    // and update the logo path in your database or configuration.
    // For this prototype, we'll just simulate a successful upload.
    console.log('Uploading file:', file.name);
    
    // Here we can update the logo in local storage or a global state
    // to make it persist across the session for demonstration purposes.
    if (preview) {
      // This is a simple simulation. A real app would require a more robust solution.
      localStorage.setItem('appLogo', preview);
      window.dispatchEvent(new Event('storage')); // Notify other components
    }

    toast({
        title: 'Upload com Sucesso!',
        description: `O logo "${file.name}" foi salvo.`,
    });
  };

  return (
    <div className="grid gap-6">
      <div className="grid w-full max-w-sm items-center gap-2">
        <Label htmlFor="logo-upload">Selecionar arquivo</Label>
        <Input 
          id="logo-upload" 
          type="file" 
          accept="image/png, image/jpeg, image/svg+xml"
          onChange={handleFileChange}
          ref={fileInputRef}
          className="file:text-primary file:font-semibold"
        />
      </div>

      {preview && (
        <div>
          <Label>Pré-visualização</Label>
          <Card className="mt-2 w-full max-w-sm">
            <CardContent className="p-4 relative group">
              <Image
                src={preview}
                alt="Pré-visualização do logo"
                width={200}
                height={100}
                className="object-contain rounded-md mx-auto"
              />
               <Button 
                variant="destructive" 
                size="icon" 
                className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={handleRemoveImage}
                >
                   <X className="h-4 w-4" />
                   <span className="sr-only">Remover imagem</span>
               </Button>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex justify-start">
        <Button onClick={handleUpload} disabled={!file}>
          <UploadCloud className="mr-2" />
          Salvar Novo Logo
        </Button>
      </div>
    </div>
  );
}
