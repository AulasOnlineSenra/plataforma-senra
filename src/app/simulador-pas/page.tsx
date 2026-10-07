"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, ArrowRight, ArrowLeft, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { submitPasLead } from "@/app/actions/pas-leads";
import unbCutoffs from "@/lib/unb-cutoffs.json";

export default function SimuladorPas() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const [formData, setFormData] = useState({
    gradeStage: "PAS 1",
    targetCourse: "Medicina",
    school: "",
    pas1Score: "",
    pas2Score: "",
    essayTarget: "7.5",
    studentName: "",
    studentWhatsapp: "",
    parentName: "",
    parentWhatsapp: ""
  });

  const courses = Array.from(new Set(unbCutoffs.map(c => c.course))).sort();

  const handleNext = () => setStep(s => Math.min(s + 1, 4));
  const handlePrev = () => setStep(s => Math.max(s - 1, 1));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await submitPasLead({
      studentName: formData.studentName,
      studentWhatsapp: formData.studentWhatsapp,
      parentName: formData.parentName,
      parentWhatsapp: formData.parentWhatsapp,
      school: formData.school,
      gradeStage: formData.gradeStage,
      targetCourse: formData.targetCourse,
      pas1Score: parseFloat(formData.pas1Score) || 0,
      pas2Score: parseFloat(formData.pas2Score) || 0,
      essayTarget: parseFloat(formData.essayTarget) || 7.5,
    });
    setLoading(false);
    
    if (res.success) {
      setResult(res);
      setStep(4);
    } else {
      alert("Erro ao processar dados.");
    }
  };

  const getRiskColor = (zone: string) => {
    if (zone === "GREEN") return "bg-emerald-100 text-emerald-800 border-emerald-300";
    if (zone === "YELLOW") return "bg-amber-100 text-amber-800 border-amber-300";
    return "bg-rose-100 text-rose-800 border-rose-300";
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-12 px-4 sm:px-6">
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
        
        {/* Header Progress */}
        <div className="bg-slate-900 px-6 py-4 flex flex-col gap-2">
          <div className="flex justify-between items-center text-white">
            <h1 className="font-bold text-lg">Simulador PAS UnB</h1>
            <span className="text-xs font-medium text-slate-400">Passo {step} de 4</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5">
            <div 
              className="bg-brand-yellow h-1.5 rounded-full transition-all duration-500 ease-in-out"
              style={{ width: \`\${(step / 4) * 100}%\` }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2 className="text-xl font-bold text-slate-800 mb-6">Qual seu perfil atual?</h2>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Etapa do PAS</Label>
                    <select 
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={formData.gradeStage} 
                      onChange={e => setFormData({...formData, gradeStage: e.target.value})}
                    >
                      <option value="PAS 1">Aluno do 1º Ano (Foco PAS 1)</option>
                      <option value="PAS 2">Aluno do 2º Ano (Foco PAS 2)</option>
                      <option value="PAS 3">Aluno do 3º Ano (Foco PAS 3)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Curso Desejado na UnB</Label>
                    <select 
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                      value={formData.targetCourse} 
                      onChange={e => setFormData({...formData, targetCourse: e.target.value})}
                    >
                      {courses.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Colégio (Brasília/Entorno)</Label>
                    <Input 
                      placeholder="Ex: Sigma, Marista, Escola Pública..." 
                      value={formData.school} 
                      onChange={e => setFormData({...formData, school: e.target.value})}
                    />
                  </div>
                  <Button className="w-full mt-4" onClick={handleNext}>Avançar <ArrowRight className="ml-2 h-4 w-4" /></Button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2 className="text-xl font-bold text-slate-800 mb-6">Insira suas Notas</h2>
                <div className="space-y-4">
                  {(formData.gradeStage === "PAS 2" || formData.gradeStage === "PAS 3") && (
                    <div className="space-y-2">
                      <Label>Escore / Nota Bruta no PAS 1</Label>
                      <Input type="number" placeholder="Ex: 45.5" value={formData.pas1Score} onChange={e => setFormData({...formData, pas1Score: e.target.value})} />
                    </div>
                  )}
                  {formData.gradeStage === "PAS 3" && (
                    <div className="space-y-2">
                      <Label>Escore / Nota Bruta no PAS 2</Label>
                      <Input type="number" placeholder="Ex: 50.2" value={formData.pas2Score} onChange={e => setFormData({...formData, pas2Score: e.target.value})} />
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label>Meta de Nota na Redação (0 a 10)</Label>
                    <Input type="number" step="0.1" value={formData.essayTarget} onChange={e => setFormData({...formData, essayTarget: e.target.value})} />
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button variant="outline" className="w-full" onClick={handlePrev}>Voltar</Button>
                    <Button className="w-full" onClick={handleNext}>Avançar <ArrowRight className="ml-2 h-4 w-4" /></Button>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2 className="text-xl font-bold text-slate-800 mb-2">Para onde enviamos o diagnóstico?</h2>
                <p className="text-sm text-slate-500 mb-6">Insira seus dados para gerar o resultado em tempo real.</p>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Nome do Aluno</Label>
                    <Input required placeholder="Seu nome" value={formData.studentName} onChange={e => setFormData({...formData, studentName: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>WhatsApp do Aluno</Label>
                    <Input required placeholder="(61) 9xxxx-xxxx" value={formData.studentWhatsapp} onChange={e => setFormData({...formData, studentWhatsapp: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Nome do Responsável</Label>
                    <Input required placeholder="Pai, Mãe ou Responsável" value={formData.parentName} onChange={e => setFormData({...formData, parentName: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>WhatsApp do Responsável</Label>
                    <Input required placeholder="(61) 9xxxx-xxxx" value={formData.parentWhatsapp} onChange={e => setFormData({...formData, parentWhatsapp: e.target.value})} />
                  </div>
                  
                  <div className="flex gap-2 mt-4">
                    <Button type="button" variant="outline" className="w-full" onClick={handlePrev}>Voltar</Button>
                    <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" disabled={loading}>
                      {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Ver Diagnóstico"}
                    </Button>
                  </div>
                </form>
              </motion.div>
            )}

            {step === 4 && result && (
              <motion.div key="step4" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                <div className="text-center mb-6">
                  <div className="inline-block p-3 rounded-full bg-slate-100 mb-4">
                    {result.riskZone === "GREEN" && <CheckCircle2 className="h-10 w-10 text-emerald-500" />}
                    {result.riskZone === "YELLOW" && <AlertTriangle className="h-10 w-10 text-amber-500" />}
                    {result.riskZone === "RED" && <XCircle className="h-10 w-10 text-rose-500" />}
                  </div>
                  <h2 className="text-2xl font-bold text-slate-800">Resultado do Simulado</h2>
                  <p className="text-slate-500 mt-2">
                    Com base no histórico para <strong>{formData.targetCourse}</strong> (Corte aprox. {result.cutoff} pts).
                  </p>
                </div>

                <div className={\`p-6 rounded-2xl border mb-6 text-center \${getRiskColor(result.riskZone)}\`}>
                  <p className="text-sm font-semibold uppercase tracking-wider opacity-80 mb-1">Escore Final Projetado</p>
                  <p className="text-4xl font-black">{result.projectedEf.toFixed(1)}</p>
                  <p className="text-sm mt-3 font-medium">
                    {result.riskZone === "GREEN" && "Parabéns! Sua projeção está em uma margem segura."}
                    {result.riskZone === "YELLOW" && "Atenção! Você está na margem de risco."}
                    {result.riskZone === "RED" && "Alerta! Você precisa aumentar suas notas para alcançar o corte."}
                  </p>
                </div>

                <div className="space-y-3">
                  <Button className="w-full bg-[#25D366] hover:bg-[#1DA851] text-white h-12 text-md" asChild>
                    <a href={\`https://wa.me/5561993703508?text=Ol%C3%A1%20Prof.%20Senra!%20Fiz%20o%20simulado%20do%20PAS%20UnB%20para%20\${formData.targetCourse}%20e%20quero%20ajuda.\`} target="_blank" rel="noreferrer">
                      Falar com Prof. Senra no WhatsApp
                    </a>
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
