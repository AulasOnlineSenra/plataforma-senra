'use client';

import Link from 'next/link';
import { ChevronLeft, Building, BookOpen, UserPlus, CreditCard, CalendarClock, RotateCcw, Clock, Users, FileText, Trophy, Shield, FileEdit, Mail, Phone, Globe, MessageCircle, AlertCircle, Calendar, CheckCircle, XCircle } from 'lucide-react';

export default function TermosDeUsoPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-slate-900 text-white py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <Link 
            href="/home" 
            className="inline-flex items-center gap-2 text-amber-400 hover:text-amber-300 transition-colors mb-8"
          >
            <ChevronLeft className="h-4 w-4" />
            Voltar para home
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold font-headline mb-4">
            Termos de Uso
          </h1>
          <p className="text-slate-300 text-lg">
            Última atualização: 25 de abril de 2026
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-4xl py-12">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 md:p-12">
          <p className="text-slate-600 text-lg leading-relaxed mb-4">
            Bem-vindo à <strong>Aulas Online Senra</strong>.
          </p>
          <p className="text-slate-600 text-lg leading-relaxed mb-4">
            Estes Termos de Uso regulam o acesso e utilização do site <strong>senraaulasonline.com.br</strong>, da plataforma exclusiva do aluno e dos serviços oferecidos pela empresa.
          </p>
          <p className="text-slate-600 text-lg leading-relaxed mb-8 font-medium">
            Ao contratar nossos serviços ou utilizar nossa plataforma, você concorda com estes termos.
          </p>

          <div className="mt-12 space-y-12">
            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
                <Building className="h-6 w-6 text-amber-500" />
                1. Sobre a Aulas Online Senra
              </h2>
              <div className="text-slate-600 leading-relaxed space-y-2">
                <p>A Aulas Online Senra é uma plataforma que intermedeia aulas particulares online entre alunos e professores parceiros autônomos especializados.</p>
                <p className="mt-4">Nosso objetivo é ajudar alunos a melhorar sua performance acadêmica por meio de aulas personalizadas e acompanhamento individualizado.</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
                <BookOpen className="h-6 w-6 text-amber-500" />
                2. Serviços oferecidos
              </h2>
              <div className="text-slate-600 leading-relaxed">
                <p className="mb-2">A plataforma oferece:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>aulas particulares online</li>
                  <li>reforço escolar</li>
                  <li>preparação para vestibulares</li>
                  <li>preparação para ENEM</li>
                  <li>acompanhamento acadêmico personalizado</li>
                  <li>acesso à plataforma do aluno</li>
                  <li>chat com professores</li>
                  <li>organização de horários</li>
                  <li>armazenamento de materiais das aulas</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
                <UserPlus className="h-6 w-6 text-amber-500" />
                3. Cadastro do usuário
              </h2>
              <div className="text-slate-600 leading-relaxed">
                <p className="mb-2">Para contratar os serviços, o usuário poderá fornecer informações como:</p>
                <ul className="list-disc list-inside space-y-1 ml-4 mb-4">
                  <li>nome</li>
                  <li>telefone</li>
                  <li>e-mail</li>
                  <li>CPF</li>
                  <li>informações acadêmicas</li>
                </ul>
                <p>O usuário é responsável por fornecer informações corretas e atualizadas.</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
                <CreditCard className="h-6 w-6 text-amber-500" />
                4. Pagamentos
              </h2>
              <div className="text-slate-600 leading-relaxed">
                <p className="mb-2">Atualmente os pagamentos são realizados por:</p>
                <ul className="list-disc list-inside space-y-1 ml-4 mb-4">
                  <li>Pix</li>
                  <li>Transferência bancária</li>
                </ul>
                <p>No futuro, a empresa poderá integrar meios adicionais como cartão de crédito e plataformas como Mercado Pago.</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
                <CalendarClock className="h-6 w-6 text-amber-500" />
                5. Política de cancelamento e remarcação
              </h2>
              <div className="text-slate-600 leading-relaxed space-y-2">
                <p>O aluno poderá remarcar aulas com no mínimo <strong>24 horas de antecedência</strong>, sem custo adicional.</p>
                <p>Cancelamentos realizados com menos de 24 horas de antecedência poderão resultar na perda da aula, salvo situações excepcionais analisadas pela equipe.</p>
                <p>Em caso de ausência sem aviso prévio, a aula será considerada realizada e não haverá reembolso.</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
                <RotateCcw className="h-6 w-6 text-amber-500" />
                6. Reembolso
              </h2>
              <div className="text-slate-600 leading-relaxed space-y-2">
                <p>Os pedidos de reembolso seguirão as regras previstas no <strong>Código de Defesa do Consumidor</strong>, incluindo o direito de arrependimento aplicável a compras realizadas online, quando cabível.</p>
                <p>Cada solicitação poderá ser analisada individualmente.</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
                <Clock className="h-6 w-6 text-amber-500" />
                7. Validade dos pacotes
              </h2>
              <div className="text-slate-600 leading-relaxed space-y-2">
                <p>Os pacotes de aulas possuem validade de <strong>12 meses</strong> a partir da data da compra.</p>
                <p>Após esse período, aulas não utilizadas poderão expirar.</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
                <Users className="h-6 w-6 text-amber-500" />
                8. Professores parceiros
              </h2>
              <div className="text-slate-600 leading-relaxed space-y-2">
                <p>Os professores cadastrados atuam como <strong>parceiros autônomos</strong> intermediados pela plataforma.</p>
                <p>A Aulas Online Senra realiza a conexão entre alunos e professores conforme as necessidades acadêmicas de cada estudante.</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
                <FileText className="h-6 w-6 text-amber-500" />
                9. Materiais e gravações
              </h2>
              <div className="text-slate-600 leading-relaxed space-y-2">
                <p>As aulas <strong>não são gravadas</strong>.</p>
                <p>Os materiais utilizados durante as aulas poderão permanecer disponíveis na plataforma para acesso posterior do aluno.</p>
                <p>Os professores também podem desenvolver materiais personalizados conforme a necessidade do estudante.</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
                <Trophy className="h-6 w-6 text-amber-500" />
                10. Resultados acadêmicos
              </h2>
              <div className="text-slate-600 leading-relaxed space-y-2">
                <p>A Aulas Online Senra <strong>não garante</strong> aprovação em vestibulares, concursos, provas ou resultados específicos.</p>
                <p>O desempenho acadêmico depende de diversos fatores, incluindo dedicação individual do aluno.</p>
                <p>Nosso compromisso é oferecer suporte de qualidade e aulas personalizadas.</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
                <Shield className="h-6 w-6 text-amber-500" />
                11. Conduta do usuário
              </h2>
              <div className="text-slate-600 leading-relaxed space-y-2">
                <p className="mb-2">Não será permitido:</p>
                <ul className="list-disc list-inside space-y-1 ml-4 mb-4">
                  <li>comportamento offensivo com professores ou equipe</li>
                  <li>uso indevido da plataforma</li>
                  <li>compartilhamento indevido de materiais</li>
                  <li>atitudes que prejudiquem outros usuários</li>
                </ul>
                <p>A empresa poderá suspender ou encerrar contas em casos de comportamento inadequado.</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
                <FileEdit className="h-6 w-6 text-amber-500" />
                12. Alterações nos termos
              </h2>
              <div className="text-slate-600 leading-relaxed space-y-2">
                <p>A Aulas Online Senra poderá atualizar estes Termos de Uso periodicamente.</p>
                <p>Recomendamos a revisão regular desta página.</p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}