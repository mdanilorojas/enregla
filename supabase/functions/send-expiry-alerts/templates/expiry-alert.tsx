import { Html, Head, Body, Container, Section, Text, Button, Hr } from 'https://esm.sh/@react-email/components@0.0.14';
import type { PermitAlert } from '../types.ts';

interface ExpiryAlertEmailProps {
  userName: string;
  companyName: string;
  alerts: PermitAlert[];
  appUrl: string;
}

export function ExpiryAlertEmail({ userName, companyName, alerts, appUrl }: ExpiryAlertEmailProps) {
  // Determine urgency level (all alerts should be same type)
  const notificationType = alerts[0]?.notification_type || 'expiry_30d';

  const urgencyConfig = {
    expiry_30d: {
      emoji: '📅',
      message: 'Los siguientes permisos vencen en 1 mes',
      color: '#3B82F6', // blue
      bgColor: '#EFF6FF',
    },
    expiry_15d: {
      emoji: '⚠️',
      message: 'Los siguientes permisos vencen en 2 semanas',
      color: '#F59E0B', // orange
      bgColor: '#FEF3C7',
    },
    expiry_7d: {
      emoji: '🚨',
      message: 'URGENTE: Los siguientes permisos vencen en 7 días',
      color: '#EF4444', // red
      bgColor: '#FEE2E2',
    },
  };

  const config = urgencyConfig[notificationType];
  const daysMap = { expiry_30d: 30, expiry_15d: 15, expiry_7d: 7 };
  const daysUntil = daysMap[notificationType];

  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Text style={logo}>EnRegla</Text>
          </Section>

          {/* Greeting */}
          <Section style={content}>
            <Text style={greeting}>Hola {userName},</Text>

            {/* Alert message */}
            <Section style={{
              ...alertBox,
              backgroundColor: config.bgColor,
              borderLeft: `4px solid ${config.color}`,
            }}>
              <Text style={alertMessage}>
                {config.emoji} {config.message}
              </Text>
            </Section>

            {/* Permits table */}
            <Section style={table}>
              {alerts.map((alert, index) => (
                <Section key={alert.permit_id} style={index === 0 ? tableRowFirst : tableRow}>
                  <Text style={permitType}>{alert.type}</Text>
                  <Text style={permitDetails}>
                    <strong>Sede:</strong> {alert.location_name}
                  </Text>
                  <Text style={permitDetails}>
                    <strong>Vence:</strong> {new Date(alert.expiry_date).toLocaleDateString('es-CL')} ({daysUntil} días)
                  </Text>
                </Section>
              ))}
            </Section>

            {/* CTA Button */}
            <Section style={buttonContainer}>
              <Button style={button} href={`${appUrl}/dashboard`}>
                Ver en EnRegla
              </Button>
            </Section>
          </Section>

          {/* Footer */}
          <Hr style={hr} />
          <Section style={footer}>
            <Text style={footerText}>
              Si no deseas recibir estas notificaciones, puedes{' '}
              <a href={`${appUrl}/settings/notifications`} style={link}>
                desactivarlas en tu perfil
              </a>
              .
            </Text>
            <Text style={footerText}>
              EnRegla • {appUrl}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Styles
const main = {
  backgroundColor: '#f6f6f6',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
};

const header = {
  padding: '32px 20px',
  borderBottom: '1px solid #e5e7eb',
};

const logo = {
  fontSize: '24px',
  fontWeight: 'bold',
  color: '#1E3A8A',
  margin: '0',
};

const content = {
  padding: '20px',
};

const greeting = {
  fontSize: '16px',
  lineHeight: '24px',
  marginBottom: '16px',
  color: '#374151',
};

const alertBox = {
  padding: '16px',
  borderRadius: '8px',
  marginBottom: '24px',
};

const alertMessage = {
  fontSize: '16px',
  fontWeight: '600',
  margin: '0',
  color: '#1F2937',
};

const table = {
  borderRadius: '8px',
  border: '1px solid #e5e7eb',
  overflow: 'hidden',
  marginBottom: '24px',
};

const tableRowFirst = {
  padding: '16px',
  borderBottom: '1px solid #e5e7eb',
};

const tableRow = {
  padding: '16px',
  borderTop: '1px solid #e5e7eb',
};

const permitType = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#111827',
  marginBottom: '8px',
};

const permitDetails = {
  fontSize: '14px',
  color: '#6B7280',
  margin: '4px 0',
};

const buttonContainer = {
  textAlign: 'center' as const,
  marginTop: '24px',
};

const button = {
  backgroundColor: '#1E3A8A',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 32px',
};

const hr = {
  borderColor: '#e5e7eb',
  margin: '24px 0',
};

const footer = {
  padding: '0 20px',
};

const footerText = {
  fontSize: '12px',
  color: '#6B7280',
  lineHeight: '20px',
  marginBottom: '8px',
};

const link = {
  color: '#1E3A8A',
  textDecoration: 'underline',
};
