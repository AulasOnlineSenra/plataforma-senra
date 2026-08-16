import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog Oficial | Plataforma Senra",
  description: "Acompanhe artigos exclusivos, dicas de estudos, metodologias de ensino e muito mais no Blog da Plataforma Senra.",
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
