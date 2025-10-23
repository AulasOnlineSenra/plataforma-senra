
'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { classPackages, updateClassPackages } from '@/lib/data';
import { ClassPackage } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Save, Trash2, Plus } from 'lucide-react';

export default function AdminPackagesPage() {
  const [packages, setPackages] = useState<ClassPackage[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    // In a real app, this would be fetched from a database
    setPackages(JSON.parse(JSON.stringify(classPackages)));
  }, []);

  const handleInputChange = (
    id: string,
    field: keyof ClassPackage,
    value: string | number | boolean
  ) => {
    setPackages((prev) =>
      prev.map((pkg) =>
        pkg.id === id ? { ...pkg, [field]: value } : pkg
      )
    );
  };
  
  const handleAddNewPackage = () => {
    const newPackage: ClassPackage = {
      id: `pkg-${Date.now()}`,
      name: 'Novo Pacote',
      numClasses: 10,
      pricePerClass: 80,
      durationMinutes: 90,
      popular: false,
    };
    setPackages(prev => [...prev, newPackage]);
  }
  
  const handleRemovePackage = (id: string) => {
    setPackages(prev => prev.filter(pkg => pkg.id !== id));
  }

  const handleSaveChanges = () => {
    // In a real app, this would send the updated data to the server
    updateClassPackages(packages);
    toast({
      title: 'Planos Salvos!',
      description: 'As alterações nos pacotes de aulas foram salvas com sucesso.',
    });
  };

  return (
    <div className="flex flex-1 flex-col gap-4 md:gap-8">
      <div className="flex items-center justify-between">
        <h1 className="font-headline text-2xl md:text-3xl font-bold">
          Gerenciar Planos e Preços
        </h1>
        <div className="flex gap-2">
            <Button onClick={handleAddNewPackage}>
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Plano
            </Button>
            <Button onClick={handleSaveChanges} className="bg-sidebar text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
                <Save className="mr-2 h-4 w-4" />
                Salvar Alterações
            </Button>
        </div>
      </div>
      <div className="grid gap-6">
        {packages.map((pkg) => (
          <Card key={pkg.id}>
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <CardTitle>Editar Pacote</CardTitle>
                <CardDescription>
                  Ajuste os detalhes deste pacote de aulas.
                </CardDescription>
              </div>
               <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleRemovePackage(pkg.id)}>
                   <Trash2 className="h-5 w-5" />
                   <span className="sr-only">Remover Pacote</span>
               </Button>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <div className="grid gap-2">
                <Label htmlFor={`name-${pkg.id}`}>Nome do Pacote</Label>
                <Input
                  id={`name-${pkg.id}`}
                  value={pkg.name}
                  onChange={(e) =>
                    handleInputChange(pkg.id, 'name', e.target.value)
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor={`numClasses-${pkg.id}`}>
                  Número de Aulas
                </Label>
                <Input
                  id={`numClasses-${pkg.id}`}
                  type="number"
                  value={pkg.numClasses}
                  onChange={(e) =>
                    handleInputChange(
                      pkg.id,
                      'numClasses',
                      parseInt(e.target.value, 10)
                    )
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor={`price-${pkg.id}`}>
                  Preço por Aula (R$)
                </Label>
                <Input
                  id={`price-${pkg.id}`}
                  type="number"
                  step="0.01"
                  value={pkg.pricePerClass}
                  onChange={(e) =>
                    handleInputChange(
                      pkg.id,
                      'pricePerClass',
                      parseFloat(e.target.value)
                    )
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor={`duration-${pkg.id}`}>
                  Duração (minutos)
                </Label>
                <Input
                  id={`duration-${pkg.id}`}
                  type="number"
                  value={pkg.durationMinutes}
                  onChange={(e) =>
                    handleInputChange(
                      pkg.id,
                      'durationMinutes',
                      parseInt(e.target.value, 10)
                    )
                  }
                />
              </div>
              <div className="grid gap-2 items-center">
                <Label htmlFor={`popular-${pkg.id}`} className="mt-auto mb-2">
                  É Popular?
                </Label>
                <Switch
                  id={`popular-${pkg.id}`}
                  checked={pkg.popular}
                  onCheckedChange={(checked) =>
                    handleInputChange(pkg.id, 'popular', checked)
                  }
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
