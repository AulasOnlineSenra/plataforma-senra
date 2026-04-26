'use client';

import Link from 'next/link';
import { ChevronLeft, Shield, Lock, User, Mail, Phone, Globe, MessageCircle, FileText, Calendar, CreditCard, Cookie, Users, Security, Scale, PhoneCall } from 'lucide-react';

export default function PoliticaDePrivacidadePage() {
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
            Política de Privacidade
          </h1>
          <p className="text-slate-300 text-lg">
            Última atualização: 25 de abril de 2026
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-4xl py-12">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 md:p-12">
          <p className="text-slate-600 text-lg leading-relaxed mb-8">
            A Aulas Online Senra respeita a sua privacidade e está comprometida com a proteção dos dados pessoais de alunos, responsáveis e visitantes do site <strong>senraaulasonline.com.br</strong>.
          </p>
          <p className="text-slate-600 text-lg leading-relaxed mb-8">
            Esta Política de Privacidade explica como coletamos, utilizamos, armazenamos e protegemos suas informações ao utilizar nosso site, plataforma e serviços.
          </p>
          <p className="text-slate-600 text-lg leading-relaxed mb-8 font-medium">
            Ao acessar nossos serviços, você concorda com os termos descritos nesta política.
          </p>

          <div className="mt-12 space-y-12">
            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
                <User className="h-6 w-6 text-amber-500" />
                1. Quem somos
              </h2>
              <div className="text-slate-600 leading-relaxed space-y-2">
                <p>A Aulas Online Senra é uma plataforma de aulas particulares online que conecta alunos a professores especializados para reforço escolar, vestibulares, ENEM e outros objetivos acadêmicos.</p>
                <p className="font-medium mt-4">Controlador dos dados: Aulas Online Senra</p>
                <p className="flex items-center gap-2 mt-2">
                  <Mail className="h-4 w-4 text-amber-500" />
                  E-mail para contato: <strong>senraaulasonline@gmail.com</strong>
                </p>
                <p className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-amber-500" />
                  WhatsApp: <strong>(21) 99370-3508</strong>
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
                <FileText className="h-6 w-6 text-amber-500" />
                2. Dados que coletamos
              </h2>
              <div className="text-slate-600 leading-relaxed">
                <p className="mb-4">Podemos coletar as seguintes informações fornecidas diretamente pelos usuários:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Nome completo</li>
                  <li>E-mail</li>
                  <li>Número de telefone/WhatsApp</li>
                  <li>CPF (quando necessário para emissão de notas fiscais ou processos administrativos)</li>
                  <li>Informações acadêmicas (disciplinas, objetivos, dificuldades, vestibulares)</li>
                  <li>Informações de disponibilidade de horários</li>
                  <li>Mensagens enviadas por formulários, WhatsApp ou chat da plataforma</li>
                </ul>
                <p className="mt-4 mb-2">Também coletamos automaticamente:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Endereço IP</li>
                  <li>Dados do navegador</li>
                  <li>Tipo de dispositivo</li>
                  <li>Páginas visitadas</li>
                  <li>Tempo de navegação</li>
                  <li>Cookies e tecnologias semelhantes</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
                <Shield className="h-6 w-6 text-amber-500" />
                3. Como utilizamos seus dados
              </h2>
              <div className="text-slate-600 leading-relaxed">
                <p className="mb-2">Seus dados podem ser utilizados para:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Agendamento de aulas</li>
                  <li>Criação e gerenciamento da conta na plataforma</li>
                  <li>Comunicação com professores</li>
                  <li>Personalização do plano de estudos</li>
                  <li>Atendimento ao cliente</li>
                  <li>Emissão de documentos fiscais</li>
                  <li>Melhorias na plataforma</li>
                  <li>Comunicação comercial e suporte</li>
                  <li>Cumprimento de obrigações legais</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
                <Calendar className="h-6 w-6 text-amber-500" />
                4. Plataforma exclusiva do aluno
              </h2>
              <div className="text-slate-600 leading-relaxed">
                <p className="mb-2">Os alunos realizam login diretamente em uma plataforma própria da Aulas Online Senra, onde podem:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>acompanhar aulas agendadas</li>
                  <li>interagir com professores via chat</li>
                  <li>remarcar ou cancelar aulas</li>
                  <li>acompanhar informações acadêmicas</li>
                  <li>realizar pagamentos (quando aplicável)</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
                <CreditCard className="h-6 w-6 text-amber-500" />
                5. Pagamentos
              </h2>
              <div className="text-slate-600 leading-relaxed">
                <p>Atualmente, os pagamentos podem ser realizados pelos meios informados pela empresa durante o processo comercial.</p>
                <p className="mt-4">No futuro, poderemos integrar plataformas terceiras de pagamento, incluindo o Mercado Pago ou serviços similares.</p>
                <p className="mt-4"> Essas plataformas poderão possuir políticas próprias de privacidade.</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
                <Cookie className="h-6 w-6 text-amber-500" />
                6. Cookies e publicidade
              </h2>
              <div className="text-slate-600 leading-relaxed">
                <p className="mb-4">Nosso site pode utilizar cookies para melhorar a experiência do usuário.</p>
                <p className="mb-2">Esses cookies podem ser usados para:</p>
                <ul className="list-disc list-inside space-y-1 ml-4 mb-4">
                  <li>manter funcionalidades do site</li>
                  <li>analisar tráfego</li>
                  <li>personalizar conteúdos</li>
                  <li>exibir anúncios</li>
                </ul>
                <p className="mb-2">Utilizamos ou poderemos utilizar serviços como:</p>
                <ul className="list-disc list-inside space-y-1 ml-4 mb-4">
                  <li>Google AdSense</li>
                  <li>Google Ads</li>
                  <li>Google Analytics</li>
                </ul>
                <p>Fornecedores terceiros, incluindo o Google, podem utilizar cookies para exibir anúncios com base nas visitas anteriores dos usuários ao nosso site ou a outros sites.</p>
                <p className="mt-4"> Os usuários podem desativar anúncios personalizados acessando as configurações de anúncios do Google.</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
                <Users className="h-6 w-6 text-amber-500" />
                7. Compartilhamento de dados
              </h2>
              <div className="text-slate-600 leading-relaxed">
                <p className="mb-2">Não vendemos dados pessoais.</p>
                <p>As informações poderão ser compartilhadas apenas quando necessário com:</p>
                <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                  <li>professores parceiros</li>
                  <li>ferramentas de análise</li>
                  <li>plataformas de pagamento</li>
                  <li>prestadores de serviços tecnológicos</li>
                  <li>autoridades legais, quando exigido por lei</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
                <Users className="h-6 w-6 text-amber-500" />
                8. Menores de idade
              </h2>
              <div className="text-slate-600 leading-relaxed">
                <p>Como atendemos estudantes do ensino fundamental, médio e vestibular, alguns usuários podem ser menores de idade.</p>
                <p className="mt-4">Recomendamos que responsáveis legais acompanhem o cadastro e contratação dos serviços quando aplicável.</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
                <Lock className="h-6 w-6 text-amber-500" />
                9. Segurança dos dados
              </h2>
              <div className="text-slate-600 leading-relaxed">
                <p>Adotamos medidas técnicas e organizacionais para proteger seus dados contra acessos não autorizados, perdas ou alterações indevidas.</p>
                <p className="mt-4">Apesar disso, nenhum sistema é totalmente livre de riscos.</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
                <Scale className="h-6 w-6 text-amber-500" />
                10. Direitos do titular dos dados (LGPD)
              </h2>
              <div className="text-slate-600 leading-relaxed">
                <p className="mb-2">Você pode solicitar:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>acesso aos seus dados</li>
                  <li>correção de dados incorretos</li>
                  <li>exclusão de dados</li>
                  <li>revogação de consentimento</li>
                  <li>informações sobre o tratamento dos dados</li>
                </ul>
                <p className="mt-4">Solicitações podem ser feitas por:</p>
                <p className="flex items-center gap-2 mt-2">
                  <Mail className="h-4 w-4 text-amber-500" />
                  E-mail: <strong>senraaulasonline@gmail.com</strong>
                </p>
                <p className="flex items-center gap-2 mt-2">
                  <PhoneCall className="h-4 w-4 text-amber-500" />
                  WhatsApp: <strong>(21) 99370-3508</strong>
                </p>
                <p className="flex items-center gap-2 mt-2">
                  <MessageCircle className="h-4 w-4 text-amber-500" />
                  Chat da plataforma
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
                <FileText className="h-6 w-6 text-amber-500" />
                11. Alterações desta política
              </h2>
              <div className="text-slate-600 leading-relaxed">
                <p>Esta política pode ser atualizada periodicamente para refletir mudanças legais, operacionais ou tecnológicas.</p>
                <p className="mt-4">Recomendamos revisão periódica desta página.</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
                <PhoneCall className="h-6 w-6 text-amber-500" />
                12. Contato
              </h2>
              <div className="text-slate-600 leading-relaxed">
                <p className="mb-4">Em caso de dúvidas:</p>
                <p className="font-medium text-lg">Aulas Online Senra</p>
                <p className="flex items-center gap-2 mt-3">
                  <Globe className="h-4 w-4 text-amber-500" />
                  <strong>senraaulasonline.com.br</strong>
                </p>
                <p className="flex items-center gap-2 mt-2">
                  <Mail className="h-4 w-4 text-amber-500" />
                  <strong>senraaulasonline@gmail.com</strong>
                </p>
                <p className="flex items-center gap-2 mt-2">
                  <Phone className="h-4 w-4 text-amber-500" />
                  <strong>(21) 99370-3508</strong>
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}