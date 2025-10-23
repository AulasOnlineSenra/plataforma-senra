
'use client';

import { useState, useEffect } from 'react';
import { AppLogoUploader } from '@/components/app-logo-uploader';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Save } from 'lucide-react';

const INACTIVITY_STORAGE_KEY = 'studentInactivityDays';

export default function AdminSettingsPage() {
  const [inactivityDays, setInactivityDays] = useState(90);
  const { toast } = useToast();

  useEffect(() => {
    const storedDays = localStorage.getItem(INACTIVITY_STORAGE_KEY);
    if (storedDays) {
      setInactivityDays(parseInt(storedDays, 10));
    }
  }, []);

  const handleSaveInactivity = () => {
    localStorage.setItem(INACTIVITY_STORAGE_KEY, String(inactivityDays));
    toast({
      title: 'Configuração Salva!',
      description: 'O período de inatividade foi atualizado.',
    });
  };

  return (
    <div className="flex flex-1 flex-col gap-4 md:gap-8">
      <div className="flex items-center">
        <h1 className="font-headline text-2xl md:text-3xl font-bold">
          Configurações do Administrador
        </h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Logo do Aplicativo</CardTitle>
          <CardDescription>
            Faça o upload de uma nova imagem para ser o logo do aplicativo.
            Formatos aceitos: PNG, JPG, SVG.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AppLogoUploader />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Configurações de Alunos</CardTitle>
          <CardDescription>
            Defina regras para a gestão de alunos na plataforma.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
            <div className="grid gap-2 max-w-sm">
                <Label htmlFor="inactivity-days">Período de Inatividade (dias)</Label>
                <Input
                    id="inactivity-days"
                    type="number"
                    value={inactivityDays}
                    onChange={(e) => setInactivityDays(parseInt(e.target.value, 10) || 0)}
                    min="1"
                    placeholder='Ex: 90'
                />
                <p className="text-sm text-muted-foreground">
                    Um aluno será classificado como inativo após este período sem contratar novas aulas.
                </p>
            </div>
             <div className="flex">
                <Button onClick={handleSaveInactivity}>
                    <Save className="mr-2 h-4 w-4" />
                    Salvar Configuração de Inatividade
                </Button>
            </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Credenciais de API</CardTitle>
          <CardDescription>
            Gerencie as credenciais para integrações de terceiros como Google
            e PayPal.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            A funcionalidade de gerenciamento de credenciais ainda não foi
            implementada.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
