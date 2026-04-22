import { useAuth } from '@/hooks/useAuth';
import { useNotificationPreferences } from '@/hooks/useNotificationPreferences';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Bell, Mail, CalendarClock, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export function NotificationPreferences() {
  const { profile } = useAuth();
  const { preferences, loading, error, updatePreferences } = useNotificationPreferences(profile?.id);

  const handleToggle = async (key: 'email_enabled' | 'expiry_alerts_enabled' | 'digest_enabled', value: boolean) => {
    try {
      await updatePreferences({ [key]: value });
      toast.success('Preferencias actualizadas');
    } catch (err) {
      toast.error('Error al actualizar preferencias');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell size={20} />
            Notificaciones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !preferences) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell size={20} />
            Notificaciones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle size={16} />
            <p className="text-sm">{error || 'No se pudieron cargar las preferencias'}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell size={20} />
          Notificaciones
        </CardTitle>
        <CardDescription>
          Configura cómo y cuándo deseas recibir alertas
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Global toggle */}
        <div className="flex items-start gap-4 p-4 rounded-lg border">
          <Checkbox
            id="email_enabled"
            checked={preferences.email_enabled}
            onCheckedChange={(checked) => handleToggle('email_enabled', checked as boolean)}
            className="mt-1"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Mail size={16} className="text-muted-foreground" />
              <Label htmlFor="email_enabled" className="font-semibold cursor-pointer">
                Recibir notificaciones por email
              </Label>
            </div>
            <p className="text-sm text-muted-foreground">
              Habilita o deshabilita todas las notificaciones por correo electrónico
            </p>
          </div>
        </div>

        {/* Expiry alerts */}
        <div className={`flex items-start gap-4 p-4 rounded-lg border ${!preferences.email_enabled ? 'opacity-50' : ''}`}>
          <Checkbox
            id="expiry_alerts_enabled"
            checked={preferences.expiry_alerts_enabled}
            onCheckedChange={(checked) => handleToggle('expiry_alerts_enabled', checked as boolean)}
            disabled={!preferences.email_enabled}
            className="mt-1"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle size={16} className="text-muted-foreground" />
              <Label
                htmlFor="expiry_alerts_enabled"
                className={`font-semibold ${preferences.email_enabled ? 'cursor-pointer' : 'cursor-not-allowed'}`}
              >
                Alertas de permisos por vencer
              </Label>
            </div>
            <p className="text-sm text-muted-foreground mb-2">
              Recibe un email cuando un permiso está próximo a vencer (30, 15, 7 días)
            </p>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <CalendarClock size={12} />
              Las alertas se envían diariamente a las 8:00 AM
            </p>
          </div>
        </div>

        {/* Weekly digest (Phase 3 - disabled) */}
        <div className="flex items-start gap-4 p-4 rounded-lg border opacity-50">
          <Checkbox
            id="digest_enabled"
            checked={preferences.digest_enabled}
            disabled={true}
            className="mt-1"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Mail size={16} className="text-muted-foreground" />
              <Label htmlFor="digest_enabled" className="font-semibold cursor-not-allowed">
                Resumen semanal de compliance
              </Label>
              <Badge variant="secondary" className="text-xs">
                Próximamente
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Recibe un resumen cada lunes con el estado general de cumplimiento
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
