# Public Links Feature - Design Specification

**Fecha:** 2026-04-15  
**Objetivo:** Generar enlaces públicos de verificación con QR codes para locations  
**Caso de uso:** Inspector municipal, auditor de bomberos, administrador de mall puede verificar permisos de una sede sin login

---

## Resumen Ejecutivo

Permitir que usuarios autenticados (admin/operator) generen enlaces públicos con QR codes para compartir el estado documental de una sede con entidades externas. Los inspectores pueden ver permisos vigentes y descargar documentos PDF sin necesidad de crear cuenta.

### Relato Demo

```
Usuario en vista de sede → Click "Compartir" → 
Modal muestra link + QR code →
Usuario copia link o descarga QR →
Inspector escanea QR → 
Ve permisos vigentes con fechas →
Puede descargar PDFs para revisión
```

### Valor para Supermaxi

- ✅ **Transparencia proactiva**: compartir estado de permisos con administradores de mall antes de la visita
- ✅ **Eficiencia en inspecciones**: inspector ve documentos digitales en tiempo real
- ✅ **Profesionalismo**: QR codes y links branded vs carpetas físicas
- ✅ **Trazabilidad**: saber cuántas veces se accedió al link

---

## Arquitectura

### Componentes

**1. ShareButton**
- Botón "Compartir" en header de LocationDetailView
- Solo visible para admin/operator
- Abre ShareLocationModal al hacer click

**2. ShareLocationModal**
- Modal full-screen con layout de dos columnas
- Columna izquierda: configuración y preview
- Columna derecha: QR code grande
- Genera o recupera link público existente
- Acciones: copiar link, descargar QR, vista completa

**3. PublicVerificationPage (`/p/{token}`)**
- Página pública sin autenticación
- Muestra información de sede + permisos con documentos
- Incrementa analytics (view_count, last_viewed_at)
- Permite descargar documentos PDF

### Flujo de Datos

```
Usuario autenticado → LocationDetailView
  → Click "Compartir"
  → ShareLocationModal
    → Llama getLocationPublicLink(locationId)
    → Si existe: reutiliza
    → Si no existe: llama createPublicLink({ companyId, locationId, label })
  → Muestra link + genera QR con qrcode.react
  → Usuario copia link o descarga QR

Inspector externo → Escanea QR o abre link
  → Navega a /p/{token}
  → PublicVerificationPage
    → Llama getPublicLinkData(token)
    → Incrementa view_count y last_viewed_at
    → Muestra permisos con links a Storage
```

### Persistencia

**Tabla `public_links` (ya existe):**
```typescript
{
  id: UUID
  company_id: UUID
  location_id: UUID
  token: string (UUID v4)
  label: string
  is_active: boolean
  view_count: number
  last_viewed_at: timestamp
  created_by: UUID
  created_at: timestamp
  updated_at: timestamp
}
```

**Lógica de tokens:**
- Un link público por sede (clave única: location_id)
- Token se genera con `crypto.randomUUID()` la primera vez
- Se reutiliza en llamadas posteriores
- URL format: `https://enregla.ec/p/{token}`

---

## Componente: ShareButton

**Ubicación:** Header de LocationDetailView, lado derecho junto a "Subir Documentos"

**Props:**
```typescript
interface ShareButtonProps {
  locationId: string;
  locationName: string;
}
```

**Comportamiento:**
- Botón con icono 🔗 + texto "Compartir"
- Solo visible para roles: admin, operator
- Click → abre ShareLocationModal

---

## Componente: ShareLocationModal

**Props:**
```typescript
interface ShareLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  locationId: string;
  locationName: string;
  companyId: string;
}
```

### Layout

