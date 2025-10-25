

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
import { useToast } from '@/hooks/use-toast';
import { getMockUser, referralData, users, teachers } from '@/lib/data';
import { User, UserRole, Referral } from '@/lib/types';
import { Copy, Gift, Users as UsersIcon, DollarSign, BookOpen, Save } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const UserReferralView = ({ user }: { user: User }) => {
  const { toast } = useToast();
  const [referralCode, setReferralCode] = useState('');
  const [referralInfo, setReferralInfo] = useState<Referral | null>(null);

  useEffect(() => {
    // Check if user already has a referral code
    const existingReferral = referralData.find(r => r.userId === user.id);
    if (existingReferral) {
      setReferralCode(existingReferral.code);
      setReferralInfo(existingReferral);
    }
  }, [user.id]);

  const handleGenerateCode = () => {
    const code = `${user.name.split(' ')[0].toUpperCase()}-${Date.now().toString().slice(-4)}`;
    setReferralCode(code);
    const newReferral: Referral = {
      userId: user.id,
      code: code,
      timesUsed: 0,
      totalBonus: 0,
      bonusType: 'money', // Default bonus type
    };
    setReferralInfo(newReferral);
    // In a real app, you'd save this to your database
    referralData.push(newReferral); 
    toast({
      title: 'Código Gerado!',
      description: 'Seu código de indicação foi criado com sucesso.',
    });
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode);
    toast({
      title: 'Código Copiado!',
      description: 'Seu código foi copiado para a área de transferência.',
    });
  };

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Seu Código de Indicação</CardTitle>
          <CardDescription>
            Compartilhe seu código com amigos. Para cada novo aluno que se
            cadastrar usando seu código, você e seu amigo ganham descontos!
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4 text-center">
          {referralCode ? (
            <>
              <Label htmlFor="referral-code" className="sr-only">Seu código</Label>
              <div className="relative w-full max-w-md">
                <Input
                  id="referral-code"
                  value={referralCode}
                  readOnly
                  className="h-12 text-2xl text-center font-mono tracking-widest pr-12"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                  onClick={handleCopyCode}
                >
                  <Copy className="h-5 w-5" />
                  <span className="sr-only">Copiar</span>
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Compartilhe este código para começar a ganhar!
              </p>
            </>
          ) : (
            <Button onClick={handleGenerateCode} size="lg">
              <Gift className="mr-2" />
              Gerar Meu Código
            </Button>
          )}
        </CardContent>
      </Card>
      {referralInfo && (
        <Card>
            <CardHeader>
                <CardTitle>Suas Estatísticas</CardTitle>
                <CardDescription>Acompanhe o desempenho do seu código de indicação.</CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-4 text-center">
                <div className="p-6 rounded-lg bg-accent/50">
                    <UsersIcon className="h-8 w-8 mx-auto text-primary" />
                    <p className="text-3xl font-bold mt-2">{referralInfo.timesUsed}</p>
                    <p className="text-sm text-muted-foreground">Indicações bem-sucedidas</p>
                </div>
                <div className="p-6 rounded-lg bg-accent/50">
                     {referralInfo.bonusType === 'money' ? (
                        <DollarSign className="h-8 w-8 mx-auto text-green-500" />
                     ) : (
                        <BookOpen className="h-8 w-8 mx-auto text-blue-500" />
                     )}
                    <p className="text-3xl font-bold mt-2">
                        {referralInfo.bonusType === 'money'
                        ? `R$ ${referralInfo.totalBonus.toFixed(2).replace('.',',')}`
                        : `${referralInfo.totalBonus} ${referralInfo.totalBonus > 1 ? 'aulas' : 'aula'}`
                        }
                    </p>
                    <p className="text-sm text-muted-foreground">Bônus total acumulado</p>
                </div>
            </CardContent>
        </Card>
      )}
    </div>
  );
};

