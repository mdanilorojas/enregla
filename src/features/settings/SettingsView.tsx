import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ProfileTab } from './ProfileTab'
import { CompanyTab } from './CompanyTab'
import { NotificationPreferences } from './NotificationPreferences'
import { SecurityTab } from './SecurityTab'
import { MembersTab } from './MembersTab'
import { PrivacyTab } from './PrivacyTab'

export function SettingsView() {
  return (
    <div className="min-h-screen bg-[var(--ds-neutral-50)] p-[var(--ds-space-200)] sm:p-[var(--ds-space-300)] lg:p-[var(--ds-space-400)]">
      <div className="max-w-4xl mx-auto space-y-[var(--ds-space-300)]">
        <h1 className="text-[var(--ds-font-size-400)] sm:text-[var(--ds-font-size-500)] font-bold">Configuración</h1>

        <Tabs defaultValue="profile">
          <TabsList>
            <TabsTrigger value="profile">Perfil</TabsTrigger>
            <TabsTrigger value="company">Empresa</TabsTrigger>
            <TabsTrigger value="members">Miembros</TabsTrigger>
            <TabsTrigger value="notifications">Notificaciones</TabsTrigger>
            <TabsTrigger value="security">Seguridad</TabsTrigger>
            <TabsTrigger value="privacy">Privacidad</TabsTrigger>
          </TabsList>
          <TabsContent value="profile"><ProfileTab /></TabsContent>
          <TabsContent value="company"><CompanyTab /></TabsContent>
          <TabsContent value="members"><MembersTab /></TabsContent>
          <TabsContent value="notifications"><NotificationPreferences /></TabsContent>
          <TabsContent value="security"><SecurityTab /></TabsContent>
          <TabsContent value="privacy"><PrivacyTab /></TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