```
┌──────────────────────────────────────────────────────────┐
│  ← Volver a Sedes    Compartir Estado Documental         │
│  Genera enlaces públicos y códigos QR para compartir     │
│  el estado de tus sedes                                   │
├──────────────────────────────────────────────────────────┤
│                                                            │
│  Configuración                                            │
│  ┌────────────────────────────────┐                      │
│  │ Sede a Compartir               │                      │
│  │ [Dropdown: Mall del Sol]    ▼  │                      │
│  └────────────────────────────────┘                      │
│                                                            │
│  Enlace Público                   📋 Copiar              │
│  ┌──────────────────────────────────────────────────┐   │
│  │ https://enregla.ec/p/abc-123-def                 │   │
│  └──────────────────────────────────────────────────┘   │
│                                                            │
│  ┌──────────────────┬──────────────────────────────────┐│
│  │                  │                                   ││
│  │  📄             │        ┌─────────────┐           ││
│  │  Vista Previa   │        │             │           ││
│  │  Compacta       │        │   QR CODE   │           ││
│  │                  │        │   256x256   │           ││
│  │  Mall del Sol   │        │             │           ││
│  │  📍 Dirección   │        └─────────────┘           ││
│  │  ✅ 12 vigentes │                                   ││
│  │  ⚠️  2 por vencer│                                   ││
│  │                  │                                   ││
│  └──────────────────┴──────────────────────────────────┘│
│                                                            │
│  Nota de Privacidad                                       │
│  Los permisos mostrados, vigencias, y documentos adjuntos│
│  son visibles por quien acceda a este enlace.            │
│                                                            │
│  [🔲 Generar Código QR]              [Vista Completa →] │
│                                                            │
└──────────────────────────────────────────────────────────┘
```

### Secciones

**1. Header**
- Título: "Compartir Estado Documental"
- Subtítulo descriptivo
- Botón "Volver a Sedes" (vuelve a LocationDetailView)

**2. Configuración**
- Dropdown "Sede a Compartir" pre-seleccionada con locationName
- Disabled (no editable en V1 - solo muestra la sede actual)
- Futuro V2: permitir cambiar sede sin cerrar modal

**3. Enlace Público**
- Input read-only con URL completa
- Botón "Copiar" con icono 📋
- Al copiar: muestra toast "Link copiado al portapapeles"

**4. Preview + QR Code (grid 2 columnas)**

**Columna izquierda - Preview:**
- Título "Vista Previa Compacta"
- Muestra:
  - Nombre de sede
  - Dirección (icono 📍)
  - Métricas resumidas:
    - ✅ X vigentes
    - ⚠️ X por vencer
    - ❌ X vencidos
- Si no hay permisos: "Sin documentos públicos"

**Columna derecha - QR Code:**
- QR code SVG 256x256px
- Usa librería `qrcode.react`
- Codifica la URL completa: `https://enregla.ec/p/{token}`
- Fondo blanco, foreground negro
- Sin logo embedded (V1 simple)

**5. Nota de Privacidad**
- Texto claro sobre qué información se comparte
- Estilo: fondo gris claro, texto pequeño

**6. Acciones**
- **[🔲 Generar Código QR]**: Descarga PNG del QR (512x512px para impresión)
- **[Vista Completa →]**: Abre `/p/{token}` en nueva pestaña

### Estado y Lógica

```typescript
const [link, setLink] = useState<PublicLink | null>(null);
const [loading, setLoading] = useState(false);
const [copied, setCopied] = useState(false);

useEffect(() => {
  // Al abrir modal, generar o recuperar link
  async function initializeLink() {
    setLoading(true);
    try {
      // Intentar recuperar existente
      let existingLink = await getLocationPublicLink(locationId);
      
      if (!existingLink) {
        // Crear nuevo
        existingLink = await createPublicLink({
          companyId,
          locationId,
          label: `Inspector ${locationName} ${new Date().getFullYear()}`,
        });
      }
      
      setLink(existingLink);
    } catch (error) {
      console.error('Error initializing link:', error);
      // Mostrar error toast
    } finally {
      setLoading(false);
    }
  }
  
  if (isOpen) {
    initializeLink();
  }
}, [isOpen, locationId]);

const handleCopy = async () => {
  if (!link) return;
  
  const url = getPublicUrl(link.token);
  await navigator.clipboard.writeText(url);
  setCopied(true);
  
  // Reset después de 2 segundos
  setTimeout(() => setCopied(false), 2000);
  
  // Toast notification
  toast.success('Link copiado al portapapeles');
};

const handleDownloadQR = () => {
  // Genera PNG del QR y descarga
  const canvas = document.getElementById('qr-canvas') as HTMLCanvasElement;
  const url = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.download = `qr-${locationName.toLowerCase().replace(/\s/g, '-')}.png`;
  link.href = url;
  link.click();
};

const handleViewComplete = () => {
  if (!link) return;
  const url = getPublicUrl(link.token);
  window.open(url, '_blank');
};
```

