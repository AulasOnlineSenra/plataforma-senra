'use client';

import { useParams } from 'next/navigation';
import CrmComercial from '../../crm-comercial';

export default function CrmBoardPage() {
  const params = useParams();
  const boardId = params.boardId as string;

  return <CrmComercial initialBoardId={boardId} />;
}
