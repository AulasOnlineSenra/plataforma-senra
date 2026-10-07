"use client";

import React, { useEffect, useState } from "react";
import { getPasLeads, updateLeadStatus } from "@/app/actions/pas-leads";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { MessageCircle, User } from "lucide-react";

export default function LeadsPasAdmin() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeads = async () => {
    setLoading(true);
    const res = await getPasLeads();
    if (res.success) setLeads(res.leads);
    setLoading(false);
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const handleStatusChange = async (id: string, newStatus: string) => {
    await updateLeadStatus(id, newStatus);
    fetchLeads(); // refresh
  };

  const getRiskBadge = (zone: string) => {
    if (zone === "GREEN") return <span className="px-2 py-1 rounded bg-emerald-100 text-emerald-800 text-xs font-bold">🟢 Segura</span>;
    if (zone === "YELLOW") return <span className="px-2 py-1 rounded bg-amber-100 text-amber-800 text-xs font-bold">🟡 Atenção</span>;
    return <span className="px-2 py-1 rounded bg-rose-100 text-rose-800 text-xs font-bold">🔴 Risco</span>;
  };

  const openWhatsApp = (phone: string, name: string, course: string, isParent: boolean, score: number) => {
    const cleanPhone = phone.replace(/\\D/g, "");
    let text = "";
    if (isParent) {
      text = \`Olá, tudo bem? Sou da equipe do Prof. Senra. O(a) \${name} realizou o simulado do PAS UnB para \${course} na nossa plataforma e vimos que a projeção atual dele(a) está em \${score.toFixed(1)} pontos. Gostaria de agendar uma sessão estratégica rápida para entendermos como ajudar?\`;
    } else {
      text = \`Olá \${name}! Vi que você fez a simulação do PAS UnB para \${course} na nossa plataforma. Sua projeção atual é de \${score.toFixed(1)} pontos. Quer bater um papo rápido com o Prof. Senra para alinhar seu plano de estudos?\`;
    }
    window.open(\`https://wa.me/55\${cleanPhone}?text=\${encodeURIComponent(text)}\`, "_blank");
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Leads Simulador PAS UnB</h1>
        <p className="text-slate-500">Gerencie os contatos capturados pelo Simulador Gratuito.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Carregando leads...</div>
        ) : leads.length === 0 ? (
          <div className="p-8 text-center text-slate-500">Nenhum lead capturado ainda.</div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Aluno</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead>Curso (UnB)</TableHead>
                  <TableHead>Risco</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ação Rápida</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell className="text-xs text-slate-500">
                      {new Date(lead.createdAt).toLocaleDateString("pt-BR", { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </TableCell>
                    <TableCell>
                      <p className="font-semibold text-slate-800 text-sm">{lead.studentName}</p>
                      <p className="text-xs text-slate-500">{lead.studentWhatsapp}</p>
                    </TableCell>
                    <TableCell>
                      <p className="font-semibold text-slate-800 text-sm">{lead.parentName}</p>
                      <p className="text-xs text-slate-500">{lead.parentWhatsapp}</p>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium text-slate-800 text-sm">{lead.targetCourse}</p>
                      <p className="text-xs text-slate-500">{lead.gradeStage}</p>
                    </TableCell>
                    <TableCell>{getRiskBadge(lead.riskZone)}</TableCell>
                    <TableCell>
                      <select
                        className="text-xs border-slate-200 rounded p-1"
                        value={lead.leadStatus}
                        onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                      >
                        <option value="NOVO">Novo Lead</option>
                        <option value="EM_CONTATO">Em Contato</option>
                        <option value="AGENDADO">Sessão Agendada</option>
                        <option value="MATRICULADO">Matriculado</option>
                        <option value="ARQUIVADO">Arquivado</option>
                      </select>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-8 text-xs bg-[#25D366]/10 text-[#1DA851] border-[#25D366]/20 hover:bg-[#25D366]/20"
                        onClick={() => openWhatsApp(lead.studentWhatsapp, lead.studentName, lead.targetCourse, false, lead.projectedEf)}
                      >
                        <User className="h-3 w-3 mr-1" /> Aluno
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-8 text-xs bg-[#25D366]/10 text-[#1DA851] border-[#25D366]/20 hover:bg-[#25D366]/20"
                        onClick={() => openWhatsApp(lead.parentWhatsapp, lead.studentName, lead.targetCourse, true, lead.projectedEf)}
                      >
                        <MessageCircle className="h-3 w-3 mr-1" /> Responsável
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