---

## Página: PublicVerificationPage (`/p/{token}`)

**Ruta:** `/p/{token}`  
**Autenticación:** No requerida (pública)  
**Layout:** Branded simple, responsive mobile-first

### Props

```typescript
interface PublicVerificationPageProps {
  // token viene de useParams()
}
```

### Estructura

```
┌──────────────────────────────────────────────┐
│  🏢 EnRegla                                   │
├──────────────────────────────────────────────┤
│                                               │
│  Mall del Sol                    [Updated ⟳] │
│  📍 Av. 6 de Diciembre, Quito                │
│  SEDE-1234-Q                                  │
│                                               │
│  ──────────────────────────────               │
│                                               │
│  Permisos Vigentes (12)                      │
│                                               │
│  ┌──────────────────────────────────────┐   │
│  │ ✅ Permiso de Funcionamiento (ACESS) │   │
│  │ Emisión: 14/04/2026                  │   │
│  │ Vencimiento: 14/04/2027              │   │
│  │ 📄 Ver documento ↗                   │   │
│  └──────────────────────────────────────┘   │
│                                               │
│  ┌──────────────────────────────────────┐   │
│  │ ✅ Bomberos                          │   │
│  │ Emisión: 14/04/2026                  │   │
│  │ Vencimiento: 31/12/2026              │   │
│  │ 📄 Ver documento ↗                   │   │
│  └──────────────────────────────────────┘   │
│                                               │
│  Permisos por Vencer (2)                     │
│                                               │
│  ┌──────────────────────────────────────┐   │
│  │ ⚠️  ARCSA Supermercado               │   │
│  │ Emisión: 14/01/2026                  │   │
│  │ Vencimiento: 14/02/2026 (15 días)    │   │
│  │ 📄 Ver documento ↗                   │   │
│  └──────────────────────────────────────┘   │
│                                               │
│  Permisos Vencidos (1)                       │
│                                               │
│  ┌──────────────────────────────────────┐   │
│  │ ❌ Licencia Rayos X                  │   │
│  │ Emisión: 14/01/2022                  │   │
│  │ Vencimiento: 14/01/2026 (vencido)    │   │
│  │ 📄 Ver documento ↗                   │   │
│  └──────────────────────────────────────┘   │
│                                               │
│  Pendientes de Registro (3)                  │
│                                               │
│  ┌──────────────────────────────────────┐   │
│  │ 📋 RUC                               │   │
│  │ Estado: Pendiente de registro        │   │
│  │ (sin documento)                      │   │
│  └──────────────────────────────────────┘   │
│                                               │
│  ──────────────────────────────               │
│                                               │
│  Última actualización: 15 Abr 2026 11:23     │
│  🔒 Verificado por EnRegla                   │
│                                               │
└──────────────────────────────────────────────┘
```

### Comportamiento

**Al cargar la página:**

1. Parse token from URL params
2. Llamar a `getPublicLinkData(token)` que:
   - Valida que el link existe y está activo
   - Incrementa `view_count++`
   - Actualiza `last_viewed_at = now()`
   - Retorna: location info + permisos activos
3. Renderizar información

**Si link inválido o inactivo:**
```
┌──────────────────────────────────────┐
│  ⚠️  Link No Válido                  │
│                                      │
│  Este link público no existe         │
│  o ha sido desactivado.              │
│                                      │
│  Contacta al administrador.          │
└──────────────────────────────────────┘
```

**Agrupación de permisos:**
- **Vigentes**: `status = 'vigente'`, ordenados por vencimiento ascendente
- **Por Vencer**: `status = 'por_vencer'`, ordenados por vencimiento ascendente
- **Vencidos**: `status = 'vencido'`, ordenados por vencimiento descendente
- **Pendientes**: `status = 'no_registrado'`, ordenados por tipo alfabético

**Link a documento:**
- Solo aparece si `documents.length > 0` para ese permit
- Formato: "📄 Ver documento ↗"
- Abre en nueva pestaña
- URL: Supabase Storage public URL del PDF

**Responsive:**
- Mobile: tarjetas apiladas verticalmente
- Desktop: 2 columnas de tarjetas
- QR code no se muestra en esta página (solo en modal)

### Estilo Visual

