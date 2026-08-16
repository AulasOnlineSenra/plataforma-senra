import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Criar Conta | Plataforma Senra",
  description: "Cadastre-se na Plataforma Senra e tenha acesso a aulas online exclusivas, cronogramas personalizados e correções detalhadas de redação para a sua aprovação.",
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
