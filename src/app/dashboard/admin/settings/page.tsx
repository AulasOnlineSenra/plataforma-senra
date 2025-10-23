import { AppLogoUploader } from '@/components/app-logo-uploader';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function AdminSettingsPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 md:gap-8">
      <div className="flex items-center">
        <h1 className="font-headline text-2xl md:text-3xl font-bold">
          Configurações do Administrador
        </h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Logo do Aplicativo</CardTitle>
          <CardDescription>
            Faça o upload de uma nova imagem para ser o logo do aplicativo.
            Formatos aceitos: PNG, JPG, SVG.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AppLogoUploader />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Credenciais de API</CardTitle>
          <CardDescription>
            Gerencie as credenciais para integrações de terceiros como Google
            e PayPal.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            A funcionalidade de gerenciamento de credenciais ainda não foi
            implementada.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