**Paleta:**
- Fondo: blanco (#FFFFFF)
- Header: gris oscuro (#1a1a1a) con logo blanco
- Títulos: negro (#000000)
- Texto: gris oscuro (#333333)
- Badges:
  - ✅ Vigente: verde (#10b981)
  - ⚠️  Por vencer: amarillo (#f59e0b)
  - ❌ Vencido: rojo (#ef4444)
  - 📋 Pendiente: gris (#6b7280)

**Tipografía:**
- Títulos: font-semibold
- Fechas: font-mono para legibilidad
- Cuerpo: font-normal

**Espaciado:**
- Padding contenedor: 16px mobile, 32px desktop
- Gap entre tarjetas: 12px
- Border radius: 8px

---

## API Functions

### `getPublicLinkData(token: string)`

**Nueva función** en `src/lib/api/publicLinks.ts`

```typescript
interface PublicLinkData {
  location: {
    id: string;
    name: string;
    address: string;
    code: string;
  };
  permits: Array<{
    id: string;
    type: string;
    issuer: string | null;
    status: PermitStatus;
    issue_date: string | null;
    expiry_date: string | null;
    has_document: boolean;
    document_url: string | null;
  }>;
}

export async function getPublicLinkData(token: string): Promise<PublicLinkData | null> {
  // 1. Buscar public_link por token
  const { data: link, error: linkError } = await supabase
    .from('public_links')
    .select('*, locations(*)')
    .eq('token', token)
    .eq('is_active', true)
    .single();
  
  if (linkError || !link) return null;
  
  // 2. Incrementar analytics
  await supabase
    .from('public_links')
    .update({
      view_count: link.view_count + 1,
      last_viewed_at: new Date().toISOString(),
    })
    .eq('id', link.id);
  
  // 3. Obtener permisos activos de la sede
  const { data: permits, error: permitsError } = await supabase
    .from('permits')
    .select(`
      id,
      type,
      issuer,
      status,
      issue_date,
      expiry_date,
      documents(id, file_path)
    `)
    .eq('location_id', link.location_id)
    .eq('is_active', true);
  
  if (permitsError) throw permitsError;
  
  // 4. Transformar datos
  const transformedPermits = permits.map(p => ({
    id: p.id,
    type: p.type,
    issuer: p.issuer,
    status: p.status,
    issue_date: p.issue_date,
    expiry_date: p.expiry_date,
    has_document: p.documents && p.documents.length > 0,
    document_url: p.documents?.[0]
      ? supabase.storage.from('permit-documents').getPublicUrl(p.documents[0].file_path).data.publicUrl
      : null,
  }));
  
  return {
    location: {
      id: link.locations.id,
      name: link.locations.name,
      address: link.locations.address,
      code: link.locations.code,
    },
    permits: transformedPermits,
  };
}
```

---

## Storage RLS Policy

**Nueva política** para permitir acceso público a documentos via link activo:

```sql
CREATE POLICY "Public access to permit documents via active public link"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'permit-documents'
  AND EXISTS (
    SELECT 1 
    FROM public_links pl
    JOIN permits p ON p.location_id = pl.location_id
    WHERE pl.is_active = true
    AND (storage.foldername(name))[1] = 'permits'
    AND (storage.foldername(name))[2] = p.id::text
  )
);
```

**Explicación:**
- Solo archivos en bucket `permit-documents`
- Solo si existe un `public_link` activo para esa location
- Verifica que el path del archivo corresponda a un permit de esa location
- Path format: `permits/{permit_id}/{filename}`

---

## Librerías Necesarias

### QR Code Generation

```bash
npm install qrcode.react
npm install --save-dev @types/qrcode.react
```

**Uso:**
```typescript
import { QRCodeSVG } from 'qrcode.react';

<QRCodeSVG
  value={getPublicUrl(link.token)}
  size={256}
  level="H"
  includeMargin={true}
/>
```

### Para descarga de QR como PNG:

```typescript
import { QRCodeCanvas } from 'qrcode.react';

// Render hidden canvas
<QRCodeCanvas
  id="qr-canvas"
  value={getPublicUrl(link.token)}
  size={512}
  level="H"
  includeMargin={true}
  style={{ display: 'none' }}
/>
```

---

## Testing Manual

### Checklist de Testing

**Flujo completo:**
- [ ] Navegar a LocationDetailView de una sede
- [ ] Click botón "Compartir" abre modal
- [ ] Modal carga o genera link automáticamente
- [ ] Link se muestra en input read-only
- [ ] QR code se renderiza correctamente
- [ ] Click "Copiar" copia link al clipboard
- [ ] Toast "Link copiado" aparece
- [ ] Click "Generar Código QR" descarga PNG 512x512
- [ ] Click "Vista Completa" abre `/p/{token}` en nueva pestaña

**Página pública:**
- [ ] URL `/p/{token-valido}` carga correctamente
- [ ] Información de sede se muestra
- [ ] Permisos agrupados por estado
- [ ] Permisos vigentes con ✅
- [ ] Permisos por vencer con ⚠️
- [ ] Permisos vencidos con ❌
- [ ] Pendientes con 📋
- [ ] Links "Ver documento" solo en permisos con documento
- [ ] Click "Ver documento" abre PDF en nueva pestaña
- [ ] PDF se visualiza correctamente (no error 403)
- [ ] URL `/p/{token-invalido}` muestra mensaje de error
- [ ] Responsive: se ve bien en mobile y desktop

**Analytics:**
- [ ] Cada visita a `/p/{token}` incrementa view_count
- [ ] last_viewed_at se actualiza correctamente
- [ ] view_count visible en tabla public_links (para futura página admin)

**Edge cases:**
- [ ] Link con `is_active = false` muestra error
- [ ] Sede sin permisos muestra "Sin permisos registrados"
- [ ] Permiso sin documento no muestra link "Ver documento"
- [ ] Múltiples llamadas a "Compartir" reutilizan el mismo link (no crean duplicados)

---

## Consideraciones de Seguridad

### ✅ Decisiones Aprobadas

1. **Acceso totalmente público**: Cualquiera con el link puede ver y descargar
2. **Sin autenticación**: No requiere login ni PIN
3. **Sin expiración automática**: Links permanecen activos hasta desactivación manual

### 🔒 Controles de Seguridad

1. **Token UUID v4**: 128 bits de entropía, imposible de adivinar
2. **is_active flag**: Admin puede desactivar link comprometido
3. **RLS en Storage**: Documentos solo accesibles via link activo
4. **Analytics**: Trazabilidad de accesos (view_count, last_viewed_at)

### 🚨 Riesgos Conocidos

1. **Distribución no controlada**: Si alguien comparte el QR en redes sociales, cualquiera puede acceder
2. **Sin revocación selectiva**: No se puede revocar acceso a una persona específica (solo desactivar para todos)
3. **Documentos sensibles**: PDFs pueden contener información que no debería ser pública

### 🔮 Futuro V2 (Post-Demo)

- Links con expiración automática (ej: 30 días)
- Código PIN opcional por link
- Registro de quién accedió (nombre + entidad antes de ver)
- Watermark en PDFs descargados con timestamp + IP

---

## Out of Scope (V1)

### No incluido en esta versión:

❌ **Múltiples links por sede**: Una sede = un link (sin labels diferentes)  
❌ **Editar link existente**: No se puede cambiar token, solo desactivar y crear nuevo  
❌ **Página de gestión central**: No hay `/links` para ver todos los links de la empresa  
❌ **Compartir por WhatsApp directamente**: Solo botón "Copiar", usuario pega donde quiera  
❌ **Email automático**: No envía emails con el link  
❌ **Analytics avanzados**: No hay gráficas de views por día  
❌ **Link para toda la empresa**: Solo links por sede (no company-level)  
❌ **Custom branding del QR**: QR simple blanco/negro, sin logo  
❌ **Short URLs**: URLs usan UUID completo, no acortador (ej: enregla.ec/p/abc-123-def-456)  

---

## Success Metrics (Demo)

### Métricas Cualitativas

- ✅ Inspector puede ver permisos en < 5 segundos desde escanear QR
- ✅ Usuario puede generar link en < 3 clicks
- ✅ QR code se ve profesional impreso en A4
- ✅ Página pública se carga en < 2 segundos
- ✅ "Wow factor" cuando se escanea el QR en la demo

### Métricas Cuantitativas (Post-Demo)

- Número de links públicos creados
- Promedio de views por link
- Tasa de conversión: vistas → descargas de documento
- Tiempo promedio en página pública

---

## Appendix: Wireframes

### ShareLocationModal

```
┌────────────────────────────────────────────────────────────────┐
│ Header                                                          │
│ ┌────────────────────────────────────────────────────────────┐│
│ │ ← Volver  │  Compartir Estado Documental                   ││
│ │           │  Genera enlaces públicos y códigos QR...       ││
│ └────────────────────────────────────────────────────────────┘│
│                                                                 │
│ Configuration                                                   │
│ ┌─────────────────────────────────────────┐                   │
│ │ Sede a Compartir                        │                   │
│ │ [Mall del Sol ▼] (disabled)             │                   │
│ └─────────────────────────────────────────┘                   │
│                                                                 │
│ Public Link                                                     │
│ ┌─────────────────────────────────────────┬──────┐            │
│ │ https://enregla.ec/p/abc-123...         │ Copy │            │
│ └─────────────────────────────────────────┴──────┘            │
│                                                                 │
│ Preview + QR                                                    │
│ ┌──────────────────────┬────────────────────────────────────┐ │
│ │ Vista Previa         │                                     │ │
│ │ Compacta             │       ┌─────────────────┐          │ │
│ │                      │       │                 │          │ │
│ │ Mall del Sol         │       │    QR CODE      │          │ │
│ │ 📍 Dirección         │       │    256x256      │          │ │
│ │ ✅ 12 vigentes       │       │                 │          │ │
│ │ ⚠️  2 por vencer     │       └─────────────────┘          │ │
│ │                      │                                     │ │
│ └──────────────────────┴────────────────────────────────────┘ │
│                                                                 │
│ Privacy Note                                                    │
│ ┌────────────────────────────────────────────────────────────┐│
│ │ ℹ️  Los permisos mostrados, vigencias, y documentos       ││
│ │    adjuntos son visibles por quien acceda a este enlace.  ││
│ └────────────────────────────────────────────────────────────┘│
│                                                                 │
│ Actions                                                         │
│ ┌────────────────────────┐  ┌──────────────────────────────┐ │
│ │ 🔲 Generar Código QR   │  │ Vista Completa →             │ │
│ └────────────────────────┘  └──────────────────────────────┘ │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

### PublicVerificationPage

```
┌────────────────────────────────────────────┐
│ 🏢 EnRegla                                  │
├────────────────────────────────────────────┤
│ Location Header                             │
│ ┌────────────────────────────────────────┐ │
│ │ Mall del Sol           [Updated ⟳]     │ │
│ │ 📍 Av. 6 de Diciembre, Quito           │ │
│ │ SEDE-1234-Q                            │ │
│ └────────────────────────────────────────┘ │
│                                             │
│ Permisos Vigentes (12)                     │
│ ┌────────────────────────────────────────┐ │
│ │ ✅ Permiso de Funcionamiento (ACESS)   │ │
│ │ Emisión: 14/04/2026                    │ │
│ │ Vencimiento: 14/04/2027                │ │
│ │ 📄 Ver documento ↗                     │ │
│ └────────────────────────────────────────┘ │
│ ┌────────────────────────────────────────┐ │
│ │ ✅ Bomberos                            │ │
│ │ Emisión: 14/04/2026                    │ │
│ │ Vencimiento: 31/12/2026                │ │
│ │ 📄 Ver documento ↗                     │ │
│ └────────────────────────────────────────┘ │
│                                             │
│ Permisos por Vencer (2)                    │
│ ┌────────────────────────────────────────┐ │
│ │ ⚠️  ARCSA Supermercado                 │ │
│ │ Emisión: 14/01/2026                    │ │
│ │ Vencimiento: 14/02/2026 (15 días)      │ │
│ │ 📄 Ver documento ↗                     │ │
│ └────────────────────────────────────────┘ │
│                                             │
│ Pendientes de Registro (3)                 │
│ ┌────────────────────────────────────────┐ │
│ │ 📋 RUC                                 │ │
│ │ Estado: Pendiente de registro          │ │
│ │ (sin documento)                        │ │
│ └────────────────────────────────────────┘ │
│                                             │
│ Footer                                      │
│ ┌────────────────────────────────────────┐ │
│ │ Última actualización: 15 Abr 2026      │ │
│ │ 🔒 Verificado por EnRegla              │ │
│ └────────────────────────────────────────┘ │
└────────────────────────────────────────────┘
```

---

**Fin del Spec**
