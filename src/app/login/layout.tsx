import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Entrar | Plataforma Senra",
  description: "Faça login na Plataforma Senra para acessar suas aulas online, cronograma de estudos e acompanhar seu desempenho.",
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