const AdminReferralView = () => {
    const allUsers = [...users, ...teachers];
    const { toast } = useToast();
    const [bonusType, setBonusType] = useState<'money' | 'classes'>('money');
    const [bonusValue, setBonusValue] = useState(50);

    const getUserById = (userId: string) => {
        return allUsers.find(u => u.id === userId);
    }
    
    const handleSaveBonusConfig = () => {
        // In a real app, you would save this config to your backend.
        console.log({ bonusType, bonusValue });
        toast({
            title: 'Configurações Salvas!',
            description: 'As configurações de bônus de indicação foram atualizadas.'
        })
    }

  return (
    <div className="grid gap-6">
        <Card>
            <CardHeader>
                <CardTitle>Configurações de Bônus de Indicação</CardTitle>
                <CardDescription>Defina o tipo e o valor do bônus que os usuários recebem por cada indicação bem-sucedida.</CardDescription>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 items-end">
                <div className="grid gap-2">
                    <Label htmlFor="bonus-type">Tipo de Bônus</Label>
                    <Select value={bonusType} onValueChange={(value) => setBonusType(value as 'money' | 'classes')}>
                        <SelectTrigger id="bonus-type">
                            <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="money">Dinheiro (R$)</SelectItem>
                            <SelectItem value="classes">Aulas Grátis</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                 <div className="grid gap-2">
                    <Label htmlFor="bonus-value">
                        {bonusType === 'money' ? 'Valor do Bônus (R$)' : 'Número de Aulas'}
                    </Label>
                    <Input
                        id="bonus-value"
                        type="number"
                        value={bonusValue}
                        onChange={(e) => setBonusValue(Number(e.target.value))}
                        min="1"
                        step={bonusType === 'money' ? '0.01' : '1'}
                    />
                </div>
                 <Button onClick={handleSaveBonusConfig} className="w-full sm:w-auto">
                    <Save className="mr-2 h-4 w-4" />
                    Salvar Configuração
                </Button>
            </CardContent>
        </Card>
        <Card>
        <CardHeader>
            <CardTitle>Gerenciamento de Indicações</CardTitle>
            <CardDescription>
            Visualize todos os cupons de indicação gerados pelos usuários.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>Código do Cupom</TableHead>
                <TableHead className="text-center">Vezes Usado</TableHead>
                <TableHead className="text-right">Bônus Total</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {referralData.map(referral => {
                const user = getUserById(referral.userId);
                if (!user) return null;

                return (
                    <TableRow key={referral.userId}>
                    <TableCell>
                        <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                                <AvatarImage src={user.avatarUrl} alt={user.name} />
                                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="font-medium">{user.name}</div>
                        </div>
                    </TableCell>
                    <TableCell className="font-mono">{referral.code}</TableCell>
                    <TableCell className="text-center font-medium">{referral.timesUsed}</TableCell>
                    <TableCell className="text-right font-semibold">
                         {referral.bonusType === 'money'
                            ? <span className="text-green-600">R$ {referral.totalBonus.toFixed(2).replace('.',',')}</span>
                            : <span className="text-blue-600">{referral.totalBonus} {referral.totalBonus > 1 ? 'aulas' : 'aula'}</span>
                        }
                    </TableCell>
                    </TableRow>
                )
                })}
            </TableBody>
            </Table>
        </CardContent>
        </Card>
    </div>
  );
};

export default function ReferralsPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const role = localStorage.getItem('userRole') as UserRole | null;
    if (role) {
      setCurrentUser(getMockUser(role));
    }
  }, []);

  if (!currentUser) {
    return null; // or a loading spinner
  }

  return (
    <div className="flex flex-1 flex-col gap-4 md:gap-8">
      <div className="flex items-center">
        <h1 className="font-headline text-2xl md:text-3xl font-bold">
          Indicações
        </h1>
      </div>
      {currentUser.role === 'admin' ? (
        <AdminReferralView />
      ) : (
        <UserReferralView user={currentUser} />
      )}
    </div>
  );
}
