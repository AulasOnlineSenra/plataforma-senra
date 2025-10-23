import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlaceHolderImages } from '@/lib/placeholder-images';

function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15.545 6.545a.75.75 0 0 0-1.06 0l-3 3a.75.75 0 1 0 1.06 1.06l3-3a.75.75 0 0 0 0-1.06z" />
      <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z" clipRule="evenodd" />
      <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12s4.477 10 10 10 10-4.477 10-10z" />
      <path
        d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"
        strokeWidth="1.5"
      />
      <path
        d="M12 4.5a7.5 7.5 0 1 1 0 15 7.5 7.5 0 0 1 0-15z"
        fill="#4285F4"
      />
      <path
        d="M12 4.5a7.5 7.5 0 1 1 0 15 7.5 7.5 0 0 1 0-15z"
        fillOpacity="0.8"
      />
      <path
        d="M12 4.5c-4.142 0-7.5 3.358-7.5 7.5s3.358 7.5 7.5 7.5 7.5-3.358 7.5-7.5S16.142 4.5 12 4.5z"
        fill="#fff"
      />
      <path
        d="M12 11.5v-7a7.5 7.5 0 0 0-7.5 7.5h7.5z"
        fill="#34A853"
      />
      <path
        d="M12 11.5v7.5a7.5 7.5 0 0 0 7.5-7.5h-7.5z"
        fill="#FBBC05"
      />
      <path
        d="M4.5 12a7.5 7.5 0 0 1 7.5-7.5v7.5H4.5z"
        fill="#EA4335"
      />
      <path
        d="M12 11.5L19.5 12a7.5 7.5 0 0 1-7.5 7.5v-7.5z"
        fill="#1A73E8"
      />
    </svg>
  );
}

export default function LoginPage() {
  const logo = PlaceHolderImages.find((img) => img.id === 'logo');

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background p-4">
      <Card className="mx-auto w-full max-w-sm shadow-2xl">
        <CardHeader className="text-center">
          {logo && (
            <Image
              src={logo.imageUrl}
              alt={logo.description}
              width={120}
              height={40}
              className="mx-auto mb-4"
              data-ai-hint={logo.imageHint}
            />
          )}
          <CardTitle className="text-2xl font-headline">Bem-vindo(a)!</CardTitle>
          <CardDescription>
            Acesse sua conta para continuar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                required
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password">Senha</Label>
                <Link
                  href="#"
                  className="ml-auto inline-block text-sm underline"
                >
                  Esqueceu sua senha?
                </Link>
              </div>
              <Input id="password" type="password" required />
            </div>
            <Button type="submit" className="w-full" asChild>
              <Link href="/dashboard">Entrar</Link>
            </Button>
            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  Ou continue com
                </span>
              </div>
            </div>
            <Button variant="outline" className="w-full" asChild>
                <Link href="/dashboard">
                    <GoogleIcon className="mr-2 h-4 w-4" />
                    Google
                </Link>
            </Button>
          </div>
          <div className="mt-4 text-center text-sm">
            Não tem uma conta?{' '}
            <Link href="#" className="underline">
              Inscreva-se
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
