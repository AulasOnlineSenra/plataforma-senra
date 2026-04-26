'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger 
} from '@/components/ui/dialog';
import { Trash2, Plus, Star, CheckCircle2, PackageOpen, Pencil } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getPlans, createPlan, deletePlan, updatePlan } from '@/app/actions/plans';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Tipo baseado no Prisma
type Plan = {
  id: string;
  name: string;
  lessonsCount: number;
  price: number;
  durationMins: number;
  isPopular: boolean;
  features?: string[];
};

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    lessonsCount: 1,
    price: 0,
    durationMins: 60,
    isPopular: false,
    features: [''],
  });

  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    setIsLoading(true);
    const result = await getPlans();
    if (result.success && result.data) {
      setPlans(result.data);
    } else {
      toast({ variant: 'destructive', title: 'Erro', description: result.error });
    }
    setIsLoading(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name.trim() === '' || formData.price <= 0) {
        toast({ variant: 'destructive', title: 'Aviso', description: 'Preencha um nome e um preço válido.' });
        return;
    }

    setIsSubmitting(true);
    const result = await createPlan({
      ...formData,
      features: (formData.features || []).filter(f => f.trim() !== ''),
    });
    
    if (result.success) {
      toast({ title: 'Sucesso!', description: 'Pacote criado com sucesso.', className: 'bg-emerald-600 text-white border-none' });
      loadPlans();
      setIsModalOpen(false);
      setFormData({ name: '', lessonsCount: 1, price: 0, durationMins: 60, isPopular: false, features: [''] });
    } else {
      toast({ variant: 'destructive', title: 'Erro', description: result.error });
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar este pacote?')) return;
    
    const result = await deletePlan(id);
    if (result.success) {
      toast({ title: 'Deletado!', description: 'Pacote removido com sucesso.' });
      loadPlans();
    } else {
      toast({ variant: 'destructive', title: 'Erro', description: result.error });
    }
  };

  const handleEdit = (plan: Plan) => {
    setEditingId(plan.id);
    let parsedFeatures: string[] = [];
    try {
      parsedFeatures = JSON.parse(plan.features || '[]');
    } catch {
      parsedFeatures = [];
    }
    setFormData({
      name: plan.name,
      lessonsCount: plan.lessonsCount,
      price: plan.price,
      durationMins: plan.durationMins,
      isPopular: plan.isPopular,
      features: parsedFeatures.length > 0 ? parsedFeatures : [''],
    });
    setIsModalOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name.trim() === '' || formData.price <= 0 || !editingId) {
        toast({ variant: 'destructive', title: 'Aviso', description: 'Preencha um nome e um preço válido.' });
        return;
    }

    setIsSubmitting(true);
    const result = await updatePlan(editingId, {
      ...formData,
      features: (formData.features || []).filter(f => f.trim() !== ''),
    });
    
    if (result.success) {
      toast({ title: 'Sucesso!', description: 'Pacote atualizado com sucesso.', className: 'bg-emerald-600 text-white border-none' });
      loadPlans();
      setIsModalOpen(false);
      setEditingId(null);
      setFormData({ name: '', lessonsCount: 1, price: 0, durationMins: 60, isPopular: false, features: [''] });
    } else {
      toast({ variant: 'destructive', title: 'Erro', description: result.error });
    }
    setIsSubmitting(false);
  };

  if (isLoading) {
    return <div className="flex h-[50vh] items-center justify-center text-slate-400 font-medium animate-pulse">Carregando planos...</div>;
  }

  return (
    <div className="flex flex-1 flex-col gap-8 md:gap-10 w-full max-w-7xl mx-auto">
      
      {/* CABEÇALHO LIMPO E MODERNO */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Gerenciar Planos</h1>
          <p className="text-slate-500 mt-1">Crie e organize as opções de pacotes que os alunos poderão comprar.</p>
        </div>
        
        {/* A JANELINHA MODAL */}
        <Dialog open={isModalOpen} onOpenChange={(open) => {
            if (!open) {
              setEditingId(null);
              setFormData({ name: '', lessonsCount: 1, price: 0, durationMins: 60, isPopular: false });
            }
            setIsModalOpen(open);
          }}>
          <DialogTrigger asChild>
            <Button className="h-12 rounded-xl bg-brand-yellow px-6 text-base font-bold text-slate-900 shadow-sm transition-all hover:scale-105 hover:bg-brand-yellow/90">
              <Plus className="w-5 h-5 mr-2" /> Novo Plano
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md rounded-3xl border border-slate-100 bg-white shadow-xl p-8">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-slate-900">{editingId ? 'Editar Pacote' : 'Criar Pacote'}</DialogTitle>
              <DialogDescription className="text-slate-500">
                {editingId ? 'Atualize os dados do pacote abaixo.' : 'Preencha os dados abaixo para disponibilizar um novo plano na plataforma.'}
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={editingId ? handleUpdate : handleCreate} className="grid gap-5 py-4">
              <div className="space-y-2">
                <Label className="font-bold text-slate-700">Nome do Pacote</Label>
                <Input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="h-12 rounded-xl border-slate-200 focus-visible:ring-brand-yellow"
                  placeholder="Ex: Pacote 4 Aulas"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-bold text-slate-700">Aulas Totais</Label>
                  <Input 
                    type="number" min="1"
                    value={formData.lessonsCount}
                    onChange={(e) => setFormData({...formData, lessonsCount: parseInt(e.target.value)})}
                    className="h-12 rounded-xl border-slate-200 focus-visible:ring-brand-yellow text-center font-bold text-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-slate-700">Tempo (min)</Label>
                  <Input 
                    type="number" min="30" step="15"
                    value={formData.durationMins}
                    onChange={(e) => setFormData({...formData, durationMins: parseInt(e.target.value)})}
                    className="h-12 rounded-xl border-slate-200 focus-visible:ring-brand-yellow text-center font-bold text-lg"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="font-bold text-slate-700">Preço Total (R$)</Label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">R$</span>
                  <Input 
                    type="number" min="0" step="0.01"
                    value={formData.price === 0 ? '' : formData.price}
                    onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value) || 0})}
                    className="h-14 pl-12 rounded-xl border-slate-200 focus-visible:ring-brand-yellow text-2xl font-extrabold text-slate-900"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 mt-2 p-4 bg-slate-50 border border-slate-100 rounded-2xl cursor-pointer" onClick={() => setFormData({...formData, isPopular: !formData.isPopular})}>
                <div className={cn("w-6 h-6 rounded-md flex items-center justify-center border-2 transition-colors", formData.isPopular ? "bg-brand-yellow border-brand-yellow" : "bg-white border-slate-300")}>
                  {formData.isPopular && <CheckCircle2 className="w-4 h-4 text-slate-900" />}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold flex items-center gap-1 text-slate-800 select-none">
                    Destacar como "Mais Popular" <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  </span>
                  <span className="text-xs text-slate-500">Este pacote ganhará um selo especial.</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="font-bold text-slate-700">Tópicos do Card (Features)</Label>
                <div className="space-y-2">
                  {(formData.features || []).map((feature, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={feature}
                        onChange={(e) => {
                          const newFeatures = [...(formData.features || [])];
                          newFeatures[index] = e.target.value;
                          setFormData({...formData, features: newFeatures});
                        }}
                        className="h-10 rounded-xl border-slate-200"
                        placeholder={`Tópico ${index + 1}`}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          const newFeatures = (formData.features || []).filter((_, i) => i !== index);
                          setFormData({...formData, features: newFeatures});
                        }}
                        className="h-10 w-10 text-red-500 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setFormData({...formData, features: [...(formData.features || []), '']})}
                    className="w-full h-10 rounded-xl border-dashed text-slate-500"
                  >
                    <Plus className="w-4 h-4 mr-2" /> Adicionar Tópico
                  </Button>
                </div>
              </div>

              <DialogFooter className="mt-6 gap-3 sm:gap-0">
                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} className="rounded-xl font-bold text-slate-500 hover:text-slate-700">Cancelar</Button>
                <Button type="submit" disabled={isSubmitting} className="h-11 rounded-xl bg-brand-yellow px-8 font-bold text-slate-900 shadow-sm hover:bg-brand-yellow/90">
                  {isSubmitting ? 'Salvando...' : editingId ? 'Atualizar Pacote' : 'Salvar Pacote'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* VITRINE DE PACOTES CRIADOS */}
      {plans.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-slate-400 border border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
           <PackageOpen className="w-20 h-20 text-slate-300 mb-6" />
           <p className="text-2xl font-bold text-slate-700">Nenhum pacote cadastrado</p>
           <p className="text-base mt-2 text-slate-500">Clique em "Novo Plano" para criar as ofertas da plataforma.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-2 max-w-6xl">
          {plans.map((plan) => (
            <Card key={plan.id} className={cn("relative flex flex-col bg-white rounded-3xl transition-all duration-300 hover:shadow-xl hover:-translate-y-2 group", plan.isPopular ? "border-2 border-brand-yellow shadow-md" : "border border-slate-200 shadow-sm")}>
              
              {/* Etiqueta de Destaque */}
              {plan.isPopular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <Badge className="bg-brand-yellow text-slate-900 font-extrabold border-none px-5 py-1.5 shadow-sm uppercase tracking-widest text-[10px]">
                    Mais Escolhido
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center pb-4 pt-10 px-6">
                <CardTitle className="text-xl font-bold text-slate-800 tracking-tight">{plan.name}</CardTitle>
                <div className="mt-4 flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-extrabold tracking-tighter text-slate-900">
                    R$ {plan.price.toFixed(2).replace('.', ',')}
                  </span>
                </div>
                <CardDescription className="font-semibold text-slate-500 mt-2">
                    {plan.lessonsCount > 1 ? `Equivale a R$ ${(plan.price / plan.lessonsCount).toFixed(2).replace('.', ',')} / aula` : 'Pagamento único'}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="flex-1 mt-2 mx-6 mb-6 p-6 rounded-2xl bg-slate-50 border border-slate-100">
                <ul className="space-y-4 text-sm text-slate-600">
                  <li className="flex items-center gap-3">
                    <div className="bg-green-100 rounded-full p-0.5"><CheckCircle2 className="w-4 h-4 text-green-600" /></div> 
                    <span><strong className="text-slate-900 font-extrabold">{plan.lessonsCount}</strong> {plan.lessonsCount === 1 ? 'aula garantida' : 'aulas garantidas'}</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="bg-green-100 rounded-full p-0.5"><CheckCircle2 className="w-4 h-4 text-green-600" /></div> 
                    <span>Duração de <strong className="text-slate-900 font-extrabold">{plan.durationMins} min</strong></span>
                  </li>
                </ul>
              </CardContent>

              <CardFooter className="px-6 pb-6 pt-0 flex flex-col gap-2">
                <Button variant="outline" className="w-full h-12 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors" onClick={() => handleEdit(plan)}>
                    <Pencil className="w-4 h-4 mr-2" /> Editar Pacote
                </Button>
                <Button variant="ghost" className="w-full h-12 rounded-xl text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors" onClick={() => handleDelete(plan.id)}>
                    <Trash2 className="w-4 h-4 mr-2" /> Excluir Pacote
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}