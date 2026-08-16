import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Aulas Online Senra | Reforço escolar ao Vestibular",
  description: "Aulas particulares online personalizadas com professores especialistas. Plataforma completa com chat, simulados, cronograma personalizado e acompanhamento humano. Clique agora e conheça!",
};

export default function HomeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
