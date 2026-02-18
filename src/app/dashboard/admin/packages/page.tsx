'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger 
} from '@/components/ui/dialog';
import { Trash2, Plus, Star, CheckCircle2, PackageOpen } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getPlans, createPlan, deletePlan } from '@/app/actions/plans';
import { cn } from '@/lib/utils';

// Tipo baseado no Prisma
type Plan = {
  id: string;
  name: string;
  lessonsCount: number;
  price: number;
  durationMins: number;
  isPopular: boolean;
};

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false); // Controle da Janelinha
  const { toast } = useToast();

  // Estados do Formulário
  const [formData, setFormData] = useState({
    name: '',
    lessonsCount: 1,
    price: 0,
    durationMins: 60,
    isPopular: false,
  });

  // Carrega os planos ao entrar na tela
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
    const result = await createPlan(formData);
    
    if (result.success) {
      toast({ title: 'Sucesso!', description: 'Pacote criado com sucesso.' });
      loadPlans(); // Atualiza a tela
      setIsModalOpen(false); // Fecha a janelinha
      setFormData({ name: '', lessonsCount: 1, price: 0, durationMins: 60, isPopular: false }); // Limpa o formulário
    } else {
      toast({ variant: 'destructive', title: 'Erro', description: result.error });
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar este pacote?')) return;
    
    const result = await deletePlan(id);
    if (result.success) {
      toast({ title: 'Deletado', description: 'Pacote removido com sucesso.' });
      loadPlans();
    } else {
      toast({ variant: 'destructive', title: 'Erro', description: result.error });
    }
  };

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center text-muted-foreground animate-pulse">Carregando vitrine de pacotes...</div>;
  }

  return (
    <div className="flex flex-1 flex-col gap-8 p-4 md:p-8 w-full max-w-7xl mx-auto">
      
      {/* CABEÇALHO E BOTÃO DE ADICIONAR */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border shadow-sm">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Gerenciar Planos e Preços</h1>
          <p className="text-slate-500 mt-1">Crie e organize as opções de pacotes que os alunos poderão comprar.</p>
        </div>
        
        {/* A JANELINHA MODAL */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-brand-yellow text-slate-900 hover:bg-amber-400 font-bold shadow-md">
              <Plus className="w-5 h-5 mr-2" /> Adicionar Plano
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Criar Novo Pacote</DialogTitle>
              <DialogDescription>
                Preencha os dados abaixo para disponibilizar um novo plano na plataforma.
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleCreate} className="grid gap-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Nome do Pacote (Ex: Pacote 4 Aulas)</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-brand-yellow focus:ring-1 focus:ring-brand-yellow outline-none"
                  placeholder="Ex: Aula Avulsa"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Número de Aulas</label>
                  <input 
                    type="number" min="1"
                    value={formData.lessonsCount}
                    onChange={(e) => setFormData({...formData, lessonsCount: parseInt(e.target.value)})}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-brand-yellow focus:ring-1 focus:ring-brand-yellow outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Duração (minutos)</label>
                  <input 
                    type="number" min="30" step="15"
                    value={formData.durationMins}
                    onChange={(e) => setFormData({...formData, durationMins: parseInt(e.target.value)})}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-brand-yellow focus:ring-1 focus:ring-brand-yellow outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Preço Total (R$)</label>
                <input 
                  type="number" min="0" step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value)})}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-brand-yellow focus:ring-1 focus:ring-brand-yellow outline-none"
                  placeholder="Ex: 150.00"
                  required
                />
              </div>

              <div className="flex items-center gap-2 mt-2 p-3 bg-slate-50 border rounded-lg">
                <input 
                  type="checkbox" 
                  id="popular-checkbox"
                  checked={formData.isPopular}
                  onChange={(e) => setFormData({...formData, isPopular: e.target.checked})}
                  className="w-4 h-4 rounded text-brand-yellow focus:ring-brand-yellow cursor-pointer"
                />
                <label htmlFor="popular-checkbox" className="text-sm font-medium flex items-center gap-1 cursor-pointer select-none">
                  Destacar como "Mais Popular" <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                </label>
              </div>

              <div className="flex justify-end gap-3 mt-4">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={isSubmitting} className="bg-slate-900 text-white hover:bg-slate-800">
                  {isSubmitting ? 'Salvando...' : 'Salvar Pacote'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* VITRINE DE PACOTES CRIADOS */}
      {plans.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 border-2 border-dashed rounded-2xl bg-slate-50/50">
           <PackageOpen className="w-16 h-16 opacity-30 mb-4" />
           <p className="text-lg font-medium text-slate-600">Nenhum pacote cadastrado.</p>
           <p className="text-sm mt-1">Clique em "Adicionar Plano" para começar a vender.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {plans.map((plan) => (
            <Card key={plan.id} className={cn("relative flex flex-col bg-white transition-all duration-200 hover:shadow-lg hover:-translate-y-1", plan.isPopular ? "border-brand-yellow border-2 shadow-md" : "")}>
              
              {/* Etiqueta de Destaque */}
              {plan.isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-brand-yellow text-slate-900 font-bold border-none px-4 py-1 shadow-sm uppercase tracking-wider text-[10px]">
                    Mais Escolhido
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center pb-4 pt-8">
                <CardTitle className="text-xl font-bold text-slate-800">{plan.name}</CardTitle>
                <div className="mt-4 flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-extrabold tracking-tight text-slate-900">
                    R$ {plan.price.toFixed(2).replace('.', ',')}
                  </span>
                </div>
                <CardDescription className="font-medium text-slate-500 mt-2">
                    {plan.lessonsCount > 1 ? `Equivale a R$ ${(plan.price / plan.lessonsCount).toFixed(2).replace('.', ',')} por aula` : 'Pagamento único'}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="flex-1 mt-2 bg-slate-50/50 mx-4 mb-4 p-4 rounded-xl">
                <ul className="space-y-3 text-sm text-slate-600">
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" /> 
                    <span><strong className="text-slate-800">{plan.lessonsCount}</strong> {plan.lessonsCount === 1 ? 'aula garantida' : 'aulas garantidas'}</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" /> 
                    <span>Duração de <strong className="text-slate-800">{plan.durationMins} min</strong></span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" /> 
                    <span>Agendamento flexível</span>
                  </li>
                </ul>
              </CardContent>

              <CardFooter className="px-4 pb-4 pt-0">
                <Button variant="destructive" className="w-full bg-red-50 hover:bg-red-100 text-red-600 border-none shadow-none" onClick={() => handleDelete(plan.id)}>
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