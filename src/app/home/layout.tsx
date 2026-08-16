import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Aulas Online Senra | Estude com os Melhores",
  description: "A Plataforma Senra oferece aulas online, mentoria focada e material didático completo para aprovar você nos vestibulares mais concorridos do país.",
};

export default function HomeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
