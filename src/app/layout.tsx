import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Aulas Online Senra',
  description: 'Plataforma de aulas online.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}