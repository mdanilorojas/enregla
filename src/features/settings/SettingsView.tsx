import { NotificationPreferences } from './NotificationPreferences';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export function SettingsView() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Configuración</h1>
        <p className="text-muted-foreground">
          Gestiona tus preferencias y configuración de la cuenta
        </p>
      </div>

      {/* Notifications section */}
      <NotificationPreferences />

      {/* Placeholder for future settings */}
      <Card className="opacity-50">
        <CardHeader>
          <CardTitle>Perfil</CardTitle>
          <CardDescription>
            Configuración de perfil y cuenta (próximamente)
          </CardDescription>
        </CardHeader>
      </Card>

      <Card className="opacity-50">
        <CardHeader>
          <CardTitle>Seguridad</CardTitle>
          <CardDescription>
            Contraseña y autenticación (próximamente)
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
