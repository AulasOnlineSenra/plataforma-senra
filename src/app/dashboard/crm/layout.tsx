'use client';

import { usePathname, useRouter } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function CrmLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  // Determinar o tipo atual baseado na URL
  const currentType = pathname.includes('/comercial') ? 'comercial' : 'administrativo';

  const handleTypeChange = (value: string) => {
    if (value === 'comercial') {
      router.push('/dashboard/crm/comercial');
    } else {
      router.push('/dashboard/crm');
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex justify-end">
        <Select value={currentType} onValueChange={handleTypeChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Selecione o tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="administrativo">Administrativo</SelectItem>
            <SelectItem value="comercial">Comercial</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {children}
    </div>
  );
}
