
'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { paymentHistory as initialPaymentHistory } from '@/lib/data';
import { PaymentTransaction } from '@/lib/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from './ui/badge';

const PAYMENT_HISTORY_STORAGE_KEY = 'paymentHistory';

export default function StudentFinancials() {
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  
  useEffect(() => {
    const updateHistory = () => {
      const storedHistory = localStorage.getItem(PAYMENT_HISTORY_STORAGE_KEY);
      let history: PaymentTransaction[] = [];
      if (storedHistory) {
        history = JSON.parse(storedHistory).map((p: any) => ({...p, date: new Date(p.date)}));
      } else {
        history = initialPaymentHistory;
      }
      const sortedHistory = history.sort((a,b) => b.date.getTime() - a.date.getTime());
      setTransactions(sortedHistory);
    };

    updateHistory();
    window.addEventListener('storage', updateHistory);
    return () => window.removeEventListener('storage', updateHistory);
  }, []);


  return (
    <Card>
      <CardHeader>
        <CardTitle>Histórico de Compras</CardTitle>
        <CardDescription>
          Aqui você pode ver um registro de todos os pacotes de aulas que você
          adquiriu.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Pacote</TableHead>
              <TableHead>Data da Compra</TableHead>
              <TableHead>Método de Pagamento</TableHead>
              <TableHead className="text-center">Créditos Adquiridos</TableHead>
              <TableHead className="text-right">Valor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.length > 0 ? (
              transactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell className="font-medium">
                    {transaction.packageName}
                  </TableCell>
                  <TableCell>
                    {format(new Date(transaction.date), "dd/MM/yyyy 'às' HH:mm", {
                      locale: ptBR,
                    })}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{transaction.paymentMethod}</Badge>
                  </TableCell>
                  <TableCell className="text-center font-medium text-brand-yellow">
                    +{transaction.creditsAdded}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    R$ {transaction.amount.toFixed(2).replace('.', ',')}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-24 text-center text-muted-foreground"
                >
                  Nenhum histórico de compras encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
